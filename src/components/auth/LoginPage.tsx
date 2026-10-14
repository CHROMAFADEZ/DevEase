import React, { useState } from 'react';
import { 
  Cloud, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  ArrowRight,
  RefreshCw 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DayEaseAppIcon } from '../brand/Logo';

interface LoginPageProps {
  onContinueOffline?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onContinueOffline }) => {
  const { signInWithGoogle, loading, error, clearError } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#242F26] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden select-none">
      {/* Background ambient accents */}
      <div 
        aria-hidden="true" 
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#EBF2EC] blur-3xl opacity-70 pointer-events-none" 
      />
      <div 
        aria-hidden="true" 
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#F2EEF7] blur-3xl opacity-60 pointer-events-none" 
      />

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md bg-white border border-[#E6E0D5] rounded-3xl shadow-xl p-8 sm:p-10 space-y-7">
        {/* Brand Header with Minimal Leaf Logo */}
        <div className="text-center space-y-3 flex flex-col items-center">
          <DayEaseAppIcon size={58} rounded="rounded-2xl" className="shadow-md" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#232F26] tracking-tight mt-1">
              Welcome to Day<span className="text-[#315C49]">Ease</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#6A786C] mt-2 leading-relaxed max-w-xs mx-auto">
              Your personal college organizer for classes, assignments, and study hours with zero guilt.
            </p>
          </div>
        </div>

        {/* Feature Value Props */}
        <div className="p-4 rounded-2xl bg-[#FCFAF7] border border-[#ECE5DB] space-y-3 text-xs text-[#526154]">
          <div className="flex items-start gap-2.5">
            <Cloud className="w-4 h-4 text-[#3E684A] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#253227]">Cross-Device Cloud Sync:</strong>
              <p className="text-[11px] text-[#6E7D70] mt-0.5">
                Sign in with Google to synchronize your classes and deadlines between your phone and laptop in real time.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#3E684A] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#253227]">Private & Offline-Ready:</strong>
              <p className="text-[11px] text-[#6E7D70] mt-0.5">
                Secured in your private Cloud Firestore with automated local caching for offline studying.
              </p>
            </div>
          </div>
        </div>

        {/* Error notification if popup was cancelled or blocked */}
        {error && (
          <div className="p-3 rounded-2xl bg-[#FDF2F2] border border-[#F5D4D4] text-xs text-[#9E3939] flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            <button 
              onClick={clearError}
              className="text-[#9E3939] hover:text-[#5E2020] text-xs font-semibold cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Primary Action: Continue with Google */}
        <div className="space-y-3 pt-1">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading || isSigningIn}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl bg-white border border-[#D5CDC0] hover:border-[#3E684A] text-[#242F26] text-sm font-semibold transition-all shadow-sm hover:shadow-md cursor-pointer hover:bg-[#FAF8F5] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading || isSigningIn ? (
              <RefreshCw className="w-4 h-4 animate-spin text-[#3E684A]" />
            ) : (
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>
              {loading || isSigningIn ? 'Connecting to Google...' : 'Continue with Google'}
            </span>
          </button>

          {/* Optional offline demo link */}
          {onContinueOffline && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onContinueOffline}
                className="text-xs text-[#6B796D] hover:text-[#3E684A] font-medium transition-colors cursor-pointer inline-flex items-center gap-1 hover:underline"
              >
                <span>Or continue in offline mode</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Quiet footer reassurance */}
        <div className="text-center pt-2 border-t border-[#ECE6DE]">
          <p className="text-[11px] text-[#7E8B80]">
            No complex setup · Designed for everyday college hours
          </p>
        </div>
      </div>
    </div>
  );
};
