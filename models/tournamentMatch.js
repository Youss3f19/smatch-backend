const mongoose = require('mongoose');
const Match = require('./Match');

const tournamentMatchSchema = new mongoose.Schema({
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
  round: { type: Number, required: true },
  matchNumber: { type: Number, required: true },
  groupName: { type: String, default: null }
});

// Définir TournamentMatch comme discriminator du modèle Match
module.exports = Match.discriminator('TournamentMatch', tournamentMatchSchema);