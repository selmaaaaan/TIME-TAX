import React, { useEffect, useState, useCallback } from 'react';
import {
  Clock,
  RefreshCw,
  PlusCircle,
  QrCode,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  DuoStatCard,
  DuoAreaLeagueChart,
  DuoDailyXpChart,
  DuoPeakHourTiles,
  DuoInterventionProofCard,
} from '../components/DuolingoCharts';
import type { AggregatedAnalytics, BeforeAfterComparison } from '../utils/queueMath';
import type { Intervention } from '../types';

interface FeedItem {
  id: string;
  area_id: string;
  area_name: string;
  duration_minutes: number;
  reporting_source: 'qr_timer' | 'manual';
  issue_tag?: string | null;
  feedback_note?: string | null;
  is_demo: boolean;
  created_at: string;
}

export const PublicInsightsPage: React.FC = () => {
  const { navigate } = useApp();
  const [days, setDays] = useState<number>(7);
  const [includeDemo, setIncludeDemo] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [analytics, setAnalytics] = useState<AggregatedAnalytics | null>(null);
  const [interventions, setInterventions] = useState<
    Array<{ intervention: Intervention; comparison: BeforeAfterComparison }>
  >([]);
  const [recentFeed, setRecentFeed] = useState<FeedItem[]>([]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/analytics?days=${days}&includeDemo=${includeDemo ? 'true' : 'false'}`
      );
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.analytics);
        setInterventions(data.interventionComparisons || []);
        setRecentFeed(data.recentFeed || []);
      }
    } catch (err) {
      console.error('Failed to load live analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [days, includeDemo]);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 15000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 sm:py-10 px-4 sm:px-8 pb-28 bg-[#FAF8F3]">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Friendly Duolingo Insights Header */}
        <div className="duo-card p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="inline-block px-3 py-1 rounded-xl bg-[#C7FF00] border-2 border-[#021E18] text-xs font-extrabold uppercase tracking-wider">
              Live Campus Data
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#021E18]">
              Waiting Time Charts
            </h1>
            <p className="text-sm sm:text-base font-medium text-[#021E18]/70">
              See which places have the longest lines and when to visit for the fastest service.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1 bg-[#FAF8F3] p-1 rounded-xl border-2 border-[#021E18]/15">
              {[
                { label: '7 Days', val: 7 },
                { label: '30 Days', val: 30 },
                { label: 'All Time', val: 0 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setDays(opt.val)}
                  className={`min-h-[36px] px-3.5 py-1.5 text-xs font-extrabold rounded-lg transition-colors whitespace-nowrap ${
                    days === opt.val
                      ? 'bg-[#021E18] text-[#C7FF00]'
                      : 'text-[#021E18]/70 hover:text-[#021E18]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIncludeDemo((prev) => !prev)}
              className={`min-h-[42px] px-3.5 py-2 text-xs font-extrabold rounded-xl border-2 transition-colors whitespace-nowrap ${
                includeDemo
                  ? 'bg-[#ECFFB6] border-[#021E18] text-[#021E18]'
                  : 'bg-white border-[#021E18]/25 text-[#021E18]'
              }`}
            >
              {includeDemo ? 'Live + Demo Data' : 'Live Only'}
            </button>

            <button
              type="button"
              onClick={fetchAnalytics}
              aria-label="Refresh analytics"
              className="duo-btn-secondary min-h-[42px] min-w-[42px] p-2.5 flex items-center justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Empty State */}
        {analytics && analytics.totalReports === 0 ? (
          <div className="duo-card p-12 text-center space-y-5">
            <Clock className="w-12 h-12 text-[#021E18] mx-auto" />
            <h2 className="font-display text-2xl font-extrabold text-[#021E18]">
              No wait reports in this view yet!
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/report')}
                className="duo-btn-primary min-h-[48px] px-6 py-3 text-xs flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Report a Wait Now</span>
              </button>
              {!includeDemo && (
                <button
                  type="button"
                  onClick={() => setIncludeDemo(true)}
                  className="duo-btn-secondary min-h-[48px] px-5 py-3 text-xs"
                >
                  Include Demo Data
                </button>
              )}
            </div>
          </div>
        ) : (
          analytics && (
            <>
              {/* 1. DUOLINGO STAT CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <DuoStatCard
                  label="Total Minutes Logged"
                  value={`${analytics.totalMinutes} min`}
                  sublabel={`${analytics.liveTotalMinutes}m live · ${analytics.demoTotalMinutes}m demo`}
                  accent="lime"
                  icon={<Clock className="w-5 h-5" />}
                  testId="kpi-total-minutes"
                />

                <DuoStatCard
                  label="Hours Tracked"
                  value={`${analytics.totalHours} hrs`}
                  sublabel={`Across ${analytics.totalReports} visits`}
                  accent="teal"
                  icon={<Sparkles className="w-5 h-5" />}
                />

                <DuoStatCard
                  label="Average Wait Time"
                  value={`${analytics.averageWaitMinutes} min`}
                  sublabel="Per queue visit"
                  accent={analytics.averageWaitMinutes >= 14 ? 'orange' : 'amber'}
                  icon={<Clock className="w-5 h-5" />}
                />

                <DuoStatCard
                  label="Verified Reports"
                  value={analytics.totalReports}
                  sublabel={`${analytics.timerReportsCount} QR · ${analytics.manualReportsCount} manual`}
                  accent="obsidian"
                  icon={<QrCode className="w-5 h-5" />}
                />
              </div>

              {/* 2. DUOLINGO BOTTLENECK LEADERBOARD & DAILY VOLUME BARS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7">
                  <DuoAreaLeagueChart areaBreakdown={analytics.areaBreakdown} />
                </div>
                <div className="lg:col-span-5">
                  <DuoDailyXpChart dailyTrend={analytics.dailyTrend} />
                </div>
              </div>

              {/* 3. PEAK HOUR TILES & BEFORE/AFTER PROOF */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-6">
                  <DuoPeakHourTiles hourlyDistribution={analytics.hourlyDistribution} />
                </div>
                <div className="lg:col-span-6">
                  <DuoInterventionProofCard interventions={interventions} />
                </div>
              </div>

              {/* 4. FRIENDLY RECENT ACTIVITY CARDS */}
              <div className="duo-card p-6 sm:p-7 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#021E18]/10 pb-4">
                  <div>
                    <h2 className="font-display text-xl font-extrabold text-[#021E18]">
                      Recent Community Reports
                    </h2>
                    <p className="text-xs font-medium text-[#021E18]/65">
                      Real-time feed of waiting times shared by students and guests
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/report')}
                    className="duo-btn-primary min-h-[42px] px-4 py-2 text-xs self-start sm:self-auto"
                  >
                    + Share Your Wait
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {recentFeed.slice(0, 8).map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border-2 border-[#021E18]/12 bg-[#FAF8F3] flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="font-display font-extrabold text-sm text-[#021E18] truncate">
                          {item.area_name}
                        </div>
                        <div className="text-xs font-medium text-[#021E18]/70 truncate">
                          {item.issue_tag || item.feedback_note || 'Standard queue check-in'}
                        </div>
                        <div className="text-[11px] font-mono font-bold text-[#00545F]">
                          {item.reporting_source === 'qr_timer' ? 'QR Timer' : 'Manual'} ·{' '}
                          {item.is_demo ? 'DEMO' : 'LIVE'}
                        </div>
                      </div>

                      <div className="px-3.5 py-2 rounded-xl bg-[#C7FF00] border-2 border-[#021E18] font-mono text-base font-extrabold text-[#021E18] shrink-0 tabular-nums">
                        {item.duration_minutes}m
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
};
