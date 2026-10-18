import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosClient';
import {
  Users,
  FolderKanban,
  CheckCircle2,
  Clock,
  PlusCircle,
  LogIn,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  Calendar,
  Layers
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import ProgressBar from '../components/ProgressBar';
import Modal from '../components/Modal';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Modals for quick actions
  const [createTeamModal, setCreateTeamModal] = useState(false);
  const [joinTeamModal, setJoinTeamModal] = useState(false);

  // Form states
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const fetchDashboardStats = async () => {
    try {
      const { data } = await api.get('/dashboard/stats');
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setFeedback({ type: 'error', message: 'Failed to load dashboard metrics' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    setModalSubmitting(true);
    try {
      const { data } = await api.post('/teams', {
        name: newTeamName,
        description: newTeamDesc
      });
      if (data.success) {
        setFeedback({
          type: 'success',
          message: `Team "${data.team.name}" created! Invite code is: ${data.team.inviteCode}`
        });
        setCreateTeamModal(false);
        setNewTeamName('');
        setNewTeamDesc('');
        fetchDashboardStats();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Could not create team'
      });
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;

    setModalSubmitting(true);
    try {
      const { data } = await api.post('/teams/join', {
        inviteCode: inviteCodeInput.trim().toUpperCase()
      });
      if (data.success) {
        setFeedback({
          type: 'success',
          message: data.message || `Joined team successfully!`
        });
        setJoinTeamModal(false);
        setInviteCodeInput('');
        fetchDashboardStats();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Invalid or expired invite code'
      });
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const { data } = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      if (data.success) {
        // Optimistically update in state
        setStats((prev) => {
          if (!prev) return prev;
          const updatedTasks = prev.myTasks.map((t) =>
            t._id === taskId ? { ...t, status: newStatus } : t
          );
          const completedCount = updatedTasks.filter((t) => t.status === 'Completed').length;
          const todoCount = updatedTasks.filter((t) => t.status === 'To Do').length;
          const inProgressCount = updatedTasks.filter((t) => t.status === 'In Progress').length;
          const completionRate =
            updatedTasks.length > 0
              ? Math.round((completedCount / updatedTasks.length) * 100)
              : 0;

          return {
            ...prev,
            myTasks: updatedTasks,
            completedCount,
            todoCount,
            inProgressCount,
            completionRate
          };
        });
        setFeedback({ type: 'success', message: `Task status updated to "${newStatus}"` });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update task status'
      });
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your workspace..." size="lg" />;
  }

  const isStudent = user?.role === 'Student';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-600/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold mb-3 border border-white/20">
            <span>{isStudent ? '🎓 Student Workspace' : '💼 Enterprise Workspace'}</span>
            <span>•</span>
            <span>{user?.organization || 'Independent'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Hello, {user?.name}! 👋
          </h1>
          <p className="text-indigo-100 text-sm mt-1 max-w-xl">
            Track your team performance, collaborate on active milestones, and manage tasks seamlessly in real time.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setCreateTeamModal(true)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all hover:scale-105"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Team</span>
          </button>
          <button
            onClick={() => setJoinTeamModal(true)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500/30 hover:bg-indigo-500/40 text-white font-bold rounded-xl text-xs sm:text-sm border border-white/30 backdrop-blur-md transition-all hover:scale-105"
          >
            <LogIn className="w-4 h-4" />
            <span>Join with Code</span>
          </button>
        </div>
      </div>

      {feedback && (
        <Alert
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Teams */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">My Teams</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats?.totalTeams || 0}</h3>
            <Link to="/teams" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1 mt-2">
              View all teams <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Projects */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Projects</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats?.totalProjects || 0}</h3>
            <span className="text-xs text-slate-400 mt-2 block">Across all teams</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <FolderKanban className="w-6 h-6" />
          </div>
        </div>

        {/* Tasks Assigned */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned to Me</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats?.myTasksCount || 0}</h3>
            <div className="flex gap-2 text-xs font-medium text-slate-500 mt-2">
              <span className="text-amber-600">{stats?.todoCount || 0} To Do</span>
              <span>•</span>
              <span className="text-emerald-600">{stats?.completedCount || 0} Done</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Overall Completion */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">My Completion Rate</p>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mb-2">
            {stats?.completionRate || 0}%
          </div>
          <ProgressBar progress={stats?.completionRate || 0} showLabel={false} size="sm" />
        </div>
      </div>

      {/* Main Grid: My Tasks & Recent Team Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: My Tasks List */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">My Assigned Tasks</h2>
              <p className="text-xs text-slate-500">Update status directly or filter by progress</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
              {stats?.myTasks?.length || 0} total
            </span>
          </div>

          {stats?.myTasks?.length === 0 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed border-slate-100 rounded-2xl">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">No tasks assigned yet!</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Once a team leader assigns tasks to you within a project, they will appear here with quick status switchers.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats?.myTasks?.map((task) => {
                const isDone = task.status === 'Completed';
                const isInProg = task.status === 'In Progress';

                return (
                  <div
                    key={task._id}
                    className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                            task.priority === 'High'
                              ? 'bg-rose-100 text-rose-700'
                              : task.priority === 'Medium'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {task.priority}
                        </span>
                        <h4 className={`text-sm font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {task.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>Project: <strong className="text-slate-700">{task.project?.title || 'General'}</strong></span>
                        <span>•</span>
                        <span>Team: <strong className="text-slate-700">{task.team?.name || 'General'}</strong></span>
                      </div>
                    </div>

                    {/* Status Toggle Buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => handleUpdateTaskStatus(task._id, 'To Do')}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                          task.status === 'To Do'
                            ? 'bg-slate-700 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                        }`}
                      >
                        To Do
                      </button>
                      <button
                        onClick={() => handleUpdateTaskStatus(task._id, 'In Progress')}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                          isInProg
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                        }`}
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => handleUpdateTaskStatus(task._id, 'Completed')}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                          isDone
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                        }`}
                      >
                        Completed
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Recent Team Activities & Shortcuts */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Recent Team Activity</h2>
            <p className="text-xs text-slate-500 mb-4">Latest tasks posted across your teams</p>

            {stats?.recentTeamTasks?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recent team activity yet</p>
            ) : (
              <div className="space-y-3">
                {stats?.recentTeamTasks?.map((item) => (
                  <div key={item._id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {item.assignedTo ? item.assignedTo.name.charAt(0) : '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Assigned to: <span className="font-semibold">{item.assignedTo?.name || 'Unassigned'}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                        <span className={`px-1.5 py-0.5 rounded font-semibold ${
                          item.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                          item.status === 'In Progress' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {item.status}
                        </span>
                        <span className="text-slate-400">{item.team?.name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Role Guideline Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-lg">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Role Permissions
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              <strong>Team Leaders</strong> create projects, generate invite codes, and assign tasks to members.
            </p>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              <strong>Members</strong> collaborate on assigned tasks and update status to progress projects.
            </p>
          </div>
        </div>
      </div>

      {/* Modal: Create Team */}
      <Modal
        isOpen={createTeamModal}
        onClose={() => setCreateTeamModal(false)}
        title="Create a New Team"
      >
        <form onSubmit={handleCreateTeam} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Team Name *
            </label>
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="e.g. AI Research Squad, Frontend Warriors"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Team Mission / Description
            </label>
            <textarea
              rows={3}
              value={newTeamDesc}
              onChange={(e) => setNewTeamDesc(e.target.value)}
              placeholder="What is this team building or collaborating on?"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateTeamModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalSubmitting || !newTeamName.trim()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md disabled:opacity-60 transition-colors"
            >
              {modalSubmitting ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Join Team */}
      <Modal
        isOpen={joinTeamModal}
        onClose={() => setJoinTeamModal(false)}
        title="Join Team with Invite Code"
      >
        <form onSubmit={handleJoinTeam} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              6-Character Invite Code *
            </label>
            <input
              type="text"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
              placeholder="e.g. 0B8004"
              maxLength={8}
              required
              className="w-full text-center tracking-widest text-lg font-mono uppercase px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 font-bold"
            />
            <p className="text-xs text-slate-400 mt-1">
              Ask your team leader for their team's unique code to join immediately.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setJoinTeamModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalSubmitting || !inviteCodeInput.trim()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md disabled:opacity-60 transition-colors"
            >
              {modalSubmitting ? 'Joining...' : 'Join Team'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
