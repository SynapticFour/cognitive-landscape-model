import type { StateSpace } from './state-space.js';
import type { DimensionUncertainty } from './dimension.js';
import type { SerializedCognitiveState } from './serialization.js';

export interface CognitiveStateInput {
  readonly stateId: string;
  /** ISO-8601 timestamp for this snapshot (t0, t1, t2, …). */
  readonly observedAt: string;
  /**
   * Coordinate values keyed by dimension id.
   * Values may be raw (pre-normalization) or already normalized when `normalized: true`.
   */
  readonly coordinates: Readonly<Record<string, number>>;
  readonly normalized?: boolean;
  readonly uncertainty?: Readonly<Record<string, DimensionUncertainty>>;
}

/**
 * Immutable vector-based cognitive state at a single point in time.
 * Purely descriptive coordinates — no diagnostic or causal semantics.
 */
export class CognitiveState {
  readonly #space: StateSpace;
  readonly #stateId: string;
  readonly #observedAt: string;
  readonly #coordinates: Readonly<Record<string, number>>;
  readonly #uncertainty: Readonly<Record<string, DimensionUncertainty>>;

  constructor(space: StateSpace, input: CognitiveStateInput) {
    this.#space = space;
    this.#stateId = input.stateId;
    this.#observedAt = input.observedAt;

    const normalizedCoordinates = input.normalized
      ? space.validateNormalizedCoordinates(input.coordinates)
      : space.normalizeCoordinates(input.coordinates);

    this.#coordinates = normalizedCoordinates;
    this.#uncertainty = space.resolveUncertainty(normalizedCoordinates, input.uncertainty);
  }

  get stateId(): string {
    return this.#stateId;
  }

  get observedAt(): string {
    return this.#observedAt;
  }

  get spaceId(): string {
    return this.#space.spaceId;
  }

  get stateSpace(): StateSpace {
    return this.#space;
  }

  dimensionIds(): readonly string[] {
    return this.#space.dimensionIds;
  }

  coordinate(dimensionId: string): number {
    const value = this.#coordinates[dimensionId];
    if (value === undefined) {
      throw new Error(`Unknown dimension "${dimensionId}" in state ${this.#stateId}`);
    }
    return value;
  }

  coordinates(): Readonly<Record<string, number>> {
    return { ...this.#coordinates };
  }

  uncertainty(dimensionId: string): DimensionUncertainty {
    const range = this.#uncertainty[dimensionId];
    if (range === undefined) {
      throw new Error(`Unknown dimension "${dimensionId}" in state ${this.#stateId}`);
    }
    return range;
  }

  uncertainties(): Readonly<Record<string, DimensionUncertainty>> {
    return Object.fromEntries(
      this.#space.dimensionIds.map((id) => [id, { ...this.uncertainty(id) }])
    );
  }

  /** Dense vector ordered by the state space dimension declaration order. */
  toVector(): readonly number[] {
    return this.#space.dimensionIds.map((id) => this.coordinate(id));
  }

  /** Dense uncertainty bounds ordered by dimension declaration order. */
  toUncertaintyVectors(): readonly { lower: number; estimate: number; upper: number }[] {
    return this.#space.dimensionIds.map((id) => this.uncertainty(id));
  }

  serialize(): SerializedCognitiveState {
    return {
      stateId: this.#stateId,
      observedAt: this.#observedAt,
      coordinates: { ...this.#coordinates },
      uncertainty: Object.fromEntries(
        this.#space.dimensionIds.map((id) => [id, this.uncertainty(id)])
      ),
    };
  }
}

export function compareStatesByTime(a: CognitiveState, b: CognitiveState): number {
  return a.observedAt.localeCompare(b.observedAt);
}
