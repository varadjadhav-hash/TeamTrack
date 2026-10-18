import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosClient';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Circle,
  Plus,
  Trash2,
  Calendar,
  Users,
  ChevronLeft,
  ArrowRight,
  TrendingUp,
  GraduationCap,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import Modal from '../components/Modal';
import ProgressBar from '../components/ProgressBar';

const ProjectDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Create Task Modal
  const [taskModal, setTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskStatus, setTaskStatus] = useState('To Do');
  const [submittingTask, setSubmittingTask] = useState(false);

  const fetchProjectDetails = async () => {
    try {
      const { data } = await api.get(`/projects/${id}`);
      if (data.success) {
        setProject(data.project);
      }
    } catch (err) {
      console.error('Error fetching project:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Could not load project'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    setSubmittingTask(true);
    try {
      const { data } = await api.post('/tasks', {
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        projectId: id,
        assignedTo: taskAssignee || null,
        priority: taskPriority,
        dueDate: taskDueDate || null,
        status: taskStatus
      });

      if (data.success) {
        setFeedback({
          type: 'success',
          message: `Task "${data.task.title}" created successfully!`
        });
        setTaskModal(false);
        setTaskTitle('');
        setTaskDesc('');
        setTaskAssignee('');
        setTaskDueDate('');
        fetchProjectDetails();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to create task'
      });
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const { data } = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      if (data.success) {
        // Update task and project progress in state
        setProject((prev) => {
          if (!prev) return prev;
          const updatedTasks = prev.tasks.map((t) =>
            t._id === taskId ? { ...t, status: newStatus } : t
          );
          const completedCount = updatedTasks.filter((t) => t.status === 'Completed').length;
          const totalCount = updatedTasks.length;
          const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          return {
            ...prev,
            tasks: updatedTasks,
            completedTasks: completedCount,
            totalTasks: totalCount,
            progress
          };
        });
        setFeedback({ type: 'success', message: `Task moved to "${newStatus}"` });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Could not update task status'
      });
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const { data } = await api.delete(`/tasks/${taskId}`);
      if (data.success) {
        setFeedback({ type: 'success', message: 'Task deleted' });
        fetchProjectDetails();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Could not delete task'
      });
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading project workspace..." size="lg" />;
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-slate-800">Project not found or unauthorized</h2>
        <Link to="/teams" className="text-indigo-600 font-semibold mt-2 inline-block">
          Return to Teams
        </Link>
      </div>
    );
  }

  const tasks = project.tasks || [];
  const todoTasks = tasks.filter((t) => t.status === 'To Do');
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress');
  const completedTasks = tasks.filter((t) => t.status === 'Completed');

  const teamMembers = project.team?.members || [];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top back navigation */}
      <div>
        <Link
          to={`/teams/${project.team?._id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to {project.team?.name || 'Team'}</span>
        </Link>
      </div>

      {feedback && (
        <Alert
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      {/* Project Overview Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                Team: {project.team?.name}
              </span>
              {project.deadline && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Due: {new Date(project.deadline).toLocaleDateString()}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {project.title}
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-3xl">
              {project.description || 'No project description provided.'}
            </p>
          </div>

          <button
            onClick={() => setTaskModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all self-end md:self-center shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create & Assign Task</span>
          </button>
        </div>

        {/* Dynamic Project Progress Bar */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
          <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Actual Project Completion Rate
            </span>
            <span className="text-base text-indigo-700">{project.progress || 0}%</span>
          </div>
          <ProgressBar progress={project.progress || 0} showLabel={false} size="md" />
          <div className="flex justify-between items-center text-xs text-slate-500 font-medium pt-1">
            <span>
              <strong>{project.completedTasks || 0}</strong> of <strong>{project.totalTasks || 0}</strong> tasks completed
            </span>
            <span>
              {project.inProgressTasks || inProgressTasks.length} in progress • {project.todoTasks || todoTasks.length} to do
            </span>
          </div>
        </div>
      </div>

      {/* Kanban Board Columns: To Do, In Progress, Completed */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: To Do */}
        <div className="bg-slate-100/70 rounded-3xl p-4 sm:p-5 border border-slate-200/80 flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4 text-slate-500 fill-slate-300" />
              <h3 className="font-bold text-sm text-slate-800">To Do</h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {todoTasks.length}
            </span>
          </div>

          <div className="space-y-3 flex-1">
            {todoTasks.length === 0 ? (
              <div className="h-32 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-xs text-slate-400">
                No tasks to do
              </div>
            ) : (
              todoTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  currentUser={user}
                  isLeader={project.isLeader}
                  onStatusChange={handleUpdateStatus}
                  onDelete={handleDeleteTask}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div className="bg-amber-50/50 rounded-3xl p-4 sm:p-5 border border-amber-200/60 flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm text-amber-900">In Progress</h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900">
              {inProgressTasks.length}
            </span>
          </div>

          <div className="space-y-3 flex-1">
            {inProgressTasks.length === 0 ? (
              <div className="h-32 border-2 border-dashed border-amber-200/60 rounded-2xl flex items-center justify-center text-xs text-amber-700/60">
                No active tasks
              </div>
            ) : (
              inProgressTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  currentUser={user}
                  isLeader={project.isLeader}
                  onStatusChange={handleUpdateStatus}
                  onDelete={handleDeleteTask}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 3: Completed */}
        <div className="bg-emerald-50/50 rounded-3xl p-4 sm:p-5 border border-emerald-200/60 flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-emerald-900">Completed</h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900">
              {completedTasks.length}
            </span>
          </div>

          <div className="space-y-3 flex-1">
            {completedTasks.length === 0 ? (
              <div className="h-32 border-2 border-dashed border-emerald-200/60 rounded-2xl flex items-center justify-center text-xs text-emerald-700/60">
                No completed tasks yet
              </div>
            ) : (
              completedTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  currentUser={user}
                  isLeader={project.isLeader}
                  onStatusChange={handleUpdateStatus}
                  onDelete={handleDeleteTask}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal: Create & Assign Task */}
      <Modal
        isOpen={taskModal}
        onClose={() => setTaskModal(false)}
        title="Create & Assign Task"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Implement authentication JWT middleware"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description / Instructions
            </label>
            <textarea
              rows={3}
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Provide context or acceptance criteria..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
            />
          </div>

          {/* Assignee Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Assign to Team Member
            </label>
            <select
              value={taskAssignee}
              onChange={(e) => setTaskAssignee(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
            >
              <option value="">Unassigned</option>
              {teamMembers.map((m) => {
                const u = m.user;
                return (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role} - {u.email})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Priority & Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setTaskModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingTask || !taskTitle.trim()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md disabled:opacity-60 transition-colors"
            >
              {submittingTask ? 'Creating...' : 'Assign Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Task Card Component
const TaskCard = ({ task, currentUser, isLeader, onStatusChange, onDelete }) => {
  const isDone = task.status === 'Completed';
  const isInProg = task.status === 'In Progress';
  const isTodo = task.status === 'To Do';

  const isAssignee = task.assignedTo?._id === currentUser?._id;
  const canDelete = isLeader || task.createdBy?._id === currentUser?._id;

  const assigneeRole = task.assignedTo?.role;
  const isStudent = assigneeRole === 'Student';

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow transition-all space-y-3">
      {/* Priority Pill & Delete */}
      <div className="flex items-center justify-between">
        <span
          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
            task.priority === 'High'
              ? 'bg-rose-100 text-rose-700'
              : task.priority === 'Medium'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {task.priority} Priority
        </span>

        {canDelete && (
          <button
            onClick={() => onDelete(task._id)}
            className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Title & Desc */}
      <div>
        <h4 className={`text-sm font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
        )}
      </div>

      {/* Assignee Pill */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded-full bg-slate-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
            {task.assignedTo?.name ? task.assignedTo.name.charAt(0) : '?'}
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-slate-800 truncate block text-[11px]">
              {task.assignedTo?.name || 'Unassigned'}
            </span>
            {assigneeRole && (
              <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                {isStudent ? <GraduationCap className="w-2.5 h-2.5 text-indigo-500" /> : <Briefcase className="w-2.5 h-2.5 text-emerald-500" />}
                {assigneeRole}
              </span>
            )}
          </div>
        </div>

        {task.dueDate && (
          <span className="text-[11px] text-slate-400 shrink-0">
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Status Transition Action Buttons */}
      <div className="flex items-center gap-1.5 pt-1">
        {isTodo && (
          <button
            onClick={() => onStatusChange(task._id, 'In Progress')}
            className="flex-1 py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold rounded-lg border border-amber-200 transition-colors text-center"
          >
            Start Progress →
          </button>
        )}

        {isInProg && (
          <>
            <button
              onClick={() => onStatusChange(task._id, 'To Do')}
              className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium rounded-lg transition-colors"
            >
              ← To Do
            </button>
            <button
              onClick={() => onStatusChange(task._id, 'Completed')}
              className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-sm transition-colors text-center"
            >
              Complete ✓
            </button>
          </>
        )}

        {isDone && (
          <button
            onClick={() => onStatusChange(task._id, 'In Progress')}
            className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-semibold rounded-lg transition-colors text-center"
          >
            Reopen Task
          </button>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;
