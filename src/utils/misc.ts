export function uid(): string {
    return `cf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function clamp(v: number, min: number, max: number): number {
    return Math.min(Math.max(v, min), max);
}

export function debounce<T extends (...args: unknown[]) => void>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let id: ReturnType<typeof setTimeout>;
    return (...args) => {
        clearTimeout(id);
        id = setTimeout(() => fn(...args), delay);
    };
}

export function throttle<T extends (...args: unknown[]) => void>(
    fn: T,
    limit: number
): (...args: Parameters<T>) => void {
    let busy = false;
    return (...args) => {
        if (!busy) {
            fn(...args);
            busy = true;
            setTimeout(() => (busy = false), limit);
        }
    };
}

export function merge<T extends object>(target: T, ...sources: Partial<T>[]): T {
    for (const src of sources) {
        if (!src) continue;
        for (const key of Object.keys(src) as (keyof T)[]) {
            const sv = src[key];
            const tv = target[key];
            if (sv && typeof sv === 'object' && !Array.isArray(sv) &&
                tv && typeof tv === 'object' && !Array.isArray(tv)) {
                merge(tv as object, sv as object);
            } else if (sv !== undefined) {
                target[key] = sv as T[keyof T];
            }
        }
    }
    return target;
}

export function flatMax(series: { data: number[] }[]): number {
    return Math.max(...series.flatMap(s => s.data));
}

export function flatMin(series: { data: number[] }[]): number {
    return Math.min(...series.flatMap(s => s.data));
}
