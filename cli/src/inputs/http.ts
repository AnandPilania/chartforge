import type { ParsedData } from '../types.js';
import { parseJSON } from './parser.js';
import { logger } from '../logger.js';

export interface FetchOptions {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    jq?: string;
    timeout?: number;
}

export async function fetchData(opts: FetchOptions): Promise<ParsedData> {
    const { url, method = 'GET', headers = {}, body, jq, timeout = 15_000 } = opts;

    logger.step(`Fetching ${method} ${url}`);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Accept': 'application/json', ...headers },
            body: body && method !== 'GET' ? body : undefined,
            signal: controller.signal,
        });

        clearTimeout(timer);

        if (!res.ok) {
            throw new Error(`HTTP ${res.status} ${res.statusText} from ${url}`);
        }

        const contentType = res.headers.get('content-type') ?? '';
        let raw: string;

        if (contentType.includes('json')) {
            raw = await res.text();
        } else if (contentType.includes('csv') || contentType.includes('text/plain')) {
            const { parseCSV } = await import('./parser.js');
            raw = await res.text();
            return parseCSV(raw);
        } else {
            raw = await res.text();
        }

        return parseJSON(raw, jq);
    } catch (err: unknown) {
        clearTimeout(timer);
        if ((err as Error).name === 'AbortError') {
            throw new Error(`Request to ${url} timed out after ${timeout}ms`);
        }
        throw err;
    }
}

export async function pollData(
    opts: FetchOptions,
    interval: number,
    callback: (data: ParsedData, tick: number) => void | Promise<void>,
    signal?: AbortSignal,
): Promise<void> {
    let tick = 0;
    const run = async () => {
        try {
            const data = await fetchData(opts);
            await callback(data, tick++);
        } catch (err) {
            logger.error('Poll fetch failed', err);
        }
    };

    await run();

    await new Promise<void>((resolve) => {
        const id = setInterval(async () => {
            if (signal?.aborted) { clearInterval(id); resolve(); return; }
            await run();
        }, interval * 1000);

        signal?.addEventListener('abort', () => { clearInterval(id); resolve(); });
    });
}
