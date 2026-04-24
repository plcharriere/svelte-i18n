<script lang="ts">
	import { getCurrentLocale } from '$lib';
	import { t } from '../i18n';
</script>

<svelte:head>
	<title>{t('home.title')}</title>
</svelte:head>

<section class="hero">
	<h1>{t('home.title')}</h1>
	<p class="tagline">{t('home.tagline')}</p>
	<p class="muted small">
		{t('home.active', { code: getCurrentLocale().code })}
	</p>
</section>

<section class="grid grid-2">
	<a class="card feature" href="/cart">
		<h2>{t('home.features.cart.title')}</h2>
		<p class="muted">{t('home.features.cart.body')}</p>
	</a>
	<a class="card feature" href="/formatting">
		<h2>{t('home.features.formatting.title')}</h2>
		<p class="muted">{t('home.features.formatting.body')}</p>
	</a>
	<a class="card feature" href="/ordinals">
		<h2>{t('home.features.ordinals.title')}</h2>
		<p class="muted">{t('home.features.ordinals.body')}</p>
	</a>
	<a class="card feature" href="/reactivity">
		<h2>{t('home.features.reactivity.title')}</h2>
		<p class="muted">{t('home.features.reactivity.body')}</p>
	</a>
	<a class="card feature" href="/seo">
		<h2>{t('home.features.seo.title')}</h2>
		<p class="muted">{t('home.features.seo.body')}</p>
	</a>
	<a class="card feature" href="/inspect">
		<h2>{t('home.features.inspect.title')}</h2>
		<p class="muted">{t('home.features.inspect.body')}</p>
	</a>
</section>

<style>
	.hero {
		margin-bottom: 2rem;
	}
	.tagline {
		font-size: 1.15rem;
		color: var(--muted);
		margin-top: 0;
	}
	.feature {
		display: block;
		color: inherit;
		transition:
			border-color 0.15s ease,
			transform 0.15s ease;
	}
	.feature:hover {
		text-decoration: none;
		border-color: var(--accent);
		transform: translateY(-1px);
	}
	.feature h2 {
		color: var(--accent);
	}
	.feature p {
		margin: 0;
	}
</style>
