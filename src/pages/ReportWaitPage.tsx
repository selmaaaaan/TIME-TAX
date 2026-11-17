import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  QrCode,
  Edit3,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TickyMascot, AreaCategoryBadge } from '../components/DuoIllustrations';
import { DuoProgressBar } from '../components/DuolingoCharts';
import type { WaitReport } from '../types';

const QUICK_MINUTES = [2, 5, 10, 15, 30];

const ISSUE_TAGS = [
  'Single counter open',
  'Peak hour surge',
  'Payment / UPI delay',
  'Paperwork verification',
  'Bulk printing / binding',
  'System / network slow',
];

export const ReportWaitPage: React.FC = () => {
  const { areas, navigate, authFetch, refreshAreas } = useApp();
  const activeAreas = areas.filter((a) => a.status === 'active');

  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [mode, setMode] = useState<'manual' | 'timer'>('manual');
  const [minutesInput, setMinutesInput] = useState<string>('8');
  const [issueTag, setIssueTag] = useState<string>('');
  const [feedbackNote, setFeedbackNote] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedReport, setSubmittedReport] = useState<WaitReport | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const areaQuery = params.get('area');
    if (areaQuery && activeAreas.length > 0) {
      const matched = activeAreas.find(
        (a) =>
          a.id === areaQuery ||
          a.stable_identifier.toLowerCase() === areaQuery.toLowerCase()
      );
      if (matched) {
        setSelectedAreaId(matched.id);
        return;
      }
    }
    if (!selectedAreaId && activeAreas.length > 0) {
      setSelectedAreaId(activeAreas[0].id);
    }
  }, [activeAreas, selectedAreaId]);

  const selectedArea = activeAreas.find((a) => a.id === selectedAreaId);

  const progressSteps = selectedArea ? (minutesInput ? 3 : 2) : 1;

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedArea) {
      setErrorMsg('Please tap a campus place in Step 1.');
      return;
    }

    const numericMinutes = Number(minutesInput);
    if (!Number.isFinite(numericMinutes) || numericMinutes < 1 || numericMinutes > 180) {
      setErrorMsg('Please enter a waiting time between 1 and 180 minutes.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch('/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          area_id: selectedArea.id,
          duration_minutes: numericMinutes,
          issue_tag: issueTag || null,
          feedback_note: feedbackNote.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Could not save your waiting time.');
        return;
      }

      setSubmittedReport(data.report);
      await refreshAreas(true);
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedReport) {
    return (
      <div className="min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-8 pb-28 flex items-center justify-center bg-[#FAF8F3]">
        <div className="max-w-lg w-full duo-card p-8 text-center space-y-6 animate-duo-pop">
          <TickyMascot size={140} mood="celebrate" />

          <div className="space-y-2">
            <div className="inline-block px-3 py-1 rounded-xl bg-[#C7FF00] border-2 border-[#021E18] font-mono text-xs font-extrabold uppercase">
              Saved · #{submittedReport.id.slice(-6)}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#021E18]">
              Awesome! {submittedReport.duration_minutes} minutes logged.
            </h1>
            <p className="text-base font-medium text-[#021E18]/75">
              Recorded for <strong>{submittedReport.area_name || selectedArea?.name}</strong>. Thank
              you for helping make campus lines faster!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              type="button"
              onClick={() => navigate('/insights')}
              className="duo-btn-primary min-h-[50px] px-6 py-3 text-sm flex items-center justify-center gap-2"
            >
              <span>See Live Charts</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setSubmittedReport(null);
                setFeedbackNote('');
                setIssueTag('');
              }}
              className="duo-btn-secondary min-h-[50px] px-6 py-3 text-sm"
            >
              Report Another Wait
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 sm:py-10 px-4 sm:px-8 pb-28 bg-[#FAF8F3]">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Duolingo Lesson-Style Progress Header */}
        <div className="duo-card p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5">
          <TickyMascot size={84} mood="happy" />
          <div className="flex-1 w-full space-y-2 text-center sm:text-left">
            <div className="flex items-center justify-between gap-2">
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#021E18]">
                How long did you wait?
              </h1>
              <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-[#ECFFB6] border border-[#021E18]">
                3 Easy Taps
              </span>
            </div>
            <DuoProgressBar value={progressSteps} max={3} variant="lime" heightClass="h-4" />
          </div>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="rounded-2xl border-2 border-[#FF2A00] bg-[#FF2A00]/10 p-4 text-sm font-bold text-[#021E18] flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-[#FF2A00] shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleManualSubmit} className="space-y-6">
          {/* STEP 1: WHERE WERE YOU? */}
          <div className="duo-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-extrabold text-[#021E18]">
                1. Pick the place
              </h2>
              <span className="text-xs font-bold text-[#00545F]">Tap a card</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {activeAreas.map((area) => {
                const isSelected = area.id === selectedAreaId;
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => setSelectedAreaId(area.id)}
                    className={`min-h-[82px] p-4 rounded-2xl border-2 border-b-4 text-left transition-all flex items-center gap-3.5 ${
                      isSelected
                        ? 'border-[#021E18] bg-[#C7FF00] text-[#021E18] -translate-y-0.5'
                        : 'border-[#021E18]/15 bg-[#FAF8F3] text-[#021E18] hover:border-[#021E18]/40'
                    }`}
                  >
                    <AreaCategoryBadge category={area.category} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-extrabold text-sm text-[#021E18] truncate">
                        {area.name}
                      </div>
                      <div className="text-xs font-medium text-[#021E18]/70 truncate">
                        {area.building}
                      </div>
                      <div className="font-mono text-xs font-extrabold text-[#00545F] mt-0.5 tabular-nums">
                        {area.avg_wait_minutes ? `${area.avg_wait_minutes}m avg` : 'New'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: HOW MANY MINUTES? */}
          <div className="duo-card p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="font-display text-xl font-extrabold text-[#021E18]">
                2. Pick your waiting time
              </h2>

              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#FAF8F3] border-2 border-[#021E18]/15">
                <button
                  type="button"
                  onClick={() => setMode('manual')}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    mode === 'manual'
                      ? 'bg-[#021E18] text-[#C7FF00]'
                      : 'text-[#021E18]/70 hover:text-[#021E18]'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Enter Minutes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('timer')}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    mode === 'timer'
                      ? 'bg-[#021E18] text-[#C7FF00]'
                      : 'text-[#021E18]/70 hover:text-[#021E18]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Live Stopwatch</span>
                </button>
              </div>
            </div>

            {mode === 'timer' ? (
              <div className="rounded-2xl border-2 border-[#021E18] bg-[#ECFFB6]/60 p-6 text-center space-y-4">
                <QrCode className="w-12 h-12 text-[#021E18] mx-auto" />
                <h3 className="font-display text-2xl font-extrabold text-[#021E18]">
                  In line at {selectedArea?.name || 'this counter'} right now?
                </h3>
                <p className="text-sm font-medium text-[#021E18]/75 max-w-md mx-auto">
                  Start our live stopwatch now and tap once when you get served!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedArea) {
                      navigate(`/q/${selectedArea.stable_identifier}`);
                    }
                  }}
                  className="duo-btn-primary min-h-[52px] px-7 py-3.5 text-base inline-flex items-center gap-2.5"
                >
                  <Clock className="w-5 h-5" />
                  <span>Open Live Stopwatch ({selectedArea?.name})</span>
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Big Duolingo Tactile Minute Buttons */}
                <div className="grid grid-cols-5 gap-2.5">
                  {QUICK_MINUTES.map((m) => {
                    const active = Number(minutesInput) === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMinutesInput(String(m))}
                        className={`min-h-[56px] rounded-2xl font-mono text-base sm:text-lg font-extrabold border-2 border-b-4 transition-all tabular-nums ${
                          active
                            ? 'bg-[#C7FF00] text-[#021E18] border-[#021E18] -translate-y-0.5'
                            : 'bg-[#FAF8F3] text-[#021E18] border-[#021E18]/20 hover:border-[#021E18]'
                        }`}
                      >
                        {m}m
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="custom-minutes-input"
                      className="block text-xs font-extrabold text-[#021E18] uppercase tracking-wider mb-1.5"
                    >
                      Or type exact minutes (1 – 180)
                    </label>
                    <input
                      id="custom-minutes-input"
                      type="number"
                      min={1}
                      max={180}
                      step="1"
                      required
                      value={minutesInput}
                      onChange={(e) => setMinutesInput(e.target.value)}
                      className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#FAF8F3] border-2 border-[#021E18]/25 font-mono text-lg font-extrabold text-[#021E18] focus:outline-none focus:border-[#021E18] tabular-nums"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="issue-tag-select"
                      className="block text-xs font-extrabold text-[#021E18] uppercase tracking-wider mb-1.5"
                    >
                      Why was it slow? (Optional)
                    </label>
                    <select
                      id="issue-tag-select"
                      value={issueTag}
                      onChange={(e) => setIssueTag(e.target.value)}
                      className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border-2 border-[#021E18]/25 text-sm font-bold text-[#021E18] focus:outline-none focus:border-[#021E18]"
                    >
                      <option value="">Normal line (No issue)</option>
                      {ISSUE_TAGS.map((tag) => (
                        <option key={tag} value={tag}>
                          {tag}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="manual-feedback-note"
                    className="block text-xs font-extrabold text-[#021E18] uppercase tracking-wider mb-1.5"
                  >
                    Quick note (Optional)
                  </label>
                  <input
                    id="manual-feedback-note"
                    type="text"
                    value={feedbackNote}
                    onChange={(e) => setFeedbackNote(e.target.value)}
                    placeholder="e.g., Only one window was open at lunch"
                    className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#FAF8F3] border-2 border-[#021E18]/25 text-sm font-medium text-[#021E18] placeholder:text-[#021E18]/45 focus:outline-none focus:border-[#021E18]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: SAVE BUTTON */}
          {mode === 'manual' && (
            <div className="duo-card p-6 bg-[#ECFFB6]/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <div className="font-display font-extrabold text-lg text-[#021E18]">
                  3. Ready to save {minutesInput || 0} mins at {selectedArea?.name}?
                </div>
                <div className="text-xs font-semibold text-[#021E18]/70">
                  Updates live campus charts right away.
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedArea}
                className="w-full sm:w-auto duo-btn-primary min-h-[54px] px-8 py-3.5 text-base flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{submitting ? 'Saving…' : 'Submit Waiting Time'}</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
