import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Filter,
  ExternalLink,
  Edit2,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Code2,
  Tag,
  Loader2,
} from 'lucide-react';
import {
  Problem,
  TOPICS,
  DIFFICULTIES,
  STATUSES,
  PLATFORMS,
  ProblemFilters,
} from '../../types/problem';
import problemService from '../../services/problemService';
import { ProblemModal } from './ProblemModal';

export const ProblemList: React.FC = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);

  const fetchProblems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: ProblemFilters = {};
      if (search.trim()) filters.search = search.trim();
      if (selectedTopic) filters.topic = selectedTopic;
      if (selectedDifficulty) filters.difficulty = selectedDifficulty;
      if (selectedStatus) filters.status = selectedStatus;
      if (selectedPlatform) filters.platform = selectedPlatform;

      const data = await problemService.getProblems(filters);
      setProblems(data.problems);
    } catch (err: unknown) {
      console.error('Failed to load problems:', err);
      setError('Unable to load problems. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [search, selectedTopic, selectedDifficulty, selectedStatus, selectedPlatform]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const handleCreateOrUpdate = async (data: Partial<Problem>) => {
    if (editingProblem) {
      await problemService.updateProblem(editingProblem._id, data);
    } else {
      await problemService.createProblem(data);
    }
    await fetchProblems();
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await problemService.deleteProblem(id);
        await fetchProblems();
      } catch (err) {
        console.error('Failed to delete problem:', err);
      }
    }
  };

  const openAddModal = () => {
    setEditingProblem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (problem: Problem) => {
    setEditingProblem(problem);
    setIsModalOpen(true);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedTopic('');
    setSelectedDifficulty('');
    setSelectedStatus('');
    setSelectedPlatform('');
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Hard':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Mastered':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Solved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Attempted':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto my-8">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Code2 className="w-5 h-5 text-emerald-400" />
            DSA Problem Library
            <span className="ml-2 px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 text-xs font-mono">
              {problems.length} {problems.length === 1 ? 'problem' : 'problems'}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Organize problems by topic, track difficulty distribution, and record solving notes.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Problem
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mb-3">
          {/* Search Input */}
          <div className="sm:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search problems, notes, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Topic Filter */}
          <select
            aria-label="Filter by Topic"
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Topics</option>
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            aria-label="Filter by Difficulty"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Difficulties</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            aria-label="Filter by Status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Platform Filter */}
          <select
            aria-label="Filter by Platform"
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Platforms</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Badges & Reset */}
        {(search || selectedTopic || selectedDifficulty || selectedStatus || selectedPlatform) && (
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800 text-slate-400">
            <span className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              Active filters applied
            </span>
            <button
              onClick={clearFilters}
              className="text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Error Notice */}
      {error && (
        <div className="flex items-center gap-2 p-3 mb-6 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Problem List Display */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mr-2" />
          <span className="text-sm">Loading problem repository...</span>
        </div>
      ) : problems.length === 0 ? (
        <div className="text-center p-12 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
          <div className="w-12 h-12 mx-auto rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mb-3">
            <Code2 className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">No Problems Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
            {search || selectedTopic || selectedDifficulty || selectedStatus
              ? 'No problems match the current filter criteria. Try resetting filters.'
              : 'Your practice repository is empty. Add your first DSA problem to get started!'}
          </p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            Add First Problem
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {problems.map((problem) => (
            <div
              key={problem._id}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              {/* Problem Left Details */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-white tracking-tight truncate">
                    {problem.title}
                  </span>

                  {problem.problemUrl && (
                    <a
                      href={problem.problemUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-500 hover:text-emerald-400 transition-colors inline-flex items-center"
                      title="Open in platform"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getDifficultyBadge(
                      problem.difficulty
                    )}`}
                  >
                    {problem.difficulty}
                  </span>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(
                      problem.status
                    )}`}
                  >
                    {problem.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                  <span className="inline-flex items-center gap-1 font-mono text-slate-300">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    {problem.topic}
                  </span>

                  <span className="text-slate-600">&bull;</span>

                  <span className="text-slate-400">{problem.platform}</span>

                  <span className="text-slate-600">&bull;</span>

                  <span className="inline-flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                    <Clock className="w-3 h-3" />
                    {problem.estimatedTimeMinutes} mins
                  </span>

                  {problem.tags && problem.tags.length > 0 && (
                    <>
                      <span className="text-slate-600">&bull;</span>
                      <div className="inline-flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-500" />
                        {problem.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {problem.notes && (
                  <p className="text-xs text-slate-400/90 line-clamp-1 italic mt-1">
                    "{problem.notes}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => openEditModal(problem)}
                  aria-label={`Edit ${problem.title}`}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Edit Problem"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(problem._id, problem.title)}
                  aria-label={`Delete ${problem.title}`}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Delete Problem"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <ProblemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={editingProblem}
      />
    </div>
  );
};

export default ProblemList;
