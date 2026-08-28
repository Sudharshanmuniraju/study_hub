import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Bot, User as UserIcon, Brain, BookOpen, FileText, HelpCircle, AlertCircle } from 'lucide-react';
import type { ChatMessage } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { GlassCard } from '@/components/GlassCard';

const QUICK_PROMPTS = [
  { icon: Brain, label: 'Explain this concept simply', prompt: 'Explain the concept of recursion in programming as simply as you can, with a real-world analogy.' },
  { icon: FileText, label: 'Summarize my reading', prompt: "Summarize the key ideas I should remember from a chapter on cellular respiration. Give me 5 bullet points." },
  { icon: HelpCircle, label: 'Generate practice quiz', prompt: 'Generate 5 practice quiz questions about the French Revolution, with answers at the end.' },
  { icon: BookOpen, label: 'Help me brainstorm', prompt: 'Help me brainstorm essay topics about the impact of artificial intelligence on education.' },
];

/** Simulated fallback used when the edge function is unreachable. */
function simulatedResponse(userText: string): string {
  const lower = userText.toLowerCase();
  if (lower.includes('recursion')) {
    return "Recursion is when a function calls itself to solve a smaller version of the same problem.\n\nThink of Russian nesting dolls: to open the biggest one, you open it, find a smaller doll inside, and repeat until you reach the tiniest doll that doesn't open. That last doll is the \"base case\" — the stopping point.\n\nIn code, every recursive function needs:\n1. A base case (when to stop)\n2. A recursive case (calling itself with a smaller input)\n\nWithout a base case, the function calls itself forever — like an infinite loop that eventually crashes with a stack overflow.";
  }
  return "That's a great question! Here's how I'd approach it:\n\nFirst, let's break the topic into its core components. Understanding the fundamentals gives you a solid foundation. Then, we can look at how those components connect and build on each other.\n\nIf you can share more specifics about what you're studying, I can give you a more tailored explanation with examples, analogies, and practice questions. What subject is this for?";
}

export function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const streamSimulated = (text: string, msgId: string) => {
    const full = simulatedResponse(text);
    const words = full.split(/(\s+)/);
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      if (i > words.length) {
        clearInterval(interval);
        setStreaming(false);
        return;
      }
      const partial = words.slice(0, i).join('');
      setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, content: partial } : m)));
    }, 24);
  };

  const streamFromEdgeFunction = useCallback(async (history: ChatMessage[], userText: string, msgId: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    const url = `${supabaseUrl}/functions/v1/ai-chat`;

    // The edge function has JWT verification on, so we must send the user's
    // session access token — not the anon key — in the Authorization header.
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token ?? anonKey;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          apikey: anonKey,
        },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => '');
        console.warn('Edge function response not ok:', res.status, errText);
        throw new Error(`Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, content: acc } : m)));
      }

      if (!acc.trim()) throw new Error('Empty response');
      setStreaming(false);
    } catch (err) {
      console.warn('Edge function unavailable, using simulated response:', err);
      setError('Could not reach the AI service. Showing a sample response instead.');
      setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, content: '' } : m)));
      streamSimulated(userText, msgId);
    }
  }, []);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    setError(null);

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: trimmed, createdAt: Date.now() };
    const assistantId = crypto.randomUUID();
    const history = [...messages, userMsg];

    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '', createdAt: Date.now() }]);
    setInput('');
    setStreaming(true);

    setTimeout(() => streamFromEdgeFunction(history, trimmed, assistantId), 200);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <GlassCard className="flex flex-col h-[calc(100vh-160px)] min-h-[500px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2.5 p-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center">
            <Sparkles size={18} className="text-accent" />
          </div>
          <div>
            <h2 className="font-semibold text-[15px]">AI Study Assistant</h2>
            <p className="text-xs text-secondary">Brainstorm, summarize, and quiz yourself</p>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                <Sparkles size={28} className="text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-1">How can I help you study?</h3>
              <p className="text-sm text-secondary mb-6 max-w-xs">
                Ask me to explain a concept, summarize a reading, or generate a practice quiz.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-md">
                {QUICK_PROMPTS.map((qp) => (
                  <button
                    key={qp.label}
                    onClick={() => send(qp.prompt)}
                    className="p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <qp.icon size={15} className="text-accent" />
                      <span className="text-sm font-medium">{qp.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                  msg.role === 'user' ? 'bg-accent/20' : 'bg-white/10'
                }`}>
                  {msg.role === 'user' ? <UserIcon size={15} /> : <Bot size={15} />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' ? 'bg-accent text-white' : 'glass'
                }`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                    {streaming && msg.role === 'assistant' && messages[messages.length - 1]?.id === msg.id && (
                      <span className="cursor-blink" />
                    )}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {error && (
            <div className="flex items-center gap-2 text-sm text-amber-500 bg-amber-500/10 rounded-xl px-4 py-3">
              <AlertCircle size={15} />
              {error}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-2 items-end">
            <textarea
              className="glass-input resize-none max-h-32 min-h-[44px]"
              placeholder="Ask anything about your studies…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || streaming}
              className="btn-accent shrink-0 !p-3"
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
