import React, { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  LogOut,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TickyMascot, AreaCategoryBadge } from '../components/DuoIllustrations';
import { DuoProgressBar } from '../components/DuolingoCharts';
import type { ImprovementSuggestion, PriorityLevel } from '../types';

const STATUS_TIMELINE = [
  'Draft',
  'Submitted',
  'Under Review',
  'Approved',
  'Implemented',
] as const;

interface FeedbackSummaryItem {
  id: string;
  area_id: string;
  area_name: string;
  duration_minutes: number;
  issue_tag?: string | null;
  feedback_note?: string | null;
  is_demo: boolean;
  created_at: string;
}

export const MentorDashboard: React.FC<{
  initialTab?: 'overview' | 'propose' | 'suggestions';
}> = ({ initialTab = 'overview' }) => {
  const { user, areas, navigate, logout, authFetch } = useApp();
  const [suggestions, setSuggestions] = useState<ImprovementSuggestion[]>([]);
  const [assignedAreaIds, setAssignedAreaIds] = useState<string[]>([]);
  const [feedbackSummaries, setFeedbackSummaries] = useState<FeedbackSummaryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [proposedSolution, setProposedSolution] = useState<string>('');
  const [priority, setPriority] = useState<PriorityLevel>('High');
  const [estimatedCost, setEstimatedCost] = useState<string>('');
  const [supportingObservation, setSupportingObservation] = useState<string>('');
  const [submitStatus, setSubmitStatus] = useState<'Submitted' | 'Draft'>('Submitted');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const loadMentorWorkspace = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/suggestions');
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setAssignedAreaIds(data.assignedAreaIds || []);
        setFeedbackSummaries(data.feedbackSummaries || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (user) {
      loadMentorWorkspace();
    }
  }, [user, loadMentorWorkspace]);

  const activeAreas = areas.filter((a) => a.status === 'active');
  const myAreas =
    assignedAreaIds.length > 0
      ? activeAreas.filter((a) => assignedAreaIds.includes(a.id))
      : activeAreas;

  useEffect(() => {
    if (!selectedAreaId && myAreas.length > 0) {
      setSelectedAreaId(myAreas[0].id);
    }
  }, [myAreas, selectedAreaId]);

  if (!user || !['mentor', 'management', 'super_admin'].includes(user.role)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 bg-[#FAF8F3]">
        <div className="max-w-md w-full card-light p-8 text-center space-y-4">
          <TickyMascot size={100} mood="happy" />
          <h1 className="font-display text-2xl font-bold text-[#08090B]">
            Mentor Access Required
          </h1>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="btn-tactile-lime min-h-[46px] px-5 py-2.5 text-xs"
          >
            Sign In as Faculty Mentor
          </button>
        </div>
      </div>
    );
  }

  const handleCreateSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!selectedAreaId || !title.trim() || !description.trim() || !proposedSolution.trim()) {
      setFormError('Please fill in the place, title, problem, and solution.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch('/api/suggestions', {
        method: 'POST',
        body: JSON.stringify({
          area_id: selectedAreaId,
          title: title.trim(),
          description: description.trim(),
          proposed_solution: proposedSolution.trim(),
          priority,
          estimated_cost: estimatedCost ? Number(estimatedCost) : null,
          supporting_observation: supportingObservation.trim(),
          status: submitStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Could not save proposal.');
        return;
      }

      setTitle('');
      setDescription('');
      setProposedSolution('');
      setEstimatedCost('');
      setSupportingObservation('');
      setFormSuccess(
        `Saved "${data.suggestion.title}" (${data.suggestion.status}) and sent to Management!`
      );
      await loadMentorWorkspace();
    } catch {
      setFormError('Network error while saving proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishDraft = async (id: string) => {
    try {
      const res = await authFetch(`/api/suggestions/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Submitted' }),
      });
      if (res.ok) {
        await loadMentorWorkspace();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="py-8 sm:py-10 px-4 sm:px-8 pb-28 max-w-6xl mx-auto space-y-8 bg-[#FAF8F3]">
      {/* Mentor Header + Dedicated Sub-Pages Switcher */}
      <div className="card-light p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <TickyMascot size={85} mood="happy" />
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-[#CDF22B] border border-[#08090B] font-display text-xs font-bold uppercase tracking-[0.12em]">
              MENTOR HUB · {user.display_name}
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#08090B] mt-1">
              Turn Student Waits Into Fixes
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/mentor')}
            className={
              initialTab === 'overview' || initialTab === 'propose'
                ? 'btn-tactile-lime min-h-[42px] px-4 py-2 text-xs'
                : 'btn-tactile-secondary min-h-[42px] px-4 py-2 text-xs'
            }
          >
            Areas &amp; Propose Fix
          </button>
          <button
            type="button"
            onClick={() => navigate('/mentor/suggestions')}
            className={
              initialTab === 'suggestions'
                ? 'btn-tactile-lime min-h-[42px] px-4 py-2 text-xs'
                : 'btn-tactile-secondary min-h-[42px] px-4 py-2 text-xs'
            }
          >
            Proposal Tracker ({suggestions.length})
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="btn-tactile-danger min-h-[42px] px-4 py-2 text-xs flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {initialTab === 'suggestions' ? (
        /* SEPARATE PAGE: PROPOSAL STATUS TRACKER */
        <div className="card-light p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#08090B]/10 pb-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#08090B]">
                Proposal Status Tracker
              </h2>
              <p className="text-xs text-[#08090B]/65">
                Draft → Submitted → Under Review → Approved → Implemented
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/mentor')}
              className="btn-tactile-lime min-h-[42px] px-4 py-2 text-xs"
            >
              + Propose New Fix
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-[#08090B]/60">Loading proposals…</p>
          ) : suggestions.length === 0 ? (
            <p className="text-sm text-[#08090B]/70">No proposals submitted yet.</p>
          ) : (
            <div className="space-y-4">
              {suggestions.map((sug) => {
                const currentStepIdx = STATUS_TIMELINE.indexOf(
                  sug.status === 'Rejected' ? 'Approved' : (sug.status as any)
                );

                return (
                  <div
                    key={sug.id}
                    className="p-5 rounded-3xl border border-[#08090B]/15 bg-[#FAF8F3] space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-display font-bold uppercase tracking-[0.12em] text-[#00545F]">
                          {sug.area_name} · Priority: {sug.priority}
                        </div>
                        <h3 className="font-display text-xl font-bold text-[#08090B] mt-0.5">
                          {sug.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-3 py-1 rounded-full bg-[#08090B] text-[#CDF22B] font-display text-xs font-bold uppercase">
                          {sug.status}
                        </span>
                        {sug.status === 'Draft' && (
                          <button
                            type="button"
                            onClick={() => handlePublishDraft(sug.id)}
                            className="btn-tactile-lime min-h-[36px] px-3 py-1 text-xs"
                          >
                            Submit Draft
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-[#08090B]/80">{sug.description}</p>
                    <div className="text-xs font-semibold text-[#00545F]">
                      Proposed Fix: {sug.proposed_solution}
                    </div>

                    <div className="grid grid-cols-5 gap-2 pt-3 border-t border-[#08090B]/10">
                      {STATUS_TIMELINE.map((step, idx) => {
                        const reached = idx <= currentStepIdx && sug.status !== 'Rejected';
                        return (
                          <div key={step} className="space-y-1">
                            <div
                              className={`h-2 rounded-full border border-[#08090B]/20 ${
                                reached ? 'bg-[#CDF22B]' : 'bg-white'
                              }`}
                            />
                            <div
                              className={`text-[10px] font-display font-bold ${
                                reached ? 'text-[#08090B]' : 'text-[#08090B]/40'
                              }`}
                            >
                              {step}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* SEPARATE PAGE: ASSIGNED AREAS & PROPOSE FIX FORM */
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {myAreas.map((area) => {
              const wait = area.avg_wait_minutes || 0;
              return (
                <div
                  key={area.id}
                  className="card-light p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <AreaCategoryBadge category={area.category} size="sm" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-lg font-bold text-[#08090B] truncate">
                        {area.name}
                      </h3>
                      <div className="text-xs text-[#08090B]/60 truncate">{area.building}</div>
                    </div>
                    <span className="font-mono text-lg font-bold text-[#08090B] tabular-nums">
                      {wait ? `${wait}m` : '—'}
                    </span>
                  </div>

                  <DuoProgressBar
                    value={wait}
                    max={20}
                    variant={wait >= 14 ? 'orange' : wait >= 8 ? 'amber' : 'lime'}
                    heightClass="h-3.5"
                  />

                  <div className="flex items-center justify-between text-xs font-bold text-[#08090B]/70 pt-2 border-t border-[#08090B]/10">
                    <span>{area.report_count || 0} reports</span>
                    <button
                      type="button"
                      onClick={() => setSelectedAreaId(area.id)}
                      className="text-[#00545F] hover:underline"
                    >
                      Select Area →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Propose Fix Form */}
            <div className="lg:col-span-7 card-light p-6 sm:p-8 space-y-5">
              <div>
                <span className="text-xs font-display font-bold uppercase tracking-[0.12em] text-[#00545F]">
                  SUBMIT IMPROVEMENT PROPOSAL
                </span>
                <h2 className="font-display text-2xl font-bold text-[#08090B] mt-0.5">
                  Propose a Counter Fix
                </h2>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="rounded-2xl border-2 border-[#FF4B4B] bg-[#FF4B4B]/10 p-4 text-xs font-bold text-[#08090B] flex items-center gap-2.5"
                >
                  <AlertTriangle className="w-4 h-4 text-[#FF4B4B] shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div
                  role="status"
                  className="rounded-2xl border-2 border-[#08090B] bg-[#CDF22B] p-4 text-xs font-bold text-[#08090B] flex items-center gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#08090B] shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreateSuggestion} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="mentor-area-select"
                      className="block text-xs font-bold text-[#08090B] mb-1"
                    >
                      Service Place
                    </label>
                    <select
                      id="mentor-area-select"
                      value={selectedAreaId}
                      onChange={(e) => setSelectedAreaId(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF8F3] border border-[#08090B]/20 text-sm font-bold text-[#08090B]"
                    >
                      {activeAreas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.avg_wait_minutes || 0}m avg)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="mentor-priority-select"
                      className="block text-xs font-bold text-[#08090B] mb-1"
                    >
                      Priority
                    </label>
                    <select
                      id="mentor-priority-select"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF8F3] border border-[#08090B]/20 text-sm font-bold text-[#08090B]"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="mentor-issue-title"
                    className="block text-xs font-bold text-[#08090B] mb-1"
                  >
                    Fix Title
                  </label>
                  <input
                    id="mentor-issue-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Add Fast-Track Token Counter at Lunch"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF8F3] border border-[#08090B]/20 text-sm text-[#08090B]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="mentor-problem-desc"
                    className="block text-xs font-bold text-[#08090B] mb-1"
                  >
                    What is causing the wait?
                  </label>
                  <textarea
                    id="mentor-problem-desc"
                    rows={2}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe when the line gets long and why…"
                    className="w-full p-3 rounded-xl bg-[#FAF8F3] border border-[#08090B]/20 text-sm text-[#08090B]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="mentor-proposed-solution"
                    className="block text-xs font-bold text-[#08090B] mb-1"
                  >
                    How should we fix it?
                  </label>
                  <textarea
                    id="mentor-proposed-solution"
                    rows={2}
                    required
                    value={proposedSolution}
                    onChange={(e) => setProposedSolution(e.target.value)}
                    placeholder="Describe the counter change or staffing split…"
                    className="w-full p-3 rounded-xl bg-[#FAF8F3] border border-[#08090B]/20 text-sm text-[#08090B]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="mentor-cost-input"
                      className="block text-xs font-bold text-[#08090B] mb-1"
                    >
                      Estimated Cost in ₹ (Optional)
                    </label>
                    <input
                      id="mentor-cost-input"
                      type="number"
                      min={0}
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(e.target.value)}
                      placeholder="2500"
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF8F3] border border-[#08090B]/20 text-sm font-mono text-[#08090B]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="mentor-submit-mode"
                      className="block text-xs font-bold text-[#08090B] mb-1"
                    >
                      Action
                    </label>
                    <select
                      id="mentor-submit-mode"
                      value={submitStatus}
                      onChange={(e) => setSubmitStatus(e.target.value as 'Submitted' | 'Draft')}
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF8F3] border border-[#08090B]/20 text-sm font-bold text-[#08090B]"
                    >
                      <option value="Submitted">Send to Management Now</option>
                      <option value="Draft">Save as Draft</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-tactile-lime w-full min-h-[50px] py-3 px-6 text-sm"
                >
                  {submitting ? 'Saving…' : 'Submit Improvement Proposal'}
                </button>
              </form>
            </div>

            {/* Student Notes Feed */}
            <div className="lg:col-span-5 card-light p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold text-[#08090B]">
                    Student Notes
                  </h2>
                  <p className="text-xs text-[#08090B]/65">
                    Recent notes shared by students in line
                  </p>
                </div>
                <MessageSquare className="w-5 h-5 text-[#00545F]" />
              </div>

              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {feedbackSummaries.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-4 rounded-2xl border border-[#08090B]/12 bg-[#FAF8F3] space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#08090B]">{fb.area_name}</span>
                      <span className="px-2 py-0.5 rounded-lg bg-[#CDF22B] border border-[#08090B] font-mono tabular-nums">
                        {fb.duration_minutes}m
                      </span>
                    </div>
                    {fb.issue_tag && (
                      <div className="text-xs font-bold text-[#00545F]">{fb.issue_tag}</div>
                    )}
                    {fb.feedback_note && (
                      <p className="text-xs text-[#08090B]/80">&ldquo;{fb.feedback_note}&rdquo;</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
