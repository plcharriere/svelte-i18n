import type { I18nLocals } from '$lib/server';

declare global {
	namespace App {
		interface Locals {
			i18n: I18nLocals;
		}
	}
}

export {};
