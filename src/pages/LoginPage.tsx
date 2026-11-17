import React, { useState } from 'react';
import {
  ArrowRight,
  AlertTriangle,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useApp, getRoleHomeRoute } from '../context/AppContext';
import { TickyMascot } from '../components/DuoIllustrations';

export const LoginPage: React.FC = () => {
  const { user, availableDemoAccounts, loginWithAccount, navigate, logout } = useApp();
  const [emailInput, setEmailInput] = useState<string>('admin@timetax.edu.in');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const profile = await loginWithAccount({ email: emailInput });
      navigate(getRoleHomeRoute(profile.role));
    } catch (err: any) {
      setErrorMsg(err.message || 'Sign in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickRoleSelect = async (userId: string) => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const profile = await loginWithAccount({ userId });
      navigate(getRoleHomeRoute(profile.role));
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not switch role.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] py-10 sm:py-14 px-4 sm:px-8 pb-28 bg-[#FAF8F3]">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left: 1-Click Role Switcher (Fastest way for anyone to explore!) */}
        <div className="lg:col-span-7 card-light p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-block px-3 py-1 rounded-full bg-[#CDF22B] border border-[#08090B] font-display text-xs font-bold uppercase tracking-[0.12em]">
                1-TAP DEMO SWITCHER
              </span>
              <h1 className="font-display text-3xl font-bold text-[#08090B] mt-1">
                Pick a Role to Explore
              </h1>
              <p className="text-sm text-[#08090B]/70">
                Tap any account below to open its dedicated dashboard right away:
              </p>
            </div>
            <TickyMascot size={80} mood="happy" />
          </div>

          <div className="space-y-3">
            {availableDemoAccounts.map((acct) => {
              const isCurrent = user?.id === acct.id;
              return (
                <button
                  key={acct.id}
                  type="button"
                  disabled={submitting}
                  onClick={() => handleQuickRoleSelect(acct.id)}
                  className={`w-full min-h-[68px] p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between gap-4 ${
                    isCurrent
                      ? 'border-[#08090B] bg-[#CDF22B] shadow-[0_3px_0_#08090B]'
                      : 'border-[#08090B]/15 bg-[#FAF8F3] hover:border-[#08090B]'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-base text-[#08090B]">
                        {acct.display_name}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#08090B] text-[#CDF22B] font-display text-[11px] font-bold uppercase tracking-wider">
                        {acct.role.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-[#08090B]/65 font-mono">
                      {acct.email} · {acct.department}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#08090B] shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Email Sign In Card */}
        <div className="lg:col-span-5 card-dark p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <span className="text-xs font-display font-bold uppercase tracking-[0.12em] text-[#CDF22B]">
              ACCOUNT SIGN IN
            </span>
            <h2 className="font-display text-2xl font-bold text-[#FAF8F3]">
              Sign In with Email
            </h2>
            <p className="text-sm text-[#FAF8F3]/70">
              Enter your campus email address to open your role workspace.
            </p>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-2xl border border-[#FF4B4B] bg-[#FF4B4B]/20 p-4 text-xs text-[#FAF8F3] flex items-center gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 text-[#FF4B4B] shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {user && (
            <div className="rounded-2xl border border-[#CDF22B]/40 bg-[#FAF8F3]/10 p-4 space-y-3">
              <div>
                <div className="text-xs text-[#ECFFB6]">Signed in as</div>
                <div className="text-base font-bold text-[#FAF8F3]">{user.display_name}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(getRoleHomeRoute(user.role))}
                  className="btn-tactile-lime min-h-[38px] px-4 py-1.5 text-xs"
                >
                  Open Workspace
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#FAF8F3]/15 text-[#FAF8F3] text-xs font-bold"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label
                htmlFor="login-email-input"
                className="block text-xs font-display font-bold uppercase tracking-[0.12em] text-[#ECFFB6] mb-1.5"
              >
                Campus Email
              </label>
              <input
                id="login-email-input"
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="admin@timetax.edu.in"
                className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl bg-[#FAF8F3]/10 border border-[#FAF8F3]/25 text-sm text-[#FAF8F3] focus:outline-none focus:border-[#CDF22B]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-tactile-lime w-full min-h-[50px] py-3 px-6 text-sm flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{submitting ? 'Signing in…' : 'Continue to Dashboard'}</span>
            </button>
          </form>

          <div className="pt-4 border-t border-[#FAF8F3]/15 flex items-center justify-between text-xs text-[#FAF8F3]/70">
            <span>Reporting as a guest?</span>
            <button
              type="button"
              onClick={() => navigate('/report')}
              className="text-[#CDF22B] hover:underline font-bold"
            >
              No login needed →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
