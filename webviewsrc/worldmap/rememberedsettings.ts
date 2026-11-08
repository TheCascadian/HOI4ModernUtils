import { getState, setState, addStateListener } from '../util/common';

/**
 * Optionally carries World Map settings from one preview to the next. The
 * per-panel webview state only survives a reload of the same panel, so the
 * opted-in groups are mirrored to localStorage and used to seed a new panel.
 */
type RememberGroup = 'performance' | 'visibility';

const groupKeys: Record<RememberGroup, string[]> = {
    performance: [
        'renderOptimizations',
        'renderOptimizationConfirmationRequired',
        'performanceDebugVisible',
        'performanceDebugCorner',
    ],
    visibility: ['display', 'warningFilter'],
};

const flagKey = (group: RememberGroup) => `hoi4mu.remember.${group}`;
const valueKey = (group: RememberGroup) => `hoi4mu.remembered.${group}`;

function readStorage(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeStorage(key: string, value: string | undefined): void {
    try {
        if (value === undefined) {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, value);
        }
    } catch { /* storage unavailable */ }
}

function isRemembering(group: RememberGroup): boolean {
    return readStorage(flagKey(group)) === '1';
}

function snapshot(group: RememberGroup): Record<string, unknown> {
    const state = getState();
    const result: Record<string, unknown> = {};
    for (const key of groupKeys[group]) {
        if (state[key] !== undefined) {
            result[key] = state[key];
        }
    }
    return result;
}

/** Seeds this panel's state from remembered values. Call before the map UI is built. */
export function applyRememberedSettings(): void {
    const current = getState();
    for (const group of Object.keys(groupKeys) as RememberGroup[]) {
        if (!isRemembering(group)) {
            continue;
        }
        try {
            const saved = JSON.parse(readStorage(valueKey(group)) ?? '{}') as Record<string, unknown>;
            const seed: Record<string, unknown> = {};
            for (const key of groupKeys[group]) {
                // A panel that already has its own value keeps it.
                if (saved[key] !== undefined && current[key] === undefined) {
                    seed[key] = saved[key];
                }
            }
            setState(seed);
        } catch { /* corrupt entry is ignored */ }
    }
}

/** Hooks up the menu checkboxes and keeps remembered values current. */
export function setupRememberedSettings(): void {
    const toggles: Array<[RememberGroup, string]> = [
        ['performance', 'remember-performance-toggle'],
        ['visibility', 'remember-visibility-toggle'],
    ];
    for (const [group, id] of toggles) {
        const checkbox = document.getElementById(id) as HTMLInputElement | null;
        if (!checkbox) {
            continue;
        }
        checkbox.checked = isRemembering(group);
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                writeStorage(flagKey(group), '1');
                writeStorage(valueKey(group), JSON.stringify(snapshot(group)));
            } else {
                writeStorage(flagKey(group), undefined);
                writeStorage(valueKey(group), undefined);
            }
        });
    }
    addStateListener(changed => {
        for (const group of Object.keys(groupKeys) as RememberGroup[]) {
            if (isRemembering(group) && groupKeys[group].some(key => key in changed)) {
                writeStorage(valueKey(group), JSON.stringify(snapshot(group)));
            }
        }
    });
}
