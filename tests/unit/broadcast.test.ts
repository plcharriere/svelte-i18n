import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Each test imports the broadcast module fresh so the module-level
// singleton (`channel`, `resolved`) is reinitialized.

class FakeBroadcastChannel {
	static instances: FakeBroadcastChannel[] = [];
	name: string;
	listeners = new Set<(e: MessageEvent) => void>();
	closed = false;
	posted: unknown[] = [];

	constructor(name: string) {
		this.name = name;
		FakeBroadcastChannel.instances.push(this);
	}
	postMessage(data: unknown) {
		this.posted.push(data);
	}
	addEventListener(_type: 'message', fn: (e: MessageEvent) => void) {
		this.listeners.add(fn);
	}
	removeEventListener(_type: 'message', fn: (e: MessageEvent) => void) {
		this.listeners.delete(fn);
	}
	close() {
		this.closed = true;
	}
}

const originalWindow = (globalThis as { window?: unknown }).window;
const originalBC = (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel;

beforeEach(() => {
	(globalThis as { window?: unknown }).window = {};
	(globalThis as { BroadcastChannel?: unknown }).BroadcastChannel =
		FakeBroadcastChannel;
	FakeBroadcastChannel.instances = [];
	vi.resetModules();
});

afterEach(() => {
	if (originalWindow === undefined) delete (globalThis as { window?: unknown }).window;
	else (globalThis as { window?: unknown }).window = originalWindow;
	if (originalBC === undefined)
		delete (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel;
	else (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel = originalBC;
});

async function loadBroadcast(
	configValue: ReturnType<
		typeof import('../../src/lib/config.ts').peekCurrentConfig
	>
) {
	vi.doMock('../../src/lib/config.ts', () => ({
		peekCurrentConfig: () => configValue
	}));
	return await import('../../src/lib/broadcast.ts');
}

function makeConfig(
	overrides: {
		mode?: 'path' | 'cookie' | 'domain';
		syncTabs?: boolean;
		syncChannel?: string;
	} = {}
) {
	return {
		mode: overrides.mode ?? 'cookie',
		defaultLocale: 'en',
		defaultLocalePath: 'redirect' as const,
		locales: { en: { code: 'en', rtl: false, domains: [] } },
		codes: ['en'],
		loaders: {},
		strict: false,
		cookieName: 'locale',
		domainFallback: 'default' as const,
		seo: true,
		syncTabs: overrides.syncTabs ?? true,
		syncChannel: overrides.syncChannel ?? 'svelte-i18n'
	};
}

describe('getCookieBroadcastChannel', () => {
	it('returns null when not in cookie mode', async () => {
		const { getCookieBroadcastChannel } = await loadBroadcast(makeConfig({ mode: 'path' }));
		expect(getCookieBroadcastChannel()).toBeNull();
	});

	it('returns null when syncTabs is disabled', async () => {
		const { getCookieBroadcastChannel } = await loadBroadcast(
			makeConfig({ syncTabs: false })
		);
		expect(getCookieBroadcastChannel()).toBeNull();
	});

	it('returns null on the server (no window)', async () => {
		delete (globalThis as { window?: unknown }).window;
		const { getCookieBroadcastChannel } = await loadBroadcast(makeConfig());
		expect(getCookieBroadcastChannel()).toBeNull();
	});

	it('returns null when BroadcastChannel is unavailable', async () => {
		delete (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel;
		const { getCookieBroadcastChannel } = await loadBroadcast(makeConfig());
		expect(getCookieBroadcastChannel()).toBeNull();
	});

	it('returns null when config is not yet set', async () => {
		const { getCookieBroadcastChannel } = await loadBroadcast(undefined);
		expect(getCookieBroadcastChannel()).toBeNull();
	});

	it('opens a channel with the configured name', async () => {
		const { getCookieBroadcastChannel } = await loadBroadcast(
			makeConfig({ syncChannel: 'my-app' })
		);
		const channel = getCookieBroadcastChannel();
		expect(channel).not.toBeNull();
		expect(FakeBroadcastChannel.instances).toHaveLength(1);
		expect(FakeBroadcastChannel.instances[0].name).toBe('my-app');
	});

	it('uses the default channel name when not overridden', async () => {
		const { getCookieBroadcastChannel } = await loadBroadcast(makeConfig());
		getCookieBroadcastChannel();
		expect(FakeBroadcastChannel.instances[0].name).toBe('svelte-i18n');
	});

	it('returns the same instance on repeated calls (singleton)', async () => {
		const { getCookieBroadcastChannel } = await loadBroadcast(makeConfig());
		const a = getCookieBroadcastChannel();
		const b = getCookieBroadcastChannel();
		expect(a).toBe(b);
		expect(FakeBroadcastChannel.instances).toHaveLength(1);
	});

	it('returns null and does not throw when constructor throws', async () => {
		(globalThis as { BroadcastChannel?: unknown }).BroadcastChannel =
			class {
				constructor() {
					throw new Error('blocked by sandbox');
				}
			};
		const { getCookieBroadcastChannel } = await loadBroadcast(makeConfig());
		expect(getCookieBroadcastChannel()).toBeNull();
	});
});
