import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { logger } from '../logger.js';

export function writeOutput(content: string | Buffer, outPath: string): void {
    const abs = resolve(outPath);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
    logger.success(`Saved → ${abs}`);
}

export function writeStdout(content: string): void {
    process.stdout.write(content);
}

export function defaultFilename(format: string): string {
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `chartforge-${ts}.${format}`;
}

export async function openInBrowser(filePath: string): Promise<void> {
    const abs = resolve(filePath);
    const open = await import('open').catch(() => null);
    if (open) {
        await open.default(`file://${abs}`);
    } else {
        logger.info(`Open in browser: file://${abs}`);
    }
}
