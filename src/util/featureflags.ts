import { getConfiguration } from "./vsccommon";

const cfg = getConfiguration();
let featureFlags: string[] = [];

try {
	if (typeof (cfg as any).get === 'function') {
		featureFlags = (cfg as any).get('featureFlags', []) as string[];
	} else {
		const raw = (cfg as any).featureFlags;
		featureFlags = Array.isArray(raw) ? raw : [];
	}
} catch (e) {
	featureFlags = [];
}

export const useConditionInFocus = !featureFlags.includes('!useConditionInFocus');
export const eventTreePreview = !featureFlags.includes('!eventTreePreview');
export const sharedFocusIndex = !featureFlags.includes('!sharedFocusIndex');
export const gfxIndex = featureFlags.includes('gfxIndex');
export const localisationIndex = featureFlags.includes('localisationIndex');