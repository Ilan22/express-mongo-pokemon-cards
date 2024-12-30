const express = require("express");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");

const setupMiddlewares = (app) => {
    // Middleware pour parser le JSON
    app.use(express.json());
    
    // Middleware pour les fichiers statiques
    app.use(express.static("public"));
    
    // Middleware pour parser les données des formulaires
    app.use(express.urlencoded({ extended: true }));
    
    // Middleware pour permettre d'autres méthodes HTTP
    app.use(methodOverride("_method"));
    
    // Middleware pour gérer les cookies
    app.use(cookieParser());

    // Middleware de sécurité basique
    app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        next();
    });
};

module.exports = setupMiddlewares; 