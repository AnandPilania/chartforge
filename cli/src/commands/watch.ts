import { watch } from 'fs';
import { resolve } from 'path';
import type { CliOptions } from '../types.js';
import { runRender } from './render.js';
import { logger } from '../logger.js';

export async function runWatch(opts: CliOptions): Promise<void> {
    const filePath = opts.input;
    if (!filePath || filePath === '-') {
        logger.error('--watch requires --input <file>');
        process.exit(1);
    }

    const abs = resolve(filePath);
    logger.info(`Watching ${abs} for changes…`);
    logger.dim('Press Ctrl+C to stop');
    logger.blank();

    await runRender({ ...opts, open: opts.open }).catch(err =>
        logger.error('Render failed', err)
    );

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    watch(abs, { persistent: true }, (event) => {
        if (event !== 'change') return;
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            logger.info(`File changed — re-rendering…`);
            await runRender({ ...opts, open: false }).catch(err =>
                logger.error('Re-render failed', err)
            );
        }, 200);
    });

    await new Promise<void>(() => { });
}
