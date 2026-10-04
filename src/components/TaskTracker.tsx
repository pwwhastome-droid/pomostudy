import React, { useState } from 'react';
import { CheckCircle2, Circle, Play, Plus } from 'lucide-react';
import { Task, Subject } from '../types';
import { SubjectSelect } from './SubjectSelect';
import { AddAction, ConfirmDelete, PageHeader, Segmented, Sheet, SheetActions } from './ui';

interface TaskTrackerProps {
  tasks: Task[];
  subjects: Subject[];
  activeTaskId?: string;
  onSelectTask: (taskId: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'completedPomodoros' | 'completed'>) => void;
  onToggleComplete: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onIncrementPomo: (taskId: string) => void;
  onOpenSchedule?: () => void;
}

export const TaskTracker: React.FC<TaskTrackerProps> = ({
  tasks,
  subjects,
  activeTaskId,
  onSelectTask,
  onAddTask,
  onToggleComplete,
  onDeleteTask,
  onIncrementPomo,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(2);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddTask({
      title: title.trim(),
      subjectId: selectedSubjectId || undefined,
      estimatedPomodoros: Math.max(1, estimatedPomodoros),
    });
    setTitle('');
    setIsAdding(false);
    setFilter('active');
  };

  const pending = tasks.filter((t) => !t.completed).length;
  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  return (
    <div className="space-y-4">
      <div className="glass-panel rounded-3xl p-5 sm:p-6">
        <PageHeader
          title="Study tasks"
          subtitle={pending === 0 ? 'Nothing pending' : `${pending} pending`}
          action={<AddAction label="Add task" onClick={() => setIsAdding(true)} />}
        />

        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'active', label: `To do (${pending})` },
            { value: 'completed', label: `Done (${tasks.length - pending})` },
            { value: 'all', label: `All (${tasks.length})` },
          ]}
        />

        <div className="space-y-3 mt-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-10 px-4 border border-dashed border-white/10 rounded-2xl">
              <p className="text-sm font-semibold text-slate-300">
                {filter === 'completed' ? 'No finished tasks yet' : 'No tasks here'}
              </p>
              {filter !== 'completed' && (
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="mt-3 inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-bold"
                >
                  <Plus className="w-4 h-4" /> Add your first task
                </button>
              )}
            </div>
          ) : (
            filteredTasks.map((task) => {
              const subject = task.subjectId ? subjectMap.get(task.subjectId) : undefined;
              const isActive = activeTaskId === task.id;
              const pct = Math.min(100, (task.completedPomodoros / Math.max(1, task.estimatedPomodoros)) * 100);

              return (
                <div
                  key={task.id}
                  className={`rounded-2xl border p-3.5 transition-colors ${
                    isActive
                      ? 'bg-rose-500/10 border-rose-500/40'
                      : 'bg-slate-900/40 border-white/5 hover:border-white/15'
                  }`}
                >
                  {/* Row 1: check + title */}
                  <div className="flex items-start gap-1">
                    <button
                      type="button"
                      onClick={() => onToggleComplete(task.id)}
                      aria-label={task.completed ? 'Mark as not done' : 'Mark as done'}
                      className="w-11 h-11 -ml-2 -mt-1 shrink-0 flex items-center justify-center text-slate-500 hover:text-emerald-400 transition"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <Circle className="w-6 h-6" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p
                        className={`text-sm font-semibold leading-snug break-words ${
                          task.completed ? 'line-through text-slate-500' : 'text-slate-100'
                        }`}
                      >
                        {task.title}
                      </p>
                      {subject && (
                        <span
                          className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold"
                          style={{
                            backgroundColor: `${subject.color}18`,
                            color: subject.color,
                            border: `1px solid ${subject.color}35`,
                          }}
                        >
                          {subject.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: progress, then actions — stable positions on every card */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="font-mono">
                          {task.completedPomodoros}/{task.estimatedPomodoros} pomodoros
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-950/80 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onIncrementPomo(task.id)}
                      aria-label="Log one pomodoro manually"
                      title="Log one pomodoro manually"
                      className="h-10 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold shrink-0 transition active:scale-95"
                    >
                      +1
                    </button>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                    {!task.completed ? (
                      <button
                        type="button"
                        onClick={() => onSelectTask(task.id)}
                        className={`h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 ${
                          isActive
                            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        {isActive ? 'Open timer' : 'Focus on this'}
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-400 font-semibold">Completed</span>
                    )}
                    <ConfirmDelete onConfirm={() => onDeleteTask(task.id)} label="Delete task" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Sheet open={isAdding} title="New task" onClose={() => setIsAdding(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="task-title" className="text-xs font-semibold text-slate-400 block mb-1.5">
              What will you work on?
            </label>
            <input
              id="task-title"
              type="text"
              placeholder="e.g. Finish chapter 4 exercises"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 px-3.5 bg-slate-950/70 border border-white/10 rounded-xl text-sm text-slate-100 placeholder-slate-500"
              autoFocus
            />
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1.5">Subject</span>
            <SubjectSelect
              subjects={subjects}
              selectedSubject={subjects.find((s) => s.id === selectedSubjectId) || null}
              onSelect={(sub) => setSelectedSubjectId(sub.id)}
              size="md"
            />
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1.5">Estimated pomodoros</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEstimatedPomodoros((n) => Math.max(1, n - 1))}
                aria-label="Fewer pomodoros"
                className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-lg font-bold text-white"
              >
                −
              </button>
              <span className="w-10 text-center text-lg font-bold font-mono text-white">{estimatedPomodoros}</span>
              <button
                type="button"
                onClick={() => setEstimatedPomodoros((n) => Math.min(20, n + 1))}
                aria-label="More pomodoros"
                className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-lg font-bold text-white"
              >
                +
              </button>
            </div>
          </div>

          <SheetActions onCancel={() => setIsAdding(false)} submitLabel="Save task" />
        </form>
      </Sheet>
    </div>
  );
};
