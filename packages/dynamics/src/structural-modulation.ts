import type {
  ProbabilisticDynamicsModulator,
  ProbabilisticDynamicsSample,
  TransitionModifierInput,
  TransitionModifierOutput,
} from '@clm/structural';
import { applyStructuralInfluence, createSeededRandom, type RandomSource } from '@clm/structural';

export interface StructuralModulationConfig {
  readonly modulator: ProbabilisticDynamicsModulator;
  readonly randomSeed?: number;
  readonly random?: RandomSource;
}

export function createStructuralRandomSource(config: StructuralModulationConfig): RandomSource {
  if (config.random !== undefined) {
    return config.random;
  }
  return createSeededRandom(config.randomSeed ?? 42);
}

export function applySampleAsModifier(
  base: TransitionModifierInput,
  sample: ProbabilisticDynamicsSample
): TransitionModifierOutput {
  return applyStructuralInfluence(base, sample);
}
