import React from 'react';
import { Activity, CheckCircle2, GitBranch, ShieldCheck, Terminal, Cpu } from 'lucide-react';

export const App: React.FC = () => {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
              DSA Tracker
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              CI/CD Phase 1 Active
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              <GitBranch className="w-3.5 h-3.5 text-slate-400" />
              feature/project-scaffold
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Production-Grade CI/CD Software Development Lifecycle
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
              <p className="text-sm font-medium text-white">Repository Foundation Ready</p>
              <p className="text-xs text-slate-400">Phase 1 scaffold established on branch <code className="text-emerald-400">feature/project-scaffold</code></p>
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
    </main>
  );
};

export default App;
