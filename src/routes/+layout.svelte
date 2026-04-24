<script lang="ts">
	import { page } from '$app/state';
	import { I18n, getCurrentLocale, getLocales, setLocale } from '$lib';
	import { t } from '../i18n';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const locales = getLocales();
	const current = $derived(getCurrentLocale().code);

	// The reroute strips the locale prefix, so `page.route.id` is the
	// canonical path ("/", "/cart", "/formatting", ...). Compare against that
	// so `/fr/cart` and `/cart` both highlight "Cart".
	const activeRoute = $derived(page.route.id ?? '/');
	function isActive(href: string) {
		return href === '/' ? activeRoute === '/' : activeRoute === href;
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
		<label class="locale-select">
			<span class="sr">{t('common.language')}</span>
			<select
				value={current}
				onchange={(e) =>
					setLocale((e.currentTarget as HTMLSelectElement).value)}
			>
				{#each locales as loc (loc.code)}
					<option value={loc.code}>
						{loc.nativeLabel ?? loc.code}
					</option>
				{/each}
			</select>
		</label>
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
		.locale-select { grid-area: locale; }
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
