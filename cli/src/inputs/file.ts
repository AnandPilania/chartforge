import { readFileSync } from 'fs';
import { extname } from 'path';
import type { ParsedData } from '../types.js';
import { parseInput } from './parser.js';

export async function readStdin(): Promise<string> {
    return new Promise((resolve, reject) => {
        let data = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', chunk => (data += chunk));
        process.stdin.on('end', () => resolve(data));
        process.stdin.on('error', reject);
    });
}

export function readFile(filePath: string): string {
    return readFileSync(filePath, 'utf8');
}

export function detectFormat(filePath: string): string {
    const ext = extname(filePath).toLowerCase().slice(1);
    return ext || 'json';
}

export async function loadFromFile(filePath: string, format?: string): Promise<ParsedData> {
    const raw = filePath === '-' ? await readStdin() : readFile(filePath);
    const fmt = format ?? detectFormat(filePath);
    return parseInput(raw, fmt);
}

export function loadInline(jsonStr: string, jq?: string): ParsedData {
    const { parseJSON } = require('./parser.js') as typeof import('./parser.js');
    return parseJSON(jsonStr, jq);
}
