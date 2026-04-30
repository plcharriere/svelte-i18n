<script lang="ts">
	import { page } from '$app/state';
	import { I18n, getCurrentLocale, getLocales, setLocale } from '$lib';
	import { t } from '../i18n';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const locales = getLocales();
	const current = $derived(getCurrentLocale().code);

	const activeRoute = $derived(page.route.id);
	function isActive(href: string) {
		return activeRoute === href;
	}
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" />
</svelte:head>

<I18n />

<header class="site-header">
	<div class="header-inner">
		<a class="brand" href="/">svelte-i18n</a>
		<nav class="site-nav" aria-label="Main">
			<a href="/" class:active={isActive('/')} aria-current={isActive('/') ? 'page' : undefined}>{t('nav.home')}</a>
			<a href="/cart" class:active={isActive('/cart')} aria-current={isActive('/cart') ? 'page' : undefined}>{t('nav.cart')}</a>
			<a href="/formatting" class:active={isActive('/formatting')} aria-current={isActive('/formatting') ? 'page' : undefined}>{t('nav.formatting')}</a>
			<a href="/ordinals" class:active={isActive('/ordinals')} aria-current={isActive('/ordinals') ? 'page' : undefined}>{t('nav.ordinals')}</a>
			<a href="/reactivity" class:active={isActive('/reactivity')} aria-current={isActive('/reactivity') ? 'page' : undefined}>{t('nav.reactivity')}</a>
			<a href="/seo" class:active={isActive('/seo')} aria-current={isActive('/seo') ? 'page' : undefined}>{t('nav.seo')}</a>
			<a href="/inspect" class:active={isActive('/inspect')} aria-current={isActive('/inspect') ? 'page' : undefined}>{t('nav.inspect')}</a>
		</nav>
		<div class="header-right">
			<label class="locale-select">
				<span class="sr">{t('common.language')}</span>
				<select
					value={current}
					onchange={(e) =>
						setLocale((e.currentTarget as HTMLSelectElement).value)}
				>
					{#each locales as locale (locale.code)}
						<option value={locale.code}>
							{locale.nativeLabel ?? locale.code}
						</option>
					{/each}
				</select>
			</label>
			<a
				class="gh-link"
				href="https://github.com/plcharriere/svelte-i18n"
				target="_blank"
				rel="noopener noreferrer"
				aria-label="GitHub"
			>
				<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
					<path
						fill="currentColor"
						d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.95 3.21 9.14 7.66 10.62.56.1.76-.24.76-.54 0-.27-.01-1.16-.02-2.1-3.12.68-3.78-1.32-3.78-1.32-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.93.1-.72.39-1.22.71-1.5-2.49-.28-5.11-1.25-5.11-5.55 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.43.11-2.97 0 0 .94-.3 3.09 1.15.9-.25 1.87-.38 2.83-.38s1.93.13 2.83.38c2.15-1.45 3.09-1.15 3.09-1.15.61 1.54.23 2.69.11 2.97.72.79 1.16 1.79 1.16 3.02 0 4.31-2.62 5.27-5.12 5.55.4.34.76 1.02.76 2.06 0 1.49-.01 2.69-.01 3.05 0 .3.2.65.77.54 4.45-1.48 7.65-5.67 7.65-10.62C23.25 5.48 18.27.5 12 .5Z"
					/>
				</svg>
			</a>
		</div>
	</div>
</header>

<main class="site-main">
	{@render children()}
</main>

<footer class="site-footer">
	<small>{t('common.footer', { year: new Date().getFullYear() })}</small>
</footer>

<style>
	:global(:root) {
		--bg: #fafafa;
		--fg: #111827;
		--muted: #6b7280;
		--border: #e5e7eb;
		--accent: #2563eb;
		--card: #ffffff;
		--ok: #059669;
		--danger: #dc2626;
		--subtle: #f3f4f6;
		font-family:
			system-ui,
			-apple-system,
			'Segoe UI',
			Roboto,
			sans-serif;
	}
	:global(body) {
		margin: 0;
		background: var(--bg);
		color: var(--fg);
		line-height: 1.55;
	}
	:global(a) {
		color: var(--accent);
		text-decoration: none;
	}
	:global(a:hover) {
		text-decoration: underline;
	}
	:global(code) {
		background: var(--subtle);
		padding: 0.1em 0.4em;
		border-radius: 4px;
		font-size: 0.9em;
	}
	:global(h1) {
		font-size: 1.9rem;
		margin: 0 0 0.25rem;
		letter-spacing: -0.02em;
	}
	:global(h2) {
		font-size: 1.1rem;
		margin: 0 0 0.75rem;
	}
	:global(p) {
		margin: 0 0 1rem;
	}
	:global(input), :global(select) {
		font: inherit;
		padding: 0.4rem 0.55rem;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--card);
		color: var(--fg);
	}

	.site-header {
		background: var(--card);
		border-bottom: 1px solid var(--border);
		position: sticky;
		top: 0;
		z-index: 5;
	}
	.header-inner {
		max-width: 960px;
		margin: 0 auto;
		padding: 0.75rem 1.25rem;
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 1.25rem;
	}
	.brand {
		font-weight: 700;
		color: var(--fg);
		letter-spacing: -0.01em;
		font-size: 1rem;
	}
	.site-nav {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
		justify-self: center;
	}
	.site-nav a {
		color: var(--muted);
		font-size: 0.9rem;
		padding: 0.3rem 0.55rem;
		border-radius: 6px;
	}
	.site-nav a:hover {
		color: var(--fg);
		background: var(--subtle);
		text-decoration: none;
	}
	.site-nav a.active {
		color: var(--fg);
		background: var(--subtle);
		font-weight: 600;
	}
	.locale-select select {
		font-size: 0.85rem;
		padding: 0.3rem 0.5rem;
		cursor: pointer;
	}
	.header-right {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	.gh-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--muted);
		padding: 0.4rem;
		border-radius: 8px;
		transition:
			color 0.15s ease,
			background 0.15s ease;
	}
	.gh-link:hover {
		color: var(--fg);
		background: var(--subtle);
		text-decoration: none;
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	@media (max-width: 760px) {
		.header-inner {
			grid-template-columns: 1fr auto;
			grid-template-areas:
				'brand locale'
				'nav nav';
			gap: 0.75rem;
		}
		.brand { grid-area: brand; }
		.header-right { grid-area: locale; }
		.site-nav {
			grid-area: nav;
			justify-self: stretch;
			overflow-x: auto;
			flex-wrap: nowrap;
			scrollbar-width: none;
		}
		.site-nav::-webkit-scrollbar { display: none; }
		.site-nav a { white-space: nowrap; }
	}

	.site-main {
		max-width: 960px;
		margin: 0 auto;
		padding: 2rem 1.25rem 3rem;
	}
	.site-footer {
		max-width: 960px;
		margin: 0 auto;
		padding: 1rem 1.25rem 2rem;
		color: var(--muted);
		border-top: 1px solid var(--border);
	}

	:global(.card) {
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 1.25rem 1.5rem;
	}
	:global(.card > :first-child) {
		margin-top: 0;
	}
	:global(.card > :last-child) {
		margin-bottom: 0;
	}
	:global(.muted) {
		color: var(--muted);
	}
	:global(.small) {
		font-size: 0.88rem;
	}
	:global(.grid) {
		display: grid;
		gap: 1rem;
	}
	:global(.grid-2) {
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
	}
	:global(.grid-3) {
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	}
	:global(.stack > * + *) {
		margin-top: 1rem;
	}
	:global(button.primary) {
		background: var(--accent);
		color: #fff;
		border: 0;
		border-radius: 6px;
		padding: 0.5rem 1rem;
		cursor: pointer;
		font: inherit;
	}
	:global(button.primary:hover) {
		filter: brightness(1.05);
	}
	:global(table.kv) {
		width: 100%;
		border-collapse: collapse;
	}
	:global(table.kv th), :global(table.kv td) {
		text-align: left;
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid var(--border);
		vertical-align: top;
	}
	:global(table.kv tr:last-child th),
	:global(table.kv tr:last-child td) {
		border-bottom: 0;
	}
	:global(table.kv th) {
		color: var(--muted);
		font-weight: 500;
		width: 35%;
	}
</style>
