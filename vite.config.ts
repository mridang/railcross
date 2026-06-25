import { defineConfig } from 'vite';

// Compiles the Tailwind stylesheet to a single static file served from the
// Workers assets binding (public/css/app.css). PostCSS runs Tailwind via
// postcss.config.mjs; the worker itself is built separately with tsc.
export default defineConfig({
  // The Worker serves static files from public/; Vite must not treat it as its
  // own publicDir (that would copy every asset into the output).
  publicDir: false,
  build: {
    outDir: 'public/css',
    emptyOutDir: true,
    cssMinify: true,
    rollupOptions: {
      input: 'src/styles/app.css',
      output: { assetFileNames: 'app.css' },
    },
  },
});
