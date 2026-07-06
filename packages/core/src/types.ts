/**
 * Branded unit-interval scalar used for all continuous measurement scores.
 * Interpretation layers must treat these as coordinates, not judgments.
 */
export type UnitInterval = number & { readonly __brand: 'UnitInterval' };

export function unitInterval(value: number): UnitInterval {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`Expected value in [0, 1], got ${value}`);
  }
  return value as UnitInterval;
}

export function isUnitInterval(value: number): value is UnitInterval {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

/** Identifies which CLM layer produced an artifact. */
export type LayerId = 'landscape' | 'dynamics' | 'structural' | 'interpretation';

/** Measurement layers never include interpretation content. */
export type MeasurementLayerId = Exclude<LayerId, 'interpretation'>;

/** Semantic version string for instruments and layer implementations. */
export type SemVer = `${number}.${number}.${number}`;

/** Traceability metadata attached to every published snapshot. */
export interface Provenance {
  readonly layer: LayerId;
  readonly instrumentId: string;
  readonly version: SemVer;
  readonly createdAt: string;
  readonly sessionId?: string;
}

export function createProvenance(
  layer: LayerId,
  instrumentId: string,
  version: SemVer,
  createdAt: string,
  sessionId?: string
): Provenance {
  const base: Provenance = {
    layer,
    instrumentId,
    version,
    createdAt,
  };
  return sessionId === undefined ? base : { ...base, sessionId };
}

/**
 * Opaque handles to measurement snapshots from each layer.
 * Interpretation consumes bundles; measurement code never sees interpretation output.
 */
export interface MeasurementBundle {
  readonly bundleId: string;
  readonly createdAt: string;
  readonly landscape: LandscapeMeasurementRef;
  readonly dynamics?: DynamicsMeasurementRef;
  readonly structural?: StructuralMeasurementRef;
}

/** Reference to a landscape-layer snapshot. */
export interface LandscapeMeasurementRef {
  readonly snapshotId: string;
  readonly instrumentId: string;
  readonly dimensionCount: number;
}

export interface DynamicsMeasurementRef {
  readonly snapshotId: string;
  readonly observationCount: number;
}

export interface StructuralMeasurementRef {
  readonly snapshotId: string;
  readonly priorId: string;
}

export function createMeasurementBundle(
  bundleId: string,
  createdAt: string,
  landscape: LandscapeMeasurementRef,
  dynamics?: DynamicsMeasurementRef,
  structural?: StructuralMeasurementRef
): MeasurementBundle {
  const base: MeasurementBundle = {
    bundleId,
    createdAt,
    landscape,
  };
  if (dynamics !== undefined) {
    return structural === undefined
      ? { ...base, dynamics }
      : { ...base, dynamics, structural };
  }
  return structural === undefined ? base : { ...base, structural };
}

/** Axis definition at the measurement level — construct geometry, not narrative. */
export interface MeasurementAxis {
  readonly key: string;
  readonly constructId: string;
  readonly lowPole: string;
  readonly highPole: string;
}

export interface VectorSchema {
  readonly axisKeys: readonly string[];
  readonly domain: 'unit-interval';
}

export function assertVectorSchema(
  schema: VectorSchema,
  values: Readonly<Record<string, number>>
): void {
  for (const key of schema.axisKeys) {
    const value = values[key];
    if (value === undefined) {
      throw new Error(`Missing axis "${key}" in vector`);
    }
    if (!isUnitInterval(value)) {
      throw new RangeError(`Axis "${key}" must be in [0, 1], got ${value}`);
    }
  }
}
