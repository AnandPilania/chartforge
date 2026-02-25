import type { EasingName } from '../types.js';

type EasingFn = (t: number) => number;

const EASINGS: Record<EasingName, EasingFn> = {
    linear: t => t,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: t => t * t * t,
    easeOutCubic: t => (--t) * t * t + 1,
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeInElastic: t => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
    },
    easeOutElastic: t => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    easeInBounce: t => {
        const n1 = 7.5625, d1 = 2.75;
        const eob = (t: number): number => {
            if (t < 1 / d1) return n1 * t * t;
            if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
            if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        };
        return 1 - eob(1 - t);
    },
    easeOutBounce: t => {
        const n1 = 7.5625, d1 = 2.75;
        if (t < 1 / d1) return n1 * t * t;
        if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
        if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
    },
};

interface AnimationState { rafId: number }

export class AnimationEngine {
    private readonly _running = new Map<string, AnimationState>();

    animate(
        id: string,
        from: number,
        to: number,
        duration: number,
        easing: EasingName = 'easeOutQuad',
        onUpdate: (value: number, progress: number) => void,
        onComplete?: () => void,
    ): void {
        this.stop(id);

        const easingFn = EASINGS[easing] ?? EASINGS.linear;
        const start = performance.now();

        const tick = (now: number): void => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easingFn(progress);
            onUpdate(from + (to - from) * eased, progress);

            if (progress < 1) {
                const rafId = requestAnimationFrame(tick);
                this._running.set(id, { rafId });
            } else {
                this._running.delete(id);
                onComplete?.();
            }
        };

        const rafId = requestAnimationFrame(tick);
        this._running.set(id, { rafId });
    }

    stop(id: string): void {
        const state = this._running.get(id);
        if (state) {
            cancelAnimationFrame(state.rafId);
            this._running.delete(id);
        }
    }

    stopAll(): void {
        this._running.forEach(s => cancelAnimationFrame(s.rafId));
        this._running.clear();
    }
}
