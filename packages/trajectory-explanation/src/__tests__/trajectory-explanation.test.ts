import { describe, expect, it } from 'vitest';
import { StateSpace } from '@clm/landscape';
import {
  FeedbackGraph,
  SimulationRunner,
  TransitionEngine,
  type AttractorState,
} from '@clm/dynamics';
import { createAbstractStructuralModel } from '@clm/structural';

import { TrajectoryExplanationEngine } from '../index.js';

function buildScenario() {
  const space = StateSpace.define({
    spaceId: 'expl-demo',
    instrumentId: 'synthetic',
    version: '1.0.0',
    dimensions: [
      {
        id: 'v1',
        constructId: 'var-one',
        normalization: { inputMin: 0, inputMax: 1, outputMin: 0, outputMax: 1 },
        lowPole: 'low-v1',
        highPole: 'high-v1',
      },
      {
        id: 'v2',
        constructId: 'var-two',
        normalization: { inputMin: 0, inputMax: 1, outputMin: 0, outputMax: 1 },
        lowPole: 'low-v2',
        highPole: 'high-v2',
      },
      {
        id: 'v3',
        constructId: 'var-three',
        normalization: { inputMin: 0, inputMax: 1, outputMin: 0, outputMax: 1 },
      },
    ],
  });

  const graph = FeedbackGraph.create({
    graphId: 'expl-graph',
    dimensionIds: ['v1', 'v2', 'v3'],
    edges: [
      { edgeId: 'e1', source: 'v1', target: 'v2', weight: 0.4 },
      { edgeId: 'e2', source: 'v2', target: 'v1', weight: 0.2 },
    ],
    loops: [{ loopId: 'loop-1', path: ['v1', 'v2', 'v3'], gain: 0.12 }],
  });

  const attractors: AttractorState[] = [
    {
      attractorId: 'attractor-a',
      centroid: { v1: 0.2, v2: 0.8, v3: 0.5 },
      radius: 0.25,
    },
  ];

  const engine = new TransitionEngine(graph, attractors, {
    stepSize: 0.2,
    damping: 0.15,
    attractorPull: 0.15,
  });

  const initial = space.createState({
    stateId: 't0',
    observedAt: '2026-01-01T00:00:00.000Z',
    coordinates: { v1: 0.85, v2: 0.15, v3: 0.5 },
    normalized: true,
  });

  const simulation = new SimulationRunner(engine).run({
    runId: 'run-expl-1',
    steps: 5,
    initialState: initial,
    stepMillis: 3_600_000,
  });

  return { simulation, engine, space };
}

describe('TrajectoryExplanationEngine', () => {
  it('explains evolution with initial conditions, feedback loops, and structural constraints', () => {
    const { simulation, engine } = buildScenario();
    const structuralModel = createAbstractStructuralModel();
    const calibrated = structuralModel.withParameterPosteriors({
      'latent.sensory-gain': { mean: 0.62, variance: 0.05 },
      'latent.prediction-stability': { mean: 0.58, variance: 0.04 },
      'latent.stress-reactivity': { mean: 0.5, variance: 0.06 },
      'latent.cognitive-bandwidth': { mean: 0.55, variance: 0.05 },
    });

    const explanation = new TrajectoryExplanationEngine().explain({
      simulation,
      engine,
      structuralModel: calibrated,
    });

    expect(explanation.initialConditions.variables).toHaveLength(3);
    expect(explanation.feedbackOverview).toContain('expl-graph');
    expect(explanation.structuralOverview).toContain('latent');

    expect(explanation.causalChain.some((link) => link.linkType === 'initial-condition')).toBe(true);
    expect(explanation.causalChain.some((link) => link.linkType === 'feedback-edge')).toBe(true);
    expect(explanation.causalChain.some((link) => link.linkType === 'feedback-loop')).toBe(true);
    expect(explanation.causalChain.some((link) => link.linkType === 'structural-constraint')).toBe(true);

    expect(explanation.timeline.length).toBe(5);
    expect(explanation.timeline[0]?.observedAt).not.toBe(simulation.states[0]?.observedAt);
  });

  it('produces a human-readable, time-aware narrative with ordered causal chain', () => {
    const { simulation, engine } = buildScenario();
    const explanation = new TrajectoryExplanationEngine().explain({ simulation, engine });

    expect(explanation.narrative).toContain('# Trajectory Explanation');
    expect(explanation.narrative).toContain('Initial conditions');
    expect(explanation.narrative).toContain('Time-aware timeline');
    expect(explanation.narrative).toContain('Causal chain');

    for (let index = 1; index < explanation.causalChain.length; index += 1) {
      expect(explanation.causalChain[index]!.sequence).toBeGreaterThan(
        explanation.causalChain[index - 1]!.sequence
      );
    }
  });

  it('does not mutate cognitive states during explanation', () => {
    const { simulation, engine } = buildScenario();
    const before = simulation.states.map((state) => ({
      id: state.stateId,
      coords: state.coordinates(),
    }));

    new TrajectoryExplanationEngine().explain({ simulation, engine });

    const after = simulation.states.map((state) => ({
      id: state.stateId,
      coords: state.coordinates(),
    }));

    expect(after).toEqual(before);
  });
});
