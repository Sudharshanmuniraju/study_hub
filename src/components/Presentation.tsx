import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, LayoutDashboard, BookOpen, Sparkles, Bookmark,
  PenTool, Code2, ChevronLeft, ChevronRight, Maximize2,
  ListTodo, AlarmClock, NotebookPen, FileText, Globe,
  MousePointer2, Palette, Layers, Zap, CheckCircle2, ArrowRight,
  CalendarClock, FolderPlus, Sun, Moon,
} from 'lucide-react';

/* ── Slide data ────────────────────────────────────────────── */

type SlideMeta = {
  kind: 'cover' | 'section' | 'content' | 'split' | 'closing';
  accent: string;
};

const SLIDES: { meta: SlideMeta; render: () => ReactNode }[] = [
  /* 1 ─ Cover */
  {
    meta: { kind: 'cover', accent: '#38bdf8' },
    render: () => <CoverSlide />,
  },
  /* 2 ─ Overview / Agenda */
  {
    meta: { kind: 'content', accent: '#818cf8' },
    render: () => <AgendaSlide />,
  },
  /* 3 ─ Planner intro */
  {
    meta: { kind: 'section', accent: '#34d399' },
    render: () => <SectionSlide
      index="01" role="The Planner" icon={LayoutDashboard}
      tagline="Structure & Strategy"
      description="Deciding what the app needs, how it's organized, and which instruments serve the student's workflow."
      accent="#34d399"
    />,
  },
  /* 4 ─ Planner: Dashboard */
  {
    meta: { kind: 'split', accent: '#34d399' },
    render: () => <PlannerDashboardSlide />,
  },
  /* 5 ─ Planner: Classes + Assistant + Resources */
  {
    meta: { kind: 'split', accent: '#34d399' },
    render: () => <PlannerInstrumentsSlide />,
  },
  /* 6 ─ Designer intro */
  {
    meta: { kind: 'section', accent: '#f472b6' },
    render: () => <SectionSlide
      index="02" role="The Designer" icon={Palette}
      tagline="UI / UX & Interface"
      description="Crafting the visual language — glassmorphism, motion-aware cards, the top navigation bar, and micro-interactions that make the app feel alive."
      accent="#f472b6"
    />,
  },
  /* 7 ─ Designer: UI showcase */
  {
    meta: { kind: 'split', accent: '#f472b6' },
    render: () => <DesignerUISlide />,
  },
  /* 8 ─ Builder intro */
  {
    meta: { kind: 'section', accent: '#fbbf24' },
    render: () => <SectionSlide
      index="03" role="The Builder" icon={Code2}
      tagline="Code & Execution"
      description="Turning the design into a working app — React, TypeScript, Supabase, edge functions, and the architecture that ties it all together."
      accent="#fbbf24"
    />,
  },
  /* 9 ─ Builder: Tech stack */
  {
    meta: { kind: 'split', accent: '#fbbf24' },
    render: () => <BuilderStackSlide />,
  },
  /* 10 ─ Closing */
  {
    meta: { kind: 'closing', accent: '#38bdf8' },
    render: () => <ClosingSlide />,
  },
];

/* ── Shared building blocks ───────────────────────────────── */

function StaggerItem({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Pill({ icon: Icon, label, color }: { icon: typeof Zap; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
      <Icon size={15} style={{ color }} />
      <span className="text-sm font-medium text-white/90">{label}</span>
    </div>
  );
}

/* ── Mini UI mockups (stylized screenshots) ────────────────── */

function MockNavbar({ active = 'Dashboard' }: { active?: string }) {
  const tabs = ['Dashboard', 'Classes', 'AI Assistant', 'Resources'];
  return (
    <div className="flex items-center justify-between px-4 h-11 rounded-2xl bg-white/8 border border-white/10 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-sky-400/20 flex items-center justify-center">
          <GraduationCap size={15} className="text-sky-300" />
        </div>
        <span className="text-xs font-semibold hidden sm:block">Study Hub</span>
      </div>
      <div className="flex items-center gap-0.5">
        {tabs.map((t) => (
          <div
            key={t}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
              t === active ? 'bg-sky-400/20 text-white' : 'text-white/40'
            }`}
          >
            {t}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
          <Sun size={12} className="text-white/60" />
        </div>
        <div className="w-7 h-7 rounded-full bg-pink-400/30 text-pink-200 flex items-center justify-center text-[10px] font-bold">JD</div>
      </div>
    </div>
  );
}

function MockDashboard() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {/* To-do card */}
      <div className="col-span-2 rounded-2xl bg-white/6 border border-white/10 p-4 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-sky-400/20 flex items-center justify-center">
            <ListTodo size={14} className="text-sky-300" />
          </div>
          <span className="text-xs font-semibold">Today's To-Do</span>
          <span className="text-[10px] text-white/40 ml-1">2 done · 3 remaining</span>
        </div>
        <div className="h-1 rounded-full bg-white/10 mb-3 overflow-hidden">
          <div className="h-full rounded-full bg-sky-400" style={{ width: '40%' }} />
        </div>
        <div className="space-y-1.5">
          {['Read Chapter 7', 'Solve calculus problems', 'Review biology notes'].map((t, i) => (
            <div key={t} className="flex items-center gap-2 py-1">
              <div className={`w-4 h-4 rounded-full border-2 ${i === 0 ? 'bg-sky-400 border-sky-400' : 'border-white/30'} flex items-center justify-center`}>
                {i === 0 && <CheckCircle2 size={10} className="text-white" />}
              </div>
              <span className={`text-[11px] ${i === 0 ? 'line-through text-white/30' : 'text-white/70'}`}>{t}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Deadlines card */}
      <div className="rounded-2xl bg-white/6 border border-white/10 p-4 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-orange-400/20 flex items-center justify-center">
            <AlarmClock size={14} className="text-orange-300" />
          </div>
          <span className="text-xs font-semibold">Deadlines</span>
        </div>
        <div className="space-y-2.5">
          {[
            { days: '3', label: 'Math Midterm', color: 'text-red-400' },
            { days: '7', label: 'Bio Lab Report', color: 'text-orange-300' },
            { days: '14', label: 'History Essay', color: 'text-sky-300' },
          ].map((e) => (
            <div key={e.label} className="flex items-center gap-2">
              <div className="text-center w-9">
                <p className={`text-lg font-bold ${e.color}`}>{e.days}</p>
                <p className="text-[8px] text-white/40 uppercase">days</p>
              </div>
              <span className="text-[11px] text-white/70 truncate">{e.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockClasses() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {[
        { name: 'Mathematics', color: 'bg-sky-400/20 text-sky-300', icon: GraduationCap },
        { name: 'Biology', color: 'bg-emerald-400/20 text-emerald-300', icon: BookOpen },
        { name: 'History', color: 'bg-orange-400/20 text-orange-300', icon: FileText },
        { name: 'Add subject', color: 'bg-white/5 text-white/40', icon: FolderPlus, dashed: true },
      ].map((s) => (
        <div key={s.name} className={`rounded-2xl bg-white/6 border ${s.dashed ? 'border-dashed border-white/15' : 'border-white/10'} p-3.5 backdrop-blur-md`}>
          <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center mb-2`}>
            <s.icon size={16} />
          </div>
          <p className="text-[11px] font-medium truncate">{s.name}</p>
        </div>
      ))}
    </div>
  );
}

function MockAssistant() {
  return (
    <div className="rounded-2xl bg-white/6 border border-white/10 p-4 backdrop-blur-md">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-violet-400/20 flex items-center justify-center">
          <Sparkles size={14} className="text-violet-300" />
        </div>
        <span className="text-xs font-semibold">AI Study Assistant</span>
      </div>
      <div className="space-y-2.5">
        <div className="flex gap-2 flex-row-reverse">
          <div className="w-6 h-6 rounded-full bg-sky-400/25 flex items-center justify-center shrink-0">
            <span className="text-[9px] font-bold text-sky-200">JD</span>
          </div>
          <div className="rounded-xl bg-sky-500/25 px-3 py-2 max-w-[70%]">
            <p className="text-[11px] text-white/80">Explain recursion simply</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <Sparkles size={12} className="text-violet-300" />
          </div>
          <div className="rounded-xl bg-white/8 px-3 py-2 max-w-[75%]">
            <p className="text-[11px] text-white/70 leading-relaxed">
              Recursion is when a function calls itself to solve a smaller version of the same problem. Think of Russian nesting dolls…
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockResources() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { name: 'Student Portal', color: 'bg-sky-400/20 text-sky-300', icon: Globe },
        { name: 'Quizlet', color: 'bg-emerald-400/20 text-emerald-300', icon: Bookmark },
        { name: 'Citation Machine', color: 'bg-orange-400/20 text-orange-300', icon: Bookmark },
      ].map((r) => (
        <div key={r.name} className="rounded-2xl bg-white/6 border border-white/10 p-3.5 backdrop-blur-md">
          <div className={`w-8 h-8 rounded-lg ${r.color} flex items-center justify-center mb-2`}>
            <r.icon size={16} />
          </div>
          <p className="text-[11px] font-medium truncate">{r.name}</p>
          <p className="text-[9px] text-white/40 truncate">example.com</p>
        </div>
      ))}
    </div>
  );
}

/* ── Slide components ─────────────────────────────────────── */

function CoverSlide() {
  return (
    <div className="flex flex-col items-center justify-center text-center h-full px-8">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
        className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-400/30 to-indigo-500/30 border border-white/20 flex items-center justify-center mb-8 backdrop-blur-md"
      >
        <GraduationCap size={40} className="text-sky-200" />
      </motion.div>
      <StaggerItem delay={0.3}>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-3 bg-gradient-to-r from-white via-sky-100 to-indigo-200 bg-clip-text text-transparent">
          Study Hub
        </h1>
      </StaggerItem>
      <StaggerItem delay={0.45}>
        <p className="text-xl text-white/60 mb-2">Your learning command center</p>
      </StaggerItem>
      <StaggerItem delay={0.6}>
        <p className="text-sm text-white/40 mb-10 max-w-lg">
          A presentation in three acts — Planner, Designer, and Builder — exploring how a modern study app comes to life.
        </p>
      </StaggerItem>
      <StaggerItem delay={0.75}>
        <div className="flex items-center gap-3">
          <Pill icon={LayoutDashboard} label="Planner" color="#34d399" />
          <Pill icon={Palette} label="Designer" color="#f472b6" />
          <Pill icon={Code2} label="Builder" color="#fbbf24" />
        </div>
      </StaggerItem>
      <StaggerItem delay={0.95}>
        <p className="text-xs text-white/30 mt-12 flex items-center gap-2">
          <ChevronRight size={14} className="animate-pulse" /> Press space or click to begin
        </p>
      </StaggerItem>
    </div>
  );
}

function AgendaSlide() {
  const items = [
    { num: '01', role: 'The Planner', icon: LayoutDashboard, color: '#34d399', desc: 'Structure, instruments & workflow' },
    { num: '02', role: 'The Designer', icon: Palette, color: '#f472b6', desc: 'UI / UX, motion & interface' },
    { num: '03', role: 'The Builder', icon: Code2, color: '#fbbf24', desc: 'Code, architecture & deployment' },
  ];
  return (
    <div className="flex flex-col justify-center h-full px-12 max-w-4xl mx-auto">
      <StaggerItem delay={0.1}>
        <h2 className="text-3xl font-bold mb-1">Three Perspectives</h2>
        <p className="text-white/40 mb-10">How a study app is conceived, designed, and built</p>
      </StaggerItem>
      <div className="space-y-5">
        {items.map((item, i) => (
          <StaggerItem key={item.num} delay={0.25 + i * 0.15}>
            <div className="flex items-center gap-5 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:border-white/20 transition-colors group">
              <span className="text-3xl font-bold text-white/15 group-hover:text-white/25 transition-colors">{item.num}</span>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${item.color}25` }}>
                <item.icon size={22} style={{ color: item.color }} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold" style={{ color: item.color }}>{item.role}</h3>
                <p className="text-sm text-white/50">{item.desc}</p>
              </div>
              <ArrowRight size={20} className="text-white/20 group-hover:text-white/40 group-hover:translate-x-1 transition-all" />
            </div>
          </StaggerItem>
        ))}
      </div>
    </div>
  );
}

function SectionSlide({ index, role, icon: Icon, tagline, description, accent }: {
  index: string; role: string; icon: typeof Zap; tagline: string; description: string; accent: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center h-full px-8">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16 }}
        className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 border border-white/15"
        style={{ background: `${accent}20`, boxShadow: `0 0 60px ${accent}40` }}
      >
        <Icon size={44} style={{ color: accent }} />
      </motion.div>
      <StaggerItem delay={0.2}>
        <p className="text-6xl font-bold text-white/10 mb-2">{index}</p>
      </StaggerItem>
      <StaggerItem delay={0.3}>
        <h2 className="text-4xl font-bold mb-2" style={{ color: accent }}>{role}</h2>
      </StaggerItem>
      <StaggerItem delay={0.4}>
        <p className="text-lg text-white/50 mb-4">{tagline}</p>
      </StaggerItem>
      <StaggerItem delay={0.5}>
        <p className="text-sm text-white/40 max-w-xl leading-relaxed">{description}</p>
      </StaggerItem>
    </div>
  );
}

function PlannerDashboardSlide() {
  return (
    <div className="grid grid-cols-2 gap-10 h-full items-center px-10 max-w-5xl mx-auto">
      <div>
        <StaggerItem delay={0.1}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-400/20 flex items-center justify-center">
              <LayoutDashboard size={20} className="text-emerald-300" />
            </div>
            <span className="text-emerald-300 font-semibold text-sm uppercase tracking-wide">Planner</span>
          </div>
        </StaggerItem>
        <StaggerItem delay={0.2}>
          <h2 className="text-3xl font-bold mb-4">The Dashboard</h2>
        </StaggerItem>
        <StaggerItem delay={0.3}>
          <p className="text-white/50 text-sm leading-relaxed mb-6">
            The command center where students land. It brings together every planning instrument into one glanceable view — to-dos, exam countdowns, recent notes, and assignment tracking.
          </p>
        </StaggerItem>
        <div className="space-y-3">
          {[
            { icon: ListTodo, label: 'To-Do List', desc: 'Daily tasks with progress tracking' },
            { icon: AlarmClock, label: 'Exam Countdown', desc: 'Days remaining with urgency colors' },
            { icon: NotebookPen, label: 'Recent Notes', desc: 'Quick access to latest study notes' },
            { icon: FileText, label: 'Assignments', desc: 'Status pipeline: To Do → In Progress → Submitted' },
          ].map((item, i) => (
            <StaggerItem key={item.label} delay={0.4 + i * 0.1}>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-emerald-400/15 flex items-center justify-center shrink-0">
                  <item.icon size={15} className="text-emerald-300" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-white/40">{item.desc}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </div>
      </div>
      <StaggerItem delay={0.5} className="space-y-4">
        <MockNavbar active="Dashboard" />
        <MockDashboard />
      </StaggerItem>
    </div>
  );
}

function PlannerInstrumentsSlide() {
  const instruments = [
    { icon: BookOpen, name: 'Classes', color: '#34d399', desc: 'Subject folders with notes, assignments & exam dates', mock: <MockClasses /> },
    { icon: Sparkles, name: 'AI Assistant', color: '#a78bfa', desc: 'Gemini-powered chat for explanations, summaries & quizzes', mock: <MockAssistant /> },
    { icon: Bookmark, name: 'Resources', color: '#38bdf8', desc: 'Categorized bookmarks for study tools & links', mock: <MockResources /> },
  ];
  return (
    <div className="flex flex-col h-full px-10 max-w-5xl mx-auto py-6">
      <StaggerItem delay={0.1}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-400/20 flex items-center justify-center">
            <Layers size={16} className="text-emerald-300" />
          </div>
          <span className="text-emerald-300 font-semibold text-sm uppercase tracking-wide">Planner</span>
        </div>
        <h2 className="text-2xl font-bold mb-1">Three Planning Instruments</h2>
        <p className="text-white/40 text-sm mb-5">Each tab serves a distinct study workflow</p>
      </StaggerItem>
      <div className="grid grid-cols-3 gap-5 flex-1">
        {instruments.map((inst, i) => (
          <StaggerItem key={inst.name} delay={0.25 + i * 0.15} className="flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${inst.color}25` }}>
                <inst.icon size={18} style={{ color: inst.color }} />
              </div>
              <div>
                <h3 className="font-semibold text-sm" style={{ color: inst.color }}>{inst.name}</h3>
              </div>
            </div>
            <p className="text-xs text-white/40 mb-3 leading-relaxed">{inst.desc}</p>
            <div className="flex-1">{inst.mock}</div>
          </StaggerItem>
        ))}
      </div>
    </div>
  );
}

function DesignerUISlide() {
  const features = [
    { icon: Layers, title: 'Glassmorphism', desc: 'Frosted-glass cards with backdrop blur, subtle borders & layered depth' },
    { icon: MousePointer2, title: 'Motion-Aware Cards', desc: '3D tilt and radial glow that follow the mouse via spring-smoothed tracking' },
    { icon: Zap, title: 'Animated Nav Pill', desc: 'Shared layout animation — the active tab indicator slides between items' },
    { icon: Palette, title: 'Dark / Light Theme', desc: 'CSS-variable-driven theming with smooth icon transitions' },
    { icon: ArrowRight, title: 'Page Transitions', desc: 'AnimatePresence with wait mode — slides fade and shift on tab change' },
    { icon: Sun, title: 'Micro-interactions', desc: 'Hover reveals, spring physics, progress bars & entrance staggers' },
  ];
  return (
    <div className="grid grid-cols-2 gap-8 h-full items-center px-10 max-w-5xl mx-auto">
      <div>
        <StaggerItem delay={0.1}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-pink-400/20 flex items-center justify-center">
              <Palette size={20} className="text-pink-300" />
            </div>
            <span className="text-pink-300 font-semibold text-sm uppercase tracking-wide">Designer</span>
          </div>
        </StaggerItem>
        <StaggerItem delay={0.2}>
          <h2 className="text-3xl font-bold mb-4">Crafting the Interface</h2>
        </StaggerItem>
        <StaggerItem delay={0.3}>
          <p className="text-white/50 text-sm leading-relaxed mb-6">
            Every surface is designed to feel responsive and alive — from the top navigation bar to the smallest button hover. The design language is consistent, tactile, and modern.
          </p>
        </StaggerItem>
        <div className="grid grid-cols-2 gap-3">
          {features.map((f, i) => (
            <StaggerItem key={f.title} delay={0.4 + i * 0.08}>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-pink-400/20 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <f.icon size={14} className="text-pink-300" />
                  <span className="text-xs font-semibold">{f.title}</span>
                </div>
                <p className="text-[11px] text-white/40 leading-snug">{f.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </div>
      </div>
      <StaggerItem delay={0.5} className="space-y-4">
        <MockNavbar active="Classes" />
        <div className="rounded-2xl bg-white/6 border border-white/10 p-4 backdrop-blur-md">
          <p className="text-[10px] text-white/40 mb-3 uppercase tracking-wide">Motion-aware glass cards</p>
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
                className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-4 h-20 flex items-center justify-center"
                style={{ boxShadow: `0 0 30px ${i % 2 ? '#f472b620' : '#38bdf820'}` }}
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Layers size={16} className="text-white/50" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10">
          <Moon size={14} className="text-white/40" />
          <div className="w-10 h-5 rounded-full bg-white/10 relative">
            <div className="w-4 h-4 rounded-full bg-pink-400 absolute top-0.5 right-0.5" />
          </div>
          <Sun size={14} className="text-pink-300" />
          <span className="text-[10px] text-white/40 ml-1">Theme toggle</span>
        </div>
      </StaggerItem>
    </div>
  );
}

function BuilderStackSlide() {
  const stack = [
    { icon: Code2, name: 'React + TypeScript', color: '#38bdf8', desc: 'Component-based UI with full type safety' },
    { icon: Zap, name: 'Vite', color: '#fbbf24', desc: 'Lightning-fast dev server & build tooling' },
    { icon: Layers, name: 'Tailwind CSS', color: '#34d399', desc: 'Utility-first styling with custom design tokens' },
    { icon: Sparkles, name: 'Framer Motion', color: '#f472b6', desc: 'Spring animations, layout transitions & gestures' },
    { icon: GraduationCap, name: 'Supabase', color: '#a78bfa', desc: 'Postgres database, auth & edge functions' },
    { icon: Sparkles, name: 'Gemini AI', color: '#818cf8', desc: 'Streaming AI chat via edge function proxy' },
  ];
  const flow = ['Auth', 'RLS Policies', 'CRUD Queries', 'Edge Function', 'Gemini API', 'Streaming Response'];
  return (
    <div className="grid grid-cols-2 gap-8 h-full items-center px-10 max-w-5xl mx-auto">
      <div>
        <StaggerItem delay={0.1}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center">
              <Code2 size={20} className="text-amber-300" />
            </div>
            <span className="text-amber-300 font-semibold text-sm uppercase tracking-wide">Builder</span>
          </div>
        </StaggerItem>
        <StaggerItem delay={0.2}>
          <h2 className="text-3xl font-bold mb-4">The Tech Stack</h2>
        </StaggerItem>
        <StaggerItem delay={0.3}>
          <p className="text-white/50 text-sm leading-relaxed mb-6">
            Modern, type-safe, and serverless. The frontend talks directly to Supabase with row-level security, while the AI chat streams through a dedicated edge function.
          </p>
        </StaggerItem>
        <div className="space-y-2.5">
          {stack.map((s, i) => (
            <StaggerItem key={s.name} delay={0.4 + i * 0.08}>
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.color}25` }}>
                  <s.icon size={15} style={{ color: s.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-[11px] text-white/40">{s.desc}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </div>
      </div>
      <StaggerItem delay={0.5}>
        <div className="rounded-2xl bg-white/6 border border-white/10 p-5 backdrop-blur-md">
          <p className="text-[10px] text-white/40 mb-4 uppercase tracking-wide">Request flow</p>
          <div className="space-y-2">
            {flow.map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.12 }}
                className="flex items-center gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-400/15 flex items-center justify-center text-[10px] font-bold text-amber-300 shrink-0">
                  {i + 1}
                </div>
                <span className="text-sm text-white/70">{step}</span>
                {i < flow.length - 1 && (
                  <ChevronRight size={12} className="text-white/20 ml-auto" />
                )}
              </motion.div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span className="text-xs text-white/50">Row-level security on every table</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span className="text-xs text-white/50">JWT-verified edge function</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span className="text-xs text-white/50">Real-time streaming responses</span>
            </div>
          </div>
        </div>
      </StaggerItem>
    </div>
  );
}

function ClosingSlide() {
  return (
    <div className="flex flex-col items-center justify-center text-center h-full px-8">
      <motion.div
        initial={{ scale: 0, rotate: 180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-400/30 to-indigo-500/30 border border-white/20 flex items-center justify-center mb-8 backdrop-blur-md"
      >
        <GraduationCap size={40} className="text-sky-200" />
      </motion.div>
      <StaggerItem delay={0.2}>
        <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white via-sky-100 to-indigo-200 bg-clip-text text-transparent">
          From idea to app
        </h2>
      </StaggerItem>
      <StaggerItem delay={0.35}>
        <p className="text-lg text-white/50 mb-8 max-w-lg">
          One project, three perspectives. The Planner defined what to build, the Designer made it beautiful, and the Builder made it real.
        </p>
      </StaggerItem>
      <StaggerItem delay={0.5}>
        <div className="flex items-center gap-4 mb-10">
          {[
            { icon: LayoutDashboard, label: 'Planner', color: '#34d399' },
            { icon: Palette, label: 'Designer', color: '#f472b6' },
            { icon: Code2, label: 'Builder', color: '#fbbf24' },
          ].map((r, i) => (
            <motion.div
              key={r.label}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6 + i * 0.15, type: 'spring', stiffness: 200, damping: 18 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/15" style={{ background: `${r.color}20` }}>
                <r.icon size={26} style={{ color: r.color }} />
              </div>
              <span className="text-xs font-medium" style={{ color: r.color }}>{r.label}</span>
            </motion.div>
          ))}
        </div>
      </StaggerItem>
      <StaggerItem delay={0.9}>
        <p className="text-sm text-white/30">Study Hub — Built with React, Supabase & Gemini AI</p>
      </StaggerItem>
    </div>
  );
}

/* ── Background ───────────────────────────────────────────── */

function SlideBackground({ accent }: { accent: string }) {
  return (
    <>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#0d1220] to-[#101830]" />
      {/* Accent glow */}
      <motion.div
        className="absolute -top-1/4 -right-1/4 w-[60%] h-[60%] rounded-full blur-[120px]"
        style={{ background: `${accent}15` }}
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-1/4 -left-1/4 w-[50%] h-[50%] rounded-full blur-[120px]"
        style={{ background: '#6366f120' }}
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
    </>
  );
}

/* ── Main Presentation component ───────────────────────────── */

export function Presentation() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const go = useCallback((dir: number) => {
    setDirection(dir);
    setIndex((prev) => Math.max(0, Math.min(SLIDES.length - 1, prev + dir)));
  }, []);

  const goTo = useCallback((i: number) => {
    setDirection(i > index ? 1 : -1);
    setIndex(i);
  }, [index]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      else if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
        else document.exitFullscreen?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [go]);

  const slide = SLIDES[index];
  const accent = slide.meta.accent;

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60, scale: 0.98 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60, scale: 0.98 }),
  };

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Background layer */}
      <AnimatePresence mode="popLayout">
        <motion.div key={index} className="absolute inset-0">
          <SlideBackground accent={accent} />
        </motion.div>
      </AnimatePresence>

      {/* Slide content */}
      <div className="relative h-full w-full">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            {slide.render()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Top bar: exit + title */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-50">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/8 border border-white/10 backdrop-blur-md hover:bg-white/15 transition-colors text-sm text-white/70"
        >
          <ChevronLeft size={16} /> Exit
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/8 border border-white/10 backdrop-blur-md">
          <GraduationCap size={14} style={{ color: accent }} />
          <span className="text-sm text-white/60 font-medium">Study Hub Presentation</span>
        </div>
        <button
          onClick={() => {
            if (!document.fullscreenElement) { document.documentElement.requestFullscreen?.(); setIsFullscreen(true); }
            else { document.exitFullscreen?.(); setIsFullscreen(false); }
          }}
          className="p-2 rounded-full bg-white/8 border border-white/10 backdrop-blur-md hover:bg-white/15 transition-colors text-white/60"
        >
          <Maximize2 size={15} />
        </button>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 px-6 py-5 z-50">
        <button
          onClick={() => go(-1)}
          disabled={index === 0}
          className="p-2.5 rounded-full bg-white/8 border border-white/10 backdrop-blur-md hover:bg-white/15 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-white/70"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="group relative"
            >
              <div
                className={`rounded-full transition-all duration-300 ${
                  i === index ? 'w-8 h-2' : 'w-2 h-2'
                }`}
                style={{
                  background: i === index ? accent : 'rgba(255,255,255,0.2)',
                }}
              />
            </button>
          ))}
        </div>

        <button
          onClick={() => go(1)}
          disabled={index === SLIDES.length - 1}
          className="p-2.5 rounded-full bg-white/8 border border-white/10 backdrop-blur-md hover:bg-white/15 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-white/70"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Slide counter */}
      <div className="absolute bottom-5 right-6 z-50 text-xs text-white/30 font-mono">
        {String(index + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
      </div>
    </div>
  );
}
