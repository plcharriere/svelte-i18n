import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { svelteI18n } from '../../src/lib/plugin.ts';

let root: string;

function file(rel: string, contents: string) {
	const full = join(root, rel);
	mkdirSync(join(full, '..'), { recursive: true });
	writeFileSync(full, contents);
}

function setup(plugin: Plugin) {
	(plugin.configResolved as (cfg: { root: string }) => void)({ root });
	(plugin.buildStart as () => void)();
}

function transform(plugin: Plugin, id: string, code: string) {
	const fn = plugin.transform as (
		code: string,
		id: string
	) => { code: string; map: null } | undefined;
	return fn(code, id);
}

function getManifest(plugin: Plugin): { routes: Record<string, string[]> } {
	const result = transform(
		plugin,
		'/anywhere/manifest.ts',
		'export const __slot = "@svelte-i18n-manifest-slot";\nexport const manifest = { routes: {} };'
	);
	if (!result) throw new Error('transform did not produce output');
	const m = result.code.match(/= (\{.*?\});/s);
	if (!m) throw new Error(`unexpected transform output: ${result.code}`);
	return JSON.parse(m[1]);
}

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), 'svelte-i18n-plugin-'));
});

afterEach(() => {
	rmSync(root, { recursive: true, force: true });
});

describe('svelteI18n plugin — manifest extraction', () => {
	it('extracts t() keys from a single page', () => {
		file('src/routes/+page.svelte', "<script>t('home.title'); t('home.body');</script>");
		const plugin = svelteI18n();
		setup(plugin);
		const m = getManifest(plugin);
		expect(m.routes['/']).toEqual(['home.body', 'home.title']);
	});

	it('builds per-route manifests', () => {
		file('src/routes/+page.svelte', "<script>t('home.title');</script>");
		file('src/routes/cart/+page.svelte', "<script>t('cart.title');</script>");
		file('src/routes/about/+page.svelte', "<script>t('about.title');</script>");
		const plugin = svelteI18n();
		setup(plugin);
		const m = getManifest(plugin);
		expect(m.routes['/']).toEqual(['home.title']);
		expect(m.routes['/cart']).toEqual(['cart.title']);
		expect(m.routes['/about']).toEqual(['about.title']);
	});

	it('propagates root layout keys to every route', () => {
		file('src/routes/+layout.svelte', "<script>t('nav.home'); t('nav.cart');</script>");
		file('src/routes/+page.svelte', "<script>t('home.title');</script>");
		file('src/routes/cart/+page.svelte', "<script>t('cart.title');</script>");
		const plugin = svelteI18n();
		setup(plugin);
		const m = getManifest(plugin);
		expect(m.routes['/']).toEqual(['home.title', 'nav.cart', 'nav.home']);
		expect(m.routes['/cart']).toEqual(['cart.title', 'nav.cart', 'nav.home']);
	});

	it('propagates intermediate layout keys', () => {
		file('src/routes/+layout.svelte', "<script>t('nav.home');</script>");
		file('src/routes/admin/+layout.svelte', "<script>t('admin.header');</script>");
		file('src/routes/admin/users/+page.svelte', "<script>t('admin.users.list');</script>");
		const plugin = svelteI18n();
		setup(plugin);
		const m = getManifest(plugin);
		expect(m.routes['/admin/users']).toEqual([
			'admin.header',
			'admin.users.list',
			'nav.home'
		]);
	});

	it('follows relative imports', () => {
		file(
			'src/routes/cart/+page.svelte',
			"<script>import Card from './Card.svelte';</script>"
		);
		file(
			'src/routes/cart/Card.svelte',
			"<script>t('cart.card.title'); t('cart.card.body');</script>"
		);
		const plugin = svelteI18n();
		setup(plugin);
		const m = getManifest(plugin);
		expect(m.routes['/cart']).toEqual(['cart.card.body', 'cart.card.title']);
	});

	it('follows $lib alias imports', () => {
		file('src/lib/Widget.svelte', "<script>t('widget.label');</script>");
		file(
			'src/routes/+page.svelte',
			"<script>import Widget from '$lib/Widget.svelte';</script>"
		);
		const plugin = svelteI18n();
		setup(plugin);
		const m = getManifest(plugin);
		expect(m.routes['/']).toEqual(['widget.label']);
	});

	it('follows custom aliases', () => {
		file('src/components/Button.svelte', "<script>t('button.label');</script>");
		file(
			'src/routes/+page.svelte',
			"<script>import Button from '$components/Button.svelte';</script>"
		);
		const plugin = svelteI18n({ aliases: { $components: 'src/components' } });
		setup(plugin);
		const m = getManifest(plugin);
		expect(m.routes['/']).toEqual(['button.label']);
	});

	it('handles transitive imports', () => {
		file('src/lib/inner.ts', "export const greet = t('inner.greet');");
		file('src/lib/outer.ts', "import { greet } from './inner';");
		file(
			'src/routes/+page.svelte',
			"<script>import { greet } from '$lib/outer';</script>"
		);
		const plugin = svelteI18n();
		setup(plugin);
		const m = getManifest(plugin);
		expect(m.routes['/']).toContain('inner.greet');
	});

	it('skips template literal calls (dynamic keys)', () => {
		file(
			'src/routes/+page.svelte',
			"<script>t('static.key'); t(`dynamic.${name}`);</script>"
		);
		const plugin = svelteI18n();
		setup(plugin);
		const m = getManifest(plugin);
		expect(m.routes['/']).toEqual(['static.key']);
	});

	it('does not match .t() method calls or set()', () => {
		file(
			'src/routes/+page.svelte',
			"<script>obj.t('not.this'); set('not.this'); t('actual.key');</script>"
		);
		const plugin = svelteI18n();
		setup(plugin);
		const m = getManifest(plugin);
		expect(m.routes['/']).toEqual(['actual.key']);
	});

	it('deduplicates keys', () => {
		file(
			'src/routes/+page.svelte',
			"<script>t('hello'); t('hello'); t('hello');</script>"
		);
		const plugin = svelteI18n();
		setup(plugin);
		const m = getManifest(plugin);
		expect(m.routes['/']).toEqual(['hello']);
	});

	it('extracts both single and double-quoted calls', () => {
		file(
			'src/routes/+page.svelte',
			"<script>t('single.key'); t(\"double.key\");</script>"
		);
		const plugin = svelteI18n();
		setup(plugin);
		const m = getManifest(plugin);
		expect(m.routes['/']).toEqual(['double.key', 'single.key']);
	});

	it('returns sorted keys', () => {
		file(
			'src/routes/+page.svelte',
			"<script>t('zebra'); t('apple'); t('mango');</script>"
		);
		const plugin = svelteI18n();
		setup(plugin);
		const m = getManifest(plugin);
		expect(m.routes['/']).toEqual(['apple', 'mango', 'zebra']);
	});

	it('handles cyclic imports without infinite loop', () => {
		file('src/lib/a.ts', "import './b'; export const x = t('a.key');");
		file('src/lib/b.ts', "import './a'; export const y = t('b.key');");
		file(
			'src/routes/+page.svelte',
			"<script>import { x } from '$lib/a';</script>"
		);
		const plugin = svelteI18n();
		setup(plugin);
		const m = getManifest(plugin);
		expect(m.routes['/']).toEqual(['a.key', 'b.key']);
	});

	it('only scans <script> blocks for imports in .svelte files', () => {
		file(
			'src/routes/+page.svelte',
			'<script>t(\'real.key\');</script>\n<p>import "fake/path"</p>'
		);
		const plugin = svelteI18n();
		setup(plugin);
		const m = getManifest(plugin);
		expect(m.routes['/']).toEqual(['real.key']);
	});

	it('produces an empty manifest when routes dir does not exist', () => {
		const plugin = svelteI18n();
		setup(plugin);
		const m = getManifest(plugin);
		expect(m.routes).toEqual({});
	});

	it('honors a custom routesDir option', () => {
		file('app/pages/+page.svelte', "<script>t('custom.key');</script>");
		const plugin = svelteI18n({ routesDir: 'app/pages' });
		setup(plugin);
		const m = getManifest(plugin);
		expect(m.routes['/']).toEqual(['custom.key']);
	});

	it('survives non-existent imports (resolveImport returns undefined)', () => {
		file(
			'src/routes/+page.svelte',
			"<script>import x from './missing'; t('home');</script>"
		);
		const plugin = svelteI18n();
		setup(plugin);
		const m = getManifest(plugin);
		expect(m.routes['/']).toEqual(['home']);
	});

	it('caches parsed files across the same build (shared layout read once)', () => {
		// A shared layout-keys file referenced from multiple routes should only be
		// scanned once per build. The behavior we can observe: keys collected
		// correctly across all routes that import it.
		file('src/lib/strings.ts', "export const x = t('shared.key');");
		file(
			'src/routes/a/+page.svelte',
			"<script>import { x } from '$lib/strings';</script>"
		);
		file(
			'src/routes/b/+page.svelte',
			"<script>import { x } from '$lib/strings';</script>"
		);
		const plugin = svelteI18n();
		setup(plugin);
		const m = getManifest(plugin);
		expect(m.routes['/a']).toEqual(['shared.key']);
		expect(m.routes['/b']).toEqual(['shared.key']);
	});

	it('resolves an alias-only import (no trailing path)', () => {
		file('src/lib/index.ts', "export const x = t('lib.entry');");
		file(
			'src/routes/+page.svelte',
			"<script>import { x } from '$lib';</script>"
		);
		const plugin = svelteI18n();
		setup(plugin);
		const m = getManifest(plugin);
		expect(m.routes['/']).toContain('lib.entry');
	});
});

describe('svelteI18n plugin — transform hook', () => {
	it('replaces manifest.ts content when sentinel is present', () => {
		file('src/routes/+page.svelte', "<script>t('home');</script>");
		const plugin = svelteI18n();
		setup(plugin);
		const result = transform(
			plugin,
			'/path/to/manifest.ts',
			'export const __slot = "@svelte-i18n-manifest-slot";\nexport const manifest = { routes: {} };'
		);
		expect(result).not.toBeUndefined();
		expect(result!.code).toContain('"home"');
		expect(result!.code).toMatch(/^export const manifest = /);
	});

	it('skips files without the sentinel', () => {
		const plugin = svelteI18n();
		setup(plugin);
		const result = transform(
			plugin,
			'/path/to/manifest.ts',
			'export const manifest = { routes: {} };'
		);
		expect(result).toBeUndefined();
	});

	it('skips files not named manifest.{ts,js,mjs,mts}', () => {
		const plugin = svelteI18n();
		setup(plugin);
		const result = transform(
			plugin,
			'/path/to/other.ts',
			'export const __slot = "@svelte-i18n-manifest-slot";'
		);
		expect(result).toBeUndefined();
	});

	it('matches manifest.js, .mjs, .mts as well as .ts', () => {
		const plugin = svelteI18n();
		setup(plugin);
		for (const ext of ['ts', 'js', 'mjs', 'mts']) {
			const result = transform(
				plugin,
				`/path/to/manifest.${ext}`,
				'export const __slot = "@svelte-i18n-manifest-slot";'
			);
			expect(result, ext).not.toBeUndefined();
		}
	});

	it('matches manifest paths with query strings', () => {
		const plugin = svelteI18n();
		setup(plugin);
		const result = transform(
			plugin,
			'/path/to/manifest.ts?v=123',
			'export const __slot = "@svelte-i18n-manifest-slot";'
		);
		expect(result).not.toBeUndefined();
	});
});

describe('svelteI18n plugin — handleHotUpdate', () => {
	it('returns [] for locale files (suppress default HMR)', () => {
		file('src/locales/en.ts', "export default { hello: 'Hello' };");
		const plugin = svelteI18n();
		setup(plugin);
		const fn = plugin.handleHotUpdate as (ctx: {
			file: string;
		}) => unknown;
		const result = fn({ file: join(root, 'src/locales/en.ts') });
		expect(result).toEqual([]);
	});

	it('returns undefined for non-locale files (default HMR)', () => {
		const plugin = svelteI18n();
		setup(plugin);
		const fn = plugin.handleHotUpdate as (ctx: {
			file: string;
		}) => unknown;
		const result = fn({ file: join(root, 'src/routes/+page.svelte') });
		expect(result).toBeUndefined();
	});
});
