const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  equipeA: { type: String, required: true },
  equipeB: { type: String, required: true },
  scoreA: { type: Number, default: 0 },
  scoreB: { type: Number, default: 0 },
  dateMatch: { type: Date, required: true },
  lieu: { type: String, required: true },
  statut: { type: String, enum: ['à venir', 'en cours', 'terminé'], default: 'à venir' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Match', matchSchema);
