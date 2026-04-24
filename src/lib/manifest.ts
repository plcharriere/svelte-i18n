import type { I18nKeyManifest } from './hooks.ts';

// The Vite plugin identifies this file by the sentinel string below — must
// stay in sync with `MANIFEST_SENTINEL` in `plugin.ts`. The `__slot` export
// is only a carrier to keep the string in the compiled source (comments
// can be stripped by upstream loaders). Plugin replaces the whole file at
// transform time, so `__slot` never ends up in the output. Without the
// plugin, `manifest` stays empty and the library skips per-route pruning.
export const __slot = '@svelte-i18n-manifest-slot';

export const manifest: I18nKeyManifest = { routes: {} };
