// @ts-check
import { defineConfig } from 'astro/config';

import lit from '@astrojs/lit';

import solidJs from '@astrojs/solid-js';

// https://astro.build/config
export default defineConfig({
  integrations: [lit(), solidJs()],
  vite: {
    build: {
      chunkSizeWarningLimit: 1000 // Cambia este valor al límite deseado en KB
    }
  }
});