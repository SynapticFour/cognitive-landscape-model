import type { CognitiveState } from '@clm/landscape';
import { uncertaintyFromHalfWidth } from '@clm/landscape';
import type { TransitionModifierOutput } from '@clm/structural';

import { nearestAttractor, settledAttractor, validateAttractor, type AttractorState } from './attractor.js';
import type { FeedbackGraph } from './feedback-graph.js';

export interface TransitionOptions {
  readonly observedAt?: string;
  readonly stateId?: string;
  /** Probabilistic structural modifier applied for this step only. */
  readonly structuralModifier?: TransitionModifierOutput;
}

export interface TransitionEngineConfig {
  /** Scale applied to each influence term per step. */
  readonly stepSize: number;
  /** Inertial damping in [0, 1]; higher values resist change. */
  readonly damping: number;
  /** Pull strength toward the nearest attractor centroid. */
  readonly attractorPull: number;
  /** Maximum coordinate delta considered converged. */
  readonly convergenceEpsilon?: number;
}

const DEFAULT_CONFIG: TransitionEngineConfig = {
  stepSize: 0.15,
  damping: 0.25,
  attractorPull: 0.08,
  convergenceEpsilon: 1e-4,
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function assertEngineConfig(config: TransitionEngineConfig): void {
  if (!(config.stepSize > 0 && config.stepSize <= 1)) {
    throw new RangeError('stepSize must be in (0, 1]');
  }
  if (config.damping < 0 || config.damping >= 1) {
    throw new RangeError('damping must be in [0, 1)');
  }
  if (config.attractorPull < 0 || config.attractorPull > 1) {
    throw new RangeError('attractorPull must be in [0, 1]');
  }
}

/**
 * Computes state-variable transitions driven by a feedback graph and attractor field.
 */
export class TransitionEngine {
  readonly #graph: FeedbackGraph;
  readonly #attractors: AttractorState[];
  readonly #config: TransitionEngineConfig;

  constructor(
    graph: FeedbackGraph,
    attractors: readonly AttractorState[] = [],
    config: Partial<TransitionEngineConfig> = {}
  ) {
    this.#graph = graph;
    this.#config = { ...DEFAULT_CONFIG, ...config };
    assertEngineConfig(this.#config);

    this.#attractors = attractors.map((attractor) => {
      validateAttractor(attractor, graph.dimensionIds);
      return attractor;
    });
  }

  get graph(): FeedbackGraph {
    return this.#graph;
  }

  get attractors(): readonly AttractorState[] {
    return this.#attractors.map((attractor) => ({
      ...attractor,
      centroid: { ...attractor.centroid },
    }));
  }

  get config(): TransitionEngineConfig {
    return { ...this.#config };
  }

  computeDelta(
    current: Readonly<Record<string, number>>,
    history: readonly Readonly<Record<string, number>>[],
    stepIndex: number,
    stepSize: number = this.#config.stepSize
  ): Record<string, number> {
    const delta = Object.fromEntries(this.#graph.dimensionIds.map((id) => [id, 0])) as Record<
      string,
      number
    >;

    for (const edge of this.#graph.edges()) {
      const delay = edge.delaySteps ?? 0;
      const sourceSnapshot =
        delay > 0 && stepIndex - delay >= 0
          ? history[stepIndex - delay]
          : delay > 0
            ? history[0] ?? current
            : current;

      const sourceValue = sourceSnapshot?.[edge.source];
      const targetValue = current[edge.target];
      if (sourceValue === undefined || targetValue === undefined) {
        continue;
      }

      delta[edge.target]! += edge.weight * stepSize * (sourceValue - targetValue);
    }

    for (const loop of this.#graph.loops()) {
      const signal = loop.path.reduce((accumulator, variable, index) => {
        const value = current[variable];
        if (value === undefined) {
          return accumulator;
        }
        const nextVariable = loop.path[(index + 1) % loop.path.length]!;
        const nextValue = current[nextVariable];
        if (nextValue === undefined) {
          return accumulator;
        }
        return accumulator + (value - nextValue);
      }, 0);

      for (const variable of loop.path) {
        delta[variable]! += loop.gain * stepSize * signal / loop.path.length;
      }
    }

    const nearest = nearestAttractor(current, this.#graph.dimensionIds, this.#attractors);
    if (nearest !== undefined) {
      for (const id of this.#graph.dimensionIds) {
        const currentValue = current[id]!;
        const targetValue = nearest.attractor.centroid[id]!;
        delta[id]! += this.#config.attractorPull * stepSize * (targetValue - currentValue);
      }
    }

    return delta;
  }

  applyDelta(
    current: Readonly<Record<string, number>>,
    delta: Readonly<Record<string, number>>,
    damping: number = this.#config.damping
  ): Record<string, number> {
    const next: Record<string, number> = {};
    const mobility = 1 - damping;

    for (const id of this.#graph.dimensionIds) {
      const value = current[id]!;
      const change = delta[id] ?? 0;
      next[id] = clamp01(value + mobility * change);
    }

    return next;
  }

  isConverged(previous: Readonly<Record<string, number>>, next: Readonly<Record<string, number>>): boolean {
    const epsilon = this.#config.convergenceEpsilon ?? DEFAULT_CONFIG.convergenceEpsilon!;
    return this.#graph.dimensionIds.every((id) => Math.abs((next[id] ?? 0) - (previous[id] ?? 0)) <= epsilon);
  }

  transition(
    state: CognitiveState,
    stepIndex: number,
    history: readonly CognitiveState[],
    options?: TransitionOptions
  ): CognitiveState {
    const missing = this.#graph.dimensionIds.filter((id) => !state.dimensionIds().includes(id));
    if (missing.length > 0) {
      throw new Error(`State space missing variables required by graph: ${missing.join(', ')}`);
    }

    const modifier = options?.structuralModifier;
    const stepSize = modifier?.stepSize ?? this.#config.stepSize;
    const damping = modifier?.damping ?? this.#config.damping;

    const current = state.coordinates();
    const coordinateHistory = history.map((item) => item.coordinates());
    const delta = this.computeDelta(current, coordinateHistory, stepIndex, stepSize);
    let nextCoordinates = this.applyDelta(current, delta, damping);

    if (modifier?.dimensionDrift !== undefined) {
      for (const id of this.#graph.dimensionIds) {
        const drift = modifier.dimensionDrift[id] ?? 0;
        nextCoordinates[id] = clamp01(nextCoordinates[id]! + drift);
      }
    }

    const space = state.stateSpace;
    const uncertainty = Object.fromEntries(
      state.dimensionIds().map((id) => {
        const range = state.uncertainty(id);
        const halfWidth = Math.min(0.5, (range.upper - range.lower) / 2 + 0.01);
        return [id, uncertaintyFromHalfWidth(nextCoordinates[id]!, halfWidth, 0, 1)];
      })
    );

    return space.createState({
      stateId: options?.stateId ?? `${state.stateId}::step-${stepIndex + 1}`,
      observedAt: options?.observedAt ?? advanceTimestamp(state.observedAt, 1),
      coordinates: nextCoordinates,
      normalized: true,
      uncertainty,
    });
  }

  settledAttractorFor(state: CognitiveState): AttractorState | undefined {
    return settledAttractor(state.coordinates(), this.#graph.dimensionIds, this.#attractors);
  }
}

function advanceTimestamp(isoTimestamp: string, stepSeconds: number): string {
  const base = Date.parse(isoTimestamp);
  if (Number.isNaN(base)) {
    throw new Error(`Invalid ISO timestamp "${isoTimestamp}"`);
  }
  return new Date(base + stepSeconds * 1000).toISOString();
}

export type { AttractorState };
