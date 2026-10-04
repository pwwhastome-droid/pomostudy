import React, { useState } from 'react';
import {
  Bell,
  Clock,
  Plus,
  Trash2,
  X,
  Calendar,
  Volume2,
  Zap,
} from 'lucide-react';
import { ClassSchedule, Subject } from '../types';
import { SubjectSelect } from './SubjectSelect';
import { soundEngine } from '../utils/audio';

interface ClassReminderManagerProps {
  classes: ClassSchedule[];
  subjects: Subject[];
  onAddClass: (cls: Omit<ClassSchedule, 'id'>) => void;
  onToggleClass: (id: string) => void;
  onDeleteClass: (id: string) => void;
}

const DAY_LABELS = [
  { day: 6, label: 'Sat', full: 'Saturday' },
  { day: 0, label: 'Sun', full: 'Sunday' },
  { day: 1, label: 'Mon', full: 'Monday' },
  { day: 2, label: 'Tue', full: 'Tuesday' },
  { day: 3, label: 'Wed', full: 'Wednesday' },
  { day: 4, label: 'Thu', full: 'Thursday' },
  { day: 5, label: 'Fri', full: 'Friday' },
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
  const [selectedDays, setSelectedDays] = useState<number[]>([6, 2]); // Sat & Tue default
  const [time, setTime] = useState('19:00'); // 7:00 PM default
  const [selectedFilterDay, setSelectedFilterDay] = useState<number | 'all'>('all');

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

  const handleTestChime = () => {
    soundEngine.playAlarm('chime', 0.9);
    soundEngine.vibrate([200, 100, 200]);
  };

  const formatDays = (days: number[]) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map((d) => dayNames[d]).join(', ');
  };

  // Find next upcoming class alarm
  const getNextAlarmInfo = () => {
    if (classes.length === 0) return null;
    const now = new Date();
    const curDay = now.getDay();
    const curTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let minDiffMinutes = Infinity;
    let nextCls: ClassSchedule | null = null;
    let nextDayLabel = '';

    for (const cls of classes) {
      if (!cls.enabled) continue;
      for (const d of cls.days) {
        let dayDiff = (d - curDay + 7) % 7;
        const [h, m] = cls.time.split(':').map(Number);
        const [curH, curM] = curTime.split(':').map(Number);
        const timeDiff = (h * 60 + m) - (curH * 60 + curM);

        if (dayDiff === 0 && timeDiff <= 0) {
          dayDiff = 7; // Next week
        }

        const totalDiffMinutes = dayDiff * 24 * 60 + timeDiff;
        if (totalDiffMinutes < minDiffMinutes) {
          minDiffMinutes = totalDiffMinutes;
          nextCls = cls;
          nextDayLabel = dayDiff === 0 ? 'Today' : dayDiff === 1 ? 'Tomorrow' : DAY_LABELS.find(l => l.day === d)?.full || '';
        }
      }
    }

    if (!nextCls) return null;
    return { cls: nextCls, dayLabel: nextDayLabel, time: nextCls.time };
  };

  const nextAlarm = getNextAlarmInfo();

  // Filter classes by day if tab clicked
  const filteredClasses = selectedFilterDay === 'all'
    ? classes
    : classes.filter((c) => c.days.includes(selectedFilterDay));

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Next Alarm Card */}
        <div className="glass-panel rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Next Alarm
            </span>
            {nextAlarm && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-extrabold text-[10px]">
                {nextAlarm.dayLabel}
              </span>
            )}
          </div>

          {nextAlarm ? (
            <div>
              <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
                {nextAlarm.time}
              </div>
              <p className="text-xs font-semibold text-slate-200 mt-1 truncate">
                {nextAlarm.cls.title}
              </p>
            </div>
          ) : (
            <div className="py-2 text-slate-500 text-xs font-medium">
              No active alarms scheduled
            </div>
          )}
        </div>

        {/* Total Active Classes Card */}
        <div className="glass-panel rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Active Classes
            </span>
            <span className="text-slate-400 font-normal">
              {classes.length} Total
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
            {classes.filter((c) => c.enabled).length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Alarms armed with sound & vibration
          </p>
        </div>

        {/* Test Chime & Quick Action Card */}
        <div className="glass-panel rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" /> Alarm Sound
            </span>
            <span className="text-[10px] text-slate-400">Zen Chime</span>
          </div>
          <p className="text-xs text-slate-300">
            Triggers notifications and haptics even with the app in background.
          </p>
          <div className="pt-2">
            <button
              onClick={handleTestChime}
              className="w-full py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 border border-white/5"
            >
              <Volume2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Test Alarm Chime</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Schedule Workspace */}
      <div className="glass-panel rounded-3xl p-6 backdrop-blur-xl space-y-6">
        {/* Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Class Timetable & Reminders</span>
              </h2>
              <p className="text-xs text-slate-400">
                Weekly repeating lecture alarms for your study courses
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class Alarm</span>
          </button>
        </div>

        {/* Day-of-Week Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scroll">
          <button
            onClick={() => setSelectedFilterDay('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedFilterDay === 'all'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
                : 'glass-pill text-slate-400 hover:text-white'
            }`}
          >
            All Days ({classes.length})
          </button>
          {DAY_LABELS.map(({ day, label }) => {
            const count = classes.filter((c) => c.days.includes(day)).length;
            const isSelected = selectedFilterDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedFilterDay(day)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  isSelected
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
                    : 'glass-pill text-slate-400 hover:text-white'
                }`}
              >
                <span>{label}</span>
                {count > 0 && (
                  <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono ${
                    isSelected ? 'bg-white text-indigo-950 font-black' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Add Form Drawer */}
        {isAdding && (
          <form
            onSubmit={handleSubmit}
            className="p-5 rounded-3xl bg-slate-900/90 border border-white/10 space-y-4 shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-400" />
                <span>Configure Recurring Class Alarm</span>
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
                  Class / Lecture Title:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Organic Chemistry Lecture"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Linked Subject:
                </label>
                <SubjectSelect
                  subjects={subjects}
                  selectedSubject={subjects.find((s) => s.id === subjectId) || null}
                  onSelect={(sub) => setSubjectId(sub.id)}
                  size="md"
                />
              </div>
            </div>

            {/* Repeat Days Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-2">
                Repeat Every Week On:
              </label>
              <div className="grid grid-cols-7 gap-1.5">
                {DAY_LABELS.map(({ day, label, full }) => {
                  const isSelected = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      title={full}
                      className={`py-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-0.5 ${
                        isSelected
                          ? 'bg-gradient-to-t from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/30 ring-1 ring-white/30'
                          : 'bg-slate-950/60 text-slate-400 hover:text-white border border-white/5'
                      }`}
                    >
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Picker */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400">Alarm Time:</span>
              <div className="flex items-center gap-1.5 bg-slate-950/90 px-3 py-2 rounded-xl border border-white/10">
                <Clock className="w-4 h-4 text-indigo-400" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="bg-transparent text-sm font-bold text-white focus:outline-none font-mono"
                />
              </div>
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
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
              >
                Save Class Alarm
              </button>
            </div>
          </form>
        )}

        {/* Weekly Timetable Grid */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Scheduled Lectures ({filteredClasses.length})
          </h3>

          {filteredClasses.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs border border-dashed border-white/10 rounded-3xl space-y-2">
              <Bell className="w-6 h-6 text-slate-600 mx-auto" />
              <p>No class alarms for this filter. Tap + Add Class Alarm above to create one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredClasses.map((cls) => {
                const sub = cls.subjectId ? subjectMap.get(cls.subjectId) : undefined;
                return (
                  <div
                    key={cls.id}
                    className={`p-4 rounded-3xl border transition-all duration-200 flex flex-col justify-between ${
                      cls.enabled
                        ? 'bg-slate-900/50 border-white/10 shadow-lg hover:border-white/20'
                        : 'bg-slate-950/40 border-white/5 opacity-55'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onToggleClass(cls.id)}
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                            cls.enabled
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          <Bell className="w-5 h-5" />
                        </button>

                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white truncate flex items-center gap-2">
                            <span>{cls.title}</span>
                          </h4>
                          {sub && (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold mt-1"
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
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onToggleClass(cls.id)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                            cls.enabled
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {cls.enabled ? 'ACTIVE' : 'OFF'}
                        </button>
                        <button
                          onClick={() => onDeleteClass(cls.id)}
                          title="Delete alarm"
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Time & Days Row */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 text-xs">
                      <div className="flex items-center gap-1.5 font-mono text-base font-extrabold text-white">
                        <Clock className="w-4 h-4 text-indigo-400" />
                        <span>{cls.time}</span>
                      </div>
                      <div className="text-[11px] font-medium text-slate-400">
                        {formatDays(cls.days)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
