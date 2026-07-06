import type { StructuralModel } from '../latent/structural-model.js';
import { CalibrationEngine, type CalibrationResult, type ObservedPattern } from './calibration-engine.js';

export interface StateObservationSource {
  dimensionIds(): readonly string[];
  coordinate(dimensionId: string): number;
  uncertainties(): Readonly<Record<string, { readonly lower: number; readonly upper: number }>>;
}

export interface CognitiveStateCalibrationOptions {
  readonly defaultVariance?: number;
  readonly defaultWeight?: number;
  readonly dimensionFilter?: readonly string[];
}

/**
 * Derives soft calibration observations from any state-like observation source
 * (including {@link CognitiveState} from `@clm/landscape`).
 */
export function observedPatternsFromState(
  state: StateObservationSource,
  options: CognitiveStateCalibrationOptions = {}
): ObservedPattern[] {
  const defaultVariance = options.defaultVariance ?? 0.05;
  const defaultWeight = options.defaultWeight ?? 1;
  const dimensionIds =
    options.dimensionFilter === undefined
      ? state.dimensionIds()
      : state.dimensionIds().filter((id) => options.dimensionFilter!.includes(id));

  return dimensionIds.map((dimensionId) => {
    const coordinate = state.coordinate(dimensionId);
    const uncertainty = state.uncertainties()[dimensionId];
    const halfWidth =
      uncertainty === undefined ? Math.sqrt(defaultVariance) : (uncertainty.upper - uncertainty.lower) / 2;
    const variance = Math.max(halfWidth * halfWidth, 1e-4);

    return {
      dimensionId,
      mean: coordinate,
      variance,
      weight: defaultWeight,
    };
  });
}

export interface CalibrateFromCognitiveStatesInput {
  readonly model: StructuralModel;
  readonly states: readonly StateObservationSource[];
  readonly options?: CognitiveStateCalibrationOptions;
  readonly calibrationOptions?: ConstructorParameters<typeof CalibrationEngine>[1];
}

export interface CalibrateFromCognitiveStatesResult {
  readonly patterns: readonly ObservedPattern[];
  readonly calibration: CalibrationResult;
  readonly calibratedModel: StructuralModel;
}

/**
 * Aggregates one or more state observations into mean observed patterns, then calibrates latent posteriors.
 */
export function calibrateFromCognitiveStates(
  input: CalibrateFromCognitiveStatesInput
): CalibrateFromCognitiveStatesResult {
  if (input.states.length === 0) {
    throw new Error('calibrateFromCognitiveStates requires at least one state observation');
  }

  const perStatePatterns = input.states.map((state) => observedPatternsFromState(state, input.options ?? {}));
  const aggregated = aggregateObservedPatterns(perStatePatterns, input.model.observedDimensionIds);
  const engine = new CalibrationEngine(input.model, input.calibrationOptions);
  const calibration = engine.calibrate(aggregated);

  return {
    patterns: aggregated,
    calibration,
    calibratedModel: engine.applyToModel(calibration),
  };
}

function aggregateObservedPatterns(
  batches: readonly (readonly ObservedPattern[])[],
  dimensionIds: readonly string[]
): ObservedPattern[] {
  return dimensionIds.map((dimensionId) => {
    const samples = batches
      .map((batch) => batch.find((pattern) => pattern.dimensionId === dimensionId))
      .filter((pattern): pattern is ObservedPattern => pattern !== undefined);

    if (samples.length === 0) {
      return { dimensionId, mean: 0.5, variance: 0.05, weight: 0 };
    }

    const weightTotal = samples.reduce((sum, sample) => sum + (sample.weight ?? 1), 0);
    const mean =
      samples.reduce((sum, sample) => sum + sample.mean * (sample.weight ?? 1), 0) / weightTotal;
    const variance =
      samples.reduce((sum, sample) => sum + (sample.variance ?? 0.05) * (sample.weight ?? 1), 0) /
      weightTotal;

    return { dimensionId, mean, variance, weight: weightTotal / samples.length };
  });
}
