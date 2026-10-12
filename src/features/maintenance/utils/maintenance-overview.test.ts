
/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';

import type {
    ApiMaintenanceSchedule,
} from '../../../../lib/maintenance.api';

import {
    calculateMaintenanceOverview,
    getMaintenanceOverviewLabel,
    hasMaintenanceWarnings,
} from './maintenance-overview';

const NOW = new Date('2026-10-12T12:00:00.000Z');
const MILEAGE = 128500;

function makeSchedule(
  id: string,
  overrides: Partial<ApiMaintenanceSchedule> = {},
): ApiMaintenanceSchedule {
  return {
    id,
    carId: 'test-car',
    type: 'ENGINE_OIL',
    customTitle: null,
    enabled: true,
    intervalKm: 15000,
    intervalMonths: 12,
    lastServiceMileage: null,
    lastServiceDate: null,
    nextDueMileage: null,
    nextDueDate: null,
    warningKm: 1000,
    warningDays: 30,
    notes: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

test('returns zero counts for an empty list', () => {
  const overview = calculateMaintenanceOverview(
    [],
    MILEAGE,
    NOW,
  );

  assert.deepEqual(overview.counts, {
    total: 0,
    enabled: 0,
    disabled: 0,
    configured: 0,
    unconfigured: 0,
    overdue: 0,
    dueSoon: 0,
    upcoming: 0,
  });

  assert.deepEqual(overview.items, []);
  assert.equal(hasMaintenanceWarnings(overview), false);
  assert.equal(
    getMaintenanceOverviewLabel(overview),
    'No maintenance schedules',
  );
});

test('counts disabled schedules separately', () => {
  const overview = calculateMaintenanceOverview(
    [
      makeSchedule('disabled', {
        enabled: false,
        nextDueMileage: 120000,
      }),
    ],
    MILEAGE,
    NOW,
  );

  assert.equal(overview.counts.total, 1);
  assert.equal(overview.counts.enabled, 0);
  assert.equal(overview.counts.disabled, 1);
  assert.equal(overview.counts.overdue, 0);
  assert.equal(hasMaintenanceWarnings(overview), false);
  assert.equal(
    getMaintenanceOverviewLabel(overview),
    'Maintenance reminders disabled',
  );
});

test('counts enabled schedules without due dates as unconfigured', () => {
  const overview = calculateMaintenanceOverview(
    [
      makeSchedule('unconfigured'),
    ],
    MILEAGE,
    NOW,
  );

  assert.equal(overview.counts.enabled, 1);
  assert.equal(overview.counts.configured, 0);
  assert.equal(overview.counts.unconfigured, 1);
  assert.equal(
    getMaintenanceOverviewLabel(overview),
    'Maintenance not configured',
  );
});

test('counts overdue schedules', () => {
  const overview = calculateMaintenanceOverview(
    [
      makeSchedule('overdue', {
        nextDueMileage: 128000,
      }),
    ],
    MILEAGE,
    NOW,
  );

  assert.equal(overview.counts.overdue, 1);
  assert.equal(overview.counts.configured, 1);
  assert.equal(hasMaintenanceWarnings(overview), true);
  assert.equal(
    getMaintenanceOverviewLabel(overview),
    '1 overdue service',
  );
});

test('counts due-soon schedules', () => {
  const overview = calculateMaintenanceOverview(
    [
      makeSchedule('due-soon', {
        nextDueMileage: 129000,
      }),
    ],
    MILEAGE,
    NOW,
  );

  assert.equal(overview.counts.dueSoon, 1);
  assert.equal(hasMaintenanceWarnings(overview), true);
  assert.equal(
    getMaintenanceOverviewLabel(overview),
    '1 service due soon',
  );
});

test('counts upcoming schedules', () => {
  const overview = calculateMaintenanceOverview(
    [
      makeSchedule('upcoming', {
        nextDueMileage: 145000,
      }),
    ],
    MILEAGE,
    NOW,
  );

  assert.equal(overview.counts.upcoming, 1);
  assert.equal(overview.counts.configured, 1);
  assert.equal(hasMaintenanceWarnings(overview), false);
  assert.equal(
    getMaintenanceOverviewLabel(overview),
    'Maintenance up to date',
  );
});

test('counts a mixture of maintenance statuses', () => {
  const schedules = [
    makeSchedule('overdue', {
      nextDueMileage: 127000,
    }),
    makeSchedule('due-soon', {
      nextDueMileage: 129000,
    }),
    makeSchedule('upcoming', {
      nextDueMileage: 145000,
    }),
    makeSchedule('unconfigured'),
    makeSchedule('disabled', {
      enabled: false,
      nextDueMileage: 120000,
    }),
  ];

  const overview = calculateMaintenanceOverview(
    schedules,
    MILEAGE,
    NOW,
  );

  assert.deepEqual(overview.counts, {
    total: 5,
    enabled: 4,
    disabled: 1,
    configured: 3,
    unconfigured: 1,
    overdue: 1,
    dueSoon: 1,
    upcoming: 1,
  });

  assert.equal(overview.items.length, 5);
  assert.equal(hasMaintenanceWarnings(overview), true);
});

test('overdue takes priority in the summary label', () => {
  const overview = calculateMaintenanceOverview(
    [
      makeSchedule('due-soon', {
        nextDueMileage: 129000,
      }),
      makeSchedule('overdue-1', {
        nextDueMileage: 127000,
      }),
      makeSchedule('overdue-2', {
        nextDueMileage: 126000,
      }),
    ],
    MILEAGE,
    NOW,
  );

  assert.equal(
    getMaintenanceOverviewLabel(overview),
    '2 overdue services',
  );
});

test('due soon takes priority over upcoming', () => {
  const overview = calculateMaintenanceOverview(
    [
      makeSchedule('upcoming', {
        nextDueMileage: 145000,
      }),
      makeSchedule('due-soon-1', {
        nextDueMileage: 129000,
      }),
      makeSchedule('due-soon-2', {
        nextDueMileage: 129200,
      }),
    ],
    MILEAGE,
    NOW,
  );

  assert.equal(
    getMaintenanceOverviewLabel(overview),
    '2 services due soon',
  );
});

test('evaluates calendar deadlines', () => {
  const overview = calculateMaintenanceOverview(
    [
      makeSchedule('date-overdue', {
        nextDueMileage: null,
        nextDueDate: '2026-10-10T00:00:00.000Z',
      }),
      makeSchedule('date-due-soon', {
        nextDueMileage: null,
        nextDueDate: '2026-10-20T00:00:00.000Z',
      }),
    ],
    MILEAGE,
    NOW,
  );

  assert.equal(overview.counts.overdue, 1);
  assert.equal(overview.counts.dueSoon, 1);
});

test('preserves the input schedule order', () => {
  const schedules = [
    makeSchedule('third', {
      nextDueMileage: 145000,
    }),
    makeSchedule('first', {
      nextDueMileage: 127000,
    }),
    makeSchedule('second', {
      nextDueMileage: 129000,
    }),
  ];

  const overview = calculateMaintenanceOverview(
    schedules,
    MILEAGE,
    NOW,
  );

  assert.deepEqual(
    overview.items.map((item) => item.schedule.id),
    ['third', 'first', 'second'],
  );

  assert.deepEqual(
    schedules.map((schedule) => schedule.id),
    ['third', 'first', 'second'],
  );
});
