import { StructuralModel } from '../latent/structural-model.js';
import type { LatentParameter } from '../latent/latent-parameter.js';
import type { ProbabilisticInfluence } from '../latent/influence-field.js';
import type { ParameterDynamicsRole } from '../dynamics/probabilistic-modulator.js';

/** PCMS routing dimensions — aligned with @clm/landscape PCMS_DIMENSION_KEYS. */
export const PCMS_OBSERVED_DIMENSIONS = ['F', 'P', 'S', 'E', 'R', 'C', 'T', 'I', 'A', 'V'] as const;

export type PcmsObservedDimension = (typeof PCMS_OBSERVED_DIMENSIONS)[number];

export const PCMS_STRUCTURAL_MODEL_ID = 'pcms-latent-v1' as const;

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
 * PCMS-aligned structural preset over F–V routing dimensions.
 * Latent constraints mirror the abstract model semantics with PCMS-specific routing spread.
 */
export function createPcmsStructuralModel(): StructuralModel {
  const parameters: LatentParameter[] = [
    latent('latent.sensory-gain', 'sensory-filtering-gain', 0.5, 0.08),
    latent('latent.prediction-stability', 'prediction-model-stability', 0.55, 0.06),
    latent('latent.stress-reactivity', 'stress-reactivity-baseline', 0.45, 0.07),
    latent('latent.cognitive-bandwidth', 'cognitive-bandwidth-constraint', 0.5, 0.09),
    latent('latent.routing-flexibility', 'routing-flexibility', 0.52, 0.07),
  ];

  const influences: ProbabilisticInfluence[] = [
    influence('inf.sg.F', 'latent.sensory-gain', 'F', 0.45, 0.04),
    influence('inf.sg.P', 'latent.sensory-gain', 'P', 0.35, 0.05),
    influence('inf.sg.S', 'latent.sensory-gain', 'S', 0.3, 0.05),

    influence('inf.ps.P', 'latent.prediction-stability', 'P', 0.5, 0.04),
    influence('inf.ps.S', 'latent.prediction-stability', 'S', 0.4, 0.05),
    influence('inf.ps.E', 'latent.prediction-stability', 'E', 0.35, 0.05),

    influence('inf.sr.E', 'latent.stress-reactivity', 'E', 0.45, 0.04),
    influence('inf.sr.R', 'latent.stress-reactivity', 'R', 0.4, 0.05),
    influence('inf.sr.C', 'latent.stress-reactivity', 'C', 0.35, 0.05),

    influence('inf.cb.R', 'latent.cognitive-bandwidth', 'R', 0.35, 0.05),
    influence('inf.cb.C', 'latent.cognitive-bandwidth', 'C', 0.45, 0.04),
    influence('inf.cb.T', 'latent.cognitive-bandwidth', 'T', 0.3, 0.05),

    influence('inf.rf.T', 'latent.routing-flexibility', 'T', 0.4, 0.05),
    influence('inf.rf.I', 'latent.routing-flexibility', 'I', 0.45, 0.04),
    influence('inf.rf.A', 'latent.routing-flexibility', 'A', 0.35, 0.05),
    influence('inf.rf.V', 'latent.routing-flexibility', 'V', 0.4, 0.05),
    influence('inf.rf.F', 'latent.routing-flexibility', 'F', 0.25, 0.06),
  ];

  return StructuralModel.define({
    modelId: PCMS_STRUCTURAL_MODEL_ID,
    observedDimensionIds: [...PCMS_OBSERVED_DIMENSIONS],
    parameters,
    influences,
  });
}

export function pcmsParameterDynamicsRoles(): ParameterDynamicsRole[] {
  return [
    {
      parameterId: 'latent.sensory-gain',
      stepSizeSensitivity: 0.55,
      dampingSensitivity: -0.25,
      driftSensitivity: 0.75,
    },
    {
      parameterId: 'latent.prediction-stability',
      stepSizeSensitivity: -0.35,
      dampingSensitivity: 0.65,
      driftSensitivity: 0.25,
    },
    {
      parameterId: 'latent.stress-reactivity',
      stepSizeSensitivity: 0.65,
      dampingSensitivity: -0.45,
      driftSensitivity: 0.45,
    },
    {
      parameterId: 'latent.cognitive-bandwidth',
      stepSizeSensitivity: -0.55,
      dampingSensitivity: 0.35,
      driftSensitivity: -0.25,
    },
    {
      parameterId: 'latent.routing-flexibility',
      stepSizeSensitivity: 0.4,
      dampingSensitivity: -0.15,
      driftSensitivity: 0.55,
    },
  ];
}
