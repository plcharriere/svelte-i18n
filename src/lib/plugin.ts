import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';
import type { I18nKeyManifest } from './hooks.ts';

export interface SvelteI18nPluginOptions {
	/** Route root. Defaults to `src/routes`. */
	routesDir?: string;
	/** Locale source directory — changes trigger dictionary cache reset +
	 * live dict swap for translation strings. Defaults to `src/locales`. */
	localesDir?: string;
	/** Vite-style aliases for import resolution. `$lib` is included by default. */
	aliases?: Record<string, string>;
}

export type { I18nKeyManifest } from './hooks.ts';

const MANIFEST_SENTINEL = '@svelte-i18n-manifest-slot';
const MANIFEST_FILE_RE = /[\\/]manifest\.(ts|js|mjs|mts)(\?|$)/;

const T_CALL_RE = /(?:^|[^.\w$])t\s*\(\s*(['"])([^'"\n]+)\1/g;
const IMPORT_RE = /\bimport\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"\n]+)['"]/g;
const SCRIPT_RE = /<script\b[^>]*>([\s\S]*?)<\/script>/g;

const SOURCE_EXTS = ['.ts', '.js', '.svelte', '.svelte.ts', '.svelte.js'];

export function svelteI18n(opts: SvelteI18nPluginOptions = {}): Plugin {
	const routesDir = opts.routesDir ?? 'src/routes';
	const localesDir = opts.localesDir ?? 'src/locales';
	let root = process.cwd();
	let localesAbs = '';
	let aliases: Record<string, string> = {};
	let manifest: I18nKeyManifest = { routes: {} };
	let server: ViteDevServer | undefined;
	const manifestModuleIds = new Set<string>();

	const isLocaleFile = (file: string) => file.startsWith(localesAbs);

	const fileCache = new Map<string, { keys: Set<string>; imports: string[] }>();

	function parse(file: string): { keys: Set<string>; imports: string[] } {
		const cached = fileCache.get(file);
		if (cached) return cached;
		let src = '';
		try {
			src = readFileSync(file, 'utf8');
		} catch {
			const empty = { keys: new Set<string>(), imports: [] };
			fileCache.set(file, empty);
			return empty;
		}

		const keys = new Set<string>();
		for (const m of src.matchAll(T_CALL_RE)) keys.add(m[2]);

		let importSrc = src;
		if (file.endsWith('.svelte')) {
			const chunks: string[] = [];
			for (const m of src.matchAll(SCRIPT_RE)) chunks.push(m[1]);
			importSrc = chunks.join('\n');
		}
		const imports: string[] = [];
		for (const m of importSrc.matchAll(IMPORT_RE)) imports.push(m[1]);

		const result = { keys, imports };
		fileCache.set(file, result);
		return result;
	}

	function resolveWithExts(base: string): string | undefined {
		if (existsSync(base) && statSync(base).isFile()) return base;
		for (const ext of SOURCE_EXTS) {
			const full = base + ext;
			if (existsSync(full) && statSync(full).isFile()) return full;
		}
		for (const ext of SOURCE_EXTS) {
			const full = join(base, 'index' + ext);
			if (existsSync(full) && statSync(full).isFile()) return full;
		}
		return undefined;
	}

	function resolveImport(from: string, spec: string): string | undefined {
		if (spec.startsWith('.')) {
			return resolveWithExts(resolve(dirname(from), spec));
		}
		for (const [alias, target] of Object.entries(aliases)) {
			if (spec === alias) return resolveWithExts(resolve(root, target));
			if (spec.startsWith(alias + '/')) {
				const sub = spec.slice(alias.length + 1);
				return resolveWithExts(resolve(root, target, sub));
			}
		}
		return undefined;
	}

	function collectKeys(entry: string, visited: Set<string>): Set<string> {
		if (visited.has(entry)) return new Set();
		visited.add(entry);
		const { keys, imports } = parse(entry);
		const all = new Set(keys);
		for (const spec of imports) {
			const resolved = resolveImport(entry, spec);
			if (!resolved) continue;
			for (const k of collectKeys(resolved, visited)) all.add(k);
		}
		return all;
	}

	function routeIdFromDir(dir: string, routesAbs: string): string {
		const rel = relative(routesAbs, dir).replace(/\\/g, '/');
		return rel === '' ? '/' : '/' + rel;
	}

	function walkRoutes(dir: string, routesAbs: string, out: string[]): void {
		const entries = readDir(dir);
		for (const name of entries) {
			const full = join(dir, name);
			const st = statSync(full);
			if (st.isDirectory()) {
				walkRoutes(full, routesAbs, out);
			} else if (name === '+page.svelte') {
				out.push(full);
			}
		}
	}

	function readDir(dir: string): string[] {
		try {
			return readdirSync(dir);
		} catch {
			return [];
		}
	}

	function build(): void {
		const routesAbs = resolve(root, routesDir);
		if (!existsSync(routesAbs)) {
			manifest = { routes: {} };
			return;
		}
		fileCache.clear();

		const pages: string[] = [];
		walkRoutes(routesAbs, routesAbs, pages);

		const rootLayout = join(routesAbs, '+layout.svelte');
		const rootLayoutKeys = existsSync(rootLayout)
			? collectKeys(rootLayout, new Set())
			: new Set<string>();

		const routes: Record<string, string[]> = {};
		for (const page of pages) {
			const dir = dirname(page);
			const routeId = routeIdFromDir(dir, routesAbs);
			const keys = new Set<string>(rootLayoutKeys);
			for (const k of collectKeys(page, new Set())) keys.add(k);

			let cur = dir;
			while (cur.length >= routesAbs.length && cur !== routesAbs) {
				const layout = join(cur, '+layout.svelte');
				if (existsSync(layout) && layout !== rootLayout) {
					for (const k of collectKeys(layout, new Set())) keys.add(k);
				}
				cur = dirname(cur);
			}
			routes[routeId] = [...keys].sort();
		}
		manifest = { routes };
	}

	function invalidateWithImporters(rootId: string): void {
		if (!server) return;
		const seen = new Set<string>();
		const walk = (id: string): void => {
			if (seen.has(id)) return;
			seen.add(id);
			const mod = server!.moduleGraph.getModuleById(id);
			if (!mod) return;
			server!.moduleGraph.invalidateModule(mod);
			for (const importer of mod.importers) {
				if (importer.id) walk(importer.id);
			}
		};
		walk(rootId);
	}

	function invalidateManifestModule(): void {
		for (const id of manifestModuleIds) invalidateWithImporters(id);
	}

	function invalidateDictionaryModule(): void {
		for (const manifestId of manifestModuleIds) {
			const [base, query = ''] = manifestId.split('?');
			const dictBase = base.replace(
				/manifest\.(ts|js|mjs|mts)$/,
				(_, ext: string) => `dictionary.${ext}`
			);
			const candidate = query ? `${dictBase}?${query}` : dictBase;
			invalidateWithImporters(candidate);
		}
	}

	return {
		name: 'svelte-i18n',

		configResolved(config) {
			root = config.root;
			localesAbs = resolve(root, localesDir);
			aliases = { $lib: 'src/lib', ...(opts.aliases ?? {}) };
		},

		buildStart() {
			build();
		},

		configureServer(devServer) {
			server = devServer;
			build();
			const watcher = devServer.watcher;

			const onChange = async (file: string) => {
				if (!/\.(svelte|ts|js)$/.test(file)) return;
				build();
				invalidateManifestModule();
				if (!isLocaleFile(file)) return;

				const mods = devServer.moduleGraph.getModulesByFile(file);
				if (mods) {
					for (const m of mods) devServer.moduleGraph.invalidateModule(m);
				}
				invalidateDictionaryModule();

				const base = file.split(/[\\/]/).pop() ?? '';
				const code = base.replace(/\.(svelte\.)?(ts|js)$/, '');
				let dict: unknown;
				try {
					const mod = await devServer.ssrLoadModule(file);
					dict = (mod as { default?: unknown }).default ?? mod;
				} catch {
					dict = undefined;
				}
				if (dict === undefined) return;
				devServer.ws.send({
					type: 'custom',
					event: 'svelte-i18n:locale-changed',
					data: { code, dict }
				});
			};
			watcher.on('add', onChange);
			watcher.on('change', onChange);
			watcher.on('unlink', onChange);
		},

		transform(code, id) {
			if (!MANIFEST_FILE_RE.test(id)) return undefined;
			if (!code.includes(MANIFEST_SENTINEL)) return undefined;
			manifestModuleIds.add(id);
			return {
				code: `export const manifest = ${JSON.stringify(manifest)};\n`,
				map: null
			};
		},

		handleHotUpdate(ctx) {
			if (isLocaleFile(ctx.file)) return [];
			return undefined;
		}
	};
}
