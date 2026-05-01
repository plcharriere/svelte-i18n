<script lang="ts">
	import LocaleSwitcher from '../../LocaleSwitcher.svelte';
	import { pageTitle } from '../../page-title';
	import { t } from '../../i18n';

	let place = $state(1);
	const podium = [1, 2, 3, 4, 11, 21, 22, 23];
</script>

<svelte:head>
	<title>{pageTitle(t('ordinals.title'))}</title>
</svelte:head>

<h1>{t('ordinals.title')}</h1>
<p class="muted">{t('ordinals.subtitle')}</p>

<LocaleSwitcher />

<section class="card">
	<h2>{t('ordinals.playground')}</h2>
	<label>
		{t('ordinals.placeLabel')}
		<input type="number" min="1" max="999" bind:value={place} />
	</label>
	<p class="result">{t('ordinals.rank', { place })}</p>
</section>

<section class="card">
	<h2>{t('ordinals.series')}</h2>
	<ul class="series">
		{#each podium as n (n)}
			<li><code>{n}</code> → {t('ordinals.rank', { place: n })}</li>
		{/each}
	</ul>
	<p class="muted small">{t('ordinals.note')}</p>
</section>

<style>
	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.9rem;
		color: var(--muted);
		max-width: 140px;
	}
	.result {
		margin-top: 1rem;
		font-size: 1.4rem;
		font-weight: 600;
	}
	.series {
		list-style: none;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 0.5rem 1rem;
	}
	.small {
		font-size: 0.85rem;
	}
	section.card + section.card {
		margin-top: 1.5rem;
	}
</style>
