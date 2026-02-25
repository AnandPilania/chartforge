import type { ChartData, ChartConfig } from '../types.js';

type TransformerFn = (data: ChartData, config: ChartConfig) => ChartData | Promise<ChartData>;

interface Transformer { name: string; fn: TransformerFn }

export class DataPipeline {
    private readonly _transformers: Transformer[] = [];

    addTransformer(name: string, fn: TransformerFn): this {
        this._transformers.push({ name, fn });
        return this;
    }

    removeTransformer(name: string): void {
        const idx = this._transformers.findIndex(t => t.name === name);
        if (idx !== -1) this._transformers.splice(idx, 1);
    }

    async transform(data: ChartData, config: ChartConfig): Promise<ChartData> {
        let result = data;
        for (const t of this._transformers) {
            result = await t.fn(result, config);
        }
        return result;
    }
}
