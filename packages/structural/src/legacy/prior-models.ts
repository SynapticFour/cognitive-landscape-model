import { createProvenance, type Provenance, type UnitInterval, unitInterval } from '@clm/core';

export const LEGACY_STRUCTURAL_VERSION = '0.1.0' as const;

/** @deprecated Use {@link StructuralModel} latent parameters instead. */
export interface AxisConstraint {
  readonly axisKey: string;
  readonly min: UnitInterval;
  readonly max: UnitInterval;
  readonly softness: UnitInterval;
}

/** @deprecated Use {@link StructuralModel} influence fields instead. */
export interface ConstraintSet {
  readonly constraintSetId: string;
  readonly constraints: readonly AxisConstraint[];
}

/** @deprecated Use {@link StructuralModel} latent parameters instead. */
export interface DevelopmentalParameter {
  readonly parameterId: string;
  readonly label: string;
  readonly value: UnitInterval;
  readonly timescale: 'short' | 'medium' | 'long';
}

/** @deprecated Use {@link StructuralModel} instead. */
export interface DevelopmentalProfile {
  readonly profileId: string;
  readonly parameters: readonly DevelopmentalParameter[];
}

/** @deprecated Use {@link StructuralModel} with {@link CalibrationEngine}. */
export interface StructuralPrior {
  readonly priorId: string;
  readonly axisKeys: readonly string[];
  readonly covariance: readonly (readonly number[])[];
}

/** @deprecated Use {@link StructuralModel} snapshots via calibration results. */
export interface StructuralSnapshot {
  readonly snapshotId: string;
  readonly provenance: Provenance;
  readonly prior: StructuralPrior;
  readonly constraints: ConstraintSet;
  readonly developmental: DevelopmentalProfile;
}

export interface CreateStructuralSnapshotInput {
  readonly snapshotId: string;
  readonly createdAt: string;
  readonly prior: StructuralPrior;
  readonly constraints: ConstraintSet;
  readonly developmental: DevelopmentalProfile;
}

/** @deprecated Use {@link createAbstractStructuralModel} or {@link createPcmsStructuralModel}. */
export function createIdentityPrior(axisKeys: readonly string[], priorId: string): StructuralPrior {
  const covariance = axisKeys.map((_, row) => axisKeys.map((__, col) => (row === col ? 1 : 0)));
  return { priorId, axisKeys, covariance };
}

/** @deprecated Use {@link CalibrationEngine.applyToModel} instead. */
export function createStructuralSnapshot(input: CreateStructuralSnapshotInput): StructuralSnapshot {
  validatePrior(input.prior);

  const provenance = createProvenance(
    'structural',
    'clm-structural-legacy',
    LEGACY_STRUCTURAL_VERSION,
    input.createdAt
  );

  return {
    snapshotId: input.snapshotId,
    provenance,
    prior: input.prior,
    constraints: input.constraints,
    developmental: input.developmental,
  };
}

function validatePrior(prior: StructuralPrior): void {
  const n = prior.axisKeys.length;
  if (prior.covariance.length !== n) {
    throw new Error('Covariance row count must match axisKeys length');
  }
  for (const row of prior.covariance) {
    if (row.length !== n) {
      throw new Error('Covariance must be square');
    }
  }
}

/** @deprecated Use probabilistic influences on {@link StructuralModel}. */
export function defaultWideConstraint(axisKey: string): AxisConstraint {
  return {
    axisKey,
    min: unitInterval(0),
    max: unitInterval(1),
    softness: unitInterval(1),
  };
}
