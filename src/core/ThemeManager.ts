import type { Theme } from '../types.js';

export class ThemeManager {
    private readonly _themes = new Map<string, Theme>();
    private _current: string | null = null;

    register(name: string, theme: Theme): void {
        this._themes.set(name, theme);
    }

    get(name: string): Theme | undefined {
        return this._themes.get(name);
    }

    apply(name: string): Theme | null {
        const theme = this._themes.get(name);
        if (!theme) {
            console.warn(`[ChartForge] Theme "${name}" not found`);
            return null;
        }
        this._current = name;
        return theme;
    }

    getCurrent(): Theme | null {
        return this._current ? (this._themes.get(this._current) ?? null) : null;
    }

    get currentName(): string | null {
        return this._current;
    }
}
