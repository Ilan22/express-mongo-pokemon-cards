require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Models
const PokemonModel = require("./models/pokemon");
const UserModel = require("./models/user");

// Middlewares
const authenticateToken = require("./middlewares/authenticateToken");
const admin = require("./middlewares/admin");

// Importation des types de Pokémon et des rarités
const { types_pokemons, rarities } = require("./data/pokemon-data");

mongoose
  .connect("mongodb://127.0.0.1:27017/tcgp")
  .then(() => console.log("MongoDB connecté"))
  .catch((err) => console.error("Erreur de connexion à MongoDB:", err));

const app = express();
app.use(express.json());
// Configurer le moteur de template EJS
app.set("view engine", "ejs");

// Dossier public pour les fichiers statiques
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));

const methodOverride = require("method-override");

app.use(methodOverride("_method"));

const cookieParser = require("cookie-parser");

app.use(cookieParser());

// Inscription
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new UserModel({
      name,
      email,
      password: hashedPassword,
      role: 0,
    });

    await user.save();

    res.status(201).json({ message: "Utilisateur créé avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Connexion
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

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

app.get("/api/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/authentication");
});

// Rcupérer toutes les cartes
app.get("/api/pokemons", async (req, res) => {
  try {
    const pokemons = await PokemonModel.find();
    res.json(pokemons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Récupérer une carte par ID
app.get("/api/pokemons/:id", async (req, res) => {
  try {
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
app.post("/api/pokemons", async (req, res) => {
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
app.put("/api/pokemons/:id", async (req, res) => {
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
        runValidators: true, // Applique les validations du schéma
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
app.delete("/api/pokemons/:id", async (req, res) => {
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
app.get("/api/booster", authenticateToken, async (req, res) => {
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

app.get("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// views

app.get("/", authenticateToken, async (req, res) => {
  try {
    // Récupérer l'utilisateur avec ses cartes
    const userWithpokemons = await UserModel.findById(req.user.id).populate(
      "pokemons"
    );
    // Récupérer tous les pokémons
    const allPokemons = await PokemonModel.find();

    // Créer un tableau avec tous les pokémons, en marquant ceux possédés
    const pokemons = allPokemons.map((pokemon) => {
      const isOwned = userWithpokemons.pokemons.some(
        (card) => card._id.toString() === pokemon._id.toString()
      );
      return {
        ...pokemon.toObject(),
        isOwned,
      };
    });

    res.render("index", {
      pokemons: pokemons,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/authentication", (req, res) => {
  const randomNumber = Math.floor(Math.random() * 8) + 1; // Nombre entre 1 et 8
  res.render("authentication", { randomNumber });
});

app.get("/admin", authenticateToken, admin, async (req, res) => {
  try {
    const pokemons = await PokemonModel.find();
    res.render("admin", { pokemons, user: req.user });
  } catch (error) {
    res.status(500).send("Erreur serveur");
  }
});

app.get("/createCard", authenticateToken, (req, res) => {
  res.render("createCard", { user: req.user, typesPokemons: types_pokemons });
});

// Route pour afficher le formulaire de modification d'une carte
app.get("/admin/edit/:id", authenticateToken, async (req, res) => {
  try {
    const card = await PokemonModel.findById(req.params.id);
    if (card) {
      res.render("editCard", {
        card,
        user: req.user,
        typesPokemons: types_pokemons,
        rarities,
      });
    } else {
      res.status(404).send("Carte non trouvée");
    }
  } catch (error) {
    res.status(500).send("Erreur serveur");
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
