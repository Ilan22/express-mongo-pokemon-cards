const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

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

const pokemon = new mongoose.Schema({
  name: { type: String, required: true },
  hp: { type: Number, required: true },
  image: { type: String, required: true },
  type: { type: String, required: true },
  attack: {
    name: { type: String, required: true },
    description: { type: String, required: true },
    power: { type: Number, required: true },
  },
  rarity: {
    level: { type: Number, required: true },
    label: { type: String, required: true },
  },
});

const PokemonModel = mongoose.model("pokemon", pokemon);

const user = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: Number, required: true },
  pokemons: [{ type: mongoose.Schema.Types.ObjectId, ref: "pokemon" }],
});

const UserModel = mongoose.model("user", user);

const JWT_SECRET = "clé_secrète_de_diiiiiiingue";

const cookieParser = require("cookie-parser");

app.use(cookieParser());

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect("/authentication");
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      res.clearCookie("token");
      return res.redirect("/authentication");
    }
    req.user = user;
    next();
  });
};

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
      JWT_SECRET,
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

// Créer une nouvelle carte
app.post("/api/pokemons", async (req, res) => {
  const newCard = new PokemonModel(req.body);
  try {
    const savedCard = await newCard.save();
    res.status(201).json(savedCard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Modifier une carte existante
app.put("/api/pokemons/:id", async (req, res) => {
  try {
    const updatedCard = await PokemonModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (updatedCard) {
      res.redirect("/admin"); // Redirige vers la page d'admin après la modification
    } else {
      res.status(404).json({ message: "Carte non trouvée" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
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
  res.render("authentication");
});

app.get("/admin", authenticateToken, async (req, res) => {
  try {
    const pokemons = await PokemonModel.find();
    console.log(pokemons[0]);
    res.render("admin", { pokemons, user: req.user });
  } catch (error) {
    res.status(500).send("Erreur serveur");
  }
});

app.get("/createCard", authenticateToken, (req, res) => {
  res.render("createCard", { user: req.user });
});

// Route pour afficher le formulaire de modification d'une carte
app.get("/admin/edit/:id", async (req, res) => {
  try {
    const card = await PokemonModel.findById(req.params.id);
    if (card) {
      res.render("editCard", { card });
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
