import type { StructuralModel } from '../latent/structural-model.js';
import { withPosterior, type LatentParameterPosterior } from '../latent/latent-parameter.js';
import { clampUnit } from '../random.js';

export interface ObservedPattern {
  readonly dimensionId: string;
  readonly mean: number;
  readonly variance?: number;
  readonly weight?: number;
}

export interface CalibrationResult {
  readonly parameterPosteriors: Readonly<Record<string, LatentParameterPosterior>>;
  readonly residualVariance: Readonly<Record<string, number>>;
  readonly fitScore: number;
}

export interface CalibrationOptions {
  readonly ridgeLambda?: number;
  readonly maxIterations?: number;
}

const DEFAULT_RIDGE = 0.05;

/**
 * Softly calibrates latent posteriors from observed dimension patterns.
 * Structure never maps 1:1 to observations — regularization keeps posteriors uncertain.
 */
export class CalibrationEngine {
  readonly #model: StructuralModel;
  readonly #ridgeLambda: number;
  readonly #maxIterations: number;

  constructor(model: StructuralModel, options: CalibrationOptions = {}) {
    this.#model = model;
    this.#ridgeLambda = options.ridgeLambda ?? DEFAULT_RIDGE;
    this.#maxIterations = options.maxIterations ?? 8;
  }

  get model(): StructuralModel {
    return this.#model;
  }

  calibrate(observations: readonly ObservedPattern[]): CalibrationResult {
    if (observations.length === 0) {
      throw new Error('Calibration requires at least one observed pattern');
    }

    const observedById = new Map<string, ObservedPattern>();
    for (const observation of observations) {
      if (!this.#model.observedDimensionIds.includes(observation.dimensionId)) {
        throw new Error(`Unknown observed dimension "${observation.dimensionId}"`);
      }
      if (!Number.isFinite(observation.mean) || observation.mean < 0 || observation.mean > 1) {
        throw new RangeError(`Observation mean for "${observation.dimensionId}" must be in [0, 1]`);
      }
      observedById.set(observation.dimensionId, observation);
    }

    const parameterIds = this.#model.parameters.map((parameter) => parameter.parameterId);
    const posteriors: Record<string, LatentParameterPosterior> = {};

    for (const parameter of this.#model.parameters) {
      posteriors[parameter.parameterId] = { ...parameter.prior };
    }

    for (let iteration = 0; iteration < this.#maxIterations; iteration += 1) {
      for (const parameterId of parameterIds) {
        const parameter = this.#model.parameter(parameterId);
        const influences = this.#model.influencesFromParameter(parameterId);

        let numerator = 0;
        let denominator = this.#ridgeLambda + 1 / parameter.prior.variance;

        for (const influence of influences) {
          const observation = observedById.get(influence.observedDimensionId);
          if (observation === undefined) {
            continue;
          }

          const obsWeight = observation.weight ?? 1;
          const obsVariance = observation.variance ?? 0.05;
          const effectiveWeight = influence.meanWeight / (influence.weightVariance + obsVariance);
          numerator += obsWeight * effectiveWeight * observation.mean;
          denominator += obsWeight * (effectiveWeight * effectiveWeight);
        }

        const mean = clampUnit(numerator / denominator);
        const variance = Math.max(1 / denominator, 1e-4);
        posteriors[parameterId] = { mean, variance };
      }
    }

    const residualVariance = Object.fromEntries(
      this.#model.observedDimensionIds.map((dimensionId) => {
        const observation = observedById.get(dimensionId);
        if (observation === undefined) {
          return [dimensionId, 1];
        }

        const predicted = this.#predictDimensionMean(dimensionId, posteriors);
        const residual = observation.mean - predicted;
        const baseVariance = observation.variance ?? 0.05;
        return [dimensionId, Math.max(baseVariance + residual * residual, 1e-4)];
      })
    );

    const fitScore = this.#computeFitScore(observedById, posteriors, residualVariance);

    return {
      parameterPosteriors: posteriors,
      residualVariance,
      fitScore,
    };
  }

  applyToModel(result: CalibrationResult): StructuralModel {
    return this.#model.withParameterPosteriors(result.parameterPosteriors);
  }

  #predictDimensionMean(
    dimensionId: string,
    posteriors: Readonly<Record<string, LatentParameterPosterior>>
  ): number {
    const influences = this.#model.influencesOnDimension(dimensionId);
    if (influences.length === 0) {
      return 0.5;
    }

    let weightedSum = 0;
    let weightTotal = 0;

    for (const influence of influences) {
      const posterior = posteriors[influence.parameterId];
      if (posterior === undefined) {
        continue;
      }
      const reliability = 1 / (influence.weightVariance + posterior.variance);
      weightedSum += influence.meanWeight * reliability * posterior.mean;
      weightTotal += Math.abs(influence.meanWeight) * reliability;
    }

    return weightTotal === 0 ? 0.5 : clampUnit(0.5 + weightedSum / (2 * weightTotal));
  }

  #computeFitScore(
    observations: ReadonlyMap<string, ObservedPattern>,
    posteriors: Readonly<Record<string, LatentParameterPosterior>>,
    residualVariance: Readonly<Record<string, number>>
  ): number {
    let score = 0;
    let count = 0;

    for (const dimensionId of this.#model.observedDimensionIds) {
      const observation = observations.get(dimensionId);
      if (observation === undefined) {
        continue;
      }
      const predicted = this.#predictDimensionMean(dimensionId, posteriors);
      const residual = observation.mean - predicted;
      const variance = residualVariance[dimensionId] ?? 1;
      score += 1 / (variance + residual * residual);
      count += 1;
    }

    return count === 0 ? 0 : score / count;
  }
}
