import { BasePlugin } from './BasePlugin.js';
import { merge } from '../utils/misc.js';
import { createSVGElement, removeChildren } from '../utils/dom.js';
import type { Theme, ChartConfig } from '../types.js';

interface GridCfg {
    enabled?: boolean;
    x?: { enabled?: boolean; color?: string; strokeWidth?: number; dashArray?: string };
    y?: { enabled?: boolean; color?: string; strokeWidth?: number; dashArray?: string; ticks?: number };
}

interface ChartLike {
    theme: Theme;
    config: ChartConfig;
    svg: SVGSVGElement;
    mainGroup: SVGGElement;
    on: (event: string, handler: () => void) => void;
}

export class GridPlugin extends BasePlugin {
    private _group!: SVGGElement;
    private readonly _opts: Required<GridCfg>;

    constructor(chart: unknown, cfg: GridCfg = {}) {
        super(chart, cfg);
        const c = chart as ChartLike;
        this._opts = merge<Required<GridCfg>>({
            enabled: true,
            x: { enabled: true, color: c.theme.axis.grid, strokeWidth: 1, dashArray: '2,2' },
            y: { enabled: true, color: c.theme.axis.grid, strokeWidth: 1, dashArray: '2,2', ticks: 5 },
        }, cfg);
    }

    init(): void {
        if (!this._opts.enabled) return;
        const c = this._chart as ChartLike;
        this._group = createSVGElement<SVGGElement>('g', { className: 'cf-grid' });
        c.mainGroup.insertBefore(this._group, c.mainGroup.firstChild);
        this._els.push(this._group);
        this._draw();
        c.on('beforeRender', () => this._draw());
    }

    private _draw(): void {
        const c = this._chart as ChartLike;
        removeChildren(this._group);
        const vb = c.svg.getAttribute('viewBox')!.split(' ').map(Number);
        const W = vb[2], H = vb[3];
        const pad = c.config.padding ?? {};
        const p = { top: pad.top ?? 40, right: pad.right ?? 40, bottom: pad.bottom ?? 60, left: pad.left ?? 60 };
        const sx = p.left, ex = W - p.right;
        const sy = p.top, ey = H - p.bottom;

        if (this._opts.y?.enabled) {
            const nticks = this._opts.y.ticks ?? 5;
            const step = (ey - sy) / nticks;
            for (let i = 0; i <= nticks; i++) {
                const y = ey - i * step;
                this._group.appendChild(createSVGElement('line', {
                    x1: sx, y1: y, x2: ex, y2: y,
                    stroke: this._opts.y.color ?? '#ccc',
                    'stroke-width': this._opts.y.strokeWidth ?? 1,
                    'stroke-dasharray': this._opts.y.dashArray ?? '2,2',
                    opacity: '0.5',
                }));
            }
        }

        if (this._opts.x?.enabled) {
            const labels = c.config.data.labels ?? [];
            const step = (ex - sx) / (labels.length || 1);
            for (let i = 0; i <= labels.length; i++) {
                const x = sx + step * i;
                this._group.appendChild(createSVGElement('line', {
                    x1: x, y1: sy, x2: x, y2: ey,
                    stroke: this._opts.x.color ?? '#ccc',
                    'stroke-width': this._opts.x.strokeWidth ?? 1,
                    'stroke-dasharray': this._opts.x.dashArray ?? '2,2',
                    opacity: '0.5',
                }));
            }
        }
    }
}
