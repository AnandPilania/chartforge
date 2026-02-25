import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        target: 'node18',
        outDir: resolve(__dirname, 'cli/dist'),
        emptyOutDir: true,
        lib: {
            entry: resolve(__dirname, 'cli/src/index.ts'),
            name: 'chartforge-cli',
            formats: ['cjs'],
            fileName: () => 'chartforge.cjs',
        },
        rollupOptions: {
            external: [
                'fs', 'path', 'os', 'url', 'util', 'stream', 'events', 'buffer',
                'child_process', 'net', 'tls', 'http', 'https', 'zlib', 'crypto',
                'jsdom',
                'sharp',
                '@resvg/resvg-js',
                'open',
            ],
            output: {
                // banner: '#!/usr/bin/env node',
                exports: 'auto',
            },
            plugins: [],
        },
        minify: false,
        sourcemap: false,
    },
    resolve: {
        alias: {
            'chartforge': resolve(__dirname, 'src/index.ts'),
        },
    },
});
