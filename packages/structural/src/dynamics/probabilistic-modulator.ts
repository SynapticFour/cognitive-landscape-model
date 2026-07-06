import type { StructuralModel } from '../latent/structural-model.js';
import { clampUnit, createSeededRandom, sampleNormal, type RandomSource } from '../random.js';

export interface ParameterDynamicsRole {
  readonly parameterId: string;
  readonly stepSizeSensitivity: number;
  readonly dampingSensitivity: number;
  readonly driftSensitivity: number;
}

export interface ProbabilisticDynamicsSample {
  readonly stepSizeScale: number;
  readonly dampingOffset: number;
  readonly dimensionDrift: Readonly<Record<string, number>>;
}

export interface DynamicsModulatorConfig {
  readonly roles: readonly ParameterDynamicsRole[];
  readonly baseStepSizeScale?: number;
  readonly baseDampingOffset?: number;
}

/**
 * Converts latent structure into probabilistic modifiers for dynamics integration.
 * Each sample draws stochastic coupling weights — never a fixed one-to-one push.
 */
export class ProbabilisticDynamicsModulator {
  readonly #model: StructuralModel;
  readonly #roles: Map<string, ParameterDynamicsRole>;
  readonly #baseStepSizeScale: number;
  readonly #baseDampingOffset: number;

  constructor(model: StructuralModel, config: DynamicsModulatorConfig) {
    this.#model = model;
    this.#roles = new Map(config.roles.map((role) => [role.parameterId, role]));
    this.#baseStepSizeScale = config.baseStepSizeScale ?? 1;
    this.#baseDampingOffset = config.baseDampingOffset ?? 0;

    for (const parameter of model.parameters) {
      if (!this.#roles.has(parameter.parameterId)) {
        throw new Error(`Missing dynamics role for latent parameter "${parameter.parameterId}"`);
      }
    }
  }

  get model(): StructuralModel {
    return this.#model;
  }

  sample(rng: RandomSource): ProbabilisticDynamicsSample {
    let stepSizeScale = this.#baseStepSizeScale;
    let dampingOffset = this.#baseDampingOffset;
    const dimensionDrift = Object.fromEntries(
      this.#model.observedDimensionIds.map((dimensionId) => [dimensionId, 0])
    ) as Record<string, number>;

    for (const parameter of this.#model.parameters) {
      const role = this.#roles.get(parameter.parameterId)!;
      const posterior = parameter.posterior ?? parameter.prior;
      const latentDraw = sampleNormal(rng, posterior.mean, posterior.variance);

      stepSizeScale += role.stepSizeSensitivity * (latentDraw - 0.5) * 0.2;
      dampingOffset += role.dampingSensitivity * (latentDraw - 0.5) * 0.15;

      for (const influence of this.#model.influencesFromParameter(parameter.parameterId)) {
        const weightDraw = sampleNormal(rng, influence.meanWeight, influence.weightVariance);
        const driftContribution = role.driftSensitivity * weightDraw * (latentDraw - 0.5) * 0.1;
        dimensionDrift[influence.observedDimensionId]! += driftContribution;
      }
    }

    return {
      stepSizeScale: Math.max(0.05, stepSizeScale),
      dampingOffset: Math.max(-0.4, Math.min(0.4, dampingOffset)),
      dimensionDrift,
    };
  }

  /** Expected modifier using prior/posterior means and mean coupling weights (no stochastic draw). */
  expected(): ProbabilisticDynamicsSample {
    let stepSizeScale = this.#baseStepSizeScale;
    let dampingOffset = this.#baseDampingOffset;
    const dimensionDrift = Object.fromEntries(
      this.#model.observedDimensionIds.map((dimensionId) => [dimensionId, 0])
    ) as Record<string, number>;

    for (const parameter of this.#model.parameters) {
      const role = this.#roles.get(parameter.parameterId)!;
      const posterior = parameter.posterior ?? parameter.prior;
      const latentMean = posterior.mean;

      stepSizeScale += role.stepSizeSensitivity * (latentMean - 0.5) * 0.2;
      dampingOffset += role.dampingSensitivity * (latentMean - 0.5) * 0.15;

      for (const influence of this.#model.influencesFromParameter(parameter.parameterId)) {
        const driftContribution = role.driftSensitivity * influence.meanWeight * (latentMean - 0.5) * 0.1;
        dimensionDrift[influence.observedDimensionId]! += driftContribution;
      }
    }

    return {
      stepSizeScale: Math.max(0.05, stepSizeScale),
      dampingOffset: Math.max(-0.4, Math.min(0.4, dampingOffset)),
      dimensionDrift,
    };
  }
}

export interface TransitionModifierInput {
  readonly stepSize: number;
  readonly damping: number;
}

export interface TransitionModifierOutput extends TransitionModifierInput {
  readonly dimensionDrift: Readonly<Record<string, number>>;
}

/** Applies a probabilistic structural sample to base dynamics parameters. */
export function applyStructuralInfluence(
  base: TransitionModifierInput,
  sample: ProbabilisticDynamicsSample
): TransitionModifierOutput {
  const stepSize = clampUnit(base.stepSize * sample.stepSizeScale);
  const damping = clampUnit(base.damping + sample.dampingOffset);

  return {
    stepSize,
    damping,
    dimensionDrift: { ...sample.dimensionDrift },
  };
}

export type { RandomSource };
