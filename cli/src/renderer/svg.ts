import { JSDOM } from 'jsdom';
import type { ParsedData, CliOptions } from '../types.js';

let _shimmed = false;

function shimBrowser(): void {
    if (_shimmed) return;
    _shimmed = true;

    const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
        pretendToBeVisual: true,
    });

    const { window } = dom;

    Object.assign(globalThis, {
        window,
        document: window.document,
        navigator: window.navigator,
        SVGElement: window.SVGElement,
        SVGSVGElement: window.SVGSVGElement,
        HTMLElement: window.HTMLElement,
        Element: window.Element,
        Event: window.Event,
        MouseEvent: window.MouseEvent,
        CustomEvent: window.CustomEvent,
        MutationObserver: window.MutationObserver,
        ResizeObserver: class MockResizeObserver {
            observe() { }
            unobserve() { }
            disconnect() { }
        },
        requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 0) as unknown as number,
        cancelAnimationFrame: (id: unknown) => clearTimeout(id as ReturnType<typeof setTimeout>),
        performance: globalThis.performance ?? { now: Date.now.bind(Date) },
    });
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

    const { ChartForge } = await import('../../../src/ChartForge.js');
    const { BUILT_IN_THEMES } = await import('../../../src/themes/builtins.js');

    const width = opts.width ?? 800;
    const height = opts.height ?? 450;
    const theme = opts.theme ?? 'dark';

    const container = globalThis.document.createElement('div');
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    globalThis.document.body.appendChild(container);

    const chart = new ChartForge(container, {
        type: (opts.type ?? 'column') as never,
        theme,
        width,
        height,
        responsive: false,
        animation: { enabled: false },
        data: {
            labels: opts.labels ? opts.labels.split(',').map(l => l.trim()) : data.labels,
            series: data.series,
        },
    });

    const noAxis = ['pie', 'donut', 'funnel', 'heatmap'];
    if (!noAxis.includes(opts.type ?? 'column')) {
        const { AxisPlugin } = await import('../../../src/plugins/AxisPlugin.js');
        const { GridPlugin } = await import('../../../src/plugins/GridPlugin.js');
        chart.use('axis', AxisPlugin);
        chart.use('grid', GridPlugin);
    }

    await new Promise(r => setTimeout(r, 80));

    const svg = container.querySelector('svg');
    if (!svg) throw new Error('Renderer produced no SVG element');

    const themeObj = chart.themeManager.get(theme) ?? BUILT_IN_THEMES['dark'];
    const style = globalThis.document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
    .chartforge-svg { font-family: 'Segoe UI', system-ui, sans-serif; }
    text { font-family: inherit; }
  `;
    svg.insertBefore(style, svg.firstChild);

    if (!svg.getAttribute('viewBox')) {
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    }
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    const svgStr = svg.outerHTML;
    chart.destroy();
    globalThis.document.body.removeChild(container);

    return { svg: svgStr, width, height };
}
