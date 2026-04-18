<script lang="ts">
	import { page } from '$app/state';
	import { createI18nContext } from './context.svelte.ts';
	import type { I18nPageData } from './types.ts';

	// Read the library's slice of page data from `page.data.i18n`. Keeping it
	// namespaced leaves `page.data.seo`, `.user`, etc. free for userland.
	const read = () =>
		(page.data as { i18n: I18nPageData }).i18n;

	createI18nContext(read);
</script>

<svelte:head>
	{#if read().seo}
		{@const seo = read().seo!}
		<link rel="canonical" href={seo.canonical} />
		{#each seo.alternates as alt (alt.hreflang)}
			<link rel="alternate" hreflang={alt.hreflang} href={alt.href} />
		{/each}
		{#if seo.xDefault}
			<link rel="alternate" hreflang="x-default" href={seo.xDefault} />
		{/if}
	{/if}
</svelte:head>
