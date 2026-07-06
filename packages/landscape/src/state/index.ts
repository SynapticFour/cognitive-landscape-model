export {
  assertDimensionIdsUnique,
  assertUncertaintyRange,
  fullRangeUncertainty,
  normalizeValue,
  uncertaintyFromHalfWidth,
} from './dimension.js';

export type {
  DimensionUncertainty,
  NormalizationSpec,
  StateDimension,
  StateSpaceConfig,
} from './dimension.js';

export { CognitiveState, compareStatesByTime } from './cognitive-state.js';
export type { CognitiveStateInput } from './cognitive-state.js';

export { StateSpace } from './state-space.js';

export {
  TRAJECTORY_FORMAT,
  TRAJECTORY_VERSION,
  deserializeTrajectory,
  serializeTrajectory,
  trajectoryFromJson,
  trajectoryToJson,
} from './serialization.js';

export type {
  DeserializedTrajectory,
  SerializedCognitiveState,
  SerializedDimension,
  SerializedStateSpace,
  SerializedTrajectory,
  SerializeTrajectoryInput,
} from './serialization.js';

export {
  PCMS_STATE_SPACE_ID,
  PCMS_STATE_SPACE_VERSION,
  createCustomStateSpace,
  createPcmsPipelineStateSpace,
  createPcmsStateSpace,
} from './pcms-state-space.js';
