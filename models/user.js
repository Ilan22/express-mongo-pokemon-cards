const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: Number, required: true },
  pokemons: [{ type: mongoose.Schema.Types.ObjectId, ref: "pokemon" }],
  createdAt: { type: Date }
});

// Hook pre-save pour mettre à jour updatedAt
userSchema.pre('save', function(next) {
  this.createdAt = new Date();
  next();
});

const UserModel = mongoose.model("user", userSchema);

module.exports = UserModel;
