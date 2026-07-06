export interface ProbabilisticInfluence {
  readonly influenceId: string;
  readonly parameterId: string;
  readonly observedDimensionId: string;
  /** Expected coupling strength in [-1, 1]. */
  readonly meanWeight: number;
  /** Uncertainty over the coupling — prevents deterministic one-to-one mapping. */
  readonly weightVariance: number;
}

export function validateInfluence(
  influence: ProbabilisticInfluence,
  parameterIds: ReadonlySet<string>,
  observedDimensionIds: ReadonlySet<string>
): void {
  if (!parameterIds.has(influence.parameterId)) {
    throw new Error(`Influence ${influence.influenceId} references unknown parameter "${influence.parameterId}"`);
  }
  if (!observedDimensionIds.has(influence.observedDimensionId)) {
    throw new Error(
      `Influence ${influence.influenceId} references unknown observed dimension "${influence.observedDimensionId}"`
    );
  }
  if (!Number.isFinite(influence.meanWeight) || influence.meanWeight < -1 || influence.meanWeight > 1) {
    throw new RangeError(`Influence ${influence.influenceId} meanWeight must be in [-1, 1]`);
  }
  if (!Number.isFinite(influence.weightVariance) || influence.weightVariance <= 0) {
    throw new RangeError(`Influence ${influence.influenceId} weightVariance must be > 0`);
  }
}

export function assertManyToManyStructure(
  influences: readonly ProbabilisticInfluence[],
  parameterIds: readonly string[],
  observedDimensionIds: readonly string[]
): void {
  const paramsWithMultipleTargets = new Set(
    parameterIds.filter((parameterId) => influences.filter((edge) => edge.parameterId === parameterId).length > 1)
  );
  const dimensionsWithMultipleSources = new Set(
    observedDimensionIds.filter(
      (dimensionId) => influences.filter((edge) => edge.observedDimensionId === dimensionId).length > 1
    )
  );

  if (paramsWithMultipleTargets.size === 0 && parameterIds.length > 0 && observedDimensionIds.length > 0) {
    throw new Error('Structural model requires each latent parameter to influence multiple observed dimensions');
  }
  if (dimensionsWithMultipleSources.size === 0 && parameterIds.length > 1) {
    throw new Error('Structural model requires each observed dimension to receive multiple latent influences');
  }

  const deterministicPairs = influences.filter((edge) => edge.weightVariance <= 1e-8);
  if (deterministicPairs.length > 0) {
    throw new Error('Structural influences must remain probabilistic (weightVariance must be > 0)');
  }
}
