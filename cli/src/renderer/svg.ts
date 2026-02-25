import { JSDOM } from 'jsdom';
import type { ParsedData, CliOptions } from '../types.js';

let _jsdom: JSDOM | null = null;

function getJSDOM(): JSDOM {
    if (!_jsdom) {
        _jsdom = new JSDOM(
            '<!DOCTYPE html><html><body></body></html>',
            { pretendToBeVisual: true, resources: 'usable' }
        );
    }
    return _jsdom;
}

function defineGlobal(key: string, value: unknown): void {
    try {
        const desc = Object.getOwnPropertyDescriptor(globalThis, key);
        if (desc && !desc.configurable) return;
        Object.defineProperty(globalThis, key, {
            value,
            writable: true,
            configurable: true,
            enumerable: false,
        });
    } catch {
        // Ignore any remaining errors
    }
}

let _shimmed = false;

export function shimBrowser(): void {
    if (_shimmed) return;
    _shimmed = true;

    const { window } = getJSDOM();

    const safe: Record<string, unknown> = {
        document: window.document,
        SVGElement: window.SVGElement,
        SVGSVGElement: window.SVGSVGElement,
        HTMLElement: window.HTMLElement,
        HTMLDivElement: window.HTMLDivElement,
        Element: window.Element,
        Node: window.Node,
        Event: window.Event,
        MouseEvent: window.MouseEvent,
        CustomEvent: window.CustomEvent,
        MutationObserver: window.MutationObserver,
        XMLSerializer: window.XMLSerializer,
        ResizeObserver: class {
            observe() { }
            unobserve() { }
            disconnect() { }
        },
        requestAnimationFrame: (cb: (t: number) => void) =>
            setTimeout(() => cb(performance.now()), 0),
        cancelAnimationFrame: clearTimeout,
    };

    for (const [key, value] of Object.entries(safe)) {
        defineGlobal(key, value);
    }

    defineGlobal('window', window);

    if (typeof globalThis.performance === 'undefined') {
        defineGlobal('performance', { now: () => Date.now() });
    }
}

export interface RenderResult {
    svg: string;
    width: number;
    height: number;
}

export async function renderToSVG(
    data: ParsedData,
    opts: CliOptions,
): Promise<RenderResult> {
    shimBrowser();

    const width = opts.width ?? 800;
    const height = opts.height ?? 450;
    const theme = opts.theme ?? 'dark';
    const type = opts.type ?? 'column';

    const { window: w } = getJSDOM();
    const doc = w.document;

    const container = doc.createElement('div');
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    doc.body.appendChild(container);

    const prevDoc = (globalThis as Record<string, unknown>)['document'];
    (globalThis as Record<string, unknown>)['document'] = doc;

    let svgStr = '';
    try {
        const { ChartForge } = await import('../../../src/ChartForge.js');
        const { BUILT_IN_THEMES } = await import('../../../src/themes/builtins.js');

        const labels = opts.labels
            ? opts.labels.split(',').map((l: string) => l.trim())
            : data.labels;

        const chart = new ChartForge(container as unknown as HTMLElement, {
            type: type as never,
            theme,
            width,
            height,
            responsive: false,
            animation: { enabled: false },
            data: { labels, series: data.series },
        } as never);

        const noAxisTypes = ['pie', 'donut', 'funnel', 'heatmap'];
        if (!noAxisTypes.includes(type)) {
            const { AxisPlugin } = await import('../../../src/plugins/AxisPlugin.js');
            const { GridPlugin } = await import('../../../src/plugins/GridPlugin.js');
            chart.use('axis', AxisPlugin as never);
            chart.use('grid', GridPlugin as never);
        }

        await new Promise(r => setTimeout(r, 150));

        const svgEl = container.querySelector('svg');
        if (!svgEl) throw new Error('ChartForge produced no SVG element — check data format');

        const themeObj = chart.themeManager.get(theme) ?? BUILT_IN_THEMES['dark'];
        const styleEl = doc.createElementNS('http://www.w3.org/2000/svg', 'style');
        styleEl.textContent = [
            '.chartforge-svg { font-family: "Segoe UI", system-ui, Arial, sans-serif; }',
            `text { font-family: "Segoe UI", system-ui, Arial, sans-serif; fill: ${themeObj.text}; }`,
        ].join(' ');
        svgEl.insertBefore(styleEl, svgEl.firstChild);

        svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svgEl.setAttribute('width', String(width));
        svgEl.setAttribute('height', String(height));
        svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

        svgStr = svgEl.outerHTML;
        chart.destroy();
    } finally {
        (globalThis as Record<string, unknown>)['document'] = prevDoc;
        doc.body.removeChild(container);
    }

    return { svg: svgStr, width, height };
}
