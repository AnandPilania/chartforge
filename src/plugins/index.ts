export { BasePlugin } from './BasePlugin.js';
export { TooltipPlugin } from './TooltipPlugin.js';
export { LegendPlugin } from './LegendPlugin.js';
export { AxisPlugin } from './AxisPlugin.js';
export { GridPlugin } from './GridPlugin.js';
export { CrosshairPlugin } from './CrosshairPlugin.js';
export { DataLabelsPlugin } from './DataLabelsPlugin.js';
export { ExportPlugin } from './ExportPlugin.js';
export { ZoomPlugin } from './ZoomPlugin.js';
export { AnnotationPlugin } from './AnnotationPlugin.js';

export type { TooltipConfig } from './TooltipPlugin.js';
export type { CrosshairConfig } from './CrosshairPlugin.js';
export type { DataLabelsConfig } from './DataLabelsPlugin.js';
export type { ExportConfig } from './ExportPlugin.js';
export type { ZoomConfig } from './ZoomPlugin.js';
export type { AnnotationConfig, MarkLine, MarkArea, TextAnnotation } from './AnnotationPlugin.js';

import { TooltipPlugin } from './TooltipPlugin.js';
import { LegendPlugin } from './LegendPlugin.js';
import { AxisPlugin } from './AxisPlugin.js';
import { GridPlugin } from './GridPlugin.js';
import { CrosshairPlugin } from './CrosshairPlugin.js';
import { DataLabelsPlugin } from './DataLabelsPlugin.js';
import { ExportPlugin } from './ExportPlugin.js';
import { ZoomPlugin } from './ZoomPlugin.js';
import { AnnotationPlugin } from './AnnotationPlugin.js';

export const plugins = {
    Tooltip: TooltipPlugin,
    Legend: LegendPlugin,
    Axis: AxisPlugin,
    Grid: GridPlugin,
    Crosshair: CrosshairPlugin,
    DataLabels: DataLabelsPlugin,
    Export: ExportPlugin,
    Zoom: ZoomPlugin,
    Annotation: AnnotationPlugin,
} as const;
