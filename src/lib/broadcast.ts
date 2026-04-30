import { peekCurrentConfig } from './config.ts';

let channel: BroadcastChannel | null = null;
let resolved = false;

export function getCookieBroadcastChannel(): BroadcastChannel | null {
	if (resolved) return channel;
	resolved = true;
	if (typeof window === 'undefined') return null;
	if (typeof BroadcastChannel === 'undefined') return null;
	const config = peekCurrentConfig();
	if (!config || config.mode !== 'cookie') return null;
	if (!config.syncTabs) return null;
	try {
		channel = new BroadcastChannel(config.syncChannel);
	} catch {
		channel = null;
	}
	return channel;
}
