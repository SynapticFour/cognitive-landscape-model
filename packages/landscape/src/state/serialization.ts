import { compareStatesByTime, CognitiveState } from './cognitive-state.js';
import type { DimensionUncertainty, NormalizationSpec, StateDimension, StateSpaceConfig } from './dimension.js';
import { StateSpace } from './state-space.js';

export const TRAJECTORY_FORMAT = 'clm-landscape-trajectory' as const;
export const TRAJECTORY_VERSION = '1.0.0' as const;

export interface SerializedDimension extends StateDimension {}

export interface SerializedStateSpace {
  readonly spaceId: string;
  readonly instrumentId: string;
  readonly version: string;
  readonly dimensions: readonly SerializedDimension[];
}

export interface SerializedCognitiveState {
  readonly stateId: string;
  readonly observedAt: string;
  readonly coordinates: Readonly<Record<string, number>>;
  readonly uncertainty: Readonly<Record<string, DimensionUncertainty>>;
}

export interface SerializedTrajectory {
  readonly format: typeof TRAJECTORY_FORMAT;
  readonly version: typeof TRAJECTORY_VERSION;
  readonly trajectoryId: string;
  readonly subjectId: string;
  readonly stateSpace: SerializedStateSpace;
  readonly snapshots: readonly SerializedCognitiveState[];
}

export interface SerializeTrajectoryInput {
  readonly trajectoryId: string;
  readonly subjectId: string;
  readonly space: StateSpace;
  readonly states: readonly CognitiveState[];
}

export interface DeserializedTrajectory {
  readonly trajectoryId: string;
  readonly subjectId: string;
  readonly space: StateSpace;
  readonly states: readonly CognitiveState[];
}

function serializeStateSpace(space: StateSpace): SerializedStateSpace {
  return {
    spaceId: space.spaceId,
    instrumentId: space.instrumentId,
    version: space.version,
    dimensions: space.dimensions.map((dimension) => ({ ...dimension })),
  };
}

function assertTrajectoryPayload(payload: SerializedTrajectory): void {
  if (payload.format !== TRAJECTORY_FORMAT) {
    throw new Error(`Unsupported trajectory format "${payload.format}"`);
  }
  if (payload.version !== TRAJECTORY_VERSION) {
    throw new Error(`Unsupported trajectory version "${payload.version}"`);
  }
  if (payload.snapshots.length === 0) {
    throw new Error('Trajectory must contain at least one snapshot');
  }
}

export function serializeTrajectory(input: SerializeTrajectoryInput): SerializedTrajectory {
  const snapshots = [...input.states]
    .sort(compareStatesByTime)
    .map((state) => state.serialize());

  for (const state of input.states) {
    if (state.spaceId !== input.space.spaceId) {
      throw new Error(
        `State ${state.stateId} belongs to space ${state.spaceId}, expected ${input.space.spaceId}`
      );
    }
  }

  return {
    format: TRAJECTORY_FORMAT,
    version: TRAJECTORY_VERSION,
    trajectoryId: input.trajectoryId,
    subjectId: input.subjectId,
    stateSpace: serializeStateSpace(input.space),
    snapshots,
  };
}

export function deserializeTrajectory(payload: SerializedTrajectory): DeserializedTrajectory {
  assertTrajectoryPayload(payload);

  const space = StateSpace.define({
    spaceId: payload.stateSpace.spaceId,
    instrumentId: payload.stateSpace.instrumentId,
    version: payload.stateSpace.version as StateSpaceConfig['version'],
    dimensions: payload.stateSpace.dimensions,
  });

  const states = payload.snapshots.map((snapshot) =>
    space.createState({
      stateId: snapshot.stateId,
      observedAt: snapshot.observedAt,
      coordinates: snapshot.coordinates,
      normalized: true,
      uncertainty: snapshot.uncertainty,
    })
  );

  return {
    trajectoryId: payload.trajectoryId,
    subjectId: payload.subjectId,
    space,
    states,
  };
}

export function trajectoryToJson(payload: SerializedTrajectory): string {
  return JSON.stringify(payload, null, 2);
}

export function trajectoryFromJson(json: string): DeserializedTrajectory {
  const parsed = JSON.parse(json) as SerializedTrajectory;
  return deserializeTrajectory(parsed);
}

export type { NormalizationSpec };
