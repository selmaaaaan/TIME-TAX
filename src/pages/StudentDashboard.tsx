import React, { useEffect, useState, useCallback } from 'react';
import {
  Clock,
  QrCode,
  Zap,
  FileText,
  LogOut,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TickyMascot, AreaCategoryBadge } from '../components/DuoIllustrations';
import { DuoStatCard, DuoProgressBar } from '../components/DuolingoCharts';
import type { WaitReport } from '../types';

export const StudentDashboard: React.FC<{ view?: 'overview' | 'history' }> = ({
  view = 'overview',
}) => {
  const { user, areas, navigate, logout, authFetch } = useApp();
  const [reports, setReports] = useState<WaitReport[]>([]);
  const [weekMinutes, setWeekMinutes] = useState<number>(0);
  const [totalMinutes, setTotalMinutes] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const loadStudentData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/student/overview');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
        setWeekMinutes(data.weekMinutes || 0);
        setTotalMinutes(data.totalMinutes || 0);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (user) {
      loadStudentData();
    }
  }, [user, loadStudentData]);

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 bg-[#FAF8F3]">
        <div className="max-w-md w-full card-light p-8 text-center space-y-4">
          <TickyMascot size={110} mood="happy" />
          <h1 className="font-display text-2xl font-bold text-[#08090B]">
            Sign in to view your Time Hub
          </h1>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="btn-tactile-lime min-h-[46px] px-5 py-2.5 text-xs"
            >
              Sign In as Student
            </button>
            <button
              type="button"
              onClick={() => navigate('/report')}
              className="btn-tactile-secondary min-h-[46px] px-5 py-2.5 text-xs"
            >
              Guest Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeAreas = areas.filter((a) => a.status === 'active');
  const lowestWaitArea = [...activeAreas]
    .filter((a) => (a.avg_wait_minutes || 0) > 0)
    .sort((a, b) => (a.avg_wait_minutes || 99) - (b.avg_wait_minutes || 99))[0];

  return (
    <div className="py-8 sm:py-10 px-4 sm:px-8 pb-28 max-w-6xl mx-auto space-y-8 bg-[#FAF8F3]">
      {/* Friendly Student Header + Page Switcher */}
      <div className="card-light p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <TickyMascot size={90} mood="happy" />
          <div className="space-y-1">
            <span className="inline-block px-3 py-1 rounded-full bg-[#CDF22B] border border-[#08090B] font-display text-xs font-bold uppercase tracking-[0.12em]">
              STUDENT HUB · {user.display_name}
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#08090B]">
              Ready to save time today?
            </h1>
          </div>
        </div>

        {/* Dedicated Sub-Pages Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/student')}
            className={
              view === 'overview'
                ? 'btn-tactile-lime min-h-[44px] px-5 py-2.5 text-xs'
                : 'btn-tactile-secondary min-h-[44px] px-5 py-2.5 text-xs'
            }
          >
            Overview Page
          </button>
          <button
            type="button"
            onClick={() => navigate('/student/history')}
            className={
              view === 'history'
                ? 'btn-tactile-lime min-h-[44px] px-5 py-2.5 text-xs'
                : 'btn-tactile-secondary min-h-[44px] px-5 py-2.5 text-xs'
            }
          >
            My History Page ({reports.length})
          </button>
          <button
            type="button"
            onClick={() => navigate('/report')}
            className="btn-tactile-dark min-h-[44px] px-5 py-2.5 text-xs"
          >
            + Report Wait
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="btn-tactile-danger min-h-[44px] px-4 py-2.5 text-xs flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* SEPARATE PAGE 1: STUDENT OVERVIEW */}
      {view === 'overview' ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <DuoStatCard
              label="This Week"
              value={`${weekMinutes} mins`}
              sublabel="Your tracked wait time"
              accent="lime"
              icon={<Clock className="w-5 h-5" />}
            />
            <DuoStatCard
              label="All-Time Total"
              value={`${totalMinutes} mins`}
              sublabel={`Across ${reports.length} visits`}
              accent="teal"
              icon={<FileText className="w-5 h-5" />}
            />
            <DuoStatCard
              label="Fastest Counter Now"
              value={lowestWaitArea ? `${lowestWaitArea.avg_wait_minutes}m` : '4m'}
              sublabel={lowestWaitArea ? lowestWaitArea.name : 'Student Service Desk'}
              accent="lime"
              icon={<Zap className="w-5 h-5" />}
            />
          </div>

          <div className="card-light p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-[#08090B]">
                Tap a Place to Start Timing
              </h2>
              <button
                type="button"
                onClick={() => navigate('/campus')}
                className="text-xs font-display font-bold text-[#00545F] hover:underline"
              >
                Open Full Campus Page →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeAreas.slice(0, 6).map((area) => {
                const wait = area.avg_wait_minutes || 0;
                return (
                  <div
                    key={area.id}
                    className="p-5 rounded-3xl border border-[#08090B]/12 bg-[#FAF8F3] flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <AreaCategoryBadge category={area.category} size="sm" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display font-bold text-base text-[#08090B] truncate">
                          {area.name}
                        </h3>
                        <div className="text-xs text-[#08090B]/65 truncate">{area.building}</div>
                      </div>
                      <span className="font-mono text-base font-bold text-[#00545F] tabular-nums">
                        {wait ? `${wait}m` : 'New'}
                      </span>
                    </div>

                    <DuoProgressBar
                      value={wait}
                      max={20}
                      variant={wait >= 14 ? 'orange' : wait >= 8 ? 'amber' : 'lime'}
                      heightClass="h-3.5"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/q/${area.stable_identifier}`)}
                        className="btn-tactile-lime min-h-[40px] px-3 py-1.5 text-xs flex items-center justify-center gap-1"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Stopwatch</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/report?area=${area.stable_identifier}`)}
                        className="btn-tactile-secondary min-h-[40px] px-3 py-1.5 text-xs"
                      >
                        Log Mins
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* SEPARATE PAGE 2: STUDENT HISTORY */
        <div className="card-light p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between border-b border-[#08090B]/10 pb-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#08090B]">
                My Personal Wait Log
              </h2>
              <p className="text-xs text-[#08090B]/65">
                Private to your account · {reports.length} completed entries
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/report')}
              className="btn-tactile-lime min-h-[42px] px-4 py-2 text-xs"
            >
              + Log New Wait
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-[#08090B]/60 py-6">Loading your history…</p>
          ) : reports.length === 0 ? (
            <div className="py-10 text-center space-y-4">
              <p className="text-base font-bold text-[#08090B]">
                You haven&apos;t logged any waiting times yet!
              </p>
              <button
                type="button"
                onClick={() => navigate('/report')}
                className="btn-tactile-lime min-h-[46px] px-6 py-2.5 text-xs"
              >
                Log Your First Wait
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 rounded-2xl border border-[#08090B]/12 bg-[#FAF8F3] flex items-center justify-between gap-4"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-display font-bold text-base text-[#08090B] truncate">
                      {rep.area_name}
                    </div>
                    <div className="text-xs text-[#08090B]/70 truncate">
                      {rep.issue_tag || rep.feedback_note || 'Standard line check-in'}
                    </div>
                    <div className="text-[11px] font-mono text-[#00545F]">
                      {rep.reporting_source === 'qr_timer' ? 'QR Stopwatch' : 'Manual'} ·{' '}
                      {new Date(rep.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-[#CDF22B] border border-[#08090B] font-mono text-base font-bold text-[#08090B] shrink-0 tabular-nums">
                    {rep.duration_minutes}m
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
