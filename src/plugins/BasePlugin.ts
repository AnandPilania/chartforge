import type { IPlugin } from '../types.js';

export abstract class BasePlugin implements IPlugin {
    protected readonly _els: Element[] = [];

    constructor(protected readonly _chart: unknown, protected readonly _cfg: unknown) { }

    init?(): void;

    destroy(): void {
        this._els.forEach(el => el.parentNode?.removeChild(el));
        this._els.length = 0;
    }
}
