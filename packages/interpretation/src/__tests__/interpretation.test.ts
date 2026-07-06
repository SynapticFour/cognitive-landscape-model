import { describe, expect, it } from 'vitest';
import { StateSpace } from '@clm/landscape';

import {
  createNeutralWorldviewMapping,
  interpret,
  interpretMeasurement,
  listAvailableWorldviews,
  NON_CAUSAL_DISCLAIMER,
  READ_ONLY_DISCLAIMER,
  scientificPsychologicalPlugin,
  systemsTheoryPlugin,
  christianTheologicalPlugin,
  WorldviewRegistry,
} from '../index.js';
import {
  createLandscapeSnapshot,
  NEUTRAL_PCMS_PROFILE,
  ZERO_PCMS_CONFIDENCE,
} from '@clm/landscape';

function createDemoState() {
  const space = StateSpace.define({
    spaceId: 'interp-demo',
    instrumentId: 'demo',
    version: '1.0.0',
    dimensions: [
      {
        id: 'x1',
        constructId: 'processing-mode',
        normalization: { inputMin: 0, inputMax: 1, outputMin: 0, outputMax: 1 },
        lowPole: 'sequential',
        highPole: 'holistic',
      },
      {
        id: 'x2',
        constructId: 'regulation-band',
        normalization: { inputMin: 0, inputMax: 1, outputMin: 0, outputMax: 1 },
        lowPole: 'flexible',
        highPole: 'structured',
      },
    ],
  });

  return space.createState({
    stateId: 'state-1',
    observedAt: '2026-07-06T12:00:00.000Z',
    coordinates: { x1: 0.72, x2: 0.4 },
    normalized: true,
  });
}

describe('interpret(state, worldview)', () => {
  it('returns a narrative from the scientific/psychological plugin', () => {
    const state = createDemoState();
    const narrative = interpret(state, 'scientific-psychological');

    expect(narrative.worldviewId).toBe('scientific-psychological');
    expect(narrative.summary.length).toBeGreaterThan(0);
    expect(narrative.dimensionReadings).toHaveLength(2);
    expect(narrative.disclaimer).toContain('read-only');
  });

  it('supports systems theory and optional christian theological plugins', () => {
    const state = createDemoState();

    const systems = interpret(state, 'systems-theory');
    const theological = interpret(state, 'christian-theological');

    expect(systems.headline).toContain('Systems');
    expect(theological.headline).toContain('theological');
    expect(systems.worldviewId).not.toBe(theological.worldviewId);
  });

  it('never mutates the underlying cognitive state', () => {
    const state = createDemoState();
    const beforeCoords = state.coordinates();
    const beforeVector = state.toVector();

    interpret(state, 'scientific-psychological');
    interpret(state, 'systems-theory');
    interpret(state, 'christian-theological');

    expect(state.coordinates()).toEqual(beforeCoords);
    expect(state.toVector()).toEqual(beforeVector);
  });

  it('lists registered worldview plugins', () => {
    const worldviews = listAvailableWorldviews();
    expect(worldviews.map((view) => view.id)).toEqual([
      'scientific-psychological',
      'systems-theory',
      'christian-theological',
    ]);
  });

  it('allows custom plugin registration without touching measurement layers', () => {
    const registry = new WorldviewRegistry().register(scientificPsychologicalPlugin).register(systemsTheoryPlugin);
    const state = createDemoState();

    const narrative = interpret(state, 'systems-theory', undefined, registry);
    expect(narrative.worldviewId).toBe('systems-theory');
    expect(registry.has('christian-theological')).toBe(false);
  });
});

describe('legacy interpretMeasurement path', () => {
  it('maps landscape coordinates through a neutral worldview frame', () => {
    const landscape = createLandscapeSnapshot({
      snapshotId: 'ls-1',
      createdAt: '2026-07-06T12:00:00.000Z',
      profile: NEUTRAL_PCMS_PROFILE,
      confidence: ZERO_PCMS_CONFIDENCE,
      questionsAnswered: 8,
    });

    const reading = interpretMeasurement({
      readingId: 'read-1',
      createdAt: '2026-07-06T12:05:00.000Z',
      mapping: createNeutralWorldviewMapping('neutral-v1'),
      landscape,
    });

    expect(reading.disclaimer).toBe(NON_CAUSAL_DISCLAIMER);
    expect(reading.coordinates).toHaveLength(10);
  });

  it('never mutates the landscape snapshot', () => {
    const landscape = createLandscapeSnapshot({
      snapshotId: 'ls-2',
      createdAt: '2026-07-06T12:00:00.000Z',
      profile: NEUTRAL_PCMS_PROFILE,
      confidence: ZERO_PCMS_CONFIDENCE,
      questionsAnswered: 3,
    });

    const before = JSON.parse(JSON.stringify(landscape)) as typeof landscape;
    interpretMeasurement({
      readingId: 'read-2',
      createdAt: '2026-07-06T12:05:00.000Z',
      mapping: createNeutralWorldviewMapping('neutral-v1'),
      landscape,
    });

    expect(landscape).toEqual(before);
  });
});

describe('read-only guarantees', () => {
  it('includes read-only disclaimer on all built-in plugins', () => {
    expect(scientificPsychologicalPlugin.interpret(createDemoState()).disclaimer).toContain('read-only');
    expect(systemsTheoryPlugin.interpret(createDemoState()).disclaimer).toContain('read-only');
    expect(christianTheologicalPlugin.interpret(createDemoState()).disclaimer).toContain('read-only');
    expect(READ_ONLY_DISCLAIMER).toContain('does not modify');
  });
});
