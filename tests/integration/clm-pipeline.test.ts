import { describe, expect, it } from 'vitest';
import { StateSpace } from '@clm/landscape';
import {
  FeedbackGraph,
  SimulationRunner,
  TransitionEngine,
  type AttractorState,
} from '@clm/dynamics';
import {
  ABSTRACT_OBSERVED_DIMENSIONS,
  CalibrationEngine,
  ProbabilisticDynamicsModulator,
  abstractParameterDynamicsRoles,
  createAbstractStructuralModel,
  createSeededRandom,
} from '@clm/structural';
import { createMeasurementBundleFromTrajectory } from '@clm/core';
import { interpret } from '@clm/interpretation';
import { TrajectoryExplanationEngine } from '@clm/trajectory-explanation';

function createAbstractStateSpace() {
  return StateSpace.define({
    spaceId: 'abstract-integration',
    instrumentId: 'synthetic',
    version: '1.0.0',
    dimensions: ABSTRACT_OBSERVED_DIMENSIONS.map((id) => ({
      id,
      constructId: `construct-${id}`,
      normalization: { inputMin: 0, inputMax: 1, outputMin: 0, outputMax: 1 },
    })),
  });
}

function buildAbstractGraph() {
  return FeedbackGraph.create({
    graphId: 'abstract-feedback',
    dimensionIds: [...ABSTRACT_OBSERVED_DIMENSIONS],
    edges: [
      { edgeId: 'e1', source: 'v1', target: 'v2', weight: 0.35 },
      { edgeId: 'e2', source: 'v2', target: 'v3', weight: 0.3 },
      { edgeId: 'e3', source: 'v3', target: 'v4', weight: 0.25 },
      { edgeId: 'e4', source: 'v4', target: 'v1', weight: -0.15, delaySteps: 1 },
    ],
    loops: [{ loopId: 'loop-v', path: ['v1', 'v2', 'v3'], gain: 0.08 }],
  });
}

describe('CLM end-to-end pipeline', () => {
  it('calibrates structure, modulates simulation, explains trajectory, and interprets state', () => {
    const space = createAbstractStateSpace();
    const priorModel = createAbstractStructuralModel();
    const calibration = new CalibrationEngine(priorModel);

    const initial = space.createState({
      stateId: 'pipeline-t0',
      observedAt: '2026-07-06T10:00:00.000Z',
      coordinates: { v1: 0.72, v2: 0.58, v3: 0.61, v4: 0.44 },
      normalized: true,
    });

    const observedPatterns = ABSTRACT_OBSERVED_DIMENSIONS.map((dimensionId) => ({
      dimensionId,
      mean: initial.coordinate(dimensionId),
      variance: 0.05,
      weight: 1,
    }));

    const calibrationResult = calibration.calibrate(observedPatterns);
    const calibratedModel = calibration.applyToModel(calibrationResult);
    const modulator = new ProbabilisticDynamicsModulator(calibratedModel, {
      roles: abstractParameterDynamicsRoles(),
    });

    const attractors: AttractorState[] = [
      {
        attractorId: 'balanced',
        centroid: { v1: 0.5, v2: 0.5, v3: 0.5, v4: 0.5 },
        radius: 0.15,
      },
    ];

    const graph = buildAbstractGraph();
    const engine = new TransitionEngine(graph, attractors, {
      stepSize: 0.18,
      damping: 0.22,
      attractorPull: 0.1,
    });

    const runner = new SimulationRunner(engine);
    const simulation = runner.run({
      runId: 'pipeline-run',
      steps: 12,
      initialState: initial,
      stepMillis: 300_000,
      structuralModulation: { modulator, randomSeed: 7 },
    });

    expect(simulation.states.length).toBe(13);
    expect(simulation.structuralSamples).toHaveLength(12);
    expect(simulation.structuralSamples[0]?.stepSizeScale).toBeGreaterThan(0);

    const explanationEngine = new TrajectoryExplanationEngine();
    const explanation = explanationEngine.explain({
      explanationId: 'pipeline-explanation',
      simulation,
      engine,
      structuralModel: calibratedModel,
    });

    expect(explanation.timeline.length).toBe(12);
    expect(explanation.causalChain.length).toBeGreaterThan(0);
    expect(explanation.narrative).toMatch(/initial|feedback|structural/i);

    const finalState = simulation.states[simulation.states.length - 1]!;
    const measurementBundle = createMeasurementBundleFromTrajectory({
      bundleId: 'pipeline-bundle',
      createdAt: finalState.observedAt,
      initialStateId: initial.stateId,
      instrumentId: space.instrumentId,
      dimensionCount: initial.dimensionIds().length,
      runId: simulation.runId,
      stateCount: simulation.states.length,
      structuralModelId: calibratedModel.modelId,
    });
    const narrative = interpret(finalState, 'systems-theory', { measurementBundle });

    expect(narrative.worldviewId).toBe('systems-theory');
    expect(narrative.disclaimer).toMatch(/read-only/i);
    expect(narrative.dimensionReadings.length).toBeGreaterThan(0);
    expect(narrative.measurementContext?.bundleId).toBe('pipeline-bundle');
  });

  it('produces reproducible structural modulation with a fixed seed', () => {
    const model = createAbstractStructuralModel();
    const modulator = new ProbabilisticDynamicsModulator(model, {
      roles: abstractParameterDynamicsRoles(),
    });

    const space = createAbstractStateSpace();
    const initial = space.createState({
      stateId: 'seed-t0',
      observedAt: '2026-07-06T10:00:00.000Z',
      coordinates: { v1: 0.6, v2: 0.55, v3: 0.5, v4: 0.45 },
      normalized: true,
    });

    const graph = buildAbstractGraph();
    const engine = new TransitionEngine(graph, [], { stepSize: 0.15, damping: 0.2, attractorPull: 0 });
    const runner = new SimulationRunner(engine);

    const runA = runner.run({
      runId: 'seed-a',
      steps: 5,
      initialState: initial,
      structuralModulation: { modulator, randomSeed: 123 },
    });
    const runB = runner.run({
      runId: 'seed-b',
      steps: 5,
      initialState: initial,
      structuralModulation: { modulator, randomSeed: 123 },
    });

    expect(runA.structuralSamples).toEqual(runB.structuralSamples);
    expect(runA.states[runA.states.length - 1]?.coordinates()).toEqual(
      runB.states[runB.states.length - 1]?.coordinates()
    );
  });
});
