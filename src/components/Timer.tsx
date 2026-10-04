import React from 'react';
import { Play, Pause, RotateCcw, SkipForward, Volume2, CloudRain, Wind, BellOff } from 'lucide-react';
import { TimerMode, Subject, Settings } from '../types';
import { SubjectSelect } from './SubjectSelect';

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

  const progress = totalDuration > 0 ? (1 - timeLeft / totalDuration) : 0;
  const radius = 138;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  const modeTheme = {
    focus: {
      accent: '#f43f5e',
      accentSoft: 'rgba(244, 63, 94, 0.25)',
      gradientFrom: '#fb7185',
      gradientTo: '#e11d48',
      tabActive: 'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-lg shadow-rose-500/10',
      heroButton: 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white shadow-xl shadow-rose-500/30 border border-rose-400/30',
      label: 'DEEP WORK',
    },
    shortBreak: {
      accent: '#10b981',
      accentSoft: 'rgba(16, 185, 129, 0.25)',
      gradientFrom: '#34d399',
      gradientTo: '#059669',
      tabActive: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-lg shadow-emerald-500/10',
      heroButton: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-xl shadow-emerald-500/30 border border-emerald-400/30',
      label: 'SHORT REST',
    },
    longBreak: {
      accent: '#3b82f6',
      accentSoft: 'rgba(59, 130, 246, 0.25)',
      gradientFrom: '#60a5fa',
      gradientTo: '#2563eb',
      tabActive: 'bg-blue-500/15 text-blue-300 border-blue-500/30 shadow-lg shadow-blue-500/10',
      heroButton: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-xl shadow-blue-500/30 border border-blue-400/30',
      label: 'RECHARGE BREAK',
    },
  }[mode];

  const cycleIndex = sessionCount % settings.longBreakInterval;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto select-none">
      {/* Dynamic Aura Glow */}
      <div 
        className="absolute w-96 h-96 rounded-full blur-[110px] pointer-events-none transition-all duration-1000 opacity-30 -z-10"
        style={{
          backgroundColor: modeTheme.accent,
          transform: isRunning ? 'scale(1.2)' : 'scale(0.9)',
        }}
      />

      {/* Pill Switcher */}
      <div className="flex items-center p-1.5 glass-pill rounded-full mb-6 border border-white/10 shadow-2xl">
        {(['focus', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => {
          const isActive = mode === m;
          const label = m === 'focus' ? 'Focus' : m === 'shortBreak' ? 'Short Break' : 'Long Break';
          return (
            <button
              key={m}
              onClick={() => onSwitchMode(m)}
              className={`px-6 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all duration-300 cursor-pointer active:scale-95 ${
                isActive
                  ? modeTheme.tabActive + ' font-extrabold shadow-lg scale-102'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Modern Circular Dial */}
      <div className="relative flex items-center justify-center my-1">
        <svg 
          className={`w-76 h-76 sm:w-88 sm:h-88 -rotate-90 transform ${isRunning ? 'glow-active' : ''}`}
          style={{
            ['--glow-color' as string]: modeTheme.accent,
            ['--glow-color-soft' as string]: modeTheme.accentSoft,
          }}
        >
          <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={modeTheme.gradientFrom} />
              <stop offset="100%" stopColor={modeTheme.gradientTo} />
            </linearGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={modeTheme.accent} floodOpacity="0.5"/>
            </filter>
          </defs>

          {/* Ambient Outer Track */}
          <circle
            cx="50%"
            cy="50%"
            r={radius + 12}
            className="stroke-slate-800/40"
            strokeWidth="1"
            strokeDasharray="4 6"
            fill="transparent"
          />

          {/* Base Track */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="rgba(255, 255, 255, 0.04)"
            strokeWidth="12"
            fill="transparent"
          />

          {/* Glowing Animated Progress Stroke */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="url(#timerGradient)"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-300 ease-out"
            filter="url(#shadow)"
          />
        </svg>

        {/* Center Display Details */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          {/* Subject Badge / Selector */}
          {mode === 'focus' ? (
            <div className="relative mb-2">
              <SubjectSelect
                subjects={subjects}
                selectedSubject={selectedSubject}
                onSelect={onSelectSubject}
                size="md"
              />
            </div>
          ) : (
            <span className="text-[11px] font-bold tracking-widest text-emerald-400 uppercase mb-2 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              Rest Well
            </span>
          )}

          {/* Digits Display */}
          <div className="flex items-center justify-center">
            <span className="text-6xl sm:text-7xl font-extrabold tracking-tight text-white font-['JetBrains_Mono',monospace] drop-shadow-2xl">
              {formattedTime}
            </span>
          </div>

          {/* Subtitle / Session Counter */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {modeTheme.label}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[11px] font-semibold text-slate-300">
              #{sessionCount + 1}
            </span>
          </div>

          {/* Cycle Dots */}
          <div className="flex items-center gap-2 mt-3 p-1.5 px-3 rounded-full bg-slate-950/60 border border-white/5">
            {Array.from({ length: settings.longBreakInterval }).map((_, idx) => {
              const isPast = idx < cycleIndex;
              const isCurrent = idx === cycleIndex && isRunning && mode === 'focus';
              return (
                <div
                  key={idx}
                  className={`transition-all duration-300 rounded-full ${
                    isPast
                      ? 'w-2.5 h-2.5 bg-rose-500 shadow-md shadow-rose-500/50 scale-105'
                      : isCurrent
                      ? 'w-2.5 h-2.5 bg-rose-400 animate-pulse'
                      : 'w-2 h-2 bg-slate-800 border border-slate-700/60'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Tactile Action Controls */}
      <div className="flex items-center gap-6 mt-8">
        <button
          onClick={onReset}
          title="Reset timer (Alt+R)"
          className="group flex flex-col items-center gap-1.5 p-3.5 px-4 rounded-2xl glass-panel text-slate-400 hover:text-white hover:border-white/25 transition-all duration-200 active:scale-90 hover:scale-105"
        >
          <RotateCcw className="w-5 h-5 group-hover:-rotate-45 transition-transform duration-300" />
          <span className="text-[10px] font-semibold text-slate-400 group-hover:text-slate-200 tracking-wider">RESET</span>
        </button>

        <button
          onClick={isRunning ? onPause : onStart}
          className={`group flex items-center justify-center gap-3 px-8 h-20 rounded-3xl ${modeTheme.heroButton} transition-all duration-200 active:scale-95 hover:scale-105 cursor-pointer`}
          style={{ minWidth: '170px' }}
        >
          {isRunning ? (
            <>
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <Pause className="w-6 h-6 fill-current drop-shadow-md" />
              </div>
              <span className="text-base font-extrabold tracking-wider">PAUSE</span>
            </>
          ) : (
            <>
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <Play className="w-6 h-6 fill-current ml-0.5 drop-shadow-md" />
              </div>
              <span className="text-base font-extrabold tracking-wider">START</span>
            </>
          )}
        </button>

        <button
          onClick={onSkip}
          title="Skip session (Alt+S)"
          className="group flex flex-col items-center gap-1.5 p-3.5 px-4 rounded-2xl glass-panel text-slate-400 hover:text-white hover:border-white/25 transition-all duration-200 active:scale-90 hover:scale-105"
        >
          <SkipForward className="w-5 h-5 group-hover:translate-x-0.5 transition-transform duration-300" />
          <span className="text-[10px] font-semibold text-slate-400 group-hover:text-slate-200 tracking-wider">SKIP</span>
        </button>
      </div>

      {/* Ambient Sound Audio Pill */}
      <div className="flex items-center gap-1.5 mt-8 px-4 py-2 glass-pill rounded-full text-xs text-slate-400 shadow-lg border border-white/10">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 pr-1 tracking-wide">
          <Volume2 className="w-3.5 h-3.5 text-rose-400" />
          AMBIENT:
        </span>
        <button
          onClick={() => onUpdateSettings({ ambientNoise: 'none' })}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 ${
            settings.ambientNoise === 'none'
              ? 'bg-slate-800 text-white font-bold shadow-md shadow-black/40 border border-white/10'
              : 'hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <span className="flex items-center gap-1">
            <BellOff className="w-3 h-3" /> Off
          </span>
        </button>
        <button
          onClick={() => onUpdateSettings({ ambientNoise: 'rain' })}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 ${
            settings.ambientNoise === 'rain'
              ? 'bg-blue-500/25 text-blue-300 font-bold border border-blue-500/40 shadow-md shadow-blue-500/20'
              : 'hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <span className="flex items-center gap-1">
            <CloudRain className="w-3.5 h-3.5 text-blue-400" /> Rain
          </span>
        </button>
        <button
          onClick={() => onUpdateSettings({ ambientNoise: 'white' })}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 ${
            settings.ambientNoise === 'white'
              ? 'bg-purple-500/25 text-purple-300 font-bold border border-purple-500/40 shadow-md shadow-purple-500/20'
              : 'hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <span className="flex items-center gap-1">
            <Wind className="w-3.5 h-3.5 text-purple-400" /> White
          </span>
        </button>
      </div>
    </div>
  );
};
