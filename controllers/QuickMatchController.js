const mongoose = require('mongoose');
const Match = require('../models/Match');
const Team = require('../models/Team');
const User = require('../models/User');
const QuickMatch = require('../models/QuickMatch');

// Créer un match rapide de volleyball
exports.createQuickMatch = async (req, res) => {
  try {
    const { isPublic, team1Name, team2Name, date, location, terrainType, maxSets } = req.body;

    // Validate required fields
    if (!date || !location) {
      return res.status(400).json({ message: 'Date and location are required' });
    }

    // Validate date is in the future
    const matchDate = new Date(date);
    if (matchDate <= new Date()) {
      return res.status(400).json({ message: 'Match date must be in the future' });
    }

    // Créer l'équipe 1 avec le créateur
    const team1 = new Team({
      teamName: team1Name || `Volley Team 1 ${Date.now()}`,
      teamLeader: req.user._id,
      players: [req.user._id],
      teamType: 'quick'
    });
    await team1.save();

    // Créer l'équipe 2 vide
    const team2 = new Team({
      teamName: team2Name || `Volley Team 2 ${Date.now()}`,
      teamLeader: null,
      players: [],
      teamType: 'quick'
    });
    await team2.save();

    // Créer le match rapide
    const match = new QuickMatch({
      team1: team1._id,
      team2: team2._id,
      isPublic: isPublic !== undefined ? isPublic : true,
      creator: req.user._id,
      joinRequests: [],
      terrainType: terrainType || 'indoor',
      maxSets: maxSets || 3,
      sets: [],
      date: matchDate,
      location
    });
    await match.save();

    // Peupler les champs pour la réponse
    const populatedMatch = await QuickMatch.findById(match._id)
      .populate('team1', 'teamName players')
      .populate('team2', 'teamName players')
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

    if (team.players.length < 6) {
      return res.status(400).json({ message: 'L\'équipe doit avoir au moins 6 joueurs pour un match de volleyball' });
    }

    if (match.team1 && match.team2 && match.team2.toString() !== teamId.toString()) {
      return res.status(400).json({ message: 'Le match est déjà complet ou l\'équipe ne correspond pas' });
    }

    if (match.joinRequests.some(req => req.team.toString() === teamId)) {
      return res.status(400).json({ message: 'Demande de participation déjà soumise' });
    }

    match.joinRequests.push({ team: teamId });
    await match.save();

    const populatedMatch = await QuickMatch.findById(match._id)
      .populate('team1', 'teamName players')
      .populate('team2', 'teamName players')
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
      const team = await Team.findById(teamId);
      if (team.players.length < 6) {
        return res.status(400).json({ message: 'L\'équipe doit avoir au moins 6 joueurs pour un match de volleyball' });
      }
      match.team2 = teamId;
    }

    await match.save();

    const populatedMatch = await QuickMatch.findById(match._id)
      .populate('team1', 'teamName players')
      .populate('team2', 'teamName players')
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
        teamName: `Volley Team ${Date.now()}`,
        teamLeader: req.user._id,
        players: [req.user._id],
        teamType: 'quick'
      });
    }

    // Vérifier le nombre de joueurs (simulé, à compléter)
    if (quickTeam.players.length < 6) {
      return res.status(400).json({ message: 'L\'équipe doit avoir au moins 6 joueurs pour un match de volleyball' });
    }

    await quickTeam.save();

    if (!match.team1) {
      match.team1 = quickTeam._id;
    } else {
      match.team2 = quickTeam._id;
    }

    await match.save();

    const populatedMatch = await QuickMatch.findById(match._id)
      .populate('team1', 'teamName players')
      .populate('team2', 'teamName players')
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
      .populate('team1', 'teamName players')
      .populate('team2', 'teamName players')
      .populate('creator', 'username')
      .populate('winner', 'teamName')
      .populate('joinRequests.team', 'teamName');
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour un match rapide (scores des sets, gagnant, etc.)
exports.updateQuickMatch = async (req, res) => {
  try {
    const match = await QuickMatch.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ message: 'Match rapide non trouvé' });
    }

    if (match.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const { sets, score1, score2, winner } = req.body;

    if (sets) {
      match.sets = sets;
      // Calculer les sets gagnés pour déterminer le gagnant
      const team1SetsWon = match.sets.filter(set => set.team1Score > set.team2Score && (set.team1Score >= 25 || (match.sets.length === match.maxSets && set.team1Score >= 15)) && set.team1Score - set.team2Score >= 2).length;
      const team2SetsWon = match.sets.filter(set => set.team2Score > set.team1Score && (set.team2Score >= 25 || (match.sets.length === match.maxSets && set.team2Score >= 15)) && set.team2Score - set.team1Score >= 2).length;

      match.score1 = team1SetsWon;
      match.score2 = team2SetsWon;

      const setsToWin = Math.ceil(match.maxSets / 2);
      if (team1SetsWon >= setsToWin) {
        match.winner = match.team1;
      } else if (team2SetsWon >= setsToWin) {
        match.winner = match.team2;
      }
    }

    if (score1 !== undefined) match.score1 = score1;
    if (score2 !== undefined) match.score2 = score2;
    if (winner) match.winner = winner;

    await match.save();

    const populatedMatch = await QuickMatch.findById(match._id)
      .populate('team1', 'teamName players')
      .populate('team2', 'teamName players')
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