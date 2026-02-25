import { BasePlugin } from './BasePlugin.js';
import type { ChartConfig } from '../types.js';

export interface ZoomConfig {
    enabled?: boolean;
    type?: 'x' | 'y' | 'xy';
    minZoom?: number;
    maxZoom?: number;
    resetOnDblClick?: boolean;
}

interface ChartLike {
    config: ChartConfig;
    svg: SVGSVGElement;
    mainGroup: SVGGElement;
}

export class ZoomPlugin extends BasePlugin {
    private _scale = 1;
    private _tx = 0;
    private _ty = 0;
    private _dragging = false;
    private _dragStart = { x: 0, y: 0 };
    private readonly _opts: Required<ZoomConfig>;

    constructor(chart: unknown, cfg: ZoomConfig = {}) {
        super(chart, cfg);
        this._opts = {
            enabled: true,
            type: 'xy',
            minZoom: 0.5,
            maxZoom: 10,
            resetOnDblClick: true,
            ...cfg,
        };
    }

    init(): void {
        if (!this._opts.enabled) return;
        const c = this._chart as ChartLike;
        const svg = c.svg;

        svg.style.userSelect = 'none';
        svg.style.touchAction = 'none';

        svg.addEventListener('wheel', (e: Event) => this._onWheel(e as WheelEvent), { passive: false });

        svg.addEventListener('mousedown', (e: Event) => this._onMouseDown(e as MouseEvent));
        svg.addEventListener('mousemove', (e: Event) => this._onMouseMove(e as MouseEvent));
        svg.addEventListener('mouseup', () => { this._dragging = false; });
        svg.addEventListener('mouseleave', () => { this._dragging = false; });

        if (this._opts.resetOnDblClick) {
            svg.addEventListener('dblclick', () => this.reset());
        }
    }

    private _onWheel(e: WheelEvent): void {
        e.preventDefault();
        const c = this._chart as ChartLike;
        const rect = c.svg.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const delta = e.deltaY > 0 ? 0.85 : 1.15;
        const ns = Math.max(this._opts.minZoom, Math.min(this._opts.maxZoom, this._scale * delta));

        const scaleRatio = ns / this._scale;
        const t = this._opts.type;
        if (t === 'x' || t === 'xy') this._tx = mx - scaleRatio * (mx - this._tx);
        if (t === 'y' || t === 'xy') this._ty = my - scaleRatio * (my - this._ty);
        this._scale = ns;
        this._apply();
    }

    private _onMouseDown(e: MouseEvent): void {
        if (e.button !== 0) return;
        this._dragging = true;
        this._dragStart = { x: e.clientX - this._tx, y: e.clientY - this._ty };
        (this._chart as ChartLike).svg.style.cursor = 'grabbing';
    }

    private _onMouseMove(e: MouseEvent): void {
        if (!this._dragging) return;
        const t = this._opts.type;
        if (t === 'x' || t === 'xy') this._tx = e.clientX - this._dragStart.x;
        if (t === 'y' || t === 'xy') this._ty = e.clientY - this._dragStart.y;
        this._apply();
    }

    private _apply(): void {
        const mg = (this._chart as ChartLike).mainGroup;
        mg.style.transform = `translate(${this._tx}px, ${this._ty}px) scale(${this._scale})`;
        mg.style.transformOrigin = '0 0';
        (this._chart as ChartLike).svg.style.cursor = this._dragging ? 'grabbing' : 'grab';
    }

    reset(): void {
        this._scale = 1;
        this._tx = 0;
        this._ty = 0;
        this._apply();
        (this._chart as ChartLike).svg.style.cursor = '';
    }
}
