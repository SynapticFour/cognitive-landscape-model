import type { PcmsPipelineOutput } from './adapter.js';
import { PCMS_DIMENSION_KEYS } from './dimensions.js';
import { uncertaintyFromHalfWidth } from '../state/dimension.js';
import { CognitiveState } from '../state/cognitive-state.js';
import { createPcmsPipelineStateSpace, createPcmsStateSpace } from '../state/pcms-state-space.js';
import type { LandscapeSnapshot } from './snapshot.js';

export function cognitiveStateFromPcmsPipeline(output: PcmsPipelineOutput): CognitiveState {
  const space = createPcmsPipelineStateSpace();
  const coordinates = Object.fromEntries(
    PCMS_DIMENSION_KEYS.map((id) => [id, output.routingScoresPercent[id] ?? 0])
  );
  const uncertainty = Object.fromEntries(
    PCMS_DIMENSION_KEYS.map((id) => {
      const confidencePercent = output.routingConfidencePercent[id] ?? 0;
      const estimate = (output.routingScoresPercent[id] ?? 0) / 100;
      const halfWidth = (100 - confidencePercent) / 200;
      return [id, uncertaintyFromHalfWidth(estimate, halfWidth, 0, 1)];
    })
  );

  return space.createState({
    stateId: output.snapshotId,
    observedAt: output.createdAt,
    coordinates,
    uncertainty,
  });
}

export function cognitiveStateFromLandscapeSnapshot(snapshot: LandscapeSnapshot): CognitiveState {
  const space = createPcmsStateSpace();
  const uncertainty = Object.fromEntries(
    PCMS_DIMENSION_KEYS.map((id) => {
      const estimate = snapshot.profile[id];
      const confidence = snapshot.confidence[id];
      const halfWidth = (1 - confidence) / 2;
      return [id, uncertaintyFromHalfWidth(estimate, halfWidth, 0, 1)];
    })
  );

  return space.createState({
    stateId: snapshot.snapshotId,
    observedAt: snapshot.provenance.createdAt,
    coordinates: { ...snapshot.profile },
    normalized: true,
    uncertainty,
  });
}
