import type { ParsedData } from '../types.js';

const BRAILLE_DOTS = [0x01, 0x08, 0x02, 0x10, 0x04, 0x20, 0x40, 0x80];

const USE_COLOR = !process.env['NO_COLOR'] && !!process.stdout.isTTY;
const ansi = (code: string, s: string) => USE_COLOR ? `\x1b[${code}m${s}\x1b[0m` : s;
const PALETTE = ['36', '33', '32', '35', '34', '31', '37', '90'];
const col = (i: number, s: string) => ansi(PALETTE[i % PALETTE.length], s);
const dim = (s: string) => ansi('2', s);
const bold = (s: string) => ansi('1', s);
const gray = (s: string) => ansi('90', s);

function fmt(v: number): string {
    if (!isFinite(v)) return String(v);
    if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
    if (!Number.isInteger(v)) return v.toFixed(2);
    return String(v);
}

function normaliseData(data: ParsedData): ParsedData {
    return {
        ...data,
        series: data.series.map(s => ({
            ...s,
            data: (s.data as unknown[]).map(v => {
                const n = typeof v === 'number' ? v : Number(String(v).replace(/[^0-9.\-eE]/g, ''));
                return isNaN(n) ? 0 : n;
            }),
        })),
    };
}

const SPARK_CHARS = '▁▂▃▄▅▆▇█';

function sparkline(values: number[]): string {
    if (!values.length) return '';
    const min = Math.min(...values);
    const max = Math.max(...values);
    const rng = max - min || 1;
    return values.map(v => {
        const idx = Math.min(
            SPARK_CHARS.length - 1,
            Math.round(((v - min) / rng) * (SPARK_CHARS.length - 1))
        );
        return SPARK_CHARS[idx];
    }).join('');
}

const BLOCK_CHARS = ['▏', '▎', '▍', '▌', '▋', '▊', '▉', '█'];

function drawBars(data: ParsedData, termW: number, seriesIdx = 0): string[] {
    const series = data.series[seriesIdx];
    if (!series) return ['(no data)'];

    const values = series.data as number[];
    const labels = data.labels ?? values.map((_, i) => String(i + 1));
    const maxVal = Math.max(...values.filter(isFinite), 0);
    const maxLblW = Math.max(...labels.map(l => l.length), 4);
    const barW = Math.max(10, Math.min(50, termW - maxLblW - 14));

    return values.map((v, i) => {
        const lbl = labels[i] ?? String(i + 1);
        const ratio = maxVal > 0 ? Math.max(0, v) / maxVal : 0;
        const full = Math.floor(ratio * barW);
        const part = Math.floor((ratio * barW - full) * 8);
        const bar = '█'.repeat(full) + (part > 0 ? BLOCK_CHARS[part - 1] : '');
        const empty = ' '.repeat(Math.max(0, barW - bar.length));
        return `  ${gray(lbl.padStart(maxLblW))} ${col(seriesIdx, bar)}${dim(empty)} ${dim(fmt(v).padStart(8))}`;
    });
}

function brailleChart(data: ParsedData, cols: number, rows: number): string {
    const totalPx = { x: cols * 2, y: rows * 4 };
    const canvas: Uint8Array[] = Array.from(
        { length: totalPx.y }, () => new Uint8Array(totalPx.x)
    );

    const allVals = data.series.flatMap(s => s.data as number[]).filter(isFinite);
    const minVal = allVals.length ? Math.min(...allVals) : 0;
    const maxVal = allVals.length ? Math.max(...allVals) : 1;
    const range = maxVal - minVal || 1;

    data.series.forEach((s, si) => {
        const vals = (s.data as number[]).filter(isFinite);
        if (vals.length < 2) return;

        for (let i = 0; i < vals.length - 1; i++) {
            const x1 = Math.round((i / (vals.length - 1)) * (totalPx.x - 1));
            const x2 = Math.round(((i + 1) / (vals.length - 1)) * (totalPx.x - 1));
            const y1 = Math.round(((vals[i] - minVal) / range) * (totalPx.y - 1));
            const y2 = Math.round(((vals[i + 1] - minVal) / range) * (totalPx.y - 1));

            let dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
            const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
            let err = dx - dy, cx = x1, cy = y1;

            // eslint-disable-next-line no-constant-condition
            while (true) {
                const py = totalPx.y - 1 - cy;
                if (cx >= 0 && cx < totalPx.x && py >= 0 && py < totalPx.y) {
                    canvas[py][cx] = si + 1;
                }
                if (cx === x2 && cy === y2) break;
                const e2 = 2 * err;
                if (e2 > -dy) { err -= dy; cx += sx; }
                if (e2 < dx) { err += dx; cy += sy; }
            }
        }
    });

    const lines: string[] = [];
    for (let row = 0; row < rows; row++) {
        let line = '';
        for (let bcol = 0; bcol < cols; bcol++) {
            let code = 0x2800;
            let si = 0;
            for (let dy = 0; dy < 4; dy++) {
                for (let dx = 0; dx < 2; dx++) {
                    const px = bcol * 2 + dx;
                    const py = row * 4 + dy;
                    const sv = canvas[py]?.[px] ?? 0;
                    if (sv) { code |= BRAILLE_DOTS[dy * 2 + dx]; si = sv - 1; }
                }
            }
            line += code === 0x2800
                ? dim(' ')
                : col(si, String.fromCharCode(code));
        }
        lines.push(line);
    }
    return lines.join('\n');
}

function yAxisLabels(min: number, max: number, rows: number): string[] {
    return Array.from({ length: rows }, (_, i) => {
        const v = max - (i / Math.max(rows - 1, 1)) * (max - min);
        return i % 4 === 0 ? gray(fmt(v).padStart(8)) : ' '.repeat(8);
    });
}

function drawPie(data: ParsedData, termW: number): string[] {
    const vals = (data.series[0]?.data ?? []) as number[];
    const labels = data.labels ?? vals.map((_, i) => `Slice ${i + 1}`);
    const total = vals.reduce((s, v) => s + v, 0) || 1;
    const barW = Math.max(20, Math.min(40, termW - 28));

    return vals.map((v, i) => {
        const pct = v / total;
        const fill = Math.round(pct * barW);
        const bar = col(i, '█'.repeat(fill)) + dim('░'.repeat(barW - fill));
        return `  ${col(i, labels[i]?.padEnd(14).slice(0, 14) ?? '')} ${bar} ${bold((pct * 100).toFixed(1))}%`;
    });
}

function statsLine(data: ParsedData): string {
    const vals = data.series.flatMap(s => (s.data as unknown[]).map(Number)).filter(isFinite);
    if (!vals.length) return '';
    const sum = vals.reduce((a, b) => a + b, 0);
    return gray([
        `Min: ${fmt(Math.min(...vals))}`,
        `Max: ${fmt(Math.max(...vals))}`,
        `Avg: ${fmt(sum / vals.length)}`,
        `Sum: ${fmt(sum)}`,
        `Points: ${vals.length}`,
    ].join('   '));
}

function legendLine(data: ParsedData): string {
    return data.series.map((s, i) => col(i, `● ${s.name ?? `Series ${i + 1}`}`)).join('   ');
}

export interface TerminalRenderOptions {
    type?: string;
    title?: string;
    width?: number;
}

export function renderToTerminal(rawData: ParsedData, opts: TerminalRenderOptions = {}): string {
    const data = normaliseData(rawData);
    const type = opts.type ?? 'column';
    const termW = opts.width ?? Math.min(process.stdout.columns ?? 80, 100);
    const out: string[] = [''];

    if (opts.title) {
        out.push(`  ${bold(opts.title)}`);
        out.push(`  ${gray('─'.repeat(Math.min(opts.title.length + 2, termW - 4)))}`);
        out.push('');
    }

    switch (type) {
        case 'line':
        case 'scatter': {
            const allVals = data.series.flatMap(s => (s.data as number[]).filter(isFinite));
            const minVal = allVals.length ? Math.min(...allVals) : 0;
            const maxVal = allVals.length ? Math.max(...allVals) : 1;
            const rows = 16;
            const cols = Math.max(20, Math.floor((termW - 12) / 2));
            const yLabels = yAxisLabels(minVal, maxVal, rows);
            const chart = brailleChart(data, cols, rows).split('\n');

            chart.forEach((line, i) => {
                out.push((yLabels[i] ?? ' '.repeat(8)) + gray(' │') + '  ' + line);
            });
            out.push(' '.repeat(9) + gray('└' + '─'.repeat(cols * 2 + 2)));

            if (data.labels?.length) {
                const step = Math.max(1, Math.ceil(data.labels.length / Math.floor(cols / 4)));
                const row = data.labels
                    .filter((_, i) => i % step === 0)
                    .map(l => l.slice(0, 8).padEnd(9))
                    .join('');
                out.push(gray('         ' + row));
            }
            break;
        }

        case 'pie':
        case 'donut':
            out.push(...drawPie(data, termW));
            break;

        case 'bar':
        case 'row':
            out.push(...drawBars(data, termW, 0));
            break;

        default:
            out.push(...drawBars(data, termW, 0));
            if (data.series.length > 1) {
                for (let si = 1; si < data.series.length; si++) {
                    out.push('');
                    out.push(`  ${gray('─')} ${col(si, data.series[si]?.name ?? `Series ${si + 1}`)}`);
                    out.push(...drawBars(data, termW, si));
                }
            }
            break;
    }

    out.push('');
    data.series.forEach((s, i) => {
        const spark = sparkline((s.data as number[]).filter(isFinite));
        const name = (s.name ?? `Series ${i + 1}`).padEnd(16).slice(0, 16);
        out.push(`  ${col(i, name)} ${col(i, spark)}`);
    });

    if (data.series.length > 1) {
        out.push('');
        out.push('  ' + legendLine(data));
    }

    const stats = statsLine(data);
    if (stats) { out.push(''); out.push('  ' + stats); }

    out.push('');
    return out.join('\n');
}
