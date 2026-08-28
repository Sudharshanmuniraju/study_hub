import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Trash2, CalendarClock, NotebookPen, AlarmClock, ListTodo } from 'lucide-react';
import { supabase, type Todo, type Exam, type Note, type Assignment } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { GlassCard } from '@/components/GlassCard';

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function Dashboard() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [adding, setAdding] = useState(false);

  const loadAll = useCallback(async () => {
    if (!user) return;
    const [t, e, n, a] = await Promise.all([
      supabase.from('todos').select('*').order('created_at', { ascending: false }),
      supabase.from('exams').select('*').order('exam_date', { ascending: true }),
      supabase.from('notes').select('*').order('updated_at', { ascending: false }).limit(4),
      supabase.from('assignments').select('*').order('due_date', { ascending: true }),
    ]);
    setTodos(t.data as Todo[] ?? []);
    setExams(e.data as Exam[] ?? []);
    setNotes(n.data as Note[] ?? []);
    setAssignments(a.data as Assignment[] ?? []);
  }, [user]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const addTodo = async () => {
    if (!newTask.trim()) return;
    setAdding(true);
    const { data } = await supabase
      .from('todos')
      .insert({ task: newTask.trim(), due_date: newTaskDate || null })
      .select()
      .single();
    if (data) setTodos((prev) => [data as Todo, ...prev]);
    setNewTask('');
    setNewTaskDate('');
    setAdding(false);
  };

  const toggleTodo = async (todo: Todo) => {
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, completed: !t.completed } : t)));
    await supabase.from('todos').update({ completed: !todo.completed }).eq('id', todo.id);
  };

  const deleteTodo = async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await supabase.from('todos').delete().eq('id', id);
  };

  const upcomingExams = exams.filter((e) => daysUntil(e.exam_date) >= 0).slice(0, 4);
  const pendingTodos = todos.filter((t) => !t.completed);
  const completedCount = todos.length - pendingTodos.length;
  const upcomingAssignments = assignments.filter((a) => a.status !== 'submitted').slice(0, 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* To-Do List */}
      <div className="lg:col-span-2 space-y-5">
        <GlassCard className="p-6 group" glow>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center">
                <ListTodo size={18} className="text-accent" />
              </div>
              <div>
                <h2 className="font-semibold text-[15px]">Today's To-Do</h2>
                <p className="text-xs text-secondary">
                  {completedCount} done · {pendingTodos.length} remaining
                </p>
              </div>
            </div>
          </div>

          {/* Add task */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              className="glass-input flex-1"
              placeholder="Add a task…"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            />
            <input
              type="date"
              className="glass-input sm:w-40"
              value={newTaskDate}
              onChange={(e) => setNewTaskDate(e.target.value)}
            />
            <button onClick={addTodo} disabled={adding || !newTask.trim()} className="btn-accent shrink-0">
              <Plus size={16} className="inline -mt-0.5" />
            </button>
          </div>

          {/* Progress bar */}
          {todos.length > 0 && (
            <div className="h-1.5 rounded-full bg-white/10 mb-4 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={{ width: 0 }}
                animate={{ width: `${(completedCount / todos.length) * 100}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              />
            </div>
          )}

          {/* List */}
          <div className="space-y-1.5 max-h-[340px] overflow-y-auto no-scrollbar">
            <AnimatePresence>
              {todos.map((todo) => (
                <motion.div
                  key={todo.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, height: 0 }}
                  className="group/item flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <button
                    onClick={() => toggleTodo(todo)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      todo.completed ? 'bg-accent border-accent' : 'border-white/30 hover:border-accent'
                    }`}
                  >
                    {todo.completed && <Check size={12} className="text-white" />}
                  </button>
                  <span
                    className={`flex-1 text-sm ${todo.completed ? 'line-through text-secondary' : ''}`}
                  >
                    {todo.task}
                  </span>
                  {todo.due_date && (
                    <span className="text-xs text-secondary hidden sm:block">{formatDate(todo.due_date)}</span>
                  )}
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="opacity-0 group-hover/item:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-secondary hover:text-red-500 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {todos.length === 0 && (
              <p className="text-sm text-secondary text-center py-8">No tasks yet. Add one above to get started.</p>
            )}
          </div>
        </GlassCard>

        {/* Recent notes overview */}
        <GlassCard className="p-6 group" glow>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <NotebookPen size={18} className="text-emerald-500" />
            </div>
            <h2 className="font-semibold text-[15px]">Recent Notes</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {notes.length === 0 && (
              <p className="text-sm text-secondary col-span-full py-4">No notes yet. Create some in the Classes tab.</p>
            )}
            {notes.map((note) => (
              <div key={note.id} className="p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 transition-colors">
                <p className="text-sm font-medium truncate">{note.title}</p>
                <p className="text-xs text-secondary line-clamp-2 mt-1">{note.content || 'Empty note'}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Right column */}
      <div className="space-y-5">
        {/* Exam countdown */}
        <GlassCard className="p-6 group" tilt glow>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center">
              <AlarmClock size={18} className="text-orange-500" />
            </div>
            <h2 className="font-semibold text-[15px]">Upcoming Deadlines</h2>
          </div>
          <div className="space-y-3">
            {upcomingExams.length === 0 && (
              <p className="text-sm text-secondary py-4">No exams scheduled. Add some in the Classes tab.</p>
            )}
            {upcomingExams.map((exam) => {
              const days = daysUntil(exam.exam_date);
              return (
                <div key={exam.id} className="flex items-center gap-3">
                  <div className="text-center shrink-0 w-14">
                    <p className={`text-2xl font-bold ${days <= 3 ? 'text-red-500' : days <= 7 ? 'text-orange-500' : 'text-accent'}`}>
                      {days}
                    </p>
                    <p className="text-[10px] text-secondary uppercase tracking-wide">{days === 1 ? 'day' : 'days'}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{exam.title}</p>
                    <p className="text-xs text-secondary flex items-center gap-1">
                      <CalendarClock size={11} /> {formatDate(exam.exam_date)}
                      {exam.subject && ` · ${exam.subject}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Schedule overview */}
        <GlassCard className="p-6 group" glow>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center">
              <CalendarClock size={18} className="text-purple-500" />
            </div>
            <h2 className="font-semibold text-[15px]">Assignments</h2>
          </div>
          <div className="space-y-2">
            {upcomingAssignments.length === 0 && (
              <p className="text-sm text-secondary py-4">No pending assignments.</p>
            )}
            {upcomingAssignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                <span className="text-sm truncate flex-1">{a.title}</span>
                <span
                  className={`text-[10px] px-2 py-1 rounded-full font-medium shrink-0 ml-2 ${
                    a.status === 'todo'
                      ? 'bg-slate-500/20 text-slate-400'
                      : a.status === 'in_progress'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {a.status === 'todo' ? 'To Do' : a.status === 'in_progress' ? 'In Progress' : 'Submitted'}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
