import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { svelteI18n } from './src/lib/plugin.ts';

export default defineConfig({
	plugins: [svelteI18n(), sveltekit()]
});
