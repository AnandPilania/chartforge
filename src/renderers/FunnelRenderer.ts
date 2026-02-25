import { BaseRenderer } from './BaseRenderer.js';
import { createSVGElement } from '../utils/dom.js';

export class FunnelRenderer extends BaseRenderer {
    render(): void {
        const d = this.dims();
        const values = this.data.series[0].data as number[];
        const maxVal = Math.max(...values);
        const segH = d.height / values.length;
        const group = this.g('chartforge-funnel');
        this.group.appendChild(group);

        values.forEach((value, i) => {
            const nextVal = (values[i + 1] ?? 0);
            const topW = (value / maxVal) * d.width;
            const botW = (nextVal / maxVal) * d.width;
            const y = this.padding.top + i * segH;
            const topL = this.padding.left + (d.width - topW) / 2;
            const botL = this.padding.left + (d.width - botW) / 2;

            const poly = createSVGElement<SVGPolygonElement>('polygon', {
                points: `${topL},${y} ${topL + topW},${y} ${botL + botW},${y + segH} ${botL},${y + segH}`,
                fill: this.color(i), stroke: this.theme.background, 'stroke-width': '2',
            });
            group.appendChild(poly);

            const label = createSVGElement<SVGTextElement>('text', {
                x: d.totalWidth / 2, y: y + segH / 2,
                fill: '#fff', 'font-size': '14',
                'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-weight': 'bold',
            });
            label.textContent = `${this.data.labels?.[i] ?? `Stage ${i + 1}`}: ${value}`;
            group.appendChild(label);

            poly.addEventListener('mouseenter', () => {
                poly.setAttribute('opacity', '0.8');
                this.chart.emit('hover', { type: 'funnel', index: i, value });
            });
            poly.addEventListener('mouseleave', () => poly.setAttribute('opacity', '1'));
        });
    }
}
