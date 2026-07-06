import type { TransitionEngine } from '@clm/dynamics';
import type { FeedbackGraph, InfluenceEdge } from '@clm/dynamics';
import { nearestAttractor } from '@clm/dynamics';
import type { StructuralModel } from '@clm/structural';
import type { CognitiveState } from '@clm/landscape';

import type { CausalLink, CausalLinkType } from './types.js';
import { formatPercent } from './types.js';

export interface StepAttributionInput {
  readonly engine: TransitionEngine;
  readonly graph: FeedbackGraph;
  readonly structuralModel?: StructuralModel;
  readonly stepIndex: number;
  readonly previous: CognitiveState;
  readonly next: CognitiveState;
  readonly history: readonly CognitiveState[];
}

function edgeContribution(
  edge: InfluenceEdge,
  current: Readonly<Record<string, number>>,
  history: readonly Readonly<Record<string, number>>[],
  stepIndex: number,
  stepSize: number
): number {
  const delay = edge.delaySteps ?? 0;
  const sourceSnapshot =
    delay > 0 && stepIndex - delay >= 0
      ? history[stepIndex - delay]
      : delay > 0
        ? history[0] ?? current
        : current;

  const sourceValue = sourceSnapshot?.[edge.source];
  const targetValue = current[edge.target];
  if (sourceValue === undefined || targetValue === undefined) {
    return 0;
  }

  return edge.weight * stepSize * (sourceValue - targetValue);
}

function structuralContribution(
  model: StructuralModel,
  variableId: string
): { parameterId: string; contribution: number; description: string }[] {
  const influences = model.influencesOnDimension(variableId);
  return influences.map((influence) => {
    const parameter = model.parameter(influence.parameterId);
    const posterior = parameter.posterior ?? parameter.prior;
    const contribution = influence.meanWeight * (posterior.mean - 0.5) * 0.05;
    return {
      parameterId: influence.parameterId,
      contribution,
      description: `Latent parameter "${parameter.label}" (${influence.parameterId}) probabilistically biases "${variableId}" with expected coupling ${influence.meanWeight.toFixed(2)} and posterior mean ${formatPercent(posterior.mean)}.`,
    };
  });
}

export function attributeStepTransition(input: StepAttributionInput): CausalLink[] {
  const { engine, graph, structuralModel, stepIndex, previous, next, history } = input;
  const config = engine.config;
  const mobility = 1 - config.damping;
  const current = previous.coordinates();
  const coordinateHistory = history.map((state) => state.coordinates());
  const links: CausalLink[] = [];
  let sequence = 0;

  const pushLink = (link: Omit<CausalLink, 'sequence' | 'stepIndex' | 'observedAt'>): void => {
    sequence += 1;
    links.push({
      sequence,
      stepIndex,
      observedAt: next.observedAt,
      ...link,
    });
  };

  for (const edge of graph.edges()) {
    const raw = edgeContribution(edge, current, coordinateHistory, stepIndex, config.stepSize);
    const applied = mobility * raw;
    if (Math.abs(applied) < 1e-6) {
      continue;
    }

    pushLink({
      linkType: 'feedback-edge',
      causeId: edge.edgeId,
      sourceVariable: edge.source,
      targetVariable: edge.target,
      magnitude: applied,
      description: `Feedback edge ${edge.edgeId}: ${edge.source} → ${edge.target} (weight ${edge.weight}) contributed ${formatPercent(Math.abs(applied))} toward the change in ${edge.target}.`,
    });
  }

  for (const loop of graph.loops()) {
    const pathDeltas = loop.path.map((variableId) => next.coordinate(variableId) - previous.coordinate(variableId));
    const pathActivity = pathDeltas.reduce((sum, delta) => sum + Math.abs(delta), 0);
    if (pathActivity < 1e-6) {
      continue;
    }

    const applied = mobility * loop.gain * config.stepSize * pathActivity;

    pushLink({
      linkType: 'feedback-loop',
      causeId: loop.loopId,
      magnitude: applied,
      description: `Feedback loop ${loop.loopId} couples [${loop.path.join(' → ')}]; coordinated activity (${formatPercent(pathActivity)}) redistributed change across the loop with gain ${loop.gain}.`,
    });
  }

  const nearest = nearestAttractor(current, graph.dimensionIds, engine.attractors);
  if (nearest !== undefined) {
    for (const variableId of graph.dimensionIds) {
      const currentValue = current[variableId]!;
      const targetValue = nearest.attractor.centroid[variableId]!;
      const raw = config.attractorPull * config.stepSize * (targetValue - currentValue);
      const applied = mobility * raw;
      if (Math.abs(applied) < 1e-6) {
        continue;
      }

      pushLink({
        linkType: 'attractor-pull',
        causeId: nearest.attractor.attractorId,
        targetVariable: variableId,
        magnitude: applied,
        description: `Attractor ${nearest.attractor.attractorId} pulled ${variableId} toward centroid value ${formatPercent(targetValue)} (contribution ${formatPercent(Math.abs(applied))}).`,
      });
    }
  }

  if (structuralModel !== undefined) {
    for (const change of graph.dimensionIds) {
      const previousValue = previous.coordinate(change);
      const nextValue = next.coordinate(change);
      if (Math.abs(nextValue - previousValue) < 1e-6) {
        continue;
      }

      for (const structural of structuralContribution(structuralModel, change)) {
        if (Math.abs(structural.contribution) < 1e-6) {
          continue;
        }

        pushLink({
          linkType: 'structural-constraint',
          causeId: structural.parameterId,
          targetVariable: change,
          magnitude: structural.contribution,
          description: structural.description,
        });
      }
    }
  }

  const totalDelta = engine.computeDelta(current, coordinateHistory, stepIndex);
  for (const variableId of graph.dimensionIds) {
    const raw = totalDelta[variableId] ?? 0;
    const applied = mobility * raw;
    const actual = next.coordinate(variableId) - previous.coordinate(variableId);
    const dampingEffect = actual - applied;
    if (Math.abs(dampingEffect) > 1e-4) {
      pushLink({
        linkType: 'damping',
        causeId: `damping-${config.damping}`,
        targetVariable: variableId,
        magnitude: dampingEffect,
        description: `Damping (${formatPercent(config.damping)}) scaled raw dynamics on ${variableId}, leaving observed shift ${formatPercent(actual)} after inertia.`,
      });
    }
  }

  return links;
}

export function buildInitialConditionLinks(state: CognitiveState): CausalLink[] {
  return state.dimensionIds().map((variableId, index) => {
    const value = state.coordinate(variableId);
    const uncertainty = state.uncertainty(variableId);
    return {
      sequence: index + 1,
      stepIndex: 0,
      observedAt: state.observedAt,
      linkType: 'initial-condition' as CausalLinkType,
      causeId: `init-${variableId}`,
      targetVariable: variableId,
      magnitude: value,
      description: `Initial condition: ${variableId} started at ${formatPercent(value)} (uncertainty ${formatPercent(uncertainty.lower)}–${formatPercent(uncertainty.upper)}).`,
    };
  });
}
