import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: resolve(__dirname, 'demo'),
    resolve: {
        alias: {
            '@chartforge/core': resolve(__dirname, 'src/core/index.ts'),
            '@chartforge/plugins': resolve(__dirname, 'src/plugins/index.ts'),
            '@chartforge/themes': resolve(__dirname, 'src/themes/index.ts'),
            '@chartforge/renderers': resolve(__dirname, 'src/renderers/index.ts'),
            '@chartforge/adapters': resolve(__dirname, 'src/adapters/index.ts'),
            '@chartforge/utils': resolve(__dirname, 'src/utils/index.ts'),
            'chartforge': resolve(__dirname, 'src/index.ts'),
        },
    },
    server: {
        port: 5173,
        open: true,
        hmr: true,
    },
    build: {
        outDir: resolve(__dirname, 'demo/dist'),
        sourcemap: true,
    },
});
