const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server");
const PokemonModel = require("../models/pokemon");

beforeEach(async () => {
  // Nettoyer la base de données avant chaque test
  await PokemonModel.deleteMany({});
});

afterAll(async () => {
  // Fermer la connexion à MongoDB après tous les tests
  await mongoose.connection.close();
});

describe("Pokemon routes", () => {
  test("should create a new Pokemon", async () => {
    const res = await request(app)
      .post("/api/pokemons")
      .send({
        name: "Pikachu",
        hp: 100,
        type: "Electric",
        attack: {
          name: "Thunderbolt",
          description: "A strong electric attack",
          power: 90,
        },
        rarity: {
          level: 1,
          label: "Common",
        },
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe("Pikachu");
  });

  test("should fail to create Pokemon with missing data", async () => {
    const res = await request(app).post("/api/pokemons").send({
      name: "Pikachu",
    });

    expect(res.statusCode).toBe(400);
  });

  test("should return 404 for a non-existent Pokemon ID", async () => {
    const res = await request(app).get("/api/pokemons/invalid-id");

    expect(res.statusCode).toBe(404); // Vérifie que l'erreur est correctement renvoyée
    expect(res.body.message).toBe("Carte non trouvée");
  });
});
