
/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';

import type {
    MaintenanceOverview,
    MaintenanceOverviewResult,
} from '@/features/maintenance/lib/maintenance-overview';

import {
    getMaintenanceUrgency,
} from '@/features/maintenance/lib/maintenance-urgency';

function makeOverview(
  overrides: Partial<MaintenanceOverview> = {},
): MaintenanceOverviewResult {
  return {
    counts: {
      total: 0,
      enabled: 0,
      disabled: 0,
      configured: 0,
      unconfigured: 0,
      overdue: 0,
      dueSoon: 0,
      upcoming: 0,
      ...overrides,
    },
    items: [],
  };
}

test('returns EMPTY when no schedules exist', () => {
  const urgency = getMaintenanceUrgency(
    makeOverview(),
  );

  assert.deepEqual(urgency, {
    level: 'EMPTY',
    label: 'No maintenance schedules',
    count: 0,
    needsAttention: false,
  });
});

test('returns OVERDUE for one overdue schedule', () => {
  const urgency = getMaintenanceUrgency(
    makeOverview({
      total: 1,
      enabled: 1,
      configured: 1,
      overdue: 1,
    }),
  );

  assert.deepEqual(urgency, {
    level: 'OVERDUE',
    label: '1 overdue service',
    count: 1,
    needsAttention: true,
  });
});

test('formats multiple overdue schedules', () => {
  const urgency = getMaintenanceUrgency(
    makeOverview({
      total: 3,
      enabled: 3,
      configured: 3,
      overdue: 3,
    }),
  );

  assert.equal(urgency.level, 'OVERDUE');
  assert.equal(urgency.label, '3 overdue services');
  assert.equal(urgency.count, 3);
  assert.equal(urgency.needsAttention, true);
});

test('prioritizes overdue over due soon', () => {
  const urgency = getMaintenanceUrgency(
    makeOverview({
      total: 3,
      enabled: 3,
      configured: 3,
      overdue: 1,
      dueSoon: 2,
    }),
  );

  assert.equal(urgency.level, 'OVERDUE');
  assert.equal(urgency.count, 1);
  assert.equal(urgency.needsAttention, true);
});

test('returns DUE_SOON for one approaching service', () => {
  const urgency = getMaintenanceUrgency(
    makeOverview({
      total: 1,
      enabled: 1,
      configured: 1,
      dueSoon: 1,
    }),
  );

  assert.deepEqual(urgency, {
    level: 'DUE_SOON',
    label: '1 service due soon',
    count: 1,
    needsAttention: true,
  });
});

test('formats multiple due-soon services', () => {
  const urgency = getMaintenanceUrgency(
    makeOverview({
      total: 2,
      enabled: 2,
      configured: 2,
      dueSoon: 2,
    }),
  );

  assert.equal(urgency.level, 'DUE_SOON');
  assert.equal(
    urgency.label,
    '2 services due soon',
  );
  assert.equal(urgency.count, 2);
});

test('prioritizes due soon over upcoming', () => {
  const urgency = getMaintenanceUrgency(
    makeOverview({
      total: 3,
      enabled: 3,
      configured: 3,
      dueSoon: 1,
      upcoming: 2,
    }),
  );

  assert.equal(urgency.level, 'DUE_SOON');
  assert.equal(urgency.needsAttention, true);
});

test('returns OK for configured upcoming maintenance', () => {
  const urgency = getMaintenanceUrgency(
    makeOverview({
      total: 2,
      enabled: 2,
      configured: 2,
      upcoming: 2,
    }),
  );

  assert.deepEqual(urgency, {
    level: 'OK',
    label: 'Maintenance up to date',
    count: 2,
    needsAttention: false,
  });
});

test('returns NOT_CONFIGURED for enabled schedules without deadlines', () => {
  const urgency = getMaintenanceUrgency(
    makeOverview({
      total: 2,
      enabled: 2,
      unconfigured: 2,
    }),
  );

  assert.deepEqual(urgency, {
    level: 'NOT_CONFIGURED',
    label: 'Maintenance not configured',
    count: 2,
    needsAttention: false,
  });
});

test('returns DISABLED when all schedules are disabled', () => {
  const urgency = getMaintenanceUrgency(
    makeOverview({
      total: 3,
      disabled: 3,
    }),
  );

  assert.deepEqual(urgency, {
    level: 'DISABLED',
    label: 'Maintenance reminders disabled',
    count: 3,
    needsAttention: false,
  });
});

test('prioritizes configured maintenance over unconfigured', () => {
  const urgency = getMaintenanceUrgency(
    makeOverview({
      total: 2,
      enabled: 2,
      configured: 1,
      unconfigured: 1,
      upcoming: 1,
    }),
  );

  assert.equal(urgency.level, 'OK');
  assert.equal(urgency.needsAttention, false);
});

test('disabled schedules do not generate warnings', () => {
  const urgency = getMaintenanceUrgency(
    makeOverview({
      total: 2,
      enabled: 1,
      disabled: 1,
      unconfigured: 1,
    }),
  );

  assert.equal(urgency.level, 'NOT_CONFIGURED');
  assert.equal(urgency.needsAttention, false);
});

test('does not mutate the overview', () => {
  const overview = makeOverview({
    total: 1,
    enabled: 1,
    configured: 1,
    overdue: 1,
  });

  const originalCounts = { ...overview.counts };

  getMaintenanceUrgency(overview);

  assert.deepEqual(
    overview.counts,
    originalCounts,
  );
});
