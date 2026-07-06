import type { CognitiveState } from '@clm/landscape';
import type { ProbabilisticDynamicsSample, ProbabilisticDynamicsModulator } from '@clm/structural';

import type { AttractorState } from './attractor.js';
import { TransitionEngine, type TransitionOptions } from './transition-engine.js';
import {
  applySampleAsModifier,
  createStructuralRandomSource,
  type StructuralModulationConfig,
} from './structural-modulation.js';

export interface SimulationRunConfig {
  readonly runId: string;
  readonly steps: number;
  readonly initialState: CognitiveState;
  /** ISO timestamp for step 0; defaults to initialState.observedAt. */
  readonly startTime?: string;
  /** Milliseconds between simulated steps when synthesizing timestamps. */
  readonly stepMillis?: number;
  readonly stopOnConvergence?: boolean;
  /** Optional probabilistic structural modulation applied each step. */
  readonly structuralModulation?: StructuralModulationConfig;
}

export interface SimulationRunResult {
  readonly runId: string;
  readonly states: readonly CognitiveState[];
  readonly convergedAtStep: number | null;
  readonly settledAttractorId: string | null;
  /** Structural samples applied per transition step (empty when modulation disabled). */
  readonly structuralSamples: readonly ProbabilisticDynamicsSample[];
}

function assertSimulationConfig(config: SimulationRunConfig): void {
  if (!Number.isInteger(config.steps) || config.steps < 1) {
    throw new RangeError('Simulation steps must be a positive integer');
  }
}

/**
 * Steps a {@link TransitionEngine} forward over discrete time slices.
 */
export class SimulationRunner {
  readonly #engine: TransitionEngine;

  constructor(engine: TransitionEngine) {
    this.#engine = engine;
  }

  get engine(): TransitionEngine {
    return this.#engine;
  }

  run(config: SimulationRunConfig): SimulationRunResult {
    assertSimulationConfig(config);

    const states: CognitiveState[] = [];
    const structuralSamples: ProbabilisticDynamicsSample[] = [];
    const initial = this.#seedInitialState(config);
    states.push(initial);

    const rng = config.structuralModulation
      ? createStructuralRandomSource(config.structuralModulation)
      : undefined;
    const baseConfig = this.#engine.config;

    let convergedAtStep: number | null = null;

    for (let step = 0; step < config.steps; step += 1) {
      const current = states[states.length - 1]!;
      const observedAt =
        config.stepMillis === undefined
          ? undefined
          : advanceByMillis(config.startTime ?? initial.observedAt, (step + 1) * config.stepMillis);

      const transitionOptions: TransitionOptions = {
        stateId: `${config.runId}-t${step + 1}`,
        ...(observedAt !== undefined ? { observedAt } : {}),
        ...(config.structuralModulation !== undefined && rng !== undefined
          ? (() => {
              const sample = config.structuralModulation.modulator.sample(rng);
              structuralSamples.push(sample);
              return {
                structuralModifier: applySampleAsModifier(
                  { stepSize: baseConfig.stepSize, damping: baseConfig.damping },
                  sample
                ),
              };
            })()
          : {}),
      };

      const next = this.#engine.transition(current, step, states, transitionOptions);

      states.push(next);

      if (convergedAtStep === null && this.#engine.isConverged(current.coordinates(), next.coordinates())) {
        convergedAtStep = step + 1;
        if (config.stopOnConvergence) {
          break;
        }
      }
    }

    const finalState = states[states.length - 1]!;
    const settled = this.#engine.settledAttractorFor(finalState);

    return {
      runId: config.runId,
      states,
      convergedAtStep,
      settledAttractorId: settled?.attractorId ?? null,
      structuralSamples,
    };
  }

  #seedInitialState(config: SimulationRunConfig): CognitiveState {
    if (config.startTime === undefined) {
      return config.initialState;
    }

    return this.restamp(config.initialState, `${config.runId}-t0`, config.startTime);
  }

  private restamp(state: CognitiveState, stateId: string, observedAt: string): CognitiveState {
    return state.stateSpace.createState({
      stateId,
      observedAt,
      coordinates: state.coordinates(),
      normalized: true,
      uncertainty: state.uncertainties(),
    });
  }
}

function advanceByMillis(isoTimestamp: string, deltaMillis: number): string {
  const base = Date.parse(isoTimestamp);
  if (Number.isNaN(base)) {
    throw new Error(`Invalid ISO timestamp "${isoTimestamp}"`);
  }
  return new Date(base + deltaMillis).toISOString();
}

export type { AttractorState, ProbabilisticDynamicsModulator };
