/**
 * Adapter boundary for the production PCMS scoring pipeline.
 * Maps external session output into CLM landscape snapshots without interpretation.
 */

import { unitInterval } from '@clm/core';

import { PCMS_DIMENSION_KEYS, type PcmsConfidenceVector, type PcmsProfileVector } from './dimensions.js';
import { createLandscapeSnapshot, type LandscapeSnapshot } from './snapshot.js';

/** Shape emitted by PCMS buildCognitiveModel routing scores (0–100 percent). */
export interface PcmsPipelineOutput {
  readonly sessionId: string;
  readonly snapshotId: string;
  readonly createdAt: string;
  readonly routingScoresPercent: Record<string, number>;
  readonly routingConfidencePercent: Record<string, number>;
  readonly questionsAnswered: number;
}

function percentToUnitInterval(percent: number, label: string): number {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new RangeError(`${label} must be in [0, 100], got ${percent}`);
  }
  return percent / 100;
}

function buildVectorFromPercent(
  source: Record<string, number>,
  label: string
): PcmsProfileVector | PcmsConfidenceVector {
  const vector = {} as PcmsProfileVector;
  for (const key of PCMS_DIMENSION_KEYS) {
    const percent = source[key];
    if (percent === undefined) {
      throw new Error(`PCMS pipeline output missing dimension "${key}" in ${label}`);
    }
    vector[key] = unitInterval(percentToUnitInterval(percent, `${label}.${key}`));
  }
  return vector;
}

export function landscapeSnapshotFromPcmsPipeline(output: PcmsPipelineOutput): LandscapeSnapshot {
  return createLandscapeSnapshot({
    snapshotId: output.snapshotId,
    createdAt: output.createdAt,
    sessionId: output.sessionId,
    profile: buildVectorFromPercent(output.routingScoresPercent, 'routingScoresPercent'),
    confidence: buildVectorFromPercent(output.routingConfidencePercent, 'routingConfidencePercent'),
    questionsAnswered: output.questionsAnswered,
  });
}
