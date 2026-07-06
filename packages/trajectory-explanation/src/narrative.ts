import type { FeedbackGraph } from '@clm/dynamics';
import type { StructuralModel } from '@clm/structural';

import type {
  CausalLink,
  InitialConditionsSummary,
  TimeStepExplanation,
  TrajectoryExplanation,
  VariableChange,
} from './types.js';
import { formatPercent, formatTimestamp } from './types.js';

export function summarizeInitialConditions(initial: InitialConditionsSummary): string {
  const values = initial.variables
    .map((variable) => `${variable.variableId}=${formatPercent(variable.value)}`)
    .join(', ');
  return `At ${formatTimestamp(initial.observedAt)}, the trajectory began (${initial.stateId}) with ${values}.`;
}

export function summarizeFeedbackGraph(graph: FeedbackGraph): string {
  const edgeCount = graph.edges().length;
  const loopCount = graph.loops().length;
  return `Dynamics followed feedback graph "${graph.graphId}" with ${edgeCount} directed edge(s) and ${loopCount} loop(s) over variables [${graph.dimensionIds.join(', ')}].`;
}

export function summarizeStructuralModel(model: StructuralModel): string {
  const parameterLabels = model.parameters.map((parameter) => parameter.label).join(', ');
  return `Structural constraints from model "${model.modelId}" apply probabilistic bias through latent parameters: ${parameterLabels}. These shape dynamics but are not identical to observed variables.`;
}

export function summarizeStep(
  stepIndex: number,
  observedAt: string,
  changes: readonly VariableChange[],
  links: readonly CausalLink[]
): string {
  const movers = changes.filter((change) => Math.abs(change.delta) >= 1e-4);
  const changeText =
    movers.length === 0
      ? 'No meaningful coordinate changes occurred.'
      : movers
          .map((change) => `${change.variableId} ${formatPercent(change.from)}→${formatPercent(change.to)} (Δ ${formatPercent(change.delta)})`)
          .join('; ');

  const topCauses = links
    .filter((link) => link.linkType !== 'damping')
    .slice(0, 3)
    .map((link) => link.description)
    .join(' ');

  return `Step ${stepIndex} at ${formatTimestamp(observedAt)}: ${changeText}${topCauses ? ` Primary causes: ${topCauses}` : ''}`;
}

export function buildNarrative(explanation: Omit<TrajectoryExplanation, 'narrative'>): string {
  const sections: string[] = [
    `# Trajectory Explanation: ${explanation.runId}`,
    '',
    '## Initial conditions',
    explanation.initialConditions.summary,
    '',
    '## Feedback dynamics',
    explanation.feedbackOverview,
  ];

  if (explanation.structuralOverview !== undefined) {
    sections.push('', '## Structural constraints', explanation.structuralOverview);
  }

  sections.push('', '## Time-aware timeline');
  for (const step of explanation.timeline) {
    sections.push(`### ${step.summary}`);
    for (const link of step.causalLinks) {
      sections.push(`- [${link.linkType}] ${link.description}`);
    }
  }

  sections.push('', '## Causal chain (ordered)');
  for (const link of explanation.causalChain) {
    sections.push(
      `${link.sequence}. t${link.stepIndex} @ ${formatTimestamp(link.observedAt)} — ${link.linkType} (${link.causeId}): ${link.description}`
    );
  }

  sections.push(
    '',
    '_This explanation links landscape coordinates (what is) with dynamics and structural mechanisms (how it changed). It is descriptive of the model run, not a clinical or moral verdict._'
  );

  return sections.join('\n');
}

export function summarizeChanges(changes: readonly VariableChange[]): string {
  const movers = changes.filter((change) => Math.abs(change.delta) >= 1e-4);
  if (movers.length === 0) {
    return 'State remained stable across this interval.';
  }
  return movers
    .map((change) => `${change.variableId} shifted by ${formatPercent(change.delta)}`)
    .join(', ');
}
