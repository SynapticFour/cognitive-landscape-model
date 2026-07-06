import type { CognitiveState } from '@clm/landscape';

import {
  christianTheologicalPlugin,
  scientificPsychologicalPlugin,
  systemsTheoryPlugin,
} from '../plugins/index.js';
import { assertReadOnlyInput } from './plugin.js';
import { createNarrativeProvenance } from './provenance.js';
import { createDefaultRegistry, WorldviewRegistry } from './registry.js';
import type {
  InterpretationNarrative,
  InterpretOptions,
  Worldview,
  WorldviewId,
} from './types.js';
import { READ_ONLY_DISCLAIMER, WORLDVIEWS } from './types.js';

const defaultRegistry = createDefaultRegistry([
  scientificPsychologicalPlugin,
  systemsTheoryPlugin,
  christianTheologicalPlugin,
]);

/**
 * Maps a cognitive state into a worldview narrative.
 * Read-only: never mutates `state` or underlying model data.
 */
export function interpret(
  state: CognitiveState,
  worldview: WorldviewId | Worldview,
  options?: InterpretOptions,
  registry: WorldviewRegistry = defaultRegistry
): InterpretationNarrative {
  assertReadOnlyInput(state);
  const plugin = registry.resolve(worldview);
  const narrative = plugin.interpret(state, options);
  assertNarrativeReadOnly(narrative, plugin.worldview.id);
  return narrative;
}

export function getDefaultRegistry(): WorldviewRegistry {
  return defaultRegistry;
}

export function listAvailableWorldviews(): readonly Worldview[] {
  return defaultRegistry.listWorldviews().map((id) => WORLDVIEWS[id]);
}

function assertNarrativeReadOnly(narrative: InterpretationNarrative, expectedWorldviewId: WorldviewId): void {
  if (narrative.worldviewId !== expectedWorldviewId) {
    throw new Error('Plugin returned narrative with mismatched worldview id');
  }
  if (!/does not modify|read-only/i.test(narrative.disclaimer)) {
    throw new Error('Interpretation narrative must include a read-only disclaimer');
  }
}

export { defaultRegistry, READ_ONLY_DISCLAIMER };
