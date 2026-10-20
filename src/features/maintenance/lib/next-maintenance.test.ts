
/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';

import type {
    ApiMaintenanceSchedule,
} from '@/../lib/maintenance.api';

import {
    findNextMaintenance,
} from '@/features/maintenance/lib/next-maintenance';

type ScheduleOverrides = Partial<ApiMaintenanceSchedule>;

function makeSchedule(
  id: string,
  overrides: ScheduleOverrides = {},
): ApiMaintenanceSchedule {
  return {
    id,
    carId: 'test-car',
    type: 'ENGINE_OIL',
    customTitle: null,
    enabled: true,
    intervalKm: 15000,
    intervalMonths: 12,
    lastServiceMileage: 100000,
    lastServiceDate: '2026-01-01T00:00:00.000Z',
    nextDueMileage: 115000,
    nextDueDate: null,
    warningKm: 1000,
    warningDays: 30,
    notes: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const NOW = new Date('2026-10-12T12:00:00.000Z');
const CURRENT_MILEAGE = 114000;

test(
  'returns null when no schedules exist',
  () => {
    const result = findNextMaintenance(
      [],
      CURRENT_MILEAGE,
      NOW,
    );

    assert.equal(result, null);
  },
);

test(
  'ignores disabled schedules',
  () => {
    const disabled = makeSchedule(
      'disabled',
      {
        enabled: false,
        nextDueMileage: 110000,
      },
    );

    const result = findNextMaintenance(
      [disabled],
      CURRENT_MILEAGE,
      NOW,
    );

    assert.equal(result, null);
  },
);

test(
  'ignores unconfigured schedules',
  () => {
    const unconfigured = makeSchedule(
      'unconfigured',
      {
        nextDueMileage: null,
        nextDueDate: null,
      },
    );

    const result = findNextMaintenance(
      [unconfigured],
      CURRENT_MILEAGE,
      NOW,
    );

    assert.equal(result, null);
  },
);

test(
  'returns the only configured schedule',
  () => {
    const schedule = makeSchedule('oil');

    const result = findNextMaintenance(
      [schedule],
      CURRENT_MILEAGE,
      NOW,
    );

    assert.equal(
      result?.schedule.id,
      'oil',
    );

    assert.equal(
      result?.result.status,
      'DUE_SOON',
    );
  },
);

test(
  'prioritizes overdue over due soon',
  () => {
    const dueSoon = makeSchedule(
      'due-soon',
      {
        nextDueMileage: 114500,
      },
    );

    const overdue = makeSchedule(
      'overdue',
      {
        nextDueMileage: 113000,
      },
    );

    const result = findNextMaintenance(
      [dueSoon, overdue],
      CURRENT_MILEAGE,
      NOW,
    );

    assert.equal(
      result?.schedule.id,
      'overdue',
    );
  },
);

test(
  'prioritizes due soon over upcoming',
  () => {
    const upcoming = makeSchedule(
      'upcoming',
      {
        nextDueMileage: 120000,
      },
    );

    const dueSoon = makeSchedule(
      'due-soon',
      {
        nextDueMileage: 114500,
      },
    );

    const result = findNextMaintenance(
      [upcoming, dueSoon],
      CURRENT_MILEAGE,
      NOW,
    );

    assert.equal(
      result?.schedule.id,
      'due-soon',
    );
  },
);

test(
  'prioritizes the more urgent mileage deadline',
  () => {
    const lessUrgent = makeSchedule(
      'less-urgent',
      {
        nextDueMileage: 114900,
        warningKm: 1000,
      },
    );

    const moreUrgent = makeSchedule(
      'more-urgent',
      {
        nextDueMileage: 114200,
        warningKm: 1000,
      },
    );

    const result = findNextMaintenance(
      [lessUrgent, moreUrgent],
      CURRENT_MILEAGE,
      NOW,
    );

    assert.equal(
      result?.schedule.id,
      'more-urgent',
    );
  },
);

test(
  'compares date and mileage urgency',
  () => {
    const mileageSchedule = makeSchedule(
      'mileage',
      {
        nextDueMileage: 114800,
        nextDueDate: null,
        warningKm: 1000,
      },
    );

    const dateSchedule = makeSchedule(
      'date',
      {
        nextDueMileage: null,
        nextDueDate: '2026-10-17T00:00:00.000Z',
        warningDays: 30,
      },
    );

    const result = findNextMaintenance(
      [mileageSchedule, dateSchedule],
      CURRENT_MILEAGE,
      NOW,
    );

    // Mileage: 800 / 1000 = 0.8
    // Date: 5 / 30 = ~0.167
    // Date is closer to its warning threshold.
    assert.equal(
      result?.schedule.id,
      'date',
    );
  },
);

test(
  'handles a date-only schedule',
  () => {
    const schedule = makeSchedule(
      'date-only',
      {
        nextDueMileage: null,
        nextDueDate: '2026-10-20T00:00:00.000Z',
      },
    );

    const result = findNextMaintenance(
      [schedule],
      CURRENT_MILEAGE,
      NOW,
    );

    assert.equal(
      result?.schedule.id,
      'date-only',
    );

    assert.equal(
      result?.result.remainingDays,
      8,
    );
  },
);

test(
  'uses schedule ID to break exact ties',
  () => {
    const scheduleB = makeSchedule(
      'b-schedule',
      {
        nextDueMileage: 114500,
      },
    );

    const scheduleA = makeSchedule(
      'a-schedule',
      {
        nextDueMileage: 114500,
      },
    );

    const result = findNextMaintenance(
      [scheduleB, scheduleA],
      CURRENT_MILEAGE,
      NOW,
    );

    assert.equal(
      result?.schedule.id,
      'a-schedule',
    );
  },
);

test(
  'does not mutate the input array',
  () => {
    const first = makeSchedule(
      'first',
      {
        nextDueMileage: 120000,
      },
    );

    const second = makeSchedule(
      'second',
      {
        nextDueMileage: 113000,
      },
    );

    const schedules = [first, second];

    const originalOrder = schedules.map(
      (schedule) => schedule.id,
    );

    findNextMaintenance(
      schedules,
      CURRENT_MILEAGE,
      NOW,
    );

    assert.deepEqual(
      schedules.map(
        (schedule) => schedule.id,
      ),
      originalOrder,
    );
  },
);

test(
  'returns the same result regardless of input order',
  () => {
    const schedules = [
      makeSchedule('upcoming', {
        nextDueMileage: 120000,
      }),
      makeSchedule('overdue', {
        nextDueMileage: 113000,
      }),
      makeSchedule('due-soon', {
        nextDueMileage: 114500,
      }),
    ];

    const forward = findNextMaintenance(
      schedules,
      CURRENT_MILEAGE,
      NOW,
    );

    const reversed = findNextMaintenance(
      [...schedules].reverse(),
      CURRENT_MILEAGE,
      NOW,
    );

    assert.equal(
      forward?.schedule.id,
      'overdue',
    );

    assert.equal(
      reversed?.schedule.id,
      'overdue',
    );
  },
);
