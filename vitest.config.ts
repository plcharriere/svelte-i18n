import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [svelte()],
	test: {
		include: ['tests/**/*.test.ts'],
		environment: 'node',
		// `.svelte.ts` files need Svelte's compiler so `$state` runes resolve.
		// Without this, the runes are read as undefined globals in Vitest.
		server: {
			deps: {
				inline: [/\.svelte\.(js|ts)$/]
			}
		}
	}
});
