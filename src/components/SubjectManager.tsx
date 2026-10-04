import React, { useState } from 'react';
import { BookOpen, Target } from 'lucide-react';
import { Subject, SessionRecord } from '../types';
import { AddAction, ConfirmDelete, PageHeader, Sheet, SheetActions } from './ui';

interface SubjectManagerProps {
  subjects: Subject[];
  sessions: SessionRecord[];
  onAddSubject: (subject: Omit<Subject, 'id'>) => void;
  onDeleteSubject: (subjectId: string) => void;
}

const PRESET_COLORS = [
  '#f43f5e', // rose
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#a855f7', // purple
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
];

export const SubjectManager: React.FC<SubjectManagerProps> = ({
  subjects,
  sessions,
  onAddSubject,
  onDeleteSubject,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [targetDailyMinutes, setTargetDailyMinutes] = useState(60);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddSubject({
      name: name.trim(),
      color,
      targetDailyMinutes: Math.max(10, targetDailyMinutes),
    });
    setName('');
    setIsAdding(false);
  };

  // Compute total minutes per subject
  const subjectTotals = sessions.reduce((acc, s) => {
    if (s.mode === 'focus' && s.subjectId) {
      acc[s.subjectId] = (acc[s.subjectId] || 0) + s.durationMinutes;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="glass-panel rounded-3xl p-5 sm:p-6">
      <PageHeader
        icon={
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
        }
        title="Subjects"
        subtitle={`${subjects.length} ${subjects.length === 1 ? 'subject' : 'subjects'}`}
        action={
          <AddAction
            label="New subject"
            onClick={() => setIsAdding(true)}
            accent="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 shadow-indigo-500/30"
          />
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {subjects.map((sub) => {
          const totalMins = subjectTotals[sub.id] || 0;
          const totalHours = (totalMins / 60).toFixed(1);

          return (
            <div
              key={sub.id}
              className="flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0"
                  style={{ backgroundColor: sub.color, boxShadow: `0 0 10px ${sub.color}88` }}
                />
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-slate-100 truncate">{sub.name}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span className="font-mono font-medium">{totalHours}h studied</span>
                    <span aria-hidden>•</span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-slate-500" />
                      {sub.targetDailyMinutes}m/day
                    </span>
                  </div>
                </div>
              </div>

              {subjects.length > 1 && (
                <ConfirmDelete onConfirm={() => onDeleteSubject(sub.id)} label="Delete subject" />
              )}
            </div>
          );
        })}
      </div>

      <Sheet open={isAdding} title="New subject" onClose={() => setIsAdding(false)}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="subject-name" className="text-xs font-semibold text-slate-400 block mb-1.5">
              Name
            </label>
            <input
              id="subject-name"
              type="text"
              placeholder="e.g. Organic Chemistry"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3.5 bg-slate-950/70 border border-white/10 rounded-xl text-sm text-slate-100 placeholder-slate-500"
              autoFocus
            />
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-2">Color</span>
            <div className="grid grid-cols-8 gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                  aria-pressed={color === c}
                  className={`aspect-square rounded-full transition-all ${
                    color === c
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-105'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1.5">Daily target</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTargetDailyMinutes((m) => Math.max(10, m - 10))}
                aria-label="Decrease target by 10 minutes"
                className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-lg font-bold text-white"
              >
                −
              </button>
              <span className="min-w-[4.5rem] text-center text-lg font-bold font-mono text-white">
                {targetDailyMinutes}
                <span className="text-xs text-slate-400 font-sans font-normal ml-1">min</span>
              </span>
              <button
                type="button"
                onClick={() => setTargetDailyMinutes((m) => m + 10)}
                aria-label="Increase target by 10 minutes"
                className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-lg font-bold text-white"
              >
                +
              </button>
            </div>
          </div>

          <SheetActions
            onCancel={() => setIsAdding(false)}
            submitLabel="Save subject"
            accent="bg-indigo-500 hover:bg-indigo-400 shadow-indigo-500/25"
          />
        </form>
      </Sheet>
    </div>
  );
};
