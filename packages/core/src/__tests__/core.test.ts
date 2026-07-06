import { describe, expect, it } from 'vitest';
import {
  assertVectorSchema,
  createMeasurementBundle,
  createMeasurementBundleFromTrajectory,
  createProvenance,
  unitInterval,
} from '../index.js';

describe('@clm/core', () => {
  it('brands unit-interval values', () => {
    expect(unitInterval(0.5)).toBe(0.5);
    expect(() => unitInterval(1.1)).toThrow(RangeError);
  });

  it('creates provenance without optional session id', () => {
    const p = createProvenance('landscape', 'pcms', '0.1.0', '2026-07-06T00:00:00.000Z');
    expect(p.layer).toBe('landscape');
    expect(p.instrumentId).toBe('pcms');
  });

  it('validates vector schema', () => {
    const schema = { axisKeys: ['F', 'P'] as const, domain: 'unit-interval' as const };
    expect(() =>
      assertVectorSchema(schema, { F: unitInterval(0.5), P: unitInterval(0.4) })
    ).not.toThrow();
    expect(() => assertVectorSchema(schema, { F: unitInterval(0.5) })).toThrow(/Missing axis/);
    expect(() => assertVectorSchema(schema, { F: 1.2, P: 0.4 })).toThrow(RangeError);
  });

  it('builds measurement bundles for interpretation handoff', () => {
    const bundle = createMeasurementBundle(
      'bundle-1',
      '2026-07-06T00:00:00.000Z',
      { snapshotId: 'ls-1', instrumentId: 'pcms', dimensionCount: 10 }
    );
    expect(bundle.landscape.instrumentId).toBe('pcms');
    expect(bundle.dynamics).toBeUndefined();
  });

  it('builds trajectory measurement bundles with dynamics and structural refs', () => {
    const bundle = createMeasurementBundleFromTrajectory({
      bundleId: 'bundle-traj',
      createdAt: '2026-07-06T00:00:00.000Z',
      initialStateId: 'state-t0',
      instrumentId: 'synthetic',
      dimensionCount: 4,
      runId: 'run-1',
      stateCount: 8,
      structuralModelId: 'abstract-latent-v1',
    });

    expect(bundle.dynamics?.observationCount).toBe(8);
    expect(bundle.structural?.priorId).toBe('abstract-latent-v1');
  });
});
