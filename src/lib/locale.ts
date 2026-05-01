import { getCookieBroadcastChannel } from './broadcast.ts';
import { getCurrentConfig } from './config.ts';
import { getI18nContext } from './context.svelte.ts';
import { suspendInterception } from './intercept.ts';
import { setLoadingLocale } from './loading.svelte.ts';
import { extractPathLocale } from './path-locale.ts';
import { getActiveLocale } from './active-locale.ts';
import { warn } from './warnings.ts';
import type { LocaleCode, LocaleInfo } from './types.ts';

export function getCurrentLocale(): LocaleInfo {
	const config = getCurrentConfig();
	const code = getActiveLocale() ?? config.defaultLocale;
	const def = config.locales[code] ?? config.locales[config.defaultLocale];
	return {
		code: def.code,
		label: def.label,
		nativeLabel: def.nativeLabel,
		rtl: def.rtl
	};
}

export function getDefaultLocale(): LocaleInfo {
	const config = getCurrentConfig();
	const def = config.locales[config.defaultLocale];
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
		const def = config.locales[code];
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

export async function setLocale(code: LocaleCode): Promise<void> {
	const config = getCurrentConfig();
	if (!config.locales[code]) {
		warn('unknown-locale', `setLocale called with unknown code "${code}".`);
		return;
	}

	if (config.mode === 'path') {
		if (typeof window === 'undefined') return;
		setLoadingLocale(code);
		try {
			const { goto } = await kit();
			const current = window.location.pathname;
			const { rest } = extractPathLocale(current, config);
			const prefix = code === config.defaultLocale ? '' : `/${code}`;
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
		} finally {
			setLoadingLocale(undefined);
		}
		return;
	}

	if (config.mode === 'cookie') {
		if (typeof window === 'undefined') return;
		setLoadingLocale(code);
		try {
			const { goto, invalidateAll } = await kit();
			document.cookie = `${config.cookieName}=${encodeURIComponent(
				code
			)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
			const ctx = getI18nContext();
			if (ctx) ctx.code = code;
			getCookieBroadcastChannel()?.postMessage(code);

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
		} finally {
			setLoadingLocale(undefined);
		}
		return;
	}

	if (config.mode === 'domain') {
		const def = config.locales[code];
		if (!def.domains || def.domains.length === 0) {
			warn(
				'no-domain-mapping',
				`Locale "${code}" has no configured domain; setLocale is a no-op.`
			);
			return;
		}
		if (typeof window === 'undefined') return;
		setLoadingLocale(code);
		const target = new URL(window.location.href);
		target.host = def.domains[0];
		window.location.href = target.toString();
	}
}
