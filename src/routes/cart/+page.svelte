<script lang="ts">
	import { pageTitle } from '../../page-title';
	import { t } from '../../i18n';

	let itemsCount = $state(1);
	let discountCount = $state(0);
	let gender = $state<'male' | 'female' | 'other'>('female');
</script>

<svelte:head>
	<title>{pageTitle(t('cart.title'))}</title>
</svelte:head>

<h1>{t('cart.title')}</h1>
<p class="muted">{t('cart.subtitle')}</p>

<section class="card">
	<h2>{t('cart.playground')}</h2>
	<div class="row">
		<label>
			{t('cart.itemsLabel')}
			<input type="number" min="0" bind:value={itemsCount} />
		</label>
		<label>
			{t('cart.discountsLabel')}
			<input type="number" min="0" bind:value={discountCount} />
		</label>
	</div>

	{#if itemsCount === 0}
		<p class="empty">{t('cart.empty')}</p>
	{/if}

	<ul class="results">
		<li>{t('cart.items', { count: itemsCount })}</li>
		<li>{t('cart.available', { count: discountCount })}</li>
		<li>{t('cart.summary', { itemsCount, discountCount })}</li>
	</ul>
</section>

<section class="card">
	<h2>{t('cart.selectSectionTitle')}</h2>
	<div class="row">
		<label>
			{t('cart.genderLabel')}
			<select bind:value={gender}>
				<option value="male">{t('profile.genderOptions.male')}</option>
				<option value="female">{t('profile.genderOptions.female')}</option>
				<option value="other">{t('profile.genderOptions.other')}</option>
			</select>
		</label>
	</div>
	<p class="result">{t('profile.pronoun', { gender })}</p>
</section>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1rem;
		align-items: end;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.9rem;
		color: var(--muted);
	}
	.empty {
		color: var(--danger);
		font-style: italic;
	}
	.results {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 0.5rem;
	}
	.results li {
		padding: 0.5rem 0.75rem;
		background: #f8fafc;
		border-radius: 6px;
		font-size: 0.95rem;
	}
	.result {
		font-size: 1.15rem;
		margin-top: 0.5rem;
	}
	section.card + section.card {
		margin-top: 1.5rem;
	}
</style>
