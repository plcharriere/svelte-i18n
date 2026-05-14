<script lang="ts">
	import { page } from '$app/state';
	import { setupI18n } from './client.svelte.ts';
	import type { I18nPageData } from './types.ts';

	const read = () => (page.data as { i18n: I18nPageData }).i18n;
	const seo = $derived(read().seo);

	setupI18n(read);
</script>

<svelte:head>
	{#if seo}
		<link rel="canonical" href={seo.canonical} />
		{#each seo.alternates as alt (alt.hreflang)}
			<link rel="alternate" hreflang={alt.hreflang} href={alt.href} />
		{/each}
		{#if seo.xDefault}
			<link rel="alternate" hreflang="x-default" href={seo.xDefault} />
		{/if}
	{/if}
</svelte:head>
