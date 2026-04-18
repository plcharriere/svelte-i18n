<script lang="ts">
	import { t } from '../../i18n';
</script>

<svelte:head>
	<title>{t('about.title')}</title>
</svelte:head>

<h1>{t('about.title')}</h1>
<section class="card">
	<p>{t('about.body')}</p>
	<p class="muted small">{t('about.hint')}</p>
</section>

<style>
	.small {
		font-size: 0.9rem;
	}
</style>
