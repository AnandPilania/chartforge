import { BaseRenderer } from './BaseRenderer.js';
import { createSVGElement } from '../utils/dom.js';

export class ColumnRenderer extends BaseRenderer {
    render(): void {
        const d = this.dims();
        const values = this.data.series[0].data as number[];
        const maxVal = Math.max(...values);
        const cw = (d.width / values.length) * 0.8;
        const gap = (d.width / values.length) * 0.2;
        const group = this.g('chartforge-columns');
        this.group.appendChild(group);

        values.forEach((value, i) => {
            const targetH = (value / maxVal) * d.height;
            const x = this.padding.left + i * (cw + gap);
            const baseY = this.padding.top + d.height;

            const rect = createSVGElement<SVGRectElement>('rect', {
                x, y: baseY, width: cw, height: 0,
                fill: this.color(i),
            });
            group.appendChild(rect);

            if (this.config.animation?.enabled) {
                this.chart.animationEngine.animate(
                    `col-${i}`, 0, targetH,
                    this.config.animation.duration ?? 750,
                    this.config.animation.easing ?? 'easeOutQuad',
                    h => { rect.setAttribute('height', String(h)); rect.setAttribute('y', String(baseY - h)); }
                );
            } else {
                rect.setAttribute('height', String(targetH));
                rect.setAttribute('y', String(baseY - targetH));
            }

            rect.addEventListener('mouseenter', () => {
                rect.setAttribute('opacity', '0.8');
                this.chart.emit('hover', { type: 'column', index: i, value });
            });
            rect.addEventListener('mouseleave', () => rect.setAttribute('opacity', '1'));
            rect.addEventListener('click', () => this.chart.emit('click', { type: 'column', index: i, value }));
        });
    }
}
