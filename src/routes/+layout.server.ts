import { getSeoLinks } from '$lib';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, url }) => {
	return {
		i18n: {
			...locals.i18n,
			seo: getSeoLinks({ url, locale: locals.i18n.locale })
		}
	};
};
