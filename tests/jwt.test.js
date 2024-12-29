const jwt = require("jsonwebtoken");

describe("JWT Token", () => {
  test("should generate a valid JWT token", () => {
    const payload = { id: "123", name: "Test User" };
    const secret = "test-secret";

    const token = jwt.sign(payload, secret, { expiresIn: "1h" });
    const decoded = jwt.verify(token, secret);

    expect(decoded.id).toBe(payload.id); // Vérifie le contenu du token
    expect(decoded.name).toBe(payload.name);
  });

  test("should fail with an invalid token", () => {
    const token = "invalid.token.string";
    const secret = "test-secret";

    expect(() => jwt.verify(token, secret)).toThrow(); // Vérifie qu'une exception est levée
  });
});
