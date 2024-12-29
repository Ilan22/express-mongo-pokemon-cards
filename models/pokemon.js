const mongoose = require("mongoose");

const pokemonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  hp: { type: Number, required: true },
  image: { type: String, require: false },
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

const PokemonModel = mongoose.model("pokemon", pokemonSchema);

module.exports = PokemonModel;
