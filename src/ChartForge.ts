import type {
    ChartConfig, ChartData, ChartType, Theme,
    EventHandler, Unsubscribe, PluginConstructor,
    AdapterConstructor, MiddlewareFn,
} from './types.js';
import { EventBus } from './core/EventBus.js';
import { MiddlewarePipeline } from './core/MiddlewarePipeline.js';
import { DataPipeline } from './core/DataPipeline.js';
import { AnimationEngine } from './core/AnimationEngine.js';
import { ThemeManager } from './core/ThemeManager.js';
import { PluginManager } from './core/PluginManager.js';
import { VirtualRenderer } from './core/VirtualRenderer.js';
import { RealTimeModule } from './adapters/RealTimeModule.js';
import { WebSocketAdapter } from './adapters/WebSocketAdapter.js';
import { PollingAdapter } from './adapters/PollingAdapter.js';
import { BUILT_IN_THEMES } from './themes/builtins.js';
import { RENDERERS } from './renderers/index.js';
import { createSVGElement, removeChildren } from './utils/dom.js';
import { uid, merge, debounce } from './utils/misc.js';

export type { ChartConfig };

const DEFAULT_CONFIG: Required<Omit<ChartConfig, 'type' | 'data'>> = {
    width: 'auto',
    height: 400,
    responsive: true,
    theme: 'light',
    animation: { enabled: true, duration: 750, easing: 'easeOutQuad' },
    plugins: {},
    middleware: [],
    virtual: { enabled: false, threshold: 10_000 },
    padding: { top: 40, right: 40, bottom: 60, left: 60 },
};

export class ChartForge {
    readonly id: string;
    readonly container: HTMLElement;
    config: ChartConfig;
    theme!: Theme;
    svg!: SVGSVGElement;
    initialized = false;

    readonly eventBus: EventBus;
    readonly middleware: MiddlewarePipeline;
    readonly dataPipeline: DataPipeline;
    readonly animationEngine: AnimationEngine;
    readonly themeManager: ThemeManager;
    readonly pluginManager: PluginManager;
    readonly virtualRenderer: VirtualRenderer;
    readonly realTime: RealTimeModule;

    mainGroup!: SVGGElement;

    private _resizeObserver: ResizeObserver | null = null;
    private _rendering = false;

    constructor(container: string | HTMLElement, config: ChartConfig) {
        this.id = uid();
        this.container = typeof container === 'string'
            ? (document.querySelector<HTMLElement>(container) as HTMLElement)
            : container;

        if (!this.container) throw new Error('[ChartForge] Container not found');

        this.config = merge({ ...DEFAULT_CONFIG } as ChartConfig, config);

        this.eventBus = new EventBus();
        this.middleware = new MiddlewarePipeline();
        this.dataPipeline = new DataPipeline();
        this.animationEngine = new AnimationEngine();
        this.themeManager = new ThemeManager();
        this.pluginManager = new PluginManager(this);
        this.virtualRenderer = new VirtualRenderer(this);
        this.realTime = new RealTimeModule(this);

        for (const [name, t] of Object.entries(BUILT_IN_THEMES)) {
            this.themeManager.register(name, t);
        }

        this.realTime.registerAdapter('websocket', WebSocketAdapter as unknown as AdapterConstructor);
        this.realTime.registerAdapter('polling', PollingAdapter as unknown as AdapterConstructor);

        this._init();
    }

    private _init(): void {
        const theme = this.themeManager.apply(this.config.theme ?? 'light');
        this.theme = theme ?? BUILT_IN_THEMES['light'];

        this._createSVG();
        this._setupMiddleware();

        if (this.config.responsive) {
            this._resizeObserver = new ResizeObserver(debounce(() => this.resize(), 150));
            this._resizeObserver.observe(this.container);
        }

        this.initialized = true;
        this.pluginManager.initAll();
        void this.render();
    }

    private _createSVG(): void {
        const w = this.config.width === 'auto'
            ? (this.container.offsetWidth || 600)
            : (this.config.width ?? 600);
        const h = this.config.height ?? 400;

        this.svg = createSVGElement<SVGSVGElement>('svg', {
            width: '100%',
            height: '100%',
            viewBox: `0 0 ${w} ${h}`,
            className: 'chartforge-svg',
            role: 'img',
        });

        this.svg.appendChild(createSVGElement<SVGDefsElement>('defs'));

        this.mainGroup = createSVGElement<SVGGElement>('g', { className: 'chartforge-main' });
        this.svg.appendChild(this.mainGroup);

        this.svg.style.cssText = `
      display:block;
      font-family:'system-ui', sans-serif;
      background:${this.theme.background};
      border-radius:inherit;
    `;
        this.container.appendChild(this.svg);
    }

    private _setupMiddleware(): void {
        this.middleware.use(async (ctx, next) => {
            this.eventBus.emit('beforeRender', ctx);
            await next();
        });

        for (const fn of this.config.middleware ?? []) {
            this.middleware.use(fn as MiddlewareFn);
        }
    }

    async render(): Promise<void> {
        if (this._rendering) return;
        this._rendering = true;

        try {
            const ctx = {
                data: this.config.data,
                theme: this.theme,
                svg: this.svg,
                mainGroup: this.mainGroup,
            };

            await this.middleware.execute(ctx);

            const data = await this.dataPipeline.transform(this.config.data, this.config);
            const useVirtual = this.config.virtual?.enabled && this.virtualRenderer.shouldVirtualize();

            this._renderData(useVirtual ? this.virtualRenderer.getVisibleData() : data);

            this.eventBus.emit('afterRender', ctx);
        } finally {
            this._rendering = false;
        }
    }

    private _renderData(data: ChartData): void {
        removeChildren(this.mainGroup);

        const RendererClass = RENDERERS[this.config.type as ChartType];
        if (!RendererClass) {
            console.error(`[ChartForge] Unknown chart type: "${this.config.type}"`);
            return;
        }
        new RendererClass(this, data).render();
    }

    updateData(data: Partial<ChartData>): void {
        this.config.data = merge({ ...this.config.data }, data);
        void this.render();
    }

    updateConfig(config: Partial<ChartConfig>): void {
        this.config = merge({ ...this.config }, config);
        void this.render();
    }

    setTheme(name: string): void {
        const t = this.themeManager.apply(name);
        if (!t) return;
        this.theme = t;
        this.svg.style.background = t.background;
        void this.render();
    }

    use(name: string, Plugin: PluginConstructor, config?: unknown): this {
        this.pluginManager.register(name, Plugin, config);
        return this;
    }

    getPlugin<T = unknown>(name: string): T | null {
        return this.pluginManager.get<T>(name);
    }

    setViewport(start: number, end: number): void {
        this.virtualRenderer.updateViewport(start, end);
        void this.render();
    }

    resize(): void {
        const w = this.container.offsetWidth || 600;
        const h = this.config.height ?? 400;
        this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        void this.render();
    }

    on<T = unknown>(event: string, handler: EventHandler<T>, priority?: number): Unsubscribe {
        return this.eventBus.on(event, handler, priority);
    }

    off<T = unknown>(event: string, handler: EventHandler<T>): void {
        this.eventBus.off(event, handler);
    }

    emit(event: string, data?: unknown): void {
        this.eventBus.emit(event, data);
    }

    destroy(): void {
        this.animationEngine.stopAll();
        this.realTime.disconnectAll();
        this.pluginManager.destroyAll();
        this._resizeObserver?.disconnect();
        this.eventBus.clear();
        this.svg?.parentNode?.removeChild(this.svg);
    }

    static create(container: string | HTMLElement, config: ChartConfig): ChartForge {
        return new ChartForge(container, config);
    }

    static registerTheme(name: string, theme: Theme): void {
        ChartForge._globalThemes.set(name, theme);
    }

    static _globalThemes = new Map<string, Theme>();
}
