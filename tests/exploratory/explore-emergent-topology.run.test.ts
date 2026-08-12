/**
 * Vitest runner for scripts/explore-emergent-topology.ts (workspace alias resolution).
 * Temporary — delete if the exploratory script is not kept in the repo.
 */
import { describe, it } from 'vitest';

import { main } from '../../scripts/explore-emergent-topology.js';

describe('exploratory emergent topology (manual console inspection)', () => {
  it(
    'prints raw topology summaries for two minClusterSupport settings',
    () => {
      main();
    },
    30_000
  );
});
