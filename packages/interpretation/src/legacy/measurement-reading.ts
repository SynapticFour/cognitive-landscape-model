import { createProvenance, type Provenance } from '@clm/core';
import type { DynamicsSnapshot } from '@clm/dynamics';
import type { LandscapeSnapshot, PcmsDimensionKey } from '@clm/landscape';
import type { StructuralSnapshot } from '@clm/structural';

export const LEGACY_INTERPRETATION_VERSION = '0.1.0' as const;

export const NON_CAUSAL_DISCLAIMER =
  'This reading maps coordinates into a worldview frame. It does not explain causes, assign labels, or imply pathology.';

export interface WorldviewFrame {
  readonly frameId: string;
  readonly name: string;
  readonly description: string;
  readonly axisLabels: Partial<Record<PcmsDimensionKey, { low: string; high: string }>>;
}

export interface WorldviewMapping {
  readonly mappingId: string;
  readonly frame: WorldviewFrame;
  mapLandscape(snapshot: LandscapeSnapshot): FrameCoordinate[];
  mapDynamics?(snapshot: DynamicsSnapshot): FrameDescriptor[];
}

export interface FrameCoordinate {
  readonly dimension: PcmsDimensionKey;
  readonly measured: number;
  readonly frameLow: string;
  readonly frameHigh: string;
  readonly relativePosition: number;
}

export interface FrameDescriptor {
  readonly descriptorId: string;
  readonly text: string;
}

export interface InterpretationReading {
  readonly readingId: string;
  readonly provenance: Provenance;
  readonly frameId: string;
  readonly disclaimer: string;
  readonly coordinates: readonly FrameCoordinate[];
  readonly descriptors: readonly FrameDescriptor[];
}

export interface InterpretMeasurementInput {
  readonly readingId: string;
  readonly createdAt: string;
  readonly mapping: WorldviewMapping;
  readonly landscape: LandscapeSnapshot;
  readonly dynamics?: DynamicsSnapshot;
  readonly structural?: StructuralSnapshot;
}

/** @deprecated Use {@link interpret} with {@link CognitiveState} instead. */
export function interpretMeasurement(input: InterpretMeasurementInput): InterpretationReading {
  const coordinates = input.mapping.mapLandscape(input.landscape);
  const dynamicDescriptors = input.mapping.mapDynamics?.(input.dynamics!) ?? [];
  const structuralDescriptors =
    input.structural === undefined
      ? []
      : [
          {
            descriptorId: 'structural-context',
            text: `Structural prior "${input.structural.prior.priorId}" supplied as background geometry only.`,
          },
        ];

  const provenance = createProvenance(
    'interpretation',
    input.mapping.mappingId,
    LEGACY_INTERPRETATION_VERSION,
    input.createdAt
  );

  return {
    readingId: input.readingId,
    provenance,
    frameId: input.mapping.frame.frameId,
    disclaimer: NON_CAUSAL_DISCLAIMER,
    coordinates,
    descriptors: [...dynamicDescriptors, ...structuralDescriptors],
  };
}

export const NEUTRAL_WORLDVIEW_FRAME: WorldviewFrame = {
  frameId: 'neutral-spectrum',
  name: 'Neutral spectrum frame',
  description: 'Reads each axis as a non-judgmental continuum between two poles.',
  axisLabels: {},
};

export function createNeutralWorldviewMapping(mappingId: string): WorldviewMapping {
  return {
    mappingId,
    frame: NEUTRAL_WORLDVIEW_FRAME,
    mapLandscape(snapshot) {
      return (Object.keys(snapshot.profile) as PcmsDimensionKey[]).map((dimension) => {
        const measured = snapshot.profile[dimension];
        return {
          dimension,
          measured,
          frameLow: `${dimension}-low`,
          frameHigh: `${dimension}-high`,
          relativePosition: measured,
        };
      });
    },
  };
}
