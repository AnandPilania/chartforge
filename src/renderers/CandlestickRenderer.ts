import { BaseRenderer } from './BaseRenderer.js';
import { createSVGElement } from '../utils/dom.js';
import type { CandleData } from '../types.js';

export class CandlestickRenderer extends BaseRenderer {
    render(): void {
        const d = this.dims();
        const candles = this.data.series[0].data as CandleData[];
        const allVals = candles.flatMap(c => [c.open, c.high, c.low, c.close]);
        const minVal = Math.min(...allVals);
        const maxVal = Math.max(...allVals);
        const range = maxVal - minVal || 1;
        const cw = (d.width / candles.length) * 0.7;
        const gap = (d.width / candles.length) * 0.3;
        const group = this.g('chartforge-candlestick');
        this.group.appendChild(group);

        const toY = (v: number) =>
            this.padding.top + d.height - ((v - minVal) / range) * d.height;

        candles.forEach((candle, i) => {
            const cx = this.padding.left + i * (cw + gap) + cw / 2;
            const openY = toY(candle.open);
            const closeY = toY(candle.close);
            const highY = toY(candle.high);
            const lowY = toY(candle.low);
            const positive = candle.close >= candle.open;
            const color = positive ? '#10b981' : '#ef4444';

            const wick = createSVGElement<SVGLineElement>('line', {
                x1: cx, y1: highY, x2: cx, y2: lowY,
                stroke: color, 'stroke-width': '1',
            });
            group.appendChild(wick);

            const bodyY = Math.min(openY, closeY);
            const bodyH = Math.max(Math.abs(closeY - openY), 1);

            const body = createSVGElement<SVGRectElement>('rect', {
                x: cx - cw / 2, y: bodyY, width: cw, height: bodyH,
                fill: positive ? color : '#ffffff',
                stroke: color, 'stroke-width': '2',
            });
            group.appendChild(body);

            body.addEventListener('mouseenter', () => {
                body.setAttribute('opacity', '0.8');
                this.chart.emit('hover', { type: 'candlestick', index: i, candle });
            });
            body.addEventListener('mouseleave', () => body.setAttribute('opacity', '1'));
            body.addEventListener('click', () =>
                this.chart.emit('click', { type: 'candlestick', index: i, candle }));
        });
    }
}
