<script lang="ts">
	import LocaleSwitcher from '../../locale-switcher.svelte';
	import { pageTitle } from '../../page-title';
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

	let modalOpen = $state(false);
	let modalProduct = $state('');
	function handleAdd(name: string) {
		modalProduct = name;
		modalOpen = true;
	}

	const brokenExample = `<script>
  // captured once, frozen for the component's lifetime
  const label = t('reactivity.addToCart');
<\/script>

<button>{label}</button>`;

	const correctExample = `<script>
  // re-runs when locale or dict changes
  const label = $derived(t('reactivity.addToCart'));
<\/script>

<!-- or inline, also reactive -->
<button>{label}</button>
<button>{t('reactivity.addToCart')}</button>`;
</script>

<svelte:head>
	<title>{pageTitle(t('reactivity.heading'))}</title>
</svelte:head>

<h1>{t('reactivity.heading')}</h1>
<p class="muted">{t('reactivity.explain')}</p>

<LocaleSwitcher />

<div class="grid grid-2">
	<section class="card column broken-column">
		<h2>{t('reactivity.brokenTitle')}</h2>
		<pre><code>{brokenExample}</code></pre>
		<div class="stack">
			<BrokenCard {product} onAdd={handleAdd} />
			<BrokenCard product={soldOut} onAdd={handleAdd} />
		</div>
	</section>

	<section class="card column correct-column">
		<h2>{t('reactivity.correctTitle')}</h2>
		<pre><code>{correctExample}</code></pre>
		<div class="stack">
			<CorrectCard {product} onAdd={handleAdd} />
			<CorrectCard product={soldOut} onAdd={handleAdd} />
		</div>
	</section>
</div>

{#if modalOpen}
	<div
		class="modal-backdrop"
		role="dialog"
		aria-modal="true"
		aria-labelledby="add-modal-title"
		tabindex="-1"
		onclick={(e) => {
			if (e.target === e.currentTarget) modalOpen = false;
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') modalOpen = false;
		}}
	>
		<div class="modal">
			<h2 id="add-modal-title">{t('modal.title')}</h2>
			<p>{t('modal.body', { name: modalProduct })}</p>
			<button type="button" onclick={() => (modalOpen = false)}>
				{t('modal.close')}
			</button>
		</div>
	</div>
{/if}

<style>
	.column h2 {
		font-size: 1rem;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
	}
	.column pre {
		background: var(--subtle);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 0.75rem 1rem;
		margin: 0 0 1rem;
		font-size: 0.8rem;
		overflow-x: auto;
		line-height: 1.5;
	}
	.broken-column pre {
		border-left: 3px solid var(--danger);
	}
	.correct-column pre {
		border-left: 3px solid var(--ok);
	}
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(17, 24, 39, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		z-index: 100;
	}
	.modal {
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 1.5rem;
		max-width: 32rem;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
	}
	.modal h2 {
		margin: 0 0 0.5rem;
		font-size: 1.1rem;
	}
	.modal p {
		margin: 0 0 1rem;
	}
	.modal button {
		font: inherit;
		padding: 0.4rem 0.9rem;
		border: 1px solid var(--border);
		background: var(--card);
		color: var(--fg);
		border-radius: 6px;
		cursor: pointer;
	}
	.modal button:hover {
		border-color: var(--accent);
	}
</style>
