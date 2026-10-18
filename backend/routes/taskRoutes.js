const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasksByProject,
  updateTaskStatus,
  updateTask,
  deleteTask
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All task routes require auth

router.post('/', createTask);
router.get('/project/:projectId', getTasksByProject);
router.patch('/:id/status', updateTaskStatus);

router.route('/:id')
  .put(updateTask)
  .delete(deleteTask);

module.exports = router;
