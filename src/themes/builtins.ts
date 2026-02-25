import type { Theme } from '../types.js';

export const lightTheme: Theme = {
    background: '#ffffff',
    foreground: '#000000',
    grid: '#e5e5e5',
    text: '#333333',
    textSecondary: '#666666',
    colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'],
    tooltip: { background: '#ffffff', text: '#000000', border: '#e5e5e5', shadow: 'rgba(0,0,0,0.1)' },
    legend: { text: '#333333', hover: '#000000' },
    axis: { line: '#d1d5db', text: '#6b7280', grid: '#f3f4f6' },
};

export const darkTheme: Theme = {
    background: '#1a1a1a',
    foreground: '#ffffff',
    grid: '#333333',
    text: '#e5e5e5',
    textSecondary: '#999999',
    colors: ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#f472b6', '#22d3ee', '#a3e635'],
    tooltip: { background: '#2a2a2a', text: '#ffffff', border: '#444444', shadow: 'rgba(0,0,0,0.3)' },
    legend: { text: '#e5e5e5', hover: '#ffffff' },
    axis: { line: '#404040', text: '#9ca3af', grid: '#262626' },
};

export const neonTheme: Theme = {
    background: '#0a0a0a',
    foreground: '#00ffff',
    grid: '#1a1a2e',
    text: '#00ffff',
    textSecondary: '#ff00ff',
    colors: ['#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#ff0080', '#8000ff', '#ff8000', '#0080ff'],
    tooltip: { background: '#1a1a2e', text: '#00ffff', border: '#00ffff', shadow: 'rgba(0,255,255,0.3)' },
    legend: { text: '#00ffff', hover: '#ff00ff' },
    axis: { line: '#1a1a2e', text: '#00ffff', grid: '#16161f' },
};

export const BUILT_IN_THEMES: Record<string, Theme> = {
    light: lightTheme,
    dark: darkTheme,
    neon: neonTheme,
};
