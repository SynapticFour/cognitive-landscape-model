import { createProvenance, type Provenance, type UnitInterval, unitInterval } from '@clm/core';
import type { LandscapeSnapshot } from '@clm/landscape';

export const LEGACY_DYNAMICS_VERSION = '0.1.0' as const;

/** @deprecated Use {@link FeedbackGraph} and {@link TransitionEngine} with {@link CognitiveState}. */
export interface FeedbackLoopSpec {
  readonly loopId: string;
  readonly source: string;
  readonly target: string;
  readonly coupling: number;
  readonly lagObservations: number;
}

export interface TemporalObservation {
  readonly observedAt: string;
  readonly landscapeSnapshotId: string;
  readonly profile: LandscapeSnapshot['profile'];
}

/** @deprecated Use {@link SimulationRunner} with {@link CognitiveState} trajectories. */
export interface Trajectory {
  readonly trajectoryId: string;
  readonly subjectId: string;
  readonly observations: readonly TemporalObservation[];
}

/** @deprecated Use {@link SimulationRunner} results instead. */
export interface DynamicsSnapshot {
  readonly snapshotId: string;
  readonly provenance: Provenance;
  readonly trajectoryId: string;
  readonly velocities: Record<string, UnitInterval>;
  readonly activeLoops: readonly FeedbackLoopSpec[];
}

export interface CreateDynamicsSnapshotInput {
  readonly snapshotId: string;
  readonly createdAt: string;
  readonly trajectory: Trajectory;
  readonly dimensionIds: readonly string[];
  readonly activeLoops?: readonly FeedbackLoopSpec[];
}

function clampUnitInterval(value: number): UnitInterval {
  return unitInterval(Math.min(1, Math.max(0, value)));
}

export function estimateVelocities(
  trajectory: Trajectory,
  dimensionIds: readonly string[]
): Record<string, UnitInterval> {
  const velocities = Object.fromEntries(dimensionIds.map((id) => [id, unitInterval(0.5)])) as Record<
    string,
    UnitInterval
  >;

  if (trajectory.observations.length < 2) {
    return velocities;
  }

  const prev = trajectory.observations[trajectory.observations.length - 2]!;
  const latest = trajectory.observations[trajectory.observations.length - 1]!;

  for (const id of dimensionIds) {
    const prevValue = prev.profile[id as keyof typeof prev.profile];
    const latestValue = latest.profile[id as keyof typeof latest.profile];
    if (prevValue === undefined || latestValue === undefined) {
      continue;
    }
    const delta = Math.abs(latestValue - prevValue);
    velocities[id] = clampUnitInterval(delta);
  }

  return velocities;
}

/** @deprecated Use {@link SimulationRunner} with {@link CognitiveState}. */
export function createDynamicsSnapshot(input: CreateDynamicsSnapshotInput): DynamicsSnapshot {
  if (input.trajectory.observations.length === 0) {
    throw new Error('Trajectory must contain at least one observation');
  }

  const provenance = createProvenance(
    'dynamics',
    'clm-dynamics-legacy',
    LEGACY_DYNAMICS_VERSION,
    input.createdAt
  );

  return {
    snapshotId: input.snapshotId,
    provenance,
    trajectoryId: input.trajectory.trajectoryId,
    velocities: estimateVelocities(input.trajectory, input.dimensionIds),
    activeLoops: input.activeLoops ?? [],
  };
}

export function appendObservation(trajectory: Trajectory, observation: TemporalObservation): Trajectory {
  return {
    ...trajectory,
    observations: [...trajectory.observations, observation],
  };
}
