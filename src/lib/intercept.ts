let suspended = 0;

export function suspendInterception(): () => void {
	suspended++;
	let released = false;
	return () => {
		if (released) return;
		released = true;
		suspended--;
	};
}

export function isInterceptionSuspended(): boolean {
	return suspended > 0;
}
