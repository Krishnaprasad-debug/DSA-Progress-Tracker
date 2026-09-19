import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  GitBranch,
  ShieldCheck,
  Terminal,
  Cpu,
  LogIn,
  LogOut,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const openAuth = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
              DSA Tracker
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Phase 2: Auth Active
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                feature/auth-system
              </span>
            </div>

            {/* Auth Actions */}
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-white">{user.name}</span>
                </div>
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openAuth('login')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </button>
                <button
                  onClick={() => openAuth('register')}
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Stateless JWT Cookie Authentication &amp; RBAC Architecture
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            DSA Progress Tracker &amp; <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Learning Analytics Platform
            </span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Engineered with automated GitHub Actions CI testing, static code analysis, and continuous deployment workflows.
          </p>
        </div>

        {/* Auth State Card */}
        <div className="mb-10 max-w-xl mx-auto w-full">
          <ProtectedRoute
            onOpenAuth={() => openAuth('login')}
            fallback={
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mb-3">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                </div>
                <h2 className="text-base font-semibold text-white mb-1">Guest Session Detected</h2>
                <p className="text-xs text-slate-400 mb-4">
                  Sign in or register to test the HttpOnly JWT cookie authentication flow.
                </p>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => openAuth('login')}
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    Sign In to Profile
                  </button>
                  <button
                    onClick={() => openAuth('register')}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 cursor-pointer"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            }
          >
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-emerald-500/30 shadow-xl shadow-emerald-950/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                  <UserCheck className="w-4 h-4" />
                  Authenticated Session Verified
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                  HttpOnly Cookie
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">Name</span>
                  <span className="text-sm font-semibold text-white">{user?.name}</span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">Email</span>
                  <span className="text-sm font-semibold text-white">{user?.email}</span>
                </div>
              </div>
            </div>
          </ProtectedRoute>
        </div>

        {/* CI Pipeline Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-slate-400">Job 01</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="text-base font-semibold text-white mb-1">Code Quality &amp; Linting</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              ESLint &amp; Prettier static analysis across backend and frontend workspaces.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-slate-400">Jobs 02 &amp; 03</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="text-base font-semibold text-white mb-1">Automated Test Suites</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Jest &amp; Supertest integration tests with Vitest component testing and LCOV coverage.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-slate-400">Job 04 &amp; 05</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="text-base font-semibold text-white mb-1">Build &amp; Quality Gate</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Strict TypeScript compilation, Vite production bundling, and SonarCloud analysis.
            </p>
          </div>
        </div>

        {/* Status Banner */}
        <div className="rounded-xl bg-slate-900/40 border border-slate-800/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Authentication System Active</p>
              <p className="text-xs text-slate-400">
                Phase 2 implementation on branch <code className="text-emerald-400">feature/auth-system</code>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Terminal className="w-3.5 h-3.5" />
            <span>npm test: 100% green</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        DSA Progress Tracker &copy; 2026 &bull; Professional CI/CD Capstone Architecture
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </main>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
