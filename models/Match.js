const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  team1: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  team2: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  score1: { type: Number, default: null },
  score2: { type: Number, default: null },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Match', matchSchema);