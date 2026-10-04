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
    <div className="glass-panel rounded-3xl p-5 sm:p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Study Subjects</span>
          </h2>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-xs font-bold border border-indigo-500/30 transition shadow-lg shadow-indigo-500/10 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Subject</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-5 p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3.5 shadow-xl animate-in fade-in zoom-in-95">
          <input
            type="text"
            placeholder="Subject name (e.g. Organic Chemistry, Algorithms)..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-white/10 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            autoFocus
          />

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">Color:</span>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-all duration-200 ${
                    color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900 shadow-md' : 'hover:scale-110 opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Daily Target:</span>
            <input
              type="number"
              min="10"
              step="10"
              value={targetDailyMinutes}
              onChange={(e) => setTargetDailyMinutes(parseInt(e.target.value) || 30)}
              className="w-20 bg-slate-950/80 border border-white/10 rounded-lg px-2 py-1 text-slate-200 text-center font-bold"
            />
            <span className="text-slate-400">minutes</span>
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t border-white/5">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
            >
              Save Subject
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {subjects.map((sub) => {
          const totalMins = subjectTotals[sub.id] || 0;
          const totalHours = (totalMins / 60).toFixed(1);

          return (
            <div
              key={sub.id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-white/10 transition-all duration-200"
            >
              <div className="flex items-center gap-3.5">
                <span
                  className="w-3.5 h-3.5 rounded-full shadow-md"
                  style={{ backgroundColor: sub.color, boxShadow: `0 0 10px ${sub.color}88` }}
                />
                <div>
                  <h4 className="text-sm font-semibold text-slate-100">{sub.name}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span className="font-mono font-medium">{totalHours}h studied</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-slate-500" />
                      {sub.targetDailyMinutes}m/day
                    </span>
                  </div>
                </div>
              </div>

              {subjects.length > 1 && (
                <button
                  onClick={() => onDeleteSubject(sub.id)}
                  title="Delete subject"
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
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
