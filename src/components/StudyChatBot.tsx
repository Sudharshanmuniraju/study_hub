import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, MessageSquare, Trash2, Lightbulb, Brain, ClipboardList } from 'lucide-react';
import { streamChat } from '@/lib/gemini';

type ChatMsg = {
  id: string;
  role: 'user' | 'model';
  text: string;
};

const SUGGESTIONS = [
  { icon: Brain, label: 'Explain a concept', prompt: 'Can you explain the concept of photosynthesis in simple terms?' },
  { icon: Lightbulb, label: 'Summarize my notes', prompt: 'Can you help me summarize my study notes on World War II?' },
  { icon: ClipboardList, label: 'Quiz me', prompt: 'Quiz me on basic calculus derivatives. Ask one question at a time.' },
];

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export function StudyChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [partial, setPartial] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, partial, scrollToBottom]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const userMsg: ChatMsg = { id: uid(), role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setStreaming(true);
    setPartial('');

    const history = messages.map((m) => ({ role: m.role, text: m.text }));

    try {
      let full = '';
      for await (const chunk of streamChat(history, trimmed)) {
        if (chunk.text) {
          full += chunk.text;
          setPartial(full);
        }
      }

      setMessages((prev) => [...prev, { id: uid(), role: 'model', text: full || 'Sorry, I could not generate a response.' }]);
      setPartial('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setMessages((prev) => [...prev, { id: uid(), role: 'model', text: `Error: ${msg}` }]);
      setPartial('');
    } finally {
      setStreaming(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setPartial('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const autoResize = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  useEffect(() => {
    autoResize();
  }, [input]);

  return (
    <>
      {/* Floating toggle button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.4 }}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-accent text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow group"
        style={{ boxShadow: '0 8px 30px rgba(10, 132, 255, 0.4)' }}
        aria-label="Toggle study assistant"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={22} />
            </motion.span>
          ) : (
            <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <Sparkles size={22} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] sm:w-[420px] h-[560px] max-h-[calc(100vh-8rem)] glass rounded-3xl flex flex-col overflow-hidden"
            style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center">
                  <Sparkles size={18} className="text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Study Buddy</h3>
                  <p className="text-xs text-secondary">AI study tutor</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="p-2 rounded-lg hover:bg-white/10 text-secondary transition-colors"
                    aria-label="Clear chat"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 text-secondary transition-colors"
                  aria-label="Close chat"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && !partial && (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                    <Sparkles size={26} className="text-accent" />
                  </div>
                  <h4 className="font-semibold mb-1">Ask me anything</h4>
                  <p className="text-sm text-secondary mb-5 max-w-[280px]">
                    I can explain concepts, summarize notes, quiz you, and help you study smarter.
                  </p>
                  <div className="space-y-2 w-full max-w-[300px]">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s.label}
                        onClick={() => send(s.prompt)}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-accent/30 transition-colors text-left group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                          <s.icon size={15} className="text-accent" />
                        </div>
                        <span className="text-sm text-secondary group-hover:text-[var(--text-primary)] transition-colors">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}

              {/* Streaming partial response */}
              {partial && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles size={14} className="text-accent" />
                  </div>
                  <div className="rounded-2xl rounded-tl-md px-3.5 py-2.5 max-w-[80%] bg-white/5 border border-white/10">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {partial}
                      <span className="cursor-blink" />
                    </p>
                  </div>
                </div>
              )}

              {/* Loading indicator (before first chunk) */}
              {streaming && !partial && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles size={14} className="text-accent" />
                  </div>
                  <div className="rounded-2xl rounded-tl-md px-4 py-3 bg-white/5 border border-white/10">
                    <div className="flex items-center gap-1.5">
                      <Dot delay={0} />
                      <Dot delay={0.15} />
                      <Dot delay={0.3} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: 'var(--glass-border)' }}>
              <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 focus-within:border-accent transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask your study question…"
                  rows={1}
                  className="flex-1 bg-transparent outline-none text-sm resize-none leading-relaxed py-1"
                  style={{ color: 'var(--text-primary)', maxHeight: '120px' }}
                  disabled={streaming}
                />
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim() || streaming}
                  className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center shrink-0 transition-opacity disabled:opacity-30"
                  aria-label="Send message"
                >
                  <Send size={15} />
                </button>
              </div>
              <p className="text-[10px] text-secondary mt-2 text-center">
                Powered by Gemini Flash · Enter to send, Shift+Enter for new line
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MessageBubble({ msg }: { msg: ChatMsg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          isUser ? 'bg-accent/20' : 'bg-accent/15'
        }`}
      >
        {isUser ? (
          <MessageSquare size={13} className="text-accent" />
        ) : (
          <Sparkles size={14} className="text-accent" />
        )}
      </div>
      <div
        className={`rounded-2xl px-3.5 py-2.5 max-w-[80%] ${
          isUser
            ? 'rounded-tr-md bg-accent text-white'
            : 'rounded-tl-md bg-white/5 border border-white/10'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
      </div>
    </motion.div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <motion.div
      className="w-1.5 h-1.5 rounded-full bg-accent"
      animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
      transition={{ duration: 1, repeat: Infinity, delay }}
    />
  );
}
