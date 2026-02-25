import type { RenderResult } from './svg.js';
import { logger } from '../logger.js';

export async function renderToPNG(
    svgResult: RenderResult,
    scale = 2,
): Promise<Buffer> {
    try {
        const sharp = (await import('sharp')).default;
        const buf = Buffer.from(svgResult.svg, 'utf8');
        return await sharp(buf)
            .resize(svgResult.width * scale, svgResult.height * scale)
            .png({ compressionLevel: 9 })
            .toBuffer();
    } catch {
        // sharp not installed
    }

    try {
        const { Resvg } = await import('@resvg/resvg-js');
        const resvg = new Resvg(svgResult.svg, {
            fitTo: { mode: 'width', value: svgResult.width * scale },
        });
        const img = resvg.render();
        return img.asPng() as Buffer;
    } catch {
        // resvg not installed
    }

    logger.warn(
        'PNG export requires one of: sharp, @resvg/resvg-js\n' +
        '  Install with: npm install sharp\n' +
        '  Or:           npm install @resvg/resvg-js'
    );
    throw new Error('No PNG renderer available');
}

export async function hasPNGSupport(): Promise<boolean> {
    try { await import('sharp'); return true; } catch { }
    try { await import('@resvg/resvg-js'); return true; } catch { }
    return false;
}
