import {
  assertDimensionIdsUnique,
  assertUncertaintyRange,
  fullRangeUncertainty,
  normalizeValue,
  type DimensionUncertainty,
  type StateDimension,
  type StateSpaceConfig,
} from './dimension.js';
import { CognitiveState, type CognitiveStateInput } from './cognitive-state.js';

/**
 * Defines a continuous multidimensional space and manufactures {@link CognitiveState} snapshots.
 */
export class StateSpace {
  readonly #config: StateSpaceConfig;
  readonly #dimensionsById: ReadonlyMap<string, StateDimension>;
  readonly #states: Map<string, CognitiveState>;

  private constructor(config: StateSpaceConfig) {
    assertDimensionIdsUnique(config.dimensions);
    if (config.dimensions.length === 0) {
      throw new Error('StateSpace requires at least one dimension');
    }

    this.#config = config;
    this.#dimensionsById = new Map(config.dimensions.map((dimension) => [dimension.id, dimension]));
    this.#states = new Map();
  }

  static define(config: StateSpaceConfig): StateSpace {
    return new StateSpace(config);
  }

  get spaceId(): string {
    return this.#config.spaceId;
  }

  get instrumentId(): string {
    return this.#config.instrumentId;
  }

  get version(): StateSpaceConfig['version'] {
    return this.#config.version;
  }

  get dimensionIds(): readonly string[] {
    return this.#config.dimensions.map((dimension) => dimension.id);
  }

  get dimensions(): readonly StateDimension[] {
    return this.#config.dimensions;
  }

  get config(): StateSpaceConfig {
    return this.#config;
  }

  dimension(dimensionId: string): StateDimension {
    const dimension = this.#dimensionsById.get(dimensionId);
    if (dimension === undefined) {
      throw new Error(`Unknown dimension "${dimensionId}" in space ${this.spaceId}`);
    }
    return dimension;
  }

  normalize(dimensionId: string, rawValue: number): number {
    return normalizeValue(rawValue, this.dimension(dimensionId).normalization);
  }

  normalizeCoordinates(raw: Readonly<Record<string, number>>): Readonly<Record<string, number>> {
    const normalized: Record<string, number> = {};
    for (const dimension of this.#config.dimensions) {
      const rawValue = raw[dimension.id];
      if (rawValue === undefined) {
        throw new Error(`Missing coordinate for dimension "${dimension.id}"`);
      }
      normalized[dimension.id] = normalizeValue(rawValue, dimension.normalization);
    }
    return normalized;
  }

  validateNormalizedCoordinates(
    coordinates: Readonly<Record<string, number>>
  ): Readonly<Record<string, number>> {
    const validated: Record<string, number> = {};
    for (const dimension of this.#config.dimensions) {
      const value = coordinates[dimension.id];
      if (value === undefined) {
        throw new Error(`Missing coordinate for dimension "${dimension.id}"`);
      }
      const { outputMin, outputMax } = dimension.normalization;
      if (value < outputMin || value > outputMax) {
        throw new RangeError(
          `Coordinate for "${dimension.id}" must be within [${outputMin}, ${outputMax}], got ${value}`
        );
      }
      validated[dimension.id] = value;
    }
    return validated;
  }

  resolveUncertainty(
    coordinates: Readonly<Record<string, number>>,
    provided?: Readonly<Record<string, DimensionUncertainty>>
  ): Readonly<Record<string, DimensionUncertainty>> {
    const resolved: Record<string, DimensionUncertainty> = {};

    for (const dimension of this.#config.dimensions) {
      const { outputMin, outputMax } = dimension.normalization;
      const estimate = coordinates[dimension.id]!;
      const candidate = provided?.[dimension.id] ?? fullRangeUncertainty(outputMin, outputMax);
      assertUncertaintyRange(candidate, outputMin, outputMax);
      resolved[dimension.id] = candidate;
    }

    return resolved;
  }

  createState(input: CognitiveStateInput): CognitiveState {
    const state = new CognitiveState(this, input);
    this.#states.set(state.stateId, state);
    return state;
  }

  getState(stateId: string): CognitiveState | undefined {
    return this.#states.get(stateId);
  }

  hasState(stateId: string): boolean {
    return this.#states.has(stateId);
  }

  /** All registered snapshots sorted by observedAt ascending (t0 → tn). */
  orderedSnapshots(): readonly CognitiveState[] {
    return [...this.#states.values()].sort((a, b) => a.observedAt.localeCompare(b.observedAt));
  }

  snapshotAt(observedAt: string): CognitiveState | undefined {
    return this.orderedSnapshots().find((state) => state.observedAt === observedAt);
  }

  clearStates(): void {
    this.#states.clear();
  }
}

export type { StateSpaceConfig, StateDimension, DimensionUncertainty, NormalizationSpec } from './dimension.js';
export type { CognitiveStateInput } from './cognitive-state.js';
