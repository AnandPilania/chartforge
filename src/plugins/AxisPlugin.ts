import { BasePlugin } from './BasePlugin.js';
import { merge } from '../utils/misc.js';
import { createSVGElement, removeChildren } from '../utils/dom.js';
import type { Theme, ChartConfig } from '../types.js';

interface AxisCfg {
    x?: { enabled?: boolean; label?: string; fontSize?: number; tickLength?: number };
    y?: { enabled?: boolean; label?: string; fontSize?: number; tickLength?: number; ticks?: number };
}

interface ChartLike {
    theme: Theme;
    config: ChartConfig;
    svg: SVGSVGElement;
    on: (event: string, handler: () => void) => void;
}

export class AxisPlugin extends BasePlugin {
    private _group!: SVGGElement;
    private readonly _opts: Required<AxisCfg>;

    constructor(chart: unknown, cfg: AxisCfg = {}) {
        super(chart, cfg);
        this._opts = merge<Required<AxisCfg>>({
            x: { enabled: true, label: '', fontSize: 11, tickLength: 5 },
            y: { enabled: true, label: '', fontSize: 11, tickLength: 5, ticks: 5 },
        }, cfg);
    }

    init(): void {
        const c = this._chart as ChartLike;
        this._group = createSVGElement<SVGGElement>('g', { className: 'cf-axis' });
        c.svg.appendChild(this._group);
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

        if (this._opts.x?.enabled) this._drawX(W, H, p);
        if (this._opts.y?.enabled) this._drawY(W, H, p);
    }

    private _drawX(W: number, H: number, p: { top: number; right: number; bottom: number; left: number }): void {
        const c = this._chart as ChartLike;
        const xo = this._opts.x!;
        const y = H - p.bottom;
        const sx = p.left, ex = W - p.right;

        this._group.appendChild(createSVGElement('line', {
            x1: sx, y1: y, x2: ex, y2: y,
            stroke: c.theme.axis.line, 'stroke-width': 1,
        }));

        const labels = c.config.data.labels ?? [];
        const step = (ex - sx) / (labels.length || 1);

        labels.forEach((lbl, i) => {
            const x = sx + step * i + step / 2;
            this._group.appendChild(createSVGElement('line', {
                x1: x, y1: y, x2: x, y2: y + (xo.tickLength ?? 5),
                stroke: c.theme.axis.line, 'stroke-width': 1,
            }));
            const t = createSVGElement<SVGTextElement>('text', {
                x, y: y + (xo.tickLength ?? 5) + 13,
                fill: c.theme.axis.text, 'font-size': xo.fontSize ?? 11, 'text-anchor': 'middle',
            });
            t.textContent = lbl;
            this._group.appendChild(t);
        });

        if (xo.label) {
            const t = createSVGElement<SVGTextElement>('text', {
                x: (sx + ex) / 2, y: H - 8,
                fill: c.theme.text, 'font-size': (xo.fontSize ?? 11) + 2,
                'text-anchor': 'middle', 'font-weight': 'bold',
            });
            t.textContent = xo.label;
            this._group.appendChild(t);
        }
    }

    // @ts-ignore
    private _drawY(W: number, H: number, p: { top: number; right: number; bottom: number; left: number }): void {
        const c = this._chart as ChartLike;
        const yo = this._opts.y!;
        const x = p.left;
        const sy = p.top, ey = H - p.bottom;

        this._group.appendChild(createSVGElement('line', {
            x1: x, y1: sy, x2: x, y2: ey,
            stroke: c.theme.axis.line, 'stroke-width': 1,
        }));

        const nticks = yo.ticks ?? 5;
        const step = (ey - sy) / nticks;
        const allVals = (c.config.data.series ?? []).flatMap(s => s.data as number[]);
        const maxVal = allVals.length ? Math.max(...allVals) : 100;

        for (let i = 0; i <= nticks; i++) {
            const ty = ey - i * step;
            const val = ((maxVal / nticks) * i).toFixed(0);
            this._group.appendChild(createSVGElement('line', {
                x1: x - (yo.tickLength ?? 5), y1: ty, x2: x, y2: ty,
                stroke: c.theme.axis.line, 'stroke-width': 1,
            }));
            const t = createSVGElement<SVGTextElement>('text', {
                x: x - (yo.tickLength ?? 5) - 5, y: ty,
                fill: c.theme.axis.text, 'font-size': yo.fontSize ?? 11,
                'text-anchor': 'end', 'dominant-baseline': 'middle',
            });
            t.textContent = val;
            this._group.appendChild(t);
        }

        if (yo.label) {
            const mid = (sy + ey) / 2;
            const t = createSVGElement<SVGTextElement>('text', {
                x: 15, y: mid,
                fill: c.theme.text, 'font-size': (yo.fontSize ?? 11) + 2,
                'text-anchor': 'middle', 'font-weight': 'bold',
                transform: `rotate(-90,15,${mid})`,
            });
            t.textContent = yo.label;
            this._group.appendChild(t);
        }
    }
}
