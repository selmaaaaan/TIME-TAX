import type { Area, WaitReport } from '../types';

export interface SingleQueueResult {
  counters: number;
  utilization: number; // 0 to >1
  isOverloaded: boolean;
  probabilityOfWaiting: number; // 0 to 1
  expectedQueueWaitMinutes: number | null;
  expectedTotalSystemMinutes: number | null;
}

export interface ErlangCSimulationInput {
  arrivalRatePerHour: number; // lambda
  serviceDurationMinutes: number; // S (1/mu in minutes)
  currentCounters: number;
  proposedCounters: number;
  monthlyVisitsAssumption: number;
}

export interface ErlangCSimulationOutput {
  valid: boolean;
  error?: string;
  trafficIntensityErlangs: number;
  serviceRatePerCounterPerHour: number;
  current: SingleQueueResult;
  proposed: SingleQueueResult;
  minutesSavedPerVisit: number | null;
  monthlyHoursRecovered: number | null;
  summaryStatus: 'stable_improvement' | 'current_overloaded_fixed' | 'still_overloaded' | 'no_change' | 'invalid';
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

export function evaluateMMcQueue(
  arrivalRatePerHour: number,
  serviceDurationMinutes: number,
  counters: number
): SingleQueueResult {
  const c = Math.max(1, Math.floor(counters));
  const mu = 60 / serviceDurationMinutes; // customers served per hour per counter
  const a = arrivalRatePerHour / mu; // traffic intensity in Erlangs
  const rho = a / c; // server utilization

  if (!Number.isFinite(rho) || rho >= 1 || rho < 0) {
    return {
      counters: c,
      utilization: Number.isFinite(rho) ? Number(rho.toFixed(4)) : 999,
      isOverloaded: true,
      probabilityOfWaiting: 1,
      expectedQueueWaitMinutes: null,
      expectedTotalSystemMinutes: null,
    };
  }

  if (a === 0) {
    return {
      counters: c,
      utilization: 0,
      isOverloaded: false,
      probabilityOfWaiting: 0,
      expectedQueueWaitMinutes: 0,
      expectedTotalSystemMinutes: Number(serviceDurationMinutes.toFixed(2)),
    };
  }

  // Compute sum_{k=0}^{c-1} (a^k / k!)
  let sumTerms = 0;
  for (let k = 0; k < c; k++) {
    sumTerms += Math.pow(a, k) / factorial(k);
  }

  const lastTerm = (Math.pow(a, c) / factorial(c)) * (1 / (1 - rho));
  const p0 = 1 / (sumTerms + lastTerm);
  const probWait = lastTerm * p0;

  // Expected waiting time in queue in hours: Wq = Pw / (c * mu - lambda)
  const wqHours = probWait / (c * mu - arrivalRatePerHour);
  const wqMinutes = Math.max(0, wqHours * 60);
  const totalMinutes = wqMinutes + serviceDurationMinutes;

  return {
    counters: c,
    utilization: Number(rho.toFixed(4)),
    isOverloaded: false,
    probabilityOfWaiting: Number(probWait.toFixed(4)),
    expectedQueueWaitMinutes: Number(wqMinutes.toFixed(2)),
    expectedTotalSystemMinutes: Number(totalMinutes.toFixed(2)),
  };
}

export function calculateErlangC(input: ErlangCSimulationInput): ErlangCSimulationOutput {
  const {
    arrivalRatePerHour,
    serviceDurationMinutes,
    currentCounters,
    proposedCounters,
    monthlyVisitsAssumption,
  } = input;

  if (
    !Number.isFinite(arrivalRatePerHour) ||
    arrivalRatePerHour <= 0 ||
    !Number.isFinite(serviceDurationMinutes) ||
    serviceDurationMinutes <= 0 ||
    !Number.isFinite(currentCounters) ||
    currentCounters < 1 ||
    !Number.isFinite(proposedCounters) ||
    proposedCounters < 1
  ) {
    return {
      valid: false,
      error: 'Arrival rate, service duration, and counter counts must all be positive numbers.',
      trafficIntensityErlangs: 0,
      serviceRatePerCounterPerHour: 0,
      current: {
        counters: 1,
        utilization: 0,
        isOverloaded: false,
        probabilityOfWaiting: 0,
        expectedQueueWaitMinutes: null,
        expectedTotalSystemMinutes: null,
      },
      proposed: {
        counters: 1,
        utilization: 0,
        isOverloaded: false,
        probabilityOfWaiting: 0,
        expectedQueueWaitMinutes: null,
        expectedTotalSystemMinutes: null,
      },
      minutesSavedPerVisit: null,
      monthlyHoursRecovered: null,
      summaryStatus: 'invalid',
    };
  }

  const mu = 60 / serviceDurationMinutes;
  const a = arrivalRatePerHour / mu;
  const current = evaluateMMcQueue(arrivalRatePerHour, serviceDurationMinutes, currentCounters);
  const proposed = evaluateMMcQueue(arrivalRatePerHour, serviceDurationMinutes, proposedCounters);

  let minutesSavedPerVisit: number | null = null;
  let monthlyHoursRecovered: number | null = null;
  let summaryStatus: ErlangCSimulationOutput['summaryStatus'] = 'stable_improvement';

  if (current.isOverloaded && proposed.isOverloaded) {
    summaryStatus = 'still_overloaded';
  } else if (current.isOverloaded && !proposed.isOverloaded) {
    summaryStatus = 'current_overloaded_fixed';
  } else if (
    !current.isOverloaded &&
    !proposed.isOverloaded &&
    current.expectedQueueWaitMinutes !== null &&
    proposed.expectedQueueWaitMinutes !== null
  ) {
    minutesSavedPerVisit = Number(
      (current.expectedQueueWaitMinutes - proposed.expectedQueueWaitMinutes).toFixed(2)
    );
    if (Math.abs(minutesSavedPerVisit) < 0.01) {
      summaryStatus = 'no_change';
      minutesSavedPerVisit = 0;
    }
    if (Number.isFinite(monthlyVisitsAssumption) && monthlyVisitsAssumption > 0) {
      monthlyHoursRecovered = Number(
        ((minutesSavedPerVisit * monthlyVisitsAssumption) / 60).toFixed(1)
      );
    }
  }

  return {
    valid: true,
    trafficIntensityErlangs: Number(a.toFixed(2)),
    serviceRatePerCounterPerHour: Number(mu.toFixed(2)),
    current,
    proposed,
    minutesSavedPerVisit,
    monthlyHoursRecovered,
    summaryStatus,
  };
}

export function generateStableIdentifier(name: string, existingIdentifiers: string[] = []): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'campus-area';

  const existingSet = new Set(existingIdentifiers.map((id) => id.toLowerCase()));
  if (!existingSet.has(base)) {
    return base;
  }

  let suffix = 2;
  while (existingSet.has(`${base}-${suffix}`)) {
    suffix++;
  }
  return `${base}-${suffix}`;
}

export function calculateSessionDurationMinutes(startedAtIso: string, endedAtIso: string): number {
  const startMs = new Date(startedAtIso).getTime();
  const endMs = new Date(endedAtIso).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) {
    throw new Error('Invalid session timestamps');
  }
  const diffMinutes = (endMs - startMs) / 60000;
  // Minimum 1 minute recorded for a completed real-time queue session so short demo checks register visibly
  return Math.max(1, Math.round(diffMinutes * 10) / 10);
}

export interface AggregatedAnalytics {
  totalMinutes: number;
  totalHours: number;
  averageWaitMinutes: number;
  totalReports: number;
  timerReportsCount: number;
  timerTotalMinutes: number;
  manualReportsCount: number;
  manualTotalMinutes: number;
  demoReportsCount: number;
  demoTotalMinutes: number;
  liveReportsCount: number;
  liveTotalMinutes: number;
  areaBreakdown: Array<{
    area_id: string;
    area_name: string;
    category: string;
    report_count: number;
    live_count: number;
    demo_count: number;
    total_minutes: number;
    avg_wait_minutes: number;
    timer_count: number;
    manual_count: number;
  }>;
  dailyTrend: Array<{
    date: string;
    label: string;
    avg_minutes: number;
    total_minutes: number;
    report_count: number;
    live_minutes: number;
    demo_minutes: number;
  }>;
  hourlyDistribution: Array<{
    hour: number;
    label: string;
    report_count: number;
    avg_minutes: number;
  }>;
}

export function aggregateWaitReports(
  reports: WaitReport[],
  areas: Area[],
  options: { days?: number; includeDemo?: boolean; nowIso?: string } = {}
): AggregatedAnalytics {
  const { days = 7, includeDemo = true, nowIso } = options;
  const now = nowIso ? new Date(nowIso).getTime() : Date.now();
  const cutoff = days > 0 ? now - days * 24 * 60 * 60 * 1000 : 0;

  const filtered = reports.filter((r) => {
    if (!includeDemo && r.is_demo) return false;
    if (cutoff > 0) {
      const createdMs = new Date(r.created_at).getTime();
      if (createdMs < cutoff) return false;
    }
    return true;
  });

  let totalMinutes = 0;
  let timerReportsCount = 0;
  let timerTotalMinutes = 0;
  let manualReportsCount = 0;
  let manualTotalMinutes = 0;
  let demoReportsCount = 0;
  let demoTotalMinutes = 0;
  let liveReportsCount = 0;
  let liveTotalMinutes = 0;

  for (const r of filtered) {
    const mins = Number(r.duration_minutes) || 0;
    totalMinutes += mins;

    if (r.is_demo) {
      demoReportsCount++;
      demoTotalMinutes += mins;
    } else {
      liveReportsCount++;
      liveTotalMinutes += mins;
    }

    if (r.reporting_source === 'qr_timer') {
      timerReportsCount++;
      timerTotalMinutes += mins;
    } else {
      manualReportsCount++;
      manualTotalMinutes += mins;
    }
  }

  const totalReports = filtered.length;
  const averageWaitMinutes =
    totalReports > 0 ? Number((totalMinutes / totalReports).toFixed(1)) : 0;

  const areaMap = new Map<string, Area>();
  for (const a of areas) {
    areaMap.set(a.id, a);
  }

  const byArea = new Map<
    string,
    {
      area_id: string;
      area_name: string;
      category: string;
      report_count: number;
      live_count: number;
      demo_count: number;
      total_minutes: number;
      timer_count: number;
      manual_count: number;
    }
  >();

  for (const a of areas) {
    if (a.status !== 'archived') {
      byArea.set(a.id, {
        area_id: a.id,
        area_name: a.name,
        category: a.category,
        report_count: 0,
        live_count: 0,
        demo_count: 0,
        total_minutes: 0,
        timer_count: 0,
        manual_count: 0,
      });
    }
  }

  for (const r of filtered) {
    const area = areaMap.get(r.area_id);
    const existing = byArea.get(r.area_id) || {
      area_id: r.area_id,
      area_name: area?.name || r.area_name || 'Campus Area',
      category: area?.category || r.area_category || 'General',
      report_count: 0,
      live_count: 0,
      demo_count: 0,
      total_minutes: 0,
      timer_count: 0,
      manual_count: 0,
    };

    existing.report_count += 1;
    existing.total_minutes += Number(r.duration_minutes) || 0;
    if (r.is_demo) existing.demo_count += 1;
    else existing.live_count += 1;
    if (r.reporting_source === 'qr_timer') existing.timer_count += 1;
    else existing.manual_count += 1;

    byArea.set(r.area_id, existing);
  }

  const areaBreakdown = Array.from(byArea.values())
    .map((item) => ({
      ...item,
      total_minutes: Number(item.total_minutes.toFixed(1)),
      avg_wait_minutes:
        item.report_count > 0
          ? Number((item.total_minutes / item.report_count).toFixed(1))
          : 0,
    }))
    .sort((a, b) => b.avg_wait_minutes - a.avg_wait_minutes || b.report_count - a.report_count);

  // Build daily trend for last min(days, 14) days
  const trendDays = days > 0 ? Math.min(days, 14) : 7;
  const dailyMap = new Map<
    string,
    { total: number; count: number; live: number; demo: number; label: string }
  >();

  for (let i = trendDays - 1; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dailyMap.set(key, { total: 0, count: 0, live: 0, demo: 0, label });
  }

  for (const r of filtered) {
    const key = new Date(r.created_at).toISOString().slice(0, 10);
    const bucket = dailyMap.get(key);
    if (bucket) {
      const mins = Number(r.duration_minutes) || 0;
      bucket.total += mins;
      bucket.count += 1;
      if (r.is_demo) bucket.demo += mins;
      else bucket.live += mins;
    }
  }

  const dailyTrend = Array.from(dailyMap.entries()).map(([date, val]) => ({
    date,
    label: val.label,
    avg_minutes: val.count > 0 ? Number((val.total / val.count).toFixed(1)) : 0,
    total_minutes: Number(val.total.toFixed(1)),
    report_count: val.count,
    live_minutes: Number(val.live.toFixed(1)),
    demo_minutes: Number(val.demo.toFixed(1)),
  }));

  // Hourly distribution (8 AM to 6 PM campus hours)
  const hourlyBuckets = new Map<number, { total: number; count: number }>();
  for (let h = 8; h <= 18; h++) {
    hourlyBuckets.set(h, { total: 0, count: 0 });
  }
  for (const r of filtered) {
    const h = new Date(r.created_at).getHours();
    const bucket = hourlyBuckets.get(h) || { total: 0, count: 0 };
    bucket.total += Number(r.duration_minutes) || 0;
    bucket.count += 1;
    hourlyBuckets.set(h, bucket);
  }

  const hourlyDistribution = Array.from(hourlyBuckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([hour, val]) => ({
      hour,
      label: `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'PM' : 'AM'}`,
      report_count: val.count,
      avg_minutes: val.count > 0 ? Number((val.total / val.count).toFixed(1)) : 0,
    }));

  return {
    totalMinutes: Number(totalMinutes.toFixed(1)),
    totalHours: Number((totalMinutes / 60).toFixed(1)),
    averageWaitMinutes,
    totalReports,
    timerReportsCount,
    timerTotalMinutes: Number(timerTotalMinutes.toFixed(1)),
    manualReportsCount,
    manualTotalMinutes: Number(manualTotalMinutes.toFixed(1)),
    demoReportsCount,
    demoTotalMinutes: Number(demoTotalMinutes.toFixed(1)),
    liveReportsCount,
    liveTotalMinutes: Number(liveTotalMinutes.toFixed(1)),
    areaBreakdown,
    dailyTrend,
    hourlyDistribution,
  };
}

export interface BeforeAfterComparison {
  areaId: string;
  implementationDate: string;
  beforeSampleSize: number;
  afterSampleSize: number;
  beforeAvgMinutes: number | null;
  afterAvgMinutes: number | null;
  deltaMinutes: number | null;
  percentChange: number | null;
  hasSufficientEvidence: boolean;
  limitationNote: string;
}

export function compareInterventionBeforeAfter(
  reports: WaitReport[],
  areaId: string,
  implementationDateIso: string,
  includeDemo = true
): BeforeAfterComparison {
  const pivotMs = new Date(implementationDateIso).getTime();
  const areaReports = reports.filter(
    (r) => r.area_id === areaId && (includeDemo || !r.is_demo)
  );

  const before = areaReports.filter((r) => new Date(r.created_at).getTime() < pivotMs);
  const after = areaReports.filter((r) => new Date(r.created_at).getTime() >= pivotMs);

  const beforeAvg =
    before.length > 0
      ? Number(
          (
            before.reduce((acc, r) => acc + Number(r.duration_minutes), 0) / before.length
          ).toFixed(1)
        )
      : null;

  const afterAvg =
    after.length > 0
      ? Number(
          (
            after.reduce((acc, r) => acc + Number(r.duration_minutes), 0) / after.length
          ).toFixed(1)
        )
      : null;

  const hasSufficientEvidence = before.length >= 3 && after.length >= 3;
  let deltaMinutes: number | null = null;
  let percentChange: number | null = null;

  if (beforeAvg !== null && afterAvg !== null && beforeAvg > 0) {
    deltaMinutes = Number((afterAvg - beforeAvg).toFixed(1));
    percentChange = Number((((afterAvg - beforeAvg) / beforeAvg) * 100).toFixed(1));
  }

  let limitationNote =
    'Observed change reflects sample reports before and after the intervention date, not controlled causal proof.';
  if (!hasSufficientEvidence) {
    limitationNote = `Insufficient sample size (${before.length} before, ${after.length} after; minimum 3 required in each period) to draw reliable conclusions.`;
  }

  return {
    areaId,
    implementationDate: implementationDateIso,
    beforeSampleSize: before.length,
    afterSampleSize: after.length,
    beforeAvgMinutes: beforeAvg,
    afterAvgMinutes: afterAvg,
    deltaMinutes,
    percentChange,
    hasSufficientEvidence,
    limitationNote,
  };
}
