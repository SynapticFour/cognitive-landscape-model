import {
  assertManyToManyStructure,
  validateInfluence,
  type ProbabilisticInfluence,
} from './influence-field.js';
import { validateLatentParameter, type LatentParameter } from './latent-parameter.js';

export interface StructuralModelConfig {
  readonly modelId: string;
  readonly observedDimensionIds: readonly string[];
  readonly parameters: readonly LatentParameter[];
  readonly influences: readonly ProbabilisticInfluence[];
}

/**
 * Latent constraint field over observed state variables.
 * Parameters never equal observed traits; coupling is many-to-many and probabilistic.
 */
export class StructuralModel {
  readonly #modelId: string;
  readonly #observedDimensionIds: readonly string[];
  readonly #parameters: Map<string, LatentParameter>;
  readonly #influences: ProbabilisticInfluence[];

  private constructor(config: StructuralModelConfig) {
    if (config.observedDimensionIds.length === 0) {
      throw new Error('StructuralModel requires at least one observed dimension id');
    }
    if (config.parameters.length === 0) {
      throw new Error('StructuralModel requires at least one latent parameter');
    }

    this.#modelId = config.modelId;
    this.#observedDimensionIds = [...config.observedDimensionIds];
    this.#parameters = new Map();
    this.#influences = [];

    for (const parameter of config.parameters) {
      validateLatentParameter(parameter);
      if (this.#parameters.has(parameter.parameterId)) {
        throw new Error(`Duplicate latent parameter id "${parameter.parameterId}"`);
      }
      this.#parameters.set(parameter.parameterId, { ...parameter });
    }

    const parameterIds = new Set(this.#parameters.keys());
    const observedIds = new Set(this.#observedDimensionIds);

    for (const influence of config.influences) {
      validateInfluence(influence, parameterIds, observedIds);
      if (this.#influences.some((existing) => existing.influenceId === influence.influenceId)) {
        throw new Error(`Duplicate influence id "${influence.influenceId}"`);
      }
      this.#influences.push({ ...influence });
    }

    assertManyToManyStructure(this.#influences, [...parameterIds], this.#observedDimensionIds);
  }

  static define(config: StructuralModelConfig): StructuralModel {
    return new StructuralModel(config);
  }

  get modelId(): string {
    return this.#modelId;
  }

  get observedDimensionIds(): readonly string[] {
    return this.#observedDimensionIds;
  }

  get parameters(): readonly LatentParameter[] {
    return [...this.#parameters.values()].map((parameter) => ({ ...parameter }));
  }

  get influences(): readonly ProbabilisticInfluence[] {
    return this.#influences.map((influence) => ({ ...influence }));
  }

  parameter(parameterId: string): LatentParameter {
    const parameter = this.#parameters.get(parameterId);
    if (parameter === undefined) {
      throw new Error(`Unknown latent parameter "${parameterId}"`);
    }
    return { ...parameter };
  }

  influencesOnDimension(observedDimensionId: string): readonly ProbabilisticInfluence[] {
    return this.#influences.filter((influence) => influence.observedDimensionId === observedDimensionId);
  }

  influencesFromParameter(parameterId: string): readonly ProbabilisticInfluence[] {
    return this.#influences.filter((influence) => influence.parameterId === parameterId);
  }

  withParameterPosteriors(posteriors: Readonly<Record<string, { mean: number; variance: number }>>): StructuralModel {
    const parameters = this.parameters.map((parameter) => {
      const posterior = posteriors[parameter.parameterId];
      return posterior === undefined ? parameter : { ...parameter, posterior };
    });
    return StructuralModel.define({
      modelId: this.#modelId,
      observedDimensionIds: this.#observedDimensionIds,
      parameters,
      influences: this.#influences,
    });
  }
}

export type { LatentParameter, LatentParameterPosterior, LatentParameterPrior } from './latent-parameter.js';
export type { ProbabilisticInfluence } from './influence-field.js';
