// @ts-check
import { defineConfig } from 'astro/config';

import lit from '@astrojs/lit';

import solidJs from '@astrojs/solid-js';

import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  integrations: [lit(), solidJs()],

  adapter: node({
    mode: 'middleware'
  })
});