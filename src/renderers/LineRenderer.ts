import { BaseRenderer } from './BaseRenderer.js';
import { createSVGElement } from '../utils/dom.js';

export class LineRenderer extends BaseRenderer {
    render(): void {
        const d = this.dims();
        const group = this.g('chartforge-lines');
        this.group.appendChild(group);

        const allVals = (this.data.series.flatMap(s => s.data) as number[]);
        const maxVal = Math.max(...allVals);
        const minVal = Math.min(...allVals);
        const range = maxVal - minVal || 1;

        this.data.series.forEach((series, si) => {
            const values = series.data as number[];
            const pts = values.map((v, i) => ({
                x: this.padding.left + (i / Math.max(values.length - 1, 1)) * d.width,
                y: this.padding.top + d.height - ((v - minVal) / range) * d.height,
                value: v,
            }));

            const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
            const path = createSVGElement<SVGPathElement>('path', {
                d: pathD, fill: 'none',
                stroke: this.color(si), 'stroke-width': '2',
            });
            group.appendChild(path);

            pts.forEach((pt, i) => {
                const circle = createSVGElement<SVGCircleElement>('circle', {
                    cx: pt.x, cy: pt.y, r: 4, fill: this.color(si),
                });
                circle.addEventListener('mouseenter', () => {
                    circle.setAttribute('r', '6');
                    this.chart.emit('hover', { type: 'line', seriesIndex: si, index: i, value: pt.value });
                });
                circle.addEventListener('mouseleave', () => circle.setAttribute('r', '4'));
                circle.addEventListener('click', () =>
                    this.chart.emit('click', { type: 'line', seriesIndex: si, index: i, value: pt.value }));
                group.appendChild(circle);
            });

            if (this.config.animation?.enabled) {
                const len = path.getTotalLength();
                path.style.strokeDasharray = String(len);
                path.style.strokeDashoffset = String(len);
                this.chart.animationEngine.animate(
                    `line-${si}`, len, 0,
                    this.config.animation.duration ?? 750,
                    this.config.animation.easing ?? 'easeOutQuad',
                    off => { path.style.strokeDashoffset = String(off); }
                );
            }
        });
    }
}
