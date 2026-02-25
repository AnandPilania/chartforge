import { BaseRenderer } from './BaseRenderer.js';
import { createSVGElement } from '../utils/dom.js';

export class StackedBarRenderer extends BaseRenderer {
    render(): void {
        const d = this.dims();
        const nCats = (this.data.labels ?? []).length;
        const bh = (d.height / nCats) * 0.8;
        const gap = (d.height / nCats) * 0.2;
        const totals = Array.from({ length: nCats }, (_, i) =>
            this.data.series.reduce((s, ser) => s + ((ser.data as number[])[i] ?? 0), 0)
        );
        const maxTotal = Math.max(...totals);
        const group = this.g('chartforge-stacked-bars');
        this.group.appendChild(group);

        for (let ci = 0; ci < nCats; ci++) {
            let xOff = 0;
            const y = this.padding.top + ci * (bh + gap);

            this.data.series.forEach((series, si) => {
                const value = (series.data as number[])[ci] ?? 0;
                const targetW = (value / maxTotal) * d.width;

                const rect = createSVGElement<SVGRectElement>('rect', {
                    x: this.padding.left + xOff, y, width: 0, height: bh,
                    fill: this.color(si),
                });
                group.appendChild(rect);

                const capturedXOff = xOff;
                if (this.config.animation?.enabled) {
                    this.chart.animationEngine.animate(
                        `sbar-${ci}-${si}`, 0, targetW,
                        this.config.animation.duration ?? 750,
                        this.config.animation.easing ?? 'easeOutQuad',
                        w => {
                            rect.setAttribute('width', String(w));
                            rect.setAttribute('x', String(this.padding.left + capturedXOff));
                        }
                    );
                } else {
                    rect.setAttribute('width', String(targetW));
                }

                rect.addEventListener('mouseenter', () => {
                    rect.setAttribute('opacity', '0.8');
                    this.chart.emit('hover', { type: 'stackedBar', catIndex: ci, seriesIndex: si, value });
                });
                rect.addEventListener('mouseleave', () => rect.setAttribute('opacity', '1'));

                xOff += targetW;
            });
        }
    }
}
