const express = require("express");
const mongoose = require("mongoose");

mongoose
  .connect("mongodb://127.0.0.1:27017/tgcp")
  .then(() => console.log("MongoDB connecté"))
  .catch((err) => console.error("Erreur de connexion à MongoDB:", err));

const app = express();
app.use(express.json());

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

const Card = mongoose.model("card", card);

// Récupérer toutes les cartes
app.get("/api/cards", async (req, res) => {
  try {
    const cards = await Card.find();
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Récupérer une carte par ID
app.get("/api/cards/:id", async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
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
  const newCard = new Card(req.body);
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
    const updatedCard = await Card.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
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
app.delete("/api/cards/:id", async (req, res) => {
  try {
    const card = await Card.findByIdAndDelete(req.params.id);
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
    const cardCount = await Card.countDocuments();

    if (cardCount < 5) {
      return res.status(400).json({
        message:
          "Pas assez de cartes dans la base de données pour ouvrir un booster",
      });
    }

    const randomCards = await Card.aggregate([{ $sample: { size: 5 } }]);

    res.json({
      cards: randomCards,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
