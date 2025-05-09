const mongoose = require('mongoose');
const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const Team = require('../models/Team');



// Créer un tournoi
exports.createTournament = async (req, res) => {
  try {
    const { name, startDate, endDate, location, numberTeam, prize, tournamentType, terrainType, maxSets } = req.body;

    const tournament = new Tournament({
      name,
      organizer: [req.user._id],
      startDate,
      endDate,
      location,
      numberTeam,
      prize,
      tournamentType,
      teams: [],
      joinRequests: [],
      structure: {
        matches: [],
        groups: [],
        rounds: 0
      }
    });

    await tournament.save();
    res.status(201).json(tournament);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lister tous les tournois
exports.getAllTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find()
      .populate('organizer', 'username')
      .populate('teams', 'teamName')
      .populate('structure.matches')
      .populate('structure.groups.teams', 'teamName')
      .populate('structure.groups.matches');
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer un tournoi par ID
exports.getTournamentById = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('organizer', 'username')
      .populate('teams', 'teamName players')
      .populate('structure.matches')
      .populate('structure.groups.teams', 'teamName')
      .populate('structure.groups.matches');
    if (!tournament) {
      return res.status(404).json({ message: 'Tournoi non trouvé' });
    }
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour un tournoi
exports.updateTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournoi non trouvé' });
    }

    if (!tournament.organizer.some(org => org.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    Object.assign(tournament, req.body);
    await tournament.save();
    res.json(tournament);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Supprimer un tournoi
exports.deleteTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournoi non trouvé' });
    }

    if (!tournament.organizer.some(org => org.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await tournament.remove();
    res.json({ message: 'Tournoi supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Créer une demande de participation à un tournoi
exports.createJoinRequest = async (req, res) => {
  try {
    const { teamId } = req.body;
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ message: 'Tournoi non trouvé' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Équipe non trouvée' });
    }

    if (!team.teamLeader || team.teamLeader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Seul le chef d\'équipe peut demander à rejoindre' });
    }

    if (team.players.length < 6) {
      return res.status(400).json({ message: 'L\'équipe doit avoir au moins 6 joueurs pour un tournoi de volleyball' });
    }

    if (tournament.teams.length >= tournament.numberTeam) {
      return res.status(400).json({ message: 'Le tournoi est déjà complet' });
    }

    if (tournament.joinRequests.some(req => req.team.toString() === teamId)) {
      return res.status(400).json({ message: 'Demande de participation déjà soumise' });
    }

    tournament.joinRequests.push({ team: teamId });
    await tournament.save();

    const populatedTournament = await Tournament.findById(tournament._id)
      .populate('organizer', 'username')
      .populate('teams', 'teamName players')
      .populate('joinRequests.team', 'teamName');

    res.json(populatedTournament);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Gérer une demande de participation à un tournoi
exports.handleJoinRequest = async (req, res) => {
  try {
    const { teamId, status } = req.body;
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ message: 'Tournoi non trouvé' });
    }

    if (!tournament.organizer.some(org => org.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const joinRequest = tournament.joinRequests.find(
      request => request.team.toString() === teamId
    );

    if (!joinRequest) {
      return res.status(404).json({ message: 'Demande de participation non trouvée' });
    }

    joinRequest.status = status;

    if (status === 'accepted' && tournament.teams.length < tournament.numberTeam) {
      const team = await Team.findById(teamId);
      if (team.players.length < 6) {
        return res.status(400).json({ message: 'L\'équipe doit avoir au moins 6 joueurs pour un tournoi de volleyball' });
      }
      tournament.teams.push(teamId);
    }

    await tournament.save();

    const populatedTournament = await Tournament.findById(tournament._id)
      .populate('organizer', 'username')
      .populate('teams', 'teamName players')
      .populate('joinRequests.team', 'teamName');

    res.json(populatedTournament);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Générer la structure du tournoi
exports.generateTournamentStructure = async (req, res) => {
  try {
    const { terrainType, maxSets } = req.body;
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ message: 'Tournoi non trouvé' });
    }

    if (!tournament.organizer.some(org => org.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    if (tournament.teams.length < 2) {
      return res.status(400).json({ message: 'Le tournoi doit avoir au moins 2 équipes' });
    }

    // Vider la structure existante
    tournament.structure.matches = [];
    tournament.structure.groups = [];
    tournament.structure.rounds = 0;

    const teams = tournament.teams;
    const matches = [];

    if (tournament.tournamentType === 'SingleElimination') {
      // Calculer le nombre de rondes
      const numTeams = teams.length;
      const rounds = Math.ceil(Math.log2(numTeams));
      tournament.structure.rounds = rounds;

      // Créer les matchs pour la première ronde
      const firstRoundMatches = Math.ceil(numTeams / 2);
      for (let i = 0; i < firstRoundMatches; i++) {
        const match = new TournamentMatch({
          team1: teams[i * 2] || null,
          team2: teams[i * 2 + 1] || null,
          tournament: tournament._id,
          round: 1,
          matchNumber: i + 1,
          sets: [],
          terrainType: terrainType || 'indoor',
          maxSets: maxSets || 3
        });
        await match.save();
        matches.push(match._id);
      }

      // Créer les matchs pour les rondes suivantes (placeholders)
      for (let round = 2; round <= rounds; round++) {
        const numMatches = Math.ceil(firstRoundMatches / Math.pow(2, round - 1));
        for (let i = 0; i < numMatches; i++) {
          const match = new TournamentMatch({
            team1: null,
            team2: null,
            tournament: tournament._id,
            round,
            matchNumber: i + 1,
            sets: [],
            terrainType: terrainType || 'indoor',
            maxSets: maxSets || 3
          });
          await match.save();
          matches.push(match._id);
        }
      }
    } else if (tournament.tournamentType === 'GroupKnockout') {
      // Créer des groupes (par exemple, 4 équipes par groupe)
      const teamsPerGroup = 4;
      const numGroups = Math.ceil(teams.length / teamsPerGroup);
      const groups = [];

      for (let i = 0; i < numGroups; i++) {
        const groupTeams = teams.slice(i * teamsPerGroup, (i + 1) * teamsPerGroup);
        const groupMatches = [];

        // Générer des matchs RoundRobin dans chaque groupe
        for (let j = 0; j < groupTeams.length; j++) {
          for (let k = j + 1; k < groupTeams.length; k++) {
            const match = new TournamentMatch({
              team1: groupTeams[j],
              team2: groupTeams[k],
              tournament: tournament._id,
              round: 1,
              matchNumber: matches.length + 1,
              groupName: `Groupe ${i + 1}`,
              sets: [],
              terrainType: terrainType || 'indoor',
              maxSets: maxSets || 3
            });
            await match.save();
            groupMatches.push(match._id);
            matches.push(match._id);
          }
        }

        groups.push({
          groupName: `Groupe ${i + 1}`,
          teams: groupTeams,
          matches: groupMatches
        });
      }

      tournament.structure.groups = groups;
      tournament.structure.rounds = 1; // Phase de groupes

      // Ajouter une phase à élimination directe (par exemple, demi-finales et finale)
      if (numGroups > 1) {
        const knockoutMatches = [];
        // Exemple : Top 2 de chaque groupe passent en demi-finales
        for (let i = 0; i < 2; i++) {
          const match = new TournamentMatch({
            team1: null,
            team2: null,
            tournament: tournament._id,
            round: 2,
            matchNumber: i + 1,
            sets: [],
            terrainType: terrainType || 'indoor',
            maxSets: maxSets || 3
          });
          await match.save();
          knockoutMatches.push(match._id);
          matches.push(match._id);
        }
        // Finale
        const finalMatch = new TournamentMatch({
          team1: null,
          team2: null,
          tournament: tournament._id,
          round: 3,
          matchNumber: 1,
          sets: [],
          terrainType: terrainType || 'indoor',
          maxSets: maxSets || 3
        });
        await finalMatch.save();
        matches.push(finalMatch._id);
        tournament.structure.rounds = 3;
      }
    }

    tournament.structure.matches = matches;
    await tournament.save();

    const populatedTournament = await Tournament.findById(tournament._id)
      .populate('organizer', 'username')
      .populate('teams', 'teamName players')
      .populate('structure.matches')
      .populate('structure.groups.teams', 'teamName')
      .populate('structure.groups.matches');

    res.json(populatedTournament);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};