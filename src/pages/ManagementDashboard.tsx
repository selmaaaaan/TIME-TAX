import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart3,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Download,
  ShieldCheck,
  Clock,
  LogOut,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TickyMascot } from '../components/DuoIllustrations';
import {
  DuoStatCard,
  DuoAreaLeagueChart,
  DuoProgressBar,
} from '../components/DuolingoCharts';
import {
  calculateErlangC,
  type AggregatedAnalytics,
  type BeforeAfterComparison,
} from '../utils/queueMath';
import type { ImprovementSuggestion, Intervention } from '../types';

export const ManagementDashboard: React.FC<{
  tab?: 'overview' | 'interventions' | 'simulator';
}> = ({ tab = 'overview' }) => {
  const { user, areas, navigate, logout, authFetch } = useApp();
  const [analytics, setAnalytics] = useState<AggregatedAnalytics | null>(null);
  const [suggestions, setSuggestions] = useState<ImprovementSuggestion[]>([]);
  const [interventions, setInterventions] = useState<
    Array<Intervention & { comparison?: BeforeAfterComparison }>
  >([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const activeAreas = areas.filter((a) => a.status === 'active');
  const [simAreaId, setSimAreaId] = useState<string>('');
  const [arrivalRate, setArrivalRate] = useState<number>(28);
  const [serviceDuration, setServiceDuration] = useState<number>(3);
  const [currentCounters, setCurrentCounters] = useState<number>(2);
  const [proposedCounters, setProposedCounters] = useState<number>(3);
  const [monthlyVisits, setMonthlyVisits] = useState<number>(4500);

  const [intAreaId, setIntAreaId] = useState<string>('');
  const [intTitle, setIntTitle] = useState<string>('');
  const [intDesc, setIntDesc] = useState<string>('');
  const [intCost, setIntCost] = useState<string>('3000');
  const [intDate, setIntDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const loadManagementData = useCallback(async () => {
    try {
      const [anaRes, sugRes, intRes] = await Promise.all([
        fetch('/api/analytics?days=30'),
        authFetch('/api/suggestions'),
        authFetch('/api/interventions'),
      ]);

      if (anaRes.ok) {
        const anaData = await anaRes.json();
        setAnalytics(anaData.analytics || null);
      }
      if (sugRes.ok) {
        const sugData = await sugRes.json();
        setSuggestions(sugData.suggestions || []);
      }
      if (intRes.ok) {
        const intData = await intRes.json();
        setInterventions(intData.interventions || []);
      }
    } catch {
      // ignore
    }
  }, [authFetch]);

  useEffect(() => {
    if (user) {
      loadManagementData();
    }
  }, [user, loadManagementData]);

  useEffect(() => {
    if (!simAreaId && activeAreas.length > 0) {
      const first = activeAreas[0];
      setSimAreaId(first.id);
      setServiceDuration(first.service_minutes || 3);
      setCurrentCounters(first.counters || 1);
      setProposedCounters((first.counters || 1) + 1);
    }
    if (!intAreaId && activeAreas.length > 0) {
      setIntAreaId(activeAreas[0].id);
    }
  }, [activeAreas, simAreaId, intAreaId]);

  const handleSelectSimArea = (areaId: string) => {
    setSimAreaId(areaId);
    const found = activeAreas.find((a) => a.id === areaId);
    if (found) {
      setServiceDuration(found.service_minutes || 3);
      setCurrentCounters(found.counters || 1);
      setProposedCounters((found.counters || 1) + 1);
    }
  };

  if (!user || !['management', 'super_admin'].includes(user.role)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 bg-[#FAF8F3]">
        <div className="max-w-md w-full card-light p-8 text-center space-y-4">
          <TickyMascot size={100} mood="happy" />
          <h1 className="font-display text-2xl font-bold text-[#08090B]">
            Management Access Required
          </h1>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="btn-tactile-lime min-h-[46px] px-5 py-2.5 text-xs"
          >
            Sign In as Management
          </button>
        </div>
      </div>
    );
  }

  const simulation = calculateErlangC({
    arrivalRatePerHour: arrivalRate,
    serviceDurationMinutes: serviceDuration,
    currentCounters,
    proposedCounters,
    monthlyVisitsAssumption: monthlyVisits,
  });

  const handleApproveSuggestionIntoIntervention = async (sug: ImprovementSuggestion) => {
    setActionMessage(null);
    try {
      const res = await authFetch('/api/interventions', {
        method: 'POST',
        body: JSON.stringify({
          suggestion_id: sug.id,
          area_id: sug.area_id,
          title: sug.title,
          description: sug.proposed_solution,
          assigned_to: sug.mentor_id,
          estimated_cost: sug.estimated_cost,
          implementation_date: new Date().toISOString(),
          status: 'Implemented',
        }),
      });
      if (res.ok) {
        setActionMessage(`Approved "${sug.title}" and launched campus intervention!`);
        await loadManagementData();
      }
    } catch {
      // ignore
    }
  };

  const handleUpdateSuggestionStatus = async (
    sugId: string,
    status: ImprovementSuggestion['status'],
    responseText: string
  ) => {
    setActionMessage(null);
    try {
      const res = await authFetch(`/api/suggestions/${encodeURIComponent(sugId)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          management_response: responseText,
        }),
      });
      if (res.ok) {
        setActionMessage(`Updated proposal status to "${status}".`);
        await loadManagementData();
      }
    } catch {
      // ignore
    }
  };

  const handleCreateCustomIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intAreaId || !intTitle.trim()) return;
    setActionMessage(null);

    try {
      const res = await authFetch('/api/interventions', {
        method: 'POST',
        body: JSON.stringify({
          area_id: intAreaId,
          title: intTitle.trim(),
          description: intDesc.trim(),
          estimated_cost: intCost ? Number(intCost) : null,
          implementation_date: intDate,
          status: 'Implemented',
        }),
      });
      if (res.ok) {
        setIntTitle('');
        setIntDesc('');
        setActionMessage('Created new campus intervention plan!');
        await loadManagementData();
      }
    } catch {
      // ignore
    }
  };

  const handleExportCsv = () => {
    if (!analytics) return;
    const rows = [
      ['Area Name', 'Category', 'Total Reports', 'Live Reports', 'Demo Reports', 'Total Minutes', 'Average Wait (Minutes)'],
      ...analytics.areaBreakdown.map((a) => [
        `"${a.area_name}"`,
        `"${a.category}"`,
        String(a.report_count),
        String(a.live_count),
        String(a.demo_count),
        String(a.total_minutes),
        String(a.avg_wait_minutes),
      ]),
    ];
    const csvContent = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timetax-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="py-8 sm:py-10 px-4 sm:px-8 pb-28 max-w-6xl mx-auto space-y-8 bg-[#FAF8F3]">
      {/* Management Header & Dedicated Sub-Page Buttons */}
      <div className="card-light p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <TickyMascot size={85} mood="happy" />
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-[#CDF22B] border border-[#08090B] font-display text-xs font-bold uppercase tracking-[0.12em]">
              MANAGEMENT · {user.display_name}
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#08090B] mt-1">
              See the Cost. Fix the System.
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/management')}
            className={
              tab === 'overview'
                ? 'btn-tactile-lime min-h-[42px] px-4 py-2 text-xs'
                : 'btn-tactile-secondary min-h-[42px] px-4 py-2 text-xs'
            }
          >
            Overview Page
          </button>
          <button
            type="button"
            onClick={() => navigate('/management/interventions')}
            className={
              tab === 'interventions'
                ? 'btn-tactile-lime min-h-[42px] px-4 py-2 text-xs'
                : 'btn-tactile-secondary min-h-[42px] px-4 py-2 text-xs'
            }
          >
            Decisions ({suggestions.length})
          </button>
          <button
            type="button"
            onClick={() => navigate('/management/simulator')}
            className={
              tab === 'simulator'
                ? 'btn-tactile-lime min-h-[42px] px-4 py-2 text-xs'
                : 'btn-tactile-secondary min-h-[42px] px-4 py-2 text-xs'
            }
          >
            Queue Simulator
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="btn-tactile-dark min-h-[42px] px-4 py-2 text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
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

      {actionMessage && (
        <div
          role="status"
          className="rounded-2xl border-2 border-[#08090B] bg-[#CDF22B] p-4 text-sm font-bold text-[#08090B] flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-[#08090B] shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* SEPARATE PAGE 1: MANAGEMENT OVERVIEW */}
      {tab === 'overview' && analytics && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <DuoStatCard
              label="Lost Time (30d)"
              value={`${analytics.totalMinutes}m`}
              sublabel={`${analytics.totalHours} hrs tracked`}
              accent="lime"
              icon={<Clock className="w-5 h-5" />}
            />
            <DuoStatCard
              label="Top Bottleneck"
              value={`${analytics.areaBreakdown[0]?.avg_wait_minutes || 0}m`}
              sublabel={analytics.areaBreakdown[0]?.area_name || 'N/A'}
              accent="orange"
              icon={<AlertTriangle className="w-5 h-5" />}
            />
            <DuoStatCard
              label="Mentor Proposals"
              value={suggestions.length}
              sublabel="Tap Decisions to review"
              accent="amber"
              icon={<BarChart3 className="w-5 h-5" />}
            />
            <DuoStatCard
              label="Active Fixes"
              value={interventions.length}
              sublabel="Before/after tracked"
              accent="teal"
              icon={<ShieldCheck className="w-5 h-5" />}
            />
          </div>

          <DuoAreaLeagueChart
            areaBreakdown={analytics.areaBreakdown}
            onSelectArea={(areaId) => {
              handleSelectSimArea(areaId);
              navigate('/management/simulator');
            }}
          />
        </div>
      )}

      {/* SEPARATE PAGE 2: DECISIONS & INTERVENTIONS */}
      {tab === 'interventions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 card-light p-6 sm:p-8 space-y-5">
            <div>
              <span className="text-xs font-display font-bold uppercase tracking-[0.12em] text-[#00545F]">
                MENTOR PROPOSALS
              </span>
              <h2 className="font-display text-2xl font-bold text-[#08090B]">
                Approve Counter Improvements
              </h2>
            </div>

            <div className="space-y-4">
              {suggestions.map((sug) => (
                <div
                  key={sug.id}
                  className="p-5 rounded-3xl border border-[#08090B]/15 bg-[#FAF8F3] space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-display font-bold uppercase tracking-[0.12em] text-[#00545F]">
                        {sug.area_name} · {sug.priority} ·{' '}
                        {sug.estimated_cost ? `₹${sug.estimated_cost}` : '₹0'}
                      </div>
                      <h3 className="font-display text-lg font-bold text-[#08090B] mt-0.5">
                        {sug.title}
                      </h3>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#08090B] text-[#CDF22B] font-display text-xs font-bold uppercase">
                      {sug.status}
                    </span>
                  </div>

                  <p className="text-sm text-[#08090B]/80">{sug.description}</p>
                  <div className="text-xs font-bold text-[#00545F]">
                    Fix: {sug.proposed_solution}
                  </div>

                  <div className="pt-3 border-t border-[#08090B]/10 flex flex-wrap items-center gap-2.5">
                    {sug.status !== 'Implemented' && (
                      <button
                        type="button"
                        onClick={() => handleApproveSuggestionIntoIntervention(sug)}
                        className="btn-tactile-lime min-h-[38px] px-4 py-1.5 text-xs"
                      >
                        Approve &amp; Deploy Fix
                      </button>
                    )}
                    {sug.status === 'Submitted' && (
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateSuggestionStatus(
                            sug.id,
                            'Under Review',
                            'Under evaluation by Management.'
                          )
                        }
                        className="btn-tactile-secondary min-h-[38px] px-3.5 py-1.5 text-xs"
                      >
                        Mark Under Review
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="card-light p-6 space-y-4">
              <h3 className="font-display text-xl font-bold text-[#08090B]">
                Launch Direct Fix
              </h3>
              <form onSubmit={handleCreateCustomIntervention} className="space-y-3">
                <div>
                  <label htmlFor="int-area-select" className="block text-xs font-bold text-[#08090B] mb-1">
                    Campus Place
                  </label>
                  <select
                    id="int-area-select"
                    value={intAreaId}
                    onChange={(e) => setIntAreaId(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#FAF8F3] border border-[#08090B]/20 text-xs font-bold text-[#08090B]"
                  >
                    {activeAreas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="int-title-input" className="block text-xs font-bold text-[#08090B] mb-1">
                    Intervention Title
                  </label>
                  <input
                    id="int-title-input"
                    type="text"
                    required
                    value={intTitle}
                    onChange={(e) => setIntTitle(e.target.value)}
                    placeholder="e.g., Open Secondary Token Window"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#FAF8F3] border border-[#08090B]/20 text-xs text-[#08090B]"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-tactile-lime w-full min-h-[44px] py-2.5 text-xs"
                >
                  Save Implemented Fix
                </button>
              </form>
            </div>

            <div className="card-light p-6 space-y-4">
              <h3 className="font-display text-xl font-bold text-[#08090B]">
                Active Fixes ({interventions.length})
              </h3>
              <div className="space-y-3">
                {interventions.map((intv) => (
                  <div
                    key={intv.id}
                    className="p-4 rounded-2xl border border-[#08090B]/12 bg-[#FAF8F3] space-y-2"
                  >
                    <div className="text-xs font-display font-bold uppercase text-[#00545F]">
                      {intv.area_name} · {intv.status}
                    </div>
                    <div className="font-display font-bold text-sm text-[#08090B]">
                      {intv.title}
                    </div>
                    {intv.comparison && (
                      <div className="pt-2 border-t border-[#08090B]/10 grid grid-cols-3 gap-2 font-mono text-xs tabular-nums">
                        <div>
                          <span className="text-[#08090B]/55 block text-[10px]">Before</span>
                          <span className="text-[#FF4B4B] font-bold">
                            {intv.comparison.beforeAvgMinutes ?? '—'}m
                          </span>
                        </div>
                        <div>
                          <span className="text-[#08090B]/55 block text-[10px]">After</span>
                          <span className="text-[#00545F] font-bold">
                            {intv.comparison.afterAvgMinutes ?? '—'}m
                          </span>
                        </div>
                        <div>
                          <span className="text-[#08090B]/55 block text-[10px]">Saved</span>
                          <span className="text-[#08090B] font-bold">
                            {intv.comparison.deltaMinutes !== null
                              ? `${intv.comparison.deltaMinutes}m`
                              : 'Pending'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEPARATE PAGE 3: QUEUE SIMULATOR (Erlang C with Duolingo Visual Bars) */}
      {tab === 'simulator' && (
        <div className="card-light p-6 sm:p-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#08090B]/10 pb-6">
            <div>
              <span className="text-xs font-display font-bold uppercase tracking-[0.12em] text-[#00545F]">
                QUEUE SIMULATOR · WHAT-IF CALCULATOR
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#08090B] mt-1">
                What happens if we open another window?
              </h2>
              <p className="text-sm text-[#08090B]/70 mt-1">
                Test adding service windows to see how fast the line becomes.
              </p>
            </div>

            <div>
              <label htmlFor="sim-preset-area" className="block text-xs font-bold text-[#08090B] mb-1">
                Pick a Campus Place
              </label>
              <select
                id="sim-preset-area"
                value={simAreaId}
                onChange={(e) => handleSelectSimArea(e.target.value)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF8F3] border border-[#08090B]/20 text-xs font-bold text-[#08090B]"
              >
                {activeAreas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.counters} windows, {a.service_minutes}m service)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 p-6 rounded-3xl bg-[#FAF8F3] border border-[#08090B]/12 space-y-5">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <label htmlFor="sim-arrival-rate">People arriving per hour</label>
                  <span className="font-mono font-bold text-[#00545F] tabular-nums">
                    {arrivalRate} / hr
                  </span>
                </div>
                <input
                  id="sim-arrival-rate"
                  type="range"
                  min={5}
                  max={120}
                  step={1}
                  value={arrivalRate}
                  onChange={(e) => setArrivalRate(Number(e.target.value))}
                  className="w-full accent-[#08090B]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <label htmlFor="sim-service-duration">Minutes per person at window</label>
                  <span className="font-mono font-bold text-[#00545F] tabular-nums">
                    {serviceDuration} min
                  </span>
                </div>
                <input
                  id="sim-service-duration"
                  type="range"
                  min={1}
                  max={15}
                  step={0.5}
                  value={serviceDuration}
                  onChange={(e) => setServiceDuration(Number(e.target.value))}
                  className="w-full accent-[#08090B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label htmlFor="sim-current-counters" className="block text-xs font-bold text-[#08090B] mb-1">
                    Current Windows
                  </label>
                  <input
                    id="sim-current-counters"
                    type="number"
                    min={1}
                    max={20}
                    value={currentCounters}
                    onChange={(e) => setCurrentCounters(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-[#08090B]/20 font-mono text-base font-bold text-[#08090B] tabular-nums"
                  />
                </div>

                <div>
                  <label htmlFor="sim-proposed-counters" className="block text-xs font-bold text-[#00545F] mb-1">
                    New Windows
                  </label>
                  <input
                    id="sim-proposed-counters"
                    type="number"
                    min={1}
                    max={20}
                    value={proposedCounters}
                    onChange={(e) => setProposedCounters(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#CDF22B] border-2 border-[#08090B] font-mono text-base font-bold text-[#08090B] tabular-nums"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-6 rounded-3xl border-2 border-[#08090B]/15 bg-[#FAF8F3] space-y-3">
                  <div className="text-xs font-display font-bold uppercase tracking-[0.12em] text-[#08090B]/60">
                    NOW ({simulation.current.counters} WINDOW{simulation.current.counters > 1 ? 'S' : ''})
                  </div>
                  {simulation.current.isOverloaded ? (
                    <div className="font-display text-xl font-bold text-[#FF4B4B]">
                      LINE OVERLOADED ({Math.round(simulation.current.utilization * 100)}%)
                    </div>
                  ) : (
                    <>
                      <div className="font-mono text-4xl font-bold text-[#08090B] tabular-nums">
                        {simulation.current.expectedQueueWaitMinutes} min
                      </div>
                      <DuoProgressBar
                        value={simulation.current.expectedQueueWaitMinutes || 0}
                        max={25}
                        variant="orange"
                        heightClass="h-4"
                      />
                    </>
                  )}
                </div>

                <div className="card-dark p-6 space-y-3">
                  <div className="text-xs font-display font-bold uppercase tracking-[0.12em] text-[#CDF22B]">
                    WITH {simulation.proposed.counters} WINDOW{simulation.proposed.counters > 1 ? 'S' : ''}
                  </div>
                  {simulation.proposed.isOverloaded ? (
                    <div className="font-display text-xl font-bold text-[#FF4B4B]">
                      STILL OVERLOADED — ADD MORE WINDOWS
                    </div>
                  ) : (
                    <>
                      <div
                        data-testid="sim-proposed-wait"
                        className="font-mono text-4xl font-bold text-[#CDF22B] tabular-nums"
                      >
                        {simulation.proposed.expectedQueueWaitMinutes} min
                      </div>
                      <DuoProgressBar
                        value={simulation.proposed.expectedQueueWaitMinutes || 0}
                        max={25}
                        variant="lime"
                        heightClass="h-4"
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-[#ECFFB6] border-2 border-[#08090B] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-bold uppercase text-[#08090B]/70">
                    Time Saved Per Person
                  </div>
                  <div className="font-mono text-2xl sm:text-3xl font-bold text-[#08090B] tabular-nums mt-0.5">
                    {simulation.summaryStatus === 'current_overloaded_fixed'
                      ? `Fixed (→ ${simulation.proposed.expectedQueueWaitMinutes}m)`
                      : simulation.minutesSavedPerVisit !== null
                      ? `${simulation.minutesSavedPerVisit} min saved`
                      : 'Overloaded'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase text-[#08090B]/70">
                    Monthly Hours Saved
                  </div>
                  <div className="font-mono text-2xl sm:text-3xl font-bold text-[#00545F] tabular-nums mt-0.5">
                    {simulation.monthlyHoursRecovered !== null
                      ? `${simulation.monthlyHoursRecovered} hrs / mo`
                      : 'Stops line buildup'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
