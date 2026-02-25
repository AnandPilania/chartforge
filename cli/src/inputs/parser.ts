import type { ParsedData } from '../types.js';

export function parseJSON(raw: string, jq?: string): ParsedData {
    let obj = JSON.parse(raw) as unknown;

    if (jq) {
        for (const key of jq.split('.')) {
            if (obj && typeof obj === 'object' && key in (obj as object)) {
                obj = (obj as Record<string, unknown>)[key];
            } else {
                throw new Error(`jq path "${jq}" not found in response`);
            }
        }
    }

    if (isChartShape(obj)) return obj as ParsedData;

    if (Array.isArray(obj) && obj.every(v => typeof v === 'number')) {
        return { series: [{ name: 'Series 1', data: obj as number[] }] };
    }

    if (Array.isArray(obj) && obj.length && typeof obj[0] === 'object') {
        return parseObjectArray(obj as Record<string, unknown>[]);
    }

    if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
        const entries = Object.entries(obj as Record<string, number>);
        return {
            labels: entries.map(([k]) => k),
            series: [{ name: 'Series 1', data: entries.map(([, v]) => Number(v)) }],
        };
    }

    throw new Error('Could not auto-detect data shape from JSON. Use ChartForge shape: { series: [{ data: [] }] }');
}

function isChartShape(obj: unknown): boolean {
    return (
        typeof obj === 'object' && obj !== null &&
        'series' in (obj as object) &&
        Array.isArray((obj as Record<string, unknown>)['series'])
    );
}

function parseObjectArray(arr: Record<string, unknown>[]): ParsedData {
    const labelKeys = ['label', 'name', 'x', 'key', 'category', 'date', 'month'];
    const valueKeys = ['value', 'y', 'v', 'count', 'total', 'amount', 'sales', 'revenue'];

    const labelKey = labelKeys.find(k => k in arr[0]);
    const valueKey = valueKeys.find(k => k in arr[0]);

    if (!valueKey) {
        throw new Error(`Cannot find a value field. Tried: ${valueKeys.join(', ')}`);
    }

    return {
        labels: labelKey ? arr.map(r => String(r[labelKey])) : undefined,
        series: [{ name: 'Series 1', data: arr.map(r => Number(r[valueKey])) }],
    };
}

export function parseCSV(raw: string, delimiter = ','): ParsedData {
    const lines = raw.trim().split('\n').filter(Boolean);
    if (!lines.length) throw new Error('CSV is empty');

    const header = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(l =>
        l.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''))
    );

    const isNumericCol = (ci: number) =>
        rows.every(r => r[ci] === '' || !isNaN(Number(r[ci])));

    let labelColIdx = -1;
    if (!isNumericCol(0)) labelColIdx = 0;

    const valueCols = header
        .map((_, ci) => ci)
        .filter(ci => ci !== labelColIdx && isNumericCol(ci));

    return {
        labels: labelColIdx >= 0 ? rows.map(r => r[labelColIdx]) : undefined,
        series: valueCols.map(ci => ({
            name: header[ci],
            data: rows.map(r => r[ci] === '' ? 0 : Number(r[ci])),
        })),
    };
}

export function parseTSV(raw: string): ParsedData {
    return parseCSV(raw, '\t');
}

export function parseYAML(raw: string): ParsedData {
    const lines = raw.split('\n');
    const obj: Record<string, unknown> = {};
    let current = obj;

    for (let line of lines) {
        line = line.trimEnd();
        if (!line || line.startsWith('#')) continue;
        const match = line.match(/^(\s*)(\w[\w\s]*):\s*(.*)/);
        if (!match) continue;
        const [, , key, value] = match;
        const trimKey = key.trim();
        if (value.startsWith('[')) {
            try { current[trimKey] = JSON.parse(value); } catch { current[trimKey] = value; }
        } else if (value !== '') {
            const num = Number(value);
            current[trimKey] = isNaN(num) ? value.replace(/^['"]|['"]$/g, '') : num;
        }
    }

    if (isChartShape(obj)) return obj as ParsedData;
    return parseJSON(JSON.stringify(obj));
}

export function parseInput(raw: string, format?: string): ParsedData {
    const fmt = (format ?? '').toLowerCase();
    if (fmt === 'tsv') return parseTSV(raw);
    if (fmt === 'csv') return parseCSV(raw);
    if (fmt === 'yaml' || fmt === 'yml') return parseYAML(raw);

    const trimmed = raw.trimStart();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return parseJSON(raw);
    if (trimmed.includes('\t')) return parseTSV(raw);
    return parseCSV(raw);
}
