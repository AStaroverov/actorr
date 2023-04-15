import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
    build: {
        minify: false,
        lib: {
            entry: './src/index.ts',
            name: 'webactor',
            fileName: 'webactor',
            formats: ['es', 'cjs', 'umd', 'iife'],
        },
    },
    plugins: [dts()],
});
