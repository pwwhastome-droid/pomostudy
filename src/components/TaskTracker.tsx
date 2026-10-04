import React, { useState } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, Clock, Sparkles } from 'lucide-react';
import { Task, Subject } from '../types';
import { SubjectSelect } from './SubjectSelect';

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
  onOpenSchedule,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(2);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

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
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  return (
    <div className="glass-panel rounded-3xl p-5 sm:p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
            <span>Study Tasks</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
              {tasks.filter((t) => !t.completed).length} pending
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSchedule && (
            <button
              onClick={onOpenSchedule}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-pill hover:bg-white/10 text-slate-300 text-xs font-bold transition active:scale-95"
            >
              <span>Class Alarms & Calendar</span>
            </button>
          )}
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-500/20 border border-rose-400/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Add Task Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-5 p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3.5 shadow-xl animate-in fade-in zoom-in-95">
          <input
            type="text"
            placeholder="e.g. Master dynamic programming memoization..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-white/10 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            autoFocus
          />

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[160px]">
              <span className="text-slate-400 font-medium shrink-0">Subject:</span>
              <SubjectSelect
                subjects={subjects}
                selectedSubject={subjects.find((s) => s.id === selectedSubjectId) || null}
                onSelect={(sub) => setSelectedSubjectId(sub.id)}
                size="sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Est. Pomos:</span>
              <input
                type="number"
                min="1"
                max="20"
                value={estimatedPomodoros}
                onChange={(e) => setEstimatedPomodoros(parseInt(e.target.value) || 1)}
                className="w-14 bg-slate-950/80 border border-white/10 rounded-lg px-2 py-1 text-slate-200 text-center font-bold focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t border-white/5">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20"
            >
              Save Task
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 mb-4 p-1 glass-pill rounded-xl w-fit text-xs border border-white/5">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-lg font-bold transition-all ${
            filter === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All ({tasks.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-1 rounded-lg font-bold transition-all ${
            filter === 'active' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3 py-1 rounded-lg font-bold transition-all ${
            filter === 'completed' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Done
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs font-medium border border-dashed border-white/10 rounded-2xl">
            No study tasks in this list. Click + Add Task to create one!
          </div>
        ) : (
          filteredTasks.map((task) => {
            const subject = task.subjectId ? subjectMap.get(task.subjectId) : undefined;
            const isActive = activeTaskId === task.id;

            return (
              <div
                key={task.id}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 ${
                  isActive
                    ? 'bg-rose-500/10 border-rose-500/40 shadow-lg shadow-rose-500/10'
                    : 'bg-slate-900/40 border-white/5 hover:border-white/15 hover:bg-slate-900/70'
                }`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0 mr-3">
                  <button
                    onClick={() => onToggleComplete(task.id)}
                    className="text-slate-500 hover:text-emerald-400 transition"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        task.completed ? 'line-through text-slate-500' : 'text-slate-200'
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      {subject && (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold"
                          style={{
                            backgroundColor: `${subject.color}18`,
                            color: subject.color,
                            border: `1px solid ${subject.color}35`,
                          }}
                        >
                          {subject.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {task.completedPomodoros}/{task.estimatedPomodoros}
                        <button
                          onClick={() => onIncrementPomo(task.id)}
                          title="Manually log 1 pomodoro"
                          className="ml-1 text-[10px] px-1.5 py-0.2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-sans font-bold"
                        >
                          +1
                        </button>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {!task.completed && (
                    <button
                      onClick={() => onSelectTask(task.id)}
                      title={isActive ? 'Active Task' : 'Focus on this task'}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                        isActive
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {isActive ? <Sparkles className="w-3.5 h-3.5" /> : null}
                      {isActive ? 'Active' : 'Focus'}
                    </button>
                  )}

                  <button
                    onClick={() => onDeleteTask(task.id)}
                    title="Delete task"
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
