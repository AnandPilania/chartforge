import { BasePlugin } from './BasePlugin.js';
import { merge } from '../utils/misc.js';
import type { Theme } from '../types.js';

export interface TooltipConfig {
    enabled?: boolean;
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    borderRadius?: number;
    padding?: number;
    fontSize?: number;
    shadow?: boolean;
    followCursor?: boolean;
    offset?: { x: number; y: number };
    formatter?: (data: Record<string, unknown>) => string;
}

interface ChartLike {
    theme: Theme;
    config: { data: { labels?: string[]; series: { name?: string }[] } };
    svg: SVGSVGElement;
    on: (event: string, handler: (data: unknown) => void) => () => void;
}

export class TooltipPlugin extends BasePlugin {
    private _tip!: HTMLDivElement;
    private _mx = 0;
    private _my = 0;
    private _visible = false;
    private readonly _opts: Required<Omit<TooltipConfig, 'formatter'>> & { formatter?: TooltipConfig['formatter'] };

    constructor(chart: unknown, cfg: TooltipConfig = {}) {
        super(chart, cfg);
        const c = chart as ChartLike;
        const { formatter, ...rest } = cfg;
        this._opts = {
            ...merge({
                enabled: true,
                backgroundColor: c.theme.tooltip.background,
                textColor: c.theme.tooltip.text,
                borderColor: c.theme.tooltip.border,
                borderRadius: 6,
                padding: 10,
                fontSize: 13,
                shadow: true,
                followCursor: true,
                offset: { x: 14, y: 14 },
            } as Required<Omit<TooltipConfig, 'formatter'>>, rest),
            formatter,
        };
    }

    init(): void {
        if (!this._opts.enabled) return;
        this._createTip();
        this._attachEvents();
    }

    private _createTip(): void {
        this._tip = document.createElement('div');
        this._tip.className = 'cf-tooltip';
        const o = this._opts;
        const shadow = o.shadow ? 'box-shadow:0 6px 20px rgba(0,0,0,.22)' : '';
        this._tip.style.cssText = [
            'position:fixed',
            `padding:${o.padding}px ${o.padding + 4}px`,
            `background:${o.backgroundColor}`,
            `color:${o.textColor}`,
            `border:1px solid ${o.borderColor}`,
            `border-radius:${o.borderRadius}px`,
            `font-size:${o.fontSize}px`,
            'line-height:1.5',
            'font-family:inherit',
            'pointer-events:none',
            'opacity:0',
            'transform:scale(0.95)',
            'transition:opacity .12s ease,transform .12s ease',
            'z-index:99999',
            'white-space:nowrap',
            'max-width:260px',
            shadow,
            'top:0',
            'left:0',
        ].filter(Boolean).join(';');
        document.body.appendChild(this._tip);
        this._els.push(this._tip);
    }

    private _attachEvents(): void {
        const c = this._chart as ChartLike;

        c.svg.addEventListener('mousemove', (e: Event) => {
            const me = e as MouseEvent;
            this._mx = me.clientX;
            this._my = me.clientY;
            if (this._visible) this._position();
        });

        c.on('hover', (raw) => {
            const data = raw as Record<string, unknown>;
            this._buildContent(data);
            this._position();
            this._show();
        });

        c.svg.addEventListener('mouseleave', () => this._hide());
    }

    private _buildContent(d: Record<string, unknown>): void {
        const c = this._chart as ChartLike;

        if (this._opts.formatter) {
            this._tip.innerHTML = this._opts.formatter(d);
            return;
        }

        const lbl = (i: number) => c.config.data.labels?.[i] ?? `Item ${i + 1}`;
        const sName = (i: number) => c.config.data.series[i]?.name ?? `Series ${i + 1}`;
        const fmt = (v: unknown) => typeof v === 'number' ? v.toLocaleString() : String(v);
        const row = (label: string, value: unknown) =>
            `<div style="display:flex;justify-content:space-between;gap:12px"><span style="opacity:.7">${label}</span><span style="font-weight:600">${fmt(value)}</span></div>`;

        let html = '';
        const type = d['type'] as string;

        switch (type) {
            case 'pie': case 'donut': {
                const idx = d['index'] as number;
                html = `<div style="font-weight:700;margin-bottom:4px">${lbl(idx)}</div>${row('Value', d['value'])}`;
                break;
            }
            case 'column': case 'bar': {
                const idx = d['index'] as number;
                html = `<div style="font-weight:700;margin-bottom:4px">${lbl(idx)}</div>${row('Value', d['value'])}`;
                break;
            }
            case 'line': {
                const si = d['seriesIndex'] as number;
                const idx = d['index'] as number;
                html = `<div style="font-weight:700;margin-bottom:4px">${sName(si)}</div>${row(lbl(idx), d['value'])}`;
                break;
            }
            case 'scatter': {
                const pt = d['point'] as { x: number; y: number; r?: number };
                const si = d['seriesIndex'] as number;
                html = `<div style="font-weight:700;margin-bottom:4px">${sName(si)}</div>${row('X', pt.x)}${row('Y', pt.y)}${pt.r !== undefined ? row('R', pt.r) : ''}`;
                break;
            }
            case 'heatmap': {
                html = `<div style="font-weight:700;margin-bottom:4px">Cell [${d['row']}, ${d['col']}]</div>${row('Value', d['value'])}`;
                break;
            }
            case 'candlestick': {
                const cc = d['candle'] as { open: number; high: number; low: number; close: number };
                const idx = d['index'] as number;
                const chg = cc.close - cc.open;
                const pct = ((chg / cc.open) * 100).toFixed(2);
                const clr = chg >= 0 ? '#10b981' : '#ef4444';
                html = `<div style="font-weight:700;margin-bottom:4px">${lbl(idx)}</div>`
                    + row('Open', cc.open) + row('High', cc.high) + row('Low', cc.low) + row('Close', cc.close)
                    + `<div style="color:${clr};font-weight:700;margin-top:4px">${chg >= 0 ? '▲' : '▼'} ${Math.abs(chg).toLocaleString()} (${pct}%)</div>`;
                break;
            }
            case 'stackedColumn': case 'stackedBar': {
                const si = d['seriesIndex'] as number;
                const ci = d['catIndex'] as number;
                html = `<div style="font-weight:700;margin-bottom:4px">${sName(si)}</div>${row(lbl(ci), d['value'])}`;
                break;
            }
            case 'funnel': {
                const idx = d['index'] as number;
                html = `<div style="font-weight:700;margin-bottom:4px">${lbl(idx)}</div>${row('Value', d['value'])}`;
                break;
            }
            default:
                html = `<div>${fmt(d['value'] ?? JSON.stringify(d))}</div>`;
        }

        this._tip.innerHTML = html;
    }

    private _position(): void {
        const rect = this._tip.getBoundingClientRect();
        const ox = this._opts.offset.x;
        const oy = this._opts.offset.y;
        let left = this._mx + ox;
        let top = this._my + oy;
        if (left + rect.width > window.innerWidth - 8) left = this._mx - rect.width - ox;
        if (top + rect.height > window.innerHeight - 8) top = this._my - rect.height - oy;
        if (left < 8) left = 8;
        if (top < 8) top = 8;
        this._tip.style.left = `${left}px`;
        this._tip.style.top = `${top}px`;
    }

    private _show(): void {
        this._visible = true;
        this._tip.style.opacity = '1';
        this._tip.style.transform = 'scale(1)';
    }

    private _hide(): void {
        this._visible = false;
        this._tip.style.opacity = '0';
        this._tip.style.transform = 'scale(0.95)';
    }

    override destroy(): void {
        this._tip?.parentNode?.removeChild(this._tip);
        this._els.length = 0;
    }
}
