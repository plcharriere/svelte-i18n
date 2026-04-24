<script lang="ts">
	import { page } from '$app/state';
	import { pageTitle } from '../../page-title';
	import { t } from '../../i18n';

	const seo = $derived(page.data.i18n?.seo);
</script>

<svelte:head>
	<title>{pageTitle(t('seo.title'))}</title>
</svelte:head>

<h1>{t('seo.title')}</h1>
<p class="muted">{t('seo.subtitle')}</p>

{#if !seo}
	<section class="card">
		<p>{t('seo.disabled')}</p>
	</section>
{:else}
	<section class="card">
		<h2>{t('seo.canonicalLabel')}</h2>
		<p class="url">{seo.canonical}</p>
	</section>

	<section class="card">
		<h2>{t('seo.alternatesLabel')}</h2>
		<table class="kv">
			<tbody>
				{#each seo.alternates as alt (alt.hreflang)}
					<tr>
						<th><code>hreflang="{alt.hreflang}"</code></th>
						<td class="url">{alt.href}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>

	<section class="card">
		<h2>{t('seo.xDefaultLabel')}</h2>
		<p class="url">{seo.xDefault}</p>
	</section>

	<section class="card">
		<h2>{t('seo.renderedLabel')}</h2>
		<p class="muted small">{t('seo.renderedBody')}</p>
		<pre><code>&lt;link rel="canonical" href="{seo.canonical}" /&gt;
{#each seo.alternates as alt (alt.hreflang)}&lt;link rel="alternate" hreflang="{alt.hreflang}" href="{alt.href}" /&gt;
{/each}&lt;link rel="alternate" hreflang="x-default" href="{seo.xDefault}" /&gt;</code></pre>
	</section>
{/if}

<style>
	section.card + section.card {
		margin-top: 1.5rem;
	}
	.url {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.9rem;
		word-break: break-all;
	}
	.small {
		font-size: 0.85rem;
	}
	pre {
		background: #f3f4f6;
		padding: 0.75rem 1rem;
		border-radius: 6px;
		overflow-x: auto;
		font-size: 0.85rem;
		line-height: 1.5;
	}
</style>
