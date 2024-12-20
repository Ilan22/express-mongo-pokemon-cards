const mongoose = require("mongoose");

// Connexion à MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/tgcp")
  .then(() => console.log("MongoDB connecté pour l'initialisation"))
  .catch((err) => console.error("Erreur de connexion à MongoDB:", err));

// Définition du schéma
const cardSchema = new mongoose.Schema({
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

const Card = mongoose.model("card", cardSchema);

// Données des cartes par défaut
const defaultCards = [
  {
    name: "Pikachu",
    pv: 60,
    type: "Électrique",
    faiblesse: "Combat",
    attack_name: "Éclair",
    attack_damage: 20,
    attack_cost: 2,
    retreat_cost: 1,
    rarity: 1,
  },
  {
    name: "Dracaufeu",
    pv: 120,
    type: "Feu",
    faiblesse: "Eau",
    attack_name: "Danseflamme",
    attack_damage: 100,
    attack_cost: 4,
    retreat_cost: 3,
    rarity: 3,
  },
  {
    name: "Bulbizarre",
    pv: 40,
    type: "Plante",
    faiblesse: "Feu",
    attack_name: "Vol-Vie",
    attack_damage: 20,
    attack_cost: 2,
    retreat_cost: 1,
    rarity: 1,
  },
  {
    name: "Léviator",
    pv: 100,
    type: "Eau",
    faiblesse: "Électrique",
    attack_name: "Hydrocanon",
    attack_damage: 80,
    attack_cost: 3,
    retreat_cost: 2,
    rarity: 2,
  },
  {
    name: "Mackogneur",
    pv: 90,
    type: "Combat",
    faiblesse: "Psy",
    attack_name: "Frappe Atlas",
    attack_damage: 60,
    attack_cost: 3,
    retreat_cost: 2,
    rarity: 2,
  },
  {
    name: "Ectoplasma",
    pv: 80,
    type: "Psy",
    faiblesse: "Ténèbres",
    attack_name: "Ball’Ombre",
    attack_damage: 70,
    attack_cost: 3,
    retreat_cost: 1,
    rarity: 2,
  },
  {
    name: "Ronflex",
    pv: 110,
    type: "Normal",
    faiblesse: "Combat",
    attack_name: "Plaquage",
    attack_damage: 50,
    attack_cost: 2,
    retreat_cost: 4,
    rarity: 2,
  },
  {
    name: "Dracolosse",
    pv: 100,
    type: "Dragon",
    faiblesse: "Glace",
    attack_name: "Draco-Rage",
    attack_damage: 90,
    attack_cost: 4,
    retreat_cost: 2,
    rarity: 3,
  },
  {
    name: "Mewtwo",
    pv: 110,
    type: "Psy",
    faiblesse: "Ténèbres",
    attack_name: "Psyko",
    attack_damage: 100,
    attack_cost: 4,
    retreat_cost: 2,
    rarity: 3,
  },
  {
    name: "Mew",
    pv: 70,
    type: "Psy",
    faiblesse: "Ténèbres",
    attack_name: "Pouvoir Antique",
    attack_damage: 40,
    attack_cost: 2,
    retreat_cost: 1,
    rarity: 3,
  },
];

// Fonction pour initialiser la base de données
async function initializeDatabase() {
  try {
    // Supprimer toutes les cartes existantes
    await Card.deleteMany({});
    console.log("Base de données nettoyée");

    // Insérer les nouvelles cartes
    await Card.insertMany(defaultCards);
    console.log("Cartes par défaut ajoutées avec succès");

    // Afficher les cartes insérées
    const cards = await Card.find();
    console.log(
      `${cards.length} cartes sont maintenant dans la base de données`
    );

    // Fermer la connexion
    mongoose.connection.close();
  } catch (error) {
    console.error(
      "Erreur lors de l'initialisation de la base de données:",
      error
    );
    mongoose.connection.close();
  }
}

// Exécuter l'initialisation
initializeDatabase();
