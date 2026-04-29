# Svelte i18n Specs

## 1. Language Identifiers

The library identifies each supported language by a short string code.

Examples of supported language codes:

- `fr`
- `en`
- `pt`
- `es`

These built-in examples are base language identifiers.

Examples:

- `fr` means generic French, not specifically `fr-FR`
- `en` means generic English, not specifically `en-US` or `en-GB`
- `pt` means generic Portuguese, not specifically `pt-PT` or `pt-BR`
- `es` means generic Spanish, not specifically `es-ES` or `es-MX`

### Requirements

- The library must support a fixed set of language codes defined at initialization time.
- The supported language codes are application-defined.
- `fr`, `en`, `pt`, and `es` are example language codes used in this specification.
- Every active language must be identified by one of the configured supported codes.
- Language definitions must be declared in an object keyed by language code.
- A language definition may include optional metadata.
- The language definition must allow an `rtl` boolean flag for right-to-left languages such as Arabic or Hebrew.
- The language definition must allow `label` and `nativeLabel` fields.
- The language definition must allow a `parent` field for locale inheritance, such as `en-GB` extending `en`.
- The language definition must allow a `load` field — a dynamic import thunk such as `() => import('./locales/fr')` — that the library uses both to lazy-load the dictionary at runtime and to infer the schema type at compile time.
- Translation dictionaries must be keyed by these language codes.
- One supported language must be marked as the default language.
- The default language is `en`.
- The design must allow extended locale codes such as `en-GB` or `pt-BR`.

### Type Shape

```ts
type LanguageCode = string;
```

### Runtime Configuration Example

```ts
createI18n({
  mode: 'domain',
  defaultLanguage: 'en',
  languages: {
    en: {
      label: 'English',
      nativeLabel: 'English',
      domains: ['example.com', 'en.example.com']
    },
    fr: {
      label: 'French',
      nativeLabel: 'Français',
      domains: ['example.fr']
    },
    ar: {
      label: 'Arabic',
      nativeLabel: 'العربية',
      rtl: true
    },
    'en-GB': {
      parent: 'en',
      label: 'English (UK)',
      nativeLabel: 'English (UK)',
      domains: ['example.uk']
    }
  }
});
```

### Language Definition Example

```ts
type LanguageDefinition = {
  label?: string;
  nativeLabel?: string;
  rtl?: boolean;
  parent?: string;
  domains?: string[];
  load?: () => Promise<{ default: Dictionary }>;
};
```

### Default Metadata Behavior

- `rtl` defaults to `false`
- `parent` is optional
- `label` and `nativeLabel` are optional
- `domains` is optional

### Metadata Inheritance

If a locale definition declares a `parent`, missing metadata fields must inherit from the parent locale definition.

Example:

```ts
languages: {
  ar: {
    label: 'Arabic',
    nativeLabel: 'Arabic',
    rtl: true
  },
  'ar-AE': {
    parent: 'ar',
    label: 'Arabic (AE)'
  }
}
```

In this example:

- `ar-AE.label` resolves to `'Arabic (AE)'`
- `ar-AE.nativeLabel` inherits from `ar`
- `ar-AE.rtl` inherits from `ar`

## 2. Default Language

The library must define a default language used as the primary language for initialization and fallback behavior.

The default language is `en`.

### Requirements

- The default language must be one of the supported language codes.
- The library must initialize with `en` as the default language unless explicitly configured otherwise.
- If no active language has been selected yet, the library must use the default language.
- The default language acts as the canonical fallback language when a translation cannot be resolved in the active language.
- The default language dictionary should be considered the reference dictionary for typing and key validation.
- The default language dictionary must define the canonical translation-key schema for typed `t()` keys.

### Runtime Configuration Example

```ts
createI18n({
  mode: 'path',
  languages: ['fr', 'en', 'pt', 'es'],
  defaultLanguage: 'en'
});
```

## 3. Locale Routing Modes

The library must support configurable locale resolution modes.

### Requirements

- Locale resolution strategy must be configurable.
- The locale resolution mode must be configured through the top-level `mode` option passed to `createI18n()`.
- The library must support at least two routing modes:
- `path`: locale may be encoded in the URL path
- `cookie`: locale is resolved without requiring a locale segment in the URL path
- `domain`: locale is resolved from the request domain or subdomain
- The selected routing mode determines how the active locale is resolved for each request.

### Path Mode

In path mode, the application may select the active language from the first URL path segment.

Examples:

- `/fr/about`
- `/es/about`
- `/pt/contact`
- `/en/about`
- `/about`
- `/`

Requirements for path mode:

- An explicit locale in the first path segment must take precedence over all other locale sources.
- The default language may also be addressed through its explicit prefix, such as `/en/` and `/en/about`.
- The canonical public route for the default language may be the unprefixed route.
- Router integration should support browsing the default language through `/`-based routes without requiring the `/en` prefix.
- Unsupported language-like prefixes must produce a not found response. The library must not silently strip or remap an unknown prefix, because doing so would mask broken links and produce two URLs (`/xx/about` and `/about`) for the same content.

### Cookie Mode

In cookie mode, the active locale is resolved without relying on a locale segment in the URL path.

Requirements for cookie mode:

- A `lang` query parameter must be supported as an explicit locale override in cookie mode.
- If a valid `lang` query parameter is present, it must take precedence over the locale cookie for that request.
- If a valid `lang` query parameter is present, the library must persist that locale choice into the locale cookie.
- The active locale must be resolved from a cookie when available.
- If no locale cookie is available, the library must use the default language.
- Unprefixed routes such as `/` and `/about` may render different locales depending on the resolved cookie value.

### Domain Mode

In domain mode, the active locale is resolved from the request host.

Examples:

- `example.com` resolves to the default language
- `pt.example.com` resolves to `pt`
- `fr.example.com` resolves to `fr`

Requirements for domain mode:

- The library must allow mapping domains or subdomains to locales.
- An explicit domain-to-locale mapping must determine the active locale for the request.
- The base domain may resolve to the default language.
- Locale resolution in domain mode must happen before rendering localized content.
- If the request host does not match a configured locale mapping, the library must either fall back to the default language or reject the request, depending on configuration.
- If multiple locales declare the same domain, the first matching locale definition must win.

Example metadata:

```ts
createI18n({
  mode: 'domain',
  defaultLanguage: 'en',
  languages: {
    en: {
      label: 'English',
      nativeLabel: 'English',
      domains: ['example.com', 'en.example.com']
    },
    fr: {
      label: 'French',
      nativeLabel: 'Français',
      domains: ['example.fr']
    }
  }
});
```

### Open Design Note

Path mode, cookie mode, and domain mode should be treated as distinct configuration modes. Locale resolution behavior should not assume that another mode is active unless it is explicitly configured.

### Additional Configuration Options

`createI18n()` must accept the following optional top-level options beyond `mode`, `defaultLanguage`, and `languages`:

- `strict?: boolean` — when `true`, validation events (missing keys, missing params, dotted schema keys, fallback-to-default, unknown locales) throw instead of emitting `console.warn`. Defaults to `false`.
- `cookieName?: string` — name of the locale cookie used in `cookie` mode. Defaults to `'locale'`.
- `domainFallback?: 'default' | 'reject'` — behavior in `domain` mode when the request host matches no configured locale. `'default'` serves the default language; `'reject'` returns a 404. Defaults to `'default'`.
- `seo?: boolean` — opt-in flag for the SEO helper defined in §12. When `false` (the default) `getSeoLinks()` returns `undefined` so callers can wire `seo: getSeoLinks(...)` unconditionally without emitting tags.

## 4. Locale Variants and Inheritance

The library must support extended locale codes that inherit from a base language.

Examples:

- `en-GB` extends `en`
- `en-US` extends `en`
- `pt-BR` extends `pt`
- `pt-PT` extends `pt`

### Requirements

- A locale variant must reference a base language.
- A locale variant dictionary may be partial.
- A base language dictionary should be complete for all required translation keys.
- When a translation key is missing from a locale variant, the library must resolve the key from its base language.
- If the key is also missing from the base language, the library must continue fallback resolution using the default language.
- The fallback chain for a variant must preserve specificity before falling back to the default language.
- A locale without a `parent` may also be partial.
- If a locale without a `parent` is missing a translation key, the library must fall back to the default language.
- Falling back from a non-default locale to the default language because of a missing key must produce a warning.
- If the default language is also missing the key, the library must produce a warning for the unresolved key.

### Resolution Example

For active locale `en-GB`, translation lookup resolves in this order:

```ts
'en-GB' -> 'en' -> defaultLanguage
```

If `defaultLanguage` is `en`, the practical chain is:

```ts
'en-GB' -> 'en'
```

For active locale `pt-BR` with default language `en`, translation lookup resolves in this order:

```ts
'pt-BR' -> 'pt' -> 'en'
```

### Dictionary Model Example

```ts
const messages = {
  en: {
    common: {
      hello: 'Hello',
      colour: 'Color'
    }
  },
  'en-GB': {
    common: {
      colour: 'Colour'
    }
  }
};
```

In this example:

- If the active locale is `en-GB`, `t('common.hello')` resolves from `en`
- If the active locale is `en-GB`, `t('common.colour')` resolves from `en-GB`

### Design Implications

- Base language dictionaries act as shared defaults for their variants.
- Locale variants should only define overrides for strings that differ from the base language.
- The typing system should treat base-language keys as the required schema and allow locale-variant dictionaries to be partial.

## 5. Translation Lookup and Interpolation

The library must provide a translation function named `t`.

### Requirements

- The translation API must support key-based lookup through `t(key)`.
- The translation API must support named variable interpolation through `t(key, params)`.
- The `t` function must resolve translations from the current active locale managed by the library.
- The locale must not be passed as an argument to `t` during normal usage.
- Translation strings may contain ICU message syntax.
- Placeholder names must map to keys in the `params` object passed to `t`.
- The interpolation system must support at least string and number values.
- The same placeholder may appear multiple times in a single translation string.
- If a translation key cannot be resolved after fallback, `t()` must return an empty string.
- Missing translation keys must produce a backend warning.
- If a required param is missing during message resolution, the library must use `0` or the first available ICU option, depending on the expression being resolved.
- If a plain ICU variable is missing during message resolution, the library must resolve it to an empty string.
- Missing params must produce a backend warning.

### API Examples

```ts
t('my.string');
t('my.string', { count: 12 });
t('user.greeting', { name: 'Ada' });
t('cart.summary', { itemsCount: 3, discountCount: 1 });
t('profile.pronoun', { gender: 'female' });
```

### Message Example

```ts
{
  en: {
    my: {
      string: 'This is {count} number'
    },
    user: {
      greeting: 'Hello {name}'
    }
  }
}
```

### Resolution Examples

```ts
t('my.string', { count: 12 });
t('user.greeting', { name: 'Ada' });
```

These resolve to:

```ts
'This is 12 number'
'Hello Ada'
```

### ICU Example

```ts
{
  en: {
    cart: {
      title: 'My cart',
      available: '{count, plural, one {You have # discount available} other {You have # discounts available}}',
      summary:
        'You have {itemsCount, plural, one {# item} other {# items}} and {discountCount, plural, one {# discount} other {# discounts}}'
    }
  }
}
```

Example resolutions:

```ts
t('cart.title');
t('cart.available', { count: 1 });
t('cart.available', { count: 3 });
t('cart.summary', { itemsCount: 3, discountCount: 1 });
```

These resolve to:

```ts
'My cart'
'You have 1 discount available'
'You have 3 discounts available'
'You have 3 items and 1 discount'
```

### Select Example

```ts
{
  en: {
    profile: {
      pronoun:
        '{gender, select, male {He replied} female {She replied} other {They replied}}'
    }
  }
}
```

Example resolutions:

```ts
t('profile.pronoun', { gender: 'male' });
t('profile.pronoun', { gender: 'female' });
t('profile.pronoun', { gender: 'other' });
```

These resolve to:

```ts
'He replied'
'She replied'
'They replied'
```

### Runtime Model Note

The active locale is global application state managed by the library. In normal usage, route resolution and application initialization determine the active locale before `t` is called.

## 6. Server Rendering and Client-Side Locale Switching

The library must support server-side rendering for localized routes and client-side locale switching through SvelteKit navigation.

### Requirements

- Localized content must be rendered on the server whenever a route is server-rendered.
- The active locale for server rendering must be derived before rendering localized content.
- The client must hydrate using the same locale and translation data as the server-rendered response.
- Changing the locale on the client must not require a full page reload.
- Locale switching should preserve the current page and application state as much as possible.
- Changing the locale on the client must update the URL to the localized route through client-side navigation.
- Locale switching should behave like a standard Svelte route transition rather than a full document navigation.
- Changing the locale should navigate to the equivalent route in the target locale.
- The destination localized route must resolve translations through the normal SvelteKit route loading and server-rendering pipeline.
- The library should not require a separate client-side translation fetch mechanism for locale changes if route navigation already resolves the translated content.

### Expected Behavior

- A request to `/fr/about` should be rendered in French on the server.
- After hydration, if the user switches from `fr` to `en`, the application should navigate to `/en/about` or `/about`, depending on the default-language route policy.
- That navigation should behave like a normal Svelte client-side route change, without a full document reload.
- The destination page should be rendered through the standard localized route pipeline rather than patched in through a separate translation fetch step.

## 7. Locale Management Utilities

The library must expose utilities for reading and changing the active locale.

### Required API

- `setLocale(code)`
- `getCurrentLocale()`
- `getLocales()`

### Requirements

- `setLocale(code)` must set the active locale using one of the configured language codes.
- `setLocale(code)` must reject or ignore unknown locale codes.
- `setLocale(code)` must integrate with the configured routing mode when locale changes affect the URL, cookie, domain, or navigation flow.
- In `path` mode, `setLocale(code)` must navigate to the equivalent localized route.
- In `cookie` mode, `setLocale(code)` must update the locale cookie and refresh route state through SvelteKit navigation or invalidation without a full page reload.
- In `domain` mode, `setLocale(code)` must navigate to the mapped locale domain.
- In `domain` mode, if the target locale has no configured domain, `setLocale(code)` must do nothing.
- `getCurrentLocale()` must return the current locale definition for the active locale.
- `getLocales()` must return all configured locales together with their definitions.

### API Shape Example

```ts
setLocale('fr');

const currentLocale = getCurrentLocale();
const locales = getLocales();
```

### Return Value Example

```ts
getCurrentLocale();
// {
//   code: 'en',
//   label: 'English',
//   nativeLabel: 'English',
//   rtl: false
// }
```

```ts
getLocales();
// [
//   {
//     code: 'en',
//     label: 'English',
//     nativeLabel: 'English',
//     rtl: false
//   },
//   {
//     code: 'fr',
//     label: 'French',
//     nativeLabel: 'Français',
//     rtl: false
//   }
// ]
```

## 8. Translation File Format

The library must support one TypeScript translation file per locale.

Examples:

- `locales/en.ts`
- `locales/en-US.ts`
- `locales/fr.ts`

### Requirements

- Translation files must be keyed by locale code.
- Translation files must use TypeScript format.
- The library must support nested object dictionaries.
- Translation paths must be defined through object nesting only.
- Translation files must support a `schema()` helper for typed locale definitions.
- Translation files must support plain string leaves for messages without explicit param typing.
- Translation files must support a `typed()` helper for messages with explicit param typing.
- Locale files should be loaded lazily per locale when needed.
- Locale files should be loaded primarily through the server-side rendering and SvelteKit route-loading pipeline.
- If fallback resolution requires the default locale and it is not yet loaded for the current request, the library must load the default locale at that time.
- Loaded locale files may be cached after first load.

### Nested-Object Example

```ts
export default schema({
  home: {
    title: 'Welcome',
    subtitle: 'Start here'
  },
  cart: {
    items: typed<{ count: number }>(
      '{count, plural, one {# item} other {# items}}'
    )
  }
});
```

### Nested Plural Example

```ts
export default schema({
  cart: {
    title: 'My cart',
    description: {
      discount: 'Click here to get discounts',
      available: typed<{ count: number }>(
        '{count, plural, one {# discount available} other {# discounts available}}'
      )
    },
    items: typed<{ count: number }>(
      '{count, plural, zero {# articles} one {# article} other {# articles}}'
    )
  }
});
```

### Resolution Requirement

Nested object paths must resolve directly through `t()`:

```ts
t('home.title');
```

This must resolve to:

```ts
'Welcome'
```

The nested object model must also support ICU message strings at leaf paths such as:

- `t('cart.title')`
- `t('cart.description.discount')`
- `t('cart.description.available', { count: 0 })`
- `t('cart.items', { count: 2 })`

Example resolutions:

```ts
t('cart.title');
t('cart.description.discount');
t('cart.description.available', { count: 1 });
t('cart.description.available', { count: 3 });
t('cart.items', { count: 0 });
t('cart.items', { count: 2 });
```

These resolve to:

```ts
'My cart'
'Click here to get discounts'
'1 discount available'
'3 discounts available'
'0 articles'
'2 articles'
```

### Invalid Dotted Property Names

Dotted property names must not be used as schema keys.

Example invalid schema:

```ts
export default schema({
  cart: {
    items: typed<{ count: number }>(
      '{count, plural, one {# item} other {# items}}'
    )
  },
  'cart.items': typed<{ count: number }>(
    '{count, plural, one {# article} other {# articles}}'
  )
});
```

### Dotted-Key Handling

- Dotted property names such as `'cart.items'` must be treated as invalid schema definitions.
- Validation must fail or warn clearly when dotted property names are used in a schema object.
- Translation paths must be expressed through nested object structure only.

## 9. ICU Message Format

The library must support ICU message syntax for interpolation and pluralization.

### Requirements

- Translation message leaves must be strings.
- ICU variable interpolation such as `{name}` must be supported.
- ICU plural syntax such as `{count, plural, one {...} other {...}}` must be supported.
- ICU select syntax such as `{gender, select, male {...} female {...} other {...}}` must be supported.
- The plural category keywords `zero`, `one`, `two`, `few`, `many`, and `other` must be supported.
- The library must use the active locale to select plural categories through locale-aware plural rules.
- The `other` plural category must be supported as the fallback form.
- Multiple plural or interpolation expressions may appear in a single message string.
- ICU expressions must be usable in nested-object dictionaries.
- Plain ICU strings without `typed()` remain valid but do not contribute TypeScript param typing.
- Plain ICU strings without `typed()` must not be treated as typed message definitions during validation.

### English Example

```ts
export default schema({
  cart: {
    items: typed<{ count: number }>(
      '{count, plural, one {# item} other {# items}}'
    ),
    available: typed<{ count: number }>(
      '{count, plural, one {You have # discount available} other {You have # discounts available}}'
    )
  }
});
```

Examples:

- `t('cart.items', { count: 1 })` resolves to `1 item`
- `t('cart.items', { count: 2 })` resolves to `2 items`
- `t('cart.items', { count: 0 })` resolves to `0 items`
- `t('cart.available', { count: 1 })` resolves to `You have 1 discount available`
- `t('cart.available', { count: 4 })` resolves to `You have 4 discounts available`

### French Example

```ts
export default schema({
  cart: {
    items: typed<{ count: number }>(
      '{count, plural, zero {# article} one {# article} other {# articles}}'
    ),
    available: typed<{ count: number }>(
      '{count, plural, zero {Vous avez # réduction disponible} one {Vous avez # réduction disponible} other {Vous avez # réductions disponibles}}'
    )
  }
});
```

Examples:

- `t('cart.items', { count: 0 })` resolves to `0 article`
- `t('cart.items', { count: 1 })` resolves to `1 article`
- `t('cart.items', { count: 2 })` resolves to `2 articles`
- `t('cart.available', { count: 0 })` resolves to `Vous avez 0 réduction disponible`
- `t('cart.available', { count: 3 })` resolves to `Vous avez 3 réductions disponibles`

### Multiple Plurals In One Message

```ts
export default schema({
  cart: {
    summary: typed<{ itemsCount: number; discountCount: number }>(
      'You have {itemsCount, plural, one {# item} other {# items}} and {discountCount, plural, one {# discount} other {# discounts}}'
    ),
    summaryWithName: typed<{
      name: string;
      itemsCount: number;
      discountCount: number;
    }>(
      '{name} has {itemsCount, plural, one {# item} other {# items}} and {discountCount, plural, one {# discount} other {# discounts}}'
    )
  }
});
```

Example:

- `t('cart.summary', { itemsCount: 3, discountCount: 1 })` resolves to `You have 3 items and 1 discount`
- `t('cart.summaryWithName', { name: 'Ada', itemsCount: 1, discountCount: 2 })` resolves to `Ada has 1 item and 2 discounts`

### Select Example

```ts
export default schema({
  profile: {
    pronoun: typed<{ gender: 'male' | 'female' | 'other' }>(
      '{gender, select, male {He replied} female {She replied} other {They replied}}'
    )
  }
});
```

Examples:

- `t('profile.pronoun', { gender: 'male' })` resolves to `He replied`
- `t('profile.pronoun', { gender: 'female' })` resolves to `She replied`
- `t('profile.pronoun', { gender: 'other' })` resolves to `They replied`

## 10. Typed Schema API

The library must support typed translation authoring through `schema()` and `typed()`.

### Requirements

- `schema()` must define the canonical translation schema for a locale file.
- `typed()` must allow explicit TypeScript typing of message params.
- Plain string leaves must remain valid inside `schema()` for messages without explicit param typing.
- The canonical locale schema must provide typed translation keys for `t()`.
- When a message is defined through `typed()`, `t()` should enforce the declared param shape for that key.
- Typed message params should be derived from the combined param usage across all locales for the same translation key.
- If multiple locales define different params for the same translation key, the resulting `t()` param type must include all of those params.
- This combined param type may therefore require params that are only used by some locales.

### Schema Registration

- `createI18n()` must derive `t()`'s key and param typing automatically from the `languages` map passed to it.
- Each language definition's `load` function must be a dynamic `import()` expression with a literal path so TypeScript can resolve the locale module's default-export type at the call site.
- The library must infer the merged schema from every `load` in the map by intersecting each loaded module's `default` export. No generic argument, tuple, barrel, or `declare global` block may be required of the user.
- Typed keys and their combined param shapes must be derived from this inferred schema at compile time; no generated `.d.ts` file is required.
- Adding a new locale must require exactly one additional entry in the `languages` map — metadata and loader together — and no edits elsewhere.
- Runtime locale loading must use the same `load` functions; the library must not require a second parallel loader map.

### Registration Example

Only `t` is returned from `createI18n()` — it is the single function whose
signature is schema-typed by the merged `languages` map. Every other helper
(`setLocale`, `getCurrentLocale`, `getLocales`, `getSeoLinks`) is
schema-agnostic and is imported directly from `@plcharriere/svelte-i18n`.

```ts
// src/i18n.ts
import { createI18n } from '@plcharriere/svelte-i18n';

export const t = createI18n({
  mode: 'path',
  defaultLanguage: 'en',
  languages: {
    en:      { label: 'English',                          load: () => import('./locales/en') },
    'en-GB': { parent: 'en', label: 'English (UK)',       load: () => import('./locales/en-GB') },
    fr:      { label: 'French',  nativeLabel: 'Français', load: () => import('./locales/fr') },
    ar:      { label: 'Arabic',  rtl: true,               load: () => import('./locales/ar') }
  }
});
```

```ts
// Any component
import { setLocale, getCurrentLocale, getLocales, getSeoLinks } from '@plcharriere/svelte-i18n';
import { t } from '../i18n';
```

### Combined-Params Example

```ts
// locales/en.ts
export default schema({
  cart: {
    items: typed<{ count: number }>('{count, plural, one {# item} other {# items}}')
  }
});

// locales/fr.ts
export default schema({
  cart: {
    items: typed<{ style: 'short' | 'long' }>(
      '{count, plural, one {# article} other {# articles}}'
    )
  }
});
```

With both locales registered through the `languages` map's `load` fields, `t('cart.items', ...)` must require both params together:

```ts
t('cart.items', { count: 2, style: 'short' }); // ✅

// @ts-expect-error — missing `style` (declared by fr)
t('cart.items', { count: 2 });

// @ts-expect-error — missing `count` (declared by en)
t('cart.items', { style: 'long' });
```

## 11. Validation And Document Integration

The library must support validation and document-level locale integration.

### Requirements

- The library must support runtime validation for missing translations, keys, and params.
- The library must support development-time validation for missing translations, keys, and params.
- The library must apply locale direction to the document, including the `dir` attribute.
- The library must apply the active locale code to the `lang` attribute of the root `<html>` element.
- The library must apply the resolved text direction to the `dir` attribute of the root `<html>` element.
- The library should support head-tag integration for locale-aware metadata such as canonical links and alternate links.
- Locale metadata may include a `domains` field for use in domain-based locale routing.

## 12. SEO Link Integration

The library must support locale-aware SEO link generation for use in `<svelte:head>`.

### Requirements

- The library must expose a helper for generating SEO link data for the current route.
- The SEO helper must provide a canonical URL for the active locale page.
- The SEO helper must provide alternate locale URLs when the current routing mode supports locale-specific URLs.
- The SEO helper may provide an `x-default` URL for the default locale entrypoint.
- The SEO helper should return structured data that the application can render into `<link>` tags inside `<svelte:head>`.
- In `cookie` mode, the SEO helper must generate alternate locale links using the `?lang=` query parameter.

### Example API Shape

```ts
const seo = getSeoLinks();
```

### Example Return Value

```ts
{
  canonical: 'https://example.fr/about',
  alternates: [
    { hreflang: 'en', href: 'https://example.com/about' },
    { hreflang: 'fr', href: 'https://example.fr/about' },
    { hreflang: 'en-GB', href: 'https://example.uk/about' }
  ],
  xDefault: 'https://example.com/about'
}
```

### Cookie Mode Example

```ts
{
  canonical: 'https://example.com/about?lang=fr',
  alternates: [
    { hreflang: 'en', href: 'https://example.com/about' },
    { hreflang: 'fr', href: 'https://example.com/about?lang=fr' },
    { hreflang: 'en-GB', href: 'https://example.com/about?lang=en-GB' }
  ],
  xDefault: 'https://example.com/about'
}
```

### Default-Locale Canonical Form

The default locale must use its unparameterized canonical form in every SEO
URL — canonical, alternates, and `xDefault`. A single page must not be
advertised to crawlers under two distinct URLs.

- In `path` mode, the default-locale URL is unprefixed: `/about`, not
  `/en/about`.
- In `cookie` mode, the default-locale URL has no `?lang=` parameter:
  `/about`, not `/about?lang=en`.
- In `domain` mode, the default-locale URL uses the default language's first
  configured domain.

### Example Svelte Usage

```svelte
<svelte:head>
  <link rel="canonical" href={seo.canonical} />
  {#each seo.alternates as alt}
    <link rel="alternate" hreflang={alt.hreflang} href={alt.href} />
  {/each}
  {#if seo.xDefault}
    <link rel="alternate" hreflang="x-default" href={seo.xDefault} />
  {/if}
</svelte:head>
```

### Typed Schema Example

```ts
export default schema({
  cart: {
    title: 'My cart',
    empty: 'Your cart is empty',
    items: typed<{ count: number }>(
      '{count, plural, one {# item} other {# items}}'
    ),
    summary: typed<{ itemsCount: number; discountCount: number }>(
      'You have {itemsCount, plural, one {# item} other {# items}} and {discountCount, plural, one {# discount} other {# discounts}}'
    )
  }
});
```

### Typed Usage Example

```ts
t('cart.title');
t('cart.items', { count: 3 });
t('cart.summary', { itemsCount: 3, discountCount: 1 });
```

## 13. Per-Route Dictionary Scoping

The library may ship, on each request, only the translation keys statically referenced by the active route. Consumers opt in by installing the bundled Vite plugin. Without the plugin, every request ships the full dictionary for the active locale plus its fallback chain — behavior is unchanged.

### Requirements

- The library must expose a Vite plugin via the `./vite` subpath export.
- The plugin must statically scan each SvelteKit route — `+page.svelte` plus its transitive imports and layouts — for literal `t('...')` calls at build/dev time.
- The plugin must produce a per-route manifest keyed by `event.route.id`, mapping each route to the set of dotted keys referenced from that route's component tree.
- Installing the plugin must not require additional wiring in `hooks.server.ts`. The consumer's `createI18nHandle()` call with no arguments must automatically pick up the manifest.
- Consumers must be able to override or supply their own manifest by passing `keyManifest` to `createI18nHandle()`.
- When a manifest is available, the server handle must prune `event.locals.i18n.dictionaries` to only the keys the active route statically references.
- Pruning must be fallback-aware: each locale in the fallback chain must ship only the keys its descendant locale is missing. When the active locale is complete for a route, its ancestor locales must ship as empty subsets.
- Unknown routes — those not present in the manifest (for example, 404 error pages) — must ship the full dictionaries. The library must never refuse to render a route because its keys were not enumerated at build time.
- Only literal-string first arguments to `t()` are discoverable. Dynamic keys (`t(someVar)`) are invisible to the scanner; the library must not error on their presence, but such keys may not appear in the shipped subset.

### Consumer Setup Example

```ts
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteI18n } from '@plcharriere/svelte-i18n/vite';

export default {
  plugins: [svelteI18n(), sveltekit()]
};
```

```ts
// src/hooks.server.ts
import './i18n';
import { createI18nHandle } from '@plcharriere/svelte-i18n/server';

export const handle = createI18nHandle();
```

### Fallback Chain Examples

**Two-hop chain** (active `fr`, chain `fr → en`) on route `/cart`:

- `fr` has every `cart.*`, `nav.*`, and `common.*` key the route needs:
  - `fr` must ship the full route subset: `{ cart: {...}, nav: {...}, common: {...} }`.
  - `en` must ship `{}` — `fr` already provided everything.
- If `fr` is missing one key (say `cart.empty`):
  - `fr` ships every other key.
  - `en` ships only `{ cart: { empty } }`.

**Three-hop chain** (active `pt-BR`, chain `pt-BR → pt → en`) on route `/cart`:

- `pt-BR` has `cart.title` and `cart.items` only; `pt` has the rest of `cart.*` plus `nav.*` and `common.*`; `en` is the canonical reference:
  - `pt-BR` must ship `{ cart: { title, items } }` — its overrides.
  - `pt` must ship every remaining key the route needs: `{ cart: { empty, summary, ... }, nav: {...}, common: {...} }`.
  - `en` must ship `{}` — everything has been claimed by the time its turn arrives.
- If `pt-BR` and `pt` combined leave a gap, only those leftover keys ship from `en`.

## 14. Developer-Mode Hot Swap

The Vite plugin, when installed, must provide a developer-mode hot-swap path for locale file edits.

### Requirements

- When a file under the locale source directory is modified, the plugin must invalidate the library's server-side dictionary cache for the affected locale.
- The plugin must deliver the freshly loaded locale dictionary to the browser through a Vite HMR custom event.
- The browser must apply the new dictionary in place and re-run every reactive `t()` call without a full page reload.
- Browser state — scroll position, JavaScript state, form inputs — must be preserved across the swap.
- The plugin must suppress Vite's default full-reload fallback for locale files so that the custom in-place swap runs instead.
- If a locale file is deleted or fails to re-load, the plugin must not emit a malformed event that leaves the client cache in a silently stale state.
