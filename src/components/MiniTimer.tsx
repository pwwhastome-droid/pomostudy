import React from 'react';
import { Play, Pause, RotateCcw, Maximize2 } from 'lucide-react';
import { TimerMode, Subject } from '../types';

interface MiniTimerProps {
  mode: TimerMode;
  timeLeft: number;
  totalDuration: number;
  isRunning: boolean;
  selectedSubject: Subject | null;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onExpand: () => void;
}

export const MiniTimer: React.FC<MiniTimerProps> = ({
  mode,
  timeLeft,
  totalDuration,
  isRunning,
  selectedSubject,
  onStart,
  onPause,
  onReset,
  onExpand,
}) => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progress = totalDuration > 0 ? (1 - timeLeft / totalDuration) * 100 : 0;

  const modeColor = {
    focus: '#f43f5e',
    shortBreak: '#10b981',
    longBreak: '#3b82f6',
  }[mode];

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 px-4 py-2.5 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-lg">
      <div className="relative w-8 h-8 flex items-center justify-center">
        <svg className="w-8 h-8 -rotate-90 transform">
          <circle cx="16" cy="16" r="13" stroke="#334155" strokeWidth="3" fill="none" />
          <circle
            cx="16"
            cy="16"
            r="13"
            stroke={modeColor}
            strokeWidth="3"
            fill="none"
            strokeDasharray={2 * Math.PI * 13}
            strokeDashoffset={(2 * Math.PI * 13) * (1 - progress / 100)}
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="flex flex-col">
        <span className="text-sm font-mono font-bold text-white leading-none">{formattedTime}</span>
        <span className="text-[10px] text-slate-400 font-medium">
          {mode === 'focus' ? selectedSubject?.name || 'Focus' : 'Break'}
        </span>
      </div>

      <div className="flex items-center gap-1 ml-2">
        <button
          onClick={isRunning ? onPause : onStart}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white"
        >
          {isRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        </button>
        <button
          onClick={onReset}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onExpand}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
