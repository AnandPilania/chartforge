export type SVGAttrs = Record<string, string | number | ((e: Event) => void)>;

export function createSVGElement<T extends SVGElement = SVGElement>(
    tag: string,
    attrs: SVGAttrs = {}
): T {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag) as T;
    for (const [key, value] of Object.entries(attrs)) {
        if (key === 'className') {
            el.setAttribute('class', String(value));
        } else if (key.startsWith('on') && typeof value === 'function') {
            el.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
        } else {
            el.setAttribute(key, String(value));
        }
    }
    return el;
}

export function removeChildren(el: Element): void {
    while (el.firstChild) el.removeChild(el.firstChild);
}

export function polarToCartesian(
    cx: number,
    cy: number,
    r: number,
    angleDeg: number
): { x: number; y: number } {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function describeArc(
    x: number,
    y: number,
    r: number,
    startAngle: number,
    endAngle: number
): string {
    const start = polarToCartesian(x, y, r, endAngle);
    const end = polarToCartesian(x, y, r, startAngle);
    const large = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}
