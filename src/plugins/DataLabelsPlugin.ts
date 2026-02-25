import { BasePlugin } from './BasePlugin.js';
import { createSVGElement } from '../utils/dom.js';
import type { Theme, ChartConfig } from '../types.js';

export interface DataLabelsConfig {
    enabled?: boolean;
    fontSize?: number;
    color?: string;
    anchor?: 'top' | 'center' | 'bottom';
    offset?: number;
    formatter?: (value: number) => string;
    rotation?: number;
}

interface ChartLike {
    theme: Theme;
    config: ChartConfig;
    svg: SVGSVGElement;
    mainGroup: SVGGElement;
    on: (event: string, h: () => void) => void;
}

export class DataLabelsPlugin extends BasePlugin {
    private _group!: SVGGElement;
    private readonly _opts: Required<DataLabelsConfig>;

    constructor(chart: unknown, cfg: DataLabelsConfig = {}) {
        super(chart, cfg);
        const c = chart as ChartLike;
        this._opts = {
            enabled: true,
            fontSize: 11,
            color: c.theme.text,
            anchor: 'top',
            offset: 5,
            formatter: (v: number) => v.toLocaleString(),
            rotation: 0,
            ...cfg,
        };
    }

    init(): void {
        if (!this._opts.enabled) return;
        const c = this._chart as ChartLike;
        this._group = createSVGElement<SVGGElement>('g', {
            className: 'cf-data-labels',
            'pointer-events': 'none',
        });
        c.mainGroup.appendChild(this._group);
        this._els.push(this._group);

        c.on('afterRender', () => this._draw());
    }

    private _draw(): void {
        const c = this._chart as ChartLike;
        while (this._group.firstChild) this._group.removeChild(this._group.firstChild);

        const type = c.config.type;
        const data = c.config.data;
        const vb = c.svg.getAttribute('viewBox')!.split(' ').map(Number);
        const W = vb[2], H = vb[3];
        const pad = c.config.padding ?? {};
        const pl = pad.left ?? 60, pr = pad.right ?? 40;
        const pt = pad.top ?? 40, pb = pad.bottom ?? 60;
        const dw = W - pl - pr;
        const dh = H - pt - pb;

        if (type === 'column') {
            const values = data.series[0].data as number[];
            const maxVal = Math.max(...values);
            const cw = (dw / values.length) * 0.8;
            const gp = (dw / values.length) * 0.2;
            const baseY = pt + dh;

            values.forEach((v, i) => {
                const barH = (v / maxVal) * dh;
                const x = pl + i * (cw + gp) + cw / 2;
                const y = baseY - barH - this._opts.offset;
                this._addLabel(x, y, v, 'middle');
            });
        } else if (type === 'bar') {
            const values = data.series[0].data as number[];
            const maxVal = Math.max(...values);
            const bh = (dh / values.length) * 0.8;
            const gp = (dh / values.length) * 0.2;

            values.forEach((v, i) => {
                const barW = (v / maxVal) * dw;
                const x = pl + barW + this._opts.offset;
                const y = pt + i * (bh + gp) + bh / 2;
                this._addLabel(x, y, v, 'start', 'middle');
            });
        }
        // Extend to other types as needed
    }

    private _addLabel(
        x: number, y: number, value: number,
        textAnchor = 'middle', baseline = 'auto'
    ): void {
        const label = createSVGElement<SVGTextElement>('text', {
            x, y,
            fill: this._opts.color,
            'font-size': this._opts.fontSize,
            'text-anchor': textAnchor,
            'dominant-baseline': baseline,
        });
        if (this._opts.rotation !== 0) {
            label.setAttribute('transform', `rotate(${this._opts.rotation},${x},${y})`);
        }
        label.textContent = this._opts.formatter(value);
        this._group.appendChild(label);
    }
}
