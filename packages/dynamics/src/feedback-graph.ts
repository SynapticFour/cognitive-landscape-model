export interface InfluenceEdge {
  readonly edgeId: string;
  readonly source: string;
  readonly target: string;
  /** Signed coupling strength in [-1, 1]. */
  readonly weight: number;
  /** Delay before this influence applies, in simulation steps. */
  readonly delaySteps?: number;
}

/**
 * Closed feedback path over state variables.
 * Path must contain at least two distinct variables; the loop is treated as cyclic.
 */
export interface FeedbackLoop {
  readonly loopId: string;
  readonly path: readonly string[];
  /** Loop amplification gain in [-1, 1]. */
  readonly gain: number;
}

export interface FeedbackGraphConfig {
  readonly graphId: string;
  readonly dimensionIds: readonly string[];
  readonly edges?: readonly InfluenceEdge[];
  readonly loops?: readonly FeedbackLoop[];
}

function assertWeight(weight: number, label: string): void {
  if (!Number.isFinite(weight) || weight < -1 || weight > 1) {
    throw new RangeError(`${label} weight must be in [-1, 1], got ${weight}`);
  }
}

function assertKnownDimension(dimensionIds: readonly string[], id: string, label: string): void {
  if (!dimensionIds.includes(id)) {
    throw new Error(`${label} references unknown dimension "${id}"`);
  }
}

/**
 * Directed influence graph over landscape state variables.
 * Describes coupling structure only — no psychological labels.
 */
export class FeedbackGraph {
  readonly #graphId: string;
  readonly #dimensionIds: readonly string[];
  readonly #edges: InfluenceEdge[];
  readonly #loops: FeedbackLoop[];

  private constructor(config: FeedbackGraphConfig) {
    if (config.dimensionIds.length === 0) {
      throw new Error('FeedbackGraph requires at least one dimension id');
    }

    this.#graphId = config.graphId;
    this.#dimensionIds = [...config.dimensionIds];
    this.#edges = [];
    this.#loops = [];

    for (const edge of config.edges ?? []) {
      this.addInfluence(edge);
    }
    for (const loop of config.loops ?? []) {
      this.addLoop(loop);
    }
  }

  static create(config: FeedbackGraphConfig): FeedbackGraph {
    return new FeedbackGraph(config);
  }

  get graphId(): string {
    return this.#graphId;
  }

  get dimensionIds(): readonly string[] {
    return this.#dimensionIds;
  }

  addInfluence(edge: InfluenceEdge): this {
    assertKnownDimension(this.#dimensionIds, edge.source, `Edge ${edge.edgeId}`);
    assertKnownDimension(this.#dimensionIds, edge.target, `Edge ${edge.edgeId}`);
    assertWeight(edge.weight, `Edge ${edge.edgeId}`);
    if (edge.delaySteps !== undefined && (!Number.isInteger(edge.delaySteps) || edge.delaySteps < 0)) {
      throw new RangeError(`Edge ${edge.edgeId} delaySteps must be a non-negative integer`);
    }
    if (this.#edges.some((existing) => existing.edgeId === edge.edgeId)) {
      throw new Error(`Duplicate edge id "${edge.edgeId}"`);
    }
    this.#edges.push({ ...edge });
    return this;
  }

  addLoop(loop: FeedbackLoop): this {
    if (loop.path.length < 2) {
      throw new Error(`Loop ${loop.loopId} path must contain at least two variables`);
    }
    for (const variable of loop.path) {
      assertKnownDimension(this.#dimensionIds, variable, `Loop ${loop.loopId}`);
    }
    assertWeight(loop.gain, `Loop ${loop.loopId}`);
    if (this.#loops.some((existing) => existing.loopId === loop.loopId)) {
      throw new Error(`Duplicate loop id "${loop.loopId}"`);
    }
    this.#loops.push({ path: [...loop.path], loopId: loop.loopId, gain: loop.gain });
    return this;
  }

  edges(): readonly InfluenceEdge[] {
    return this.#edges.map((edge) => ({ ...edge }));
  }

  loops(): readonly FeedbackLoop[] {
    return this.#loops.map((loop) => ({ path: [...loop.path], loopId: loop.loopId, gain: loop.gain }));
  }

  influencesFrom(source: string): readonly InfluenceEdge[] {
    return this.#edges.filter((edge) => edge.source === source);
  }

  influencesTo(target: string): readonly InfluenceEdge[] {
    return this.#edges.filter((edge) => edge.target === target);
  }
}
