export interface AttractorState {
  readonly attractorId: string;
  /** Stable cluster centroid keyed by state variable id. */
  readonly centroid: Readonly<Record<string, number>>;
  /** Convergence radius in normalized coordinate space. */
  readonly radius: number;
}

export interface AttractorMatch {
  readonly attractor: AttractorState;
  readonly distance: number;
  readonly withinBasin: boolean;
}

function euclideanDistance(
  a: Readonly<Record<string, number>>,
  b: Readonly<Record<string, number>>,
  dimensionIds: readonly string[]
): number {
  let sum = 0;
  for (const id of dimensionIds) {
    const av = a[id];
    const bv = b[id];
    if (av === undefined || bv === undefined) {
      throw new Error(`Missing coordinate for dimension "${id}" in attractor distance calculation`);
    }
    const delta = av - bv;
    sum += delta * delta;
  }
  return Math.sqrt(sum);
}

export function validateAttractor(
  attractor: AttractorState,
  dimensionIds: readonly string[]
): void {
  if (!(attractor.radius > 0)) {
    throw new RangeError(`Attractor ${attractor.attractorId} radius must be > 0`);
  }
  for (const id of dimensionIds) {
    const value = attractor.centroid[id];
    if (value === undefined) {
      throw new Error(`Attractor ${attractor.attractorId} missing centroid for "${id}"`);
    }
    if (!Number.isFinite(value)) {
      throw new RangeError(`Attractor ${attractor.attractorId} centroid for "${id}" must be finite`);
    }
  }
}

export function matchAttractor(
  coordinates: Readonly<Record<string, number>>,
  dimensionIds: readonly string[],
  attractor: AttractorState
): AttractorMatch {
  validateAttractor(attractor, dimensionIds);
  const distance = euclideanDistance(coordinates, attractor.centroid, dimensionIds);
  return {
    attractor,
    distance,
    withinBasin: distance <= attractor.radius,
  };
}

export function nearestAttractor(
  coordinates: Readonly<Record<string, number>>,
  dimensionIds: readonly string[],
  attractors: readonly AttractorState[]
): AttractorMatch | undefined {
  if (attractors.length === 0) {
    return undefined;
  }

  let best: AttractorMatch | undefined;
  for (const attractor of attractors) {
    const match = matchAttractor(coordinates, dimensionIds, attractor);
    if (best === undefined || match.distance < best.distance) {
      best = match;
    }
  }
  return best;
}

export function settledAttractor(
  coordinates: Readonly<Record<string, number>>,
  dimensionIds: readonly string[],
  attractors: readonly AttractorState[]
): AttractorState | undefined {
  return nearestAttractor(coordinates, dimensionIds, attractors)?.attractor;
}
