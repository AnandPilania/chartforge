import type { IPlugin, PluginConstructor } from '../types.js';

interface PluginEntry { instance: IPlugin; config: unknown }

export class PluginManager {
    private readonly _plugins = new Map<string, PluginEntry>();
    private readonly _inited = new Set<string>();

    constructor(private readonly _chart: unknown) { }

    register(name: string, Plugin: PluginConstructor, config: unknown = {}): void {
        if (this._plugins.has(name)) {
            console.warn(`[ChartForge] Plugin "${name}" already registered`);
            return;
        }
        const instance = new Plugin(this._chart, config);
        this._plugins.set(name, { instance, config });

        if ((this._chart as { initialized: boolean }).initialized) {
            this._initOne(name, instance);
        }
    }

    get<T = IPlugin>(name: string): T | null {
        return (this._plugins.get(name)?.instance as unknown as T) ?? null;
    }

    has(name: string): boolean {
        return this._plugins.has(name);
    }

    remove(name: string): void {
        const entry = this._plugins.get(name);
        if (!entry) return;
        entry.instance.destroy?.();
        this._plugins.delete(name);
        this._inited.delete(name);
    }

    initAll(): void {
        this._plugins.forEach((entry, name) => {
            if (!this._inited.has(name)) this._initOne(name, entry.instance);
        });
    }

    destroyAll(): void {
        this._plugins.forEach(e => e.instance.destroy?.());
        this._plugins.clear();
        this._inited.clear();
    }

    private _initOne(name: string, plugin: IPlugin): void {
        plugin.init?.();
        this._inited.add(name);
    }
}
