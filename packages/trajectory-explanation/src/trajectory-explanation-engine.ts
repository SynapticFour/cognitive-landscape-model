import type { TransitionEngine } from '@clm/dynamics';
import type { SimulationRunResult } from '@clm/dynamics';
import type { StructuralModel } from '@clm/structural';
import type { CognitiveState } from '@clm/landscape';

import { attributeStepTransition, buildInitialConditionLinks } from './attribution.js';
import {
  buildNarrative,
  summarizeFeedbackGraph,
  summarizeInitialConditions,
  summarizeStep,
  summarizeStructuralModel,
} from './narrative.js';
import type {
  CausalLink,
  InitialConditionsSummary,
  TimeStepExplanation,
  TrajectoryExplanation,
  TrajectoryExplanationInput,
} from './types.js';
import {
  TRAJECTORY_EXPLANATION_VERSION,
  buildVariableSnapshots,
  computeVariableChanges,
} from './types.js';

export interface TrajectoryExplanationEngineInput {
  readonly explanationId?: string;
  readonly simulation: SimulationRunResult;
  readonly engine: TransitionEngine;
  readonly structuralModel?: StructuralModel;
}

/**
 * Trajectory Explanation Engine — bridges Landscape (what is) and Dynamics (how it changes).
 * Produces human-readable, time-aware, causal-chain explanations without mutating state data.
 */
export class TrajectoryExplanationEngine {
  explain(input: TrajectoryExplanationEngineInput): TrajectoryExplanation {
    const states = input.simulation.states;
    if (states.length < 1) {
      throw new Error('Trajectory explanation requires at least one cognitive state');
    }

    const initialState = states[0]!;
    const initialConditions = this.#buildInitialConditions(initialState);
    const initialLinks = buildInitialConditionLinks(initialState);

    const timeline: TimeStepExplanation[] = [];
    const transitionLinks: CausalLink[] = [];

    for (let stepIndex = 1; stepIndex < states.length; stepIndex += 1) {
      const previous = states[stepIndex - 1]!;
      const next = states[stepIndex]!;
      const changes = computeVariableChanges(previous, next);
      const causalLinks = attributeStepTransition({
        engine: input.engine,
        graph: input.engine.graph,
        stepIndex: stepIndex - 1,
        previous,
        next,
        history: states.slice(0, stepIndex),
        ...(input.structuralModel !== undefined ? { structuralModel: input.structuralModel } : {}),
      });

      transitionLinks.push(...causalLinks);

      timeline.push({
        stepIndex,
        observedAt: next.observedAt,
        stateId: next.stateId,
        fromStateId: previous.stateId,
        changes,
        causalLinks,
        summary: summarizeStep(stepIndex, next.observedAt, changes, causalLinks),
      });
    }

    const causalChain = [...initialLinks, ...transitionLinks].map((link, index) => ({
      ...link,
      sequence: index + 1,
    }));

    const partialBase = {
      explanationId: input.explanationId ?? `expl-${input.simulation.runId}`,
      runId: input.simulation.runId,
      version: TRAJECTORY_EXPLANATION_VERSION,
      initialConditions,
      feedbackOverview: summarizeFeedbackGraph(input.engine.graph),
      timeline,
      causalChain,
    };

    const partial: Omit<TrajectoryExplanation, 'narrative'> =
      input.structuralModel === undefined
        ? partialBase
        : {
            ...partialBase,
            structuralOverview: summarizeStructuralModel(input.structuralModel),
          };

    return {
      ...partial,
      narrative: buildNarrative(partial),
    };
  }

  explainFromStates(input: TrajectoryExplanationInput & {
    engine: TransitionEngine;
    structuralModel?: StructuralModel;
  }): TrajectoryExplanation {
    return this.explain({
      simulation: {
        runId: input.runId,
        states: input.states,
        convergedAtStep: null,
        settledAttractorId: null,
        structuralSamples: [],
      },
      engine: input.engine,
      ...(input.explanationId !== undefined ? { explanationId: input.explanationId } : {}),
      ...(input.structuralModel !== undefined ? { structuralModel: input.structuralModel } : {}),
    });
  }

  #buildInitialConditions(state: CognitiveState): InitialConditionsSummary {
    const variables = buildVariableSnapshots(state);
    const initialConditions: InitialConditionsSummary = {
      observedAt: state.observedAt,
      stateId: state.stateId,
      variables,
      summary: '',
    };
    return {
      ...initialConditions,
      summary: summarizeInitialConditions(initialConditions),
    };
  }
}

export type { TrajectoryExplanation, TrajectoryExplanationInput };
