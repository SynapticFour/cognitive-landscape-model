import type { CognitiveState } from '@clm/landscape';

import { createNarrativeProvenance } from '../core/provenance.js';
import type { InterpretationPlugin } from '../core/plugin.js';
import type { DimensionReading, InterpretOptions, InterpretationNarrative } from '../core/types.js';
import {
  formatCoordinatePercent,
  poleLabel,
  READ_ONLY_DISCLAIMER,
  WORLDVIEWS,
} from '../core/types.js';

function buildDimensionReadings(
  state: CognitiveState,
  render: (args: {
    dimensionId: string;
    constructId: string;
    coordinate: number;
    lower: number;
    upper: number;
    pole: ReturnType<typeof poleLabel>;
  }) => string
): DimensionReading[] {
  return state.dimensionIds().map((dimensionId) => {
    const dimension = state.stateSpace.dimension(dimensionId);
    const coordinate = state.coordinate(dimensionId);
    const uncertainty = state.uncertainty(dimensionId);
    const pole = poleLabel(dimension.lowPole, dimension.highPole, coordinate);

    return {
      dimensionId,
      constructId: dimension.constructId,
      coordinate,
      uncertaintyLower: uncertainty.lower,
      uncertaintyUpper: uncertainty.upper,
      reading: render({
        dimensionId,
        constructId: dimension.constructId,
        coordinate,
        lower: uncertainty.lower,
        upper: uncertainty.upper,
        pole,
      }),
    };
  });
}

function defaultOptions(state: CognitiveState, options?: InterpretOptions) {
  return {
    narrativeId: options?.narrativeId ?? `narr-${state.stateId}`,
    createdAt: options?.createdAt ?? state.observedAt,
    measurementContext: options?.measurementBundle,
  };
}

export const scientificPsychologicalPlugin: InterpretationPlugin = {
  worldview: WORLDVIEWS['scientific-psychological'],

  interpret(state: CognitiveState, options?: InterpretOptions): InterpretationNarrative {
    const { narrativeId, createdAt, measurementContext } = defaultOptions(state, options);
    const readings = buildDimensionReadings(state, ({ constructId, coordinate, lower, upper, pole }) => {
      return `Construct "${constructId}" is positioned at ${formatCoordinatePercent(coordinate)} toward the ${pole.label} (uncertainty band ${formatCoordinatePercent(lower)}–${formatCoordinatePercent(upper)}). This is a correlational description, not a diagnostic classification.`;
    });

    const elevated = readings.filter((reading) => reading.coordinate > 0.65 || reading.coordinate < 0.35);

    return {
      narrativeId,
      worldviewId: 'scientific-psychological',
      disclaimer: READ_ONLY_DISCLAIMER,
      headline: 'Construct-continuous psychological reading',
      summary:
        elevated.length > 0
          ? `The state vector shows ${elevated.length} construct axis/axes away from the midrange. These are dimensional tendencies suitable for research hypotheses and self-reflection — not labels.`
          : 'The state vector sits largely in midrange across constructs, suggesting balanced tendencies on measured continua within current uncertainty bands.',
      dimensionReadings: readings,
      closingNote:
        'This frame describes how coordinates can be read in psychological research language. It does not assert etiology, disorder status, or treatment need.',
      provenance: createNarrativeProvenance('scientific-psychological', createdAt, narrativeId),
      ...(measurementContext !== undefined ? { measurementContext } : {}),
    };
  },
};

export const systemsTheoryPlugin: InterpretationPlugin = {
  worldview: WORLDVIEWS['systems-theory'],

  interpret(state: CognitiveState, options?: InterpretOptions): InterpretationNarrative {
    const { narrativeId, createdAt, measurementContext } = defaultOptions(state, options);
    const readings = buildDimensionReadings(state, ({ dimensionId, coordinate, lower, upper, pole }) => {
      return `Variable "${dimensionId}" sits at ${formatCoordinatePercent(coordinate)} in state space (${pole.toward} pole region; tolerance ${formatCoordinatePercent(lower)}–${formatCoordinatePercent(upper)}). In a coupled system, this level would participate in feedback with other variables rather than acting in isolation.`;
    });

    const spread =
      Math.max(...readings.map((reading) => reading.coordinate)) -
      Math.min(...readings.map((reading) => reading.coordinate));

    return {
      narrativeId,
      worldviewId: 'systems-theory',
      disclaimer: READ_ONLY_DISCLAIMER,
      headline: 'Systems-level pattern reading',
      summary:
        spread > 0.35
          ? `The profile shows heterogeneous variable levels (spread ≈ ${formatCoordinatePercent(spread)}), a pattern consistent with differentiated subsystems rather than a single uniform mode.`
          : 'The profile shows relatively uniform variable levels, consistent with a tightly coupled regime near a shared operating point.',
      dimensionReadings: readings,
      closingNote:
        'Systems readings describe interaction geometry. They are non-causal maps and do not modify the underlying state vector.',
      provenance: createNarrativeProvenance('systems-theory', createdAt, narrativeId),
      ...(measurementContext !== undefined ? { measurementContext } : {}),
    };
  },
};

export const christianTheologicalPlugin: InterpretationPlugin = {
  worldview: WORLDVIEWS['christian-theological'],

  interpret(state: CognitiveState, options?: InterpretOptions): InterpretationNarrative {
    const { narrativeId, createdAt, measurementContext } = defaultOptions(state, options);
    const readings = buildDimensionReadings(state, ({ constructId, coordinate, pole }) => {
      if (pole.toward === 'mid') {
        return `In an anthropological frame, "${constructId}" appears in a middle region — neither extreme pole dominates. This may be read as a space for discernment rather than a verdict on the person.`;
      }
      return `In an anthropological frame, "${constructId}" leans toward ${pole.label} (${formatCoordinatePercent(coordinate)}). This describes a pattern of capacity and limit held together, not a moral score or medical label.`;
    });

    return {
      narrativeId,
      worldviewId: 'christian-theological',
      disclaimer: `${READ_ONLY_DISCLAIMER} Theological language here is an optional interpretive lens, not church authority or pastoral directive.`,
      headline: 'Anthropological theological reading (optional frame)',
      summary:
        'The coordinate pattern is offered as material for wisdom-oriented reflection: giftedness, finitude, and context interact, but the map is not the person.',
      dimensionReadings: readings,
      closingNote:
        'Use this frame only where it is welcome. It neither replaces clinical care nor rewrites the measured state.',
      provenance: createNarrativeProvenance('christian-theological', createdAt, narrativeId),
      ...(measurementContext !== undefined ? { measurementContext } : {}),
    };
  },
};

