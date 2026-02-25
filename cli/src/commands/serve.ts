import type { CliOptions } from '../types.js';
import { pollData } from '../inputs/http.js';
import { renderToTerminal } from '../renderer/terminal.js';
import { renderToSVG } from '../renderer/svg.js';
import { generateHTML } from '../outputs/html.js';
import { writeOutput, defaultFilename, openInBrowser } from '../outputs/writer.js';
import { logger } from '../logger.js';

export async function runServe(opts: CliOptions): Promise<void> {
    if (!opts.url) {
        logger.error('--serve requires --url <endpoint>');
        process.exit(1);
    }

    const interval = opts.interval ?? 5;
    const outFmt = opts.out ?? 'terminal';

    logger.info(`Live mode — polling ${opts.url} every ${interval}s`);
    logger.dim(`Format: ${outFmt}  |  Ctrl+C to stop`);
    logger.blank();

    const controller = new AbortController();

    process.on('SIGINT', () => {
        logger.blank();
        logger.info('Stopped.');
        controller.abort();
        process.exit(0);
    });

    await pollData(
        {
            url: opts.url,
            method: opts.method,
            headers: opts.headers ? JSON.parse(opts.headers) as Record<string, string> : undefined,
            body: opts.body,
            jq: opts.jq,
        },
        interval,
        async (data, tick) => {
            if (outFmt === 'terminal') {
                if (tick > 0) process.stdout.write('\x1b[2J\x1b[H');
                const rendered = renderToTerminal(data, {
                    type: opts.type,
                    title: `${opts.title ?? 'Live Chart'} — tick ${tick + 1}`,
                    width: opts.width,
                });
                process.stdout.write(rendered);
            } else {
                const svgResult = await renderToSVG(data, opts);
                const dest = opts.output ?? defaultFilename(outFmt === 'html' ? 'html' : outFmt);

                if (outFmt === 'html') {
                    writeOutput(generateHTML(svgResult, data, opts), dest);
                } else if (outFmt === 'svg') {
                    writeOutput(svgResult.svg, dest);
                } else if (outFmt === 'png') {
                    const { renderToPNG } = await import('../renderer/png.js');
                    writeOutput(await renderToPNG(svgResult), dest);
                }

                if (tick === 0 && opts.open) await openInBrowser(dest);
                logger.info(`Tick ${tick + 1} — saved to ${dest}`);
            }
        },
        controller.signal,
    );
}
