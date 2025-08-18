// @ts-check
import { defineConfig } from 'astro/config';

import lit from '@astrojs/lit';

import solidJs from '@astrojs/solid-js';

import vue from '@astrojs/vue';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [lit(), solidJs(), vue()],
  vite: {
    build: {
      chunkSizeWarningLimit: 1000 // Cambia este valor al límite deseado en KB
    },

    plugins: [tailwindcss()]
  }
});