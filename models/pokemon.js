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
  createdAt: { type: Date, required: false },
  updatedAt: { type: Date, required: false }
});

// Hook pre-save pour mettre à jour createdAt et updatedAt
pokemonSchema.pre('save', function(next) {
  const now = new Date();
  if (!this.createdAt) {
    this.createdAt = now;
  }
  this.updatedAt = now;
  next();
});

// Hook pre-update pour mettre à jour updatedAt
pokemonSchema.pre('findByIdAndUpdate', function(next) {
  this._update = this._update || {};
  this._update.updatedAt = new Date();
  next();
});

const PokemonModel = mongoose.model("pokemon", pokemonSchema);

module.exports = PokemonModel;
