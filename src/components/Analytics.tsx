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
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold mb-1">
            <Clock className="w-4 h-4" />
            <span>Today</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white">
            {todayFocusMinutes} <span className="text-xs text-slate-400 font-normal">min</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Goal: {settings.dailyGoalMinutes} min ({goalProgress}%)
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1">
            <Flame className="w-4 h-4" />
            <span>Streak</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white">
            {streak} <span className="text-xs text-slate-400 font-normal">days</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {streak > 0 ? '🔥 On fire!' : 'Start studying today'}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold mb-1">
            <Award className="w-4 h-4" />
            <span>Total Hours</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white">
            {allTimeHours} <span className="text-xs text-slate-400 font-normal">hrs</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {focusSessions.length} total sessions
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
            <Calendar className="w-4 h-4" />
            <span>Pomos Today</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white">
            {focusSessions.filter((s) => s.timestamp.startsWith(todayStr)).length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Sessions completed</div>
        </div>
      </div>

      {/* 7-Day Chart */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-rose-400" />
          <span>Last 7 Days Study Time</span>
        </h3>

        <div className="flex items-end justify-between gap-2 h-36 pt-4">
          {last7Days.map((day) => {
            const heightPercent = Math.max(6, (day.minutes / maxDayMinutes) * 100);
            const isToday = day.date === todayStr;

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[10px] text-slate-400 font-mono">
                  {day.minutes > 0 ? `${day.minutes}m` : ''}
                </span>
                <div className="w-full max-w-[28px] bg-slate-800 rounded-t-lg relative flex items-end overflow-hidden h-full">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      isToday
                        ? 'bg-gradient-to-t from-rose-600 to-rose-400 shadow-lg shadow-rose-500/20'
                        : 'bg-gradient-to-t from-slate-700 to-slate-500'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span
                  className={`text-[11px] font-medium ${
                    isToday ? 'text-rose-400 font-bold' : 'text-slate-400'
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
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
          <h3 className="text-sm font-bold text-slate-200 mb-3">Time by Subject</h3>
          <div className="space-y-2.5">
            {subjectDistribution.map((sub) => (
              <div key={sub.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-slate-200">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.color }} />
                    {sub.name}
                  </span>
                  <span className="text-slate-400">
                    {sub.minutes}m ({sub.percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${sub.percentage}%`,
                      backgroundColor: sub.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Log */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
        <h3 className="text-sm font-bold text-slate-200 mb-3">Recent Completed Sessions</h3>
        {sessions.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No sessions recorded yet.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {sessions.slice(0, 10).map((s) => {
              const sub = s.subjectId ? subjectMap.get(s.subjectId) : undefined;
              const date = new Date(s.timestamp);
              const timeFormatted = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const dateFormatted = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/40 border border-slate-800/50"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        s.mode === 'focus' ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                    />
                    <span className="font-medium text-slate-200">
                      {s.mode === 'focus' ? 'Focus Session' : 'Break'}
                    </span>
                    {sub && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                        style={{ backgroundColor: `${sub.color}22`, color: sub.color }}
                      >
                        {sub.name}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-400">
                    <span className="font-semibold text-slate-300">{s.durationMinutes}m</span> •{' '}
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
