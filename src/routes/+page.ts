// Keep the trailing slash on locale roots: `/en-GB/`, `/fr/`, `/`. Applies
// only to this index route — deep pages like `/en-GB/about` inherit
// SvelteKit's default `'never'` and stay unslashed.
export const trailingSlash = 'always';
