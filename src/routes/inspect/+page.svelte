<script lang="ts">
	import { page } from '$app/state';
	import type { Dictionary, I18nPageData } from '$lib';
	import LocaleSwitcher from '../../LocaleSwitcher.svelte';
	import { pageTitle } from '../../page-title';
	import { getCurrentLocale, t } from '../../i18n';

	function flatten(obj: Dictionary, prefix = ''): Array<{ key: string; value: string }> {
		const out: Array<{ key: string; value: string }> = [];
		for (const k of Object.keys(obj)) {
			const v = obj[k];
			const path = prefix ? `${prefix}.${k}` : k;
			if (typeof v === 'string') out.push({ key: path, value: v });
			else if (v && typeof v === 'object')
				out.push(...flatten(v as Dictionary, path));
		}
		return out;
	}

	const i18n = $derived(
		(page.data as { i18n?: I18nPageData }).i18n ?? {
			locale: '',
			rtl: false,
			dictionaries: {}
		}
	);
	const activeCode = $derived(getCurrentLocale().code);
	const localeCodes = $derived(Object.keys(i18n.dictionaries ?? {}));
	const routeId = $derived(page.route.id ?? '/');
	const bytes = $derived(JSON.stringify(i18n.dictionaries ?? {}).length);
</script>

<svelte:head>
	<title>{pageTitle(t('nav.inspect'))}</title>
</svelte:head>

<h1>{t('nav.inspect')}</h1>
<p class="muted">{t('inspect.subtitle')}</p>

<LocaleSwitcher />

<section class="card">
	<table class="kv">
		<tbody>
			<tr><th>{t('inspect.routeLabel')}</th><td><code>{routeId}</code></td></tr>
			<tr><th>{t('inspect.activeLabel')}</th><td><code>{activeCode}</code></td></tr>
			<tr>
				<th>{t('inspect.chainLabel')}</th>
				<td><code>{localeCodes.join(' → ')}</code></td>
			</tr>
			<tr>
				<th>{t('inspect.payloadLabel')}</th>
				<td>{t('inspect.payload', { bytes })}</td>
			</tr>
		</tbody>
	</table>
</section>

{#each localeCodes as code (code)}
	{@const entries = flatten((i18n.dictionaries ?? {})[code] ?? {})}
	<section class="card">
		<h2>
			<code>{code}</code>
			<span class="count">{t('inspect.keyCount', { count: entries.length })}</span>
			{#if code === activeCode}<span class="badge">{t('inspect.activeBadge')}</span>{/if}
		</h2>
		{#if entries.length === 0}
			<p class="muted small">{t('inspect.noKeys')}</p>
		{:else}
			<table class="kv">
				<tbody>
					{#each entries as { key, value } (key)}
						<tr>
							<th><code>{key}</code></th>
							<td><pre>{value}</pre></td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>
{/each}

<style>
	section.card + section.card {
		margin-top: 1.5rem;
	}
	h2 {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		font-size: 1rem;
	}
	.count {
		color: var(--muted);
		font-weight: 400;
		font-size: 0.9rem;
	}
	.badge {
		font-size: 0.7rem;
		background: var(--accent);
		color: white;
		padding: 0.1rem 0.4rem;
		border-radius: 4px;
		font-weight: 600;
		letter-spacing: 0.02em;
	}
	.small {
		font-size: 0.9rem;
	}
	table.kv pre {
		margin: 0;
		font-size: 0.85rem;
		white-space: pre-wrap;
		word-break: break-word;
	}
	table.kv th code {
		word-break: break-all;
	}
</style>
