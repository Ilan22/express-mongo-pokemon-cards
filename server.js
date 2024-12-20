const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

mongoose
  .connect("mongodb://127.0.0.1:27017/tgcp")
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

const card = new mongoose.Schema({
  name: { type: String, required: true },
  pv: { type: Number, required: true },
  type: { type: String, required: true },
  faiblesse: { type: String, required: true },
  attack_name: { type: String, required: true },
  attack_damage: { type: Number, required: true },
  attack_cost: { type: Number, required: true },
  retreat_cost: { type: Number, required: true },
  rarity: { type: Number, required: true },
});

const CardModel = mongoose.model("card", card);

const user = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: Number, required: true },
  cards: [{ type: mongoose.Schema.Types.ObjectId, ref: "card" }],
});

const UserModel = mongoose.model("user", user);

const JWT_SECRET = "clé_secrète_de_diiiiiiingue";

const cookieParser = require("cookie-parser");

app.use(cookieParser());

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect("/login");
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      res.clearCookie("token");
      return res.redirect("/login");
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
  res.redirect("/login");
});

// Récupérer toutes les cartes
app.get("/api/cards", async (req, res) => {
  try {
    const cards = await CardModel.find();
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Récupérer une carte par ID
app.get("/api/cards/:id", async (req, res) => {
  try {
    const card = await CardModel.findById(req.params.id);
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
app.post("/api/cards", async (req, res) => {
  const newCard = new CardModel(req.body);
  try {
    const savedCard = await newCard.save();
    res.status(201).json(savedCard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Modifier une carte existante
// Modifier une carte existante
app.put("/api/cards/:id", async (req, res) => {
  try {
    const updatedCard = await CardModel.findByIdAndUpdate(
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

// Supprimer une carte
// Route pour supprimer une carte
app.delete("/api/cards/:id", async (req, res) => {
  try {
    const card = await CardModel.findByIdAndDelete(req.params.id);
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
    const cardCount = await CardModel.countDocuments();

    if (cardCount < 5) {
      return res.status(400).json({
        message:
          "Pas assez de cartes dans la base de données pour ouvrir un booster",
      });
    }

    const user = await UserModel.findById(req.user.id);
    const userCardIds = user.cards.map((card) => card._id.toString());
    const randomCards = await CardModel.aggregate([{ $sample: { size: 5 } }]);

    // Filtrer les cartes déjà possédées
    const newCards = randomCards.filter(
      (card) => !userCardIds.includes(card._id.toString())
    );

    // Mettre à jour l'utilisateur connecté avec les nouvelles cartes
    user.cards.push(...newCards.map((card) => card._id));
    await user.save();

    res.json({
      cards: randomCards,
    });
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
    const user = await UserModel.findById(req.user.id).populate("cards");
    res.render("index", {
      pokemon: user.cards,
      user: { name: req.user.name, role: req.user.role },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/admin", async (req, res) => {
  try {
    const cards = await CardModel.find();
    res.render("admin", { cards });
  } catch (error) {
    res.status(500).send("Erreur serveur");
  }
});

// Route pour afficher le formulaire de modification d'une carte
app.get("/admin/edit/:id", async (req, res) => {
  try {
    const card = await CardModel.findById(req.params.id);
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
