import { createI18n } from "$lib";

export const t = createI18n({
	locales: {
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
