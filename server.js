require('dotenv').config({
  path: process.env.NODE_ENV === 'production' 
    ? '.env' 
    : '.env.local'
});
const express = require("express");
const mongoose = require("mongoose");
const setupMiddlewares = require("./middlewares/globalMiddlewares");
const { notFoundHandler, errorHandler } = require('./middlewares/errorMiddlewares');

// Importation des routes API et des routes non-API
const viewsRoutes = require("./routes/viewsRoutes");
const apiRoutes = require("./routes/apiRoutes");

const MONGO_URL = process.env.MONGO_URL;

mongoose
  .connect(MONGO_URL)
  .then(() => console.log("MongoDB connecté"))
  .catch((err) => console.error("Erreur de connexion à MongoDB:", err));

const app = express();

// Configurer le moteur de template EJS
app.set("view engine", "ejs");

// Configuration des middlewares
setupMiddlewares(app);

// Routes
app.use(viewsRoutes);
app.use(apiRoutes);

// Middlewares de gestion des erreurs
// Doivent être après les routes donc pas dans setupMiddlewares

// Gestion des routes non trouvées
app.use(notFoundHandler);

// Gestion globale des erreurs
app.use(errorHandler);

module.exports = app;
