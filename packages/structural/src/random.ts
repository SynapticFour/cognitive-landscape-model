/** Deterministic pseudo-random source for reproducible probabilistic sampling. */
export interface RandomSource {
  next(): number;
}

export function createSeededRandom(seed: number): RandomSource {
  let state = seed >>> 0;
  return {
    next(): number {
      state = (state * 1_664_525 + 1_013_904_223) >>> 0;
      return state / 0x1_0000_0000;
    },
  };
}

export function sampleStandardNormal(rng: RandomSource): number {
  let u = 0;
  let v = 0;
  while (u === 0) {
    u = rng.next();
  }
  while (v === 0) {
    v = rng.next();
  }
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function sampleNormal(rng: RandomSource, mean: number, variance: number): number {
  if (variance < 0) {
    throw new RangeError('Variance must be non-negative');
  }
  return mean + Math.sqrt(variance) * sampleStandardNormal(rng);
}

export function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}
