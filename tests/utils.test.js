const bcrypt = require("bcryptjs");

describe("Password hashing utility", () => {
  it("should hash a password correctly", async () => {
    const password = "securepassword";
    const hashedPassword = await bcrypt.hash(password, 10);

    expect(hashedPassword).not.toBe(password); // Vérifie que le mot de passe est bien chiffré
    const isMatch = await bcrypt.compare(password, hashedPassword);
    expect(isMatch).toBe(true); // Vérifie que le mot de passe correspond après chiffrement
  });
});
