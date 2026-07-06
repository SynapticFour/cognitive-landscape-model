import { describe, expect, it } from 'vitest';
import { unitInterval } from '@clm/core';

import {
  createIdentityPrior,
  createStructuralSnapshot,
  defaultWideConstraint,
} from '../index.js';

describe('@clm/structural', () => {
  it('builds an identity covariance prior', () => {
    const prior = createIdentityPrior(['F', 'P'], 'prior-1');
    expect(prior.covariance).toEqual([
      [1, 0],
      [0, 1],
    ]);
  });

  it('creates a structural snapshot with provenance', () => {
    const prior = createIdentityPrior(['F', 'P'], 'prior-1');
    const snapshot = createStructuralSnapshot({
      snapshotId: 'st-1',
      createdAt: '2026-07-06T12:00:00.000Z',
      prior,
      constraints: {
        constraintSetId: 'cs-1',
        constraints: [defaultWideConstraint('F'), defaultWideConstraint('P')],
      },
      developmental: {
        profileId: 'dev-1',
        parameters: [
          {
            parameterId: 'plasticity',
            label: 'plasticity-index',
            value: unitInterval(0.5),
            timescale: 'long',
          },
        ],
      },
    });

    expect(snapshot.provenance.layer).toBe('structural');
    expect(snapshot.prior.priorId).toBe('prior-1');
  });
});
