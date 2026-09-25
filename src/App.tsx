import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ThemeProvider } from '@/lib/theme';
import { Navbar, type TabId } from '@/components/Navbar';
import { Dashboard } from '@/components/Dashboard';
import { Classes } from '@/components/Classes';
import { Resources } from '@/components/Resources';
import { PdfExcerpt } from '@/components/PdfExcerpt';
import { AuthModal } from '@/components/AuthModal';
import { Presentation } from '@/components/Presentation';
import { GraduationCap } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<TabId>('dashboard');
  const [authOpen, setAuthOpen] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);

  useEffect(() => {
    if (window.location.hash === '#presentation') setShowPresentation(true);
    const onHash = () => setShowPresentation(window.location.hash === '#presentation');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (showPresentation) return <Presentation />;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent/15 flex items-center justify-center animate-pulse">
            <GraduationCap size={24} className="text-accent" />
          </div>
          <p className="text-sm text-secondary">Loading Study Hub…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Landing onSignIn={() => setAuthOpen(true)} />
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode="signin" />
      </>
    );
  }

  return (
    <>
      <Navbar activeTab={tab} onTabChange={setTab} />
      <main className="pt-24 pb-12 px-4 sm:px-6 max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {tab === 'dashboard' && <Dashboard />}
            {tab === 'classes' && <Classes />}
            {tab === 'resources' && <Resources />}
            {tab === 'pdf' && <PdfExcerpt />}
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
}

function Landing({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl"
      >
        <div className="w-20 h-20 rounded-3xl bg-accent/15 flex items-center justify-center mx-auto mb-6">
          <GraduationCap size={36} className="text-accent" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-balance">
          Your learning command center.
        </h1>
        <p className="text-lg text-secondary mb-8 text-balance">
          Organize to-dos, track exams, manage class notes, and bookmark your favorite resources — all in one beautiful workspace.
        </p>
        <button onClick={onSignIn} className="btn-accent text-base !px-8 !py-3">
          Get started — it's free
        </button>
        <p className="text-xs text-secondary mt-6">Sign in or create an account to sync your study hub.</p>
        <button
          onClick={() => { window.location.hash = 'presentation'; }}
          className="mt-4 text-sm text-accent hover:underline"
        >
          View project presentation →
        </button>
      </motion.div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="app-bg" />
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
