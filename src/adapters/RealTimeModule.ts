import type { IAdapter, AdapterConstructor, ChartData } from '../types.js';

export class RealTimeModule {
    private readonly _registry = new Map<string, AdapterConstructor>();
    private readonly _connections = new Map<string, IAdapter>();

    constructor(private readonly _chart: { updateData(data: ChartData): void }) { }

    registerAdapter(name: string, Adapter: AdapterConstructor): void {
        this._registry.set(name, Adapter);
    }

    connect(type: string, config: unknown): void {
        const Adapter = this._registry.get(type);
        if (!Adapter) {
            console.error(`[ChartForge] Real-time adapter "${type}" not registered`);
            return;
        }
        const adapter = new Adapter(config);
        adapter.on('data', (data) => this._chart.updateData(data as ChartData));
        void adapter.connect();
        this._connections.set(type, adapter);
    }

    disconnect(type: string): void {
        const adapter = this._connections.get(type);
        if (adapter) { adapter.disconnect(); this._connections.delete(type); }
    }

    disconnectAll(): void {
        this._connections.forEach(a => a.disconnect());
        this._connections.clear();
    }
}
