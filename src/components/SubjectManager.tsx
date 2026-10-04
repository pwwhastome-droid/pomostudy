import React, { useState } from 'react';
import { Plus, Trash2, BookOpen, Target } from 'lucide-react';
import { Subject, SessionRecord } from '../types';

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
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Study Subjects</span>
          </h2>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-xs font-semibold border border-indigo-500/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Subject</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-4 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-3">
          <input
            type="text"
            placeholder="Subject name (e.g. Organic Chemistry, Algorithms)..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            autoFocus
          />

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Color:</span>
            <div className="flex items-center gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Daily Target:</span>
            <input
              type="number"
              min="10"
              step="10"
              value={targetDailyMinutes}
              onChange={(e) => setTargetDailyMinutes(parseInt(e.target.value) || 30)}
              className="w-20 bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-slate-200 text-center"
            />
            <span className="text-slate-400">minutes</span>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
            >
              Save Subject
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {subjects.map((sub) => {
          const totalMins = subjectTotals[sub.id] || 0;
          const totalHours = (totalMins / 60).toFixed(1);

          return (
            <div
              key={sub.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800/70"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-3.5 h-3.5 rounded-full shadow-sm"
                  style={{ backgroundColor: sub.color, boxShadow: `0 0 8px ${sub.color}88` }}
                />
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">{sub.name}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span>{totalHours}h studied</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-slate-400" />
                      {sub.targetDailyMinutes}m/day
                    </span>
                  </div>
                </div>
              </div>

              {subjects.length > 1 && (
                <button
                  onClick={() => onDeleteSubject(sub.id)}
                  title="Delete subject"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
