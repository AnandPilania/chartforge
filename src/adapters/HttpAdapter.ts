import type { IAdapter, EventHandler, ChartData } from '../types.js';

export interface HttpAdapterConfig {
    url: string;
    interval?: number;              // seconds, default 5
    method?: string;              // GET | POST
    headers?: Record<string, string>;
    body?: string;
    jq?: string;              // dot-path extractor
    transform?: (raw: unknown) => ChartData;  // custom response transformer
}

/**
 * HttpAdapter — polls an HTTP endpoint on a fixed interval and emits
 * ChartForge-compatible data events.  Works in browsers and Node.js.
 *
 * Usage:
 *   chart.realTime.registerAdapter('http', HttpAdapter);
 *   chart.realTime.connect('http', {
 *     url: 'https://api.example.com/metrics',
 *     interval: 5,
 *     jq: 'data.series',
 *   });
 */
export class HttpAdapter implements IAdapter {
    private _timer: ReturnType<typeof setInterval> | null = null;
    private readonly _listeners = new Map<string, EventHandler[]>();
    private readonly _cfg: Required<Omit<HttpAdapterConfig, 'transform' | 'jq'>> & {
        transform?: HttpAdapterConfig['transform'];
        jq?: string;
    };

    constructor(config: HttpAdapterConfig) {
        this._cfg = {
            url: config.url,
            interval: config.interval ?? 5,
            method: config.method ?? 'GET',
            headers: config.headers ?? {},
            body: config.body ?? '',
            jq: config.jq,
            transform: config.transform,
        };
    }

    on(event: string, handler: EventHandler): void {
        if (!this._listeners.has(event)) this._listeners.set(event, []);
        this._listeners.get(event)!.push(handler);
    }

    private _emit(event: string, data: unknown): void {
        this._listeners.get(event)?.forEach(h => h(data));
    }

    private async _fetch(): Promise<void> {
        const { url, method, headers, body } = this._cfg;
        try {
            const res = await fetch(url, {
                method,
                headers: { Accept: 'application/json', ...headers },
                body: body && method !== 'GET' ? body : undefined,
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status} ${res.statusText}`);
            }

            let data = await res.json() as unknown;

            // jq dot-path extractor
            if (this._cfg.jq) {
                for (const key of this._cfg.jq.split('.')) {
                    data = (data as Record<string, unknown>)[key];
                }
            }

            // Custom transform
            const chartData = this._cfg.transform
                ? this._cfg.transform(data)
                : (data as ChartData);

            this._emit('data', chartData);
        } catch (err) {
            this._emit('error', err);
        }
    }

    connect(): void {
        void this._fetch();
        this._timer = setInterval(() => void this._fetch(), this._cfg.interval * 1000);
    }

    disconnect(): void {
        if (this._timer) { clearInterval(this._timer); this._timer = null; }
    }
}
