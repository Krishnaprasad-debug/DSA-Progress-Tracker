import React, { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  onOpenAuth?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  onOpenAuth,
}) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mr-2" />
        <span className="text-sm">Verifying secure session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-900/60 border border-slate-800 rounded-2xl text-center max-w-md mx-auto my-8">
        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">Authentication Required</h3>
        <p className="text-xs text-slate-400 mb-6">
          Please sign in to access your personal DSA progress, revision schedules, and mastery scores.
        </p>
        {onOpenAuth && (
          <button
            onClick={onOpenAuth}
            className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            Sign In Now
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
