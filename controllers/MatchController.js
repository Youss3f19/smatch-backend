const Match = require('../models/Match');

// Créer un match
exports.createMatch = async (req, res) => {
  try {
    const match = new Match(req.body);
    await match.save();
    res.status(201).json(match);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Obtenir tous les matchs
exports.getAllMatchs = async (req, res) => {
  try {
    const matchs = await Match.find();
    res.json(matchs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Obtenir un match par ID
exports.getMatchById = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match non trouvé' });
    res.json(match);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mettre à jour un match
exports.updateMatch = async (req, res) => {
  try {
    const match = await Match.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!match) return res.status(404).json({ message: 'Match non trouvé' });
    res.json(match);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Supprimer un match
exports.deleteMatch = async (req, res) => {
  try {
    const match = await Match.findByIdAndDelete(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match non trouvé' });
    res.json({ message: 'Match supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
