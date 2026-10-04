import React from 'react';
import { BarChart3, Flame, Clock, Award, Calendar } from 'lucide-react';
import { SessionRecord, Subject, Settings } from '../types';

interface AnalyticsProps {
  sessions: SessionRecord[];
  subjects: Subject[];
  settings: Settings;
}

export const Analytics: React.FC<AnalyticsProps> = ({ sessions, subjects, settings }) => {
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  // Today's date YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  const focusSessions = sessions.filter((s) => s.mode === 'focus');

  // Today's focus minutes
  const todayFocusMinutes = focusSessions
    .filter((s) => s.timestamp.startsWith(todayStr))
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  // Total all-time focus minutes
  const allTimeFocusMinutes = focusSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const allTimeHours = (allTimeFocusMinutes / 60).toFixed(1);

  // Calculate Streak
  const uniqueDates = Array.from(
    new Set(focusSessions.map((s) => s.timestamp.split('T')[0]))
  ).sort().reverse();

  let streak = 0;
  let checkDate = new Date();
  
  // If no sessions today, check if yesterday had a session to keep streak alive
  const todayIncluded = uniqueDates.includes(todayStr);
  if (!todayIncluded) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dStr = checkDate.toISOString().split('T')[0];
    if (uniqueDates.includes(dStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Last 7 days breakdown
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    const minutes = focusSessions
      .filter((s) => s.timestamp.startsWith(dStr))
      .reduce((sum, s) => sum + s.durationMinutes, 0);
    return { date: dStr, label: dayLabel, minutes };
  });

  const maxDayMinutes = Math.max(...last7Days.map((d) => d.minutes), 60);

  // Subject distribution
  const subjectDistribution = subjects.map((sub) => {
    const minutes = focusSessions
      .filter((s) => s.subjectId === sub.id)
      .reduce((sum, s) => sum + s.durationMinutes, 0);
    return {
      ...sub,
      minutes,
      percentage: allTimeFocusMinutes > 0 ? (minutes / allTimeFocusMinutes) * 100 : 0,
    };
  }).filter((s) => s.minutes > 0);

  const goalProgress = Math.min(100, Math.round((todayFocusMinutes / settings.dailyGoalMinutes) * 100));

  return (
    <div className="space-y-4">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel rounded-2xl p-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-all pointer-events-none" />
          <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold mb-1.5 uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span>Today</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {todayFocusMinutes}<span className="text-xs text-slate-400 font-sans ml-1 font-normal">m</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 font-medium flex items-center justify-between">
            <span>Goal: {settings.dailyGoalMinutes}m</span>
            <span className="text-rose-400 font-bold">{goalProgress}%</span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mb-1.5 uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5" />
            <span>Streak</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {streak}<span className="text-xs text-slate-400 font-sans ml-1 font-normal">days</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 font-medium">
            {streak > 0 ? '🔥 Habit locked' : 'Start streak today'}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />
          <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold mb-1.5 uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            <span>Total Hours</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {allTimeHours}<span className="text-xs text-slate-400 font-sans ml-1 font-normal">hrs</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 font-medium">
            {focusSessions.length} total sessions
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-1.5 uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            <span>Pomos Today</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {focusSessions.filter((s) => s.timestamp.startsWith(todayStr)).length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 font-medium">Sessions done</div>
        </div>
      </div>

      {/* 7-Day Chart */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-rose-400" />
            <span>Weekly Study Performance</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">Last 7 Days</span>
        </div>

        <div className="flex items-end justify-between gap-3 h-40 pt-4">
          {last7Days.map((day) => {
            const heightPercent = Math.max(6, (day.minutes / maxDayMinutes) * 100);
            const isToday = day.date === todayStr;

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2.5 h-full justify-end group">
                <span className="text-[10px] text-slate-400 font-mono font-semibold transition-opacity opacity-70 group-hover:opacity-100">
                  {day.minutes > 0 ? `${day.minutes}m` : ''}
                </span>
                <div className="w-full max-w-[34px] bg-slate-900/80 rounded-t-xl relative flex items-end overflow-hidden h-full border border-white/5">
                  <div
                    className={`w-full rounded-t-xl transition-all duration-700 ${
                      isToday
                        ? 'bg-gradient-to-t from-rose-600 via-rose-500 to-rose-400 shadow-lg shadow-rose-500/30'
                        : 'bg-gradient-to-t from-slate-700 to-slate-500 group-hover:from-slate-600 group-hover:to-slate-400'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span
                  className={`text-[11px] font-bold ${
                    isToday ? 'text-rose-400 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subject Distribution */}
      {subjectDistribution.length > 0 && (
        <div className="glass-panel rounded-3xl p-5 sm:p-6 backdrop-blur-xl">
          <h3 className="text-sm font-bold text-slate-100 mb-4">Subject Time Distribution</h3>
          <div className="space-y-3">
            {subjectDistribution.map((sub) => (
              <div key={sub.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-semibold text-slate-200">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.color, boxShadow: `0 0 8px ${sub.color}88` }} />
                    {sub.name}
                  </span>
                  <span className="text-slate-400 font-mono">
                    <strong className="text-white font-sans">{sub.minutes}m</strong> ({sub.percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-950/80 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${sub.percentage}%`,
                      backgroundColor: sub.color,
                      boxShadow: `0 0 10px ${sub.color}66`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Log */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 backdrop-blur-xl">
        <h3 className="text-sm font-bold text-slate-100 mb-3.5">Recent Activity Logs</h3>
        {sessions.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">No sessions recorded yet.</p>
        ) : (
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {sessions.slice(0, 10).map((s) => {
              const sub = s.subjectId ? subjectMap.get(s.subjectId) : undefined;
              const date = new Date(s.timestamp);
              const timeFormatted = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const dateFormatted = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-900/40 border border-white/5 hover:border-white/10 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        s.mode === 'focus' ? 'bg-rose-500 shadow-sm shadow-rose-500/50' : 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                      }`}
                    />
                    <span className="font-semibold text-slate-200">
                      {s.mode === 'focus' ? 'Deep Work' : 'Break'}
                    </span>
                    {sub && (
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                        style={{ backgroundColor: `${sub.color}15`, color: sub.color, border: `1px solid ${sub.color}30` }}
                      >
                        {sub.name}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-400 font-mono text-[11px]">
                    <span className="font-bold text-slate-200 font-sans">{s.durationMinutes}m</span> •{' '}
                    <span>
                      {dateFormatted} {timeFormatted}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
