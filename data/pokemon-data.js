// pokemon-data.js
const types_pokemons = [
  "Normal",
  "Plante",
  "Feu",
  "Eau",
  "Insecte",
  "Poison",
  "Vol",
  "Électrik",
  "Sol",
  "Combat",
  "Psy",
  "Roche",
  "Glace",
  "Spectre",
  "Dragon",
];

const rarities = [
  { level: 0, label: "Très Commun" },
  { level: 1, label: "Commun" },
  { level: 2, label: "Peu Commun" },
  { level: 3, label: "Rare" },
  { level: 4, label: "Très Rare" },
];

module.exports = {
  types_pokemons,
  rarities,
};
