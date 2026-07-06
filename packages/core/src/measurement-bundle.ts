import { createMeasurementBundle, type MeasurementBundle } from './types.js';

export interface TrajectoryMeasurementInput {
  readonly bundleId: string;
  readonly createdAt: string;
  readonly initialStateId: string;
  readonly instrumentId: string;
  readonly dimensionCount: number;
  readonly runId: string;
  readonly stateCount: number;
  readonly structuralModelId?: string;
}

/**
 * Standard cross-layer handoff for interpretation: landscape anchor plus optional dynamics/structural refs.
 */
export function createMeasurementBundleFromTrajectory(
  input: TrajectoryMeasurementInput
): MeasurementBundle {
  const landscape = {
    snapshotId: input.initialStateId,
    instrumentId: input.instrumentId,
    dimensionCount: input.dimensionCount,
  };

  const dynamics = {
    snapshotId: input.runId,
    observationCount: input.stateCount,
  };

  if (input.structuralModelId === undefined) {
    return createMeasurementBundle(input.bundleId, input.createdAt, landscape, dynamics);
  }

  return createMeasurementBundle(input.bundleId, input.createdAt, landscape, dynamics, {
    snapshotId: `${input.runId}-structure`,
    priorId: input.structuralModelId,
  });
}
