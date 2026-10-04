import React, { useState } from 'react';
import {
  Brain,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Calendar,
  Sparkles,
  X,
  TrendingUp,
} from 'lucide-react';
import { SpacedItem, Subject } from '../types';
import { SubjectSelect } from './SubjectSelect';

interface SpacedRepetitionProps {
  items: SpacedItem[];
  subjects: Subject[];
  onAddItem: (title: string, subjectId?: string, studyDate?: string, notes?: string) => void;
  onToggleStep: (itemId: string, intervalDays: number) => void;
  onDeleteItem: (itemId: string) => void;
  onFocusItem: (title: string, subjectId?: string) => void;
}

export const SpacedRepetition: React.FC<SpacedRepetitionProps> = ({
  items,
  subjects,
  onAddItem,
  onToggleStep,
  onDeleteItem,
  onFocusItem,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [studyDate, setStudyDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [filter, setFilter] = useState<'due' | 'all' | 'completed'>('due');

  const todayStr = new Date().toISOString().split('T')[0];
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddItem(title.trim(), subjectId || undefined, studyDate, notes.trim() || undefined);
    setTitle('');
    setNotes('');
    setIsAdding(false);
  };

  // Determine which items have reviews due today or overdue
  const itemsWithDueSteps = items.map((item) => {
    const dueSteps = item.steps.filter((s) => !s.completed && s.scheduledDate <= todayStr);
    const isFullyCompleted = item.steps.every((s) => s.completed);
    return {
      ...item,
      dueSteps,
      isDue: dueSteps.length > 0,
      isFullyCompleted,
    };
  });

  const dueCount = itemsWithDueSteps.filter((i) => i.isDue).length;

  const filteredItems = itemsWithDueSteps.filter((item) => {
    if (filter === 'due') return item.isDue;
    if (filter === 'completed') return item.isFullyCompleted;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Hero Card for Spaced Repetition */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <span>Spaced Repetition</span>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 uppercase tracking-widest">
                  Active Recall
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically calculates review intervals at Day 1, 3, 7, and 14 to combat the forgetting curve.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white text-xs font-extrabold shadow-lg shadow-amber-500/25 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Study Topic</span>
          </button>
        </div>

        {/* Quick Review Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/5 text-xs">
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5 flex items-center justify-between">
            <span className="text-slate-400 font-semibold">Reviews Due Today:</span>
            <span className="font-mono text-base font-extrabold text-amber-400">{dueCount}</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5 flex items-center justify-between">
            <span className="text-slate-400 font-semibold">Tracked Topics:</span>
            <span className="font-mono text-base font-extrabold text-white">{items.length}</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5 flex items-center justify-between">
            <span className="text-slate-400 font-semibold">Mastered Topics:</span>
            <span className="font-mono text-base font-extrabold text-emerald-400">
              {itemsWithDueSteps.filter((i) => i.isFullyCompleted).length}
            </span>
          </div>
        </div>
      </div>

      {/* Add Topic Drawer */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="glass-panel p-5 rounded-3xl border border-white/10 space-y-4 shadow-2xl animate-in fade-in zoom-in-95"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-amber-400" />
              <span>Record Topic for Spaced Review</span>
            </span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                Topic / Chapter Studied:
              </label>
              <input
                type="text"
                placeholder="e.g. Biology - Chapter 3: Cellular Respiration"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                Subject:
              </label>
              <SubjectSelect
                subjects={subjects}
                selectedSubject={subjects.find((s) => s.id === subjectId) || null}
                onSelect={(sub) => setSubjectId(sub.id)}
                size="md"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                Date Studied:
              </label>
              <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-2 rounded-xl border border-white/10">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={studyDate}
                  onChange={(e) => setStudyDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                Key Notes / Flashcard Link:
              </label>
              <input
                type="text"
                placeholder="Optional key concepts or page numbers..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-xs text-amber-200 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              We will schedule your 4 review stages: <strong>+1 day</strong>, <strong>+3 days</strong>, <strong>+7 days</strong>, and <strong>+14 days</strong>.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20"
            >
              Start Spaced Schedule
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('due')}
          className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition cursor-pointer ${
            filter === 'due'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'glass-pill text-slate-400 hover:text-white'
          }`}
        >
          Due For Review ({dueCount})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition cursor-pointer ${
            filter === 'all'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'glass-pill text-slate-400 hover:text-white'
          }`}
        >
          All Topics ({items.length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition cursor-pointer ${
            filter === 'completed'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'glass-pill text-slate-400 hover:text-white'
          }`}
        >
          Mastered ({itemsWithDueSteps.filter((i) => i.isFullyCompleted).length})
        </button>
      </div>

      {/* Spaced Topics List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="glass-panel text-center py-12 text-slate-500 text-xs rounded-3xl space-y-2">
            <Brain className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-400">
              {filter === 'due' ? 'No reviews due right now! Great job keeping up.' : 'No topics recorded yet.'}
            </p>
            <p className="text-[11px] text-slate-500">Tap "Record Study Topic" above when you finish studying a chapter.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const sub = item.subjectId ? subjectMap.get(item.subjectId) : undefined;
            const completedCount = item.steps.filter((s) => s.completed).length;
            const progressPercent = (completedCount / item.steps.length) * 100;

            return (
              <div
                key={item.id}
                className="glass-panel p-4 sm:p-5 rounded-3xl border border-white/10 hover:border-white/20 transition-all space-y-4"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white truncate">{item.title}</h3>
                      {sub && (
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                          style={{
                            backgroundColor: `${sub.color}20`,
                            color: sub.color,
                            border: `1px solid ${sub.color}40`,
                          }}
                        >
                          {sub.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <span>Studied: {item.studyDate}</span>
                      {item.notes && (
                        <>
                          <span>•</span>
                          <span className="truncate italic">{item.notes}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onFocusItem(item.title, item.subjectId)}
                      title="Start Pomodoro Focus on this topic"
                      className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/30 transition flex items-center gap-1.5 active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Focus Now</span>
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      title="Delete topic"
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                    <span>Recall Retention Progress</span>
                    <span className="font-mono text-white">{completedCount} of 4 stages complete</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950/80 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* The 4 Spaced Repetition Stage Badges (1d, 3d, 7d, 14d) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  {item.steps.map((step) => {
                    const isDue = !step.completed && step.scheduledDate <= todayStr;

                    return (
                      <button
                        key={step.intervalDays}
                        type="button"
                        onClick={() => onToggleStep(item.id, step.intervalDays)}
                        className={`p-3 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between ${
                          step.completed
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : isDue
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/20 animate-pulse'
                            : 'bg-slate-950/60 border-white/5 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-extrabold uppercase tracking-wide">
                            Day {step.intervalDays}
                          </span>
                          {step.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-500" />
                          )}
                        </div>

                        <div className="text-[11px] font-mono">
                          {step.scheduledDate}
                        </div>

                        <div className="mt-1 text-[10px] font-bold">
                          {step.completed ? (
                            <span className="text-emerald-400">Reviewed ✓</span>
                          ) : isDue ? (
                            <span className="text-amber-300">Due Today!</span>
                          ) : (
                            <span className="text-slate-400">Scheduled</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
