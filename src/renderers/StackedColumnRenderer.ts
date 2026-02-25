import { BaseRenderer } from './BaseRenderer.js';
import { createSVGElement } from '../utils/dom.js';

export class StackedColumnRenderer extends BaseRenderer {
    render(): void {
        const d = this.dims();
        const labels = this.data.labels ?? [];
        const nCats = labels.length;
        const cw = (d.width / nCats) * 0.8;
        const gap = (d.width / nCats) * 0.2;
        const totals = Array.from({ length: nCats }, (_, i) =>
            this.data.series.reduce((s, ser) => s + ((ser.data as number[])[i] ?? 0), 0)
        );
        const maxTotal = Math.max(...totals);
        const group = this.g('chartforge-stacked-columns');
        this.group.appendChild(group);

        for (let ci = 0; ci < nCats; ci++) {
            let yOff = 0;
            const x = this.padding.left + ci * (cw + gap);
            const baseY = this.padding.top + d.height;

            this.data.series.forEach((series, si) => {
                const value = (series.data as number[])[ci] ?? 0;
                const targetH = (value / maxTotal) * d.height;

                const rect = createSVGElement<SVGRectElement>('rect', {
                    x, y: baseY - yOff, width: cw, height: 0,
                    fill: this.color(si),
                });
                group.appendChild(rect);

                const capturedYOff = yOff;
                if (this.config.animation?.enabled) {
                    this.chart.animationEngine.animate(
                        `scol-${ci}-${si}`, 0, targetH,
                        this.config.animation.duration ?? 750,
                        this.config.animation.easing ?? 'easeOutQuad',
                        h => {
                            rect.setAttribute('height', String(h));
                            rect.setAttribute('y', String(baseY - capturedYOff - h));
                        }
                    );
                } else {
                    rect.setAttribute('height', String(targetH));
                    rect.setAttribute('y', String(baseY - capturedYOff - targetH));
                }

                rect.addEventListener('mouseenter', () => {
                    rect.setAttribute('opacity', '0.8');
                    this.chart.emit('hover', { type: 'stackedColumn', catIndex: ci, seriesIndex: si, value });
                });
                rect.addEventListener('mouseleave', () => rect.setAttribute('opacity', '1'));

                yOff += targetH;
            });
        }
    }
}
