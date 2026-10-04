import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Timer } from './components/Timer';
import { TaskTracker } from './components/TaskTracker';
import { Analytics } from './components/Analytics';
import { SubjectManager } from './components/SubjectManager';
import { SettingsModal } from './components/SettingsModal';
import { MiniTimer } from './components/MiniTimer';
import { useTimer } from './hooks/useTimer';
import { useWakeLock } from './hooks/useWakeLock';
import { storage } from './utils/storage';
import { Settings, Subject, Task, SessionRecord, TimerMode } from './types';
import {
  Timer as TimerIcon,
  CheckSquare,
  BarChart3,
  BookOpen,
  Settings as SettingsIcon,
  Minimize2,
} from 'lucide-react';

export const App: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(() => storage.getSettings());
  const [subjects, setSubjects] = useState<Subject[]>(() => storage.getSubjects());
  const [tasks, setTasks] = useState<Task[]>(() => storage.getTasks());
  const [sessions, setSessions] = useState<SessionRecord[]>(() => storage.getSessions());

  const [activeTab, setActiveTab] = useState<'timer' | 'tasks' | 'analytics' | 'subjects'>('timer');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMiniMode, setIsMiniMode] = useState(false);

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(() => subjects[0] || null);
  const [activeTaskId, setActiveTaskId] = useState<string | undefined>();

  // Trigger celebration confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#a855f7'],
    });
  };

  // On session completion handler
  const handleSessionComplete = useCallback(
    (completedMode: TimerMode, durationMinutes: number) => {
      const newSession: SessionRecord = {
        id: 'sess-' + Date.now(),
        mode: completedMode,
        subjectId: completedMode === 'focus' ? selectedSubject?.id : undefined,
        taskId: completedMode === 'focus' ? activeTaskId : undefined,
        durationMinutes,
        timestamp: new Date().toISOString(),
      };

      setSessions((prev) => {
        const updated = [newSession, ...prev];
        storage.saveSessions(updated);
        return updated;
      });

      if (completedMode === 'focus') {
        triggerConfetti();

        // Increment active task pomodoro count if assigned
        if (activeTaskId) {
          setTasks((prev) => {
            const updated = prev.map((t) => {
              if (t.id === activeTaskId) {
                const newCompleted = t.completedPomodoros + 1;
                return {
                  ...t,
                  completedPomodoros: newCompleted,
                  completed: newCompleted >= t.estimatedPomodoros ? true : t.completed,
                };
              }
              return t;
            });
            storage.saveTasks(updated);
            return updated;
          });
        }
      }
    },
    [selectedSubject, activeTaskId]
  );

  const timer = useTimer({
    settings,
    onSessionComplete: handleSessionComplete,
  });

  // Keep screen awake on Android / Desktop when timer is running
  useWakeLock(settings.wakeLockEnabled, timer.isRunning);

  // Desktop keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (timer.isRunning) timer.pause();
        else timer.start();
      } else if (e.altKey && e.code === 'KeyR') {
        e.preventDefault();
        timer.reset();
      } else if (e.altKey && e.code === 'KeyS') {
        e.preventDefault();
        timer.skip();
      } else if (e.altKey && e.code === 'KeyM') {
        e.preventDefault();
        setIsMiniMode((m) => !m);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timer]);

  // Update document title with remaining time
  useEffect(() => {
    const mins = Math.floor(timer.timeLeft / 60);
    const secs = timer.timeLeft % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const modeLabel = timer.mode === 'focus' ? 'Focus' : 'Break';
    document.title = `${formatted} - ${modeLabel} | PomoStudy`;
  }, [timer.timeLeft, timer.mode]);

  // Handlers for settings & data
  const handleUpdateSettings = (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    storage.saveSettings(updated);
  };

  const handleExportData = () => {
    const backupJson = storage.exportBackup();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pomostudy-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (jsonString: string) => {
    const success = storage.importBackup(jsonString);
    if (success) {
      setSettings(storage.getSettings());
      setSubjects(storage.getSubjects());
      setTasks(storage.getTasks());
      setSessions(storage.getSessions());
      setIsSettingsOpen(false);
      alert('Data imported successfully!');
    } else {
      alert('Failed to parse backup file.');
    }
  };

  // Handlers for Tasks
  const handleAddTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'completedPomodoros' | 'completed'>) => {
    const newTask: Task = {
      ...taskData,
      id: 'task-' + Date.now(),
      completedPomodoros: 0,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    storage.saveTasks(updated);
  };

  const handleToggleComplete = (taskId: string) => {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined } : t
    );
    setTasks(updated);
    storage.saveTasks(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    storage.saveTasks(updated);
    if (activeTaskId === taskId) setActiveTaskId(undefined);
  };

  const handleIncrementPomo = (taskId: string) => {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, completedPomodoros: t.completedPomodoros + 1 } : t
    );
    setTasks(updated);
    storage.saveTasks(updated);
  };

  // Handlers for Subjects
  const handleAddSubject = (subjectData: Omit<Subject, 'id'>) => {
    const newSubject: Subject = {
      ...subjectData,
      id: 'sub-' + Date.now(),
    };
    const updated = [...subjects, newSubject];
    setSubjects(updated);
    storage.saveSubjects(updated);
    if (!selectedSubject) setSelectedSubject(newSubject);
  };

  const handleDeleteSubject = (subjectId: string) => {
    if (subjects.length <= 1) return;
    const updated = subjects.filter((s) => s.id !== subjectId);
    setSubjects(updated);
    storage.saveSubjects(updated);
    if (selectedSubject?.id === subjectId) {
      setSelectedSubject(updated[0] || null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] via-[#090d16] to-[#04060a] text-slate-100 flex flex-col justify-between">
      {/* Top Header */}
      <header className="w-full border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-xl sticky top-0 z-30 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/25">
              <span className="text-white font-black text-sm">P</span>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                PomoStudy
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/20">
                  PRO
                </span>
              </h1>
            </div>
          </div>

          {/* Navigation Bar (Desktop & Tablet) */}
          <nav className="hidden sm:flex items-center gap-1 bg-slate-900/80 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('timer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'timer' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TimerIcon className="w-4 h-4" />
              <span>Timer</span>
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'tasks' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Tasks</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'analytics' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab('subjects')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'subjects' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Subjects</span>
            </button>
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMiniMode(!isMiniMode)}
              title="Mini Floating Mode (Alt+M)"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              title="Settings"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-24 sm:pb-8 flex flex-col justify-center">
        {activeTab === 'timer' && (
          <div className="space-y-6">
            <Timer
              mode={timer.mode}
              timeLeft={timer.timeLeft}
              totalDuration={timer.totalDuration}
              isRunning={timer.isRunning}
              sessionCount={timer.sessionCount}
              selectedSubject={selectedSubject}
              subjects={subjects}
              settings={settings}
              onSelectSubject={setSelectedSubject}
              onStart={timer.start}
              onPause={timer.pause}
              onReset={timer.reset}
              onSkip={timer.skip}
              onSwitchMode={timer.switchMode}
              onUpdateSettings={handleUpdateSettings}
            />

            {/* Quick Active Task Banner if selected */}
            {activeTaskId && (
              <div className="max-w-md mx-auto w-full p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs truncate mr-2">
                  <span className="text-slate-400 font-semibold">Active Goal:</span>
                  <span className="text-slate-200 truncate font-medium">
                    {tasks.find((t) => t.id === activeTaskId)?.title}
                  </span>
                </div>
                <button
                  onClick={() => setActiveTaskId(undefined)}
                  className="text-[11px] text-slate-500 hover:text-slate-300"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <TaskTracker
            tasks={tasks}
            subjects={subjects}
            activeTaskId={activeTaskId}
            onSelectTask={(id) => {
              setActiveTaskId(id);
              const task = tasks.find((t) => t.id === id);
              if (task?.subjectId) {
                const sub = subjects.find((s) => s.id === task.subjectId);
                if (sub) setSelectedSubject(sub);
              }
              setActiveTab('timer');
            }}
            onAddTask={handleAddTask}
            onToggleComplete={handleToggleComplete}
            onDeleteTask={handleDeleteTask}
            onIncrementPomo={handleIncrementPomo}
          />
        )}

        {activeTab === 'analytics' && (
          <Analytics sessions={sessions} subjects={subjects} settings={settings} />
        )}

        {activeTab === 'subjects' && (
          <SubjectManager
            subjects={subjects}
            sessions={sessions}
            onAddSubject={handleAddSubject}
            onDeleteSubject={handleDeleteSubject}
          />
        )}
      </main>

      {/* Floating Mini Timer when enabled */}
      {isMiniMode && (
        <MiniTimer
          mode={timer.mode}
          timeLeft={timer.timeLeft}
          totalDuration={timer.totalDuration}
          isRunning={timer.isRunning}
          selectedSubject={selectedSubject}
          onStart={timer.start}
          onPause={timer.pause}
          onReset={timer.reset}
          onExpand={() => setIsMiniMode(false)}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(s) => {
          setSettings(s);
          storage.saveSettings(s);
        }}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />

      {/* Mobile Bottom Navigation Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('timer')}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition ${
            activeTab === 'timer' ? 'text-rose-400 font-bold' : 'text-slate-400'
          }`}
        >
          <TimerIcon className="w-5 h-5" />
          <span className="text-[10px]">Timer</span>
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition ${
            activeTab === 'tasks' ? 'text-rose-400 font-bold' : 'text-slate-400'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[10px]">Tasks</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition ${
            activeTab === 'analytics' ? 'text-rose-400 font-bold' : 'text-slate-400'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px]">Stats</span>
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition ${
            activeTab === 'subjects' ? 'text-rose-400 font-bold' : 'text-slate-400'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px]">Subjects</span>
        </button>
      </div>
    </div>
  );
};

export default App;
