import { beforeNavigate, goto } from '$app/navigation';
import { setClientLocaleAccessor } from './active-locale.ts';
import { primeDictionary } from './dictionary.ts';
import { extractPathLocale } from './path-locale.ts';
import { peekCurrentConfig } from './config.ts';
import { isInterceptionSuspended } from './intercept.ts';
import type {
	Dictionary,
	I18nPageData,
	LanguageCode,
	ResolvedI18nConfig
} from './types.ts';

export type I18nContext = {
	get code(): LanguageCode;
	set code(value: LanguageCode);
};

let code = $state<LanguageCode | undefined>(undefined);

// Register as the client locale source only in the browser. On the server
// this module is still imported (SSR renders components that use `$state`),
// but leaving the slot empty means `getActiveLocale()` falls straight
// through to the ALS-backed server accessor and can never read module-level
// state that would be shared across concurrent requests.
if (typeof window !== 'undefined') {
	setClientLocaleAccessor(() => code);
}

const store: I18nContext = {
	get code() {
		const c = code ?? peekCurrentConfig()?.defaultLanguage;
		if (!c) {
			throw new Error(
				'[svelte-i18n] Active locale requested before createI18n() was called.'
			);
		}
		return c;
	},
	set code(value: LanguageCode) {
		code = value;
	}
};

let primedForLocale: LanguageCode | undefined = undefined;

function primeChain(data: I18nPageData): void {
	if (!data.dictionaries) return;
	for (const [c, dict] of Object.entries(data.dictionaries)) {
		primeDictionary(c, dict as Dictionary);
	}
	primedForLocale = data.locale;
}

export function createI18nContext(
	source: I18nPageData | (() => I18nPageData)
): I18nContext {
	const read = typeof source === 'function' ? source : () => source;
	if (typeof window === 'undefined') return store;

	// Seed synchronously so the very first render sees primed dictionaries
	// and the correct active locale — effects run after the initial template
	// pass. Guarded by `primedForLocale` so subsequent mounts are no-ops.
	const initial = read();
	if (code === undefined) code = initial.locale;
	if (primedForLocale !== initial.locale) primeChain(initial);

	$effect.pre(() => {
		const data = read();
		// Re-prime only when the locale actually changes. Same-locale nav is a
		// no-op — no dictionary work, no unnecessary reactivity churn.
		// Keyed off `data.locale` (a primitive) because `$props` proxies don't
		// guarantee stable-identity comparison for nested object fields.
		if (primedForLocale !== data.locale) primeChain(data);
		if (code !== data.locale) code = data.locale;
	});

	$effect(() => {
		if (typeof document === 'undefined') return;
		const data = read();
		document.documentElement.lang = data.locale;
		document.documentElement.dir = data.rtl ? 'rtl' : 'ltr';

		// Re-apply the server's anchor rewrite in the DOM. `transformPageChunk`
		// only runs on full SSR responses, so after a client-side locale switch
		// the rendered DOM still shows the template's literal `href="/about"`.
		// Walk all anchors and re-prefix — keeps hover previews, copy-link,
		// and middle-click-open-in-tab consistent with the beforeNavigate
		// interceptor's click behavior.
		const config = peekCurrentConfig();
		if (config?.mode === 'path') rewriteAnchors(data.locale, config);
	});

	// `beforeNavigate` is mount-scoped — SvelteKit auto-unregisters it when
	// this component unmounts. No dedup guard needed, and re-registering on
	// remount is correct (previous handler is already gone).
	if (typeof window !== 'undefined') {
		beforeNavigate((nav) => {
			if (isInterceptionSuspended()) return;
			if (nav.cancel === undefined || !nav.to) return;
			if (nav.to.url.origin !== window.location.origin) return;

			const config = peekCurrentConfig();
			if (!config || config.mode !== 'path') return;

			const { code: urlCode } = extractPathLocale(nav.to.url.pathname, config);
			if (urlCode) return;

			const active = store.code;
			if (active === config.defaultLanguage) return;

			nav.cancel();
			const prefix = `/${active}`;
			// Preserve the destination's trailing-slash shape: `/` → `/<code>/`,
			// `/about` → `/<code>/about`. `/` with no prefix means "directory
			// root", so the prefixed form should keep that semantic.
			const target = `${prefix}${nav.to.url.pathname}${nav.to.url.search}${nav.to.url.hash}`;
			goto(target, { replaceState: false });
		});
	}

	return store;
}

export function getI18nContext(): I18nContext | undefined {
	if (code === undefined) return undefined;
	return store;
}

// Walk every `<a href="/...">` in the DOM and rewrite to the current locale.
// Idempotent — we always strip any existing locale prefix first, so switching
// `fr` → `en` (default) correctly drops `/fr/...` back to `/...`.
function rewriteAnchors(
	current: LanguageCode,
	config: ResolvedI18nConfig
): void {
	const prefix = current === config.defaultLanguage ? '' : `/${current}`;
	const anchors = document.querySelectorAll<HTMLAnchorElement>('a[href]');
	for (const a of anchors) rewriteAnchor(a, prefix, config);
}

function rewriteAnchor(
	a: HTMLAnchorElement,
	prefix: string,
	config: ResolvedI18nConfig
): void {
	const href = a.getAttribute('href');
	if (!href || !href.startsWith('/') || href.startsWith('//')) return;
	const { rest } = extractPathLocale(href, config);
	const path = rest === '/' ? '/' : rest;
	const target = `${prefix}${path}`;
	if (a.getAttribute('href') !== target) a.setAttribute('href', target);
}

