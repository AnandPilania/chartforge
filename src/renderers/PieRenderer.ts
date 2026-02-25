import { BaseRenderer } from './BaseRenderer.js';
import { createSVGElement, polarToCartesian } from '../utils/dom.js';

export class PieRenderer extends BaseRenderer {
    render(): void {
        const d = this.dims();
        const cx = d.totalWidth / 2;
        const cy = d.totalHeight / 2;
        const r = Math.min(d.width, d.height) / 2 - 20;
        const group = this.g('chartforge-pie');
        this.group.appendChild(group);
        this._drawSlices(group, cx, cy, r);
        if (this.config.animation?.enabled) this._animate(group);
    }

    protected _drawSlices(
        group: SVGGElement, cx: number, cy: number, r: number,
        innerR = 0
    ): void {
        const values = this.data.series[0].data as number[];
        const total = values.reduce((s, v) => s + v, 0);
        let angle = 0;

        values.forEach((value, i) => {
            const sweep = (value / total) * 360;
            const endAngle = angle + sweep;

            const path = this._slice(cx, cy, r, innerR, angle, endAngle, i);
            group.appendChild(path);

            if (innerR === 0) {
                const mid = angle + sweep / 2;
                const lr = r * 0.7;
                const lpos = polarToCartesian(cx, cy, lr, mid);
                const text = createSVGElement<SVGTextElement>('text', {
                    x: lpos.x, y: lpos.y,
                    'text-anchor': 'middle', 'dominant-baseline': 'middle',
                    fill: '#fff', 'font-size': '12', 'font-weight': 'bold',
                });
                text.textContent = `${((value / total) * 100).toFixed(1)}%`;
                group.appendChild(text);
            }

            angle = endAngle;
        });
    }

    protected _slice(
        cx: number, cy: number,
        outerR: number, innerR: number,
        startAngle: number, endAngle: number,
        i: number
    ): SVGPathElement {
        const oStart = polarToCartesian(cx, cy, outerR, endAngle);
        const oEnd = polarToCartesian(cx, cy, outerR, startAngle);
        const large = endAngle - startAngle <= 180 ? '0' : '1';
        const value = (this.data.series[0].data as number[])[i];

        let d: string;
        if (innerR > 0) {
            const iStart = polarToCartesian(cx, cy, innerR, endAngle);
            const iEnd = polarToCartesian(cx, cy, innerR, startAngle);
            d = [
                `M ${oStart.x} ${oStart.y}`,
                `A ${outerR} ${outerR} 0 ${large} 0 ${oEnd.x} ${oEnd.y}`,
                `L ${iEnd.x} ${iEnd.y}`,
                `A ${innerR} ${innerR} 0 ${large} 1 ${iStart.x} ${iStart.y}`,
                'Z',
            ].join(' ');
        } else {
            d = [
                `M ${cx} ${cy}`,
                `L ${oStart.x} ${oStart.y}`,
                `A ${outerR} ${outerR} 0 ${large} 0 ${oEnd.x} ${oEnd.y}`,
                'Z',
            ].join(' ');
        }

        const path = createSVGElement<SVGPathElement>('path', {
            d,
            fill: this.color(i),
            stroke: this.theme.background,
            'stroke-width': '2',
        });

        path.addEventListener('mouseenter', () => {
            path.setAttribute('opacity', '0.8');
            this.chart.emit('hover', { type: 'pie', index: i, value });
        });
        path.addEventListener('mouseleave', () => path.setAttribute('opacity', '1'));
        path.addEventListener('click', () => this.chart.emit('click', { type: 'pie', index: i, value }));

        return path;
    }

    protected _animate(group: SVGGElement): void {
        group.querySelectorAll('path').forEach((path, i) => {
            (path as SVGPathElement).style.transformOrigin = 'center';
            (path as SVGPathElement).style.transform = 'scale(0)';
            this.chart.animationEngine.animate(
                `pie-${i}`, 0, 1,
                this.config.animation?.duration ?? 750,
                'easeOutElastic',
                v => { (path as SVGPathElement).style.transform = `scale(${v})`; }
            );
        });
    }
}
