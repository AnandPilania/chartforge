import { BasePlugin } from './BasePlugin.js';
import { createSVGElement } from '../utils/dom.js';
import type { Theme, ChartConfig } from '../types.js';

export interface MarkLine {
    type: 'horizontal' | 'vertical';
    value: number;
    label?: string;
    color?: string;
    dashArray?: string;
    width?: number;
}

export interface MarkArea {
    xStart?: number;
    xEnd?: number;
    yStart?: number;
    yEnd?: number;
    color?: string;
    opacity?: number;
    label?: string;
}

export interface TextAnnotation {
    x: number;
    y: number;
    text: string;
    color?: string;
    fontSize?: number;
    background?: string;
}

export interface AnnotationConfig {
    markLines?: MarkLine[];
    markAreas?: MarkArea[];
    texts?: TextAnnotation[];
}

interface ChartLike {
    theme: Theme;
    config: ChartConfig;
    svg: SVGSVGElement;
    mainGroup: SVGGElement;
    on: (event: string, h: () => void) => void;
}

export class AnnotationPlugin extends BasePlugin {
    private _group!: SVGGElement;
    private readonly _annCfg: AnnotationConfig;

    constructor(chart: unknown, cfg: AnnotationConfig = {}) {
        super(chart, cfg);
        this._annCfg = cfg;
    }

    init(): void {
        const c = this._chart as ChartLike;
        this._group = createSVGElement<SVGGElement>('g', {
            className: 'cf-annotations',
            style: 'pointer-events:none',
        });
        c.mainGroup.appendChild(this._group);
        this._els.push(this._group);
        this._draw();
        c.on('afterRender', () => this._draw());
    }

    addMarkLine(ml: MarkLine): void {
        this._annCfg.markLines = [...(this._annCfg.markLines ?? []), ml];
        this._draw();
    }

    addMarkArea(ma: MarkArea): void {
        this._annCfg.markAreas = [...(this._annCfg.markAreas ?? []), ma];
        this._draw();
    }

    addText(t: TextAnnotation): void {
        this._annCfg.texts = [...(this._annCfg.texts ?? []), t];
        this._draw();
    }

    private _draw(): void {
        while (this._group.firstChild) this._group.removeChild(this._group.firstChild);

        const c = this._chart as ChartLike;
        const vb = c.svg.getAttribute('viewBox')!.split(' ').map(Number);
        const W = vb[2], H = vb[3];
        const pad = c.config.padding ?? {};
        const pl = pad.left ?? 60, pr = pad.right ?? 40;
        const pt = pad.top ?? 40, pb = pad.bottom ?? 60;
        const dw = W - pl - pr;
        const dh = H - pt - pb;

        const allVals = (c.config.data.series ?? []).flatMap(s => s.data as number[]);
        const maxVal = allVals.length ? Math.max(...allVals) : 100;
        const minVal = allVals.length ? Math.min(...allVals) : 0;
        const range = maxVal - minVal || 1;

        const toX = (idx: number, total: number) => pl + (idx / Math.max(total - 1, 1)) * dw;
        const toY = (v: number) => pt + dh - ((v - minVal) / range) * dh;

        const nLabels = c.config.data.labels?.length ?? 1;
        const defColor = c.theme.textSecondary;

        for (const ml of this._annCfg.markLines ?? []) {
            const color = ml.color ?? defColor;
            let x1: number, y1: number, x2: number, y2: number;

            if (ml.type === 'horizontal') {
                y1 = y2 = toY(ml.value);
                x1 = pl; x2 = W - pr;
            } else {
                x1 = x2 = toX(ml.value, nLabels);
                y1 = pt; y2 = H - pb;
            }

            this._group.appendChild(createSVGElement('line', {
                x1, y1, x2, y2,
                stroke: color, 'stroke-width': ml.width ?? 1.5,
                'stroke-dasharray': ml.dashArray ?? '5,3',
            }));

            if (ml.label) {
                const tx = ml.type === 'horizontal' ? x2 + 4 : x1 + 4;
                const ty = ml.type === 'horizontal' ? y1 - 4 : pt - 4;
                const t = createSVGElement<SVGTextElement>('text', {
                    x: tx, y: ty, fill: color, 'font-size': 11,
                });
                t.textContent = ml.label;
                this._group.appendChild(t);
            }
        }

        for (const ma of this._annCfg.markAreas ?? []) {
            const x1 = ma.xStart !== undefined ? toX(ma.xStart, nLabels) : pl;
            const x2 = ma.xEnd !== undefined ? toX(ma.xEnd, nLabels) : W - pr;
            const y1 = ma.yEnd !== undefined ? toY(ma.yEnd) : pt;
            const y2 = ma.yStart !== undefined ? toY(ma.yStart) : H - pb;

            this._group.appendChild(createSVGElement('rect', {
                x: x1, y: y1, width: x2 - x1, height: y2 - y1,
                fill: ma.color ?? defColor, opacity: ma.opacity ?? 0.12,
            }));

            if (ma.label) {
                const t = createSVGElement<SVGTextElement>('text', {
                    x: x1 + 4, y: y1 + 14,
                    fill: ma.color ?? defColor, 'font-size': 11,
                });
                t.textContent = ma.label;
                this._group.appendChild(t);
            }
        }

        for (const ta of this._annCfg.texts ?? []) {
            const x = toX(ta.x, nLabels);
            const y = toY(ta.y);
            const color = ta.color ?? c.theme.text;

            if (ta.background) {
                const bg = createSVGElement<SVGRectElement>('rect', {
                    x: x - 3, y: y - (ta.fontSize ?? 12),
                    width: ta.text.length * ((ta.fontSize ?? 12) * 0.6) + 6,
                    height: (ta.fontSize ?? 12) + 4,
                    fill: ta.background, rx: 3,
                });
                this._group.appendChild(bg);
            }

            const t = createSVGElement<SVGTextElement>('text', {
                x, y, fill: color, 'font-size': ta.fontSize ?? 12, 'font-weight': 'bold',
            });
            t.textContent = ta.text;
            this._group.appendChild(t);
        }
    }
}
