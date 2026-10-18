const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjectsByTeam,
  getProjectById,
  updateProject,
  deleteProject
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All project routes require auth

router.post('/', createProject);
router.get('/team/:teamId', getProjectsByTeam);

router.route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

module.exports = router;
