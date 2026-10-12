
/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';

import type {
    ApiMaintenanceSchedule,
} from '../../../../lib/maintenance.api';

import type {
    MaintenanceStatusResult,
} from './maintenance-status';

import {
    formatMaintenanceDeadline,
    formatMaintenanceKm,
    formatRemainingDays,
    formatRemainingKm,
    getMaintenanceName,
    getMaintenanceStatusLabel,
} from './maintenance-display';

function makeSchedule(
  overrides: Partial<ApiMaintenanceSchedule> = {},
): ApiMaintenanceSchedule {
  return {
    id: 'test-schedule',
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

function makeStatus(
  overrides: Partial<MaintenanceStatusResult> = {},
): MaintenanceStatusResult {
  return {
    status: 'UPCOMING',
    remainingKm: null,
    remainingDays: null,
    label: 'Upcoming',
    ...overrides,
  };
}

test('formats standard maintenance names', () => {
  assert.equal(
    getMaintenanceName(makeSchedule()),
    'Engine oil',
  );

  assert.equal(
    getMaintenanceName(
      makeSchedule({ type: 'TRANSMISSION_OIL' }),
    ),
    'Transmission oil',
  );

  assert.equal(
    getMaintenanceName(
      makeSchedule({ type: 'BRAKE_FLUID' }),
    ),
    'Brake fluid',
  );

  assert.equal(
    getMaintenanceName(
      makeSchedule({ type: 'HALDEX_OIL' }),
    ),
    'Haldex oil',
  );
});

test('uses the saved custom maintenance title', () => {
  assert.equal(
    getMaintenanceName(
      makeSchedule({
        type: 'CUSTOM',
        customTitle: 'Timing belt',
      }),
    ),
    'Timing belt',
  );
});

test('uses a fallback for an empty custom title', () => {
  assert.equal(
    getMaintenanceName(
      makeSchedule({
        type: 'CUSTOM',
        customTitle: '   ',
      }),
    ),
    'Custom maintenance',
  );
});

test('formats kilometers consistently', () => {
  assert.equal(
    formatMaintenanceKm(15000),
    '15,000 km',
  );

  assert.equal(
    formatMaintenanceKm(1250.6),
    '1,251 km',
  );
});

test('formats remaining mileage', () => {
  assert.equal(
    formatRemainingKm(850),
    '850 km remaining',
  );

  assert.equal(
    formatRemainingKm(0),
    'Mileage due now',
  );

  assert.equal(
    formatRemainingKm(-1250),
    '1,250 km overdue',
  );
});

test('handles unavailable mileage', () => {
  assert.equal(formatRemainingKm(null), null);
  assert.equal(formatRemainingKm(NaN), null);
  assert.equal(formatRemainingKm(Infinity), null);
});

test('formats remaining days', () => {
  assert.equal(
    formatRemainingDays(1),
    '1 day remaining',
  );

  assert.equal(
    formatRemainingDays(12),
    '12 days remaining',
  );

  assert.equal(
    formatRemainingDays(0),
    'Date due today',
  );
});

test('formats overdue days', () => {
  assert.equal(
    formatRemainingDays(-1),
    '1 day overdue',
  );

  assert.equal(
    formatRemainingDays(-5),
    '5 days overdue',
  );
});

test('handles unavailable days', () => {
  assert.equal(formatRemainingDays(null), null);
  assert.equal(formatRemainingDays(NaN), null);
  assert.equal(formatRemainingDays(Infinity), null);
});

test('combines mileage and date deadlines', () => {
  const result = makeStatus({
    status: 'DUE_SOON',
    remainingKm: 850,
    remainingDays: 12,
    label: 'Due soon',
  });

  assert.equal(
    formatMaintenanceDeadline(result),
    '850 km remaining · 12 days remaining',
  );
});

test('supports mileage-only deadlines', () => {
  const result = makeStatus({
    remainingKm: 2500,
  });

  assert.equal(
    formatMaintenanceDeadline(result),
    '2,500 km remaining',
  );
});

test('supports date-only deadlines', () => {
  const result = makeStatus({
    remainingDays: 7,
  });

  assert.equal(
    formatMaintenanceDeadline(result),
    '7 days remaining',
  );
});

test('handles unconfigured deadlines', () => {
  const result = makeStatus({
    status: 'NOT_CONFIGURED',
    label: 'Not configured',
  });

  assert.equal(
    formatMaintenanceDeadline(result),
    'No due date configured',
  );
});

test('formats maintenance status labels', () => {
  const statuses: Array<{
    status: MaintenanceStatusResult['status'];
    expected: string;
  }> = [
    { status: 'OVERDUE', expected: 'Overdue' },
    { status: 'DUE_SOON', expected: 'Due soon' },
    { status: 'UPCOMING', expected: 'Upcoming' },
    {
      status: 'NOT_CONFIGURED',
      expected: 'Not configured',
    },
    { status: 'DISABLED', expected: 'Disabled' },
  ];

  for (const item of statuses) {
    assert.equal(
      getMaintenanceStatusLabel(
        makeStatus({
          status: item.status,
          label: 'Placeholder',
        }),
      ),
      item.expected,
    );
  }
});
