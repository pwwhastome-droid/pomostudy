import React, { useState } from 'react';
import { Brain, CheckCircle2, Circle, Calendar, Sparkles, TrendingUp } from 'lucide-react';
import { SpacedItem, Subject } from '../types';
import { SubjectSelect } from './SubjectSelect';
import { AddAction, ConfirmDelete, Segmented, Sheet, SheetActions } from './ui';
import { localDateStr } from '../utils/date';

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
  const [studyDate, setStudyDate] = useState(() => localDateStr());
  const [notes, setNotes] = useState('');
  const [filter, setFilter] = useState<'due' | 'all' | 'completed'>('due');

  const todayStr = localDateStr();
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
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">Spaced recall</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review each topic after 1, 3, 7 and 14 days.
              </p>
            </div>
          </div>

          <AddAction
            label="Add topic"
            onClick={() => setIsAdding(true)}
            accent="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 shadow-amber-500/30"
          />
        </div>

        {/* Quick Review Stats Bar */}
        <div className="grid grid-cols-3 gap-2.5 mt-5 pt-5 border-t border-white/5 text-xs">
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5 text-center">
            <div className="font-mono text-xl font-extrabold text-amber-400">{dueCount}</div>
            <div className="text-[11px] text-slate-400 font-semibold mt-0.5">Due today</div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5 text-center">
            <div className="font-mono text-xl font-extrabold text-white">{items.length}</div>
            <div className="text-[11px] text-slate-400 font-semibold mt-0.5">Topics</div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5 text-center">
            <div className="font-mono text-xl font-extrabold text-emerald-400">
              {itemsWithDueSteps.filter((i) => i.isFullyCompleted).length}
            </div>
            <div className="text-[11px] text-slate-400 font-semibold mt-0.5">Mastered</div>
          </div>
        </div>
      </div>

      <Sheet open={isAdding} title="Add a topic to review" onClose={() => setIsAdding(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="spaced-title" className="text-xs font-semibold text-slate-400 block mb-1.5">
              What did you study?
            </label>
            <input
              id="spaced-title"
              type="text"
              placeholder="e.g. Biology – Cellular respiration"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 px-3.5 bg-slate-950/80 border border-white/10 rounded-xl text-sm text-slate-100 placeholder-slate-500"
              autoFocus
            />
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1.5">Subject</span>
            <SubjectSelect
              subjects={subjects}
              selectedSubject={subjects.find((s) => s.id === subjectId) || null}
              onSelect={(sub) => setSubjectId(sub.id)}
              size="md"
            />
          </div>

          <div>
            <label htmlFor="spaced-date" className="text-xs font-semibold text-slate-400 block mb-1.5">
              Date studied
            </label>
            <div className="flex items-center gap-2 bg-slate-950/80 px-3 h-11 rounded-xl border border-white/10">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                id="spaced-date"
                type="date"
                value={studyDate}
                onChange={(e) => setStudyDate(e.target.value)}
                className="flex-1 bg-transparent text-sm font-semibold text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="spaced-notes" className="text-xs font-semibold text-slate-400 block mb-1.5">
              Notes (optional)
            </label>
            <input
              id="spaced-notes"
              type="text"
              placeholder="Key concepts, page numbers, flashcard link"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-11 px-3.5 bg-slate-950/80 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500"
            />
          </div>

          <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2">
            <TrendingUp className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span>Reviews are scheduled for +1, +3, +7 and +14 days after the date studied.</span>
          </div>

          <SheetActions
            onCancel={() => setIsAdding(false)}
            submitLabel="Start schedule"
            accent="bg-amber-500 hover:bg-amber-400 shadow-amber-500/25"
          />
        </form>
      </Sheet>

      {/* Filter Tabs */}
      <Segmented
        value={filter}
        onChange={setFilter}
        activeClass="bg-amber-500/20 text-amber-200"
        options={[
          { value: 'due', label: `Due (${dueCount})` },
          { value: 'all', label: `All (${items.length})` },
          { value: 'completed', label: `Mastered (${itemsWithDueSteps.filter((i) => i.isFullyCompleted).length})` },
        ]}
      />

      {/* Spaced Topics List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="glass-panel text-center py-12 text-slate-500 text-xs rounded-3xl space-y-2">
            <Brain className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-400">
              {filter === 'due' ? 'No reviews due today. Nice work keeping up.' : 'No topics yet.'}
            </p>
            <p className="text-[11px] text-slate-500">Tap the + button when you finish studying a chapter.</p>
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
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className="text-base font-bold text-white break-words">{item.title}</h3>
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

                  <ConfirmDelete onConfirm={() => onDeleteItem(item.id)} label="Delete topic" />
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                    <span>Progress</span>
                    <span className="font-mono text-white">{completedCount} of 4 reviews done</span>
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
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/20'
                            : 'bg-slate-950/60 border-white/5 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-extrabold">
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
                            <span className="text-amber-300">Due today</span>
                          ) : (
                            <span className="text-slate-400">Scheduled</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {!item.isFullyCompleted && (
                  <button
                    type="button"
                    onClick={() => onFocusItem(item.title, item.subjectId)}
                    className="w-full h-11 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-sm font-bold border border-rose-500/30 transition flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Start a focus session on this topic</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
