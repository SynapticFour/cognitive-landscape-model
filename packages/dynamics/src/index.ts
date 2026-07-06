export {
  FeedbackGraph,
  type FeedbackGraphConfig,
  type FeedbackLoop,
  type InfluenceEdge,
} from './feedback-graph.js';

export {
  matchAttractor,
  nearestAttractor,
  settledAttractor,
  validateAttractor,
  type AttractorMatch,
  type AttractorState,
} from './attractor.js';

export { TransitionEngine, type TransitionEngineConfig } from './transition-engine.js';

export { SimulationRunner, type SimulationRunConfig, type SimulationRunResult } from './simulation-runner.js';

export {
  applySampleAsModifier,
  createStructuralRandomSource,
  type StructuralModulationConfig,
} from './structural-modulation.js';

export {
  appendObservation,
  createDynamicsSnapshot,
  estimateVelocities,
  LEGACY_DYNAMICS_VERSION,
  type CreateDynamicsSnapshotInput,
  type DynamicsSnapshot,
  type FeedbackLoopSpec,
  type TemporalObservation,
  type Trajectory,
} from './legacy/observation-trajectory.js';

/** Primary dynamics package version for simulated transition models. */
export const DYNAMICS_VERSION = '0.2.0' as const;
