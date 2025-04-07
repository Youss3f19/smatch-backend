const mongoose = require('mongoose');
const User = require('./User');

const options = { discriminatorKey: 'role', collection: 'users' };

const playerSchema = new mongoose.Schema({
  classement: String,
  styleDeJeu: String,
  postePrefere: String,
  statistiques: Object // or define schema if needed
}, options);

// Functions specific to Player
playerSchema.methods.participerMatch = function(matchId) {
  // Your logic to register player in a match
};

playerSchema.methods.consulterClassement = function() {
  return this.classement;
};

module.exports = User.discriminator('player', playerSchema);
