/**
 * PCMS routing dimensions — continuous measurement axes only.
 * Aligned with perceptual-cognitive-mapping-system/src/model/cognitive-dimensions.ts
 */

import type { MeasurementAxis, UnitInterval, VectorSchema } from '@clm/core';
import { unitInterval } from '@clm/core';

export const PCMS_DIMENSION_KEYS = ['F', 'P', 'S', 'E', 'R', 'C', 'T', 'I', 'A', 'V'] as const;

export type PcmsDimensionKey = (typeof PCMS_DIMENSION_KEYS)[number];

export const PCMS_PRIMARY_KEYS = ['F', 'P', 'S', 'E', 'R', 'C'] as const satisfies readonly PcmsDimensionKey[];

export const PCMS_RESEARCH_KEYS = ['T', 'I', 'A', 'V'] as const satisfies readonly PcmsDimensionKey[];

export type PcmsProfileVector = Record<PcmsDimensionKey, UnitInterval>;

export type PcmsConfidenceVector = Record<PcmsDimensionKey, UnitInterval>;

export const PCMS_VECTOR_SCHEMA: VectorSchema = {
  axisKeys: PCMS_DIMENSION_KEYS,
  domain: 'unit-interval',
};

export const PCMS_INSTRUMENT_ID = 'pcms' as const;
export const PCMS_INSTRUMENT_VERSION = '0.1.0' as const;

/** Neutral posterior — no evidence accumulated. */
export const NEUTRAL_PCMS_PROFILE: PcmsProfileVector = Object.fromEntries(
  PCMS_DIMENSION_KEYS.map((key) => [key, unitInterval(0.5)])
) as PcmsProfileVector;

/** Zero confidence before any weighted evidence. */
export const ZERO_PCMS_CONFIDENCE: PcmsConfidenceVector = Object.fromEntries(
  PCMS_DIMENSION_KEYS.map((key) => [key, unitInterval(0)])
) as PcmsConfidenceVector;

export const PCMS_AXIS_DEFINITIONS: Record<PcmsDimensionKey, MeasurementAxis> = {
  F: {
    key: 'F',
    constructId: 'focus-intensity',
    lowPole: 'easily-redirected',
    highPole: 'sustained-deep-focus',
  },
  P: {
    key: 'P',
    constructId: 'pattern-processing',
    lowPole: 'concrete-sequential',
    highPole: 'abstract-pattern-detection',
  },
  S: {
    key: 'S',
    constructId: 'sensory-sensitivity',
    lowPole: 'low-sensory-reactivity',
    highPole: 'high-sensory-reactivity',
  },
  E: {
    key: 'E',
    constructId: 'social-energy',
    lowPole: 'energised-by-groups',
    highPole: 'drained-by-prolonged-contact',
  },
  R: {
    key: 'R',
    constructId: 'structure-preference',
    lowPole: 'flexible-improvising',
    highPole: 'strong-routine-preference',
  },
  C: {
    key: 'C',
    constructId: 'cognitive-flexibility',
    lowPole: 'prefers-stable-answers',
    highPole: 'comfortable-with-ambiguity',
  },
  T: {
    key: 'T',
    constructId: 'temporal-processing',
    lowPole: 'time-forgetting-in-the-moment',
    highPole: 'highly-precise-time-sense',
  },
  I: {
    key: 'I',
    constructId: 'interoceptive-awareness',
    lowPole: 'low-body-signal-awareness',
    highPole: 'high-body-signal-awareness',
  },
  A: {
    key: 'A',
    constructId: 'associative-thinking',
    lowPole: 'linear-convergent',
    highPole: 'divergent-far-reaching',
  },
  V: {
    key: 'V',
    constructId: 'verbal-visual-bias',
    lowPole: 'verbal-sequential',
    highPole: 'visuo-spatial-holistic',
  },
};

export function isPcmsDimensionKey(value: string): value is PcmsDimensionKey {
  return (PCMS_DIMENSION_KEYS as readonly string[]).includes(value);
}
