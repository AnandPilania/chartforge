import { BaseRenderer } from './BaseRenderer.js';
import { createSVGElement } from '../utils/dom.js';
import type { ScatterPoint } from '../types.js';

export class ScatterRenderer extends BaseRenderer {
    render(): void {
        const d = this.dims();
        const group = this.g('chartforge-scatter');
        this.group.appendChild(group);

        this.data.series.forEach((series, si) => {
            const pts = series.data as ScatterPoint[];
            const maxX = Math.max(...pts.map(p => p.x));
            const maxY = Math.max(...pts.map(p => p.y));

            pts.forEach((pt, i) => {
                const cx = this.padding.left + (pt.x / maxX) * d.width;
                const cy = this.padding.top + d.height - (pt.y / maxY) * d.height;
                const r0 = pt.r ?? 5;

                const circle = createSVGElement<SVGCircleElement>('circle', {
                    cx, cy, r: this.config.animation?.enabled ? 0 : r0,
                    fill: this.color(si), opacity: '0.7',
                });
                group.appendChild(circle);

                if (this.config.animation?.enabled) {
                    this.chart.animationEngine.animate(
                        `scatter-${si}-${i}`, 0, r0,
                        this.config.animation.duration ?? 750,
                        'easeOutElastic',
                        r => circle.setAttribute('r', String(r))
                    );
                }

                circle.addEventListener('mouseenter', () => {
                    circle.setAttribute('r', String(r0 * 1.5));
                    circle.setAttribute('opacity', '1');
                    this.chart.emit('hover', { type: 'scatter', seriesIndex: si, index: i, point: pt });
                });
                circle.addEventListener('mouseleave', () => {
                    circle.setAttribute('r', String(r0));
                    circle.setAttribute('opacity', '0.7');
                });
                circle.addEventListener('click', () =>
                    this.chart.emit('click', { type: 'scatter', seriesIndex: si, index: i, point: pt }));
            });
        });
    }
}
