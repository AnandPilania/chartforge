#!/usr/bin/env node

import { parseArgs, printHelp } from './args.js';
import { logger } from './logger.js';

const VERSION = '1.0.0';

async function main(): Promise<void> {
    const { command, opts } = parseArgs(process.argv);

    if (command === 'version' || opts.version) {
        console.log(`chartforge/${VERSION}`);
        return;
    }

    if (command === 'help' || opts.help) {
        printHelp(VERSION);
        return;
    }

    logger.banner();

    try {
        switch (command) {
            case 'serve': {
                const { runServe } = await import('./commands/serve.js');
                await runServe(opts);
                break;
            }
            case 'watch': {
                const { runWatch } = await import('./commands/watch.js');
                await runWatch(opts);
                break;
            }
            default: {
                const { runRender } = await import('./commands/render.js');
                await runRender(opts);
                break;
            }
        }
    } catch (err: unknown) {
        logger.error(
            err instanceof Error ? err.message : String(err),
            opts.verbose ? err : undefined
        );
        process.exit(1);
    }
}

main().catch((err: unknown) => {
    console.error('[ChartForge]', err);
    process.exit(1);
});
