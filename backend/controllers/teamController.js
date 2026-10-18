const Team = require('../models/Team');
const Project = require('../models/Project');
const Task = require('../models/Task');

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private
const createTeam = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Team name is required' });
    }

    const team = await Team.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      leader: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'Leader',
          joinedAt: new Date()
        }
      ]
    });

    const populatedTeam = await Team.findById(team._id)
      .populate('leader', 'name email role organization')
      .populate('members.user', 'name email role organization skills');

    return res.status(201).json({
      success: true,
      message: 'Team created successfully',
      team: populatedTeam
    });
  } catch (error) {
    console.error('Create Team Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error creating team' });
  }
};

// @desc    Get all teams for logged-in user
// @route   GET /api/teams
// @access  Private
const getMyTeams = async (req, res) => {
  try {
    const teams = await Team.find({ 'members.user': req.user._id })
      .populate('leader', 'name email role organization')
      .populate('members.user', 'name email role organization skills')
      .sort({ updatedAt: -1 });

    // Also get project counts for each team
    const teamsWithCounts = await Promise.all(
      teams.map(async (t) => {
        const projectCount = await Project.countDocuments({ team: t._id });
        const obj = t.toObject();
        obj.projectCount = projectCount;
        return obj;
      })
    );

    return res.status(200).json({
      success: true,
      count: teamsWithCounts.length,
      teams: teamsWithCounts
    });
  } catch (error) {
    console.error('Get Teams Error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving teams' });
  }
};

// @desc    Get team by ID
// @route   GET /api/teams/:id
// @access  Private (members only)
const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('leader', 'name email role organization')
      .populate('members.user', 'name email role organization skills');

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Check membership
    const isMember = team.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this team'
      });
    }

    // Fetch team's projects
    const projects = await Project.find({ team: team._id })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Fetch progress for each project
    const projectsWithProgress = await Promise.all(
      projects.map(async (proj) => {
        const totalTasks = await Task.countDocuments({ project: proj._id });
        const completedTasks = await Task.countDocuments({
          project: proj._id,
          status: 'Completed'
        });
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const projObj = proj.toObject();
        projObj.totalTasks = totalTasks;
        projObj.completedTasks = completedTasks;
        projObj.progress = progress;
        return projObj;
      })
    );

    const teamObj = team.toObject();
    teamObj.projects = projectsWithProgress;

    return res.status(200).json({
      success: true,
      team: teamObj
    });
  } catch (error) {
    console.error('Get Team By ID Error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving team' });
  }
};

// @desc    Join a team via invite code
// @route   POST /api/teams/join
// @access  Private
const joinTeamByCode = async (req, res) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode || !inviteCode.trim()) {
      return res.status(400).json({ success: false, message: 'Invite code is required' });
    }

    const cleanCode = inviteCode.trim().toUpperCase();
    const team = await Team.findOne({ inviteCode: cleanCode });

    if (!team) {
      return res.status(404).json({ success: false, message: 'Invalid invite code. No team found' });
    }

    // Check if already a member
    const alreadyMember = team.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'You are already a member of this team' });
    }

    team.members.push({
      user: req.user._id,
      role: 'Member',
      joinedAt: new Date()
    });

    await team.save();

    const populatedTeam = await Team.findById(team._id)
      .populate('leader', 'name email role organization')
      .populate('members.user', 'name email role organization skills');

    return res.status(200).json({
      success: true,
      message: `Successfully joined ${team.name}!`,
      team: populatedTeam
    });
  } catch (error) {
    console.error('Join Team Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error joining team' });
  }
};

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private (Leader only)
const updateTeam = async (req, res) => {
  try {
    const { name, description } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Role check: Only leader can update team
    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only team leaders can update team settings'
      });
    }

    if (name) team.name = name.trim();
    if (description !== undefined) team.description = description.trim();

    await team.save();

    const updated = await Team.findById(team._id)
      .populate('leader', 'name email role organization')
      .populate('members.user', 'name email role organization skills');

    return res.status(200).json({
      success: true,
      message: 'Team updated successfully',
      team: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error updating team' });
  }
};

// @desc    Remove member or leave team
// @route   DELETE /api/teams/:id/members/:userId
// @access  Private (Leader or self)
const removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const team = await Team.findById(id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const isLeader = team.leader.toString() === req.user._id.toString();
    const isSelf = req.user._id.toString() === userId;

    if (!isLeader && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: You can only remove members if you are team leader or leaving yourself'
      });
    }

    // Prevent team leader from leaving without transferring leadership or deleting
    if (team.leader.toString() === userId && team.members.length > 1) {
      return res.status(400).json({
        success: false,
        message: 'Team leader cannot leave before transferring leadership'
      });
    }

    team.members = team.members.filter((m) => m.user.toString() !== userId);
    await team.save();

    return res.status(200).json({
      success: true,
      message: isSelf ? 'You have left the team' : 'Member removed successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error removing member' });
  }
};

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Private (Leader only)
const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only team leaders can delete a team'
      });
    }

    // Delete tasks and projects belonging to this team
    await Task.deleteMany({ team: team._id });
    await Project.deleteMany({ team: team._id });
    await Team.findByIdAndDelete(team._id);

    return res.status(200).json({
      success: true,
      message: 'Team and all its projects/tasks deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error deleting team' });
  }
};

module.exports = {
  createTeam,
  getMyTeams,
  getTeamById,
  joinTeamByCode,
  updateTeam,
  removeMember,
  deleteTeam
};
