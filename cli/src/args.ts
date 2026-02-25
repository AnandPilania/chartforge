import type { CliOptions } from './types.js';

interface FlagDef {
    alias?: string;
    type: 'string' | 'number' | 'boolean';
    default?: unknown;
    desc: string;
}

const FLAGS: Record<string, FlagDef> = {
    'input': { alias: 'i', type: 'string', desc: 'Input file path (JSON/CSV/TSV/YAML) or - for stdin' },
    'url': { alias: 'u', type: 'string', desc: 'Fetch data from HTTP/HTTPS URL' },
    'data': { alias: 'd', type: 'string', desc: 'Inline JSON data string' },
    'format': { alias: 'f', type: 'string', desc: 'Input format: json | csv | tsv | yaml' },
    'jq': { type: 'string', desc: 'Dot-path to extract from JSON response (e.g. data.items)' },
    'method': { alias: 'X', type: 'string', desc: 'HTTP method: GET | POST (default: GET)', default: 'GET' },
    'headers': { alias: 'H', type: 'string', desc: 'JSON string of HTTP headers' },
    'body': { alias: 'b', type: 'string', desc: 'HTTP request body (for POST)' },
    'interval': { type: 'number', desc: 'Poll interval in seconds for --serve (default: 5)', default: 5 },

    'type': { alias: 't', type: 'string', desc: 'Chart type: column|bar|line|pie|donut|scatter|stackedColumn|stackedBar|funnel|heatmap|candlestick', default: 'column' },
    'title': { type: 'string', desc: 'Chart title' },
    'width': { alias: 'w', type: 'number', desc: 'Chart width in pixels (default: 800)', default: 800 },
    'height': { alias: 'h', type: 'number', desc: 'Chart height in pixels (default: 450)', default: 450 },
    'theme': { type: 'string', desc: 'Theme: light | dark | neon (default: dark)', default: 'dark' },
    'labels': { alias: 'l', type: 'string', desc: 'Comma-separated label override' },

    'output': { alias: 'o', type: 'string', desc: 'Output file path (default: auto-named in cwd)' },
    'out': { type: 'string', desc: 'Output format: html | svg | png | terminal (default: html)', default: 'html' },
    'open': { type: 'boolean', desc: 'Open output in browser after rendering', default: false },
    'watch': { type: 'boolean', desc: 'Watch input file and re-render on change', default: false },

    'verbose': { alias: 'v', type: 'boolean', desc: 'Verbose output', default: false },
    'no-color': { type: 'boolean', desc: 'Disable ANSI colors', default: false },
    'help': { type: 'boolean', desc: 'Show this help message', default: false },
    'version': { alias: 'V', type: 'boolean', desc: 'Print version', default: false },
};

const ALIAS_MAP = new Map<string, string>();
for (const [name, def] of Object.entries(FLAGS)) {
    if (def.alias) ALIAS_MAP.set(def.alias, name);
}

export function parseArgs(argv: string[]): { opts: CliOptions; command: string } {
    const args = argv.slice(2);
    const opts: Record<string, unknown> = {};
    let command = 'render';

    for (const [key, def] of Object.entries(FLAGS)) {
        if (def.default !== undefined) opts[key] = def.default;
    }

    let i = 0;
    while (i < args.length) {
        const arg = args[i];

        if (!arg.startsWith('-')) {
            if (['render', 'serve', 'watch', 'help', 'version'].includes(arg)) {
                command = arg;
            } else {
                opts['input'] = arg;
            }
            i++;
            continue;
        }

        if (arg.includes('=')) {
            const [rawKey, ...rest] = arg.replace(/^-+/, '').split('=');
            const key = ALIAS_MAP.get(rawKey) ?? rawKey;
            const value = rest.join('=');
            const def = FLAGS[key];
            opts[key] = def?.type === 'number' ? Number(value) : value;
            i++;
            continue;
        }

        const rawKey = arg.replace(/^-+/, '');
        const key = ALIAS_MAP.get(rawKey) ?? rawKey;
        const def = FLAGS[key];

        if (!def) {
            i++;
            continue;
        }

        if (def.type === 'boolean') {
            opts[key] = true;
            i++;
        } else {
            const value = args[i + 1];
            opts[key] = def.type === 'number' ? Number(value) : value;
            i += 2;
        }
    }

    // --no-color → set env
    if (opts['no-color']) process.env['NO_COLOR'] = '1';

    return {
        command: command === 'help' ? 'help' : command,
        opts: opts as CliOptions,
    };
}

export function printHelp(version: string): void {
    const c = (code: string, s: string) =>
        process.stdout.isTTY ? `\x1b[${code}m${s}\x1b[0m` : s;

    console.log();
    console.log(c('36;1', '  ⬡ ChartForge CLI') + c('90', ` v${version}`));
    console.log(c('2', '  SVG/PNG/HTML/Terminal chart generator'));
    console.log();
    console.log(c('1', '  Usage'));
    console.log(c('36', '    npx chartforge') + ' [command] [options]');
    console.log(c('36', '    chartforge') + ' <file>  [options]');
    console.log();
    console.log(c('1', '  Commands'));
    const cmds = [
        ['render', 'Render a chart from file, URL, or stdin (default)'],
        ['serve', 'Poll a URL and live-refresh output'],
        ['watch', 'Watch a file and re-render on change'],
        ['help', 'Show this help message'],
        ['version', 'Print version number'],
    ];
    for (const [cmd, desc] of cmds) {
        console.log(`    ${c('36', cmd.padEnd(10))} ${desc}`);
    }
    console.log();
    console.log(c('1', '  Options'));
    for (const [name, def] of Object.entries(FLAGS)) {
        if (name === 'help' || name === 'version') continue;
        const alias = def.alias ? `-${def.alias}, ` : '    ';
        const flag = `${alias}--${name}`;
        const dflt = def.default !== undefined && def.default !== false
            ? c('90', ` [${def.default}]`) : '';
        console.log(`    ${c('33', flag.padEnd(24))} ${def.desc}${dflt}`);
    }
    console.log();
    console.log(c('1', '  Examples'));
    const examples = [
        ['# From file', ''],
        ['chartforge data.json', ''],
        ['chartforge data.csv -t line -o chart.html --open', ''],
        ['', ''],
        ['# From stdin', ''],
        ['echo \'[10,20,30]\' | chartforge - -t bar --out terminal', ''],
        ['cat sales.csv | chartforge - -t column --theme neon --out svg', ''],
        ['', ''],
        ['# From HTTP URL', ''],
        ['chartforge --url https://api.example.com/data --jq data.series', ''],
        ['chartforge --url https://api/csv --format csv -t line', ''],
        ['', ''],
        ['# Live terminal dashboard', ''],
        ['chartforge serve --url https://api.example.com/metrics --interval 3 --out terminal', ''],
        ['', ''],
        ['# Watch file', ''],
        ['chartforge watch --input data.json --out html --open', ''],
        ['', ''],
        ['# Export PNG (requires sharp)', ''],
        ['chartforge data.json --out png --output chart.png', ''],
        ['', ''],
        ['# Pipe SVG to file', ''],
        ['chartforge data.json --out svg -o - > chart.svg', ''],
        ['', ''],
        ['# Inline data', ''],
        ['chartforge --data \'{"series":[{"data":[1,2,3]}]}\' --out terminal', ''],
        ['', ''],
        ['# HTTP POST with auth', ''],
        ['chartforge --url https://api/data --method POST --headers \'{"Authorization":"Bearer TOKEN"}\' --body \'{"range":"7d"}\'', ''],
    ];

    for (const [ex] of examples) {
        if (!ex) { console.log(); continue; }
        if (ex.startsWith('#')) { console.log(c('90', `  ${ex}`)); continue; }
        console.log(c('2', `  $ `) + c('36', ex));
    }
    console.log();
}
