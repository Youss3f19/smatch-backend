const mongoose = require('mongoose');
const User = require('./User');

const options = { discriminatorKey: 'role', collection: 'users' };

const organisateurSchema = new mongoose.Schema({}, options);

// Organizer methods
organisateurSchema.methods.creerTournoi = function(tournoiData) {
  // Logic to create tournament
};

organisateurSchema.methods.planifierMatch = function(matchData) {
  // Logic to schedule match
};

organisateurSchema.methods.gererInscriptions = function() {
  // Logic to manage registrations
};

module.exports = User.discriminator('organisateur', organisateurSchema);
