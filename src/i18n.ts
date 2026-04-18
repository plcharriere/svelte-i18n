import { createI18n } from "$lib";

// Everything lives in one map: metadata + loader per language. `t()` is fully
// typed against the merged schema derived from each `load()`'s return type —
// no tuple, no barrel, no `declare global`, no codegen. Adding a locale means
// adding one entry below.
// Only `t` is re-exported from here — it's the one function that has to carry
// your schema type. `setLocale`, `getCurrentLocale`, `getLocales`, and
// `getSeoLinks` are schema-agnostic; import them directly from `$lib`.
export const { t } = createI18n({
  mode: "path",
  defaultLanguage: "en",
  seo: true,
  languages: {
    en: {
      label: "English",
      nativeLabel: "English",
      domains: ["example.com", "en.example.com"],
      load: () => import("./locales/en"),
    },
    "en-GB": {
      parent: "en",
      label: "English (UK)",
      nativeLabel: "English (UK)",
      domains: ["example.uk"],
      load: () => import("./locales/en-GB"),
    },
    fr: {
      label: "French",
      nativeLabel: "Français",
      domains: ["example.fr"],
      load: () => import("./locales/fr"),
    },
    es: {
      label: "Spanish",
      nativeLabel: "Español",
      load: () => import("./locales/es"),
    },
    pt: {
      label: "Portuguese",
      nativeLabel: "Português",
      load: () => import("./locales/pt"),
    },
    "pt-BR": {
      parent: "pt",
      label: "Portuguese (BR)",
      nativeLabel: "Português (BR)",
      load: () => import("./locales/pt-BR"),
    },
    ar: {
      label: "Arabic",
      nativeLabel: "العربية",
      rtl: true,
      load: () => import("./locales/ar"),
    },
  },
});
