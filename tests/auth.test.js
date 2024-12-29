const request = require("supertest");
const app = require("../server");
const mongoose = require("mongoose");
const UserModel = require("../models/user");
const bcrypt = require("bcryptjs");

beforeEach(async () => {
  // Nettoyer la base de données avant chaque test
  await UserModel.deleteMany({});
});

afterAll(async () => {
  // Fermer la connexion à MongoDB après tous les tests
  await mongoose.connection.close();
});

describe("Authentication routes", () => {
  test("should register a new user", async () => {
    const res = await request(app).post("/api/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      role: 1,
    });

    expect(res.statusCode).toBe(201); // Vérifie le statut HTTP
    expect(res.body.message).toBe("Utilisateur créé avec succès"); // Vérifie la réponse JSON
  });

  test("should not register a user with an existing email", async () => {
    await UserModel.create({
      name: "Existing User",
      email: "existing@example.com",
      password: "password123",
      role: 1,
    });

    const res = await request(app).post("/api/register").send({
      name: "New User",
      email: "existing@example.com",
      password: "password123",
      role: 1,
    });

    expect(res.statusCode).toBe(400); // Vérifie que le serveur retourne une erreur
    expect(res.body.message).toBe("Cet email est déjà utilisé");
  });

  test("should login a user", async () => {
    await UserModel.create({
      name: "Login User",
      email: "login@example.com",
      password: await bcrypt.hash("password123", 10),
      role: 1,
    });

    const res = await request(app).post("/api/login").send({
      email: "login@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(200); // Vérifie le succès de la connexion
    expect(res.body.success).toBe(true); // Vérifie que la réponse contient `success: true`
  });
});
