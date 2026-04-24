<script lang="ts">
	import { t } from '../../i18n';

	let {
		product,
		onAdd
	}: {
		product: { name: string; price: number; inStock: boolean };
		onAdd: (name: string) => void;
	} = $props();

	// CORRECT — `$derived` wraps the `t()` call in a reactive getter; each
	// read re-runs when the active locale `$state` changes.
	const priceLabel = $derived(t('reactivity.price', { amount: product.price }));
</script>

<article class="product correct">
	<h3>{product.name}</h3>
	<p class="price">{priceLabel}</p>
	{#if product.inStock}
		<!-- Inline template calls are also reactive — no `$derived` needed. -->
		<button type="button" onclick={() => onAdd(product.name)}>{t('reactivity.addToCart')}</button>
	{:else}
		<span class="oos">{t('reactivity.outOfStock')}</span>
	{/if}
</article>

<style>
	.product {
		border: 1px solid var(--ok);
		border-radius: 8px;
		padding: 0.9rem 1rem;
		background: #ecfdf5;
	}
	h3 {
		margin: 0 0 0.25rem;
		font-size: 1rem;
	}
	.price {
		margin: 0 0 0.6rem;
		color: var(--muted);
		font-size: 0.9rem;
	}
	button {
		font: inherit;
		border: 1px solid var(--ok);
		color: var(--ok);
		background: white;
		border-radius: 6px;
		padding: 0.3rem 0.75rem;
		cursor: pointer;
	}
	.oos {
		color: var(--ok);
		font-weight: 600;
		font-size: 0.9rem;
	}
</style>
