import { BasePlugin } from './BasePlugin.js';
import type { ChartConfig, ChartData } from '../types.js';

export interface ExportConfig {
    filename?: string;
    svgButton?: boolean;
    pngButton?: boolean;
    csvButton?: boolean;
    buttonStyle?: string;
}

interface ChartLike {
    config: ChartConfig;
    svg: SVGSVGElement;
    container: HTMLElement;
}

export class ExportPlugin extends BasePlugin {
    private _toolbar!: HTMLDivElement;
    private readonly _opts: Required<ExportConfig>;

    constructor(chart: unknown, cfg: ExportConfig = {}) {
        super(chart, cfg);
        this._opts = {
            filename: cfg.filename ?? 'chart',
            svgButton: cfg.svgButton ?? true,
            pngButton: cfg.pngButton ?? true,
            csvButton: cfg.csvButton ?? true,
            buttonStyle: cfg.buttonStyle ?? '',
        };
    }

    init(): void {
        const c = this._chart as ChartLike;
        this._toolbar = document.createElement('div');
        this._toolbar.className = 'cf-export-toolbar';
        this._toolbar.style.cssText = 'display:flex;gap:6px;padding:4px 0;';

        if (this._opts.svgButton) this._toolbar.appendChild(this._btn('SVG', () => this.exportSVG()));
        if (this._opts.pngButton) this._toolbar.appendChild(this._btn('PNG', () => void this.exportPNG()));
        if (this._opts.csvButton) this._toolbar.appendChild(this._btn('CSV', () => this.exportCSV()));

        c.container.insertBefore(this._toolbar, c.container.firstChild);
        this._els.push(this._toolbar);
    }

    private _btn(label: string, onClick: () => void): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.textContent = `↓ ${label}`;
        btn.style.cssText = [
            'padding:3px 10px',
            'font-size:11px',
            'border-radius:4px',
            'border:1px solid #888',
            'background:transparent',
            'cursor:pointer',
            'opacity:.7',
            'color: white',
            this._opts.buttonStyle,
        ].join(';');
        btn.addEventListener('mouseenter', () => (btn.style.opacity = '1'));
        btn.addEventListener('mouseleave', () => (btn.style.opacity = '.7'));
        btn.addEventListener('click', onClick);
        return btn;
    }

    exportSVG(): void {
        const c = this._chart as ChartLike;
        const xml = new XMLSerializer().serializeToString(c.svg);
        const blob = new Blob([xml], { type: 'image/svg+xml' });
        this._download(URL.createObjectURL(blob), `${this._opts.filename}.svg`);
    }

    async exportPNG(scale = 2): Promise<void> {
        const c = this._chart as ChartLike;
        const xml = new XMLSerializer().serializeToString(c.svg);
        const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();

        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = url;
        });

        const vb = c.svg.getAttribute('viewBox')?.split(' ').map(Number) ?? [0, 0, 800, 400];
        const canvas = document.createElement('canvas');
        canvas.width = vb[2] * scale;
        canvas.height = vb[3] * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);

        canvas.toBlob(blob => {
            if (blob) this._download(URL.createObjectURL(blob), `${this._opts.filename}.png`);
        }, 'image/png');
    }

    exportCSV(): void {
        const data = (this._chart as ChartLike).config.data as ChartData;
        const rows: string[] = [];

        const header = ['Label', ...data.series.map((s, i) => s.name ?? `Series ${i + 1}`)];
        rows.push(header.join(','));

        const len = data.labels?.length ?? (data.series[0]?.data as unknown[]).length ?? 0;
        for (let i = 0; i < len; i++) {
            const lbl = data.labels?.[i] ?? i;
            const vals = data.series.map(s => (s.data as unknown[])[i] ?? '');
            rows.push([lbl, ...vals].join(','));
        }

        const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
        this._download(URL.createObjectURL(blob), `${this._opts.filename}.csv`);
    }

    private _download(url: string, filename: string): void {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}
