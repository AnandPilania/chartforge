import type { ChartData, Theme, ChartConfig } from '../types.js';
import { createSVGElement } from '../utils/dom.js';

export interface ChartDimensions {
    width: number;
    height: number;
    totalWidth: number;
    totalHeight: number;
}

export interface ChartLike {
    config: ChartConfig;
    theme: Theme;
    svg: SVGSVGElement;
    mainGroup: SVGGElement;
    animationEngine: { animate(...args: Parameters<import('../core/AnimationEngine.js').AnimationEngine['animate']>): void };
    emit: (event: string, data: unknown) => void;
}

export abstract class BaseRenderer {
    protected readonly theme: Theme;
    protected readonly config: ChartConfig;
    protected readonly padding: Required<NonNullable<ChartConfig['padding']>>;
    protected readonly group: SVGGElement;

    constructor(protected readonly chart: ChartLike, protected readonly data: ChartData) {
        this.theme = chart.theme;
        this.config = chart.config;
        this.group = chart.mainGroup;
        this.padding = {
            top: chart.config.padding?.top ?? 40,
            right: chart.config.padding?.right ?? 40,
            bottom: chart.config.padding?.bottom ?? 60,
            left: chart.config.padding?.left ?? 60,
        };
    }

    protected dims(): ChartDimensions {
        const vb = this.chart.svg.getAttribute('viewBox')!.split(' ').map(Number);
        const tw = vb[2], th = vb[3];
        return {
            width: tw - this.padding.left - this.padding.right,
            height: th - this.padding.top - this.padding.bottom,
            totalWidth: tw,
            totalHeight: th,
        };
    }

    protected color(i: number): string {
        return this.theme.colors[i % this.theme.colors.length];
    }

    protected g(className: string): SVGGElement {
        return createSVGElement<SVGGElement>('g', { className });
    }

    abstract render(): void;
}
