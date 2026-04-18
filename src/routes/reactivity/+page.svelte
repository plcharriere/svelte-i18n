<script lang="ts">
	import { t } from '../../i18n';
	import BrokenCard from './BrokenCard.svelte';
	import CorrectCard from './CorrectCard.svelte';

	const product = {
		name: 'Widget 3000',
		price: 29.99,
		inStock: true
	};
	const soldOut = {
		name: 'Gizmo Deluxe',
		price: 49.5,
		inStock: false
	};
</script>

<svelte:head>
	<title>{t('reactivity.heading')}</title>
</svelte:head>

<h1>{t('reactivity.heading')}</h1>
<p class="muted">{t('reactivity.explain')}</p>

<div class="grid grid-2">
	<section class="card column">
		<h2>{t('reactivity.brokenTitle')}</h2>
		<div class="stack">
			<BrokenCard {product} />
			<BrokenCard product={soldOut} />
		</div>
	</section>

	<section class="card column">
		<h2>{t('reactivity.correctTitle')}</h2>
		<div class="stack">
			<CorrectCard {product} />
			<CorrectCard product={soldOut} />
		</div>
	</section>
</div>

<style>
	.column h2 {
		font-size: 1rem;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
	}
</style>
