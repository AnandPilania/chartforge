import type { IAdapter, EventHandler, ChartData } from '../types.js';

interface WSConfig { url: string }

export class WebSocketAdapter implements IAdapter {
    private _ws: WebSocket | null = null;
    private readonly _listeners = new Map<string, EventHandler[]>();

    constructor(private readonly _config: WSConfig) { }

    on(event: string, handler: EventHandler): void {
        if (!this._listeners.has(event)) this._listeners.set(event, []);
        this._listeners.get(event)!.push(handler);
    }

    private _emit(event: string, data: unknown): void {
        this._listeners.get(event)?.forEach(h => h(data));
    }

    connect(): void {
        this._ws = new WebSocket(this._config.url);
        this._ws.addEventListener('message', e => {
            try {
                const data = JSON.parse(e.data as string) as ChartData;
                this._emit('data', data);
            } catch {
                console.warn('[ChartForge] WebSocketAdapter: invalid JSON', e.data);
            }
        });
        this._ws.addEventListener('error', e => this._emit('error', e));
    }

    disconnect(): void {
        this._ws?.close();
        this._ws = null;
    }

    send(data: unknown): void {
        if (this._ws?.readyState === WebSocket.OPEN) {
            this._ws.send(JSON.stringify(data));
        }
    }
}
