import { createProvenance } from '@clm/core';

import { INTERPRETATION_VERSION, type WorldviewId } from './types.js';

export function createNarrativeProvenance(
  worldviewId: WorldviewId,
  createdAt: string,
  narrativeId: string
) {
  return createProvenance('interpretation', worldviewId, INTERPRETATION_VERSION, createdAt, narrativeId);
}
