import { describe, expect, it } from 'vitest';
import { StateSpace, uncertaintyFromHalfWidth } from '@clm/landscape';

import {
  FeedbackGraph,
  SimulationRunner,
  TransitionEngine,
  type AttractorState,
} from '../index.js';
import {
  ProbabilisticDynamicsModulator,
  abstractParameterDynamicsRoles,
  createAbstractStructuralModel,
} from '@clm/structural';

function buildDemoSpace() {
  return StateSpace.define({
    spaceId: 'demo-dynamics',
    instrumentId: 'synthetic',
    version: '1.0.0',
    dimensions: [
      {
        id: 'x1',
        constructId: 'var-x1',
        normalization: { inputMin: 0, inputMax: 1, outputMin: 0, outputMax: 1 },
      },
      {
        id: 'x2',
        constructId: 'var-x2',
        normalization: { inputMin: 0, inputMax: 1, outputMin: 0, outputMax: 1 },
      },
      {
        id: 'x3',
        constructId: 'var-x3',
        normalization: { inputMin: 0, inputMax: 1, outputMin: 0, outputMax: 1 },
      },
    ],
  });
}

describe('FeedbackGraph', () => {
  it('models directed influence between state variables', () => {
    const graph = FeedbackGraph.create({
      graphId: 'g1',
      dimensionIds: ['x1', 'x2'],
      edges: [
        { edgeId: 'e1', source: 'x1', target: 'x2', weight: 0.6 },
        { edgeId: 'e2', source: 'x2', target: 'x1', weight: -0.2, delaySteps: 1 },
      ],
    });

    expect(graph.influencesFrom('x1')).toHaveLength(1);
    expect(graph.influencesTo('x2')).toHaveLength(1);
    expect(graph.loops()).toHaveLength(0);
  });

  it('registers cyclic feedback loops over variables', () => {
    const graph = FeedbackGraph.create({ graphId: 'g2', dimensionIds: ['x1', 'x2', 'x3'] }).addLoop({
      loopId: 'loop-a',
      path: ['x1', 'x2', 'x3'],
      gain: 0.15,
    });

    expect(graph.loops()[0]?.path).toEqual(['x1', 'x2', 'x3']);
  });
});

describe('TransitionEngine', () => {
  const space = buildDemoSpace();
  const attractors: AttractorState[] = [
    {
      attractorId: 'cluster-a',
      centroid: { x1: 0.8, x2: 0.2, x3: 0.5 },
      radius: 0.12,
    },
    {
      attractorId: 'cluster-b',
      centroid: { x1: 0.2, x2: 0.8, x3: 0.5 },
      radius: 0.12,
    },
  ];

  it('computes state-variable deltas from influences and attractors', () => {
    const graph = FeedbackGraph.create({
      graphId: 'g3',
      dimensionIds: ['x1', 'x2', 'x3'],
      edges: [{ edgeId: 'e1', source: 'x1', target: 'x2', weight: 0.5 }],
    });
    const engine = new TransitionEngine(graph, attractors, {
      stepSize: 0.2,
      damping: 0.1,
      attractorPull: 0.05,
    });

    const current = { x1: 0.7, x2: 0.1, x3: 0.5 };
    const delta = engine.computeDelta(current, [current], 0);

    expect(delta.x2).toBeGreaterThan(0);
    expect(delta.x1).not.toBeNaN();
  });

  it('transitions a CognitiveState without psychological labels', () => {
    const graph = FeedbackGraph.create({
      graphId: 'g4',
      dimensionIds: ['x1', 'x2', 'x3'],
      edges: [{ edgeId: 'e1', source: 'x1', target: 'x2', weight: 0.4 }],
    });
    const engine = new TransitionEngine(graph, attractors);

    const initial = space.createState({
      stateId: 't0',
      observedAt: '2026-01-01T00:00:00.000Z',
      coordinates: { x1: 0.75, x2: 0.15, x3: 0.5 },
      normalized: true,
      uncertainty: Object.fromEntries(
        ['x1', 'x2', 'x3'].map((id) => [id, uncertaintyFromHalfWidth(0.5, 0.1, 0, 1)])
      ),
    });

    const next = engine.transition(initial, 0, [initial]);
    expect(next.coordinate('x2')).not.toBe(initial.coordinate('x2'));
    expect(next.stateId).toContain('step');
  });
});

describe('SimulationRunner', () => {
  it('simulates evolution toward an attractor cluster over time steps', () => {
    const space = buildDemoSpace();
    const graph = FeedbackGraph.create({
      graphId: 'g5',
      dimensionIds: ['x1', 'x2', 'x3'],
      edges: [
        { edgeId: 'e1', source: 'x1', target: 'x2', weight: 0.3 },
        { edgeId: 'e2', source: 'x2', target: 'x1', weight: 0.3 },
      ],
      loops: [{ loopId: 'l1', path: ['x1', 'x2'], gain: 0.1 }],
    });

    const attractors: AttractorState[] = [
      {
        attractorId: 'stable-low-x1',
        centroid: { x1: 0.15, x2: 0.85, x3: 0.5 },
        radius: 0.2,
      },
    ];

    const engine = new TransitionEngine(graph, attractors, {
      stepSize: 0.25,
      damping: 0.15,
      attractorPull: 0.2,
    });
    const runner = new SimulationRunner(engine);

    const initial = space.createState({
      stateId: 'sim-t0',
      observedAt: '2026-01-01T00:00:00.000Z',
      coordinates: { x1: 0.9, x2: 0.1, x3: 0.5 },
      normalized: true,
    });

    const result = runner.run({
      runId: 'sim-1',
      steps: 40,
      initialState: initial,
      stepMillis: 60_000,
      stopOnConvergence: true,
    });

    expect(result.states.length).toBeGreaterThan(1);
    expect(result.states[0]?.coordinate('x1')).toBeCloseTo(0.9, 5);

    const final = result.states[result.states.length - 1]!;
    expect(final.coordinate('x1')).toBeLessThan(0.9);
    expect(final.coordinate('x2')).toBeGreaterThan(0.1);
    expect(result.settledAttractorId).toBe('stable-low-x1');
  });

  it('detects convergence before max steps when configured', () => {
    const space = buildDemoSpace();
    const graph = FeedbackGraph.create({ graphId: 'g6', dimensionIds: ['x1', 'x2', 'x3'] });
    const engine = new TransitionEngine(graph, [
      {
        attractorId: 'fixed-point',
        centroid: { x1: 0.5, x2: 0.5, x3: 0.5 },
        radius: 0.05,
      },
    ], {
      stepSize: 0.3,
      damping: 0.05,
      attractorPull: 0.5,
      convergenceEpsilon: 0.002,
    });

    const runner = new SimulationRunner(engine);
    const initial = space.createState({
      stateId: 'sim-t0',
      observedAt: '2026-01-01T00:00:00.000Z',
      coordinates: { x1: 0.52, x2: 0.48, x3: 0.5 },
      normalized: true,
    });

    const result = runner.run({
      runId: 'sim-2',
      steps: 100,
      initialState: initial,
      stopOnConvergence: true,
    });

    expect(result.convergedAtStep).not.toBeNull();
    expect(result.states.length).toBeLessThan(101);
  });

  it('records structural samples when modulation is enabled', () => {
    const space = buildDemoSpace();
    const graph = FeedbackGraph.create({
      graphId: 'g7',
      dimensionIds: ['x1', 'x2', 'x3'],
      edges: [{ edgeId: 'e1', source: 'x1', target: 'x2', weight: 0.4 }],
    });
    const engine = new TransitionEngine(graph, [], { stepSize: 0.2, damping: 0.2, attractorPull: 0 });
    const runner = new SimulationRunner(engine);

    const model = createAbstractStructuralModel();
    const modulator = new ProbabilisticDynamicsModulator(model, {
      roles: abstractParameterDynamicsRoles(),
    });

    const initial = space.createState({
      stateId: 'mod-t0',
      observedAt: '2026-01-01T00:00:00.000Z',
      coordinates: { x1: 0.5, x2: 0.5, x3: 0.5 },
      normalized: true,
    });

    const result = runner.run({
      runId: 'mod-sim',
      steps: 3,
      initialState: initial,
      structuralModulation: { modulator, randomSeed: 1 },
    });

    expect(result.structuralSamples).toHaveLength(3);
    expect(result.states).toHaveLength(4);
  });
});
