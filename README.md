# svelte-i18n

Typed, ICU-aware i18n for **SvelteKit 2 + Svelte 5**. Path / cookie / domain routing, SSR-safe, full types inferred from your locale files — no codegen.

```ts
t('cart.items', { count: 2 });   // ✅ typed from the schema
t('cart.items', { count: '2' }); // ❌ count: number
t('car.items');                  // ❌ autocomplete catches the typo
```

## Install

```sh
npm install @plcharriere/svelte-i18n
```

```sh
pnpm add @plcharriere/svelte-i18n
```

```sh
yarn add @plcharriere/svelte-i18n
```

```sh
bun add @plcharriere/svelte-i18n
```

## Usage

### 1. Write a locale file

```ts
// src/locales/en.ts
import { schema, typed } from '@plcharriere/svelte-i18n';

export default schema({
  nav: { home: 'Home', about: 'About' },
  cart: {
    items: typed<{ count: number }>(
      '{count, plural, one {# item} other {# items}}'
    )
  }
});
```

### 2. Register your locales

```ts
// src/i18n.ts
import { createI18n } from '@plcharriere/svelte-i18n';

export const { t } = createI18n({
  mode: 'path',
  defaultLanguage: 'en',
  seo: true,
  languages: {
    en: {
      label: 'English',
      nativeLabel: 'English',
      load: () => import('./locales/en')
    },
    fr: {
      label: 'French',
      nativeLabel: 'Français',
      load: () => import('./locales/fr')
    },
    'en-GB': {
      label: 'English (UK)',
      parent: 'en',
      load: () => import('./locales/en-GB')
    },
    ar: {
      label: 'Arabic',
      nativeLabel: 'العربية',
      rtl: true,
      load: () => import('./locales/ar')
    }
  }
});
```

Only `t` is returned from `createI18n()` — it's the one function typed against your schema. Everything else (`setLocale`, `getCurrentLocale`, `getLocales`, `getSeoLinks`) is schema-agnostic and imported directly from the package.

### 3. Wire SvelteKit

```ts
// src/hooks.server.ts
import './i18n';
import { createI18nHandle } from '@plcharriere/svelte-i18n/server';

export const handle = createI18nHandle();
```

```ts
// src/hooks.ts — path mode only
import './i18n';
import { createI18nReroute } from '@plcharriere/svelte-i18n/server';

export const reroute = createI18nReroute();
```

```ts
// src/app.d.ts
import type { I18nLocals } from '@plcharriere/svelte-i18n/server';

declare global {
  namespace App {
    interface Locals {
      i18n: I18nLocals;
    }
  }
}

export {};
```

```ts
// src/routes/+layout.server.ts
import { getSeoLinks } from '@plcharriere/svelte-i18n';

export const load = ({ locals, url }) => ({
  i18n: {
    ...locals.i18n,
    seo: getSeoLinks({ url, locale: locals.i18n.locale })
  }
});
```

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import { I18n, setLocale, getLocales } from '@plcharriere/svelte-i18n';
  import { t } from '../i18n';
</script>

<I18n />

<a href="/">{t('nav.home')}</a>

{#each getLocales() as loc (loc.code)}
  <button onclick={() => setLocale(loc.code)}>{loc.nativeLabel}</button>
{/each}
```

Done. `/` renders English, `/fr` renders French, `setLocale('fr')` client-navigates, `<html lang dir>` tracks the active locale.

## Features

- **Typed keys + params**, merged across every locale. No codegen, no `declare global`.
- **Three routing modes** — `path` / `cookie` / `domain`.
- **Locale variants** — `en-GB → en → default`, partial dictionaries supported.
- **Full ICU** — plural, select, selectordinal, number / date / currency formats via `intl-messageformat`.
- **SSR isolation** — per-request via `AsyncLocalStorage`.
- **SEO** — canonical + hreflang + x-default, one URL per page.
- **`<html lang dir>`** — patched server-side, kept in sync on the client.

## API

| Export | Purpose |
| --- | --- |
| `createI18n(config)` | Setup. Returns `{ t }`. |
| `t(key, params?)` | Typed translator. |
| `setLocale(code)` | Switch locale, per-mode side effects. |
| `getCurrentLocale()` | Active locale metadata. |
| `getLocales()` | All configured locales. |
| `getSeoLinks(ctx?)` | Canonical / alternates / xDefault. Opt in via `seo: true`. |
| `<I18n />` | Mount once in root layout. |
| `schema()` / `typed<T>()` | Locale-file authoring. |

Server entry (`@plcharriere/svelte-i18n/server`): `createI18nHandle()`, `createI18nReroute()`, `getRequestLocale(event)`.

## Routing modes

Pick how the active locale is determined on each request. Set via `mode` on `createI18n()`.

### `path`

The locale is the first URL segment: `/en/about`, `/fr/about`. The default language can optionally be served unprefixed (`/about`).

- **Best for:** SEO-critical sites — each translation has a distinct, crawlable URL.
- **Switching:** `setLocale('fr')` client-navigates to the equivalent `/fr/...` URL, no full reload.

### `cookie`

URLs stay the same across locales (`/about`). The active locale is read from a cookie (`locale` by default), with `?lang=xx` as a one-shot override that also writes the cookie.

- **Best for:** apps where URL stability matters (auth flows, shared links, deep-linked state) and SEO per-language isn't a priority.
- **Switching:** `setLocale('fr')` writes the cookie and calls `invalidateAll()` so server loads re-run in the new locale.

### `domain`

The locale is picked by `event.url.host`. Each language declares one or more `domains: ['example.fr', 'fr.example.com']`.

- **Best for:** multi-region deployments where each language lives on its own domain or subdomain.
- **Switching:** `setLocale('fr')` navigates to the configured domain for `fr`. Unmapped hosts fall back to the default (or reject, see `domainFallback`).

## Config options

```ts
createI18n({
  mode: 'path',              // 'path' | 'cookie' | 'domain'
  defaultLanguage: 'en',
  languages: { ... },

  strict: false,             // throw instead of warn on missing keys / params
  cookieName: 'locale',      // cookie mode only
  domainFallback: 'default', // 'default' | 'reject' (domain mode)
  seo: false                 // enable getSeoLinks() output
});
```

## Gotcha: reactivity

`t()` is reactive only if you don't capture it.

```svelte
<!-- ❌ stays in initial locale forever -->
<script>
  const label = t('cart.addToCart');
</script>

<!-- ✅ updates on locale change -->
<script>
  const label = $derived(t('cart.addToCart'));
</script>

<!-- ✅ inline is already reactive -->
<button>{t('cart.addToCart')}</button>
```

## Details

See [`SPECS.md`](./SPECS.md) for the full specification — every requirement, every config option, every warning code.

## License

MIT
