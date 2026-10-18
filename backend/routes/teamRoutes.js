const express = require('express');
const router = express.Router();
const {
  createTeam,
  getMyTeams,
  getTeamById,
  joinTeamByCode,
  updateTeam,
  removeMember,
  deleteTeam
} = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All team routes require authentication

router.route('/')
  .post(createTeam)
  .get(getMyTeams);

router.post('/join', joinTeamByCode);

router.route('/:id')
  .get(getTeamById)
  .put(updateTeam)
  .delete(deleteTeam);

router.delete('/:id/members/:userId', removeMember);

module.exports = router;
