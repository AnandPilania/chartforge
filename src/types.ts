export interface ScatterPoint { x: number; y: number; r?: number }
export interface CandleData { open: number; high: number; low: number; close: number }

export type SeriesValue = number | ScatterPoint | CandleData | number[];

export interface Series<T extends SeriesValue = SeriesValue> {
    name?: string;
    data: T[];
}

export interface ChartData {
    labels?: string[];
    series: Series[];
}

export type ChartType =
    | 'pie' | 'donut'
    | 'bar' | 'row'
    | 'column'
    | 'line'
    | 'scatter'
    | 'stackedColumn' | 'stackedBar'
    | 'funnel'
    | 'heatmap'
    | 'candlestick';

export type EasingName =
    | 'linear'
    | 'easeInQuad' | 'easeOutQuad' | 'easeInOutQuad'
    | 'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic'
    | 'easeInElastic' | 'easeOutElastic'
    | 'easeInBounce' | 'easeOutBounce';

export interface AnimationConfig {
    enabled?: boolean;
    duration?: number;
    easing?: EasingName;
}

export interface PaddingConfig {
    top?: number; right?: number; bottom?: number; left?: number;
}

export interface VirtualConfig {
    enabled?: boolean;
    threshold?: number;
}

export interface ChartConfig {
    type: ChartType;
    width?: number | 'auto';
    height?: number;
    responsive?: boolean;
    theme?: string;
    animation?: AnimationConfig;
    data: ChartData;
    plugins?: Record<string, unknown>;
    middleware?: MiddlewareFn[];
    virtual?: VirtualConfig;
    padding?: PaddingConfig;
}

export interface TooltipTheme { background: string; text: string; border: string; shadow: string }
export interface LegendTheme { text: string; hover: string }
export interface AxisTheme { line: string; text: string; grid: string }

export interface Theme {
    background: string;
    foreground: string;
    grid: string;
    text: string;
    textSecondary: string;
    colors: string[];
    tooltip: TooltipTheme;
    legend: LegendTheme;
    axis: AxisTheme;
}

export type EventHandler<T = unknown> = (data: T) => void;
export type Unsubscribe = () => void;

export interface RenderContext {
    data: ChartData;
    theme: Theme;
    svg: SVGSVGElement;
    mainGroup: SVGGElement;
}

export type MiddlewareFn = (ctx: RenderContext, next: () => Promise<void>) => Promise<void>;

export interface IPlugin {
    init?(): void;
    destroy?(): void;
}

export type PluginConstructor = new (chart: unknown, config?: unknown) => IPlugin;

export interface IAdapter {
    on(event: string, handler: EventHandler): void;
    connect(): void | Promise<void>;
    disconnect(): void;
}

export type AdapterConstructor = new (config: unknown) => IAdapter;
