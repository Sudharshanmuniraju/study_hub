import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, FolderPlus, NotebookPen, Trash2, X, ChevronRight, GraduationCap, FileText,
} from 'lucide-react';
import { supabase, type Subject, type Note, type Assignment, type Exam } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { GlassCard } from '@/components/GlassCard';

const COLORS = ['blue', 'emerald', 'purple', 'orange', 'pink', 'cyan', 'amber', 'rose'];
const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-500/15 text-blue-400',
  emerald: 'bg-emerald-500/15 text-emerald-400',
  purple: 'bg-purple-500/15 text-purple-400',
  orange: 'bg-orange-500/15 text-orange-400',
  pink: 'bg-pink-500/15 text-pink-400',
  cyan: 'bg-cyan-500/15 text-cyan-400',
  amber: 'bg-amber-500/15 text-amber-400',
  rose: 'bg-rose-500/15 text-rose-400',
};

const STATUSES: Assignment['status'][] = ['todo', 'in_progress', 'submitted'];
const STATUS_LABELS: Record<Assignment['status'], string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  submitted: 'Submitted',
};

export function Classes() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState('blue');

  // Note editor
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Add assignment
  const [newAssignment, setNewAssignment] = useState('');
  const [newAssignmentDue, setNewAssignmentDue] = useState('');

  // Add exam
  const [newExam, setNewExam] = useState('');
  const [newExamDate, setNewExamDate] = useState('');

  const loadSubjects = useCallback(async () => {
    const { data } = await supabase.from('subjects').select('*').order('created_at', { ascending: true });
    setSubjects(data as Subject[] ?? []);
  }, []);

  const loadSubjectData = useCallback(async (subjectId: string) => {
    const [n, a, e] = await Promise.all([
      supabase.from('notes').select('*').eq('subject_id', subjectId).order('updated_at', { ascending: false }),
      supabase.from('assignments').select('*').eq('subject_id', subjectId).order('due_date', { ascending: true }),
      supabase.from('exams').select('*').eq('subject', activeSubject?.name ?? '').order('exam_date', { ascending: true }),
    ]);
    setNotes(n.data as Note[] ?? []);
    setAssignments(a.data as Assignment[] ?? []);
    setExams(e.data as Exam[] ?? []);
  }, [activeSubject]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  useEffect(() => {
    if (activeSubject) loadSubjectData(activeSubject.id);
  }, [activeSubject, loadSubjectData]);

  const addSubject = async () => {
    if (!newSubjectName.trim()) return;
    const { data } = await supabase
      .from('subjects')
      .insert({ name: newSubjectName.trim(), color: newSubjectColor })
      .select()
      .single();
    if (data) {
      setSubjects((prev) => [...prev, data as Subject]);
      setActiveSubject(data as Subject);
    }
    setNewSubjectName('');
    setShowAddSubject(false);
  };

  const deleteSubject = async (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    if (activeSubject?.id === id) setActiveSubject(null);
    await supabase.from('subjects').delete().eq('id', id);
  };

  const openNoteEditor = (note: Note | null) => {
    setEditingNote(note);
    setNoteTitle(note?.title ?? '');
    setNoteContent(note?.content ?? '');
    setShowNoteEditor(true);
  };

  const saveNote = async () => {
    if (!noteTitle.trim() || !activeSubject) return;
    if (editingNote) {
      const { data } = await supabase
        .from('notes')
        .update({ title: noteTitle.trim(), content: noteContent, updated_at: new Date().toISOString() })
        .eq('id', editingNote.id)
        .select()
        .single();
      if (data) setNotes((prev) => prev.map((n) => (n.id === data.id ? data as Note : n)));
    } else {
      const { data } = await supabase
        .from('notes')
        .insert({ subject_id: activeSubject.id, title: noteTitle.trim(), content: noteContent })
        .select()
        .single();
      if (data) setNotes((prev) => [data as Note, ...prev]);
    }
    setShowNoteEditor(false);
  };

  const deleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    await supabase.from('notes').delete().eq('id', id);
  };

  const addAssignment = async () => {
    if (!newAssignment.trim() || !activeSubject) return;
    const { data } = await supabase
      .from('assignments')
      .insert({ subject_id: activeSubject.id, title: newAssignment.trim(), due_date: newAssignmentDue || null })
      .select()
      .single();
    if (data) setAssignments((prev) => [...prev, data as Assignment]);
    setNewAssignment('');
    setNewAssignmentDue('');
  };

  const cycleAssignmentStatus = async (a: Assignment) => {
    const idx = STATUSES.indexOf(a.status);
    const next = STATUSES[(idx + 1) % STATUSES.length];
    setAssignments((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: next } : x)));
    await supabase.from('assignments').update({ status: next }).eq('id', a.id);
  };

  const deleteAssignment = async (id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    await supabase.from('assignments').delete().eq('id', id);
  };

  const addExam = async () => {
    if (!newExam.trim() || !newExamDate || !activeSubject) return;
    const { data } = await supabase
      .from('exams')
      .insert({ title: newExam.trim(), subject: activeSubject.name, exam_date: newExamDate })
      .select()
      .single();
    if (data) setExams((prev) => [...prev, data as Exam].sort((a, b) => a.exam_date.localeCompare(b.exam_date)));
    setNewExam('');
    setNewExamDate('');
  };

  const deleteExam = async (id: string) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
    await supabase.from('exams').delete().eq('id', id);
  };

  return (
    <div className="space-y-5">
      {/* Subject folders */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {subjects.map((subject) => (
            <motion.div
              key={subject.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <GlassCard
                tilt
                glow
                onClick={() => setActiveSubject(subject)}
                className={`p-5 cursor-pointer group ${activeSubject?.id === subject.id ? 'ring-2 ring-accent/40' : ''}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${COLOR_MAP[subject.color] ?? COLOR_MAP.blue}`}>
                    <GraduationCap size={20} />
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSubject(subject.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-secondary hover:text-red-500 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <p className="font-medium text-sm truncate">{subject.name}</p>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add subject */}
        {showAddSubject ? (
          <GlassCard className="p-5">
            <input
              className="glass-input mb-2 text-sm"
              placeholder="Subject name"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSubject()}
              autoFocus
            />
            <div className="flex flex-wrap gap-1.5 mb-3">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewSubjectColor(c)}
                  className={`w-6 h-6 rounded-full ${COLOR_MAP[c]} ${newSubjectColor === c ? 'ring-2 ring-offset-2 ring-offset-transparent ring-white/40' : ''}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={addSubject} className="btn-accent flex-1 text-xs !py-1.5">Add</button>
              <button onClick={() => setShowAddSubject(false)} className="btn-ghost text-xs">Cancel</button>
            </div>
          </GlassCard>
        ) : (
          <button
            onClick={() => setShowAddSubject(true)}
            className="glass glass-hover rounded-2xl p-5 flex flex-col items-center justify-center gap-2 min-h-[120px] border-dashed"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <FolderPlus size={20} className="text-secondary" />
            </div>
            <span className="text-sm text-secondary">New subject</span>
          </button>
        )}
      </div>

      {/* Active subject workspace */}
      <AnimatePresence mode="wait">
        {activeSubject && (
          <motion.div
            key={activeSubject.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-5"
          >
            {/* Notes */}
            <GlassCard className="p-6" glow>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${COLOR_MAP[activeSubject.color] ?? COLOR_MAP.blue}`}>
                    <NotebookPen size={18} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-[15px]">{activeSubject.name} Notes</h2>
                    <p className="text-xs text-secondary">{notes.length} notes</p>
                  </div>
                </div>
                <button onClick={() => openNoteEditor(null)} className="btn-ghost text-xs flex items-center gap-1">
                  <Plus size={14} /> Note
                </button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                {notes.length === 0 && (
                  <p className="text-sm text-secondary text-center py-8">No notes yet for this subject.</p>
                )}
                {notes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => openNoteEditor(note)}
                    className="group/note p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{note.title}</p>
                        <p className="text-xs text-secondary line-clamp-2 mt-1">{note.content || 'Empty note'}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                        className="opacity-0 group-hover/note:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-secondary hover:text-red-500 transition-all shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Assignments + Exams */}
            <div className="space-y-5">
              <GlassCard className="p-6" glow>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center">
                    <FileText size={18} className="text-purple-400" />
                  </div>
                  <h2 className="font-semibold text-[15px]">Assignments</h2>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <input
                    className="glass-input flex-1 text-sm"
                    placeholder="Assignment title"
                    value={newAssignment}
                    onChange={(e) => setNewAssignment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addAssignment()}
                  />
                  <input
                    type="date"
                    className="glass-input sm:w-36 text-sm"
                    value={newAssignmentDue}
                    onChange={(e) => setNewAssignmentDue(e.target.value)}
                  />
                  <button onClick={addAssignment} className="btn-accent text-xs shrink-0 !px-3">
                    <Plus size={14} />
                  </button>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar">
                  {assignments.length === 0 && (
                    <p className="text-sm text-secondary text-center py-4">No assignments yet.</p>
                  )}
                  {assignments.map((a) => (
                    <div key={a.id} className="group/a flex items-center gap-2 p-2.5 rounded-xl bg-white/5">
                      <button
                        onClick={() => cycleAssignmentStatus(a)}
                        className={`text-[10px] px-2.5 py-1 rounded-full font-medium shrink-0 transition-all hover:scale-105 ${
                          a.status === 'todo'
                            ? 'bg-slate-500/20 text-slate-400'
                            : a.status === 'in_progress'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {STATUS_LABELS[a.status]}
                      </button>
                      <span className="text-sm truncate flex-1">{a.title}</span>
                      {a.due_date && <span className="text-xs text-secondary shrink-0">{new Date(a.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                      <button
                        onClick={() => deleteAssignment(a.id)}
                        className="opacity-0 group-hover/a:opacity-100 p-1 rounded-lg hover:bg-red-500/10 text-secondary hover:text-red-500 transition-all shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-6" glow>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center">
                    <GraduationCap size={18} className="text-orange-400" />
                  </div>
                  <h2 className="font-semibold text-[15px]">Exam Dates</h2>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <input
                    className="glass-input flex-1 text-sm"
                    placeholder="Exam title"
                    value={newExam}
                    onChange={(e) => setNewExam(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addExam()}
                  />
                  <input
                    type="date"
                    className="glass-input sm:w-36 text-sm"
                    value={newExamDate}
                    onChange={(e) => setNewExamDate(e.target.value)}
                  />
                  <button onClick={addExam} className="btn-accent text-xs shrink-0 !px-3">
                    <Plus size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  {exams.length === 0 && (
                    <p className="text-sm text-secondary text-center py-4">No exams scheduled.</p>
                  )}
                  {exams.map((e) => (
                    <div key={e.id} className="group/e flex items-center gap-2 p-2.5 rounded-xl bg-white/5">
                      <ChevronRight size={14} className="text-orange-400 shrink-0" />
                      <span className="text-sm truncate flex-1">{e.title}</span>
                      <span className="text-xs text-secondary shrink-0">{new Date(e.exam_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <button
                        onClick={() => deleteExam(e.id)}
                        className="opacity-0 group-hover/e:opacity-100 p-1 rounded-lg hover:bg-red-500/10 text-secondary hover:text-red-500 transition-all shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Note editor modal */}
      <AnimatePresence>
        {showNoteEditor && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNoteEditor(false)} />
            <motion.div
              className="glass rounded-3xl w-full max-w-lg p-6 relative"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            >
              <button onClick={() => setShowNoteEditor(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors">
                <X size={18} className="text-secondary" />
              </button>
              <h3 className="font-semibold mb-4">{editingNote ? 'Edit Note' : 'New Note'}</h3>
              <div className="space-y-3">
                <input
                  className="glass-input"
                  placeholder="Note title"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  autoFocus
                />
                <textarea
                  className="glass-input min-h-[160px] resize-none"
                  placeholder="Write your note content…"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowNoteEditor(false)} className="btn-ghost">Cancel</button>
                  <button onClick={saveNote} disabled={!noteTitle.trim()} className="btn-accent">Save</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
