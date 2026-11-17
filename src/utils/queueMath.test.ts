import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateErlangC,
  generateStableIdentifier,
  calculateSessionDurationMinutes,
  aggregateWaitReports,
  compareInterventionBeforeAfter,
} from './queueMath';
import type { Area, WaitReport } from '../types';

test('Erlang C calculates stable improvement accurately when adding a service counter', () => {
  // 25 arrivals/hr, 2 min service time => mu = 30/hr, traffic intensity a = 25/30 = 0.8333 Erlangs
  // With c = 1 counter: utilization = 83.33%, Wq = (0.8333 / (30 - 25)) * 60 = 10.0 minutes
  // With c = 2 counters: utilization = 41.67%, Wq drops dramatically
  const res = calculateErlangC({
    arrivalRatePerHour: 25,
    serviceDurationMinutes: 2,
    currentCounters: 1,
    proposedCounters: 2,
    monthlyVisitsAssumption: 3000,
  });

  assert.equal(res.valid, true);
  assert.equal(res.current.isOverloaded, false);
  assert.equal(res.current.expectedQueueWaitMinutes, 10);
  assert.equal(res.proposed.isOverloaded, false);
  assert.ok(res.proposed.expectedQueueWaitMinutes !== null && res.proposed.expectedQueueWaitMinutes < 1);
  assert.ok(res.minutesSavedPerVisit !== null && res.minutesSavedPerVisit > 9);
  assert.ok(res.monthlyHoursRecovered !== null && res.monthlyHoursRecovered > 450);
  assert.equal(res.summaryStatus, 'stable_improvement');
});

test('Erlang C detects queue overload safely without returning Infinity or NaN', () => {
  // 40 arrivals/hr, 2 min service time (capacity 30/hr per counter) => c=1 is overloaded (rho = 1.3333)
  const res = calculateErlangC({
    arrivalRatePerHour: 40,
    serviceDurationMinutes: 2,
    currentCounters: 1,
    proposedCounters: 2,
    monthlyVisitsAssumption: 2000,
  });

  assert.equal(res.valid, true);
  assert.equal(res.current.isOverloaded, true);
  assert.equal(res.current.expectedQueueWaitMinutes, null);
  assert.equal(res.proposed.isOverloaded, false);
  assert.ok(res.proposed.expectedQueueWaitMinutes !== null && res.proposed.expectedQueueWaitMinutes > 0);
  assert.equal(res.summaryStatus, 'current_overloaded_fixed');
});

test('generateStableIdentifier produces unique permanent URL slugs', () => {
  const slug1 = generateStableIdentifier('Innovation Lab', ['main-canteen', 'library-counter']);
  assert.equal(slug1, 'innovation-lab');

  const slug2 = generateStableIdentifier('Innovation Lab', ['innovation-lab']);
  assert.equal(slug2, 'innovation-lab-2');
});

test('calculateSessionDurationMinutes computes accurate server duration and rejects reversed timestamps', () => {
  const d1 = calculateSessionDurationMinutes(
    '2026-11-17T08:00:00.000Z',
    '2026-11-17T08:08:30.000Z'
  );
  assert.equal(d1, 8.5);

  // Short demo tap (e.g. 5 seconds) still records minimum 1 minute
  const d2 = calculateSessionDurationMinutes(
    '2026-11-17T08:00:00.000Z',
    '2026-11-17T08:00:05.000Z'
  );
  assert.equal(d2, 1);

  assert.throws(() => {
    calculateSessionDurationMinutes(
      '2026-11-17T08:10:00.000Z',
      '2026-11-17T08:00:00.000Z'
    );
  });
});

test('aggregateWaitReports separates timer, manual, and demo records accurately', () => {
  const nowIso = '2026-11-17T12:00:00.000Z';
  const areas: Area[] = [
    {
      id: 'area-1',
      stable_identifier: 'main-canteen',
      name: 'Main Canteen',
      category: 'Dining & Food',
      description: 'Campus food hall',
      building: 'Student Center',
      floor: 'Ground Floor',
      counters: 2,
      service_minutes: 3,
      operating_hours: '8:00 AM - 6:00 PM',
      assigned_mentor_id: null,
      status: 'active',
      created_at: nowIso,
      updated_at: nowIso,
    },
  ];

  const reports: WaitReport[] = [
    {
      id: 'r1',
      area_id: 'area-1',
      user_id: null,
      queue_session_id: 's1',
      duration_minutes: 12,
      reporting_source: 'qr_timer',
      is_demo: false,
      created_at: '2026-11-17T10:00:00.000Z',
    },
    {
      id: 'r2',
      area_id: 'area-1',
      user_id: 'u1',
      queue_session_id: null,
      duration_minutes: 8,
      reporting_source: 'manual',
      is_demo: true,
      created_at: '2026-11-16T11:00:00.000Z',
    },
  ];

  const allStats = aggregateWaitReports(reports, areas, { days: 7, includeDemo: true, nowIso });
  assert.equal(allStats.totalReports, 2);
  assert.equal(allStats.totalMinutes, 20);
  assert.equal(allStats.timerReportsCount, 1);
  assert.equal(allStats.manualReportsCount, 1);
  assert.equal(allStats.liveReportsCount, 1);
  assert.equal(allStats.demoReportsCount, 1);

  const liveOnlyStats = aggregateWaitReports(reports, areas, { days: 7, includeDemo: false, nowIso });
  assert.equal(liveOnlyStats.totalReports, 1);
  assert.equal(liveOnlyStats.totalMinutes, 12);
  assert.equal(liveOnlyStats.demoReportsCount, 0);
});

test('compareInterventionBeforeAfter flags sample size sufficiency and computes delta', () => {
  const reports: WaitReport[] = [
    { id: '1', area_id: 'a1', user_id: null, queue_session_id: null, duration_minutes: 15, reporting_source: 'qr_timer', is_demo: false, created_at: '2026-11-10T10:00:00Z' },
    { id: '2', area_id: 'a1', user_id: null, queue_session_id: null, duration_minutes: 18, reporting_source: 'qr_timer', is_demo: false, created_at: '2026-11-11T10:00:00Z' },
    { id: '3', area_id: 'a1', user_id: null, queue_session_id: null, duration_minutes: 12, reporting_source: 'manual', is_demo: false, created_at: '2026-11-12T10:00:00Z' },
    { id: '4', area_id: 'a1', user_id: null, queue_session_id: null, duration_minutes: 7, reporting_source: 'qr_timer', is_demo: false, created_at: '2026-11-15T10:00:00Z' },
    { id: '5', area_id: 'a1', user_id: null, queue_session_id: null, duration_minutes: 8, reporting_source: 'qr_timer', is_demo: false, created_at: '2026-11-16T10:00:00Z' },
    { id: '6', area_id: 'a1', user_id: null, queue_session_id: null, duration_minutes: 6, reporting_source: 'manual', is_demo: false, created_at: '2026-11-17T10:00:00Z' },
  ];

  const comparison = compareInterventionBeforeAfter(reports, 'a1', '2026-11-14T00:00:00Z', true);
  assert.equal(comparison.hasSufficientEvidence, true);
  assert.equal(comparison.beforeSampleSize, 3);
  assert.equal(comparison.afterSampleSize, 3);
  assert.equal(comparison.beforeAvgMinutes, 15);
  assert.equal(comparison.afterAvgMinutes, 7);
  assert.equal(comparison.deltaMinutes, -8);
});
