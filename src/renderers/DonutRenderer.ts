import { PieRenderer } from './PieRenderer.js';
import { createSVGElement } from '../utils/dom.js';

export class DonutRenderer extends PieRenderer {
    override render(): void {
        const d = this.dims();
        const cx = d.totalWidth / 2;
        const cy = d.totalHeight / 2;
        const outerR = Math.min(d.width, d.height) / 2 - 20;
        const innerR = outerR * 0.6;

        const group = this.g('chartforge-donut');
        this.group.appendChild(group);

        this._drawSlices(group, cx, cy, outerR, innerR);

        const label = createSVGElement<SVGTextElement>('text', {
            x: cx, y: cy,
            'text-anchor': 'middle', 'dominant-baseline': 'middle',
            fill: this.theme.text, 'font-size': '24', 'font-weight': 'bold',
        });
        label.textContent = 'Total';
        group.appendChild(label);

        if (this.config.animation?.enabled) this._animate(group);
    }
}
