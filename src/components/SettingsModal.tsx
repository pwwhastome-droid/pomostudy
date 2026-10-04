import React, { useRef } from 'react';
import { Volume2, Clock, Download, Upload } from 'lucide-react';
import { Settings } from '../types';
import { soundEngine } from '../utils/audio';
import { Sheet } from './ui';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSaveSettings: (settings: Settings) => void;
  onExportData: () => void;
  onImportData: (json: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onExportData,
  onImportData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleChange = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    onSaveSettings({ ...settings, [key]: value });
  };

  const handleTestSound = (type: Settings['soundType']) => {
    soundEngine.playAlarm(type, settings.volume);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          onImportData(text);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <Sheet open={isOpen} title="Settings" onClose={onClose}>
      <div className="space-y-6">
        {/* Timer Durations */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Timer Durations (minutes)
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <label className="text-[11px] text-slate-400 block mb-1">Focus</label>
              <input
                type="number"
                min="1"
                max="120"
                value={settings.focusDuration}
                onChange={(e) => handleChange('focusDuration', parseInt(e.target.value) || 25)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-rose-400"
              />
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <label className="text-[11px] text-slate-400 block mb-1">Short Break</label>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.shortBreakDuration}
                onChange={(e) => handleChange('shortBreakDuration', parseInt(e.target.value) || 5)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-emerald-400"
              />
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <label className="text-[11px] text-slate-400 block mb-1">Long Break</label>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.longBreakDuration}
                onChange={(e) => handleChange('longBreakDuration', parseInt(e.target.value) || 15)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-blue-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-300">Long break after every</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                max="10"
                value={settings.longBreakInterval}
                onChange={(e) => handleChange('longBreakInterval', parseInt(e.target.value) || 4)}
                className="w-14 bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-center text-slate-200"
              />
              <span className="text-slate-400">sessions</span>
            </div>
          </div>
        </div>

        {/* Automation Toggles */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Automation</h3>
          <div className="space-y-1.5">
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 cursor-pointer text-xs">
              <span className="text-slate-200">Auto-start Breaks</span>
              <input
                type="checkbox"
                checked={settings.autoStartBreaks}
                onChange={(e) => handleChange('autoStartBreaks', e.target.checked)}
                className="w-4 h-4 accent-rose-500 rounded"
              />
            </label>
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 cursor-pointer text-xs">
              <span className="text-slate-200">Auto-start Focus sessions</span>
              <input
                type="checkbox"
                checked={settings.autoStartFocus}
                onChange={(e) => handleChange('autoStartFocus', e.target.checked)}
                className="w-4 h-4 accent-rose-500 rounded"
              />
            </label>
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 cursor-pointer text-xs">
              <span className="text-slate-200">Keep Screen Awake (Wake Lock)</span>
              <input
                type="checkbox"
                checked={settings.wakeLockEnabled}
                onChange={(e) => handleChange('wakeLockEnabled', e.target.checked)}
                className="w-4 h-4 accent-rose-500 rounded"
              />
            </label>
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 cursor-pointer text-xs">
              <span className="text-slate-200">Haptic Vibration on Android</span>
              <input
                type="checkbox"
                checked={settings.vibrationEnabled}
                onChange={(e) => handleChange('vibrationEnabled', e.target.checked)}
                className="w-4 h-4 accent-rose-500 rounded"
              />
            </label>
          </div>
        </div>

        {/* Audio & Alerts */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5" />
            Sound & Audio
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40">
              <span className="text-slate-200">Alarm Sound</span>
              <div className="flex items-center gap-2">
                <select
                  aria-label="Alarm Sound Type"
                  value={settings.soundType}
                  onChange={(e) => {
                    const sound = e.target.value as Settings['soundType'];
                    handleChange('soundType', sound);
                    handleTestSound(sound);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200"
                >
                  <option value="zen">Zen Singing Bowl</option>
                  <option value="bell">Temple Bell</option>
                  <option value="chime">Dual Chime</option>
                  <option value="digital">Digital Beep</option>
                </select>
                <button
                  onClick={() => handleTestSound(settings.soundType)}
                  className="h-9 px-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300"
                >
                  Test
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40">
              <span className="text-slate-200">Volume</span>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={settings.volume}
                onChange={(e) => handleChange('volume', parseFloat(e.target.value))}
                className="w-32 accent-rose-500"
              />
            </div>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 cursor-pointer">
              <span className="text-slate-200">Clock Ticking Sound</span>
              <input
                type="checkbox"
                checked={settings.tickingSound}
                onChange={(e) => handleChange('tickingSound', e.target.checked)}
                className="w-4 h-4 accent-rose-500 rounded"
              />
            </label>
          </div>
        </div>

        {/* Data Sync & Backup */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Data & Backup</h3>
          <p className="text-[11px] text-slate-400">
            Export your study logs and subjects to easily transfer between your Android device and PC.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onExportData}
              className="flex-1 flex items-center justify-center gap-1.5 h-11 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
            >
              <Download className="w-4 h-4" />
              <span>Export Backup</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 h-11 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
            >
              <Upload className="w-4 h-4" />
              <span>Restore Backup</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </Sheet>
  );
};
