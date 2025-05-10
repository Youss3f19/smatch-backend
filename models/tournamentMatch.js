const mongoose = require('mongoose');
const Match = require('./Match');

const tournamentMatchSchema = new mongoose.Schema({
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
  round: { type: Number, required: true },
  matchNumber: { type: Number, required: true },
  groupName: { type: String, default: null },
  team1: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  team2: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  sets: [{ type: mongoose.Schema.Types.Mixed }],
  terrainType: { type: String, default: 'indoor' },
  maxSets: { type: Number, default: 3 },
  nextMatch: { type: mongoose.Schema.Types.ObjectId, ref: 'TournamentMatch', default: null }
});

// Définir TournamentMatch comme discriminator du modèle Match
module.exports = Match.discriminator('TournamentMatch', tournamentMatchSchema);