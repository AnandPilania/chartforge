import type { ParsedData } from '../types.js';

const BRAILLE_OFFSET = 0x2800;
const BRAILLE_DOTS = [0x01, 0x08, 0x02, 0x10, 0x04, 0x20, 0x40, 0x80];

const USE_COLOR = !process.env['NO_COLOR'] && process.stdout.isTTY;
const c = (code: string, s: string) => USE_COLOR ? `\x1b[${code}m${s}\x1b[0m` : s;
const COLORS = ['36', '33', '32', '35', '34', '31', '37', '90'];
const seriesColor = (i: number, s: string) => c(COLORS[i % COLORS.length], s);

const BLOCKS = ['▏', '▎', '▍', '▌', '▋', '▊', '▉', '█'];
const FULL = '█';

function barChart(data: ParsedData, termWidth = 80): string {
    const lines: string[] = [];
    const series = data.series[0];
    if (!series) return '(no data)';

    const values = series.data;
    const labels = data.labels ?? values.map((_, i) => String(i + 1));
    const maxVal = Math.max(...values.filter(v => isFinite(v)));
    const maxLbl = Math.max(...labels.map(l => l.length));
    const barW = Math.max(20, Math.min(50, termWidth - maxLbl - 18));

    const formatVal = (v: number) => {
        if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
        if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
        return String(v);
    };

    for (let i = 0; i < values.length; i++) {
        const val = values[i];
        const lbl = labels[i].padStart(maxLbl);
        const ratio = maxVal > 0 ? val / maxVal : 0;
        const full = Math.floor(ratio * barW);
        const part = Math.floor((ratio * barW - full) * 8);
        const bar = FULL.repeat(full) + (part > 0 ? BLOCKS[part - 1] : '');
        const blank = ' '.repeat(Math.max(0, barW - full - (part > 0 ? 1 : 0)));
        const valStr = formatVal(val).padStart(8);

        lines.push(
            `  ${c('90', lbl)} ${seriesColor(0, bar)}${c('90', blank)} ${c('2', valStr)}`
        );
    }

    return lines.join('\n');
}

const SPARK = '▁▂▃▄▅▆▇█';

function sparkline(values: number[]): string {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const rng = max - min || 1;
    return values.map(v => {
        const idx = Math.round(((v - min) / rng) * (SPARK.length - 1));
        return SPARK[idx];
    }).join('');
}

function brailleChart(data: ParsedData, cols = 60, rows = 16): string {
    const canvas: number[][] = Array.from({ length: rows * 4 }, () =>
        new Array(cols * 2).fill(0)
    );

    const allVals = data.series.flatMap(s => s.data);
    const minVal = Math.min(...allVals);
    const maxVal = Math.max(...allVals);
    const rng = maxVal - minVal || 1;

    data.series.forEach((s, si) => {
        const vals = s.data;
        for (let i = 0; i < vals.length - 1; i++) {
            const x1 = Math.round((i / (vals.length - 1)) * (cols * 2 - 1));
            const x2 = Math.round(((i + 1) / (vals.length - 1)) * (cols * 2 - 1));
            const y1 = Math.round(((vals[i] - minVal) / rng) * (rows * 4 - 1));
            const y2 = Math.round(((vals[i + 1] - minVal) / rng) * (rows * 4 - 1));

            let dx = x2 - x1, dy = y2 - y1;
            const sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1;
            dx = Math.abs(dx); dy = Math.abs(dy);
            let err = dx - dy, cx = x1, cy = y1;

            while (true) {
                const px = cx, py = rows * 4 - 1 - cy;
                if (px >= 0 && px < cols * 2 && py >= 0 && py < rows * 4) {
                    canvas[py][px] = si + 1;
                }
                if (cx === x2 && cy === y2) break;
                const e2 = 2 * err;
                if (e2 > -dy) { err -= dy; cx += sx; }
                if (e2 < dx) { err += dx; cy += sy; }
            }
        }
    });

    const brailleLines: string[] = [];
    for (let row = 0; row < rows; row++) {
        let line = '  ';
        for (let col = 0; col < cols; col++) {
            let char = BRAILLE_OFFSET;
            let si = 0;
            for (let dy = 0; dy < 4; dy++) {
                for (let dx = 0; dx < 2; dx++) {
                    const px = col * 2 + dx;
                    const py = row * 4 + dy;
                    const sv = canvas[py]?.[px] ?? 0;
                    if (sv) { char |= BRAILLE_DOTS[dy * 2 + dx]; si = sv - 1; }
                }
            }
            const ch = String.fromCharCode(char);
            line += char === BRAILLE_OFFSET ? ' ' : seriesColor(si, ch);
        }
        brailleLines.push(line);
    }

    return brailleLines.join('\n');
}

function yAxis(values: number[], height = 16): string[] {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const fmt = (v: number) => {
        if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
        if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
        return v.toFixed(1);
    };
    const lines: string[] = [];
    for (let i = 0; i < height; i++) {
        const v = max - (i / (height - 1)) * (max - min);
        lines.push(i % 4 === 0 ? c('90', fmt(v).padStart(8)) : ' '.repeat(8));
    }
    return lines;
}

function legend(data: ParsedData): string {
    return data.series
        .map((s, i) => seriesColor(i, `  ● ${s.name ?? `Series ${i + 1}`}`))
        .join('   ');
}

export interface TerminalRenderOptions {
    type?: string;
    title?: string;
    width?: number;
    noColor?: boolean;
}

export function renderToTerminal(data: ParsedData, opts: TerminalRenderOptions = {}): string {
    const termW = opts.width ?? Math.min(process.stdout.columns ?? 80, 100);
    const type = opts.type ?? 'column';
    const lines: string[] = [];

    if (opts.title) {
        lines.push('');
        lines.push(`  ${c('1', opts.title)}`);
        lines.push(`  ${c('90', '─'.repeat(Math.min(opts.title.length + 2, termW - 4)))}`);
    }

    lines.push('');

    if (type === 'line' || type === 'scatter') {
        const allVals = data.series.flatMap(s => s.data);
        const yLabels = yAxis(allVals);
        const braille = brailleChart(data, Math.max(30, Math.floor((termW - 12) / 2)));

        const brailleLines = braille.split('\n');
        brailleLines.forEach((bl, i) => {
            lines.push((yLabels[i] ?? ' '.repeat(8)) + c('90', ' │') + bl);
        });
        lines.push(' '.repeat(9) + c('90', '└' + '─'.repeat(termW - 11)));

        const lblLine = '          ';
        if (data.labels?.length) {
            const step = Math.max(1, Math.floor(data.labels.length / 8));
            const xLine = data.labels
                .filter((_, i) => i % step === 0)
                .map(l => l.substring(0, 8).padEnd(9))
                .join('');
            lines.push(c('90', '         ' + xLine));
        }
    } else if (type === 'pie' || type === 'donut') {
        const vals = data.series[0]?.data ?? [];
        const labels = data.labels ?? vals.map((_, i) => `Slice ${i + 1}`);
        const total = vals.reduce((s, v) => s + v, 0);
        const barW = Math.min(40, termW - 30);

        for (let i = 0; i < vals.length; i++) {
            const pct = total > 0 ? vals[i] / total : 0;
            const fill = Math.round(pct * barW);
            const bar = '█'.repeat(fill) + c('90', '░'.repeat(barW - fill));
            lines.push(
                `  ${seriesColor(i, labels[i].padEnd(15).substring(0, 15))} ` +
                `${seriesColor(i, bar)} ${c('1', (pct * 100).toFixed(1))}%`
            );
        }
    } else if (type === 'bar') {
        lines.push(barChart({ ...data, series: data.series }, termW));
    } else {
        lines.push(barChart(data, termW));
    }

    lines.push('');
    data.series.forEach((s, i) => {
        const spark = sparkline(s.data);
        lines.push(`  ${seriesColor(i, `${s.name ?? `Series ${i + 1}`}:`).padEnd(20)} ${seriesColor(i, spark)}`);
    });

    if (data.series.length > 1) {
        lines.push('');
        lines.push(legend(data));
    }

    const allVals = data.series.flatMap(s => s.data).filter(isFinite);
    const min = Math.min(...allVals);
    const max = Math.max(...allVals);
    const avg = allVals.reduce((s, v) => s + v, 0) / allVals.length;
    lines.push('');
    lines.push(c('90', [
        `  Min: ${min.toLocaleString()}`,
        `Max: ${max.toLocaleString()}`,
        `Avg: ${avg.toFixed(2)}`,
        `Points: ${allVals.length}`,
    ].join('   ')));
    lines.push('');

    return lines.join('\n');
}
