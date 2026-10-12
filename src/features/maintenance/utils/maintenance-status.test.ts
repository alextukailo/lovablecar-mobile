/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { ApiMaintenanceSchedule } from '../../../../lib/maintenance.api';
import { calculateMaintenanceStatus } from './maintenance-status';

const NOW = new Date('2026-10-12T12:00:00.000Z');
const CURRENT_MILEAGE = 128_500;

function makeSchedule(
  overrides: Partial<ApiMaintenanceSchedule> = {},
): ApiMaintenanceSchedule {
  return {
    id: 'test-schedule',
    carId: 'test-car',
    type: 'ENGINE_OIL',
    customTitle: null,
    enabled: true,
    intervalKm: 15_000,
    intervalMonths: 12,
    lastServiceMileage: null,
    lastServiceDate: null,
    nextDueMileage: null,
    nextDueDate: null,
    warningKm: 1_000,
    warningDays: 30,
    notes: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('calculateMaintenanceStatus', () => {
  it('returns DISABLED for a disabled schedule', () => {
    const result = calculateMaintenanceStatus(
      makeSchedule({
        enabled: false,
        nextDueMileage: 120_000,
      }),
      CURRENT_MILEAGE,
      NOW,
    );

    assert.equal(result.status, 'DISABLED');
    assert.equal(result.label, 'Disabled');
  });

  it('returns NOT_CONFIGURED without a due date or mileage', () => {
    const result = calculateMaintenanceStatus(
      makeSchedule(),
      CURRENT_MILEAGE,
      NOW,
    );

    assert.equal(result.status, 'NOT_CONFIGURED');
    assert.equal(result.remainingKm, null);
    assert.equal(result.remainingDays, null);
  });

  it('returns UPCOMING outside both warning windows', () => {
    const result = calculateMaintenanceStatus(
      makeSchedule({
        nextDueMileage: 135_000,
        nextDueDate: '2027-01-12T00:00:00.000Z',
      }),
      CURRENT_MILEAGE,
      NOW,
    );

    assert.equal(result.status, 'UPCOMING');
    assert.equal(result.remainingKm, 6_500);
  });

  it('returns DUE_SOON inside the mileage warning window', () => {
    const result = calculateMaintenanceStatus(
      makeSchedule({
        nextDueMileage: 129_000,
      }),
      CURRENT_MILEAGE,
      NOW,
    );

    assert.equal(result.status, 'DUE_SOON');
    assert.equal(result.remainingKm, 500);
  });

  it('returns DUE_SOON inside the date warning window', () => {
    const result = calculateMaintenanceStatus(
      makeSchedule({
        nextDueDate: '2026-10-22T00:00:00.000Z',
      }),
      CURRENT_MILEAGE,
      NOW,
    );

    assert.equal(result.status, 'DUE_SOON');
    assert.equal(result.remainingDays, 10);
  });

  it('returns OVERDUE when mileage reaches the limit', () => {
    const result = calculateMaintenanceStatus(
      makeSchedule({
        nextDueMileage: 128_500,
      }),
      CURRENT_MILEAGE,
      NOW,
    );

    assert.equal(result.status, 'OVERDUE');
    assert.equal(result.remainingKm, 0);
  });

  it('returns OVERDUE when the due date is today', () => {
    const result = calculateMaintenanceStatus(
      makeSchedule({
        nextDueDate: '2026-10-12T00:00:00.000Z',
      }),
      CURRENT_MILEAGE,
      NOW,
    );

    assert.equal(result.status, 'OVERDUE');
    assert.equal(result.remainingDays, 0);
  });

  it('uses the more urgent status when mileage and date disagree', () => {
    const result = calculateMaintenanceStatus(
      makeSchedule({
        nextDueMileage: 128_000,
        nextDueDate: '2027-06-01T00:00:00.000Z',
      }),
      CURRENT_MILEAGE,
      NOW,
    );

    assert.equal(result.status, 'OVERDUE');
    assert.equal(result.remainingKm, -500);
  });

  it('does not mutate the schedule', () => {
    const schedule = makeSchedule({
      nextDueMileage: 129_000,
    });

    const original = { ...schedule };

    calculateMaintenanceStatus(
      schedule,
      CURRENT_MILEAGE,
      NOW,
    );

    assert.deepEqual(schedule, original);
  });
});
