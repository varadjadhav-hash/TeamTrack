import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosClient';
import {
  Users,
  Plus,
  LogIn,
  Copy,
  Check,
  FolderKanban,
  Crown,
  Search,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import Modal from '../components/Modal';

const Teams = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [joinModal, setJoinModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTeams = async () => {
    try {
      const { data } = await api.get('/teams');
      if (data.success) {
        setTeams(data.teams);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
      setFeedback({ type: 'error', message: 'Failed to load teams' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    setSubmitting(true);
    try {
      const { data } = await api.post('/teams', {
        name: teamName,
        description: teamDesc
      });
      if (data.success) {
        setFeedback({
          type: 'success',
          message: `Team "${data.team.name}" created! Invite Code: ${data.team.inviteCode}`
        });
        setCreateModal(false);
        setTeamName('');
        setTeamDesc('');
        fetchTeams();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Could not create team'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setSubmitting(true);
    try {
      const { data } = await api.post('/teams/join', {
        inviteCode: inviteCode.trim().toUpperCase()
      });
      if (data.success) {
        setFeedback({
          type: 'success',
          message: `Successfully joined ${data.team.name}!`
        });
        setJoinModal(false);
        setInviteCode('');
        fetchTeams();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Invalid or expired invite code'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your teams..." size="lg" />;
  }

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Teams & Collaboration</h1>
          <p className="text-sm text-slate-500 mt-1">
            Build squads, invite members with unique codes, and organize cross-functional projects.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setJoinModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <LogIn className="w-4 h-4 text-slate-500" />
            <span>Join with Code</span>
          </button>
          <button
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Team</span>
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

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search teams by name..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
        />
      </div>

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No teams found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            You are not part of any team matching this criteria. Create a squad or enter an invite code to get started.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md"
            >
              Create Team
            </button>
            <button
              onClick={() => setJoinModal(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              Join with Code
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTeams.map((t) => {
            const isLeader = t.leader?._id === user?._id || t.leader === user?._id;
            const memberCount = t.members?.length || 0;

            return (
              <div
                key={t._id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Top: Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        isLeader
                          ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                          : 'bg-indigo-50 text-indigo-800 border border-indigo-200/60'
                      }`}
                    >
                      {isLeader && <Crown className="w-3 h-3 text-amber-500" />}
                      <span>{isLeader ? 'Leader' : 'Member'}</span>
                    </span>

                    {/* Invite Code Badge with Copy */}
                    <button
                      onClick={() => handleCopyCode(t.inviteCode)}
                      title="Click to copy invite code"
                      className="group flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700 transition-colors"
                    >
                      <span>{t.inviteCode}</span>
                      {copiedCode === t.inviteCode ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                      )}
                    </button>
                  </div>

                  {/* Team Title & Description */}
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {t.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[32px]">
                    {t.description || 'No description provided.'}
                  </p>
                </div>

                {/* Card Bottom: Stats & Link */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {memberCount} member{memberCount !== 1 ? 's' : ''}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
                      {t.projectCount || 0} project{t.projectCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <Link
                    to={`/teams/${t._id}`}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:translate-x-0.5 transition-transform"
                  >
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Team */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Create a Team"
      >
        <form onSubmit={handleCreateTeam} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Team Name *
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Cloud Engineers, Capstone Squad"
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
              value={teamDesc}
              onChange={(e) => setTeamDesc(e.target.value)}
              placeholder="Describe your team's objective or target project"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !teamName.trim()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Join Team */}
      <Modal
        isOpen={joinModal}
        onClose={() => setJoinModal(false)}
        title="Join Team with Invite Code"
      >
        <form onSubmit={handleJoinTeam} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              6-Character Invite Code *
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="e.g. 0B8004"
              maxLength={8}
              required
              className="w-full text-center tracking-widest text-lg font-mono uppercase px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 font-bold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setJoinModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !inviteCode.trim()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Joining...' : 'Join Team'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Teams;
