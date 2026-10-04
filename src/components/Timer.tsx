import React from 'react';
import { Play, Pause, RotateCcw, SkipForward, Volume2, CloudRain, Wind, BellOff } from 'lucide-react';
import { TimerMode, Subject, Settings } from '../types';

interface TimerProps {
  mode: TimerMode;
  timeLeft: number;
  totalDuration: number;
  isRunning: boolean;
  sessionCount: number;
  selectedSubject: Subject | null;
  subjects: Subject[];
  settings: Settings;
  onSelectSubject: (subject: Subject) => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
  onSwitchMode: (mode: TimerMode) => void;
  onUpdateSettings: (newSettings: Partial<Settings>) => void;
}

export const Timer: React.FC<TimerProps> = ({
  mode,
  timeLeft,
  totalDuration,
  isRunning,
  sessionCount,
  selectedSubject,
  subjects,
  settings,
  onSelectSubject,
  onStart,
  onPause,
  onReset,
  onSkip,
  onSwitchMode,
  onUpdateSettings,
}) => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progress = totalDuration > 0 ? (1 - timeLeft / totalDuration) * 100 : 0;
  const radius = 135;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const modeColors = {
    focus: {
      accent: '#f43f5e',
      glow: 'shadow-rose-500/20',
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      button: 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30',
    },
    shortBreak: {
      accent: '#10b981',
      glow: 'shadow-emerald-500/20',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      button: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30',
    },
    longBreak: {
      accent: '#3b82f6',
      glow: 'shadow-blue-500/20',
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      button: 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30',
    },
  }[mode];

  const cycleIndex = sessionCount % settings.longBreakInterval;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto">
      {/* Mode Switcher Tabs */}
      <div className="flex items-center p-1.5 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800/80 mb-6 gap-1 shadow-inner">
        <button
          onClick={() => onSwitchMode('focus')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
            mode === 'focus'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Focus
        </button>
        <button
          onClick={() => onSwitchMode('shortBreak')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
            mode === 'shortBreak'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Short Break
        </button>
        <button
          onClick={() => onSwitchMode('longBreak')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
            mode === 'longBreak'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Long Break
        </button>
      </div>

      {/* Circular Timer Ring */}
      <div className="relative flex items-center justify-center my-2">
        <svg className="w-72 h-72 sm:w-80 sm:h-80 -rotate-90 transform drop-shadow-2xl">
          {/* Background Track */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            className="stroke-slate-800/60"
            strokeWidth="10"
            fill="transparent"
          />
          {/* Progress Indicator */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke={modeColors.accent}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-300 ease-out"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          {/* Subject Badge */}
          {mode === 'focus' && (
            <div className="mb-2">
              <select
                aria-label="Select study subject"
                value={selectedSubject?.id || ''}
                onChange={(e) => {
                  const sub = subjects.find((s) => s.id === e.target.value);
                  if (sub) onSelectSubject(sub);
                }}
                className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700/80 text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-rose-500/50 appearance-none text-center"
                style={{
                  borderColor: selectedSubject ? `${selectedSubject.color}55` : undefined,
                  boxShadow: selectedSubject ? `0 0 10px ${selectedSubject.color}22` : undefined,
                }}
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id} className="bg-slate-900 text-slate-200">
                    📖 {sub.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Time digits */}
          <span className="text-6xl sm:text-7xl font-extrabold tracking-tight text-white font-mono drop-shadow-md">
            {formattedTime}
          </span>

          {/* Cycle indicators (4 dots) */}
          <div className="flex items-center gap-1.5 mt-3">
            {Array.from({ length: settings.longBreakInterval }).map((_, idx) => (
              <span
                key={idx}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  idx < cycleIndex
                    ? 'bg-rose-500 shadow-sm shadow-rose-500/50 scale-110'
                    : idx === cycleIndex && isRunning && mode === 'focus'
                    ? 'bg-rose-400 animate-pulse'
                    : 'bg-slate-800 border border-slate-700/50'
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
            {mode === 'focus' ? `Pomodoro #${sessionCount + 1}` : 'Rest & Relax'}
          </span>
        </div>
      </div>

      {/* Main Action Controls */}
      <div className="flex items-center gap-4 mt-6">
        <button
          onClick={onReset}
          title="Reset timer"
          className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition active:scale-95"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={isRunning ? onPause : onStart}
          className={`flex items-center justify-center w-20 h-16 rounded-2xl ${modeColors.button} transition active:scale-95 font-bold text-lg`}
        >
          {isRunning ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-0.5" />}
        </button>

        <button
          onClick={onSkip}
          title="Skip to next session"
          className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition active:scale-95"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Ambient Sound Bar */}
      <div className="flex items-center gap-2 mt-6 px-3 py-1.5 bg-slate-900/70 border border-slate-800/80 rounded-full text-xs text-slate-400">
        <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 pl-1">
          <Volume2 className="w-3.5 h-3.5 text-slate-400" />
          Sound:
        </span>
        <button
          onClick={() => onUpdateSettings({ ambientNoise: 'none' })}
          className={`px-2 py-0.5 rounded-full transition ${
            settings.ambientNoise === 'none' ? 'bg-slate-800 text-slate-200 font-semibold' : 'hover:text-slate-200'
          }`}
        >
          <span className="flex items-center gap-1">
            <BellOff className="w-3 h-3" /> Off
          </span>
        </button>
        <button
          onClick={() => onUpdateSettings({ ambientNoise: 'rain' })}
          className={`px-2 py-0.5 rounded-full transition ${
            settings.ambientNoise === 'rain' ? 'bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30' : 'hover:text-slate-200'
          }`}
        >
          <span className="flex items-center gap-1">
            <CloudRain className="w-3 h-3" /> Rain
          </span>
        </button>
        <button
          onClick={() => onUpdateSettings({ ambientNoise: 'white' })}
          className={`px-2 py-0.5 rounded-full transition ${
            settings.ambientNoise === 'white' ? 'bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30' : 'hover:text-slate-200'
          }`}
        >
          <span className="flex items-center gap-1">
            <Wind className="w-3 h-3" /> White
          </span>
        </button>
      </div>
    </div>
  );
};
