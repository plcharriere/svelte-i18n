import { getCurrentConfig } from './config.ts';
import { getI18nContext } from './context.svelte.ts';
import { suspendInterception } from './intercept.ts';
import { extractPathLocale } from './path-locale.ts';
import { getActiveLocale } from './active-locale.ts';
import { warn } from './warnings.ts';
import type { LanguageCode, LocaleInfo } from './types.ts';

// Public active-locale API. Reads from the resolved config singleton plus the
// locale signal (context / ALS) — no arguments needed at the call site.

export function getCurrentLocale(): LocaleInfo {
	const config = getCurrentConfig();
	const code = getActiveLocale() ?? config.defaultLanguage;
	const def = config.languages[code] ?? config.languages[config.defaultLanguage];
	return {
		code: def.code,
		label: def.label,
		nativeLabel: def.nativeLabel,
		rtl: def.rtl
	};
}

export function getLocales(): LocaleInfo[] {
	const config = getCurrentConfig();
	return config.codes.map((code) => {
		const def = config.languages[code];
		return {
			code: def.code,
			label: def.label,
			nativeLabel: def.nativeLabel,
			rtl: def.rtl
		};
	});
}

async function kit() {
	return await import('$app/navigation');
}

export async function setLocale(code: LanguageCode): Promise<void> {
	const config = getCurrentConfig();
	if (!config.languages[code]) {
		warn('unknown-locale', `setLocale called with unknown code "${code}".`);
		return;
	}

	if (config.mode === 'path') {
		if (typeof window === 'undefined') return;
		const { goto } = await kit();
		const current = window.location.pathname;
		const { rest } = extractPathLocale(current, config);
		const prefix = code === config.defaultLanguage ? '' : `/${code}`;
		// Preserve the page's own trailing-slash shape when re-prefixing:
		// `/` → `/<code>/`, `/about` → `/<code>/about`. Matches the output
		// of `beforeNavigate` in context.svelte.ts so both entry points
		// agree on canonical form.
		const target =
			`${prefix}${rest}${window.location.search}${window.location.hash}` || '/';
		const release = suspendInterception();
		try {
			await goto(target, { invalidateAll: true });
		} finally {
			release();
		}
		const ctx = getI18nContext();
		if (ctx) ctx.code = code;
		return;
	}

	if (config.mode === 'cookie') {
		if (typeof window === 'undefined') return;
		const { goto, invalidateAll } = await kit();
		document.cookie = `${config.cookieName}=${encodeURIComponent(
			code
		)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
		const ctx = getI18nContext();
		if (ctx) ctx.code = code;

		// `?lang=` is an inbound SEO / shareable-URL signal — cookie is the
		// source of truth for in-app switches. If the URL still asserts a
		// locale, strip it before invalidating; otherwise the server handle
		// reads the stale param on the refetch and re-persists the old
		// locale, overwriting the cookie we just wrote.
		const url = new URL(window.location.href);
		if (url.searchParams.has('lang')) {
			url.searchParams.delete('lang');
			await goto(url.pathname + url.search + url.hash, {
				replaceState: true,
				invalidateAll: true
			});
		} else {
			await invalidateAll();
		}
		return;
	}

	if (config.mode === 'domain') {
		const def = config.languages[code];
		if (!def.domains || def.domains.length === 0) {
			warn(
				'no-domain-mapping',
				`Locale "${code}" has no configured domain; setLocale is a no-op.`
			);
			return;
		}
		if (typeof window === 'undefined') return;
		const target = new URL(window.location.href);
		target.host = def.domains[0];
		window.location.href = target.toString();
	}
}
