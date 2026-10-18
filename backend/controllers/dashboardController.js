const Team = require('../models/Team');
const Project = require('../models/Project');
const Task = require('../models/Task');

// @desc    Get dashboard summary statistics for authenticated user
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's teams
    const teams = await Team.find({ 'members.user': userId });
    const teamIds = teams.map((t) => t._id);

    // Get projects in those teams
    const projects = await Project.find({ team: { $in: teamIds } });
    const projectIds = projects.map((p) => p._id);

    // Get tasks assigned to this user
    const myTasks = await Task.find({ assignedTo: userId })
      .populate('project', 'title')
      .populate('team', 'name')
      .sort({ updatedAt: -1 });

    const todoTasks = myTasks.filter((t) => t.status === 'To Do');
    const inProgressTasks = myTasks.filter((t) => t.status === 'In Progress');
    const completedTasks = myTasks.filter((t) => t.status === 'Completed');

    // Recent tasks across user's teams
    const recentTeamTasks = await Task.find({ team: { $in: teamIds } })
      .populate('assignedTo', 'name email role')
      .populate('project', 'title')
      .populate('team', 'name')
      .sort({ createdAt: -1 })
      .limit(6);

    // Progress across all user projects
    const totalAssignedTasks = myTasks.length;
    const userCompletionRate =
      totalAssignedTasks > 0
        ? Math.round((completedTasks.length / totalAssignedTasks) * 100)
        : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalTeams: teams.length,
        totalProjects: projects.length,
        myTasksCount: totalAssignedTasks,
        todoCount: todoTasks.length,
        inProgressCount: inProgressTasks.length,
        completedCount: completedTasks.length,
        completionRate: userCompletionRate,
        myTasks: myTasks.slice(0, 10), // latest 10
        recentTeamTasks
      }
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving dashboard statistics'
    });
  }
};

module.exports = { getDashboardStats };
