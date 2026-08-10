import * as assert from 'assert';
import { computeFocusTreeDiagnostics, offsetToPosition } from '../../src/previewdef/focustree/diagnosticscore';
import type { Focus, FocusTree, FocusWarning } from '../../src/previewdef/focustree/schema';

const FILE = 'test/focus.txt';
const OTHER_FILE = 'test/shared.txt';

function focus(overrides: Partial<Focus> & { id: string }): Focus {
    return {
        x: 0, y: 0, icon: [],
        prerequisite: [], prerequisiteGroups: [],
        exclusive: [], exclusiveGroups: [],
        hasAllowBranch: false, inAllowBranch: [], allowBranch: undefined,
        relativePositionId: undefined, relativePositionIdToken: undefined, relativePositionIdRange: undefined,
        offset: [], text: undefined, overlay: undefined,
        token: undefined, idToken: undefined, xToken: undefined, yToken: undefined,
        blockRange: undefined, file: FILE,
        ...overrides,
    };
}

function tree(focuses: Focus[], overrides: Partial<FocusTree> = {}): FocusTree {
    return {
        id: 'test_tree',
        focuses: Object.fromEntries(focuses.map(f => [f.id, f])),
        allowBranchOptions: [], conditionExprs: [], isSharedFocues: false, warnings: [],
        file: FILE, treeRange: undefined,
        ...overrides,
    };
}

describe('focustree diagnostics: offsetToPosition', () => {
    it('resolves a position on the first line', () => {
        assert.deepStrictEqual(offsetToPosition('abcdef', 3), { line: 0, character: 3 });
    });

    it('advances the line for each newline before the offset', () => {
        const text = 'aaa\nbbb\nccc';
        assert.deepStrictEqual(offsetToPosition(text, 9), { line: 2, character: 1 });
    });

    it('places an offset immediately after a newline at character 0 of the next line', () => {
        const text = 'aaa\nbbb';
        assert.deepStrictEqual(offsetToPosition(text, 4), { line: 1, character: 0 });
    });

    it('clamps an out-of-range offset to the end of the text', () => {
        const text = 'aaa\nbbb';
        assert.deepStrictEqual(offsetToPosition(text, 999), offsetToPosition(text, text.length));
    });
});

describe('focustree diagnostics: computeFocusTreeDiagnostics', () => {
    it('turns a navigable warning into a diagnostic entry addressed by line/character', () => {
        const warning: FocusWarning = {
            text: 'Focus a has a prerequisite that does not exist: missing.',
            source: 'a',
            navigations: [{ file: FILE, start: 5, end: 6 }],
        };
        const t = tree([focus({ id: 'a' })], { warnings: [warning] });

        const byFile = computeFocusTreeDiagnostics([t], { [FILE]: 'xxxx\ny\n' });

        const entries = byFile.get(FILE);
        assert.strictEqual(entries?.length, 1);
        assert.strictEqual(entries[0].message, warning.text);
        assert.deepStrictEqual(entries[0].start, { line: 1, character: 0 });
        assert.deepStrictEqual(entries[0].end, { line: 1, character: 1 });
    });

    it('splits navigations across multiple entries, grouped by their own file', () => {
        const warning: FocusWarning = {
            text: 'Focus a excludes b, but b does not exclude a back.',
            source: 'a',
            navigations: [
                { file: FILE, start: 0, end: 1 },
                { file: OTHER_FILE, start: 0, end: 1 },
            ],
        };
        const t = tree([focus({ id: 'a' })], { warnings: [warning] });

        const byFile = computeFocusTreeDiagnostics([t], { [FILE]: 'a', [OTHER_FILE]: 'b' });

        assert.strictEqual(byFile.get(FILE)?.length, 1);
        assert.strictEqual(byFile.get(OTHER_FILE)?.length, 1);
    });

    it('anchors a warning with no navigations to the tree range, so it is never dropped', () => {
        const warning: FocusWarning = { text: 'Every focus in this tree has a prerequisite, so nothing can be taken first.', source: '' };
        const t = tree([focus({ id: 'a' })], { warnings: [warning], treeRange: { start: 2, end: 6 } });

        const byFile = computeFocusTreeDiagnostics([t], { [FILE]: 'xx????' });

        const entries = byFile.get(FILE);
        assert.strictEqual(entries?.length, 1);
        assert.deepStrictEqual(entries[0].start, { line: 0, character: 2 });
        assert.deepStrictEqual(entries[0].end, { line: 0, character: 6 });
    });

    it('skips a navigation whose file has no known source text, instead of throwing', () => {
        const warning: FocusWarning = { text: 'unresolvable', source: 'a', navigations: [{ file: 'test/unknown.txt', start: 0, end: 1 }] };
        const t = tree([focus({ id: 'a' })], { warnings: [warning] });

        const byFile = computeFocusTreeDiagnostics([t], { [FILE]: 'abc' });

        assert.strictEqual(byFile.size, 0);
    });

    it('aggregates diagnostics across multiple trees', () => {
        const w1: FocusWarning = { text: 'w1', source: 'a', navigations: [{ file: FILE, start: 0, end: 1 }] };
        const w2: FocusWarning = { text: 'w2', source: 'b', navigations: [{ file: FILE, start: 1, end: 2 }] };
        const t1 = tree([focus({ id: 'a' })], { warnings: [w1] });
        const t2 = tree([focus({ id: 'b' })], { warnings: [w2] });

        const byFile = computeFocusTreeDiagnostics([t1, t2], { [FILE]: 'abcdef' });

        assert.strictEqual(byFile.get(FILE)?.length, 2);
        assert.deepStrictEqual(byFile.get(FILE)?.map(e => e.message).sort(), ['w1', 'w2']);
    });
});
