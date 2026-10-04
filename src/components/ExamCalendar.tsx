import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  AlertCircle,
  X,
} from 'lucide-react';
import { ExamEvent, Subject } from '../types';
import { SubjectSelect } from './SubjectSelect';

interface ExamCalendarProps {
  exams: ExamEvent[];
  subjects: Subject[];
  onAddExam: (exam: Omit<ExamEvent, 'id'>) => void;
  onDeleteExam: (id: string) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const ExamCalendar: React.FC<ExamCalendarProps> = ({
  exams,
  subjects,
  onAddExam,
  onDeleteExam,
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [examTime, setExamTime] = useState('09:00');
  const [notes, setNotes] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  // Calendar matrix calculations
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays: Array<{
    day: number;
    dateStr: string;
    isCurrentMonth: boolean;
    isToday: boolean;
  }> = [];

  const todayStr = new Date().toISOString().split('T')[0];

  // Leading days from previous month
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, d);
    const dateStr = prevDate.toISOString().split('T')[0];
    calendarDays.push({
      day: d,
      dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  // Days in current month
  for (let d = 1; d <= daysInMonth; d++) {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    const dateStr = `${year}-${mStr}-${dStr}`;
    calendarDays.push({
      day: d,
      dateStr,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    });
  }

  // Trailing days from next month to complete 35 or 42 grid cells
  const remaining = (7 - (calendarDays.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const nextDate = new Date(year, month + 1, d);
    const dateStr = nextDate.toISOString().split('T')[0];
    calendarDays.push({
      day: d,
      dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  // Index exams by date string: "YYYY-MM-DD" -> ExamEvent[]
  const examsByDate = exams.reduce((acc, ex) => {
    if (!acc[ex.date]) acc[ex.date] = [];
    acc[ex.date].push(ex);
    return acc;
  }, {} as Record<string, ExamEvent[]>);

  const selectedDateExams = examsByDate[selectedDateStr] || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddExam({
      title: title.trim(),
      subjectId: subjectId || undefined,
      date: selectedDateStr,
      time: examTime || undefined,
      notes: notes.trim() || undefined,
    });

    setTitle('');
    setNotes('');
    setIsAdding(false);
  };

  // Format selected date nicely
  const selectedDateObj = new Date(selectedDateStr + 'T00:00:00');
  const selectedFormatted = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Calculate upcoming exams (today and future) sorted
  const upcomingExams = exams
    .filter((ex) => ex.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="glass-panel rounded-3xl p-5 sm:p-6 backdrop-blur-xl space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Exam Schedule</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                {upcomingExams.length} upcoming
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Track exams, midterms, and project deadlines</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl text-xs font-bold glass-pill text-slate-300 hover:text-white transition active:scale-95"
          >
            Today
          </button>
          <div className="flex items-center gap-1 glass-pill rounded-xl p-0.5">
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-white px-2 min-w-[110px] text-center">
              {MONTH_NAMES[month]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              title="Next Month"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Monthly Calendar Grid (7 columns) */}
        <div className="md:col-span-7 bg-slate-950/60 rounded-2xl p-3.5 border border-white/5">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 text-center mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <span key={d} className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Month Cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell) => {
              const isSelected = cell.dateStr === selectedDateStr;
              const dayExams = examsByDate[cell.dateStr] || [];
              const hasExams = dayExams.length > 0;

              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => {
                    setSelectedDateStr(cell.dateStr);
                  }}
                  className={`min-h-[46px] p-1 rounded-xl flex flex-col items-center justify-between text-xs font-semibold transition-all relative ${
                    isSelected
                      ? 'bg-rose-500/20 text-white border border-rose-500/50 shadow-md shadow-rose-500/20'
                      : cell.isCurrentMonth
                      ? 'text-slate-200 hover:bg-white/5'
                      : 'text-slate-600 hover:bg-white/5'
                  } ${cell.isToday && !isSelected ? 'ring-1 ring-white/30 font-bold' : ''}`}
                >
                  <span
                    className={`text-[12px] ${
                      cell.isToday
                        ? 'text-rose-400 font-extrabold'
                        : isSelected
                        ? 'text-white font-bold'
                        : ''
                    }`}
                  >
                    {cell.day}
                  </span>

                  {/* Indicator Dots for Exams */}
                  {hasExams && (
                    <div className="flex items-center gap-1 mt-0.5 max-w-full overflow-hidden">
                      {dayExams.slice(0, 3).map((ex) => {
                        const sub = ex.subjectId ? subjectMap.get(ex.subjectId) : undefined;
                        const dotColor = sub ? sub.color : '#f43f5e';
                        return (
                          <span
                            key={ex.id}
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: dotColor,
                              boxShadow: `0 0 6px ${dotColor}`,
                            }}
                          />
                        );
                      })}
                      {dayExams.length > 3 && (
                        <span className="text-[8px] text-slate-400 font-bold">+</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details & Exams Panel */}
        <div className="md:col-span-5 flex flex-col justify-between space-y-4">
          <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Selected Date
                </span>
                <h3 className="text-sm font-bold text-white">{selectedFormatted}</h3>
              </div>
              <button
                onClick={() => setIsAdding(!isAdding)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Exam</span>
              </button>
            </div>

            {/* Add Exam inline form */}
            {isAdding && (
              <form onSubmit={handleSubmit} className="mb-3 p-3 rounded-xl bg-slate-950/80 border border-white/10 space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-300">Schedule New Exam</span>
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Exam title (e.g. Calculus Midterm II)..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  autoFocus
                />

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex-1 min-w-[130px]">
                    <SubjectSelect
                      subjects={subjects}
                      selectedSubject={subjects.find((s) => s.id === subjectId) || null}
                      onSelect={(sub) => setSubjectId(sub.id)}
                      size="sm"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-white/10">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="time"
                      value={examTime}
                      onChange={(e) => setExamTime(e.target.value)}
                      className="bg-transparent text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Optional room / syllabus notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-slate-300 placeholder-slate-500 focus:outline-none"
                />

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-500 text-white"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}

            {/* List of exams on selected date */}
            <div className="space-y-2 flex-1 overflow-y-auto max-h-56 pr-1">
              {selectedDateExams.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs flex flex-col items-center justify-center gap-1.5">
                  <AlertCircle className="w-5 h-5 text-slate-600" />
                  <span>No exams scheduled on this date.</span>
                </div>
              ) : (
                selectedDateExams.map((ex) => {
                  const sub = ex.subjectId ? subjectMap.get(ex.subjectId) : undefined;
                  return (
                    <div
                      key={ex.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-white/5 hover:border-white/15 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: sub ? sub.color : '#f43f5e',
                            boxShadow: `0 0 8px ${sub ? sub.color : '#f43f5e'}99`,
                          }}
                        />
                        <div className="truncate">
                          <h4 className="text-xs font-bold text-white truncate">{ex.title}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            {sub && <span style={{ color: sub.color }}>{sub.name}</span>}
                            {ex.time && <span>• {ex.time}</span>}
                            {ex.notes && <span className="truncate">• {ex.notes}</span>}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteExam(ex.id)}
                        title="Delete exam"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Upcoming Exams Countdown Banner */}
          {upcomingExams.length > 0 && (
            <div className="p-3 bg-gradient-to-r from-rose-500/10 to-amber-500/10 rounded-2xl border border-rose-500/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 block mb-1">
                Next Upcoming Exam
              </span>
              <div className="flex items-center justify-between text-xs">
                <div className="truncate mr-2">
                  <strong className="text-white block truncate">{upcomingExams[0].title}</strong>
                  <span className="text-slate-400 text-[11px] font-mono">
                    {upcomingExams[0].date} {upcomingExams[0].time ? `@ ${upcomingExams[0].time}` : ''}
                  </span>
                </div>
                {/* Days remaining badge */}
                {(() => {
                  const target = new Date(upcomingExams[0].date + 'T00:00:00');
                  const now = new Date(todayStr + 'T00:00:00');
                  const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <span className="px-2.5 py-1 rounded-xl bg-rose-500 text-white font-extrabold text-xs shrink-0 shadow-md shadow-rose-500/20">
                      {diffDays === 0 ? 'Today!' : diffDays === 1 ? 'Tomorrow!' : `in ${diffDays} days`}
                    </span>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
