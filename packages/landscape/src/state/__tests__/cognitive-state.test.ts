import { describe, expect, it } from 'vitest';

import {
  CognitiveState,
  StateSpace,
  createCustomStateSpace,
  createPcmsStateSpace,
  deserializeTrajectory,
  fullRangeUncertainty,
  normalizeValue,
  serializeTrajectory,
  trajectoryFromJson,
  trajectoryToJson,
  uncertaintyFromHalfWidth,
} from '../index.js';

describe('CognitiveState vector representation', () => {
  const customSpace = createCustomStateSpace({
    spaceId: 'demo-space',
    instrumentId: 'demo-instrument',
    version: '1.0.0',
    dimensions: [
      {
        id: 'alpha',
        constructId: 'construct-alpha',
        normalization: { inputMin: 0, inputMax: 10, outputMin: 0, outputMax: 1 },
        lowPole: 'low-alpha',
        highPole: 'high-alpha',
      },
      {
        id: 'beta',
        constructId: 'construct-beta',
        normalization: { inputMin: -1, inputMax: 1, outputMin: 0, outputMax: 1 },
      },
    ],
  });

  it('normalizes raw coordinates into continuous space', () => {
    const state = customSpace.createState({
      stateId: 't0',
      observedAt: '2026-07-06T10:00:00.000Z',
      coordinates: { alpha: 5, beta: 0 },
    });

    expect(state.coordinate('alpha')).toBe(0.5);
    expect(state.coordinate('beta')).toBe(0.5);
    expect(state.toVector()).toEqual([0.5, 0.5]);
  });

  it('stores per-dimension uncertainty ranges', () => {
    const state = customSpace.createState({
      stateId: 't1',
      observedAt: '2026-07-06T11:00:00.000Z',
      coordinates: { alpha: 8, beta: 0.5 },
      uncertainty: {
        alpha: uncertaintyFromHalfWidth(0.8, 0.1, 0, 1),
        beta: fullRangeUncertainty(0, 1),
      },
    });

    expect(state.uncertainty('alpha').estimate).toBe(0.8);
    expect(state.uncertainty('alpha').lower).toBeCloseTo(0.7, 10);
    expect(state.uncertainty('alpha').upper).toBe(0.9);
    expect(state.uncertainty('beta').lower).toBe(0);
    expect(state.uncertainty('beta').upper).toBe(1);
  });

  it('orders temporal snapshots within a StateSpace container', () => {
    customSpace.clearStates();
    customSpace.createState({
      stateId: 's2',
      observedAt: '2026-07-06T12:00:00.000Z',
      coordinates: { alpha: 2, beta: -1 },
    });
    customSpace.createState({
      stateId: 's0',
      observedAt: '2026-07-06T10:00:00.000Z',
      coordinates: { alpha: 0, beta: 1 },
    });
    customSpace.createState({
      stateId: 's1',
      observedAt: '2026-07-06T11:00:00.000Z',
      coordinates: { alpha: 10, beta: 0 },
    });

    const ordered = customSpace.orderedSnapshots();
    expect(ordered.map((state) => state.stateId)).toEqual(['s0', 's1', 's2']);
    expect(customSpace.snapshotAt('2026-07-06T11:00:00.000Z')?.stateId).toBe('s1');
  });
});

describe('trajectory serialization', () => {
  it('round-trips snapshots through JSON', () => {
    const space = createPcmsStateSpace();
    space.clearStates();

    const t0 = space.createState({
      stateId: 't0',
      observedAt: '2026-01-01T00:00:00.000Z',
      coordinates: Object.fromEntries(space.dimensionIds.map((id) => [id, 0.4])),
      normalized: true,
      uncertainty: Object.fromEntries(
        space.dimensionIds.map((id) => [id, uncertaintyFromHalfWidth(0.4, 0.05, 0, 1)])
      ),
    });
    const t1 = space.createState({
      stateId: 't1',
      observedAt: '2026-02-01T00:00:00.000Z',
      coordinates: Object.fromEntries(space.dimensionIds.map((id) => [id, 0.6])),
      normalized: true,
      uncertainty: Object.fromEntries(
        space.dimensionIds.map((id) => [id, uncertaintyFromHalfWidth(0.6, 0.03, 0, 1)])
      ),
    });

    const serialized = serializeTrajectory({
      trajectoryId: 'tr-1',
      subjectId: 'person-1',
      space,
      states: [t1, t0],
    });

    expect(serialized.format).toBe('clm-landscape-trajectory');
    expect(serialized.snapshots.map((s) => s.stateId)).toEqual(['t0', 't1']);

    const json = trajectoryToJson(serialized);
    const restored = trajectoryFromJson(json);

    expect(restored.trajectoryId).toBe('tr-1');
    expect(restored.states).toHaveLength(2);
    expect(restored.states[0]?.coordinate('F')).toBe(0.4);
    expect(restored.states[1]?.uncertainty('F').upper).toBeCloseTo(0.63, 5);
  });

  it('rejects duplicate dimension ids at space definition', () => {
    expect(() =>
      StateSpace.define({
        spaceId: 'bad',
        instrumentId: 'x',
        version: '1.0.0',
        dimensions: [
          {
            id: 'dup',
            constructId: 'a',
            normalization: { inputMin: 0, inputMax: 1, outputMin: 0, outputMax: 1 },
          },
          {
            id: 'dup',
            constructId: 'b',
            normalization: { inputMin: 0, inputMax: 1, outputMin: 0, outputMax: 1 },
          },
        ],
      })
    ).toThrow(/Duplicate dimension id/);
  });
});

describe('normalization helpers', () => {
  it('clamps out-of-range raw values into the output domain', () => {
    const spec = { inputMin: 0, inputMax: 100, outputMin: 0, outputMax: 1 };
    expect(normalizeValue(150, spec)).toBe(1);
    expect(normalizeValue(-10, spec)).toBe(0);
  });
});

describe('CognitiveState immutability semantics', () => {
  it('exposes read-only coordinate access without mutating internal storage', () => {
    const space = createCustomStateSpace({
      spaceId: 'immut',
      instrumentId: 'demo',
      version: '1.0.0',
      dimensions: [
        {
          id: 'x',
          constructId: 'cx',
          normalization: { inputMin: 0, inputMax: 1, outputMin: 0, outputMax: 1 },
        },
      ],
    });

    const state = space.createState({
      stateId: 's',
      observedAt: '2026-07-06T00:00:00.000Z',
      coordinates: { x: 0.2 },
      normalized: true,
    });

    const coords = state.coordinates();
    (coords as Record<string, number>).x = 0.9;
    expect(state.coordinate('x')).toBe(0.2);
  });
});
