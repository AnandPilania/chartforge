import type { CliOptions } from '../types.js';
import { loadFromFile } from '../inputs/file.js';
import { fetchData } from '../inputs/http.js';
import { parseJSON } from '../inputs/parser.js';
import { renderToSVG } from '../renderer/svg.js';
import { renderToTerminal } from '../renderer/terminal.js';
import { generateHTML } from '../outputs/html.js';
import { writeOutput, writeStdout, defaultFilename, openInBrowser } from '../outputs/writer.js';
import { logger } from '../logger.js';

export async function runRender(opts: CliOptions): Promise<void> {
    const outFmt = (opts.out ?? 'html') as string;
    const verbose = opts.verbose ?? false;

    let data;

    if (opts.url) {
        if (verbose) logger.step(`Fetching from URL: ${opts.url}`);
        data = await fetchData({
            url: opts.url,
            method: opts.method,
            headers: opts.headers ? JSON.parse(opts.headers) as Record<string, string> : undefined,
            body: opts.body,
            jq: opts.jq,
        });
    } else if (opts.data) {
        if (verbose) logger.step('Parsing inline data');
        data = parseJSON(opts.data, opts.jq);
    } else if (opts.input) {
        if (verbose) logger.step(`Reading file: ${opts.input}`);
        data = await loadFromFile(opts.input, opts.format);
    } else {
        if (verbose) logger.step('Reading from stdin');
        data = await loadFromFile('-', opts.format);
    }

    if (verbose) {
        logger.dim(`Loaded ${data.series.length} series, ${data.series[0]?.data?.length ?? 0} points`);
    }

    if (outFmt === 'terminal') {
        const rendered = renderToTerminal(data, {
            type: opts.type,
            title: opts.title,
            width: opts.width,
        });
        writeStdout(rendered);
        return;
    }

    if (verbose) logger.step('Rendering SVG');
    const svgResult = await renderToSVG(data, opts);

    let outPath = opts.output;

    if (outFmt === 'svg') {
        const dest = outPath ?? defaultFilename('svg');
        if (dest === '-') {
            writeStdout(svgResult.svg);
        } else {
            writeOutput(svgResult.svg, dest);
        }
        return;
    }

    if (outFmt === 'png') {
        const { renderToPNG } = await import('../renderer/png.js');
        if (verbose) logger.step('Converting to PNG');
        const pngBuf = await renderToPNG(svgResult);
        const dest = outPath ?? defaultFilename('png');
        writeOutput(pngBuf, dest);
        if (opts.open) await openInBrowser(dest);
        return;
    }

    if (verbose) logger.step('Generating HTML page');
    const html = generateHTML(svgResult, data, opts);
    const dest = outPath ?? defaultFilename('html');
    if (dest === '-') {
        writeStdout(html);
    } else {
        writeOutput(html, dest);
        if (opts.open) await openInBrowser(dest);
    }
}
