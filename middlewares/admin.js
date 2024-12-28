const admin = (req, res, next) => {
  if (!req.user || req.user.role !== 0) {
    return res.status(403).json({ message: "Accès interdit, admin requis." });
  }
  next();
};

module.exports = admin;
