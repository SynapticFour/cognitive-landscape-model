import { StructuralModel } from '../latent/structural-model.js';
import type { LatentParameter } from '../latent/latent-parameter.js';
import type { ProbabilisticInfluence } from '../latent/influence-field.js';
import type { ParameterDynamicsRole } from '../dynamics/probabilistic-modulator.js';

export const ABSTRACT_STRUCTURAL_MODEL_ID = 'abstract-latent-v1' as const;

const OBSERVED = ['v1', 'v2', 'v3', 'v4'] as const;

function latent(
  parameterId: string,
  label: string,
  mean: number,
  variance: number
): LatentParameter {
  return {
    parameterId,
    label,
    prior: { mean, variance },
  };
}

function influence(
  influenceId: string,
  parameterId: string,
  observedDimensionId: string,
  meanWeight: number,
  weightVariance: number
): ProbabilisticInfluence {
  return {
    influenceId,
    parameterId,
    observedDimensionId,
    meanWeight,
    weightVariance,
  };
}

/**
 * Abstract reference model with four latent constraints:
 * sensory gain, prediction stability, stress reactivity baseline, cognitive bandwidth.
 *
 * Each latent variable influences multiple observed dimensions with uncertain weights.
 */
export function createAbstractStructuralModel(): StructuralModel {
  const parameters: LatentParameter[] = [
    latent('latent.sensory-gain', 'sensory-gain', 0.5, 0.08),
    latent('latent.prediction-stability', 'prediction-stability', 0.55, 0.06),
    latent('latent.stress-reactivity', 'stress-reactivity-baseline', 0.45, 0.07),
    latent('latent.cognitive-bandwidth', 'cognitive-bandwidth-constraint', 0.5, 0.09),
  ];

  const influences: ProbabilisticInfluence[] = [
    influence('inf.sg.v1', 'latent.sensory-gain', 'v1', 0.45, 0.04),
    influence('inf.sg.v2', 'latent.sensory-gain', 'v2', 0.35, 0.05),
    influence('inf.sg.v3', 'latent.sensory-gain', 'v3', 0.25, 0.06),

    influence('inf.ps.v2', 'latent.prediction-stability', 'v2', 0.5, 0.04),
    influence('inf.ps.v3', 'latent.prediction-stability', 'v3', 0.4, 0.05),
    influence('inf.ps.v4', 'latent.prediction-stability', 'v4', 0.3, 0.05),

    influence('inf.sr.v1', 'latent.stress-reactivity', 'v1', 0.35, 0.05),
    influence('inf.sr.v3', 'latent.stress-reactivity', 'v3', 0.45, 0.04),
    influence('inf.sr.v4', 'latent.stress-reactivity', 'v4', 0.4, 0.06),

    influence('inf.cb.v1', 'latent.cognitive-bandwidth', 'v1', 0.3, 0.05),
    influence('inf.cb.v2', 'latent.cognitive-bandwidth', 'v2', 0.35, 0.05),
    influence('inf.cb.v4', 'latent.cognitive-bandwidth', 'v4', 0.5, 0.04),
  ];

  return StructuralModel.define({
    modelId: ABSTRACT_STRUCTURAL_MODEL_ID,
    observedDimensionIds: OBSERVED,
    parameters,
    influences,
  });
}

export function abstractParameterDynamicsRoles(): ParameterDynamicsRole[] {
  return [
    {
      parameterId: 'latent.sensory-gain',
      stepSizeSensitivity: 0.6,
      dampingSensitivity: -0.2,
      driftSensitivity: 0.8,
    },
    {
      parameterId: 'latent.prediction-stability',
      stepSizeSensitivity: -0.4,
      dampingSensitivity: 0.7,
      driftSensitivity: 0.2,
    },
    {
      parameterId: 'latent.stress-reactivity',
      stepSizeSensitivity: 0.7,
      dampingSensitivity: -0.5,
      driftSensitivity: 0.5,
    },
    {
      parameterId: 'latent.cognitive-bandwidth',
      stepSizeSensitivity: -0.6,
      dampingSensitivity: 0.4,
      driftSensitivity: -0.3,
    },
  ];
}

export const ABSTRACT_OBSERVED_DIMENSIONS = OBSERVED;
