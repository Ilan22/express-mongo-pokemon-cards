// routes/apiRoutes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const router = express.Router();

// Models
const PokemonModel = require("../models/pokemon");
const UserModel = require("../models/user");

// Middlewares
const authenticateToken = require("../middlewares/authenticateToken");

// Inscription
router.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new UserModel({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 1
    });

    await user.save();

    res.status(201).json({ message: "Utilisateur créé avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Connexion
router.post("/api/login", async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email.toLowerCase();

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Email ou mot de passe incorrect" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res
        .status(400)
        .json({ message: "Email ou mot de passe incorrect" });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Définir le cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 heures
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/api/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/authentication");
});

// Rcupérer toutes les cartes
router.get("/api/pokemons", async (req, res) => {
  try {
    const pokemons = await PokemonModel.find();
    res.json(pokemons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Récupérer une carte par ID
router.get("/api/pokemons/:id", async (req, res) => {
  try {
    // Vérifier si l'ID est un ID MongoDB valide
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Carte non trouvée" });
    }

    const card = await PokemonModel.findById(req.params.id);
    if (card) {
      res.json(card);
    } else {
      res.status(404).json({ message: "Carte non trouvée" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// créer une nouvelle carte
router.post("/api/pokemons", async (req, res) => {
  try {
    const { name, hp, type, attack, rarity, image } = req.body;

    // Si l'image n'est pas fournie, utiliser l'image par défaut
    const pokemonImage = image || "/assets/pokeball.png"; // Image par défaut si aucune image n'est fournie

    // Validation des données
    if (!name || !hp || !type || !attack || !rarity) {
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    const newCard = new PokemonModel({
      name,
      hp,
      image: pokemonImage, // Utilisation de l'image fournie ou par défaut
      type,
      attack: {
        name: attack.name,
        description: attack.description,
        power: attack.power,
      },
      rarity: {
        level: rarity.level,
        label: rarity.label,
      },
    });

    const savedCard = await newCard.save();
    res.status(201).json(savedCard); // Retourne la carte sauvegardée
  } catch (error) {
    res.status(400).json({ message: error.message }); // Erreur dans la création de la carte
  }
});

// modification cartes existantes
router.put("/api/pokemons/:id", async (req, res) => {
  try {
    const { name, hp, image, type, attack, rarity } = req.body;

    // Validation des champs
    if (!name || !hp || !type || !attack || !rarity) {
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    const updatedCard = await PokemonModel.findByIdAndUpdate(
      req.params.id,
      {
        name,
        hp,
        image: image || "/assets/pokeball.png", // Valeur par défaut
        type,
        attack: {
          name: attack.name,
          description: attack.description,
          power: attack.power,
        },
        rarity: {
          level: rarity.level,
          label: rarity.label,
        },
      },
      {
        new: true, // Retourne la carte mise à jour
        runValidators: true, // routerlique les validations du schéma
      }
    );

    if (!updatedCard) {
      return res.status(404).json({ message: "Carte non trouvée." });
    }

    res.json({ success: true, updatedCard });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route pour supprimer une carte
router.delete("/api/pokemons/:id", async (req, res) => {
  try {
    const card = await PokemonModel.findByIdAndDelete(req.params.id);
    if (card) {
      res.json({ message: "Carte supprimée avec succès" });
    } else {
      res.status(404).json({ message: "Carte non trouvée" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Ouvrir un booster
router.get("/api/booster", authenticateToken, async (req, res) => {
  try {
    const cardCount = await PokemonModel.countDocuments();

    if (cardCount < 5) {
      return res.status(400).json({
        message:
          "Pas assez de cartes dans la base de données pour ouvrir un booster",
      });
    }

    const user = await UserModel.findById(req.user.id);
    const userPokemonIds = user.pokemons.map((pokemon) =>
      pokemon._id.toString()
    );
    const randomPokemons = await PokemonModel.aggregate([
      { $sample: { size: 5 } },
    ]);

    // Marquer les nouvelles cartes
    const pokemonsWithNewStatus = randomPokemons.map((pokemon) => ({
      ...pokemon,
      isNew: !userPokemonIds.includes(pokemon._id.toString()),
    }));

    // Filtrer les cartes pour la mise à jour de la collection
    const newPokemons = pokemonsWithNewStatus.filter(
      (pokemon) => pokemon.isNew
    );

    // Mettre à jour l'utilisateur connecté avec les nouvelles cartes
    user.pokemons.push(...newPokemons.map((pokemon) => pokemon._id));
    await user.save();

    res.json({ randomPokemons: pokemonsWithNewStatus });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
