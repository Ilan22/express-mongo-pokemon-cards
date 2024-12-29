require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Models
const PokemonModel = require("./models/pokemon");
const UserModel = require("./models/user");

// Middlewares
const authenticateToken = require("./middlewares/authenticateToken");
const admin = require("./middlewares/admin");

// Importation des routes API et des routes non-API
const viewsRoutes = require("./routes/viewsRoutes");
const apiRoutes = require("./routes/apiRoutes");

mongoose
  .connect("mongodb://127.0.0.1:27017/tcgp")
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

const cookieParser = require("cookie-parser");

app.use(cookieParser());

// Routes
app.use(viewsRoutes);
app.use(apiRoutes);

module.exports = app;
