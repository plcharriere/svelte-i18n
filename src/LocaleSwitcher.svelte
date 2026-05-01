<script lang="ts">
	import { getCurrentLocale, getLocales, isLoadingLocale, setLocale, t } from './i18n';

	const locales = getLocales();
	const active = $derived(getCurrentLocale().code);
</script>

<div class="switcher" role="group" aria-label={t('common.language')}>
	{#each locales as locale (locale.code)}
		<button
			type="button"
			class="pill"
			class:active={active === locale.code}
			aria-pressed={active === locale.code}
			aria-busy={isLoadingLocale(locale.code)}
			onclick={() => setLocale(locale.code)}
		>
			{locale.nativeLabel ?? locale.code}
		</button>
	{/each}
</div>

<style>
	.switcher {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin: 0 0 1.5rem;
	}
	.pill {
		font: inherit;
		font-size: 0.85rem;
		padding: 0.35rem 0.75rem;
		border: 1px solid var(--border);
		background: var(--card);
		color: var(--fg);
		border-radius: 999px;
		cursor: pointer;
		transition:
			color 0.15s ease,
			background 0.15s ease,
			border-color 0.15s ease;
	}
	.pill:hover:not(:disabled) {
		border-color: var(--accent);
	}
	.pill.active {
		background: var(--accent);
		border-color: var(--accent);
		color: #fff;
		font-weight: 600;
	}
	.pill:disabled {
		opacity: 0.6;
		cursor: progress;
	}
</style>
