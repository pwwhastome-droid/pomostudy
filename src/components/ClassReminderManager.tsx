import React, { useState } from 'react';
import {
  Bell,
  Clock,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { ClassSchedule, Subject } from '../types';
import { SubjectSelect } from './SubjectSelect';

interface ClassReminderManagerProps {
  classes: ClassSchedule[];
  subjects: Subject[];
  onAddClass: (cls: Omit<ClassSchedule, 'id'>) => void;
  onToggleClass: (id: string) => void;
  onDeleteClass: (id: string) => void;
}

const DAY_LABELS = [
  { day: 6, label: 'Sat' },
  { day: 0, label: 'Sun' },
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
];

export const ClassReminderManager: React.FC<ClassReminderManagerProps> = ({
  classes,
  subjects,
  onAddClass,
  onToggleClass,
  onDeleteClass,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [selectedDays, setSelectedDays] = useState<number[]>([6, 2]); // Default Saturday (6) and Tuesday (2)
  const [time, setTime] = useState('19:00'); // Default 7:00 PM

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedDays.length === 0) return;

    onAddClass({
      title: title.trim(),
      subjectId: subjectId || undefined,
      days: selectedDays,
      time,
      enabled: true,
    });

    setTitle('');
    setIsAdding(false);
  };

  const formatDays = (days: number[]) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map((d) => dayNames[d]).join(', ');
  };

  return (
    <div className="glass-panel rounded-3xl p-5 sm:p-6 backdrop-blur-xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Class Alarms & Reminders</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {classes.filter((c) => c.enabled).length} active
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Recurring alerts on specific days & times (e.g. Saturday & Tuesday at 7:00 PM)
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Class Alarm</span>
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 space-y-3.5 shadow-xl animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300">Set Recurring Class Alarm</span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            type="text"
            placeholder="Class name (e.g. Advanced Calculus Lecture)..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-white/10 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            autoFocus
          />

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400 block">Repeat On Days:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {DAY_LABELS.map(({ day, label }) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30 scale-105'
                        : 'bg-slate-950/70 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Alarm Time:</span>
              <div className="flex items-center gap-1 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-white/10">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 min-w-[150px]">
              <SubjectSelect
                subjects={subjects}
                selectedSubject={subjects.find((s) => s.id === subjectId) || null}
                onSelect={(sub) => setSubjectId(sub.id)}
                size="sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
            >
              Save Alarm
            </button>
          </div>
        </form>
      )}

      {/* Class Schedule List */}
      <div className="space-y-2.5">
        {classes.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-white/10 rounded-2xl">
            No class alarms set. Click + New Class Alarm to schedule reminders for your lectures.
          </div>
        ) : (
          classes.map((cls) => {
            const sub = cls.subjectId ? subjectMap.get(cls.subjectId) : undefined;
            return (
              <div
                key={cls.id}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  cls.enabled
                    ? 'bg-slate-900/60 border-white/10 shadow-sm'
                    : 'bg-slate-950/40 border-white/5 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 mr-3">
                  <button
                    onClick={() => onToggleClass(cls.id)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
                      cls.enabled
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </button>

                  <div className="truncate">
                    <h4 className="text-sm font-bold text-white truncate flex items-center gap-2">
                      <span>{cls.title}</span>
                      {sub && (
                        <span
                          className="px-2 py-0.2 rounded-full text-[10px] font-bold"
                          style={{
                            backgroundColor: `${sub.color}20`,
                            color: sub.color,
                            border: `1px solid ${sub.color}40`,
                          }}
                        >
                          {sub.name}
                        </span>
                      )}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="font-mono font-bold text-indigo-400">
                        {cls.time}
                      </span>
                      <span>•</span>
                      <span>{formatDays(cls.days)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onToggleClass(cls.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      cls.enabled
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {cls.enabled ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={() => onDeleteClass(cls.id)}
                    title="Delete reminder"
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
