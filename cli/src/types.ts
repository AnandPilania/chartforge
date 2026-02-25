export type OutputFormat = 'html' | 'svg' | 'png' | 'terminal';

export type InputSource = 'file' | 'http' | 'stdin' | 'inline';

export interface CliOptions {
    input?: string;          // file path, URL, or '-' for stdin
    data?: string;          // inline JSON string
    format?: string;          // input format: json | csv | tsv | yaml

    type?: string;          // chart type (default: column)
    title?: string;          // chart title
    width?: number;          // SVG viewBox width (default: 800)
    height?: number;          // SVG viewBox height (default: 450)
    theme?: string;          // light | dark | neon (default: dark)
    labels?: string;          // comma-separated labels override

    url?: string;          // fetch from URL
    method?: string;          // GET | POST (default: GET)
    headers?: string;          // JSON string of request headers
    body?: string;          // request body (for POST)
    jq?: string;          // simple dot-path to extract data from JSON response
    interval?: number;          // poll every N seconds (live mode)

    output?: string;          // output file path  (default: stdout or chart.html)
    out?: OutputFormat;    // output format (default: html)
    open?: boolean;         // open in browser after rendering
    watch?: boolean;         // watch input file for changes

    verbose?: boolean;
    noColor?: boolean;
}

export interface ParsedData {
    labels?: string[];
    series: Array<{ name?: string; data: number[] }>;
}
