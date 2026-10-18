const Project = require('../models/Project');
const Team = require('../models/Team');
const Task = require('../models/Task');

// Helper to calculate progress for a project
const calculateProjectProgress = async (projectId) => {
  const totalTasks = await Task.countDocuments({ project: projectId });
  const completedTasks = await Task.countDocuments({
    project: projectId,
    status: 'Completed'
  });
  const inProgressTasks = await Task.countDocuments({
    project: projectId,
    status: 'In Progress'
  });
  const todoTasks = await Task.countDocuments({
    project: projectId,
    status: 'To Do'
  });

  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    todoTasks,
    progress
  };
};

// @desc    Create a project within a team (Team Leader only)
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const { title, description, teamId, deadline, status } = req.body;

    if (!title || !teamId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide project title and team ID'
      });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Role Permission: Only team leader can create projects
    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only team leaders can create projects'
      });
    }

    const project = await Project.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      team: team._id,
      createdBy: req.user._id,
      deadline: deadline || null,
      status: status || 'In Progress'
    });

    const populatedProject = await Project.findById(project._id)
      .populate('team', 'name leader')
      .populate('createdBy', 'name email');

    const projObj = populatedProject.toObject();
    projObj.progress = 0;
    projObj.totalTasks = 0;
    projObj.completedTasks = 0;

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: projObj
    });
  } catch (error) {
    console.error('Create Project Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error creating project' });
  }
};

// @desc    Get all projects for a team
// @route   GET /api/projects/team/:teamId
// @access  Private (Team members only)
const getProjectsByTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Check if user is member
    const isMember = team.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this team'
      });
    }

    const projects = await Project.find({ team: teamId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const projectsWithProgress = await Promise.all(
      projects.map(async (p) => {
        const stats = await calculateProjectProgress(p._id);
        const obj = p.toObject();
        return { ...obj, ...stats };
      })
    );

    return res.status(200).json({
      success: true,
      count: projectsWithProgress.length,
      projects: projectsWithProgress
    });
  } catch (error) {
    console.error('Get Team Projects Error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving projects' });
  }
};

// @desc    Get single project with tasks and computed progress
// @route   GET /api/projects/:id
// @access  Private (Team members only)
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('team', 'name leader inviteCode members')
      .populate('createdBy', 'name email');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check membership in team
    const team = await Team.findById(project.team._id)
      .populate('members.user', 'name email role organization skills');

    const isMember = team.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this team'
      });
    }

    // Fetch tasks for this project
    const tasks = await Task.find({ project: project._id })
      .populate('assignedTo', 'name email role organization')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const stats = await calculateProjectProgress(project._id);

    const projObj = project.toObject();
    projObj.team = team;
    projObj.tasks = tasks;
    projObj.isLeader = team.leader.toString() === req.user._id.toString();

    return res.status(200).json({
      success: true,
      project: {
        ...projObj,
        ...stats
      }
    });
  } catch (error) {
    console.error('Get Project By ID Error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving project' });
  }
};

// @desc    Update project (Team Leader only)
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res) => {
  try {
    const { title, description, deadline, status } = req.body;
    const project = await Project.findById(req.params.id).populate('team');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Role check: Only team leader can update project
    if (project.team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only team leaders can update projects'
      });
    }

    if (title) project.title = title.trim();
    if (description !== undefined) project.description = description.trim();
    if (deadline !== undefined) project.deadline = deadline;
    if (status) project.status = status;

    await project.save();

    const stats = await calculateProjectProgress(project._id);

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      project: {
        ...project.toObject(),
        ...stats
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error updating project' });
  }
};

// @desc    Delete project (Team Leader only)
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('team');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Role check: Only team leader can delete project
    if (project.team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only team leaders can delete projects'
      });
    }

    await Task.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(project._id);

    return res.status(200).json({
      success: true,
      message: 'Project and all associated tasks deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error deleting project' });
  }
};

module.exports = {
  createProject,
  getProjectsByTeam,
  getProjectById,
  updateProject,
  deleteProject
};
