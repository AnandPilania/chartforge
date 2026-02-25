import { defineConfig } from 'vite';
import { resolve } from 'path';

const isProd = process.env.NODE_ENV === 'production';

const entry = process.env.UMD_ENTRY ?? 'chartforge';

const entries: Record<string, { path: string; name: string }> = {
    chartforge: { path: resolve(__dirname, 'src/index.ts'), name: 'ChartForge' },
    plugins: { path: resolve(__dirname, 'src/plugins/index.ts'), name: 'ChartForgePlugins' },
    themes: { path: resolve(__dirname, 'src/themes/index.ts'), name: 'ChartForgeThemes' },
};

const { path: entryPath, name } = entries[entry];

export default defineConfig({
    resolve: {
        alias: {
            '@chartforge/core': resolve(__dirname, 'src/core/index.ts'),
            '@chartforge/plugins': resolve(__dirname, 'src/plugins/index.ts'),
            '@chartforge/themes': resolve(__dirname, 'src/themes/index.ts'),
            '@chartforge/renderers': resolve(__dirname, 'src/renderers/index.ts'),
            '@chartforge/adapters': resolve(__dirname, 'src/adapters/index.ts'),
            '@chartforge/utils': resolve(__dirname, 'src/utils/index.ts'),
        },
    },
    build: {
        lib: {
            entry: entryPath,
            name,
            fileName: () => `${entry}.umd.cjs`,
            formats: ['umd'],
        },
        emptyOutDir: false,
        rollupOptions: {
            output: { exports: 'named' },
        },
        minify: isProd ? 'terser' : false,
        sourcemap: !isProd,
        target: 'es2020',
    },
});
