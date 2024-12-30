require('dotenv').config({
  path: process.env.NODE_ENV === 'production' 
    ? '.env' 
    : '.env.local'
});
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require("bcryptjs");
const UserModel = require('../models/user');
const PokemonModel = require('../models/pokemon');

// URL de connexion MongoDB avec options
const MONGO_URL = process.env.MONGO_URL;
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// Fonction pour convertir les $oid en ObjectId
function convertObjectIds(obj) {
  if (obj === null || typeof obj !== 'object') return obj;

  if (obj.$oid) {
    return new mongoose.Types.ObjectId(obj.$oid);
  }

  for (const key in obj) {
    obj[key] = convertObjectIds(obj[key]);
  }
  return obj;
}

async function importData() {
  try {
    // Lecture du fichier JSON
    const jsonPath = path.join(__dirname, '../data/tcgp.pokemons.json');
    const jsonData = await fs.readFile(jsonPath, 'utf-8');
    let pokemons = JSON.parse(jsonData);

    // Conversion des $oid en ObjectId
    pokemons = pokemons.map(pokemon => convertObjectIds(pokemon));

    // Suppression des données existantes
    await PokemonModel.deleteMany({});
    console.log('Collection nettoyée');

    // Import des nouvelles données un par un
    for (const pokemonData of pokemons) {
      const pokemon = new PokemonModel(pokemonData);
      await pokemon.save();
    }
    console.log('Données importées avec succès');

  } catch (error) {
    console.error('Erreur lors de l\'import:', error);
    process.exit(1);
  }
}

async function createAdmin() {
  try {
    console.log("Suppression de l'ancien admin...");
    await UserModel.deleteOne({ email: "admin@admin.com" });

    console.log("Création d'un utilisateur admin");
    const hashedPassword = await bcrypt.hash("admin", 10);

    const admin = new UserModel({
      name: "admin",
      email: "admin@admin.com",
      password: hashedPassword,
      role: 0,
    });

    await admin.save();
    console.log("Création de l'admin réussie");
  } catch (error) {
    console.error("Erreur lors de la création de l'admin:", error);
    process.exit(1);
  }
}

async function main() {
  try{
    // Connexion à MongoDB avec options
    await mongoose.connect(MONGO_URL, mongooseOptions);
    console.log('Connecté à MongoDB');

    await importData();
    await createAdmin();
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Connexion fermée');
  }
}

main();

