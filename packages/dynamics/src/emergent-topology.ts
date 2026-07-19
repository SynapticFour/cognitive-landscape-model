/**
 * Emergent topology derivation from structural models and feedback dynamics.
 *
 * Specification source:
 * https://github.com/SynapticFour/cognitive-landscape-research-programme/blob/main/research-notes/CLRP-RN-2026-001-emergent-topology-derivation.md
 * (commit 8364ba307e05492a965ca2f6efe42ba105a767e0 at implementation time)
 *
 * Companion to CLRP-010 §2 in the Cognitive Landscape Research Programme.
 *
 * CLM extension (not in CLRP-RN-2026-001): optional `minClusterSupport` on
 * {@link TopologySamplingConfig} sets the minimum number of converged
 * relaxations required before a cluster becomes an {@link EmergentAttractor}.
 * The research note only sketches a support threshold without exposing it in
 * config; this field is a later CLM-side refinement. Default remains 1.
 */
import { StateSpace } from '@clm/landscape';
import type { StructuralModel } from '@clm/structural';
import {
  ABSTRACT_STRUCTURAL_MODEL_ID,
  PCMS_STRUCTURAL_MODEL_ID,
  abstractParameterDynamicsRoles,
  createSeededRandom,
  pcmsParameterDynamicsRoles,
  sampleNormal,
  type ParameterDynamicsRole,
  type ProbabilisticDynamicsSample,
  type RandomSource,
  type TransitionModifierOutput,
} from '@clm/structural';

import { euclideanDistance, type AttractorState } from './attractor.js';
import type { FeedbackGraph } from './feedback-graph.js';
import { applySampleAsModifier } from './structural-modulation.js';
import { TransitionEngine } from './transition-engine.js';

export interface TopologySamplingConfig {
  readonly structuralModel: StructuralModel;
  readonly feedbackGraph: FeedbackGraph;
  readonly dimensionIds: readonly string[];
  /** Number of independent latent-parameter draws to simulate. */
  readonly sampleCount: number;
  /** Initial observed-state seeds to relax forward under the dynamics, per sample. */
  readonly seedStates: readonly Readonly<Record<string, number>>[];
  readonly convergenceSteps: number;
  readonly convergenceTolerance: number;
  /** Max distance between two converged points for them to count as the same attractor. */
  readonly clusterRadius: number;
  /**
   * Minimum converged relaxations required for a cluster to become an attractor.
   * Defaults to 1 when omitted.
   */
  readonly minClusterSupport?: number;
  readonly random?: RandomSource;
}

export interface EmergentAttractor extends AttractorState {
  /** Fraction of (sample x seed) relaxations that converged into this cluster. */
  readonly basinSupport: number;
  /** Range of latent-parameter draws associated with samples converging here — for interpretability, not causal attribution to a single parameter. */
  readonly structuralParameterRanges: Readonly<Record<string, { min: number; max: number }>>;
}

export interface EmergentTopology {
  readonly attractors: readonly EmergentAttractor[];
  /** Fraction of relaxations that did not converge or did not join any sufficiently supported cluster. */
  readonly unclassifiedFraction: number;
  readonly sampleCount: number;
}

interface RelaxationOutcome {
  readonly converged: boolean;
  readonly coordinates: Readonly<Record<string, number>>;
  readonly latentDraws: Readonly<Record<string, number>>;
}

interface ClusterAccumulator {
  members: RelaxationOutcome[];
}

const DEFAULT_RANDOM_SEED = 42;
const DEFAULT_STEP_SIZE = 0.15;
const DEFAULT_DAMPING = 0.25;
const DEFAULT_MIN_CLUSTER_SUPPORT = 1;

function resolveDynamicsRoles(model: StructuralModel): readonly ParameterDynamicsRole[] {
  if (model.modelId === PCMS_STRUCTURAL_MODEL_ID) {
    return pcmsParameterDynamicsRoles();
  }
  if (model.modelId === ABSTRACT_STRUCTURAL_MODEL_ID) {
    return abstractParameterDynamicsRoles();
  }

  return model.parameters.map((parameter) => ({
    parameterId: parameter.parameterId,
    stepSizeSensitivity: 0.4,
    dampingSensitivity: -0.2,
    driftSensitivity: 0.4,
  }));
}

function assertTopologySamplingConfig(config: TopologySamplingConfig): void {
  if (!Number.isInteger(config.sampleCount) || config.sampleCount < 1) {
    throw new RangeError('sampleCount must be a positive integer');
  }
  if (!Number.isInteger(config.convergenceSteps) || config.convergenceSteps < 1) {
    throw new RangeError('convergenceSteps must be a positive integer');
  }
  if (!(config.convergenceTolerance > 0)) {
    throw new RangeError('convergenceTolerance must be > 0');
  }
  if (!(config.clusterRadius > 0)) {
    throw new RangeError('clusterRadius must be > 0');
  }
  if (config.minClusterSupport !== undefined) {
    if (!Number.isInteger(config.minClusterSupport) || config.minClusterSupport < 1) {
      throw new RangeError('minClusterSupport must be a positive integer');
    }
  }
  if (config.seedStates.length === 0) {
    throw new Error('seedStates must contain at least one initial state');
  }
  if (config.dimensionIds.length === 0) {
    throw new Error('dimensionIds must contain at least one dimension id');
  }

  const graphDimensions = config.feedbackGraph.dimensionIds;
  for (const id of config.dimensionIds) {
    if (!graphDimensions.includes(id)) {
      throw new Error(`dimensionIds entry "${id}" is not declared on feedbackGraph`);
    }
    if (!config.structuralModel.observedDimensionIds.includes(id)) {
      throw new Error(`dimensionIds entry "${id}" is not declared on structuralModel`);
    }
  }

  for (let index = 0; index < config.seedStates.length; index += 1) {
    const seed = config.seedStates[index]!;
    for (const id of config.dimensionIds) {
      const value = seed[id];
      if (value === undefined) {
        throw new Error(`seedStates[${index}] missing coordinate for dimension "${id}"`);
      }
      if (!Number.isFinite(value)) {
        throw new RangeError(`seedStates[${index}] coordinate for "${id}" must be finite`);
      }
    }
  }
}

function sampleStructuralDynamics(
  model: StructuralModel,
  roles: ReadonlyMap<string, ParameterDynamicsRole>,
  rng: RandomSource
): { sample: ProbabilisticDynamicsSample; latentDraws: Readonly<Record<string, number>> } {
  let stepSizeScale = 1;
  let dampingOffset = 0;
  const dimensionDrift = Object.fromEntries(
    model.observedDimensionIds.map((dimensionId) => [dimensionId, 0])
  ) as Record<string, number>;
  const latentDraws = Object.fromEntries(
    model.parameters.map((parameter) => [parameter.parameterId, 0])
  ) as Record<string, number>;

  for (const parameter of model.parameters) {
    const role = roles.get(parameter.parameterId);
    if (role === undefined) {
      throw new Error(`Missing dynamics role for latent parameter "${parameter.parameterId}"`);
    }

    const posterior = parameter.posterior ?? parameter.prior;
    const latentDraw = sampleNormal(rng, posterior.mean, posterior.variance);
    latentDraws[parameter.parameterId] = latentDraw;

    stepSizeScale += role.stepSizeSensitivity * (latentDraw - 0.5) * 0.2;
    dampingOffset += role.dampingSensitivity * (latentDraw - 0.5) * 0.15;

    for (const influence of model.influencesFromParameter(parameter.parameterId)) {
      const weightDraw = sampleNormal(rng, influence.meanWeight, influence.weightVariance);
      const driftContribution = role.driftSensitivity * weightDraw * (latentDraw - 0.5) * 0.1;
      dimensionDrift[influence.observedDimensionId]! += driftContribution;
    }
  }

  return {
    sample: {
      stepSizeScale: Math.max(0.05, stepSizeScale),
      dampingOffset: Math.max(-0.4, Math.min(0.4, dampingOffset)),
      dimensionDrift,
    },
    latentDraws,
  };
}

function buildCoordinateSpace(dimensionIds: readonly string[]): StateSpace {
  return StateSpace.define({
    spaceId: 'emergent-topology-internal',
    instrumentId: 'synthetic',
    version: '1.0.0',
    dimensions: dimensionIds.map((id) => ({
      id,
      constructId: id,
      normalization: { inputMin: 0, inputMax: 1, outputMin: 0, outputMax: 1 },
    })),
  });
}

function maxCoordinateDelta(
  previous: Readonly<Record<string, number>>,
  next: Readonly<Record<string, number>>,
  dimensionIds: readonly string[]
): number {
  let maxDelta = 0;
  for (const id of dimensionIds) {
    const delta = Math.abs((next[id] ?? 0) - (previous[id] ?? 0));
    if (delta > maxDelta) {
      maxDelta = delta;
    }
  }
  return maxDelta;
}

function relaxSeedState(
  engine: TransitionEngine,
  space: StateSpace,
  seedCoordinates: Readonly<Record<string, number>>,
  structuralModifier: TransitionModifierOutput,
  dimensionIds: readonly string[],
  maxSteps: number,
  convergenceTolerance: number
): { converged: boolean; coordinates: Readonly<Record<string, number>> } {
  let current = space.createState({
    stateId: 'emergent-seed',
    observedAt: '2026-07-20T00:00:00.000Z',
    coordinates: { ...seedCoordinates },
    normalized: true,
  });
  const history: typeof current[] = [current];
  let converged = false;

  for (let step = 0; step < maxSteps; step += 1) {
    const next = engine.transition(current, step, history, { structuralModifier });
    if (maxCoordinateDelta(current.coordinates(), next.coordinates(), dimensionIds) <= convergenceTolerance) {
      converged = true;
      current = next;
      break;
    }
    history.push(next);
    current = next;
  }

  return { converged, coordinates: current.coordinates() };
}

function clusterCentroid(
  members: readonly RelaxationOutcome[],
  dimensionIds: readonly string[]
): Record<string, number> {
  const centroid = Object.fromEntries(dimensionIds.map((id) => [id, 0])) as Record<string, number>;
  for (const member of members) {
    for (const id of dimensionIds) {
      centroid[id]! += member.coordinates[id]!;
    }
  }
  for (const id of dimensionIds) {
    centroid[id] = centroid[id]! / members.length;
  }
  return centroid;
}

function structuralParameterRangesForCluster(
  members: readonly RelaxationOutcome[],
  parameterIds: readonly string[]
): Readonly<Record<string, { min: number; max: number }>> {
  const ranges = Object.fromEntries(
    parameterIds.map((parameterId) => [parameterId, { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY }])
  ) as Record<string, { min: number; max: number }>;

  for (const member of members) {
    for (const parameterId of parameterIds) {
      const draw = member.latentDraws[parameterId];
      if (draw === undefined) {
        throw new Error(`Missing latent draw for parameter "${parameterId}" in cluster member`);
      }
      const range = ranges[parameterId]!;
      range.min = Math.min(range.min, draw);
      range.max = Math.max(range.max, draw);
    }
  }

  return ranges;
}

function assignCluster(
  clusters: ClusterAccumulator[],
  outcome: RelaxationOutcome,
  dimensionIds: readonly string[],
  clusterRadius: number
): void {
  for (const cluster of clusters) {
    const centroid = clusterCentroid(cluster.members, dimensionIds);
    if (euclideanDistance(outcome.coordinates, centroid, dimensionIds) <= clusterRadius) {
      cluster.members.push(outcome);
      return;
    }
  }

  clusters.push({ members: [outcome] });
}

export function deriveEmergentTopology(config: TopologySamplingConfig): EmergentTopology {
  assertTopologySamplingConfig(config);

  const rng = config.random ?? createSeededRandom(DEFAULT_RANDOM_SEED);
  const roles = new Map(resolveDynamicsRoles(config.structuralModel).map((role) => [role.parameterId, role]));
  const parameterIds = config.structuralModel.parameters.map((parameter) => parameter.parameterId);
  const engine = new TransitionEngine(config.feedbackGraph, [], {
    stepSize: DEFAULT_STEP_SIZE,
    damping: DEFAULT_DAMPING,
    attractorPull: 0,
  });
  const space = buildCoordinateSpace(config.dimensionIds);
  const baseModifierInput = { stepSize: DEFAULT_STEP_SIZE, damping: DEFAULT_DAMPING };

  const outcomes: RelaxationOutcome[] = [];
  const totalRelaxations = config.sampleCount * config.seedStates.length;

  for (let sampleIndex = 0; sampleIndex < config.sampleCount; sampleIndex += 1) {
    const { sample, latentDraws } = sampleStructuralDynamics(config.structuralModel, roles, rng);
    const structuralModifier = applySampleAsModifier(baseModifierInput, sample);

    for (const seedState of config.seedStates) {
      const relaxation = relaxSeedState(
        engine,
        space,
        seedState,
        structuralModifier,
        config.dimensionIds,
        config.convergenceSteps,
        config.convergenceTolerance
      );

      outcomes.push({
        converged: relaxation.converged,
        coordinates: relaxation.coordinates,
        latentDraws,
      });
    }
  }

  const clusters: ClusterAccumulator[] = [];
  let unclassifiedCount = 0;

  for (const outcome of outcomes) {
    if (!outcome.converged) {
      unclassifiedCount += 1;
      continue;
    }

    assignCluster(clusters, outcome, config.dimensionIds, config.clusterRadius);
  }

  const minClusterSupport = config.minClusterSupport ?? DEFAULT_MIN_CLUSTER_SUPPORT;
  const attractors: EmergentAttractor[] = [];

  clusters.forEach((cluster, index) => {
    if (cluster.members.length < minClusterSupport) {
      unclassifiedCount += cluster.members.length;
      return;
    }

    const centroid = clusterCentroid(cluster.members, config.dimensionIds);
    attractors.push({
      attractorId: `emergent-${index}`,
      centroid,
      radius: config.clusterRadius,
      basinSupport: cluster.members.length / totalRelaxations,
      structuralParameterRanges: structuralParameterRangesForCluster(cluster.members, parameterIds),
    });
  });

  attractors.sort((left, right) => right.basinSupport - left.basinSupport);

  return {
    attractors,
    unclassifiedFraction: unclassifiedCount / totalRelaxations,
    sampleCount: config.sampleCount,
  };
}
