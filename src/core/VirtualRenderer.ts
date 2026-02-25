import type { ChartData, Series } from '../types.js';

export class VirtualRenderer {
    private _viewport = { start: 0, end: 100 };
    private readonly _threshold: number;

    constructor(private readonly _chart: {
        config: { data: ChartData; virtual?: { threshold?: number } }
    }) {
        this._threshold = _chart.config.virtual?.threshold ?? 10_000;
    }

    updateViewport(start: number, end: number): void {
        this._viewport = { start, end };
    }

    shouldVirtualize(): boolean {
        const total = this._chart.config.data.series.reduce(
            (sum, s) => sum + (Array.isArray(s.data) ? s.data.length : 0),
            0
        );
        return total > this._threshold;
    }

    getVisibleData(): ChartData {
        const { start, end } = this._viewport;
        const src = this._chart.config.data;
        return {
            series: src.series.map((s): Series => ({
                ...s,
                data: (s.data as unknown[]).slice(start, end) as Series['data'],
            })),
            ...(src.labels && { labels: src.labels.slice(start, end) })
        };
    }
}
