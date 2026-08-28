import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ExternalLink, Bookmark, X, Globe } from 'lucide-react';
import { supabase, type ResourceLink } from '@/lib/supabase';
import { GlassCard } from '@/components/GlassCard';

const CATEGORIES = ['Student Portal', 'Flashcard Apps', 'Textbook Links', 'Citation Tools', 'General'];

const CATEGORY_ICONS: Record<string, { icon: typeof Bookmark; color: string }> = {
  'Student Portal': { icon: Globe, color: 'bg-blue-500/15 text-blue-400' },
  'Flashcard Apps': { icon: Bookmark, color: 'bg-emerald-500/15 text-emerald-400' },
  'Textbook Links': { icon: Bookmark, color: 'bg-purple-500/15 text-purple-400' },
  'Citation Tools': { icon: Bookmark, color: 'bg-orange-500/15 text-orange-400' },
  General: { icon: Bookmark, color: 'bg-slate-500/15 text-slate-400' },
};

export function Resources() {
  const [bookmarks, setBookmarks] = useState<ResourceLink[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState('Student Portal');

  const load = useCallback(async () => {
    const { data } = await supabase.from('resource_links').select('*').order('created_at', { ascending: false });
    setBookmarks(data as ResourceLink[] ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addBookmark = async () => {
    if (!newTitle.trim() || !newUrl.trim()) return;
    let url = newUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    const { data } = await supabase
      .from('resource_links')
      .insert({ title: newTitle.trim(), url, category: newCategory })
      .select()
      .single();
    if (data) setBookmarks((prev) => [data as ResourceLink, ...prev]);
    setNewTitle('');
    setNewUrl('');
    setShowForm(false);
  };

  const deleteBookmark = async (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    await supabase.from('resource_links').delete().eq('id', id);
  };

  const byCategory = (cat: string) => bookmarks.filter((b) => b.category === cat);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-secondary">{bookmarks.length} saved resources</p>
        <button onClick={() => setShowForm(true)} className="btn-accent text-sm flex items-center gap-1.5">
          <Plus size={15} /> Add resource
        </button>
      </div>

      {CATEGORIES.map((category) => {
        const items = byCategory(category);
        if (items.length === 0) return null;
        const meta = CATEGORY_ICONS[category] ?? CATEGORY_ICONS.General;
        return (
          <div key={category}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${meta.color}`}>
                <meta.icon size={16} />
              </div>
              <h2 className="font-semibold text-[15px]">{category}</h2>
              <span className="text-xs text-secondary">({items.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {items.map((bm) => (
                  <motion.div
                    key={bm.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <GlassCard tilt glow className="p-5 group">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <a
                          href={bm.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-w-0 flex-1"
                        >
                          <p className="font-medium text-sm truncate hover:text-accent transition-colors">{bm.title}</p>
                          <p className="text-xs text-secondary truncate mt-0.5">
                            {(() => {
                              try { return new URL(bm.url).hostname.replace('www.', ''); } catch { return bm.url; }
                            })()}
                          </p>
                        </a>
                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={bm.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-white/10 text-secondary transition-colors"
                          >
                            <ExternalLink size={14} />
                          </a>
                          <button
                            onClick={() => deleteBookmark(bm.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-secondary hover:text-red-500 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        );
      })}

      {bookmarks.length === 0 && (
        <GlassCard className="p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Bookmark size={24} className="text-secondary" />
          </div>
          <h3 className="font-semibold mb-1">No resources yet</h3>
          <p className="text-sm text-secondary mb-5">Add bookmarks for your favorite study tools and links.</p>
          <button onClick={() => setShowForm(true)} className="btn-accent text-sm inline-flex items-center gap-1.5">
            <Plus size={15} /> Add your first resource
          </button>
        </GlassCard>
      )}

      {/* Add bookmark modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
            <motion.div
              className="glass rounded-3xl w-full max-w-md p-6 relative"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            >
              <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors">
                <X size={18} className="text-secondary" />
              </button>
              <h3 className="font-semibold mb-4">Add Resource</h3>
              <div className="space-y-3">
                <input
                  className="glass-input"
                  placeholder="Resource title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                />
                <input
                  className="glass-input"
                  placeholder="https://example.com"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
                <select
                  className="glass-input"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-slate-800">{c}</option>
                  ))}
                </select>
                <div className="flex gap-2 justify-end pt-1">
                  <button onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
                  <button onClick={addBookmark} disabled={!newTitle.trim() || !newUrl.trim()} className="btn-accent">Save</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
