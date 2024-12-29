const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET; // Charger la clé depuis .env

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect("/authentication");
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      res.clearCookie("token");
      return res.redirect("/authentication");
    }
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
