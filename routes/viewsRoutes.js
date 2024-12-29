// routes/viewsRoutes.js
const express = require("express");
const { types_pokemons, rarities } = require("../data/pokemon-data");
const UserModel = require("../models/user");
const PokemonModel = require("../models/pokemon");
const authenticateToken = require("../middlewares/authenticateToken");
const admin = require("../middlewares/admin");

const router = express.Router();

// Page d'accueil
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userWithpokemons = await UserModel.findById(req.user.id).populate(
      "pokemons"
    );
    const allPokemons = await PokemonModel.find();
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

// Page d'authentification
router.get("/authentication", (req, res) => {
  const randomNumber = Math.floor(Math.random() * 8) + 1;
  res.render("authentication", { randomNumber });
});

// Page admin
router.get("/admin", authenticateToken, admin, async (req, res) => {
  try {
    const pokemons = await PokemonModel.find();
    res.render("admin", { pokemons, user: req.user });
  } catch (error) {
    res.status(500).send("Erreur serveur");
  }
});

// Page de création de carte
router.get("/createCard", authenticateToken, (req, res) => {
  res.render("createCard", { user: req.user, typesPokemons: types_pokemons });
});

// Formulaire d'édition d'une carte
router.get("/admin/edit/:id", authenticateToken, async (req, res) => {
  try {
    const card = await PokemonModel.findById(req.params.id);
    if (card) {
      res.render("editCard", {
        card,
        user: req.user,
        typesPokemons: types_pokemons,
        rarities,
      });
    } else {
      res.status(404).send("Carte non trouvée");
    }
  } catch (error) {
    res.status(500).send("Erreur serveur");
  }
});

module.exports = router;
