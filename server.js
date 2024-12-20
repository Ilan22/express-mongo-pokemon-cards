const express = require("express");
const mongoose = require("mongoose");

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
});

const UserModel = mongoose.model("card", card);

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
      res.json(updatedCard);
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
app.get("/api/booster", async (req, res) => {
  try {
    const cardCount = await CardModel.countDocuments();

    if (cardCount < 5) {
      return res.status(400).json({
        message:
          "Pas assez de cartes dans la base de données pour ouvrir un booster",
      });
    }

    const randomCards = await CardModel.aggregate([{ $sample: { size: 5 } }]);

    res.json({
      cards: randomCards,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// views
app.get("/", (req, res) => {
  const pokemon = [
    { name: "Pikachu", type: "Electric", image: "/images/pikachu.png" },
    { name: "Charmander", type: "Fire", image: "/images/charmander.png" },
    { name: "Bulbasaur", type: "Grass", image: "/images/bulbasaur.png" },
  ];
  res.render("index", { pokemon }); // Rendu de la vue 'index.ejs'
});

app.get("/admin", async (req, res) => {
  try {
    const cards = await CardModel.find();
    res.render("admin", { cards });
  } catch (error) {
    res.status(500).send("Erreur serveur");
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
