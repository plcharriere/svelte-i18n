<script lang="ts">
	import LocaleSwitcher from '../../LocaleSwitcher.svelte';
	import { pageTitle } from '../../page-title';
	import { getCurrentLocale, t } from '../../i18n';

	let now = $state(new Date());
	let amount = $state(1234.5);
	let count = $state(1_250_000);
	let ratio = $state(0.185);

	function tick() {
		now = new Date();
	}
</script>

<svelte:head>
	<title>{pageTitle(t('formatting.title'))}</title>
</svelte:head>

<h1>{t('formatting.title')}</h1>
<p class="muted">{t('formatting.subtitle')}</p>

<LocaleSwitcher />

<p class="meta">
	<strong>{t('formatting.localeLabel')}:</strong>
	<code>{getCurrentLocale().code}</code>
</p>

<section class="card">
	<h2>{t('formatting.dateTime')}</h2>
	<div class="row">
		<button class="primary" type="button" onclick={tick}>
			{t('formatting.refreshNow')}
		</button>
	</div>
	<table class="kv">
		<tbody>
			<tr>
				<th>{t('formatting.dateLabel')}</th>
				<td>{t('formatting.date', { d: now })}</td>
			</tr>
			<tr>
				<th>{t('formatting.timeLabel')}</th>
				<td>{t('formatting.time', { d: now })}</td>
			</tr>
			<tr>
				<th>{t('formatting.dateFull')}</th>
				<td>{t('formatting.dateLong', { d: now })}</td>
			</tr>
		</tbody>
	</table>
</section>

<section class="card">
	<h2>{t('formatting.numbers')}</h2>
	<div class="row">
		<label>
			{t('formatting.amountLabel')}
			<input type="number" step="0.01" bind:value={amount} />
		</label>
		<label>
			{t('formatting.countLabel')}
			<input type="number" step="1" bind:value={count} />
		</label>
		<label>
			{t('formatting.ratioLabel')}
			<input type="number" step="0.01" min="0" max="1" bind:value={ratio} />
		</label>
	</div>
	<table class="kv">
		<tbody>
			<tr>
				<th>{t('formatting.numberLabel')}</th>
				<td>{t('formatting.number', { n: count })}</td>
			</tr>
			<tr>
				<th>{t('formatting.currencyLabel')}</th>
				<td>{t('formatting.currency', { amount })}</td>
			</tr>
			<tr>
				<th>{t('formatting.percentLabel')}</th>
				<td>{t('formatting.percent', { n: ratio })}</td>
			</tr>
		</tbody>
	</table>
</section>

<p class="muted small">{t('formatting.footnote')}</p>

<style>
	.meta {
		margin: 1rem 0 2rem;
	}
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
	.small {
		font-size: 0.85rem;
		margin-top: 1.5rem;
	}
	section.card + section.card {
		margin-top: 1.5rem;
	}
</style>
