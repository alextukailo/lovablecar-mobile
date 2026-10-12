
/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';

import type {
    CalculatedMaintenanceStatus,
} from './maintenance-status';

import type {
    MaintenanceUrgencyLevel,
} from './maintenance-urgency';

import {
    getMaintenanceStatusColors,
    getMaintenanceUrgencyColors,
    MAINTENANCE_COLORS,
} from './maintenance-theme';

test('maps overdue schedule status to red', () => {
  assert.deepEqual(
    getMaintenanceStatusColors('OVERDUE'),
    MAINTENANCE_COLORS.overdue,
  );
});

test('maps due-soon schedule status to amber', () => {
  assert.deepEqual(
    getMaintenanceStatusColors('DUE_SOON'),
    MAINTENANCE_COLORS.dueSoon,
  );
});

test('maps upcoming schedule status to green', () => {
  assert.deepEqual(
    getMaintenanceStatusColors('UPCOMING'),
    MAINTENANCE_COLORS.ok,
  );
});

test('maps unconfigured and disabled schedules to neutral', () => {
  const statuses: CalculatedMaintenanceStatus[] = [
    'NOT_CONFIGURED',
    'DISABLED',
  ];

  for (const status of statuses) {
    assert.deepEqual(
      getMaintenanceStatusColors(status),
      MAINTENANCE_COLORS.neutral,
    );
  }
});

test('maps overdue vehicle urgency to red', () => {
  assert.deepEqual(
    getMaintenanceUrgencyColors('OVERDUE'),
    MAINTENANCE_COLORS.overdue,
  );
});

test('maps due-soon vehicle urgency to amber', () => {
  assert.deepEqual(
    getMaintenanceUrgencyColors('DUE_SOON'),
    MAINTENANCE_COLORS.dueSoon,
  );
});

test('maps OK vehicle urgency to green', () => {
  assert.deepEqual(
    getMaintenanceUrgencyColors('OK'),
    MAINTENANCE_COLORS.ok,
  );
});

test('maps inactive vehicle urgency levels to neutral', () => {
  const levels: MaintenanceUrgencyLevel[] = [
    'NOT_CONFIGURED',
    'DISABLED',
    'EMPTY',
  ];

  for (const level of levels) {
    assert.deepEqual(
      getMaintenanceUrgencyColors(level),
      MAINTENANCE_COLORS.neutral,
    );
  }
});

test('every palette entry has valid hexadecimal colors', () => {
  for (const colors of Object.values(MAINTENANCE_COLORS)) {
    for (const value of Object.values(colors)) {
      assert.match(value, /^#[0-9A-Fa-f]{6}$/);
    }
  }
});

test('each urgency category uses distinct text colors', () => {
  const colors = [
    MAINTENANCE_COLORS.overdue.text,
    MAINTENANCE_COLORS.dueSoon.text,
    MAINTENANCE_COLORS.ok.text,
    MAINTENANCE_COLORS.neutral.text,
  ];

  assert.equal(new Set(colors).size, colors.length);
});

test('schedule and vehicle urgency use the same warning colors', () => {
  assert.deepEqual(
    getMaintenanceStatusColors('OVERDUE'),
    getMaintenanceUrgencyColors('OVERDUE'),
  );

  assert.deepEqual(
    getMaintenanceStatusColors('DUE_SOON'),
    getMaintenanceUrgencyColors('DUE_SOON'),
  );

  assert.deepEqual(
    getMaintenanceStatusColors('UPCOMING'),
    getMaintenanceUrgencyColors('OK'),
  );
});
