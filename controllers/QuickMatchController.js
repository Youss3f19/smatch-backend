const mongoose = require('mongoose');
const QuickMatch = require('../models/QuickMatch');
const Team = require('../models/Team');

// Créer un match rapide
exports.createQuickMatch = async (req, res) => {
  try {
    const { isPublic, teamName } = req.body;

    // Créer une équipe rapide pour le créateur
    const quickTeam = new Team({
      teamName: teamName || `Quick Team ${Date.now()}`,
      teamLeader: req.user._id,
      players: [req.user._id],
      teamType: 'quick'
    });
    await quickTeam.save();

    // Créer le match rapide
    const match = new QuickMatch({
      team1: quickTeam._id,
      team2: null,
      isPublic: isPublic !== undefined ? isPublic : true,
      creator: req.user._id,
      joinRequests: []
    });
    await match.save();

    // Peupler les champs pour la réponse
    const populatedMatch = await QuickMatch.findById(match._id)
      .populate('team1', 'teamName')
      .populate('team2', 'teamName')
      .populate('creator', 'username')
      .populate('joinRequests.team', 'teamName');

    res.status(201).json(populatedMatch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Demander à rejoindre un match rapide privé
exports.requestToJoinQuickMatch = async (req, res) => {
  try {
    const { teamId } = req.body;
    const match = await QuickMatch.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ message: 'Match rapide non trouvé' });
    }

    if (match.isPublic) {
      return res.status(400).json({ message: 'Impossible de demander à rejoindre un match public' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Équipe non trouvée' });
    }

    if (!team.teamLeader || team.teamLeader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Seul le chef d\'équipe peut demander à rejoindre' });
    }

    if (match.team1 && match.team2) {
      return res.status(400).json({ message: 'Le match est déjà complet' });
    }

    if (match.joinRequests.some(req => req.team.toString() === teamId)) {
      return res.status(400).json({ message: 'Demande de participation déjà soumise' });
    }

    match.joinRequests.push({ team: teamId });
    await match.save();

    const populatedMatch = await QuickMatch.findById(match._id)
      .populate('team1', 'teamName')
      .populate('team2', 'teamName')
      .populate('creator', 'username')
      .populate('joinRequests.team', 'teamName');

    res.json(populatedMatch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Gérer une demande de participation à un match rapide
exports.handleJoinRequest = async (req, res) => {
  try {
    const { teamId, status } = req.body;
    const match = await QuickMatch.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ message: 'Match rapide non trouvé' });
    }

    if (match.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const joinRequest = match.joinRequests.find(
      request => request.team.toString() === teamId
    );

    if (!joinRequest) {
      return res.status(404).json({ message: 'Demande de participation non trouvée' });
    }

    joinRequest.status = status;

    if (status === 'accepted' && !match.team2) {
      match.team2 = teamId;
    }

    await match.save();

    const populatedMatch = await QuickMatch.findById(match._id)
      .populate('team1', 'teamName')
      .populate('team2', 'teamName')
      .populate('creator', 'username')
      .populate('joinRequests.team', 'teamName');

    res.json(populatedMatch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Rejoindre un match rapide (public uniquement)
exports.joinQuickMatch = async (req, res) => {
  try {
    const match = await QuickMatch.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ message: 'Match rapide non trouvé' });
    }

    if (!match.isPublic) {
      return res.status(403).json({ message: 'Impossible de rejoindre directement un match privé. Veuillez envoyer une demande de participation.' });
    }

    if (match.team1 && match.team2) {
      return res.status(400).json({ message: 'Le match est déjà complet' });
    }

    // Créer ou récupérer une équipe rapide
    let quickTeam = await Team.findOne({ teamLeader: req.user._id, teamType: 'quick' });
    if (!quickTeam) {
      quickTeam = new Team({
        teamName: `Quick Team ${Date.now()}`,
        teamLeader: req.user._id,
        players: [req.user._id],
        teamType: 'quick'
      });
      await quickTeam.save();
    }

    if (!match.team1) {
      match.team1 = quickTeam._id;
    } else {
      match.team2 = quickTeam._id;
    }

    await match.save();

    const populatedMatch = await QuickMatch.findById(match._id)
      .populate('team1', 'teamName')
      .populate('team2', 'teamName')
      .populate('creator', 'username')
      .populate('joinRequests.team', 'teamName');

    res.json(populatedMatch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lister tous les matchs rapides
exports.getQuickMatches = async (req, res) => {
  try {
    const matches = await QuickMatch.find()
      .populate('team1', 'teamName')
      .populate('team2', 'teamName')
      .populate('creator', 'username')
      .populate('winner', 'teamName')
      .populate('joinRequests.team', 'teamName');
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour un match rapide
exports.updateQuickMatch = async (req, res) => {
  try {
    const match = await QuickMatch.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ message: 'Match rapide non trouvé' });
    }

    if (match.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    Object.assign(match, req.body);
    await match.save();

    const populatedMatch = await QuickMatch.findById(match._id)
      .populate('team1', 'teamName')
      .populate('team2', 'teamName')
      .populate('creator', 'username')
      .populate('joinRequests.team', 'teamName');

    res.json(populatedMatch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Supprimer un match rapide
exports.deleteQuickMatch = async (req, res) => {
  try {
    const match = await QuickMatch.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ message: 'Match rapide non trouvé' });
    }

    if (match.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await match.remove();
    res.json({ message: 'Match rapide supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};