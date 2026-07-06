import type { CognitiveState } from '@clm/landscape';

import type { InterpretationNarrative, InterpretOptions, Worldview } from './types.js';

/**
 * Read-only worldview plugin contract.
 * Implementations must never mutate {@link CognitiveState} or any measurement artifact.
 */
export interface InterpretationPlugin {
  readonly worldview: Worldview;
  interpret(state: CognitiveState, options?: InterpretOptions): InterpretationNarrative;
}

export type ReadonlyCognitiveState = CognitiveState;

export function assertReadOnlyInput(state: CognitiveState): void {
  if (typeof state.coordinate !== 'function' || typeof state.coordinates !== 'function') {
    throw new TypeError('interpret() requires a CognitiveState instance');
  }
}
