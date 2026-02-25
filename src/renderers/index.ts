export { BaseRenderer } from './BaseRenderer.js';
export { PieRenderer } from './PieRenderer.js';
export { DonutRenderer } from './DonutRenderer.js';
export { ColumnRenderer } from './ColumnRenderer.js';
export { BarRenderer } from './BarRenderer.js';
export { LineRenderer } from './LineRenderer.js';
export { ScatterRenderer } from './ScatterRenderer.js';
export { StackedColumnRenderer } from './StackedColumnRenderer.js';
export { StackedBarRenderer } from './StackedBarRenderer.js';
export { FunnelRenderer } from './FunnelRenderer.js';
export { HeatmapRenderer } from './HeatmapRenderer.js';
export { CandlestickRenderer } from './CandlestickRenderer.js';

import type { ChartType } from '../types.js';
import type { BaseRenderer, ChartLike } from './BaseRenderer.js';
import type { ChartData } from '../types.js';
import { PieRenderer } from './PieRenderer.js';
import { DonutRenderer } from './DonutRenderer.js';
import { ColumnRenderer } from './ColumnRenderer.js';
import { BarRenderer } from './BarRenderer.js';
import { LineRenderer } from './LineRenderer.js';
import { ScatterRenderer } from './ScatterRenderer.js';
import { StackedColumnRenderer } from './StackedColumnRenderer.js';
import { StackedBarRenderer } from './StackedBarRenderer.js';
import { FunnelRenderer } from './FunnelRenderer.js';
import { HeatmapRenderer } from './HeatmapRenderer.js';
import { CandlestickRenderer } from './CandlestickRenderer.js';

type RendererCtor = new (chart: ChartLike, data: ChartData) => BaseRenderer;

export const RENDERERS: Partial<Record<ChartType, RendererCtor>> = {
    pie: PieRenderer,
    donut: DonutRenderer,
    column: ColumnRenderer,
    bar: BarRenderer,
    row: BarRenderer,
    line: LineRenderer,
    scatter: ScatterRenderer,
    stackedColumn: StackedColumnRenderer,
    stackedBar: StackedBarRenderer,
    funnel: FunnelRenderer,
    heatmap: HeatmapRenderer,
    candlestick: CandlestickRenderer,
};
