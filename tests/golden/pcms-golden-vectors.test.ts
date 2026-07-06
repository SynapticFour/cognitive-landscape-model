import { describe, expect, it } from 'vitest';
import { unitInterval } from '@clm/core';
import {
  createLandscapeSnapshot,
  createPcmsStateSpace,
  NEUTRAL_PCMS_PROFILE,
  PCMS_DIMENSION_KEYS,
  ZERO_PCMS_CONFIDENCE,
} from '@clm/landscape';

describe('PCMS golden vectors', () => {
  it('matches neutral profile and zero-confidence reference vectors', () => {
    for (const key of PCMS_DIMENSION_KEYS) {
      expect(NEUTRAL_PCMS_PROFILE[key]).toBe(unitInterval(0.5));
      expect(ZERO_PCMS_CONFIDENCE[key]).toBe(unitInterval(0));
    }
  });

  it('produces stable neutral snapshot provenance and coordinates', () => {
    const snapshot = createLandscapeSnapshot({
      snapshotId: 'golden-neutral',
      createdAt: '2026-07-06T00:00:00.000Z',
      profile: NEUTRAL_PCMS_PROFILE,
      confidence: ZERO_PCMS_CONFIDENCE,
      questionsAnswered: 0,
    });

    expect(snapshot).toMatchObject({
      snapshotId: 'golden-neutral',
      questionsAnswered: 0,
      provenance: {
        layer: 'landscape',
        instrumentId: 'pcms',
        version: '0.1.0',
        createdAt: '2026-07-06T00:00:00.000Z',
      },
      profile: Object.fromEntries(PCMS_DIMENSION_KEYS.map((key) => [key, 0.5])),
      confidence: Object.fromEntries(PCMS_DIMENSION_KEYS.map((key) => [key, 0])),
    });
  });

  it('manufactures unit-interval PCMS cognitive states from the preset space', () => {
    const space = createPcmsStateSpace();
    const state = space.createState({
      stateId: 'golden-state',
      observedAt: '2026-07-06T00:00:00.000Z',
      coordinates: NEUTRAL_PCMS_PROFILE,
      normalized: true,
    });

    expect(state.dimensionIds()).toEqual([...PCMS_DIMENSION_KEYS]);
    expect(state.coordinate('F')).toBe(0.5);
    expect(state.coordinate('V')).toBe(0.5);
  });
});
