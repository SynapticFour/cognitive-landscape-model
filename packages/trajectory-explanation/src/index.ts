export { TrajectoryExplanationEngine } from './trajectory-explanation-engine.js';
export type {
  TrajectoryExplanationEngineInput,
  TrajectoryExplanation,
  TrajectoryExplanationInput,
} from './trajectory-explanation-engine.js';

export { attributeStepTransition, buildInitialConditionLinks } from './attribution.js';
export type { StepAttributionInput } from './attribution.js';

export {
  buildNarrative,
  summarizeChanges,
  summarizeFeedbackGraph,
  summarizeInitialConditions,
  summarizeStep,
  summarizeStructuralModel,
} from './narrative.js';

export {
  TRAJECTORY_EXPLANATION_VERSION,
  buildVariableSnapshots,
  computeVariableChanges,
  formatPercent,
  formatTimestamp,
  type CausalLink,
  type CausalLinkType,
  type InitialConditionsSummary,
  type TimeStepExplanation,
  type VariableChange,
  type VariableSnapshot,
} from './types.js';
