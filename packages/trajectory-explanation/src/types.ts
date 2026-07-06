import type { CognitiveState } from '@clm/landscape';

export const TRAJECTORY_EXPLANATION_VERSION = '0.1.0' as const;

export type CausalLinkType =
  | 'initial-condition'
  | 'feedback-edge'
  | 'feedback-loop'
  | 'structural-constraint'
  | 'attractor-pull'
  | 'damping';

export interface CausalLink {
  readonly sequence: number;
  readonly stepIndex: number;
  readonly observedAt: string;
  readonly linkType: CausalLinkType;
  readonly causeId: string;
  readonly sourceVariable?: string;
  readonly targetVariable?: string;
  readonly magnitude: number;
  readonly description: string;
}

export interface VariableSnapshot {
  readonly variableId: string;
  readonly value: number;
  readonly uncertaintyLower: number;
  readonly uncertaintyUpper: number;
}

export interface VariableChange {
  readonly variableId: string;
  readonly from: number;
  readonly to: number;
  readonly delta: number;
}

export interface InitialConditionsSummary {
  readonly observedAt: string;
  readonly stateId: string;
  readonly variables: readonly VariableSnapshot[];
  readonly summary: string;
}

export interface TimeStepExplanation {
  readonly stepIndex: number;
  readonly observedAt: string;
  readonly stateId: string;
  readonly fromStateId: string;
  readonly changes: readonly VariableChange[];
  readonly causalLinks: readonly CausalLink[];
  readonly summary: string;
}

export interface TrajectoryExplanation {
  readonly explanationId: string;
  readonly runId: string;
  readonly version: typeof TRAJECTORY_EXPLANATION_VERSION;
  readonly initialConditions: InitialConditionsSummary;
  readonly feedbackOverview: string;
  readonly structuralOverview?: string;
  readonly timeline: readonly TimeStepExplanation[];
  readonly causalChain: readonly CausalLink[];
  readonly narrative: string;
}

export interface TrajectoryExplanationInput {
  readonly explanationId?: string;
  readonly states: readonly CognitiveState[];
  readonly runId: string;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 1000) / 10}%`;
}

export function formatTimestamp(iso: string): string {
  return iso.replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
}

export function buildVariableSnapshots(state: CognitiveState): VariableSnapshot[] {
  return state.dimensionIds().map((variableId) => {
    const uncertainty = state.uncertainty(variableId);
    return {
      variableId,
      value: state.coordinate(variableId),
      uncertaintyLower: uncertainty.lower,
      uncertaintyUpper: uncertainty.upper,
    };
  });
}

export function computeVariableChanges(previous: CognitiveState, next: CognitiveState): VariableChange[] {
  return previous.dimensionIds().map((variableId) => {
    const from = previous.coordinate(variableId);
    const to = next.coordinate(variableId);
    return { variableId, from, to, delta: to - from };
  });
}
