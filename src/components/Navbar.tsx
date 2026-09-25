import { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Sun, Moon, LogOut, User as UserIcon } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { AuthModal } from './AuthModal';

export type TabId = 'dashboard' | 'classes' | 'resources' | 'pdf';

type NavbarProps = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
};

const TABS: { id: TabId; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'classes', label: 'Classes' },
  { id: 'resources', label: 'Resources'},
  { id: 'pdf', label: 'PDF Tools' },
];

export function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const { theme, toggle } = useTheme();
  const { user, profile, signOut } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = profile?.name || user?.email?.split('@')[0] || 'Student';
  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="fixed top-0 inset-x-0 z-40 px-4 sm:px-6 pt-3"
      >
        <nav className="glass rounded-2xl mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-5 h-14">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center">
              <GraduationCap size={18} className="text-accent" />
            </div>
            <span className="font-semibold text-[15px] tracking-tight hidden sm:block">Study Hub</span>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative px-3 sm:px-4 py-1.5 text-sm font-medium rounded-full transition-colors"
                style={{ color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full"
                    style={{ background: 'var(--accent-soft)' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10 hidden sm:block">{tab.label}</span>
                <span className="relative z-10 sm:hidden">{tab.label[0]}</span>
              </button>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={toggle}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-semibold hover:ring-2 ring-accent/30 transition-all"
                >
                  {initials || <UserIcon size={15} />}
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="absolute right-0 top-11 z-50 glass rounded-2xl p-2 w-56"
                    >
                      <div className="px-3 py-2.5 border-b border-white/10 mb-1">
                        <p className="text-sm font-medium truncate">{displayName}</p>
                        <p className="text-xs text-secondary truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-white/10 transition-colors text-left"
                      >
                        <LogOut size={15} />
                        Sign out
                      </button>
                    </motion.div>
                  </>
                )}
              </div>
            ) : (
              <button onClick={() => setAuthOpen(true)} className="btn-accent text-sm !py-2 !px-4">
                Login
              </button>
            )}
          </div>
        </nav>
      </motion.header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
