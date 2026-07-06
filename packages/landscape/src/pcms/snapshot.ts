import {
  assertVectorSchema,
  createProvenance,
  type Provenance,
  type UnitInterval,
} from '@clm/core';

import {
  PCMS_DIMENSION_KEYS,
  PCMS_INSTRUMENT_ID,
  PCMS_INSTRUMENT_VERSION,
  PCMS_VECTOR_SCHEMA,
  type PcmsConfidenceVector,
  type PcmsDimensionKey,
  type PcmsProfileVector,
} from './dimensions.js';

/** @deprecated Use {@link CognitiveState} via {@link createPcmsStateSpace} or {@link createPcmsPipelineStateSpace}. */
export interface LandscapeSnapshot {
  readonly snapshotId: string;
  readonly provenance: Provenance;
  readonly profile: PcmsProfileVector;
  readonly confidence: PcmsConfidenceVector;
  readonly questionsAnswered: number;
}

export interface CreateLandscapeSnapshotInput {
  readonly snapshotId: string;
  readonly createdAt: string;
  readonly sessionId?: string;
  readonly profile: PcmsProfileVector;
  readonly confidence: PcmsConfidenceVector;
  readonly questionsAnswered: number;
}

/** @deprecated Use {@link createPcmsStateSpace} and {@link CognitiveState} instead. */
export function createLandscapeSnapshot(input: CreateLandscapeSnapshotInput): LandscapeSnapshot {
  assertVectorSchema(PCMS_VECTOR_SCHEMA, input.profile);
  assertVectorSchema(PCMS_VECTOR_SCHEMA, input.confidence);

  if (!Number.isInteger(input.questionsAnswered) || input.questionsAnswered < 0) {
    throw new RangeError('questionsAnswered must be a non-negative integer');
  }

  const provenance = createProvenance(
    'landscape',
    PCMS_INSTRUMENT_ID,
    PCMS_INSTRUMENT_VERSION,
    input.createdAt,
    input.sessionId
  );

  return {
    snapshotId: input.snapshotId,
    provenance,
    profile: input.profile,
    confidence: input.confidence,
    questionsAnswered: input.questionsAnswered,
  };
}

/** Minimum confidence across all PCMS axes — used by adaptive termination logic. */
export function minConfidence(snapshot: LandscapeSnapshot): UnitInterval {
  let min = snapshot.confidence[PCMS_DIMENSION_KEYS[0]!];
  for (let i = 1; i < PCMS_DIMENSION_KEYS.length; i += 1) {
    const key = PCMS_DIMENSION_KEYS[i]!;
    const value = snapshot.confidence[key];
    if (value < min) {
      min = value;
    }
  }
  return min;
}

export function getProfileCoordinate(
  snapshot: LandscapeSnapshot,
  dimension: PcmsDimensionKey
): UnitInterval {
  return snapshot.profile[dimension];
}
