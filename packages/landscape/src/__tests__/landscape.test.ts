import { describe, expect, it } from 'vitest';
import { unitInterval } from '@clm/core';

import {
  createLandscapeSnapshot,
  landscapeSnapshotFromPcmsPipeline,
  minConfidence,
  NEUTRAL_PCMS_PROFILE,
  PCMS_DIMENSION_KEYS,
  ZERO_PCMS_CONFIDENCE,
} from '../index.js';

describe('@clm/landscape PCMS prototype', () => {
  it('creates a neutral landscape snapshot', () => {
    const snapshot = createLandscapeSnapshot({
      snapshotId: 'ls-neutral',
      createdAt: '2026-07-06T12:00:00.000Z',
      profile: NEUTRAL_PCMS_PROFILE,
      confidence: ZERO_PCMS_CONFIDENCE,
      questionsAnswered: 0,
    });

    expect(snapshot.provenance.layer).toBe('landscape');
    expect(snapshot.provenance.instrumentId).toBe('pcms');
    expect(PCMS_DIMENSION_KEYS.every((k) => snapshot.profile[k] === 0.5)).toBe(true);
  });

  it('adapts PCMS pipeline percent output to unit-interval vectors', () => {
    const scores = Object.fromEntries(PCMS_DIMENSION_KEYS.map((k) => [k, 50]));
    const confidence = Object.fromEntries(PCMS_DIMENSION_KEYS.map((k) => [k, 75]));

    const snapshot = landscapeSnapshotFromPcmsPipeline({
      sessionId: 'sess-1',
      snapshotId: 'ls-1',
      createdAt: '2026-07-06T12:00:00.000Z',
      routingScoresPercent: scores,
      routingConfidencePercent: confidence,
      questionsAnswered: 12,
    });

    expect(snapshot.profile.F).toBe(0.5);
    expect(snapshot.confidence.F).toBe(0.75);
    expect(snapshot.questionsAnswered).toBe(12);
  });

  it('computes minimum confidence across axes', () => {
    const confidence = Object.fromEntries(
      PCMS_DIMENSION_KEYS.map((key) => [key, unitInterval(key === 'P' ? 0.3 : 0.9)])
    ) as typeof ZERO_PCMS_CONFIDENCE;

    const snapshot = createLandscapeSnapshot({
      snapshotId: 'ls-min',
      createdAt: '2026-07-06T12:00:00.000Z',
      profile: NEUTRAL_PCMS_PROFILE,
      confidence,
      questionsAnswered: 5,
    });

    expect(minConfidence(snapshot)).toBe(0.3);
  });
});
