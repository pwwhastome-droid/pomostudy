import React, { useState } from 'react';
import {
  Bell,
  Clock,
  Calendar,
  Volume2,
  Zap,
} from 'lucide-react';
import { ClassSchedule, Subject } from '../types';
import { SubjectSelect } from './SubjectSelect';
import { AddAction, ConfirmDelete, Sheet, SheetActions } from './ui';
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
    <div className="flex flex-col gap-6">
      {/* Quick stats — below the timetable on phones so the list and actions come first */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 order-last md:order-first">
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
              className="w-full h-10 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 border border-white/5"
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
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 shrink-0 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Class alarms</span>
              </h2>
              <p className="text-xs text-slate-400">
                Weekly reminders before each lecture
              </p>
            </div>
          </div>

          <AddAction
            label="Add alarm"
            onClick={() => setIsAdding(true)}
            accent="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 shadow-indigo-500/30"
          />
        </div>

        {/* Day-of-Week Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scroll">
          <button
            onClick={() => setSelectedFilterDay('all')}
            className={`h-10 px-3.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
              selectedFilterDay === 'all'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
                : 'glass-pill text-slate-400 hover:text-white'
            }`}
          >
            All ({classes.length})
          </button>
          {DAY_LABELS.map(({ day, label }) => {
            const count = classes.filter((c) => c.days.includes(day)).length;
            const isSelected = selectedFilterDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedFilterDay(day)}
                className={`h-10 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
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

        <Sheet open={isAdding} title="New class alarm" onClose={() => setIsAdding(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="class-title" className="text-xs font-semibold text-slate-400 block mb-1.5">
                Class or lecture
              </label>
              <input
                id="class-title"
                type="text"
                placeholder="e.g. Organic chemistry lecture"
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
              <span className="text-xs font-semibold text-slate-400 block mb-2">Repeats every week on</span>
              <div className="grid grid-cols-7 gap-1.5">
                {DAY_LABELS.map(({ day, label, full }) => {
                  const isSelected = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      title={full}
                      aria-label={full}
                      aria-pressed={isSelected}
                      className={`h-11 rounded-xl text-xs font-bold transition ${
                        isSelected
                          ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                          : 'bg-slate-950/60 text-slate-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="class-time" className="text-xs font-semibold text-slate-400 block mb-1.5">
                Alarm time
              </label>
              <div className="flex items-center gap-2 bg-slate-950/90 px-3 h-11 rounded-xl border border-white/10">
                <Clock className="w-4 h-4 text-indigo-400" />
                <input
                  id="class-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="flex-1 bg-transparent text-sm font-bold text-white font-mono"
                />
              </div>
            </div>

            <SheetActions
              onCancel={() => setIsAdding(false)}
              submitLabel="Save alarm"
              accent="bg-indigo-500 hover:bg-indigo-400 shadow-indigo-500/25"
            />
          </form>
        </Sheet>

        {/* Weekly Timetable Grid */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Scheduled Lectures ({filteredClasses.length})
          </h3>

          {filteredClasses.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs border border-dashed border-white/10 rounded-3xl space-y-2">
              <Bell className="w-6 h-6 text-slate-600 mx-auto" />
              <p>No class alarms for this day.</p>
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="h-10 px-4 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-xs font-bold"
              >
                Add an alarm
              </button>
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
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white break-words">{cls.title}</h4>
                        {sub && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold mt-1.5"
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

                      <button
                        type="button"
                        role="switch"
                        aria-checked={cls.enabled}
                        aria-label={cls.enabled ? 'Turn alarm off' : 'Turn alarm on'}
                        onClick={() => onToggleClass(cls.id)}
                        className={`relative w-12 h-7 rounded-full shrink-0 transition-colors ${
                          cls.enabled ? 'bg-indigo-500' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                            cls.enabled ? 'translate-x-5' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Time & days, delete pinned bottom-right */}
                    <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-white/5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-mono text-base font-extrabold text-white">
                          <Clock className="w-4 h-4 text-indigo-400" />
                          <span>{cls.time}</span>
                        </div>
                        <div className="text-[11px] font-medium text-slate-400 mt-0.5">{formatDays(cls.days)}</div>
                      </div>
                      <ConfirmDelete onConfirm={() => onDeleteClass(cls.id)} label="Delete alarm" />
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
