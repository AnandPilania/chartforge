import { ChartForge } from 'chartforge';
import { TooltipPlugin } from '@chartforge/plugins';
import { LegendPlugin } from '@chartforge/plugins';
import { AxisPlugin } from '@chartforge/plugins';
import { GridPlugin } from '@chartforge/plugins';
import { CrosshairPlugin } from '@chartforge/plugins';
import { ZoomPlugin } from '@chartforge/plugins';
import { ExportPlugin } from '@chartforge/plugins';
import { AnnotationPlugin } from '@chartforge/plugins';
import { DataLabelsPlugin } from '@chartforge/plugins';
import type { ChartType } from 'chartforge';

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function makeColumnData() {
    return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        series: [{ name: 'Revenue', data: [65, 78, 72, 85, 92, 88] }],
    };
}
function makeLineData() {
    return {
        labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6'],
        series: [
            { name: 'Revenue', data: [100, 120, 115, 134, 148, 162] },
            { name: 'Expenses', data: [80, 95, 88, 105, 110, 118] },
        ],
    };
}
function makePieData() {
    return {
        labels: ['Product A', 'Product B', 'Product C', 'Product D'],
        series: [{ data: [300, 200, 150, 100] }],
    };
}
function makeDonutData() {
    return {
        labels: ['Desktop', 'Mobile', 'Tablet'],
        series: [{ data: [450, 320, 180] }],
    };
}
function makeBarData() {
    return {
        labels: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'],
        series: [{ name: 'Sales', data: [150, 220, 175, 260, 195] }],
    };
}
function makeScatterData() {
    return {
        series: [
            { name: 'Dataset A', data: [{ x: 10, y: 20, r: 5 }, { x: 25, y: 40, r: 8 }, { x: 40, y: 35, r: 6 }, { x: 60, y: 55, r: 10 }] },
            { name: 'Dataset B', data: [{ x: 15, y: 60, r: 7 }, { x: 30, y: 25, r: 5 }, { x: 55, y: 70, r: 9 }, { x: 80, y: 45, r: 6 }] },
        ],
    };
}
function makeStackedColumnData() {
    return {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        series: [
            { name: 'Product A', data: [30, 35, 33, 40] },
            { name: 'Product B', data: [25, 28, 30, 32] },
            { name: 'Product C', data: [20, 22, 25, 28] },
        ],
    };
}
function makeStackedBarData() {
    return {
        labels: ['Team A', 'Team B', 'Team C'],
        series: [
            { name: 'Done', data: [60, 75, 55] },
            { name: 'In Progress', data: [20, 15, 25] },
            { name: 'Pending', data: [20, 10, 20] },
        ],
    };
}
function makeFunnelData() {
    return {
        labels: ['Visits', 'Signups', 'Trials', 'Purchases'],
        series: [{ data: [10000, 5000, 2000, 500] }],
    };
}
function makeHeatmapData() {
    return {
        series: [{
            data: [
                [10, 20, 30, 40, 50], [12, 22, 32, 42, 52],
                [15, 25, 35, 45, 55], [17, 27, 37, 47, 57],
                [20, 30, 40, 50, 60],
            ],
        }],
    };
}
function makeCandleData() {
    return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Mon', 'Tue'],
        series: [{
            data: [
                { open: 100, high: 110, low: 95, close: 105 },
                { open: 102, high: 112, low: 97, close: 103 },
                { open: 105, high: 115, low: 100, close: 112 },
                { open: 112, high: 118, low: 108, close: 110 },
                { open: 110, high: 120, low: 105, close: 118 },
                { open: 122, high: 128, low: 118, close: 120 },
                { open: 120, high: 130, low: 116, close: 125 },
            ],
        }],
    };
}

// ─── Chart specs ──────────────────────────────────────────────────────────────

interface Spec {
    id: string;
    type: ChartType;
    data: () => object;
    setup: (chart: ChartForge) => void;
}

const SPECS: Spec[] = [
    {
        id: 'c-column', type: 'column', data: makeColumnData,
        setup: (c) => c
            .use('tooltip', TooltipPlugin)
            .use('axis', AxisPlugin, { y: { label: 'Revenue ($)', ticks: 5 } })
            .use('grid', GridPlugin)
            .use('crosshair', CrosshairPlugin)
            .use('dataLabels', DataLabelsPlugin, { formatter: (v: number) => `$${v}` })
            .use('export', ExportPlugin, { filename: 'column-chart' })
            .use('annotations', AnnotationPlugin, {
                markLines: [{ type: 'horizontal', value: 80, label: 'Target', color: '#10b981', dashArray: '5,3' }],
            }),
    },
    {
        id: 'c-line', type: 'line', data: makeLineData,
        setup: (c) => c
            .use('tooltip', TooltipPlugin)
            .use('legend', LegendPlugin, { position: 'bottom' })
            .use('axis', AxisPlugin)
            .use('grid', GridPlugin)
            .use('crosshair', CrosshairPlugin)
            .use('zoom', ZoomPlugin, { type: 'x' })
            .use('export', ExportPlugin, { filename: 'line-chart' }),
    },
    {
        id: 'c-pie', type: 'pie', data: makePieData,
        setup: (c) => c
            .use('tooltip', TooltipPlugin)
            .use('legend', LegendPlugin),
    },
    {
        id: 'c-donut', type: 'donut', data: makeDonutData,
        setup: (c) => c
            .use('tooltip', TooltipPlugin)
            .use('legend', LegendPlugin),
    },
    {
        id: 'c-bar', type: 'bar', data: makeBarData,
        setup: (c) => c
            .use('tooltip', TooltipPlugin)
            .use('export', ExportPlugin, { filename: 'bar-chart' }),
    },
    {
        id: 'c-scatter', type: 'scatter', data: makeScatterData,
        setup: (c) => c
            .use('tooltip', TooltipPlugin)
            .use('legend', LegendPlugin)
            .use('crosshair', CrosshairPlugin)
            .use('zoom', ZoomPlugin),
    },
    {
        id: 'c-stackedColumn', type: 'stackedColumn', data: makeStackedColumnData,
        setup: (c) => c
            .use('tooltip', TooltipPlugin)
            .use('legend', LegendPlugin)
            .use('axis', AxisPlugin)
            .use('grid', GridPlugin),
    },
    {
        id: 'c-stackedBar', type: 'stackedBar', data: makeStackedBarData,
        setup: (c) => c
            .use('tooltip', TooltipPlugin)
            .use('legend', LegendPlugin),
    },
    {
        id: 'c-funnel', type: 'funnel', data: makeFunnelData,
        setup: (c) => c.use('tooltip', TooltipPlugin),
    },
    {
        id: 'c-heatmap', type: 'heatmap', data: makeHeatmapData,
        setup: (c) => c.use('tooltip', TooltipPlugin),
    },
    {
        id: 'c-candlestick', type: 'candlestick', data: makeCandleData,
        setup: (c) => c
            .use('tooltip', TooltipPlugin, {
                formatter: (d: Record<string, unknown>) => {
                    if (d['type'] !== 'candlestick') return '';
                    const cc = d['candle'] as { open: number; high: number; low: number; close: number };
                    const clr = cc.close >= cc.open ? '#10b981' : '#ef4444';
                    return `<div style="font-weight:700;margin-bottom:4px">OHLC</div>`
                        + `<div style="color:${clr}">O ${cc.open} · H ${cc.high} · L ${cc.low} · C ${cc.close}</div>`;
                },
            })
            .use('crosshair', CrosshairPlugin, { y: { enabled: false } })
            .use('export', ExportPlugin, { filename: 'candlestick-chart', csvButton: false }),
    },
];

const charts = new Map<string, ChartForge>();

const getTheme = () =>
    (document.getElementById('themeSelect') as HTMLSelectElement).value;

function initCharts(): void {
    destroyAll();
    const theme = getTheme();
    for (const spec of SPECS) {
        const chart = new ChartForge(`#${spec.id}`, {
            type: spec.type,
            theme,
            data: spec.data() as never,
            height: 280,
            responsive: true,
            animation: { enabled: true, duration: 700, easing: 'easeOutQuad' },
        });
        spec.setup(chart);
        charts.set(spec.id, chart);
    }
}

function destroyAll(): void {
    charts.forEach(c => c.destroy());
    charts.clear();
}

function randomizeAll(): void {
    const columnChart = charts.get('c-column');
    if (columnChart) {
        columnChart.updateData({
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            series: [{ name: 'Revenue', data: Array.from({ length: 6 }, () => rand(20, 130)) }],
        });
    }
    const lineChart = charts.get('c-line');
    if (lineChart) {
        lineChart.updateData({
            labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6'],
            series: [
                { name: 'Revenue', data: Array.from({ length: 6 }, () => rand(60, 200)) },
                { name: 'Expenses', data: Array.from({ length: 6 }, () => rand(40, 150)) },
            ],
        });
    }
}

document.getElementById('themeSelect')!.addEventListener('change', initCharts);
document.getElementById('btnRefresh')!.addEventListener('click', initCharts);
document.getElementById('btnRandom')!.addEventListener('click', randomizeAll);

initCharts();

if (import.meta.hot) {
    import.meta.hot.dispose(destroyAll);
    import.meta.hot.accept();
}
