import type { InterpretationPlugin } from './plugin.js';
import type { WorldviewId } from './types.js';
import { WORLDVIEWS } from './types.js';

export class WorldviewRegistry {
  readonly #plugins = new Map<WorldviewId, InterpretationPlugin>();

  register(plugin: InterpretationPlugin): this {
    if (this.#plugins.has(plugin.worldview.id)) {
      throw new Error(`Worldview plugin already registered: ${plugin.worldview.id}`);
    }
    this.#plugins.set(plugin.worldview.id, plugin);
    return this;
  }

  get(worldviewId: WorldviewId): InterpretationPlugin {
    const plugin = this.#plugins.get(worldviewId);
    if (plugin === undefined) {
      throw new Error(`No interpretation plugin registered for worldview "${worldviewId}"`);
    }
    return plugin;
  }

  has(worldviewId: WorldviewId): boolean {
    return this.#plugins.has(worldviewId);
  }

  listWorldviews(): readonly WorldviewId[] {
    return [...this.#plugins.keys()];
  }

  resolve(worldview: WorldviewId | { readonly id: WorldviewId }): InterpretationPlugin {
    const id = typeof worldview === 'string' ? worldview : worldview.id;
    if (!WORLDVIEWS[id]) {
      throw new Error(`Unknown worldview id "${id}"`);
    }
    return this.get(id);
  }
}

export function createDefaultRegistry(plugins: readonly InterpretationPlugin[]): WorldviewRegistry {
  const registry = new WorldviewRegistry();
  for (const plugin of plugins) {
    registry.register(plugin);
  }
  return registry;
}
