import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import { viteStaticCopy } from "vite-plugin-static-copy";

// https://vitejs.dev/config/
export default defineConfig(async () => ({
    plugins: [solid(),
        viteStaticCopy({
            targets: [
                {
                    src: './splashscreen.html',
                    dest: '.'
                },
                {
                    src: 'src/assets',
                    dest: '.'
                }
            ]
        })
    ],

    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
        port: 3000,
        // Tauri expects a fixed port, fail if that port is not available
        strictPort: true,

        watch: {
            // tell vite to ignore watching `src-tauri`
            ignored: ['**/src-tauri/**'],
        },
    }
}));