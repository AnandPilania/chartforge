import { BasePlugin } from './BasePlugin.js';
import { createSVGElement } from '../utils/dom.js';
import type { Theme, ChartConfig } from '../types.js';

export interface CrosshairConfig {
    enabled?: boolean;
    x?: { enabled?: boolean; color?: string; dashArray?: string; width?: number };
    y?: { enabled?: boolean; color?: string; dashArray?: string; width?: number };
    snap?: boolean;
}

interface ChartLike {
    theme: Theme;
    config: ChartConfig;
    svg: SVGSVGElement;
    mainGroup: SVGGElement;
}

export class CrosshairPlugin extends BasePlugin {
    private _group!: SVGGElement;
    private _xLine!: SVGLineElement;
    private _yLine!: SVGLineElement;
    private readonly _opts: Required<CrosshairConfig>;

    constructor(chart: unknown, cfg: CrosshairConfig = {}) {
        super(chart, cfg);
        const c = chart as ChartLike;
        this._opts = {
            enabled: true,
            x: { enabled: true, color: c.theme.textSecondary, dashArray: '4,4', width: 1, ...cfg.x },
            y: { enabled: true, color: c.theme.textSecondary, dashArray: '4,4', width: 1, ...cfg.y },
            snap: cfg.snap ?? false,
        };
    }

    init(): void {
        if (!this._opts.enabled) return;
        const c = this._chart as ChartLike;

        this._group = createSVGElement<SVGGElement>('g', { className: 'cf-crosshair', style: 'pointer-events:none' });
        this._xLine = createSVGElement<SVGLineElement>('line', {
            stroke: this._opts.x.color ?? '#888', 'stroke-width': this._opts.x.width ?? 1,
            'stroke-dasharray': this._opts.x.dashArray ?? '4,4', opacity: 0,
        });
        this._yLine = createSVGElement<SVGLineElement>('line', {
            stroke: this._opts.y.color ?? '#888', 'stroke-width': this._opts.y.width ?? 1,
            'stroke-dasharray': this._opts.y.dashArray ?? '4,4', opacity: 0,
        });

        if (this._opts.x.enabled) this._group.appendChild(this._xLine);
        if (this._opts.y.enabled) this._group.appendChild(this._yLine);
        c.mainGroup.appendChild(this._group);
        this._els.push(this._group);

        c.svg.addEventListener('mousemove', (e: Event) => this._onMove(e as MouseEvent));
        c.svg.addEventListener('mouseleave', () => this._hide());
    }

    private _onMove(e: MouseEvent): void {
        const c = this._chart as ChartLike;
        const vb = c.svg.getAttribute('viewBox')!.split(' ').map(Number);
        const W = vb[2], H = vb[3];
        const pad = c.config.padding ?? {};
        const pl = pad.left ?? 60;
        const pb = pad.bottom ?? 60;
        const pt = pad.top ?? 40;
        const pr = pad.right ?? 40;

        const rect = c.svg.getBoundingClientRect();
        const scaleX = W / rect.width;
        const scaleY = H / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;

        if (mx < pl || mx > W - pr || my < pt || my > H - pb) { this._hide(); return; }

        this._xLine.setAttribute('x1', String(mx));
        this._xLine.setAttribute('y1', String(pt));
        this._xLine.setAttribute('x2', String(mx));
        this._xLine.setAttribute('y2', String(H - pb));
        this._xLine.setAttribute('opacity', '1');

        this._yLine.setAttribute('x1', String(pl));
        this._yLine.setAttribute('y1', String(my));
        this._yLine.setAttribute('x2', String(W - pr));
        this._yLine.setAttribute('y2', String(my));
        this._yLine.setAttribute('opacity', '1');
    }

    private _hide(): void {
        this._xLine.setAttribute('opacity', '0');
        this._yLine.setAttribute('opacity', '0');
    }

    override destroy(): void {
        this._group?.parentNode?.removeChild(this._group);
    }
}
