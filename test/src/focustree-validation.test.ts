import * as assert from 'assert';
import { validateFocusTree } from '../../src/previewdef/focustree/validation';
import type { Focus, FocusTree } from '../../src/previewdef/focustree/schema';

const FILE = 'test/focus.txt';

function focus(overrides: Partial<Focus> & { id: string }): Focus {
    return {
        x: 0, y: 0, icon: [], textIcon: undefined, searchFilters: [],
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

function tree(focuses: Focus[]): FocusTree {
    return {
        id: 'test_tree',
        focuses: Object.fromEntries(focuses.map(f => [f.id, f])),
        allowBranchOptions: [], conditionExprs: [], isSharedFocues: false, warnings: [],
        file: FILE, treeRange: undefined,
        searchFilters: [], inlayWindows: [], continuousFocusPositionToken: undefined,
    };
}

function withPrereq(id: string, groups: string[][], overrides: Partial<Focus> = {}): Focus {
    return focus({ id, prerequisite: groups, prerequisiteGroups: groups.map(ids => ({ ids, range: { start: 0, end: 0 } })), ...overrides });
}

function withMutex(id: string, ids: string[], overrides: Partial<Focus> = {}): Focus {
    return focus({ id, exclusive: ids, exclusiveGroups: [{ ids, range: { start: 0, end: 0 } }], ...overrides });
}

function messagesFor(warnings: ReturnType<typeof validateFocusTree>, id: string): string[] {
    return warnings.filter(w => w.source === id).map(w => w.text);
}

describe('focustree validation', () => {
    it('flags a prerequisite referencing a focus that does not exist', () => {
        const t = tree([withPrereq('a', [['missing']])]);
        const warnings = validateFocusTree(t);
        assert.ok(messagesFor(warnings, 'a').some(m => m.includes('missing')));
    });

    it('flags a focus that lists itself as a prerequisite', () => {
        const t = tree([withPrereq('a', [['a']])]);
        const warnings = validateFocusTree(t);
        assert.ok(messagesFor(warnings, 'a').some(m => m.toLowerCase().includes('itself')));
    });

    it('flags a duplicated prerequisite entry', () => {
        const t = tree([focus({ id: 'a' }), withPrereq('b', [['a'], ['a']])]);
        const warnings = validateFocusTree(t);
        assert.ok(messagesFor(warnings, 'b').some(m => m.toLowerCase().includes('more than once')));
    });

    it('detects a prerequisite cycle', () => {
        const t = tree([
            withPrereq('a', [['b']]),
            withPrereq('b', [['c']]),
            withPrereq('c', [['a']]),
        ]);
        const warnings = validateFocusTree(t);
        assert.ok(warnings.some(w => w.text.toLowerCase().includes('cycle')));
        // Every member of the cycle gets its own diagnostic, at its own location.
        assert.ok(['a', 'b', 'c'].every(id => messagesFor(warnings, id).some(m => m.includes('cycle'))));
    });

    it('does not flag a valid AND-of-OR chain with a real root as a cycle or unreachable', () => {
        const t = tree([
            focus({ id: 'root', x: 0 }),
            withPrereq('branch', [['root']], { x: 1 }),
        ]);
        const warnings = validateFocusTree(t);
        assert.strictEqual(warnings.length, 0);
    });

    it('flags a mutually-exclusive reference to a focus that does not exist', () => {
        const t = tree([withMutex('a', ['missing'])]);
        const warnings = validateFocusTree(t);
        assert.ok(messagesFor(warnings, 'a').some(m => m.includes('missing')));
    });

    it('flags mutual exclusion with itself', () => {
        const t = tree([withMutex('a', ['a'])]);
        const warnings = validateFocusTree(t);
        assert.ok(messagesFor(warnings, 'a').some(m => m.toLowerCase().includes('itself')));
    });

    it('flags one-sided (asymmetric) mutual exclusion', () => {
        const t = tree([withMutex('a', ['b']), focus({ id: 'b' })]);
        const warnings = validateFocusTree(t);
        assert.ok(messagesFor(warnings, 'a').some(m => m.includes('does not exclude')));
    });

    it('does not flag reciprocal mutual exclusion', () => {
        const t = tree([withMutex('a', ['b'], { x: 0 }), withMutex('b', ['a'], { x: 1 })]);
        const warnings = validateFocusTree(t);
        assert.strictEqual(warnings.length, 0);
    });

    it('flags two focuses at the same absolute coordinate', () => {
        const t = tree([focus({ id: 'a', x: 5, y: 5 }), focus({ id: 'b', x: 5, y: 5 })]);
        const warnings = validateFocusTree(t);
        assert.ok(messagesFor(warnings, 'a').some(m => m.includes('same position')));
        assert.ok(messagesFor(warnings, 'b').some(m => m.includes('same position')));
    });

    it('resolves relative_position_id chains before checking for collisions', () => {
        const anchor = focus({ id: 'anchor', x: 10, y: 10 });
        // b sits at anchor + (0,0) -- same absolute position as a plain focus at (10,10).
        const relative = focus({ id: 'relative', x: 0, y: 0, relativePositionId: 'anchor' });
        const plain = focus({ id: 'plain', x: 10, y: 10 });
        const warnings = validateFocusTree(tree([anchor, relative, plain]));
        assert.ok(messagesFor(warnings, 'relative').some(m => m.includes('same position')));
        assert.ok(messagesFor(warnings, 'plain').some(m => m.includes('same position')));
    });

    it('does not flag focuses at different resolved positions', () => {
        const anchor = focus({ id: 'anchor', x: 10, y: 10 });
        const relative = focus({ id: 'relative', x: 1, y: 0, relativePositionId: 'anchor' });
        const warnings = validateFocusTree(tree([anchor, relative]));
        assert.strictEqual(warnings.filter(w => w.text.includes('same position')).length, 0);
    });

    it('flags an unreachable focus whose only prerequisite is missing', () => {
        const t = tree([withPrereq('a', [['missing']])]);
        const warnings = validateFocusTree(t);
        assert.ok(messagesFor(warnings, 'a').some(m => m.toLowerCase().includes('never be reached')));
    });

    it('flags a tree where every focus has a prerequisite (no root)', () => {
        const t = tree([withPrereq('a', [['b']]), withPrereq('b', [['a']])]);
        const warnings = validateFocusTree(t);
        assert.ok(warnings.some(w => w.text.includes('nothing can be taken first')));
    });

    it('does not flag a normal tree with a root focus', () => {
        const t = tree([focus({ id: 'root' }), withPrereq('child', [['root']])]);
        const warnings = validateFocusTree(t);
        assert.strictEqual(warnings.filter(w => w.text.includes('nothing can be taken first')).length, 0);
        assert.strictEqual(warnings.filter(w => w.text.toLowerCase().includes('never be reached')).length, 0);
    });
});
