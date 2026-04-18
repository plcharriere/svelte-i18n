import { schema, typed } from '$lib';

export default schema({
	nav: {
		cart: 'Sacola'
	},
	cart: {
		title: 'Minha sacola',
		items: typed<{ count: number }>(
			'{count, plural, one {# produto} other {# produtos}}'
		)
	}
});
