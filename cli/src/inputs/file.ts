import { readFileSync } from 'fs';
import { extname } from 'path';
import type { ParsedData } from '../types.js';
import { parseInput, parseJSON, sanitiseRaw } from './parser.js';

export async function readStdin(): Promise<string> {
    if (process.stdin.isTTY) return '';

    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        process.stdin.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        process.stdin.on('error', reject);
    });
}

export function readFile(filePath: string): string {
    return readFileSync(filePath, 'utf8');
}

export function detectFormat(filePath: string): string {
    if (filePath === '-') return 'auto';
    const ext = extname(filePath).toLowerCase().slice(1);
    return ext || 'json';
}

export async function loadFromFile(filePath: string, format?: string): Promise<ParsedData> {
    const raw = filePath === '-' ? await readStdin() : readFile(filePath);
    if (!raw.trim()) throw new Error('No data received (empty input)');
    const fmt = format ?? detectFormat(filePath);
    return parseInput(raw, fmt === 'auto' ? undefined : fmt);
}

export function loadInline(jsonStr: string, jq?: string): ParsedData {
    return parseJSON(sanitiseRaw(jsonStr), jq);
}
