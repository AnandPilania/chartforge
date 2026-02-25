import type { MiddlewareFn, RenderContext } from '../types.js';

export class MiddlewarePipeline {
    private readonly _fns: MiddlewareFn[] = [];

    use(fn: MiddlewareFn): this {
        this._fns.push(fn);
        return this;
    }

    async execute(ctx: RenderContext): Promise<RenderContext> {
        let i = 0;
        const next = async (): Promise<void> => {
            if (i >= this._fns.length) return;
            await this._fns[i++](ctx, next);
        };
        await next();
        return ctx;
    }
}
