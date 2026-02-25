const USE_COLOR = !process.env['NO_COLOR'] && process.stdout.isTTY;

const c = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
};

const paint = (code: string, text: string) =>
    USE_COLOR ? `${code}${text}${c.reset}` : text;

export const logger = {
    prefix: paint(c.cyan + c.bold, '⬡ ChartForge'),

    info: (msg: string) => console.log(`${logger.prefix} ${paint(c.gray, '›')} ${msg}`),
    success: (msg: string) => console.log(`${logger.prefix} ${paint(c.green, '✓')} ${paint(c.green, msg)}`),
    warn: (msg: string) => console.warn(`${logger.prefix} ${paint(c.yellow, '⚠')} ${paint(c.yellow, msg)}`),
    error: (msg: string, err?: unknown) => {
        console.error(`${logger.prefix} ${paint(c.red, '✗')} ${paint(c.red, msg)}`);
        if (err) console.error(paint(c.dim, String(err instanceof Error ? err.stack : err)));
    },
    step: (msg: string) => console.log(`  ${paint(c.cyan, '→')} ${msg}`),
    dim: (msg: string) => console.log(paint(c.dim, `  ${msg}`)),
    blank: () => console.log(),

    banner: () => {
        console.log();
        console.log(paint(c.cyan + c.bold, [
            '  ╔═══════════════════════════╗',
            '  ║   ⬡  C H A R T F O R G E  ║',
            '  ║   CLI Visualization Tool  ║',
            '  ╚═══════════════════════════╝',
        ].join('\n')));
        console.log(paint(c.dim, '  SVG • PNG • HTML • Terminal'));
        console.log();
    },
};
