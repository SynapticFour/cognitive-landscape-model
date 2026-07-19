import { describe, expect, it } from 'vitest';
import {
  PCMS_OBSERVED_DIMENSIONS,
  createPcmsStructuralModel,
  createSeededRandom,
} from '@clm/structural';

import { FeedbackGraph, deriveEmergentTopology, type EmergentAttractor } from '../index.js';

const EMERGENT_ATTRACTOR_KEYS = [
  'attractorId',
  'centroid',
  'radius',
  'basinSupport',
  'structuralParameterRanges',
] as const;

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

function assertEmergentAttractorShape(attractor: EmergentAttractor): void {
  expect(Object.keys(attractor).sort()).toEqual([...EMERGENT_ATTRACTOR_KEYS].sort());
  expect(attractor.radius).toBeGreaterThan(0);
  expect(attractor.basinSupport).toBeGreaterThan(0);
  expect(attractor.basinSupport).toBeLessThanOrEqual(1);
}

describe('deriveEmergentTopology', () => {
  it('derives a stable, non-trivial topology from the PCMS structural preset', () => {
    const structuralModel = createPcmsStructuralModel();
    const feedbackGraph = buildPcmsFeedbackGraph();
    const baseConfig = {
      structuralModel,
      feedbackGraph,
      dimensionIds: [...PCMS_OBSERVED_DIMENSIONS],
      sampleCount: 48,
      seedStates: [
        polarizedSeed(['F', 'P', 'S'], ['E', 'R', 'C']),
        polarizedSeed(['T', 'I', 'A', 'V'], ['F', 'P']),
        neutralSeed(),
      ],
      convergenceSteps: 80,
      convergenceTolerance: 0.002,
      clusterRadius: 0.12,
    } as const;

    const first = deriveEmergentTopology({ ...baseConfig, random: createSeededRandom(20260720) });
    const second = deriveEmergentTopology({ ...baseConfig, random: createSeededRandom(20260720) });

    expect(first).toEqual(second);
    expect(first.attractors.length).toBeGreaterThan(1);
    expect(first.sampleCount).toBe(48);

    for (const attractor of first.attractors) {
      assertEmergentAttractorShape(attractor);
    }
  });

  it('returns at most one attractor when only one seed state is supplied', () => {
    const structuralModel = createPcmsStructuralModel();
    const feedbackGraph = buildPcmsFeedbackGraph();

    const topology = deriveEmergentTopology({
      structuralModel,
      feedbackGraph,
      dimensionIds: [...PCMS_OBSERVED_DIMENSIONS],
      sampleCount: 24,
      seedStates: [neutralSeed()],
      convergenceSteps: 60,
      convergenceTolerance: 0.002,
      clusterRadius: 0.25,
      random: createSeededRandom(11),
    });

    expect(topology.attractors.length).toBeLessThanOrEqual(1);
  });

  it('reports a high unclassified fraction when relaxations fail to converge', () => {
    const structuralModel = createPcmsStructuralModel();
    const feedbackGraph = buildPcmsFeedbackGraph();

    const topology = deriveEmergentTopology({
      structuralModel,
      feedbackGraph,
      dimensionIds: [...PCMS_OBSERVED_DIMENSIONS],
      sampleCount: 3,
      seedStates: [polarizedSeed(['F', 'P', 'S', 'E'], ['T', 'I', 'A', 'V'])],
      convergenceSteps: 2,
      convergenceTolerance: 1e-6,
      clusterRadius: 0.05,
      random: createSeededRandom(99),
    });

    expect(topology.unclassifiedFraction).toBeGreaterThan(0.9);
    expect(Number.isFinite(topology.unclassifiedFraction)).toBe(true);
  });

  it('routes weakly supported clusters to unclassifiedFraction when minClusterSupport is raised', () => {
    const structuralModel = createPcmsStructuralModel();
    const feedbackGraph = buildPcmsFeedbackGraph();
    const baseConfig = {
      structuralModel,
      feedbackGraph,
      dimensionIds: [...PCMS_OBSERVED_DIMENSIONS],
      sampleCount: 48,
      seedStates: [
        polarizedSeed(['F', 'P', 'S'], ['E', 'R', 'C']),
        polarizedSeed(['T', 'I', 'A', 'V'], ['F', 'P']),
        neutralSeed(),
      ],
      convergenceSteps: 80,
      convergenceTolerance: 0.002,
      clusterRadius: 0.12,
      random: createSeededRandom(20260720),
    } as const;

    const permissive = deriveEmergentTopology(baseConfig);
    const strict = deriveEmergentTopology({ ...baseConfig, minClusterSupport: 5 });

    expect(permissive.attractors.length).toBeGreaterThan(strict.attractors.length);
    expect(strict.unclassifiedFraction).toBeGreaterThan(permissive.unclassifiedFraction);
    for (const attractor of strict.attractors) {
      expect(attractor.basinSupport * baseConfig.sampleCount * baseConfig.seedStates.length).toBeGreaterThanOrEqual(
        5
      );
    }
  });

  it('does not attach ranking or quality metadata to emergent attractors', () => {
    const structuralModel = createPcmsStructuralModel();
    const feedbackGraph = buildPcmsFeedbackGraph();

    const topology = deriveEmergentTopology({
      structuralModel,
      feedbackGraph,
      dimensionIds: [...PCMS_OBSERVED_DIMENSIONS],
      sampleCount: 12,
      seedStates: [neutralSeed(), polarizedSeed(['F'], ['V'])],
      convergenceSteps: 50,
      convergenceTolerance: 0.003,
      clusterRadius: 0.15,
      random: createSeededRandom(7),
    });

    for (const attractor of topology.attractors) {
      assertEmergentAttractorShape(attractor);
      expect(Object.prototype.hasOwnProperty.call(attractor, 'quality')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(attractor, 'rank')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(attractor, 'score')).toBe(false);
    }
  });
});
