const Task = require('../models/Task');
const Project = require('../models/Project');
const Team = require('../models/Team');

// @desc    Create and assign a task
// @route   POST /api/tasks
// @access  Private (Team members only)
const createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, priority, dueDate, status } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({
        success: false,
        message: 'Task title and project ID are required'
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const team = await Team.findById(project.team);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Verify requesting user is member or leader
    const isMember = team.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: You must be a member of this team to create tasks'
      });
    }

    // If assignedTo is provided, verify assignee belongs to the team
    if (assignedTo) {
      const isAssigneeMember = team.members.some(
        (m) => m.user.toString() === assignedTo.toString()
      );
      if (!isAssigneeMember) {
        return res.status(400).json({
          success: false,
          message: 'The assigned user must be a member of this team'
        });
      }
    }

    const task = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      project: project._id,
      team: team._id,
      assignedTo: assignedTo || null,
      priority: priority || 'Medium',
      dueDate: dueDate || null,
      status: status || 'To Do',
      createdBy: req.user._id
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email role organization')
      .populate('createdBy', 'name email');

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: populatedTask
    });
  } catch (error) {
    console.error('Create Task Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error creating task' });
  }
};

// @desc    Get all tasks for a project
// @route   GET /api/tasks/project/:projectId
// @access  Private (Team members only)
const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const team = await Team.findById(project.team);
    const isMember = team.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this team'
      });
    }

    const tasks = await Task.find({ project: projectId })
      .populate('assignedTo', 'name email role organization')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error('Get Tasks Error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving tasks' });
  }
};

// @desc    Update task status (To Do, In Progress, Completed)
// @route   PATCH /api/tasks/:id/status
// @access  Private (Team members only)
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['To Do', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be one of: "To Do", "In Progress", "Completed"'
      });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const team = await Team.findById(task.team);
    const isMember = team.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: You are not a member of this team'
      });
    }

    task.status = status;
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email role organization')
      .populate('createdBy', 'name email');

    // Also get updated project progress
    const totalTasks = await Task.countDocuments({ project: task.project });
    const completedTasks = await Task.countDocuments({
      project: task.project,
      status: 'Completed'
    });
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return res.status(200).json({
      success: true,
      message: `Task updated to ${status}`,
      task: populatedTask,
      projectProgress: {
        totalTasks,
        completedTasks,
        progress
      }
    });
  } catch (error) {
    console.error('Update Task Status Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error updating task status' });
  }
};

// @desc    Update task details
// @route   PUT /api/tasks/:id
// @access  Private (Team members only)
const updateTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, dueDate, status } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const team = await Team.findById(task.team);
    const isMember = team.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: You are not a member of this team'
      });
    }

    if (title) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    if (priority) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (status && ['To Do', 'In Progress', 'Completed'].includes(status)) {
      task.status = status;
    }

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email role organization')
      .populate('createdBy', 'name email');

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task: populatedTask
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error updating task' });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Task creator or Team leader)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const team = await Team.findById(task.team);
    const isLeader = team.leader.toString() === req.user._id.toString();
    const isCreator = task.createdBy.toString() === req.user._id.toString();

    if (!isLeader && !isCreator) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only team leader or task creator can delete this task'
      });
    }

    await Task.findByIdAndDelete(task._id);

    // Get updated project progress
    const totalTasks = await Task.countDocuments({ project: task.project });
    const completedTasks = await Task.countDocuments({
      project: task.project,
      status: 'Completed'
    });
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      projectProgress: {
        totalTasks,
        completedTasks,
        progress
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error deleting task' });
  }
};

module.exports = {
  createTask,
  getTasksByProject,
  updateTaskStatus,
  updateTask,
  deleteTask
};
