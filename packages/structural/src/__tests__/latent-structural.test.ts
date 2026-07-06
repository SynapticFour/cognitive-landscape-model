import { describe, expect, it } from 'vitest';

import {
  CalibrationEngine,
  ProbabilisticDynamicsModulator,
  StructuralModel,
  abstractParameterDynamicsRoles,
  applyStructuralInfluence,
  createAbstractStructuralModel,
  createPcmsStructuralModel,
  createSeededRandom,
  observedPatternsFromState,
} from '../index.js';

describe('StructuralModel latent constraints', () => {
  it('defines hidden parameters separate from observed dimensions', () => {
    const model = createAbstractStructuralModel();

    expect(model.parameters.every((parameter) => parameter.parameterId.startsWith('latent.'))).toBe(true);
    expect(model.observedDimensionIds.every((id) => id.startsWith('v'))).toBe(true);
    expect(model.parameters.some((parameter) => parameter.parameterId.includes('sensory-gain'))).toBe(true);
  });

  it('requires many-to-many probabilistic influences', () => {
    const model = createAbstractStructuralModel();

    for (const parameter of model.parameters) {
      expect(model.influencesFromParameter(parameter.parameterId).length).toBeGreaterThan(1);
    }
    for (const dimensionId of model.observedDimensionIds) {
      expect(model.influencesOnDimension(dimensionId).length).toBeGreaterThan(1);
    }
  });

  it('rejects deterministic one-to-one influence mappings', () => {
    expect(() =>
      StructuralModel.define({
        modelId: 'bad',
        observedDimensionIds: ['v1', 'v2'],
        parameters: [
          { parameterId: 'p1', label: 'p1', prior: { mean: 0.5, variance: 0.1 } },
          { parameterId: 'p2', label: 'p2', prior: { mean: 0.5, variance: 0.1 } },
        ],
        influences: [
          {
            influenceId: 'i1',
            parameterId: 'p1',
            observedDimensionId: 'v1',
            meanWeight: 1,
            weightVariance: 0,
          },
          {
            influenceId: 'i2',
            parameterId: 'p2',
            observedDimensionId: 'v2',
            meanWeight: 1,
            weightVariance: 0.01,
          },
        ],
      })
    ).toThrow(/weightVariance|probabilistic|multiple/i);
  });
});

describe('CalibrationEngine', () => {
  it('calibrates latent posteriors from observed dimension patterns', () => {
    const model = createAbstractStructuralModel();
    const engine = new CalibrationEngine(model);

    const result = engine.calibrate([
      { dimensionId: 'v1', mean: 0.7, variance: 0.04, weight: 1 },
      { dimensionId: 'v2', mean: 0.55, variance: 0.05, weight: 1 },
      { dimensionId: 'v3', mean: 0.6, variance: 0.05, weight: 1 },
      { dimensionId: 'v4', mean: 0.45, variance: 0.06, weight: 1 },
    ]);

    expect(Object.keys(result.parameterPosteriors)).toHaveLength(model.parameters.length);
    expect(result.fitScore).toBeGreaterThan(0);
    expect(result.residualVariance.v1).toBeGreaterThan(0);

    const calibrated = engine.applyToModel(result);
    expect(calibrated.parameter('latent.sensory-gain').posterior).toBeDefined();
  });

  it('does not collapse posteriors to exact observed trait values', () => {
    const model = createAbstractStructuralModel();
    const engine = new CalibrationEngine(model, { ridgeLambda: 0.1 });

    const result = engine.calibrate([{ dimensionId: 'v1', mean: 0.95, variance: 0.02 }]);

    const sensoryPosterior = result.parameterPosteriors['latent.sensory-gain'];
    expect(sensoryPosterior).toBeDefined();
    expect(sensoryPosterior!.mean).not.toBe(0.95);
    expect(sensoryPosterior!.variance).toBeGreaterThan(0);
  });
});

describe('ProbabilisticDynamicsModulator', () => {
  it('samples stochastic dynamics modifiers from latent structure', () => {
    const model = createAbstractStructuralModel();
    const modulator = new ProbabilisticDynamicsModulator(model, {
      roles: abstractParameterDynamicsRoles(),
    });

    const rngA = createSeededRandom(42);
    const rngB = createSeededRandom(99);
    const sampleA1 = modulator.sample(rngA);
    const sampleA2 = modulator.sample(createSeededRandom(42));
    const sampleB = modulator.sample(rngB);

    expect(sampleA1).toEqual(sampleA2);
    expect(sampleA1.stepSizeScale).not.toBe(sampleB.stepSizeScale);
    expect(Object.keys(sampleA1.dimensionDrift)).toEqual([...model.observedDimensionIds]);
  });

  it('applies probabilistic modifiers to base dynamics parameters', () => {
    const model = createAbstractStructuralModel();
    const modulator = new ProbabilisticDynamicsModulator(model, {
      roles: abstractParameterDynamicsRoles(),
    });

    const modified = applyStructuralInfluence(
      { stepSize: 0.2, damping: 0.25 },
      modulator.expected()
    );

    expect(modified.stepSize).toBeGreaterThan(0);
    expect(modified.stepSize).toBeLessThanOrEqual(1);
    expect(modified.dimensionDrift.v1).toBeDefined();
  });
});

describe('PCMS structural preset', () => {
  it('defines latent constraints over F–V dimensions', () => {
    const model = createPcmsStructuralModel();

    expect(model.modelId).toBe('pcms-latent-v1');
    expect(model.observedDimensionIds).toEqual(['F', 'P', 'S', 'E', 'R', 'C', 'T', 'I', 'A', 'V']);
    expect(model.parameters.length).toBe(5);
  });
});

describe('Cognitive state calibration helpers', () => {
  it('derives observed patterns from a state-like source', () => {
    const source = {
      dimensionIds: () => ['v1', 'v2'] as const,
      coordinate: (id: string) => (id === 'v1' ? 0.7 : 0.4),
      uncertainties: () => ({
        v1: { lower: 0.65, upper: 0.75 },
        v2: { lower: 0.35, upper: 0.45 },
      }),
    };

    const patterns = observedPatternsFromState(source);
    expect(patterns).toHaveLength(2);
    expect(patterns[0]?.mean).toBe(0.7);
  });
});
