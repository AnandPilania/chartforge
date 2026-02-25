import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
    plugins: [
        dts({
            include: ['src/**/*.ts'],
            outDir: 'dist/types',
            rollupTypes: true,
        }),
    ],
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
            entry: {
                chartforge: resolve(__dirname, 'src/index.ts'),
                plugins: resolve(__dirname, 'src/plugins/index.ts'),
                themes: resolve(__dirname, 'src/themes/index.ts'),
            },
            name: 'ChartForge',
            formats: ['es', 'umd'],
        },
        rollupOptions: {
            external: [],
            output: {
                globals: {},
                exports: 'named',
            },
        },
        minify: isProd ? 'terser' : false,
        sourcemap: !isProd,
        terserOptions: isProd
            ? {
                compress: {
                    drop_console: true,
                    drop_debugger: true,
                    pure_funcs: ['console.log', 'console.warn', 'console.info'],
                    passes: 3,
                    unsafe: true,
                    unsafe_math: true,
                    unsafe_methods: true,
                },
                mangle: {
                    toplevel: true,
                    properties: {
                        regex: /^_/,
                    },
                },
                format: {
                    comments: false,
                    beautify: false,
                },
            }
            : undefined,
        target: 'es2020',
        chunkSizeWarningLimit: 500,
    },
});
