export interface LatentParameterPrior {
  readonly mean: number;
  readonly variance: number;
}

export interface LatentParameterPosterior {
  readonly mean: number;
  readonly variance: number;
}

/**
 * Hidden structural variable — not an observed landscape coordinate.
 * Influences multiple observed dimensions only through probabilistic mappings.
 */
export interface LatentParameter {
  readonly parameterId: string;
  readonly label: string;
  readonly prior: LatentParameterPrior;
  readonly posterior?: LatentParameterPosterior;
}

export function validateLatentPrior(prior: LatentParameterPrior, label: string): void {
  if (!Number.isFinite(prior.mean) || prior.mean < 0 || prior.mean > 1) {
    throw new RangeError(`${label} prior mean must be in [0, 1]`);
  }
  if (!Number.isFinite(prior.variance) || prior.variance <= 0) {
    throw new RangeError(`${label} prior variance must be > 0`);
  }
}

export function validateLatentParameter(parameter: LatentParameter): void {
  validateLatentPrior(parameter.prior, parameter.parameterId);
  if (parameter.posterior !== undefined) {
    validateLatentPrior(parameter.posterior, `${parameter.parameterId} posterior`);
  }
}

export function withPosterior(
  parameter: LatentParameter,
  posterior: LatentParameterPosterior
): LatentParameter {
  validateLatentPrior(posterior, `${parameter.parameterId} posterior`);
  return { ...parameter, posterior };
}
