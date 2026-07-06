import { describe, expect, it } from 'vitest';
import { createLandscapeSnapshot, NEUTRAL_PCMS_PROFILE, PCMS_DIMENSION_KEYS, ZERO_PCMS_CONFIDENCE } from '@clm/landscape';
import { unitInterval } from '@clm/core';

import { appendObservation, createDynamicsSnapshot, estimateVelocities } from '../index.js';

describe('@clm/dynamics legacy observation path', () => {
  it('estimates velocities from consecutive landscape observations', () => {
    const base = createLandscapeSnapshot({
      snapshotId: 'ls-1',
      createdAt: '2026-07-06T10:00:00.000Z',
      profile: NEUTRAL_PCMS_PROFILE,
      confidence: ZERO_PCMS_CONFIDENCE,
      questionsAnswered: 10,
    });

    const shifted = createLandscapeSnapshot({
      snapshotId: 'ls-2',
      createdAt: '2026-07-06T11:00:00.000Z',
      profile: { ...NEUTRAL_PCMS_PROFILE, F: unitInterval(0.8) },
      confidence: ZERO_PCMS_CONFIDENCE,
      questionsAnswered: 10,
    });

    const trajectory = appendObservation(
      { trajectoryId: 'tr-1', subjectId: 'sub-1', observations: [] },
      {
        observedAt: base.provenance.createdAt,
        landscapeSnapshotId: base.snapshotId,
        profile: base.profile,
      }
    );

    const withSecond = appendObservation(trajectory, {
      observedAt: shifted.provenance.createdAt,
      landscapeSnapshotId: shifted.snapshotId,
      profile: shifted.profile,
    });

    const velocities = estimateVelocities(withSecond, PCMS_DIMENSION_KEYS);
    expect(velocities.F).toBeCloseTo(0.3, 5);
    expect(velocities.P).toBe(0);
  });

  it('creates a dynamics snapshot with provenance', () => {
    const trajectory = {
      trajectoryId: 'tr-1',
      subjectId: 'sub-1',
      observations: [
        {
          observedAt: '2026-07-06T10:00:00.000Z',
          landscapeSnapshotId: 'ls-1',
          profile: NEUTRAL_PCMS_PROFILE,
        },
      ],
    };

    const snapshot = createDynamicsSnapshot({
      snapshotId: 'dyn-1',
      createdAt: '2026-07-06T12:00:00.000Z',
      trajectory,
      dimensionIds: PCMS_DIMENSION_KEYS,
    });

    expect(snapshot.provenance.layer).toBe('dynamics');
    expect(snapshot.trajectoryId).toBe('tr-1');
  });
});
