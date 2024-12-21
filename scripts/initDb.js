const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

// URL de connexion MongoDB avec options
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tcgp';
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// Définition du schéma Pokemon
const PokemonSchema = new mongoose.Schema({
  // Le schéma est flexible pour accepter toutes les propriétés du JSON
}, { strict: false });

const Pokemon = mongoose.model('Pokemon', PokemonSchema);

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
    // Connexion à MongoDB avec options
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    console.log('Connecté à MongoDB');

    // Lecture du fichier JSON
    const jsonPath = path.join(__dirname, '../data/tcgp.pokemons.json');
    const jsonData = await fs.readFile(jsonPath, 'utf-8');
    let pokemons = JSON.parse(jsonData);

    // Conversion des $oid en ObjectId
    pokemons = pokemons.map(pokemon => convertObjectIds(pokemon));

    // Suppression des données existantes
    await Pokemon.deleteMany({});
    console.log('Collection nettoyée');

    // Import des nouvelles données
    await Pokemon.insertMany(pokemons, { lean: true });
    console.log('Données importées avec succès');

  } catch (error) {
    console.error('Erreur lors de l\'import:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Connexion fermée');
  }
}

// Exécution de la fonction d'import
importData();
