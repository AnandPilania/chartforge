import type { IAdapter, EventHandler, ChartData } from '../types.js';

interface PollingConfig { url: string; interval?: number }

export class PollingAdapter implements IAdapter {
    private _timer: ReturnType<typeof setInterval> | null = null;
    private readonly _listeners = new Map<string, EventHandler[]>();

    constructor(private readonly _config: PollingConfig) { }

    on(event: string, handler: EventHandler): void {
        if (!this._listeners.has(event)) this._listeners.set(event, []);
        this._listeners.get(event)!.push(handler);
    }

    private _emit(event: string, data: unknown): void {
        this._listeners.get(event)?.forEach(h => h(data));
    }

    private async _poll(): Promise<void> {
        try {
            const res = await fetch(this._config.url);
            const data = (await res.json()) as ChartData;
            this._emit('data', data);
        } catch (err) {
            this._emit('error', err);
        }
    }

    connect(): void {
        void this._poll();
        this._timer = setInterval(() => void this._poll(), this._config.interval ?? 5_000);
    }

    disconnect(): void {
        if (this._timer) { clearInterval(this._timer); this._timer = null; }
    }
}
