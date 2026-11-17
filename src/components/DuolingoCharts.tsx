import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Trophy,
  Zap,
  QrCode,
  ArrowUpRight,
  BarChart3,
} from 'lucide-react';
import type { AggregatedAnalytics, BeforeAfterComparison } from '../utils/queueMath';
import type { Intervention } from '../types';

/**
 * Duolingo-style chunky progress bar with signature inner top highlight shine strip.
 * Uses the user's exact palette:
 * - Electric/Neon Lime: #C7FF00 / #CDF22B / #D6FB00
 * - Deep Teal: #00545F
 * - Pale Lime: #ECFFB6
 * - Obsidian Green: #021E18
 * - Soft Ivory: #FAF8F3
 * - Warning Orange: #FF2A00
 * - Caution Amber: #FFC000
 */
export const DuoProgressBar: React.FC<{
  value: number;
  max: number;
  variant?: 'lime' | 'teal' | 'amber' | 'orange';
  heightClass?: string;
  showLabel?: string;
}> = ({ value, max, variant = 'lime', heightClass = 'h-5', showLabel }) => {
  const pct = max > 0 ? Math.min(100, Math.max(value > 0 ? 8 : 0, Math.round((value / max) * 100))) : 0;

  const fillStyles = {
    lime: 'bg-[#C7FF00] border-[#021E18]',
    teal: 'bg-[#00545F] border-[#021E18]',
    amber: 'bg-[#FFC000] border-[#021E18]',
    orange: 'bg-[#FF2A00] border-[#021E18]',
  }[variant];

  const shineStyles = {
    lime: 'bg-white/60',
    teal: 'bg-[#ECFFB6]/40',
    amber: 'bg-white/50',
    orange: 'bg-white/40',
  }[variant];

  return (
    <div className="w-full">
      <div
        className={`w-full ${heightClass} rounded-full bg-[#FAF8F3] border-2 border-[#021E18]/20 p-0.5 overflow-hidden relative shadow-inner`}
      >
        <div
          style={{ width: `${pct}%` }}
          className={`h-full rounded-full transition-all duration-300 relative flex flex-col justify-start pt-0.5 px-2 ${fillStyles}`}
        >
          {pct > 10 && <div className={`w-full h-1.5 rounded-full ${shineStyles}`} />}
        </div>
        {showLabel && (
          <span className="sr-only">{showLabel}</span>
        )}
      </div>
    </div>
  );
};

/**
 * Duolingo-style Tactile Stat Card with 2px border + 4px bottom lip
 */
export const DuoStatCard: React.FC<{
  label: string;
  value: string | number;
  sublabel: string;
  accent?: 'lime' | 'teal' | 'amber' | 'orange' | 'obsidian';
  icon?: React.ReactNode;
  testId?: string;
}> = ({ label, value, sublabel, accent = 'lime', icon, testId }) => {
  const badgeColors = {
    lime: 'bg-[#C7FF00] text-[#021E18] border-[#021E18]',
    teal: 'bg-[#00545F] text-[#FAF8F3] border-[#021E18]',
    amber: 'bg-[#FFC000] text-[#021E18] border-[#021E18]',
    orange: 'bg-[#FF2A00] text-[#FAF8F3] border-[#021E18]',
    obsidian: 'bg-[#021E18] text-[#C7FF00] border-[#021E18]',
  }[accent];

  const valueColors = {
    lime: 'text-[#021E18]',
    teal: 'text-[#00545F]',
    amber: 'text-[#021E18]',
    orange: 'text-[#FF2A00]',
    obsidian: 'text-[#021E18]',
  }[accent];

  return (
    <div className="rounded-2xl bg-white text-[#021E18] border-2 border-[#021E18]/15 border-b-4 border-b-[#021E18]/25 p-5 flex flex-col justify-between gap-3 transition-transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-bold tracking-wide text-[#021E18]/70 uppercase">
          {label}
        </span>
        {icon && (
          <div
            className={`w-10 h-10 rounded-xl border-2 border-b-4 flex items-center justify-center shrink-0 ${badgeColors}`}
          >
            {icon}
          </div>
        )}
      </div>
      <div>
        <div
          data-testid={testId}
          className={`font-mono text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight ${valueColors}`}
        >
          {value}
        </div>
        <div className="text-xs font-medium text-[#021E18]/65 mt-1 font-mono tabular-nums">
          {sublabel}
        </div>
      </div>
    </div>
  );
};

/**
 * Duolingo League-Style Area Bottleneck Ranking & Progress Visualization
 */
export const DuoAreaLeagueChart: React.FC<{
  areaBreakdown: AggregatedAnalytics['areaBreakdown'];
  onSelectArea?: (areaId: string) => void;
}> = ({ areaBreakdown, onSelectArea }) => {
  const maxAvg =
    areaBreakdown.length > 0
      ? Math.max(...areaBreakdown.map((a) => a.avg_wait_minutes), 15)
      : 20;

  return (
    <div className="rounded-2xl bg-white text-[#021E18] border-2 border-[#021E18]/15 border-b-4 border-b-[#021E18]/25 p-6 sm:p-7 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#021E18]/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#C7FF00] border-2 border-[#021E18] border-b-4 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-[#021E18]" />
          </div>
          <div>
            <h2 className="font-display text-xl font-extrabold text-[#021E18]">
              Campus Queue Leaderboard
            </h2>
            <p className="text-xs font-medium text-[#021E18]/65">
              Average wait minutes per visit · Campus target goal is under 10 mins
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs font-bold">
          <span className="flex items-center gap-1.5 text-[#021E18]">
            <span className="w-3 h-3 rounded-sm bg-[#C7FF00] border border-[#021E18] inline-block" />
            Fast (&lt;8m)
          </span>
          <span className="flex items-center gap-1.5 text-[#021E18]">
            <span className="w-3 h-3 rounded-sm bg-[#FFC000] border border-[#021E18] inline-block" />
            Moderate (8–13m)
          </span>
          <span className="flex items-center gap-1.5 text-[#021E18]">
            <span className="w-3 h-3 rounded-sm bg-[#FF2A00] border border-[#021E18] inline-block" />
            Bottleneck (14m+)
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {areaBreakdown.map((item, idx) => {
          const isHigh = item.avg_wait_minutes >= 14;
          const isMed = item.avg_wait_minutes >= 8 && item.avg_wait_minutes < 14;
          const variant = isHigh ? 'orange' : isMed ? 'amber' : 'lime';

          const rankColors =
            idx === 0
              ? 'bg-[#FF2A00] text-[#FAF8F3] border-[#021E18]'
              : idx === 1
              ? 'bg-[#FFC000] text-[#021E18] border-[#021E18]'
              : 'bg-[#ECFFB6] text-[#021E18] border-[#021E18]/30';

          return (
            <div
              key={item.area_id}
              onClick={() => onSelectArea && onSelectArea(item.area_id)}
              className={`p-4 rounded-xl border-2 border-[#021E18]/12 bg-[#FAF8F3]/70 hover:border-[#021E18]/40 transition-all space-y-2.5 ${
                onSelectArea ? 'cursor-pointer' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-lg border-2 font-mono text-xs font-extrabold flex items-center justify-center shrink-0 tabular-nums ${rankColors}`}
                  >
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-display font-bold text-sm sm:text-base text-[#021E18] truncate">
                      {item.area_name}
                    </div>
                    <div className="text-xs text-[#021E18]/60 truncate">
                      {item.category} · {item.report_count} reports ({item.live_count} live)
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`font-mono text-base sm:text-lg font-extrabold tabular-nums ${
                      isHigh
                        ? 'text-[#FF2A00]'
                        : isMed
                        ? 'text-[#021E18]'
                        : 'text-[#00545F]'
                    }`}
                  >
                    {item.avg_wait_minutes} min
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#021E18]/55">
                    {isHigh ? 'Bottleneck' : isMed ? 'Moderate' : 'On Target'}
                  </div>
                </div>
              </div>

              <DuoProgressBar
                value={item.report_count > 0 ? item.avg_wait_minutes : 0}
                max={maxAvg}
                variant={variant}
                heightClass="h-5"
                showLabel={`${item.area_name}: ${item.avg_wait_minutes} minutes average wait`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Duolingo-Style Daily Streak & Volume Bar Chart with tactile 3D columns
 */
export const DuoDailyXpChart: React.FC<{
  dailyTrend: AggregatedAnalytics['dailyTrend'];
}> = ({ dailyTrend }) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(
    dailyTrend.length > 0 ? dailyTrend.length - 1 : 0
  );

  const maxTotal =
    dailyTrend.length > 0
      ? Math.max(...dailyTrend.map((d) => d.total_minutes), 30)
      : 60;

  const activeDay = dailyTrend[selectedIdx] || dailyTrend[dailyTrend.length - 1];

  return (
    <div className="rounded-2xl bg-white text-[#021E18] border-2 border-[#021E18]/15 border-b-4 border-b-[#021E18]/25 p-6 sm:p-7 flex flex-col justify-between space-y-6">
      <div className="flex items-start justify-between gap-4 border-b-2 border-[#021E18]/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#00545F] text-[#C7FF00] border-2 border-[#021E18] border-b-4 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-extrabold text-[#021E18]">
              Daily Tracked Minutes
            </h2>
            <p className="text-xs font-medium text-[#021E18]/65">
              Tap any day bar to inspect Live vs Demo breakdown
            </p>
          </div>
        </div>
        {activeDay && (
          <div className="text-right font-mono">
            <div className="text-lg font-extrabold text-[#021E18] tabular-nums">
              {activeDay.total_minutes}m
            </div>
            <div className="text-[11px] font-bold text-[#00545F] tabular-nums">
              {activeDay.label} ({activeDay.report_count} rep)
            </div>
          </div>
        )}
      </div>

      {/* Selected Day Callout Strip */}
      {activeDay && (
        <div className="rounded-xl bg-[#ECFFB6]/60 border-2 border-[#021E18]/15 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-[#021E18]">
            {activeDay.label}: {activeDay.avg_minutes}m avg wait
          </span>
          <span className="font-mono font-bold text-[#00545F] tabular-nums">
            {activeDay.live_minutes}m Live · {activeDay.demo_minutes}m Demo
          </span>
        </div>
      )}

      {/* Duolingo Rounded Pill Columns */}
      <div className="h-52 flex items-end gap-2.5 pt-6 pb-2 px-2 bg-[#FAF8F3] rounded-xl border-2 border-[#021E18]/10 relative">
        {dailyTrend.map((day, idx) => {
          const heightPct = Math.min(
            100,
            Math.max(
              day.total_minutes > 0 ? 16 : 6,
              Math.round((day.total_minutes / maxTotal) * 100)
            )
          );
          const isSelected = idx === selectedIdx;
          const hasLive = day.live_minutes > 0;

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              aria-label={`${day.label}: ${day.total_minutes} minutes`}
              className="flex-1 flex flex-col items-center justify-end h-full group focus:outline-none"
            >
              <span
                className={`text-[10px] font-mono font-extrabold mb-1.5 tabular-nums transition-transform ${
                  isSelected ? 'text-[#021E18] scale-110' : 'text-[#021E18]/60'
                }`}
              >
                {day.total_minutes > 0 ? `${day.total_minutes}m` : '0m'}
              </span>
              <div
                style={{ height: `${heightPct}%` }}
                className={`w-full max-w-[38px] rounded-t-xl rounded-b-md border-2 border-b-4 transition-all relative overflow-hidden flex flex-col items-center pt-1 px-1 ${
                  isSelected
                    ? 'bg-[#C7FF00] border-[#021E18] -translate-y-0.5'
                    : hasLive
                    ? 'bg-[#CDF22B] border-[#021E18]/80 hover:bg-[#C7FF00]'
                    : day.total_minutes > 0
                    ? 'bg-[#00545F] border-[#021E18]'
                    : 'bg-[#021E18]/10 border-[#021E18]/20'
                }`}
              >
                {day.total_minutes > 0 && (
                  <div className="w-1.5 h-full rounded-full bg-white/35 self-start" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* X-Axis Labels */}
      <div className="flex items-center justify-between gap-1 text-[11px] font-mono font-bold text-[#021E18]/75">
        {dailyTrend.map((day, idx) => (
          <button
            key={day.date}
            type="button"
            onClick={() => setSelectedIdx(idx)}
            className={`truncate text-center flex-1 py-1 rounded-md transition-colors ${
              idx === selectedIdx
                ? 'bg-[#021E18] text-[#C7FF00]'
                : 'hover:bg-[#021E18]/5'
            }`}
          >
            {day.label}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * Duolingo Skill-Tile Peak Hour Congestion Matrix (08:00 AM - 06:00 PM)
 */
export const DuoPeakHourTiles: React.FC<{
  hourlyDistribution: AggregatedAnalytics['hourlyDistribution'];
}> = ({ hourlyDistribution }) => {
  return (
    <div className="rounded-2xl bg-white text-[#021E18] border-2 border-[#021E18]/15 border-b-4 border-b-[#021E18]/25 p-6 sm:p-7 space-y-5">
      <div className="flex items-center justify-between gap-4 border-b-2 border-[#021E18]/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#ECFFB6] text-[#021E18] border-2 border-[#021E18] border-b-4 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-extrabold text-[#021E18]">
              Hourly Congestion Tiles (8 AM – 6 PM)
            </h2>
            <p className="text-xs font-medium text-[#021E18]/65">
              Plan your campus counter visit during green low-wait windows
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {hourlyDistribution.map((slot) => {
          const high = slot.avg_minutes >= 14;
          const med = slot.avg_minutes >= 8 && slot.avg_minutes < 14;
          const active = slot.report_count > 0;

          const tileStyle = high
            ? 'bg-[#FF2A00] text-[#FAF8F3] border-[#021E18]'
            : med
            ? 'bg-[#FFC000] text-[#021E18] border-[#021E18]'
            : active
            ? 'bg-[#C7FF00] text-[#021E18] border-[#021E18]'
            : 'bg-[#FAF8F3] text-[#021E18]/45 border-[#021E18]/15';

          return (
            <div
              key={slot.hour}
              className={`p-3 rounded-2xl border-2 border-b-4 text-center space-y-1 transition-transform hover:-translate-y-0.5 ${tileStyle}`}
            >
              <div className="text-[11px] font-mono font-bold opacity-85">{slot.label}</div>
              <div className="font-mono text-base font-extrabold tabular-nums">
                {active ? `${slot.avg_minutes}m` : '—'}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-tight opacity-80 tabular-nums">
                {high ? 'Peak' : med ? 'Busy' : active ? 'Fast' : 'Quiet'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Duolingo Before & After Intervention Proof Comparison Cards
 */
export const DuoInterventionProofCard: React.FC<{
  interventions: Array<{ intervention: Intervention; comparison: BeforeAfterComparison }>;
}> = ({ interventions }) => {
  return (
    <div className="rounded-2xl bg-white text-[#021E18] border-2 border-[#021E18]/15 border-b-4 border-b-[#021E18]/25 p-6 sm:p-7 space-y-5">
      <div className="flex items-center gap-3 border-b-2 border-[#021E18]/10 pb-4">
        <div className="w-11 h-11 rounded-xl bg-[#C7FF00] text-[#021E18] border-2 border-[#021E18] border-b-4 flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-display text-xl font-extrabold text-[#021E18]">
            Before vs. After Intervention Proof
          </h2>
          <p className="text-xs font-medium text-[#021E18]/65">
            Measured queue reduction after structural counter improvements
          </p>
        </div>
      </div>

      {interventions.length === 0 ? (
        <p className="text-sm text-[#021E18]/70">No interventions recorded yet.</p>
      ) : (
        <div className="space-y-4">
          {interventions.map(({ intervention, comparison }) => {
            const beforeVal = comparison.beforeAvgMinutes ?? 0;
            const afterVal = comparison.afterAvgMinutes ?? 0;
            const maxVal = Math.max(beforeVal, afterVal, 16);

            return (
              <div
                key={intervention.id}
                className="p-5 rounded-2xl border-2 border-[#021E18]/15 bg-[#FAF8F3] space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-mono font-bold text-[#00545F] uppercase">
                      {intervention.area_name} · {intervention.status}
                    </div>
                    <h3 className="font-display text-base sm:text-lg font-extrabold text-[#021E18]">
                      {intervention.title}
                    </h3>
                  </div>
                  {comparison.percentChange !== null && (
                    <span className="px-3 py-1 rounded-xl bg-[#C7FF00] text-[#021E18] border-2 border-[#021E18] font-mono text-xs font-extrabold tabular-nums">
                      {comparison.percentChange}% Wait Time
                    </span>
                  )}
                </div>

                {/* Visual Before / After Duolingo Bars */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-[#021E18]/75">
                        Before Fix (n={comparison.beforeSampleSize})
                      </span>
                      <span className="font-mono text-[#FF2A00] tabular-nums">
                        {comparison.beforeAvgMinutes !== null
                          ? `${comparison.beforeAvgMinutes} min`
                          : 'N/A'}
                      </span>
                    </div>
                    <DuoProgressBar value={beforeVal} max={maxVal} variant="orange" heightClass="h-4" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-[#021E18]/75">
                        After Fix (n={comparison.afterSampleSize})
                      </span>
                      <span className="font-mono text-[#00545F] tabular-nums">
                        {comparison.afterAvgMinutes !== null
                          ? `${comparison.afterAvgMinutes} min`
                          : 'N/A'}
                      </span>
                    </div>
                    <DuoProgressBar value={afterVal} max={maxVal} variant="lime" heightClass="h-4" />
                  </div>
                </div>

                <div className="text-[11px] font-medium text-[#021E18]/70 flex items-start gap-2 pt-2 border-t border-[#021E18]/10">
                  {comparison.hasSufficientEvidence ? (
                    <CheckCircle2 className="w-4 h-4 text-[#00545F] shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-[#FFC000] shrink-0 mt-0.5" />
                  )}
                  <span>{comparison.limitationNote}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
