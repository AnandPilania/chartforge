import { BaseRenderer } from './BaseRenderer.js';
import { createSVGElement } from '../utils/dom.js';

export class HeatmapRenderer extends BaseRenderer {
    render(): void {
        const d = this.dims();
        const grid = this.data.series[0].data as number[][];
        const rows = grid.length;
        const cols = grid[0]?.length ?? 0;
        const cw = d.width / cols;
        const ch = d.height / rows;
        const flat = grid.flat();
        const min = Math.min(...flat);
        const max = Math.max(...flat);
        const rng = max - min || 1;
        const group = this.g('chartforge-heatmap');
        this.group.appendChild(group);

        grid.forEach((row, ri) => {
            row.forEach((value, ci) => {
                const intensity = (value - min) / rng;
                const r = Math.round(intensity * 255);
                const b = Math.round((1 - intensity) * 255);
                const fill = `rgb(${r},100,${b})`;

                const rect = createSVGElement<SVGRectElement>('rect', {
                    x: this.padding.left + ci * cw,
                    y: this.padding.top + ri * ch,
                    width: cw, height: ch,
                    fill,
                    stroke: this.theme.background, 'stroke-width': '1',
                });
                group.appendChild(rect);

                rect.addEventListener('mouseenter', () => {
                    rect.setAttribute('stroke-width', '2');
                    this.chart.emit('hover', { type: 'heatmap', row: ri, col: ci, value });
                });
                rect.addEventListener('mouseleave', () => rect.setAttribute('stroke-width', '1'));
            });
        });
    }
}
