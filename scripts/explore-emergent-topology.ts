/**
 * EXPLORATORY - simulation on design-informed priors only, per CLRP-010 §3.
 * Not an empirical finding. Do not cite output as a scientific result.
 *
 * One-off visual check of deriveEmergentTopology() against the PCMS preset.
 * Not committed unless explicitly retained as repo tooling.
 *
 * Run (uses vitest path aliases for workspace packages):
 *   npx vitest run tests/exploratory/explore-emergent-topology.run.test.ts
 */
import { performance } from 'node:perf_hooks';

import { StateSpace } from '@clm/landscape';
import {
  FeedbackGraph,
  TransitionEngine,
  applySampleAsModifier,
  deriveEmergentTopology,
  type EmergentTopology,
} from '@clm/dynamics';
import type { StructuralModel } from '@clm/structural';
import {
  PCMS_OBSERVED_DIMENSIONS,
  PCMS_STRUCTURAL_MODEL_ID,
  createPcmsStructuralModel,
  createSeededRandom,
  pcmsParameterDynamicsRoles,
  sampleNormal,
  type ParameterDynamicsRole,
  type ProbabilisticDynamicsSample,
  type RandomSource,
  type TransitionModifierOutput,
} from '@clm/structural';

const SAMPLE_COUNT = 500;
const STRICT_MIN_CLUSTER_SUPPORT = 15;
const RANDOM_SEED = 20260720;
const BASE_CONVERGENCE_STEPS = 80;
const EXTENDED_CONVERGENCE_STEPS = BASE_CONVERGENCE_STEPS * 10;
const BOUNDARY_EPSILON = 1e-6;
const DEFAULT_STEP_SIZE = 0.15;
const DEFAULT_DAMPING = 0.25;

interface RelaxationDiagnostic {
  readonly converged: boolean;
  readonly boundaryDimensionCount: number | null;
  readonly allInterior: boolean | null;
  readonly lastStepDelta: number | null;
}

interface DiagnosticSummary {
  readonly totalRelaxations: number;
  readonly convergedCount: number;
  readonly nonConvergedCount: number;
  readonly convergedWithAnyBoundary: number;
  readonly convergedAllInterior: number;
  readonly nonConvergedLastStepDeltas: number[];
  readonly elapsedMs: number;
}

function buildPcmsFeedbackGraph(): FeedbackGraph {
  return FeedbackGraph.create({
    graphId: 'pcms-emergent-topology',
    dimensionIds: [...PCMS_OBSERVED_DIMENSIONS],
    edges: [
      { edgeId: 'e-f-p', source: 'F', target: 'P', weight: 0.35 },
      { edgeId: 'e-p-s', source: 'P', target: 'S', weight: 0.3 },
      { edgeId: 'e-s-e', source: 'S', target: 'E', weight: 0.28 },
      { edgeId: 'e-e-r', source: 'E', target: 'R', weight: 0.25 },
      { edgeId: 'e-r-c', source: 'R', target: 'C', weight: 0.22 },
      { edgeId: 'e-c-t', source: 'C', target: 'T', weight: 0.2 },
      { edgeId: 'e-t-i', source: 'T', target: 'I', weight: 0.18 },
      { edgeId: 'e-i-a', source: 'I', target: 'A', weight: 0.16 },
      { edgeId: 'e-a-v', source: 'A', target: 'V', weight: 0.14 },
      { edgeId: 'e-v-f', source: 'V', target: 'F', weight: -0.12, delaySteps: 1 },
    ],
    loops: [
      { loopId: 'loop-primary', path: ['F', 'P', 'S', 'E'], gain: 0.08 },
      { loopId: 'loop-research', path: ['T', 'I', 'A', 'V'], gain: 0.06 },
    ],
  });
}

function neutralSeed(): Readonly<Record<string, number>> {
  return Object.fromEntries(PCMS_OBSERVED_DIMENSIONS.map((id) => [id, 0.5]));
}

function polarizedSeed(high: readonly string[], low: readonly string[]): Record<string, number> {
  const seed: Record<string, number> = Object.fromEntries(PCMS_OBSERVED_DIMENSIONS.map((id) => [id, 0.5]));
  for (const id of high) {
    seed[id] = 0.85;
  }
  for (const id of low) {
    seed[id] = 0.15;
  }
  return seed;
}

function buildBaseConfig(convergenceSteps: number = BASE_CONVERGENCE_STEPS) {
  return {
    structuralModel: createPcmsStructuralModel(),
    feedbackGraph: buildPcmsFeedbackGraph(),
    dimensionIds: [...PCMS_OBSERVED_DIMENSIONS],
    sampleCount: SAMPLE_COUNT,
    seedStates: [
      polarizedSeed(['F', 'P', 'S'], ['E', 'R', 'C']),
      polarizedSeed(['T', 'I', 'A', 'V'], ['F', 'P']),
      neutralSeed(),
    ],
    convergenceSteps,
    convergenceTolerance: 0.002,
    clusterRadius: 0.12,
    random: createSeededRandom(RANDOM_SEED),
  } as const;
}

function resolveDynamicsRoles(model: StructuralModel): readonly ParameterDynamicsRole[] {
  if (model.modelId === PCMS_STRUCTURAL_MODEL_ID) {
    return pcmsParameterDynamicsRoles();
  }
  throw new Error(`Unexpected structural model id "${model.modelId}" in exploratory script`);
}

function sampleStructuralDynamics(
  model: StructuralModel,
  roles: ReadonlyMap<string, ParameterDynamicsRole>,
  rng: RandomSource
): ProbabilisticDynamicsSample {
  let stepSizeScale = 1;
  let dampingOffset = 0;
  const dimensionDrift = Object.fromEntries(
    model.observedDimensionIds.map((dimensionId) => [dimensionId, 0])
  ) as Record<string, number>;

  for (const parameter of model.parameters) {
    const role = roles.get(parameter.parameterId)!;
    const posterior = parameter.posterior ?? parameter.prior;
    const latentDraw = sampleNormal(rng, posterior.mean, posterior.variance);

    stepSizeScale += role.stepSizeSensitivity * (latentDraw - 0.5) * 0.2;
    dampingOffset += role.dampingSensitivity * (latentDraw - 0.5) * 0.15;

    for (const influence of model.influencesFromParameter(parameter.parameterId)) {
      const weightDraw = sampleNormal(rng, influence.meanWeight, influence.weightVariance);
      const driftContribution = role.driftSensitivity * weightDraw * (latentDraw - 0.5) * 0.1;
      dimensionDrift[influence.observedDimensionId]! += driftContribution;
    }
  }

  return {
    stepSizeScale: Math.max(0.05, stepSizeScale),
    dampingOffset: Math.max(-0.4, Math.min(0.4, dampingOffset)),
    dimensionDrift,
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

function isAtBoundary(value: number): boolean {
  return value <= BOUNDARY_EPSILON || value >= 1 - BOUNDARY_EPSILON;
}

function isInterior(value: number): boolean {
  return value > BOUNDARY_EPSILON && value < 1 - BOUNDARY_EPSILON;
}

function countBoundaryDimensions(
  coordinates: Readonly<Record<string, number>>,
  dimensionIds: readonly string[]
): number {
  let count = 0;
  for (const id of dimensionIds) {
    if (isAtBoundary(coordinates[id] ?? 0)) {
      count += 1;
    }
  }
  return count;
}

function allDimensionsInterior(
  coordinates: Readonly<Record<string, number>>,
  dimensionIds: readonly string[]
): boolean {
  return dimensionIds.every((id) => isInterior(coordinates[id] ?? 0));
}

/**
 * Temporary diagnostic mirror of emergent-topology relaxSeedState().
 * Captures per-relaxation convergence and boundary/step-delta metrics only.
 */
function relaxSeedStateWithDiagnostics(
  engine: TransitionEngine,
  space: StateSpace,
  seedCoordinates: Readonly<Record<string, number>>,
  structuralModifier: TransitionModifierOutput,
  dimensionIds: readonly string[],
  maxSteps: number,
  convergenceTolerance: number
): RelaxationDiagnostic {
  let current = space.createState({
    stateId: 'emergent-seed',
    observedAt: '2026-07-20T00:00:00.000Z',
    coordinates: { ...seedCoordinates },
    normalized: true,
  });
  const history: typeof current[] = [current];
  let lastStepDelta = 0;

  for (let step = 0; step < maxSteps; step += 1) {
    const next = engine.transition(current, step, history, { structuralModifier });
    lastStepDelta = maxCoordinateDelta(current.coordinates(), next.coordinates(), dimensionIds);
    if (lastStepDelta <= convergenceTolerance) {
      const finalCoordinates = next.coordinates();
      const boundaryDimensionCount = countBoundaryDimensions(finalCoordinates, dimensionIds);
      return {
        converged: true,
        boundaryDimensionCount,
        allInterior: allDimensionsInterior(finalCoordinates, dimensionIds),
        lastStepDelta: null,
      };
    }
    history.push(next);
    current = next;
  }

  return {
    converged: false,
    boundaryDimensionCount: null,
    allInterior: null,
    lastStepDelta,
  };
}

function collectRelaxationDiagnostics(config: ReturnType<typeof buildBaseConfig>): DiagnosticSummary {
  const start = performance.now();
  const rng = config.random ?? createSeededRandom(RANDOM_SEED);
  const roles = new Map(resolveDynamicsRoles(config.structuralModel).map((role) => [role.parameterId, role]));
  const engine = new TransitionEngine(config.feedbackGraph, [], {
    stepSize: DEFAULT_STEP_SIZE,
    damping: DEFAULT_DAMPING,
    attractorPull: 0,
  });
  const space = buildCoordinateSpace(config.dimensionIds);
  const baseModifierInput = { stepSize: DEFAULT_STEP_SIZE, damping: DEFAULT_DAMPING };

  const diagnostics: RelaxationDiagnostic[] = [];

  for (let sampleIndex = 0; sampleIndex < config.sampleCount; sampleIndex += 1) {
    const sample = sampleStructuralDynamics(config.structuralModel, roles, rng);
    const structuralModifier = applySampleAsModifier(baseModifierInput, sample);

    for (const seedState of config.seedStates) {
      diagnostics.push(
        relaxSeedStateWithDiagnostics(
          engine,
          space,
          seedState,
          structuralModifier,
          config.dimensionIds,
          config.convergenceSteps,
          config.convergenceTolerance
        )
      );
    }
  }

  const converged = diagnostics.filter((entry) => entry.converged);
  const nonConverged = diagnostics.filter((entry) => !entry.converged);

  return {
    totalRelaxations: diagnostics.length,
    convergedCount: converged.length,
    nonConvergedCount: nonConverged.length,
    convergedWithAnyBoundary: converged.filter((entry) => (entry.boundaryDimensionCount ?? 0) >= 1).length,
    convergedAllInterior: converged.filter((entry) => entry.allInterior === true).length,
    nonConvergedLastStepDeltas: nonConverged.map((entry) => entry.lastStepDelta ?? 0),
    elapsedMs: performance.now() - start,
  };
}

function median(values: readonly number[]): number {
  if (values.length === 0) {
    return Number.NaN;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

function maxValue(values: readonly number[]): number {
  if (values.length === 0) {
    return Number.NaN;
  }
  return Math.max(...values);
}

function printDiagnosticSummary(label: string, summary: DiagnosticSummary): void {
  console.log('='.repeat(72));
  console.log(label);
  console.log('='.repeat(72));
  console.log(`totalRelaxations: ${summary.totalRelaxations}`);
  console.log(`convergedCount: ${summary.convergedCount}`);
  console.log(`nonConvergedCount: ${summary.nonConvergedCount}`);
  console.log(`convergedWithAnyBoundaryDimension: ${summary.convergedWithAnyBoundary}`);
  console.log(`convergedAllInteriorDimensions: ${summary.convergedAllInterior}`);
  console.log(`nonConvergedLastStepDeltaMedian: ${median(summary.nonConvergedLastStepDeltas)}`);
  console.log(`nonConvergedLastStepDeltaMax: ${maxValue(summary.nonConvergedLastStepDeltas)}`);
  console.log(`elapsedMs: ${summary.elapsedMs.toFixed(1)}`);
  console.log('');
}

function printTopologyHeadline(label: string, topology: EmergentTopology, elapsedMs: number): void {
  console.log('='.repeat(72));
  console.log(label);
  console.log('='.repeat(72));
  console.log(`sampleCount: ${topology.sampleCount}`);
  console.log(`attractorCount: ${topology.attractors.length}`);
  console.log(`unclassifiedFraction: ${topology.unclassifiedFraction}`);
  console.log(`elapsedMs: ${elapsedMs.toFixed(1)}`);
  console.log('');
}

function printTopologySummary(label: string, topology: EmergentTopology, elapsedMs: number): void {
  printTopologyHeadline(label, topology, elapsedMs);
  for (const attractor of topology.attractors) {
    console.log(`attractorId: ${attractor.attractorId}`);
    console.log(`  basinSupport: ${attractor.basinSupport}`);
    console.log(`  radius: ${attractor.radius}`);
    console.log(`  centroid: ${JSON.stringify(attractor.centroid)}`);
    console.log(`  structuralParameterRanges: ${JSON.stringify(attractor.structuralParameterRanges)}`);
    console.log('');
  }
}

export function main(): void {
  console.log('EXPLORATORY - simulation on design-informed priors only, per CLRP-010 §3.');
  console.log('Not an empirical finding. Do not cite output as a scientific result.');
  console.log('');

  const baseConfig = buildBaseConfig(BASE_CONVERGENCE_STEPS);
  const totalRelaxations = baseConfig.sampleCount * baseConfig.seedStates.length;

  console.log('configuration:');
  console.log(`  sampleCount: ${baseConfig.sampleCount}`);
  console.log(`  seedStateCount: ${baseConfig.seedStates.length}`);
  console.log(`  totalRelaxations: ${totalRelaxations}`);
  console.log(`  convergenceSteps: ${baseConfig.convergenceSteps}`);
  console.log(`  convergenceTolerance: ${baseConfig.convergenceTolerance}`);
  console.log(`  clusterRadius: ${baseConfig.clusterRadius}`);
  console.log(`  randomSeed: ${RANDOM_SEED}`);
  console.log(`  boundaryEpsilon: ${BOUNDARY_EPSILON}`);
  console.log('');

  const diagnosticSummary = collectRelaxationDiagnostics(baseConfig);
  printDiagnosticSummary('Relaxation diagnostics — Run A (convergenceSteps=80)', diagnosticSummary);

  const runAStart = performance.now();
  const runA = deriveEmergentTopology(baseConfig);
  const runAElapsedMs = performance.now() - runAStart;
  printTopologyHeadline(
    'Topology headline — Run A (convergenceSteps=80, minClusterSupport default)',
    runA,
    runAElapsedMs
  );

  const extendedConfig = {
    ...buildBaseConfig(EXTENDED_CONVERGENCE_STEPS),
    random: createSeededRandom(RANDOM_SEED),
  };
  const extendedDiagnosticSummary = collectRelaxationDiagnostics(extendedConfig);
  printDiagnosticSummary(
    `Relaxation diagnostics — extended (convergenceSteps=${EXTENDED_CONVERGENCE_STEPS})`,
    extendedDiagnosticSummary
  );

  const extendedStart = performance.now();
  const extended = deriveEmergentTopology(extendedConfig);
  const extendedElapsedMs = performance.now() - extendedStart;
  printTopologyHeadline(
    `Topology headline — extended (convergenceSteps=${EXTENDED_CONVERGENCE_STEPS}, minClusterSupport default)`,
    extended,
    extendedElapsedMs
  );

  console.log('='.repeat(72));
  console.log('unclassifiedFraction comparison');
  console.log('='.repeat(72));
  console.log(`Run A convergenceSteps=${BASE_CONVERGENCE_STEPS}: ${runA.unclassifiedFraction}`);
  console.log(
    `Extended convergenceSteps=${EXTENDED_CONVERGENCE_STEPS}: ${extended.unclassifiedFraction}`
  );
  console.log(
    `Delta (extended minus Run A): ${(extended.unclassifiedFraction - runA.unclassifiedFraction).toFixed(10)}`
  );
  console.log(`Run A attractorCount: ${runA.attractors.length}`);
  console.log(`Extended attractorCount: ${extended.attractors.length}`);
  console.log('');

  const strictStart = performance.now();
  const strict = deriveEmergentTopology({
    ...baseConfig,
    random: createSeededRandom(RANDOM_SEED),
    minClusterSupport: STRICT_MIN_CLUSTER_SUPPORT,
  });
  const strictElapsedMs = performance.now() - strictStart;
  printTopologyHeadline(
    `Topology headline — Run B (minClusterSupport=${STRICT_MIN_CLUSTER_SUPPORT})`,
    strict,
    strictElapsedMs
  );

  console.log('='.repeat(72));
  console.log('Timing summary');
  console.log('='.repeat(72));
  console.log(`Relaxation diagnostics Run A elapsedMs: ${diagnosticSummary.elapsedMs.toFixed(1)}`);
  console.log(`Topology Run A elapsedMs: ${runAElapsedMs.toFixed(1)}`);
  console.log(`Relaxation diagnostics extended elapsedMs: ${extendedDiagnosticSummary.elapsedMs.toFixed(1)}`);
  console.log(`Topology extended elapsedMs: ${extendedElapsedMs.toFixed(1)}`);
  console.log(`Topology Run B elapsedMs: ${strictElapsedMs.toFixed(1)}`);
}
