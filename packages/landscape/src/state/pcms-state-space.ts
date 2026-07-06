import type { SemVer } from '@clm/core';

import { PCMS_AXIS_DEFINITIONS, PCMS_DIMENSION_KEYS, PCMS_INSTRUMENT_ID } from '../pcms/dimensions.js';
import { StateSpace, type StateDimension } from './state-space.js';

export const PCMS_STATE_SPACE_ID = 'pcms-routing-v1' as const;
export const PCMS_STATE_SPACE_VERSION = '0.1.0' as const satisfies SemVer;

const UNIT_INTERVAL: StateDimension['normalization'] = {
  inputMin: 0,
  inputMax: 1,
  outputMin: 0,
  outputMax: 1,
};

/** Percent-scale normalization for legacy PCMS pipeline output (0–100 → 0–1). */
const PERCENT_INTERVAL: StateDimension['normalization'] = {
  inputMin: 0,
  inputMax: 100,
  outputMin: 0,
  outputMax: 1,
};

function pcmsDimensions(usePercentInput: boolean): readonly StateDimension[] {
  return PCMS_DIMENSION_KEYS.map((id) => {
    const axis = PCMS_AXIS_DEFINITIONS[id];
    return {
      id,
      constructId: axis.constructId,
      description: axis.lowPole.replace(/-/g, ' ') + ' ↔ ' + axis.highPole.replace(/-/g, ' '),
      normalization: usePercentInput ? PERCENT_INTERVAL : UNIT_INTERVAL,
      lowPole: axis.lowPole,
      highPole: axis.highPole,
    };
  });
}

/** Preconfigured PCMS routing space — instrument preset, not a hardcoded core dependency. */
export function createPcmsStateSpace(options?: { percentInput?: boolean }): StateSpace {
  return StateSpace.define({
    spaceId: PCMS_STATE_SPACE_ID,
    instrumentId: PCMS_INSTRUMENT_ID,
    version: PCMS_STATE_SPACE_VERSION,
    dimensions: pcmsDimensions(options?.percentInput ?? false),
  });
}

/** PCMS pipeline adapter space (0–100 percent coordinates). */
export function createPcmsPipelineStateSpace(): StateSpace {
  return createPcmsStateSpace({ percentInput: true });
}

export function createCustomStateSpace(config: {
  spaceId: string;
  instrumentId: string;
  version: SemVer;
  dimensions: readonly StateDimension[];
}): StateSpace {
  return StateSpace.define(config);
}
