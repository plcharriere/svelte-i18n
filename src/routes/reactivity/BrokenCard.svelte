<script lang="ts">
	import { t } from '../../i18n';

	let { product }: { product: { name: string; price: number; inStock: boolean } } = $props();

	// BROKEN — `t()` is called once during component init. The returned strings
	// are captured into these `const`s and never re-evaluated, so switching the
	// active locale leaves this card stuck on the locale it first rendered in.
	// svelte-ignore state_referenced_locally
	const addToCartLabel = t('reactivity.addToCart');
	// svelte-ignore state_referenced_locally
	const outOfStockLabel = t('reactivity.outOfStock');
	// svelte-ignore state_referenced_locally
	const priceLabel = t('reactivity.price', { amount: product.price });
</script>

<article class="product broken">
	<h3>{product.name}</h3>
	<p class="price">{priceLabel}</p>
	{#if product.inStock}
		<button type="button">{addToCartLabel}</button>
	{:else}
		<span class="oos">{outOfStockLabel}</span>
	{/if}
</article>

<style>
	.product {
		border: 1px solid var(--danger);
		border-radius: 8px;
		padding: 0.9rem 1rem;
		background: #fef2f2;
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
		border: 1px solid var(--danger);
		color: var(--danger);
		background: white;
		border-radius: 6px;
		padding: 0.3rem 0.75rem;
		cursor: pointer;
	}
	.oos {
		color: var(--danger);
		font-weight: 600;
		font-size: 0.9rem;
	}
</style>
