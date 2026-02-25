import type { ParsedData } from '../types.js';

export function sanitiseRaw(raw: string): string {
    let s = raw.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    if (s.startsWith("'") && s.endsWith("'")) s = s.slice(1, -1).trim();
    if (s.startsWith('{') && !s.includes('"')) {
        s = s.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
    }
    return s;
}

export function parseJSON(raw: string, jq?: string): ParsedData {
    const cleaned = sanitiseRaw(raw);
    let obj: unknown;
    try {
        obj = JSON.parse(cleaned);
    } catch (e) {
        try {
            obj = new Function(`return ${cleaned}`)();
        } catch (innerE) {
            throw new Error(
                `Invalid Data Format: ${(e as Error).message}\n Input: ${cleaned.slice(0, 120)}`
            );
        }
    }

    if (jq) {
        for (const key of jq.split('.')) {
            if (obj && typeof obj === 'object' && key in (obj as object)) {
                obj = (obj as Record<string, unknown>)[key];
            } else {
                throw new Error(`--jq path "${jq}" — key "${key}" not found`);
            }
        }
    }

    return coerceToChartData(obj);
}

function coerceToChartData(obj: unknown): ParsedData {
    if (isChartShape(obj)) return obj as ParsedData;

    if (Array.isArray(obj) && obj.every(v => typeof v === 'number')) {
        return { series: [{ name: 'Series 1', data: obj as number[] }] };
    }

    if (Array.isArray(obj) && obj.length && typeof obj[0] === 'object' && obj[0] !== null) {
        return parseObjectArray(obj as Record<string, unknown>[]);
    }

    if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
        const entries = Object.entries(obj as Record<string, unknown>)
            .filter(([, v]) => typeof v === 'number' || typeof v === 'string');
        return {
            labels: entries.map(([k]) => k),
            series: [{ name: 'Series 1', data: entries.map(([, v]) => Number(v)) }],
        };
    }

    throw new Error(
        'Cannot auto-detect data shape.\n' +
        '  Supported: number[], {key:val}, [{label,value}], or ChartForge shape {series:[{data:[]}]}'
    );
}

function isChartShape(obj: unknown): boolean {
    return (
        typeof obj === 'object' && obj !== null &&
        'series' in (obj as object) &&
        Array.isArray((obj as Record<string, unknown>)['series'])
    );
}

function parseObjectArray(arr: Record<string, unknown>[]): ParsedData {
    const labelKeys = ['label', 'name', 'x', 'key', 'category', 'date', 'month', 'time', 'period'];
    const valueKeys = ['value', 'y', 'v', 'count', 'total', 'amount', 'sales', 'revenue', 'val', 'n'];

    const first = arr[0];
    const labelKey = labelKeys.find(k => k in first);
    const valueKey = valueKeys.find(k => k in first)
        ?? Object.keys(first).find(k => k !== labelKey && typeof first[k] === 'number');

    if (!valueKey) {
        throw new Error(
            `Cannot find a value field in objects. Tried: ${valueKeys.join(', ')}\n` +
            `  Object keys found: ${Object.keys(first).join(', ')}`
        );
    }

    return {
        labels: labelKey ? arr.map(r => String(r[labelKey])) : undefined,
        series: [{ name: valueKey, data: arr.map(r => Number(r[valueKey])) }],
    };
}

export function parseCSV(raw: string, delimiter = ','): ParsedData {
    const lines = sanitiseRaw(raw).split('\n').filter(l => l.trim());
    if (!lines.length) throw new Error('CSV is empty');

    if (lines.length === 1) {
        const vals = lines[0].split(delimiter).map(v => Number(v.trim()));
        if (vals.every(v => !isNaN(v))) {
            return { series: [{ name: 'Series 1', data: vals }] };
        }
    }

    const header = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(l =>
        l.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''))
    );

    if (!rows.length) {
        const vals = header.map(Number);
        if (vals.every(v => !isNaN(v))) return { series: [{ name: 'Series 1', data: vals }] };
    }

    const isNumericCol = (ci: number) =>
        rows.every(r => r[ci] === undefined || r[ci] === '' || !isNaN(Number(r[ci])));

    const labelColIdx = !isNumericCol(0) ? 0 : -1;
    const valueCols = header
        .map((_, ci) => ci)
        .filter(ci => ci !== labelColIdx && isNumericCol(ci));

    return {
        labels: labelColIdx >= 0 ? rows.map(r => r[labelColIdx]) : undefined,
        series: valueCols.map(ci => ({
            name: header[ci],
            data: rows.map(r => (r[ci] === '' || r[ci] === undefined) ? 0 : Number(r[ci])),
        })),
    };
}

export function parseTSV(raw: string): ParsedData {
    return parseCSV(raw, '\t');
}

export function parseYAML(raw: string): ParsedData {
    const lines = sanitiseRaw(raw).split('\n');
    const obj: Record<string, unknown> = {};

    for (let line of lines) {
        line = line.trimEnd();
        if (!line || line.startsWith('#')) continue;
        const match = line.match(/^(\s*)(\w[\w\s]*):\s*(.*)/);
        if (!match) continue;
        const [, , key, value] = match;
        const k = key.trim();
        if (value.startsWith('[')) {
            try { obj[k] = JSON.parse(value); } catch { obj[k] = value; }
        } else if (value !== '') {
            const num = Number(value);
            obj[k] = isNaN(num) ? value.replace(/^['"]|['"]$/g, '') : num;
        }
    }

    if (isChartShape(obj)) return obj as ParsedData;
    return coerceToChartData(obj);
}

export function parseInput(raw: string, format?: string): ParsedData {
    const fmt = (format ?? '').toLowerCase().trim();
    const cleaned = sanitiseRaw(raw);

    if (fmt === 'tsv') return parseTSV(cleaned);
    if (fmt === 'csv') return parseCSV(cleaned);
    if (fmt === 'yaml' || fmt === 'yml') return parseYAML(cleaned);

    if (cleaned.startsWith('{') || cleaned.startsWith('[')) return parseJSON(cleaned);
    if (cleaned.includes('\t')) return parseTSV(cleaned);

    try { return parseJSON(cleaned); } catch { /* fall through */ }

    return parseCSV(cleaned);
}
