import React, { useState } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, Clock, Sparkles } from 'lucide-react';
import { Task, Subject } from '../types';

interface TaskTrackerProps {
  tasks: Task[];
  subjects: Subject[];
  activeTaskId?: string;
  onSelectTask: (taskId: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'completedPomodoros' | 'completed'>) => void;
  onToggleComplete: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onIncrementPomo: (taskId: string) => void;
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
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Study Tasks</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {tasks.filter((t) => !t.completed).length} pending
            </span>
          </h2>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-semibold border border-rose-500/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Add Task Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-4 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-3">
          <input
            type="text"
            placeholder="e.g. Solve Chapter 4 calculus exercises..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            autoFocus
          />

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
              <span className="text-slate-400">Subject:</span>
              <select
                aria-label="Select subject for task"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-slate-200 focus:outline-none flex-1"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Est. Pomodoros:</span>
              <input
                type="number"
                min="1"
                max="20"
                value={estimatedPomodoros}
                onChange={(e) => setEstimatedPomodoros(parseInt(e.target.value) || 1)}
                className="w-14 bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-slate-200 text-center focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20"
            >
              Save Task
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-3 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-2.5 py-1 rounded-lg transition ${
            filter === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          All ({tasks.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-2.5 py-1 rounded-lg transition ${
            filter === 'active' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-2.5 py-1 rounded-lg transition ${
            filter === 'completed' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No study tasks in this list. Click + Add Task to create one!
          </div>
        ) : (
          filteredTasks.map((task) => {
            const subject = task.subjectId ? subjectMap.get(task.subjectId) : undefined;
            const isActive = activeTaskId === task.id;

            return (
              <div
                key={task.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-rose-500/10 border-rose-500/40 shadow-sm shadow-rose-500/10'
                    : 'bg-slate-900/50 border-slate-800/70 hover:border-slate-700/80'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
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
                      className={`text-sm font-medium truncate ${
                        task.completed ? 'line-through text-slate-500' : 'text-slate-200'
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      {subject && (
                        <span
                          className="inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-semibold"
                          style={{
                            backgroundColor: `${subject.color}22`,
                            color: subject.color,
                            borderColor: `${subject.color}44`,
                          }}
                        >
                          {subject.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {task.completedPomodoros}/{task.estimatedPomodoros} pomos
                        <button
                          onClick={() => onIncrementPomo(task.id)}
                          title="Manually log 1 pomodoro"
                          className="ml-1 text-[10px] px-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                        >
                          +1
                        </button>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {!task.completed && (
                    <button
                      onClick={() => onSelectTask(task.id)}
                      title={isActive ? 'Active Task' : 'Focus on this task'}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                        isActive
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {isActive ? <Sparkles className="w-3 h-3" /> : null}
                      {isActive ? 'Active' : 'Focus'}
                    </button>
                  )}

                  <button
                    onClick={() => onDeleteTask(task.id)}
                    title="Delete task"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
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
