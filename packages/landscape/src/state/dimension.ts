import type { SemVer } from '@clm/core';

/** Maps raw instrument values into a continuous output interval. */
export interface NormalizationSpec {
  readonly inputMin: number;
  readonly inputMax: number;
  readonly outputMin: number;
  readonly outputMax: number;
}

/** Continuous uncertainty bounds for one dimension (normalized output space). */
export interface DimensionUncertainty {
  readonly estimate: number;
  readonly lower: number;
  readonly upper: number;
}

/** Configurable axis — descriptive geometry only, no diagnostic labels. */
export interface StateDimension {
  readonly id: string;
  readonly constructId: string;
  readonly description?: string;
  readonly normalization: NormalizationSpec;
  /** Descriptive pole identifiers (e.g. construct endpoints), not pathology. */
  readonly lowPole?: string;
  readonly highPole?: string;
}

export interface StateSpaceConfig {
  readonly spaceId: string;
  readonly instrumentId: string;
  readonly version: SemVer;
  readonly dimensions: readonly StateDimension[];
}

export function normalizeValue(value: number, spec: NormalizationSpec): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(`Cannot normalize non-finite value: ${value}`);
  }
  if (spec.inputMax === spec.inputMin) {
    throw new RangeError('Normalization inputMin and inputMax must differ');
  }

  const scaled = (value - spec.inputMin) / (spec.inputMax - spec.inputMin);
  const clamped = Math.min(1, Math.max(0, scaled));
  return spec.outputMin + clamped * (spec.outputMax - spec.outputMin);
}

export function assertDimensionIdsUnique(dimensions: readonly StateDimension[]): void {
  const seen = new Set<string>();
  for (const dimension of dimensions) {
    if (dimension.id.trim() === '') {
      throw new Error('Dimension id must be a non-empty string');
    }
    if (seen.has(dimension.id)) {
      throw new Error(`Duplicate dimension id "${dimension.id}"`);
    }
    seen.add(dimension.id);
  }
}

export function assertUncertaintyRange(
  uncertainty: DimensionUncertainty,
  outputMin: number,
  outputMax: number
): void {
  const { estimate, lower, upper } = uncertainty;
  if (!Number.isFinite(estimate) || !Number.isFinite(lower) || !Number.isFinite(upper)) {
    throw new RangeError('Uncertainty values must be finite numbers');
  }
  if (lower > upper) {
    throw new RangeError(`Uncertainty lower (${lower}) must be <= upper (${upper})`);
  }
  if (estimate < lower || estimate > upper) {
    throw new RangeError(`Estimate (${estimate}) must lie within [${lower}, ${upper}]`);
  }
  if (lower < outputMin || upper > outputMax) {
    throw new RangeError(
      `Uncertainty range [${lower}, ${upper}] exceeds output domain [${outputMin}, ${outputMax}]`
    );
  }
}

/** Maximum epistemic uncertainty on the output domain when no evidence exists. */
export function fullRangeUncertainty(outputMin: number, outputMax: number): DimensionUncertainty {
  const midpoint = (outputMin + outputMax) / 2;
  return { estimate: midpoint, lower: outputMin, upper: outputMax };
}

export function uncertaintyFromHalfWidth(
  estimate: number,
  halfWidth: number,
  outputMin: number,
  outputMax: number
): DimensionUncertainty {
  const lower = Math.max(outputMin, estimate - halfWidth);
  const upper = Math.min(outputMax, estimate + halfWidth);
  return { estimate, lower, upper };
}
