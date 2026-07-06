import type { Provenance, SemVer, MeasurementBundle } from '@clm/core';

export const INTERPRETATION_VERSION = '0.2.0' as const satisfies SemVer;

export const READ_ONLY_DISCLAIMER =
  'Interpretation is a read-only worldview mapping. It does not modify, score, diagnose, or causally explain the underlying state.';

export type WorldviewId =
  | 'scientific-psychological'
  | 'systems-theory'
  | 'christian-theological';

export interface Worldview {
  readonly id: WorldviewId;
  readonly name: string;
  readonly description: string;
}

export interface DimensionReading {
  readonly dimensionId: string;
  readonly constructId: string;
  readonly coordinate: number;
  readonly uncertaintyLower: number;
  readonly uncertaintyUpper: number;
  readonly reading: string;
}

/** Narrative output produced by interpret(state, worldview). */
export interface InterpretationNarrative {
  readonly narrativeId: string;
  readonly worldviewId: WorldviewId;
  readonly disclaimer: string;
  readonly headline: string;
  readonly summary: string;
  readonly dimensionReadings: readonly DimensionReading[];
  readonly closingNote: string;
  readonly provenance: Provenance;
  /** Optional cross-layer measurement context when supplied by the caller. */
  readonly measurementContext?: MeasurementBundle;
}

export interface InterpretOptions {
  readonly narrativeId?: string;
  readonly createdAt?: string;
  /** Optional measurement bundle linking landscape, dynamics, and structural refs. */
  readonly measurementBundle?: MeasurementBundle;
}

export const WORLDVIEWS: Record<WorldviewId, Worldview> = {
  'scientific-psychological': {
    id: 'scientific-psychological',
    name: 'Scientific / psychological frame',
    description:
      'Reads coordinates as correlational construct continua for research and self-reflection — not diagnosis.',
  },
  'systems-theory': {
    id: 'systems-theory',
    name: 'Systems theory frame',
    description:
      'Reads coordinates as interacting variables within coupled subsystems, feedback, and equilibria.',
  },
  'christian-theological': {
    id: 'christian-theological',
    name: 'Christian theological frame (optional)',
    description:
      'Reads coordinates through an anthropological lens of finitude, vocation, and wisdom — without causal claims.',
  },
};

export function poleLabel(lowPole: string | undefined, highPole: string | undefined, coordinate: number): {
  toward: 'low' | 'mid' | 'high';
  label: string;
} {
  if (coordinate < 0.35) {
    return { toward: 'low', label: lowPole ?? 'lower pole' };
  }
  if (coordinate > 0.65) {
    return { toward: 'high', label: highPole ?? 'upper pole' };
  }
  return { toward: 'mid', label: 'middle region of the continuum' };
}

export function formatCoordinatePercent(coordinate: number): string {
  return `${Math.round(coordinate * 100)}%`;
}
