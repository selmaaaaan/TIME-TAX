import React, { useEffect, useState, useCallback } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  QrCode,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TickyMascot, AreaCategoryBadge } from '../components/DuoIllustrations';
import type { Area, QueueSession, WaitReport } from '../types';

interface StoredLocalSession {
  sessionId: string;
  sessionToken: string;
  areaSlug: string;
  startedAt: string;
}

const SESSION_STORAGE_PREFIX = 'timetax_qr_session_';

const ISSUE_TAGS = [
  'Single counter open',
  'Peak hour surge',
  'Payment / UPI delay',
  'Paperwork verification',
  'Bulk printing / binding',
  'System / network slow',
];

export const QrTimerPage: React.FC<{ areaSlug: string }> = ({ areaSlug }) => {
  const { navigate, authFetch, refreshAreas } = useApp();
  const [area, setArea] = useState<Area | null>(null);
  const [loadingArea, setLoadingArea] = useState<boolean>(true);
  const [areaError, setAreaError] = useState<string | null>(null);

  const [activeSession, setActiveSession] = useState<QueueSession | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const [completedReport, setCompletedReport] = useState<WaitReport | null>(null);
  const [cancelledMessage, setCancelledMessage] = useState<string | null>(null);

  const [selectedIssueTag, setSelectedIssueTag] = useState<string>('');
  const [feedbackNote, setFeedbackNote] = useState<string>('');
  const [cancelReason, setCancelReason] = useState<string>('');
  const [showCancelPrompt, setShowCancelPrompt] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const storageKey = `${SESSION_STORAGE_PREFIX}${areaSlug.toLowerCase()}`;

  const loadAreaAndResumeSession = useCallback(async () => {
    setLoadingArea(true);
    setAreaError(null);
    try {
      const res = await fetch(`/api/areas/${encodeURIComponent(areaSlug)}`);
      const data = await res.json();
      if (!res.ok || !data.area) {
        setAreaError(data.error || 'This QR code does not match an active campus place.');
        setLoadingArea(false);
        return;
      }
      setArea(data.area);

      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const saved: StoredLocalSession = JSON.parse(raw);
          if (saved.sessionId && saved.sessionToken) {
            const sessRes = await fetch(
              `/api/queue-sessions/${encodeURIComponent(saved.sessionId)}?token=${encodeURIComponent(
                saved.sessionToken
              )}`
            );
            if (sessRes.ok) {
              const sessData = await sessRes.json();
              if (sessData.session && sessData.session.status === 'active') {
                setActiveSession(sessData.session);
                setSessionToken(saved.sessionToken);
              } else {
                localStorage.removeItem(storageKey);
              }
            } else {
              localStorage.removeItem(storageKey);
            }
          }
        }
      } catch {
        // ignore
      }
    } catch {
      setAreaError('Unable to reach server. Please try again.');
    } finally {
      setLoadingArea(false);
    }
  }, [areaSlug, storageKey]);

  useEffect(() => {
    loadAreaAndResumeSession();
  }, [loadAreaAndResumeSession]);

  useEffect(() => {
    if (!activeSession || activeSession.status !== 'active') return;

    const updateTimer = () => {
      const startMs = new Date(activeSession.started_at).getTime();
      const diffSec = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      setElapsedSeconds(diffSec);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const formatStopwatch = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartQueue = async () => {
    if (!area || submitting) return;
    setSubmitting(true);
    setActionError(null);
    setCancelledMessage(null);
    setCompletedReport(null);

    try {
      const res = await authFetch('/api/queue-sessions/start', {
        method: 'POST',
        body: JSON.stringify({ areaIdOrSlug: area.stable_identifier }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Could not start timer.');
        return;
      }

      setActiveSession(data.session);
      setSessionToken(data.sessionToken);

      try {
        const toSave: StoredLocalSession = {
          sessionId: data.session.id,
          sessionToken: data.sessionToken,
          areaSlug: area.stable_identifier,
          startedAt: data.session.started_at,
        };
        localStorage.setItem(storageKey, JSON.stringify(toSave));
      } catch {
        // ignore
      }
    } catch {
      setActionError('Network error while starting your timer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteQueue = async () => {
    if (!activeSession || !sessionToken || submitting) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await authFetch(
        `/api/queue-sessions/${encodeURIComponent(activeSession.id)}/complete`,
        {
          method: 'POST',
          body: JSON.stringify({
            sessionToken,
            issue_tag: selectedIssueTag || null,
            feedback_note: feedbackNote.trim() || null,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Could not finish session.');
        return;
      }

      try {
        localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }

      setActiveSession(null);
      setSessionToken(null);
      setCompletedReport(data.report);
      await refreshAreas(true);
    } catch {
      setActionError('Network error while saving your time.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelQueue = async () => {
    if (!activeSession || !sessionToken || submitting) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await authFetch(
        `/api/queue-sessions/${encodeURIComponent(activeSession.id)}/cancel`,
        {
          method: 'POST',
          body: JSON.stringify({
            sessionToken,
            reason: cancelReason.trim() || 'Left queue early',
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Could not cancel timer.');
        return;
      }

      try {
        localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }

      setActiveSession(null);
      setSessionToken(null);
      setShowCancelPrompt(false);
      setCancelledMessage('Timer cancelled. No wait time was recorded.');
    } catch {
      setActionError('Network error while cancelling timer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingArea) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-[#FAF8F3]">
        <div className="max-w-md w-full card-light p-8 text-center space-y-4">
          <TickyMascot size={110} mood="happy" />
          <p className="text-base font-bold text-[#08090B]">Opening live stopwatch…</p>
        </div>
      </div>
    );
  }

  if (areaError || !area) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-[#FAF8F3]">
        <div className="max-w-md w-full card-light p-8 text-center space-y-5">
          <AlertTriangle className="w-12 h-12 text-[#FF4B4B] mx-auto" />
          <h1 className="font-display text-2xl font-bold text-[#08090B]">Place Not Found</h1>
          <p className="text-sm font-medium text-[#08090B]/70">{areaError}</p>
          <button
            type="button"
            onClick={() => navigate('/campus')}
            className="btn-tactile-lime min-h-[48px] px-6 py-3 text-sm"
          >
            Browse Campus Places
          </button>
        </div>
      </div>
    );
  }

  const isArchivedOrInactive = area.status !== 'active';

  return (
    <div className="min-h-[calc(100vh-72px)] py-8 sm:py-12 px-4 sm:px-6 pb-28 bg-[#FAF8F3]">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Top Place Card */}
        <div className="card-light p-6 sm:p-7 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <AreaCategoryBadge category={area.category} size="lg" />
            <div className="min-w-0">
              <div className="text-xs font-display font-bold uppercase tracking-[0.12em] text-[#00545F]">
                /q/{area.stable_identifier}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#08090B] truncate">
                {area.name}
              </h1>
              <div className="text-xs font-medium text-[#08090B]/70 truncate">
                {area.building} · {area.floor} · {area.counters} window(s)
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="font-mono text-2xl font-bold text-[#00545F] tabular-nums">
              {area.avg_wait_minutes ? `${area.avg_wait_minutes}m` : 'New'}
            </div>
            <div className="text-[11px] font-bold text-[#08090B]/60">avg wait</div>
          </div>
        </div>

        {actionError && (
          <div
            role="alert"
            className="rounded-2xl border-2 border-[#FF4B4B] bg-[#FF4B4B]/10 p-4 text-sm font-bold text-[#08090B] flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-[#FF4B4B] shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {isArchivedOrInactive ? (
          <div className="card-light p-8 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-[#FF4B4B] mx-auto" />
            <h2 className="font-display text-2xl font-bold text-[#08090B]">
              This Counter Is Closed ({area.status})
            </h2>
            <button
              type="button"
              onClick={() => navigate('/campus')}
              className="btn-tactile-lime min-h-[48px] px-6 py-3 text-sm"
            >
              See Open Campus Places
            </button>
          </div>
        ) : completedReport ? (
          /* COMPLETED RECEIPT */
          <div className="card-light p-8 text-center space-y-6 animate-duo-pop">
            <TickyMascot size={130} mood="celebrate" />

            <div className="space-y-2">
              <span className="inline-block px-3.5 py-1 rounded-full bg-[#CDF22B] border border-[#08090B] font-display text-xs font-bold uppercase tracking-[0.12em]">
                VERIFIED RECEIPT · #{completedReport.id.slice(-6)}
              </span>
              <h2 className="font-display text-3xl font-bold text-[#08090B]">
                You logged {completedReport.duration_minutes} minutes!
              </h2>
              <p className="text-sm font-medium text-[#08090B]/70">
                Saved for <strong>{area.name}</strong>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => navigate('/insights')}
                className="btn-tactile-lime min-h-[50px] px-6 py-3 text-sm flex items-center justify-center gap-2"
              >
                <span>See Updated Charts</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCompletedReport(null)}
                className="btn-tactile-secondary min-h-[50px] px-6 py-3 text-sm"
              >
                Start Another Timer
              </button>
            </div>
          </div>
        ) : activeSession ? (
          /* RUNNING STOPWATCH */
          <div className="card-dark p-7 sm:p-9 space-y-6 text-center">
            <div className="space-y-2">
              <span className="inline-block px-3.5 py-1 rounded-full bg-[#CDF22B]/20 border border-[#CDF22B]/50 font-display text-xs font-bold uppercase tracking-[0.12em] text-[#CDF22B]">
                STOPWATCH RUNNING
              </span>
              <div
                data-testid="qr-running-stopwatch"
                className="font-mono text-6xl sm:text-7xl font-bold text-[#FAF8F3] tabular-nums tracking-tight py-3"
              >
                {formatStopwatch(elapsedSeconds)}
              </div>
              <p className="text-xs text-[#FAF8F3]/70">
                Tap the green button below as soon as you are served!
              </p>
            </div>

            {/* Optional Quick Issue Pills */}
            <div className="space-y-3 pt-4 border-t border-[#FAF8F3]/15 text-left">
              <span className="block text-xs font-display font-bold uppercase tracking-[0.12em] text-[#ECFFB6]">
                Why is there a wait? (Optional)
              </span>
              <div className="flex flex-wrap gap-2">
                {ISSUE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedIssueTag(selectedIssueTag === tag ? '' : tag)}
                    className={`min-h-[36px] px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors ${
                      selectedIssueTag === tag
                        ? 'bg-[#CDF22B] text-[#08090B] border-[#CDF22B]'
                        : 'bg-[#FAF8F3]/10 text-[#FAF8F3] border-[#FAF8F3]/20 hover:bg-[#FAF8F3]/15'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <input
                id="qr-feedback-note"
                type="text"
                aria-label="Optional note"
                value={feedbackNote}
                onChange={(e) => setFeedbackNote(e.target.value)}
                placeholder="Add a short note (optional)…"
                className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#FAF8F3]/10 border border-[#FAF8F3]/20 text-sm text-[#FAF8F3] placeholder:text-[#FAF8F3]/45 focus:outline-none focus:border-[#CDF22B]"
              />
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={handleCompleteQueue}
              className="btn-tactile-lime w-full min-h-[58px] py-4 px-6 text-lg flex items-center justify-center gap-2.5"
            >
              <CheckCircle2 className="w-6 h-6" />
              <span>{submitting ? 'Saving…' : "I've been served"}</span>
            </button>

            {!showCancelPrompt ? (
              <button
                type="button"
                onClick={() => setShowCancelPrompt(true)}
                className="text-xs font-bold text-[#FAF8F3]/65 hover:text-[#FF4B4B] transition-colors"
              >
                Cancel session (Left the line?)
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-[#FAF8F3]/10 border border-[#FAF8F3]/20 space-y-3 text-left">
                <input
                  id="cancel-reason-input"
                  type="text"
                  aria-label="Cancel reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Why did you leave the line? (Optional)"
                  className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[#08090B] border border-[#FAF8F3]/20 text-xs text-[#FAF8F3]"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleCancelQueue}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#FF4B4B] text-white text-xs font-bold"
                  >
                    Confirm Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCancelPrompt(false)}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#FAF8F3]/15 text-[#FAF8F3] text-xs font-bold"
                  >
                    Keep Timer
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* READY TO START STOPWATCH */
          <div className="card-light p-7 sm:p-9 text-center space-y-6">
            {cancelledMessage && (
              <div className="p-3.5 rounded-2xl bg-[#ECFFB6] border border-[#08090B]/20 text-xs font-bold text-[#08090B]">
                {cancelledMessage}
              </div>
            )}

            <TickyMascot size={125} mood="happy" />

            <div className="space-y-2">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#08090B]">
                Joining the line at {area.name}?
              </h2>
              <p className="text-sm sm:text-base text-[#08090B]/70 max-w-md mx-auto">
                Tap the green button below when you join the line, and tap once more when served!
              </p>
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={handleStartQueue}
              className="btn-tactile-lime w-full min-h-[58px] py-4 px-6 text-lg flex items-center justify-center gap-3"
            >
              <Clock className="w-6 h-6 stroke-[2.5]" />
              <span>{submitting ? 'Starting…' : 'I joined the queue'}</span>
            </button>

            <div className="pt-4 border-t border-[#08090B]/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-bold text-[#08090B]/65">
              <span>No login required</span>
              <button
                type="button"
                onClick={() => navigate(`/report?area=${area.stable_identifier}`)}
                className="text-[#00545F] hover:underline"
              >
                Already waited? Enter minutes →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
