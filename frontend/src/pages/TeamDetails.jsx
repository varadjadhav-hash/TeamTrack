import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosClient';
import {
  Users,
  FolderKanban,
  Crown,
  Copy,
  Check,
  Plus,
  Trash2,
  LogOut,
  Calendar,
  GraduationCap,
  Briefcase,
  ArrowRight,
  ShieldAlert,
  ChevronLeft
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import Modal from '../components/Modal';
import ProgressBar from '../components/ProgressBar';

const TeamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Project creation modal (Leader only)
  const [projectModal, setProjectModal] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectDeadline, setProjectDeadline] = useState('');
  const [submittingProject, setSubmittingProject] = useState(false);

  const fetchTeamDetails = async () => {
    try {
      const { data } = await api.get(`/teams/${id}`);
      if (data.success) {
        setTeam(data.team);
      }
    } catch (err) {
      console.error('Error fetching team:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Could not load team details'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamDetails();
  }, [id]);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectTitle.trim()) return;

    setSubmittingProject(true);
    try {
      const { data } = await api.post('/projects', {
        title: projectTitle.trim(),
        description: projectDesc.trim(),
        teamId: id,
        deadline: projectDeadline || null
      });

      if (data.success) {
        setFeedback({
          type: 'success',
          message: `Project "${data.project.title}" created successfully!`
        });
        setProjectModal(false);
        setProjectTitle('');
        setProjectDesc('');
        setProjectDeadline('');
        fetchTeamDetails();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to create project'
      });
    } finally {
      setSubmittingProject(false);
    }
  };

  const handleRemoveMember = async (memberUserId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this team?`)) {
      return;
    }

    try {
      const { data } = await api.delete(`/teams/${id}/members/${memberUserId}`);
      if (data.success) {
        setFeedback({ type: 'success', message: data.message });
        fetchTeamDetails();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Could not remove member'
      });
    }
  };

  const handleLeaveTeam = async () => {
    if (!window.confirm('Are you sure you want to leave this team?')) return;

    try {
      const { data } = await api.delete(`/teams/${id}/members/${user._id}`);
      if (data.success) {
        navigate('/teams');
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Could not leave team'
      });
    }
  };

  const handleDeleteTeam = async () => {
    if (!window.confirm('CAUTION: Deleting this team will remove all associated projects and tasks permanently. Are you sure?')) {
      return;
    }

    try {
      const { data } = await api.delete(`/teams/${id}`);
      if (data.success) {
        navigate('/teams');
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Could not delete team'
      });
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading team details..." size="lg" />;
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-slate-800">Team not found or access denied</h2>
        <Link to="/teams" className="text-indigo-600 font-semibold mt-2 inline-block">
          Return to Teams
        </Link>
      </div>
    );
  }

  const isLeader = team.leader?._id === user?._id || team.leader === user?._id;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Back button */}
      <div>
        <Link
          to="/teams"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to all teams</span>
        </Link>
      </div>

      {feedback && (
        <Alert
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      {/* Team Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${
                isLeader
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
              }`}
            >
              {isLeader && <Crown className="w-3.5 h-3.5 text-amber-500" />}
              <span>{isLeader ? 'You are Team Leader' : 'You are Member'}</span>
            </span>

            {/* Invite Code Pill with Copy */}
            <button
              onClick={() => handleCopyCode(team.inviteCode)}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-xs font-mono font-bold transition-all"
              title="Click to copy invite code"
            >
              <span>Code: {team.inviteCode}</span>
              {copiedCode ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {team.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            {team.description || 'No mission description provided.'}
          </p>
        </div>

        {/* Action Controls: Leave or Delete */}
        <div className="flex items-center gap-2 self-end md:self-center">
          {isLeader ? (
            <button
              onClick={handleDeleteTeam}
              className="flex items-center gap-1.5 px-3.5 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Team</span>
            </button>
          ) : (
            <button
              onClick={handleLeaveTeam}
              className="flex items-center gap-1.5 px-3.5 py-2 text-slate-600 hover:bg-slate-100 border border-slate-200 text-xs font-semibold rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Leave Team</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid: Projects (Left 2 cols) & Members (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Projects */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Projects</h2>
              <p className="text-xs text-slate-500">Track tasks and actual progress calculated from milestones</p>
            </div>

            {isLeader ? (
              <button
                onClick={() => setProjectModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </button>
            ) : (
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                Leader creates projects
              </span>
            )}
          </div>

          {team.projects?.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <FolderKanban className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No projects yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
                {isLeader
                  ? 'Start by creating the first project for this squad to assign tasks to members.'
                  : 'The team leader has not created any projects yet.'}
              </p>
              {isLeader && (
                <button
                  onClick={() => setProjectModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Create First Project
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {team.projects?.map((proj) => (
                <div
                  key={proj._id}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                        {proj.status}
                      </span>
                      {proj.deadline && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(proj.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{proj.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {proj.description || 'No project description.'}
                    </p>
                  </div>

                  {/* Real-time Progress Bar */}
                  <div className="mt-5 pt-3 border-t border-slate-100">
                    <ProgressBar progress={proj.progress || 0} size="sm" />
                    <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium mt-1.5">
                      <span>{proj.completedTasks || 0} of {proj.totalTasks || 0} tasks done</span>
                      <Link
                        to={`/projects/${proj._id}`}
                        className="text-indigo-600 hover:text-indigo-700 font-bold inline-flex items-center gap-0.5"
                      >
                        Board <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Members List */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Squad Members</h2>
            <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
              {team.members?.length || 0}
            </span>
          </div>

          <div className="space-y-3">
            {team.members?.map((m) => {
              const u = m.user;
              const isMemberLeader = team.leader?._id === u?._id || team.leader === u?._id;
              const isStudent = u?.role === 'Student';

              return (
                <div
                  key={u?._id || Math.random()}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-sm">
                      {u?.name ? u.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900 truncate">{u?.name}</p>
                        {isMemberLeader && (
                          <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" title="Team Leader" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{u?.email}</p>

                      {/* Account Role Tag & Org */}
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isStudent ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isStudent ? <GraduationCap className="w-2.5 h-2.5" /> : <Briefcase className="w-2.5 h-2.5" />}
                          <span>{u?.role}</span>
                        </span>
                        {u?.organization && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                            • {u.organization}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Leader can remove other members */}
                  {isLeader && !isMemberLeader && (
                    <button
                      onClick={() => handleRemoveMember(u._id, u.name)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal: Create Project (Leader Only) */}
      <Modal
        isOpen={projectModal}
        onClose={() => setProjectModal(false)}
        title="Create New Project"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Project Title *
            </label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="e.g. Mobile App Redesign, ML Recommendation Pipeline"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              placeholder="Project goals, milestones, and scope"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Deadline
            </label>
            <input
              type="date"
              value={projectDeadline}
              onChange={(e) => setProjectDeadline(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setProjectModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingProject || !projectTitle.trim()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md disabled:opacity-60 transition-colors"
            >
              {submittingProject ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeamDetails;
