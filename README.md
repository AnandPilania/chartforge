# ⬡ ChartForge

> **Production-grade, modular, zero-dependency SVG charting library — built with TypeScript.**
>
> Works in vanilla HTML, React, Vue, Angular, Laravel, Node.js (SSR), and any bundler or CDN setup.

---

## Table of Contents

- [⬡ ChartForge](#-chartforge)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
  - [Framework Guides](#framework-guides)
    - [Vanilla HTML / CDN](#vanilla-html--cdn)
      - [Via `<script type="module">` (modern)](#via-script-typemodule-modern)
      - [Via UMD `<script>` tag (legacy / Laravel CDN)](#via-umd-script-tag-legacy--laravel-cdn)
    - [React](#react)
      - [React Hook](#react-hook)
    - [Vue 3](#vue-3)
      - [Vue Composable](#vue-composable)
    - [Angular](#angular)
    - [Laravel (Blade + Vite)](#laravel-blade--vite)
      - [1. Install via npm (Laravel project root)](#1-install-via-npm-laravel-project-root)
      - [2. Add to `resources/js/app.js`](#2-add-to-resourcesjsappjs)
      - [3. Blade template](#3-blade-template)
      - [4. Or as a self-contained Blade component](#4-or-as-a-self-contained-blade-component)
    - [Node.js / SSR](#nodejs--ssr)
  - [Chart Types](#chart-types)
  - [Configuration Reference](#configuration-reference)
  - [Themes](#themes)
    - [Built-in themes](#built-in-themes)
    - [Custom theme](#custom-theme)
  - [Plugins](#plugins)
    - [Usage pattern](#usage-pattern)
    - [Tooltip Plugin](#tooltip-plugin)
    - [Legend Plugin](#legend-plugin)
    - [Axis Plugin](#axis-plugin)
    - [Grid Plugin](#grid-plugin)
    - [Crosshair Plugin](#crosshair-plugin)
    - [Data Labels Plugin](#data-labels-plugin)
    - [Export Plugin](#export-plugin)
    - [Zoom \& Pan Plugin](#zoom--pan-plugin)
    - [Annotation Plugin](#annotation-plugin)
  - [Adapters (Real-Time Data)](#adapters-real-time-data)
    - [WebSocket Adapter](#websocket-adapter)
    - [Polling Adapter](#polling-adapter)
    - [Custom Adapter](#custom-adapter)
  - [Events \& API](#events--api)
    - [Chart Events](#chart-events)
    - [Instance API](#instance-api)
    - [Static API](#static-api)
  - [Advanced Usage](#advanced-usage)
    - [Middleware](#middleware)
    - [Data Pipeline (Transformers)](#data-pipeline-transformers)
    - [Virtual Rendering](#virtual-rendering)
  - [Extending ChartForge](#extending-chartforge)
    - [Custom Plugin](#custom-plugin)
    - [Custom Renderer](#custom-renderer)
    - [Custom Theme](#custom-theme-1)
    - [Custom Adapter](#custom-adapter-1)
  - [Architecture](#architecture)
  - [Build Reference](#build-reference)
    - [Build outputs](#build-outputs)
  - [License](#license)
  - [CLI Usage (`npx chartforge`)](#cli-usage-npx-chartforge)
    - [Quick examples](#quick-examples)
    - [Input sources](#input-sources)
    - [Supported input formats](#supported-input-formats)
    - [Output formats](#output-formats)
    - [HTTP / API fetching](#http--api-fetching)
    - [Live polling (`serve` command)](#live-polling-serve-command)
    - [File watching (`watch` command)](#file-watching-watch-command)
    - [All options](#all-options)
    - [PNG export prerequisites](#png-export-prerequisites)
    - [HttpAdapter (browser / library)](#httpadapter-browser--library)
    - [CLI architecture](#cli-architecture)

---

## Installation

```bash
npm install chartforge
# or
yarn add chartforge
# or
pnpm add chartforge
```

---

## Quick Start

```ts
import { ChartForge } from 'chartforge';
import { TooltipPlugin, AxisPlugin, GridPlugin } from 'chartforge/plugins';

const chart = new ChartForge('#chart', {
  type:  'column',
  theme: 'dark',
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    series: [{ name: 'Revenue', data: [65, 78, 72, 85, 92, 88] }],
  },
});

chart.use('tooltip', TooltipPlugin)
     .use('axis',    AxisPlugin)
     .use('grid',    GridPlugin);
```

---

## Framework Guides

### Vanilla HTML / CDN

#### Via `<script type="module">` (modern)

```html
<!DOCTYPE html>
<html>
<head>
  <style> #chart { width: 100%; height: 400px; } </style>
</head>
<body>
  <div id="chart"></div>

  <script type="module">
    // From CDN (replace with actual CDN URL after publishing)
    import { ChartForge }    from 'https://unpkg.com/chartforge/dist/chartforge.js';
    import { TooltipPlugin } from 'https://unpkg.com/chartforge/dist/plugins.js';

    const chart = new ChartForge('#chart', {
      type:  'line',
      theme: 'dark',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        series: [
          { name: 'Sales',  data: [100, 120, 115, 134, 168] },
          { name: 'Visits', data: [200, 240, 220, 260, 310] },
        ],
      },
      animation: { enabled: true, duration: 800, easing: 'easeOutElastic' },
    });

    chart.use('tooltip', TooltipPlugin);
  </script>
</body>
</html>
```

#### Via UMD `<script>` tag (legacy / Laravel CDN)

```html
<!-- UMD build — exposes window.ChartForge -->
<script src="https://unpkg.com/chartforge/dist/chartforge.umd.cjs"></script>
<script src="https://unpkg.com/chartforge/dist/plugins.umd.cjs"></script>

<div id="chart" style="height:400px"></div>

<script>
  const { ChartForge }    = window.ChartForge;
  const { TooltipPlugin } = window.ChartForgePlugins;

  const chart = new ChartForge('#chart', {
    type: 'bar',
    data: {
      labels: ['Alpha', 'Beta', 'Gamma'],
      series: [{ data: [42, 75, 38] }],
    },
  });

  chart.use('tooltip', TooltipPlugin);
</script>
```

---

### React

```tsx
// components/Chart.tsx
import { useEffect, useRef } from 'react';
import { ChartForge }    from 'chartforge';
import { TooltipPlugin } from 'chartforge/plugins';
import { LegendPlugin }  from 'chartforge/plugins';
import type { ChartConfig } from 'chartforge';

interface ChartProps {
  config: ChartConfig;
}

export function Chart({ config }: ChartProps) {
  const ref      = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ChartForge | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    chartRef.current = new ChartForge(ref.current, config);
    chartRef.current
      .use('tooltip', TooltipPlugin)
      .use('legend',  LegendPlugin);

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []); // mount/unmount only

  // Update data without re-mounting
  useEffect(() => {
    chartRef.current?.updateData(config.data);
  }, [config.data]);

  return <div ref={ref} style={{ width: '100%', height: 400 }} />;
}
```

```tsx
// App.tsx
import { useState } from 'react';
import { Chart }    from './components/Chart';

const BASE_CONFIG = {
  type:  'line' as const,
  theme: 'dark',
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr'],
    series: [{ name: 'Revenue', data: [100, 120, 115, 134] }],
  },
};

export default function App() {
  const [config, setConfig] = useState(BASE_CONFIG);

  const randomize = () =>
    setConfig(c => ({
      ...c,
      data: {
        ...c.data,
        series: [{ name: 'Revenue', data: Array.from({ length: 4 }, () => Math.random() * 150 + 50) }],
      },
    }));

  return (
    <div>
      <button onClick={randomize}>Refresh</button>
      <Chart config={config} />
    </div>
  );
}
```

#### React Hook

```ts
// hooks/useChart.ts
import { useEffect, useRef } from 'react';
import { ChartForge } from 'chartforge';
import type { ChartConfig, PluginConstructor } from 'chartforge';

export function useChart(
  config: ChartConfig,
  plugins: Array<[string, PluginConstructor, unknown?]> = []
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<ChartForge | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = new ChartForge(containerRef.current, config);
    plugins.forEach(([name, Plugin, cfg]) => chart.use(name, Plugin, cfg));
    chartRef.current = chart;
    return () => { chart.destroy(); chartRef.current = null; };
  }, []);

  useEffect(() => { chartRef.current?.updateData(config.data); }, [config.data]);
  useEffect(() => { chartRef.current?.setTheme(config.theme ?? 'light'); }, [config.theme]);

  return { containerRef, chart: chartRef };
}

// Usage:
// const { containerRef } = useChart(config, [['tooltip', TooltipPlugin]]);
// return <div ref={containerRef} style={{ height: 400 }} />;
```

---

### Vue 3

```vue
<!-- components/ChartForge.vue -->
<template>
  <div ref="containerRef" :style="{ width: '100%', height: height + 'px' }" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { ChartForge }    from 'chartforge';
import { TooltipPlugin } from 'chartforge/plugins';
import type { ChartConfig } from 'chartforge';

const props = withDefaults(defineProps<{
  config: ChartConfig;
  height?: number;
}>(), { height: 400 });

const containerRef = ref<HTMLDivElement | null>(null);
let chart: ChartForge | null = null;

onMounted(() => {
  if (!containerRef.value) return;
  chart = new ChartForge(containerRef.value, props.config);
  chart.use('tooltip', TooltipPlugin);
});

onBeforeUnmount(() => {
  chart?.destroy();
  chart = null;
});

// React to data changes
watch(() => props.config.data, (newData) => {
  chart?.updateData(newData);
}, { deep: true });

// React to theme changes
watch(() => props.config.theme, (theme) => {
  chart?.setTheme(theme ?? 'dark');
});
</script>
```

```vue
<!-- App.vue -->
<template>
  <ChartForgeVue :config="config" :height="350" />
  <button @click="refresh">Refresh</button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ChartForgeVue from './components/ChartForge.vue';

const config = ref({
  type:  'pie' as const,
  theme: 'dark',
  data: {
    labels: ['Desktop', 'Mobile', 'Tablet'],
    series: [{ data: [450, 320, 180] }],
  },
});

function refresh() {
  config.value = {
    ...config.value,
    data: {
      ...config.value.data,
      series: [{ data: [Math.random() * 500, Math.random() * 400, Math.random() * 200] }],
    },
  };
}
</script>
```

#### Vue Composable

```ts
// composables/useChart.ts
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { ChartForge } from 'chartforge';
import type { ChartConfig } from 'chartforge';

export function useChart(config: ChartConfig) {
  const containerRef = ref<HTMLDivElement | null>(null);
  let instance: ChartForge | null = null;

  onMounted(() => {
    if (!containerRef.value) return;
    instance = new ChartForge(containerRef.value, config);
  });

  onBeforeUnmount(() => { instance?.destroy(); });

  return {
    containerRef,
    updateData: (data: Partial<ChartConfig['data']>) => instance?.updateData(data),
    setTheme:   (name: string) => instance?.setTheme(name),
    instance:   () => instance,
  };
}
```

---

### Angular

```ts
// chart.component.ts
import { Component, Input, ElementRef, OnInit, OnDestroy, OnChanges } from '@angular/core';
import { ChartForge } from 'chartforge';
import { TooltipPlugin, LegendPlugin } from 'chartforge/plugins';
import type { ChartConfig } from 'chartforge';

@Component({
  selector: 'app-chart',
  template: `<div [style.height.px]="height" style="width:100%"></div>`,
})
export class ChartComponent implements OnInit, OnDestroy, OnChanges {
  @Input() config!: ChartConfig;
  @Input() height  = 400;

  private chart: ChartForge | null = null;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    const container = this.el.nativeElement.querySelector('div')!;
    this.chart = new ChartForge(container, this.config);
    this.chart.use('tooltip', TooltipPlugin).use('legend', LegendPlugin);
  }

  ngOnChanges(): void {
    this.chart?.updateData(this.config.data);
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }
}
```

---

### Laravel (Blade + Vite)

#### 1. Install via npm (Laravel project root)

```bash
npm install chartforge
```

#### 2. Add to `resources/js/app.js`

```js
// resources/js/app.js
import { ChartForge }    from 'chartforge';
import { TooltipPlugin } from 'chartforge/plugins';

window.ChartForge    = ChartForge;
window.TooltipPlugin = TooltipPlugin;
```

#### 3. Blade template

```blade
{{-- resources/views/dashboard.blade.php --}}
@extends('layouts.app')

@section('content')
  <div id="revenue-chart" style="height: 400px; background:#1a1a2e; border-radius:12px;"></div>

  @push('scripts')
  <script>
    const chart = new window.ChartForge('#revenue-chart', {
      type:  'column',
      theme: 'dark',
      data: {
        labels: {!! json_encode($labels) !!},
        series: [{
          name: 'Revenue',
          data: {!! json_encode($revenues) !!},
        }],
      },
    });

    chart.use('tooltip', window.TooltipPlugin);

    // Listen to click events
    chart.on('click', ({ index, value }) => {
      console.log('Clicked bar:', index, 'Value:', value);
    });
  </script>
  @endpush
@endsection
```

#### 4. Or as a self-contained Blade component

```blade
{{-- resources/views/components/chart.blade.php --}}
<div
  wire:ignore
  id="{{ $id }}"
  style="height: {{ $height ?? 400 }}px"
  x-data
  x-init="
    const chart = new window.ChartForge('#{{ $id }}', {
      type: '{{ $type }}',
      theme: '{{ $theme ?? 'dark' }}',
      data: {{ Js::from($data) }},
    });
    chart.use('tooltip', window.TooltipPlugin);
  "
></div>
```

---

### Node.js / SSR

ChartForge requires a DOM. In Node.js environments, use a virtual DOM library:

```bash
npm install jsdom
```

```js
// generate-chart.mjs
import { JSDOM } from 'jsdom';

// Shim browser globals
const dom        = new JSDOM('<!DOCTYPE html><body></body>');
global.window    = dom.window;
global.document  = dom.window.document;
global.SVGElement = dom.window.SVGElement;
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame  = clearTimeout;

const { ChartForge } = await import('chartforge');

const container       = document.createElement('div');
document.body.appendChild(container);

const chart = new ChartForge(container, {
  type:  'line',
  theme: 'dark',
  data: {
    labels: ['Jan', 'Feb', 'Mar'],
    series: [{ name: 'Sales', data: [100, 150, 130] }],
  },
  animation: { enabled: false },  // disable animation for SSR
});

await chart.render();

// Export SVG string
const svgStr = container.querySelector('svg').outerHTML;

// Save to file
import { writeFileSync } from 'fs';
writeFileSync('chart.svg', svgStr);

console.log('Chart saved to chart.svg');
```

---

## Chart Types

| Type            | Description                 | Required `data` shape                          |
| --------------- | --------------------------- | ---------------------------------------------- |
| `column`        | Vertical bars               | `series[0].data: number[]`                     |
| `bar` / `row`   | Horizontal bars             | `series[0].data: number[]`                     |
| `line`          | Line chart, multiple series | `series[].data: number[]`                      |
| `pie`           | Pie chart                   | `series[0].data: number[]`                     |
| `donut`         | Donut chart                 | `series[0].data: number[]`                     |
| `scatter`       | Scatter/bubble plot         | `series[].data: { x, y, r? }[]`                |
| `stackedColumn` | Stacked vertical bars       | `series[].data: number[]`                      |
| `stackedBar`    | Stacked horizontal bars     | `series[].data: number[]`                      |
| `funnel`        | Funnel/conversion chart     | `series[0].data: number[]`                     |
| `heatmap`       | 2D heatmap grid             | `series[0].data: number[][]`                   |
| `candlestick`   | OHLC/candlestick chart      | `series[0].data: { open, high, low, close }[]` |

---

## Configuration Reference

```ts
const chart = new ChartForge('#container', {
  // Required
  type: 'column',          // Chart type
  data: { labels: [...], series: [...] },

  // Layout
  width:      'auto',      // number | 'auto' (follows container)
  height:     400,         // number (pixels)
  responsive: true,        // Auto-resize on container resize
  padding: {
    top: 40, right: 40, bottom: 60, left: 60,
  },

  // Appearance
  theme: 'dark',           // 'light' | 'dark' | 'neon' | your custom theme name

  // Animation
  animation: {
    enabled:  true,
    duration: 750,         // ms
    easing:   'easeOutQuad',
    // All easings: 'linear', 'easeInQuad', 'easeOutQuad', 'easeInOutQuad',
    // 'easeInCubic', 'easeOutCubic', 'easeInOutCubic',
    // 'easeInElastic', 'easeOutElastic', 'easeInBounce', 'easeOutBounce'
  },

  // Virtual rendering (for very large datasets)
  virtual: {
    enabled:   false,
    threshold: 10_000,     // auto-enable when data points exceed this
  },

  // Middleware (runs before every render)
  middleware: [],
});
```

---

## Themes

### Built-in themes

```ts
import { ChartForge } from 'chartforge';

// 'light' | 'dark' | 'neon'
const chart = new ChartForge('#c', { type: 'line', theme: 'neon', data: { ... } });

// Switch at runtime
chart.setTheme('light');
```

### Custom theme

```ts
import { ChartForge }  from 'chartforge';
import type { Theme }  from 'chartforge';

const brandTheme: Theme = {
  background:    '#0f1923',
  foreground:    '#ffffff',
  grid:          '#1e2d3d',
  text:          '#c8d8e8',
  textSecondary: '#5a7a9a',
  colors: ['#00d4ff', '#ff6b6b', '#51cf66', '#ffd43b', '#cc5de8'],
  tooltip: {
    background: '#0f1923',
    text:       '#c8d8e8',
    border:     '#1e2d3d',
    shadow:     'rgba(0, 212, 255, 0.15)',
  },
  legend: {
    text:  '#c8d8e8',
    hover: '#ffffff',
  },
  axis: {
    line: '#1e2d3d',
    text: '#5a7a9a',
    grid: '#121e29',
  },
};

// Register globally (available to all new ChartForge instances)
ChartForge.registerTheme('brand', brandTheme);

const chart = new ChartForge('#c', { type: 'bar', theme: 'brand', data: { ... } });

// Or register per-instance
chart.themeManager.register('brand', brandTheme);
chart.setTheme('brand');
```

---

## Plugins

### Usage pattern

```ts
// Method 1: Fluent chain
chart
  .use('tooltip',   TooltipPlugin,   { shadow: true })
  .use('legend',    LegendPlugin,    { position: 'bottom' })
  .use('axis',      AxisPlugin,      { y: { label: 'Revenue ($)' } })
  .use('grid',      GridPlugin)
  .use('crosshair', CrosshairPlugin);

// Method 2: pluginManager
chart.pluginManager.register('tooltip', TooltipPlugin, { fontSize: 14 });

// Get plugin instance later
const tooltip = chart.getPlugin<TooltipPlugin>('tooltip');
```

---

### Tooltip Plugin

```ts
import { TooltipPlugin } from 'chartforge/plugins';

chart.use('tooltip', TooltipPlugin, {
  enabled:         true,
  backgroundColor: '#1a1a2e',
  textColor:       '#e0e0ff',
  borderColor:     '#3a3a6e',
  borderRadius:    8,
  padding:         12,
  fontSize:        13,
  shadow:          true,
  followCursor:    true,
  offset:          { x: 14, y: 14 },

  // Custom formatter (receives the raw hover event data)
  formatter: (data) => {
    if (data.type === 'column') {
      return `<strong>${data.value}</strong> units sold`;
    }
    return String(data.value);
  },
});
```

---

### Legend Plugin

```ts
import { LegendPlugin } from 'chartforge/plugins';

chart.use('legend', LegendPlugin, {
  enabled:     true,
  position:    'bottom',   // 'top' | 'bottom' | 'left' | 'right'
  align:       'center',   // 'start' | 'center' | 'end'
  layout:      'horizontal', // 'horizontal' | 'vertical'
  fontSize:    12,
  itemSpacing: 12,
  markerSize:  12,
  markerType:  'square',   // 'square' | 'circle' | 'line'
  clickable:   true,       // Toggle series visibility on click
});
```

---

### Axis Plugin

```ts
import { AxisPlugin } from 'chartforge/plugins';

chart.use('axis', AxisPlugin, {
  x: {
    enabled:    true,
    label:      'Month',
    fontSize:   11,
    tickLength: 5,
  },
  y: {
    enabled:    true,
    label:      'Revenue ($)',
    fontSize:   11,
    tickLength: 5,
    ticks:      5,       // Number of Y-axis tick marks
  },
});
```

---

### Grid Plugin

```ts
import { GridPlugin } from 'chartforge/plugins';

chart.use('grid', GridPlugin, {
  enabled: true,
  x: { enabled: true, color: '#2a2a3a', dashArray: '3,3', strokeWidth: 1 },
  y: { enabled: true, color: '#2a2a3a', dashArray: '3,3', strokeWidth: 1, ticks: 5 },
});
```

---

### Crosshair Plugin

Draws intersecting reference lines following the cursor inside the chart area.

```ts
import { CrosshairPlugin } from 'chartforge/plugins';

chart.use('crosshair', CrosshairPlugin, {
  enabled: true,
  x: { enabled: true, color: '#888', dashArray: '4,4', width: 1 },
  y: { enabled: true, color: '#888', dashArray: '4,4', width: 1 },
});
```

---

### Data Labels Plugin

Show values directly on top of chart elements.

```ts
import { DataLabelsPlugin } from 'chartforge/plugins';

chart.use('dataLabels', DataLabelsPlugin, {
  enabled:   true,
  fontSize:  11,
  color:     '#ffffff',
  anchor:    'top',      // 'top' | 'center' | 'bottom'
  offset:    5,          // px offset from element
  rotation:  -45,        // label rotation in degrees
  formatter: (value) => `$${value.toLocaleString()}`,
});
```

---

### Export Plugin

Adds SVG / PNG / CSV download buttons above the chart.

```ts
import { ExportPlugin } from 'chartforge/plugins';

chart.use('export', ExportPlugin, {
  filename:  'revenue-q1',  // download filename (no extension)
  svgButton: true,
  pngButton: true,
  csvButton: true,
});

// Or trigger exports programmatically
const exporter = chart.getPlugin<ExportPlugin>('export');
exporter?.exportSVG();
await exporter?.exportPNG(3);  // 3x scale for retina
exporter?.exportCSV();
```

---

### Zoom & Pan Plugin

Mouse wheel to zoom, drag to pan, double-click to reset.

```ts
import { ZoomPlugin } from 'chartforge/plugins';

chart.use('zoom', ZoomPlugin, {
  enabled:         true,
  type:            'xy',     // 'x' | 'y' | 'xy'
  minZoom:         0.5,
  maxZoom:         10,
  resetOnDblClick: true,
});

// Reset programmatically
const zoom = chart.getPlugin<ZoomPlugin>('zoom');
zoom?.reset();
```

---

### Annotation Plugin

Add horizontal/vertical reference lines, shaded regions, and text labels to any chart.

```ts
import { AnnotationPlugin } from 'chartforge/plugins';

chart.use('annotations', AnnotationPlugin, {
  markLines: [
    { type: 'horizontal', value: 100, label: 'Target',   color: '#10b981', dashArray: '5,3' },
    { type: 'horizontal', value: 50,  label: 'Baseline', color: '#ef4444' },
    { type: 'vertical',   value: 2,   label: 'Campaign', color: '#f59e0b' },
  ],
  markAreas: [
    { xStart: 1, xEnd: 3, color: '#3b82f6', opacity: 0.1, label: 'Peak period' },
    { yStart: 80, yEnd: 120, color: '#10b981', opacity: 0.08 },
  ],
  texts: [
    { x: 2, y: 150, text: '🚀 New product launch', color: '#fff', background: '#3b82f6' },
  ],
});

// Add annotations dynamically
const ann = chart.getPlugin<AnnotationPlugin>('annotations');
ann?.addMarkLine({ type: 'horizontal', value: 200, label: 'Record', color: '#ff6b6b' });
ann?.addText({ x: 4, y: 180, text: 'All-time high', color: '#ff6b6b' });
```

---

## Adapters (Real-Time Data)

ChartForge ships with two built-in real-time adapters.

### WebSocket Adapter

```ts
// Connect to a WebSocket feed
chart.realTime.connect('websocket', {
  url: 'wss://api.example.com/live-data',
});

// Your server should push: { series: [{ data: [...] }], labels: [...] }

// Disconnect when done
chart.realTime.disconnect('websocket');
```

### Polling Adapter

```ts
chart.realTime.connect('polling', {
  url:      '/api/live-metrics',
  interval: 3000,   // ms — defaults to 5000
});
```

### Custom Adapter

```ts
import type { IAdapter, EventHandler, ChartData } from 'chartforge';

class SSEAdapter implements IAdapter {
  private _es: EventSource | null = null;
  private _listeners = new Map<string, EventHandler[]>();

  constructor(private _url: string) {}

  on(event: string, handler: EventHandler): void {
    if (!this._listeners.has(event)) this._listeners.set(event, []);
    this._listeners.get(event)!.push(handler);
  }

  connect(): void {
    this._es = new EventSource(this._url);
    this._es.addEventListener('message', (e) => {
      const data = JSON.parse(e.data) as ChartData;
      this._listeners.get('data')?.forEach(h => h(data));
    });
  }

  disconnect(): void {
    this._es?.close();
    this._es = null;
  }
}

// Register globally
chart.realTime.registerAdapter('sse', SSEAdapter);
chart.realTime.connect('sse', 'https://api.example.com/stream');
```

---

## Events & API

### Chart Events

```ts
// Hover over a data element
chart.on('hover', ({ type, index, value, seriesIndex, point, candle, row, col }) => {
  console.log('Hovered:', type, value);
});

// Click on a data element
chart.on('click', ({ type, index, value }) => {
  console.log('Clicked:', type, value);
});

// Before/after render
chart.on('beforeRender', (ctx) => { /* ctx: { data, theme, svg, mainGroup } */ });
chart.on('afterRender',  (ctx) => { /* DOM is updated */ });

// Unsubscribe
const unsub = chart.on('click', handler);
unsub(); // removes the listener
```

### Instance API

```ts
// Update data (re-renders)
chart.updateData({
  labels: ['A', 'B', 'C'],
  series: [{ name: 'Sales', data: [10, 20, 15] }],
});

// Partial config update
chart.updateConfig({ type: 'bar', theme: 'neon' });

// Switch theme
chart.setTheme('dark');

// Get plugin instance
const tooltip = chart.getPlugin<TooltipPlugin>('tooltip');

// Trigger manual resize
chart.resize();

// Viewport (virtual rendering)
chart.setViewport(0, 100);  // show data points [0, 100)

// Destroy (cleans up DOM, events, RAF, WebSocket)
chart.destroy();
```

### Static API

```ts
// Factory method (same as new ChartForge)
const chart = ChartForge.create('#container', { type: 'pie', data: { ... } });

// Register a theme available to all instances
ChartForge.registerTheme('brand', myTheme);
```

---

## Advanced Usage

### Middleware

Middleware runs before every render. Use it for logging, auth, data transformation, etc.

```ts
const chart = new ChartForge('#c', {
  type: 'line',
  data: { ... },
  middleware: [
    async (ctx, next) => {
      console.time('render');
      await next();                   // call next to continue the pipeline
      console.timeEnd('render');
    },
    async (ctx, next) => {
      // Transform data before rendering
      ctx.data.series = ctx.data.series.map(s => ({
        ...s,
        data: (s.data as number[]).map(v => v * 1.1),  // +10% adjustment
      }));
      await next();
    },
  ],
});

// Add middleware after construction
chart.middleware.use(async (ctx, next) => {
  ctx.theme = { ...ctx.theme, background: '#ff0000' };  // override theme for this render
  await next();
});
```

### Data Pipeline (Transformers)

Named transformers that process data before it reaches the renderer.

```ts
// Add a normalizer
chart.dataPipeline.addTransformer('normalize', (data) => ({
  ...data,
  series: data.series.map(s => {
    const max = Math.max(...s.data as number[]);
    return { ...s, data: (s.data as number[]).map(v => v / max) };
  }),
}));

// Add a sorter
chart.dataPipeline.addTransformer('sort', (data) => ({
  ...data,
  series: data.series.map(s => ({
    ...s,
    data: [...s.data as number[]].sort((a, b) => b - a),
  })),
}));

// Remove a transformer
chart.dataPipeline.removeTransformer('sort');
```

### Virtual Rendering

For datasets with tens of thousands of points, enable virtual rendering to only draw visible points:

```ts
const chart = new ChartForge('#c', {
  type:  'line',
  data:  { series: [{ data: Array.from({ length: 100_000 }, () => Math.random()) }] },
  virtual: {
    enabled:   true,
    threshold: 5_000,  // Auto-enable once series total exceeds this
  },
});

// Pan the viewport
chart.setViewport(0, 500);    // first 500 points
chart.setViewport(500, 1000); // next 500 points
```

---

## Extending ChartForge

### Custom Plugin

```ts
import { BasePlugin } from 'chartforge/plugins';
import type { Theme } from 'chartforge';

interface WatermarkConfig {
  text:     string;
  opacity?: number;
  color?:   string;
  fontSize?: number;
}

interface ChartLike {
  theme: Theme;
  svg:   SVGSVGElement;
  on:    (event: string, h: () => void) => void;
}

class WatermarkPlugin extends BasePlugin {
  private readonly _cfg: Required<WatermarkConfig>;

  constructor(chart: unknown, cfg: WatermarkConfig) {
    super(chart, cfg);
    this._cfg = {
      opacity:  0.1,
      color:    (chart as ChartLike).theme.text,
      fontSize: 48,
      ...cfg,
    };
  }

  init(): void {
    const c   = this._chart as ChartLike;
    const svg = c.svg;

    const draw = () => {
      const existing = svg.querySelector('.cf-watermark');
      if (existing) svg.removeChild(existing);

      const vb  = svg.getAttribute('viewBox')!.split(' ').map(Number);
      const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      Object.assign(txt, {});
      txt.setAttribute('class',              'cf-watermark');
      txt.setAttribute('x',                  String(vb[2] / 2));
      txt.setAttribute('y',                  String(vb[3] / 2));
      txt.setAttribute('text-anchor',        'middle');
      txt.setAttribute('dominant-baseline',  'middle');
      txt.setAttribute('fill',               this._cfg.color);
      txt.setAttribute('font-size',          String(this._cfg.fontSize));
      txt.setAttribute('opacity',            String(this._cfg.opacity));
      txt.setAttribute('pointer-events',     'none');
      txt.setAttribute('font-weight',        'bold');
      txt.setAttribute('transform',          `rotate(-30,${vb[2]/2},${vb[3]/2})`);
      txt.textContent = this._cfg.text;
      svg.appendChild(txt);
    };

    draw();
    c.on('afterRender', draw);
  }
}

// Use it
chart.use('watermark', WatermarkPlugin, { text: 'CONFIDENTIAL' });
```

---

### Custom Renderer

```ts
import { BaseRenderer, RENDERERS } from 'chartforge';
import type { ChartLike } from 'chartforge';

class RadarRenderer extends BaseRenderer {
  render(): void {
    const d       = this.dims();
    const cx      = d.totalWidth  / 2;
    const cy      = d.totalHeight / 2;
    const r       = Math.min(d.width, d.height) / 2 - 20;
    const series  = this.data.series[0].data as number[];
    const n       = series.length;
    const maxVal  = Math.max(...series);
    const step    = (Math.PI * 2) / n;

    const group   = this.g('chartforge-radar');
    this.group.appendChild(group);

    // Draw spokes
    for (let i = 0; i < n; i++) {
      const angle = step * i - Math.PI / 2;
      const x2    = cx + r * Math.cos(angle);
      const y2    = cy + r * Math.sin(angle);
      const line  = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(cx)); line.setAttribute('y1', String(cy));
      line.setAttribute('x2', String(x2)); line.setAttribute('y2', String(y2));
      line.setAttribute('stroke', this.theme.grid); line.setAttribute('stroke-width', '1');
      group.appendChild(line);
    }

    // Draw data polygon
    const pts = series.map((v, i) => {
      const angle = step * i - Math.PI / 2;
      const rv    = (v / maxVal) * r;
      return `${cx + rv * Math.cos(angle)},${cy + rv * Math.sin(angle)}`;
    }).join(' ');

    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    poly.setAttribute('points', pts);
    poly.setAttribute('fill',   this.color(0) + '55');
    poly.setAttribute('stroke', this.color(0));
    poly.setAttribute('stroke-width', '2');
    group.appendChild(poly);
  }
}

// Register the renderer globally
RENDERERS['radar' as never] = RadarRenderer as never;

// Now use it
const chart = new ChartForge('#c', {
  type: 'radar' as never,
  data: { series: [{ data: [80, 60, 90, 75, 85, 70] }] },
});
```

---

### Custom Theme

See the [Themes](#themes) section above for a full custom theme example.

### Custom Adapter

See the [Adapters](#adapters-real-time-data) section above for a Server-Sent Events adapter example.

---

## Architecture

```
src/
├── ChartForge.ts          # Main orchestrator class
├── types.ts               # All shared interfaces — single source of truth
├── index.ts               # Public barrel — tree-shakeable
│
├── core/                  # Sub-systems (individually importable)
│   ├── EventBus.ts        # Priority-based pub/sub
│   ├── MiddlewarePipeline.ts  # Async middleware chain
│   ├── DataPipeline.ts    # Named data transformers
│   ├── AnimationEngine.ts # RAF-based tweening with 11 easings
│   ├── ThemeManager.ts    # Theme registry + apply
│   ├── PluginManager.ts   # Plugin lifecycle management
│   └── VirtualRenderer.ts # Viewport slicing for large datasets
│
├── renderers/             # One file per chart type (tree-shakeable)
│   ├── BaseRenderer.ts    # Abstract base with shared geometry
│   ├── ColumnRenderer.ts
│   ├── BarRenderer.ts
│   ├── LineRenderer.ts
│   ├── PieRenderer.ts
│   ├── DonutRenderer.ts
│   ├── ScatterRenderer.ts
│   ├── StackedColumnRenderer.ts
│   ├── StackedBarRenderer.ts
│   ├── FunnelRenderer.ts
│   ├── HeatmapRenderer.ts
│   ├── CandlestickRenderer.ts
│   └── index.ts           # RENDERERS registry
│
├── plugins/               # One file per plugin (tree-shakeable)
│   ├── BasePlugin.ts
│   ├── TooltipPlugin.ts   # Smart tooltip with per-type formatting
│   ├── LegendPlugin.ts    # Clickable, snapshotted series toggle
│   ├── AxisPlugin.ts      # X/Y axes with labels
│   ├── GridPlugin.ts      # Background grid lines
│   ├── CrosshairPlugin.ts # Cursor crosshair lines
│   ├── DataLabelsPlugin.ts # Values on elements
│   ├── ExportPlugin.ts    # SVG/PNG/CSV export
│   ├── ZoomPlugin.ts      # Wheel zoom + drag pan
│   ├── AnnotationPlugin.ts # Mark lines, areas, text
│   └── index.ts
│
├── themes/
│   ├── builtins.ts        # light | dark | neon
│   └── index.ts
│
├── adapters/              # Real-time data feeds
│   ├── WebSocketAdapter.ts
│   ├── PollingAdapter.ts
│   ├── RealTimeModule.ts
│   └── index.ts
│
└── utils/
    ├── dom.ts             # SVG element creation, polar coords
    ├── misc.ts            # uid, merge, clamp, debounce, throttle
    └── index.ts
```

---

## Build Reference

```bash
# Install dependencies
npm install

# Start dev server with HMR (demo app at localhost:5173)
npm run dev

# Build library — ES + UMD, minified + obfuscated for production
NODE_ENV=production npm run build:lib

# Type-check
npm run typecheck

# Lint
npm run lint

# Preview production build
npm run preview
```

### Build outputs

| File                      | Format  | Minified  | Use case                                |
| ------------------------- | ------- | --------- | --------------------------------------- |
| `dist/chartforge.js`      | ESM     | prod only | Modern bundlers (Webpack, Vite, Rollup) |
| `dist/chartforge.umd.cjs` | UMD/CJS | prod only | `<script>` tag, `require()`, Laravel    |
| `dist/plugins.js`         | ESM     | prod only | Tree-shakeable plugin imports           |
| `dist/themes.js`          | ESM     | prod only | Tree-shakeable theme imports            |
| `dist/types/`             | `.d.ts` | —         | TypeScript consumers                    |

---

## License

MIT © Anand Pilania

---

## CLI Usage (`npx chartforge`)

ChartForge ships a fully-featured CLI. No installation required — just `npx`.

```bash
npx chartforge [command] [options]
```

### Quick examples

```bash
# From a JSON file → HTML page (opens in browser)
npx chartforge data.json --open

# CSV file → line chart as SVG
npx chartforge sales.csv -t line --out svg -o chart.svg

# Inline data → terminal bar chart
npx chartforge --data '[10,25,18,42,35]' -t bar --out terminal

# Pipe from stdin
echo '[100,120,115,134]' | npx chartforge - --out terminal -t line

# From HTTP URL → HTML export
npx chartforge --url https://api.example.com/data -o report.html --open

# Live terminal dashboard — polls every 3s
npx chartforge serve --url https://api.example.com/metrics --interval 3 --out terminal

# Watch a file, re-render on change
npx chartforge watch --input data.json --out html --open
```

### Input sources

| Source      | Flag                     | Example                              |
| ----------- | ------------------------ | ------------------------------------ |
| File        | `--input` / positional   | `chartforge data.json`               |
| stdin       | `-` or no flag with pipe | `cat data.csv \| chartforge -`       |
| Inline JSON | `--data`                 | `--data '[1,2,3]'`                   |
| HTTP URL    | `--url`                  | `--url https://api.example.com/data` |

### Supported input formats

ChartForge auto-detects format from file extension. Override with `--format`.

| Format | Auto-detect     | Notes                                                                         |
| ------ | --------------- | ----------------------------------------------------------------------------- |
| JSON   | `.json`         | ChartForge shape, arrays, key-value objects, arrays of objects                |
| CSV    | `.csv`          | First non-numeric column = labels. Multiple numeric columns = multiple series |
| TSV    | `.tsv`          | Same as CSV but tab-delimited                                                 |
| YAML   | `.yaml`, `.yml` | Simple key:value only; for complex YAML convert to JSON first                 |

**Auto-detected JSON shapes:**

```json
// ChartForge native shape
{ "series": [{ "name": "Revenue", "data": [100, 120, 130] }], "labels": ["Jan","Feb","Mar"] }

// Plain array → single series
[100, 120, 130, 145]

// Key-value object → labels + single series
{ "Jan": 100, "Feb": 120, "Mar": 130 }

// Array of objects → auto-detect label/value columns
[{ "month": "Jan", "value": 100 }, { "month": "Feb", "value": 120 }]
```

### Output formats

| Format   | Flag             | Notes                                                         |
| -------- | ---------------- | ------------------------------------------------------------- |
| HTML     | `--out html`     | Standalone HTML page with stats panel (default)               |
| SVG      | `--out svg`      | Raw SVG file, self-contained                                  |
| PNG      | `--out png`      | Requires `npm install sharp` or `npm install @resvg/resvg-js` |
| Terminal | `--out terminal` | Unicode bar/line/pie charts + sparklines, no file created     |

```bash
# HTML (default) — full standalone page
npx chartforge data.json

# SVG — vector, embeddable anywhere
npx chartforge data.json --out svg -o chart.svg

# PNG — raster image (install sharp first)
npm install sharp
npx chartforge data.json --out png -o chart.png

# Terminal — stays in your shell
npx chartforge data.json --out terminal
```

### HTTP / API fetching

```bash
# Simple GET
npx chartforge --url https://api.example.com/data

# Extract nested path with --jq
npx chartforge --url https://api.example.com/report --jq data.series

# POST with JSON body + auth header
npx chartforge \
  --url https://api.example.com/analytics \
  --method POST \
  --headers '{"Authorization":"Bearer TOKEN","Content-Type":"application/json"}' \
  --body '{"range":"7d","metric":"revenue"}'

# CSV from HTTP
npx chartforge --url https://data.example.com/export.csv --format csv -t line
```

### Live polling (`serve` command)

```bash
# Terminal live dashboard — auto-refreshes
npx chartforge serve \
  --url https://api.example.com/live \
  --interval 5 \
  --out terminal \
  -t line

# Save updated HTML every poll
npx chartforge serve \
  --url https://api.example.com/metrics \
  --interval 10 \
  --out html \
  -o dashboard.html \
  --open
```

### File watching (`watch` command)

```bash
# Re-render when the file changes
npx chartforge watch --input data.json --out html --open

# Watch + terminal output
npx chartforge watch --input data.json --out terminal -t line
```

### All options

```
  -i, --input <path>       Input file path (JSON/CSV/TSV/YAML) or - for stdin
  -u, --url <url>          Fetch data from HTTP/HTTPS URL
  -d, --data <json>        Inline JSON data string
  -f, --format <fmt>       Input format: json | csv | tsv | yaml
      --jq <path>          Dot-path to extract from JSON (e.g. data.items)
  -X, --method <verb>      HTTP method: GET | POST [GET]
  -H, --headers <json>     JSON string of HTTP headers
  -b, --body <str>         HTTP request body (for POST)
      --interval <sec>     Poll interval in seconds for serve [5]

  -t, --type <type>        Chart type [column]
      --title <text>       Chart title
  -w, --width <px>         Width in pixels [800]
  -h, --height <px>        Height in pixels [450]
      --theme <name>       Theme: light | dark | neon [dark]
  -l, --labels <a,b,c>     Comma-separated label override

  -o, --output <path>      Output file path (or - for stdout)
      --out <format>       Output format: html | svg | png | terminal [html]
      --open               Open output in browser after rendering
      --watch              Watch input file and re-render on change

  -v, --verbose            Verbose output
      --no-color           Disable ANSI colors
      --help               Show help
  -V, --version            Print version
```

### PNG export prerequisites

PNG rendering is optional and requires one of:

```bash
# Option 1: sharp (best quality, most common)
npm install sharp

# Option 2: @resvg/resvg-js (pure WASM, no native compilation)
npm install @resvg/resvg-js
```

### HttpAdapter (browser / library)

For polling HTTP endpoints inside a chart (not CLI), use the `HttpAdapter`:

```ts
import { ChartForge }  from 'chartforge';
import { HttpAdapter } from 'chartforge';

const chart = new ChartForge('#c', { type: 'line', data: { series: [] } });

chart.realTime.registerAdapter('http', HttpAdapter);
chart.realTime.connect('http', {
  url:      'https://api.example.com/metrics',
  interval: 5,               // seconds
  jq:       'data.series',   // optional dot-path extractor
  transform: (raw) => ({     // optional custom transformer
    labels: raw.timestamps,
    series: [{ name: 'CPU', data: raw.cpu }],
  }),
});

// Stop polling
chart.realTime.disconnect('http');
```

### CLI architecture

```
cli/
├── src/
│   ├── index.ts              # Entry point / npx binary
│   ├── args.ts               # Zero-dep argument parser
│   ├── types.ts              # CLI-specific types
│   ├── logger.ts             # ANSI-colored logger
│   │
│   ├── commands/
│   │   ├── render.ts         # render command (default)
│   │   ├── watch.ts          # watch command
│   │   └── serve.ts          # serve command (live poll)
│   │
│   ├── inputs/
│   │   ├── parser.ts         # JSON/CSV/TSV/YAML parsers
│   │   ├── file.ts           # File + stdin reader
│   │   └── http.ts           # HTTP fetcher + poll loop
│   │
│   ├── renderer/
│   │   ├── svg.ts            # Node.js SVG renderer (JSDOM)
│   │   ├── png.ts            # PNG via sharp/@resvg (optional)
│   │   └── terminal.ts       # Unicode bar/braille/sparkline renderer
│   │
│   └── outputs/
│       ├── html.ts           # Standalone HTML page generator
│       └── writer.ts         # File writer + browser opener
│
└── dist/
    └── chartforge.cjs        # Bundled CLI binary (built by Vite)
```

Build the CLI:

```bash
npm run build:cli     # → cli/dist/chartforge.cjs
npm run build:all     # lib + cli together
```

Test without building:

```bash
npm run cli:dev -- data.json --out terminal
# or
npx tsx cli/src/index.ts data.json --out terminal
```
