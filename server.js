require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const setupMiddlewares = require("./middlewares/globalMiddlewares");
const { notFoundHandler, errorHandler } = require('./middlewares/errorMiddlewares');

// Importation des routes API et des routes non-API
const viewsRoutes = require("./routes/viewsRoutes");
const apiRoutes = require("./routes/apiRoutes");

mongoose
  .connect("mongodb://127.0.0.1:27017/tcgp")
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
