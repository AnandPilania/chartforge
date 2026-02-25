import { BaseRenderer } from './BaseRenderer.js';
import { createSVGElement } from '../utils/dom.js';

export class BarRenderer extends BaseRenderer {
    render(): void {
        const d = this.dims();
        const values = this.data.series[0].data as number[];
        const maxVal = Math.max(...values);
        const bh = (d.height / values.length) * 0.8;
        const gap = (d.height / values.length) * 0.2;
        const group = this.g('chartforge-bars');
        this.group.appendChild(group);

        values.forEach((value, i) => {
            const targetW = (value / maxVal) * d.width;
            const y = this.padding.top + i * (bh + gap);

            const rect = createSVGElement<SVGRectElement>('rect', {
                x: this.padding.left, y, width: 0, height: bh,
                fill: this.color(i),
            });
            group.appendChild(rect);

            if (this.config.animation?.enabled) {
                this.chart.animationEngine.animate(
                    `bar-${i}`, 0, targetW,
                    this.config.animation.duration ?? 750,
                    this.config.animation.easing ?? 'easeOutQuad',
                    w => rect.setAttribute('width', String(w))
                );
            } else {
                rect.setAttribute('width', String(targetW));
            }

            rect.addEventListener('mouseenter', () => {
                rect.setAttribute('opacity', '0.8');
                this.chart.emit('hover', { type: 'bar', index: i, value });
            });
            rect.addEventListener('mouseleave', () => rect.setAttribute('opacity', '1'));
            rect.addEventListener('click', () => this.chart.emit('click', { type: 'bar', index: i, value }));

            const label = createSVGElement<SVGTextElement>('text', {
                x: this.padding.left + 6, y: y + bh / 2,
                fill: '#fff', 'font-size': '12', 'dominant-baseline': 'middle',
            });
            label.textContent = String(this.data.labels?.[i] ?? `Item ${i + 1}`);
            group.appendChild(label);
        });
    }
}
