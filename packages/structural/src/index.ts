export {
  StructuralModel,
  type LatentParameter,
  type LatentParameterPosterior,
  type LatentParameterPrior,
  type ProbabilisticInfluence,
  type StructuralModelConfig,
} from './latent/structural-model.js';

export {
  validateLatentParameter,
  withPosterior,
} from './latent/latent-parameter.js';

export {
  assertManyToManyStructure,
  validateInfluence,
} from './latent/influence-field.js';

export {
  CalibrationEngine,
  type CalibrationOptions,
  type CalibrationResult,
  type ObservedPattern,
} from './calibration/calibration-engine.js';

export {
  calibrateFromCognitiveStates,
  observedPatternsFromState,
  type CalibrateFromCognitiveStatesInput,
  type CalibrateFromCognitiveStatesResult,
  type CognitiveStateCalibrationOptions,
  type StateObservationSource,
} from './calibration/cognitive-state-calibration.js';

export {
  ProbabilisticDynamicsModulator,
  applyStructuralInfluence,
  type DynamicsModulatorConfig,
  type ParameterDynamicsRole,
  type ProbabilisticDynamicsSample,
  type RandomSource,
  type TransitionModifierInput,
  type TransitionModifierOutput,
} from './dynamics/probabilistic-modulator.js';

export {
  ABSTRACT_OBSERVED_DIMENSIONS,
  ABSTRACT_STRUCTURAL_MODEL_ID,
  abstractParameterDynamicsRoles,
  createAbstractStructuralModel,
} from './presets/abstract-parameter-set.js';

export {
  PCMS_OBSERVED_DIMENSIONS,
  PCMS_STRUCTURAL_MODEL_ID,
  createPcmsStructuralModel,
  pcmsParameterDynamicsRoles,
  type PcmsObservedDimension,
} from './presets/pcms-parameter-set.js';

export { clampUnit, createSeededRandom, sampleNormal, sampleStandardNormal } from './random.js';

export {
  createIdentityPrior,
  createStructuralSnapshot,
  defaultWideConstraint,
  LEGACY_STRUCTURAL_VERSION,
  type AxisConstraint,
  type ConstraintSet,
  type CreateStructuralSnapshotInput,
  type DevelopmentalParameter,
  type DevelopmentalProfile,
  type StructuralPrior,
  type StructuralSnapshot,
} from './legacy/prior-models.js';

/** Primary structural package version for latent constraint models. */
export const STRUCTURAL_VERSION = '0.2.0' as const;
