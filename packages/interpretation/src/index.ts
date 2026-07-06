export { interpret, getDefaultRegistry, listAvailableWorldviews } from './core/interpreter.js';
export { createNarrativeProvenance } from './core/provenance.js';

export type { InterpretationPlugin, ReadonlyCognitiveState } from './core/plugin.js';
export { assertReadOnlyInput } from './core/plugin.js';

export { WorldviewRegistry, createDefaultRegistry } from './core/registry.js';

export {
  INTERPRETATION_VERSION,
  READ_ONLY_DISCLAIMER,
  WORLDVIEWS,
  formatCoordinatePercent,
  poleLabel,
  type DimensionReading,
  type InterpretOptions,
  type InterpretationNarrative,
  type Worldview,
  type WorldviewId,
} from './core/types.js';

export {
  christianTheologicalPlugin,
  scientificPsychologicalPlugin,
  systemsTheoryPlugin,
} from './plugins/index.js';

export {
  createNeutralWorldviewMapping,
  interpretMeasurement,
  LEGACY_INTERPRETATION_VERSION,
  NEUTRAL_WORLDVIEW_FRAME,
  NON_CAUSAL_DISCLAIMER,
  type FrameCoordinate,
  type FrameDescriptor,
  type InterpretMeasurementInput,
  type InterpretationReading,
  type WorldviewFrame,
  type WorldviewMapping,
} from './legacy/measurement-reading.js';
