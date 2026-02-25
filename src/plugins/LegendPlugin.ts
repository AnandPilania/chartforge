import { BasePlugin } from './BasePlugin.js';
import { merge } from '../utils/misc.js';
import { createSVGElement, removeChildren } from '../utils/dom.js';
import type { Theme, Series } from '../types.js';

interface LegendConfig {
    enabled?: boolean;
    position?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'start' | 'center' | 'end';
    layout?: 'horizontal' | 'vertical';
    fontSize?: number;
    itemSpacing?: number;
    markerSize?: number;
    markerType?: 'square' | 'circle' | 'line';
    clickable?: boolean;
}

interface ChartLike {
    theme: Theme;
    config: { data: { labels?: string[]; series: Series[] } };
    svg: SVGSVGElement;
    on: (event: string, handler: () => void) => void;
    render: () => void;
}

export class LegendPlugin extends BasePlugin {
    private _group!: SVGGElement;
    private readonly _hidden = new Set<number>();
    private _origSeries: Series[] = [];
    private readonly _opts: Required<LegendConfig>;

    constructor(chart: unknown, cfg: LegendConfig = {}) {
        super(chart, cfg);
        const defaults: Required<LegendConfig> = {
            enabled: true,
            position: 'bottom',
            align: 'center',
            layout: 'horizontal',
            fontSize: 12,
            itemSpacing: 12,
            markerSize: 12,
            markerType: 'square',
            clickable: true,
        };
        this._opts = merge(defaults, cfg);
    }

    init(): void {
        if (!this._opts.enabled) return;
        const c = this._chart as ChartLike;
        this._origSeries = [...c.config.data.series];

        this._group = createSVGElement<SVGGElement>('g', { className: 'cf-legend' });
        c.svg.appendChild(this._group);
        this._els.push(this._group);

        this._draw();
        c.on('afterRender', () => {
            this._origSeries = [...c.config.data.series];
            this._draw();
        });
    }

    private _draw(): void {
        const c = this._chart as ChartLike;
        removeChildren(this._group);
        const series = this._origSeries;
        if (!series.length) return;

        const vb = c.svg.getAttribute('viewBox')!.split(' ').map(Number);
        const W = vb[2], H = vb[3];
        const o = this._opts;
        const step = 110;

        let x = 0, y = 0;
        if (o.position === 'bottom') { y = H - 28; x = this._alignX(W, series.length, step); }
        else if (o.position === 'top') { y = 8; x = this._alignX(W, series.length, step); }
        else if (o.position === 'left') { x = 8; y = (H - series.length * (o.markerSize + o.itemSpacing)) / 2; }
        else { x = W - 110; y = (H - series.length * (o.markerSize + o.itemSpacing)) / 2; }

        series.forEach((s, i) => {
            const item = this._item(s, i, x, y);
            this._group.appendChild(item);
            o.layout === 'horizontal' ? (x += step) : (y += o.markerSize + o.itemSpacing);
        });
    }

    private _alignX(W: number, count: number, step: number): number {
        const total = count * step;
        const o = this._opts;
        if (o.align === 'center') return (W - total) / 2;
        if (o.align === 'end') return W - total - 20;
        return 20;
    }

    private _item(s: Series, i: number, x: number, y: number): SVGGElement {
        const c = this._chart as ChartLike;
        const o = this._opts;
        const hidden = this._hidden.has(i);
        const color = c.theme.colors[i % c.theme.colors.length];
        const opacity = hidden ? 0.3 : 1;
        const group = createSVGElement<SVGGElement>('g');

        let marker: SVGElement;
        if (o.markerType === 'circle') {
            marker = createSVGElement('circle', {
                cx: x + o.markerSize / 2, cy: y + o.markerSize / 2,
                r: o.markerSize / 2, fill: color, opacity,
            });
        } else if (o.markerType === 'line') {
            marker = createSVGElement('line', {
                x1: x, y1: y + o.markerSize / 2,
                x2: x + o.markerSize, y2: y + o.markerSize / 2,
                stroke: color, 'stroke-width': 3, opacity,
            });
        } else {
            marker = createSVGElement('rect', {
                x, y, width: o.markerSize, height: o.markerSize, fill: color, opacity,
            });
        }
        group.appendChild(marker);

        const text = createSVGElement<SVGTextElement>('text', {
            x: x + o.markerSize + 6, y: y + o.markerSize / 2,
            fill: c.theme.legend.text, 'font-size': o.fontSize,
            'dominant-baseline': 'middle', opacity,
        });
        text.textContent = s.name ?? `Series ${i + 1}`;
        group.appendChild(text);

        if (o.clickable) {
            group.style.cursor = 'pointer';
            group.addEventListener('click', () => this._toggle(i));
            group.addEventListener('mouseenter', () => text.setAttribute('fill', c.theme.legend.hover));
            group.addEventListener('mouseleave', () => text.setAttribute('fill', c.theme.legend.text));
        }

        return group;
    }

    private _toggle(i: number): void {
        const c = this._chart as ChartLike;
        this._hidden.has(i) ? this._hidden.delete(i) : this._hidden.add(i);

        c.config.data.series = this._origSeries.filter((_, idx) => !this._hidden.has(idx));
        c.render();
        c.config.data.series = this._origSeries;
        this._draw();
    }
}
