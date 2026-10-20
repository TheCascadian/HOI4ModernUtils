import * as assert from 'assert';
import {
    createFocus,
    deleteFocus,
    deleteFocuses,
    duplicateBranch,
    duplicateFocuses,
    findFocusIdReferences,
    findFocusLocalisationKeys,
    renameFocus,
    setMutuallyExclusive,
    setFocusProperties,
    setPrerequisites,
    setRelativePosition,
    TextEdit,
} from '../../src/previewdef/focustree/edits';
import type { Focus, FocusTree, TokenRange } from '../../src/previewdef/focustree/schema';

// -- Fixture helpers -----------------------------------------------------
// These locate byte ranges in a literal fixture string by content rather
// than by hand-counting offsets, so the fixtures stay readable while the
// edit functions are still exercised against real byte offsets exactly
// like they see in production (schema.ts derives the same shape of ranges
// from the real parser).

function findBlock(source: string, startNeedle: string, from = 0): TokenRange {
    const start = source.indexOf(startNeedle, from);
    assert.ok(start >= 0, `fixture text not found: ${startNeedle}`);
    const braceStart = source.indexOf('{', start);
    let depth = 0;
    for (let i = braceStart; i < source.length; i++) {
        if (source[i] === '{') {
            depth++;
        } else if (source[i] === '}') {
            depth--;
            if (depth === 0) {
                return { start, end: i + 1 };
            }
        }
    }
    throw new Error(`unbalanced braces from: ${startNeedle}`);
}

function findToken(source: string, needle: string, from = 0) {
    const start = source.indexOf(needle, from);
    assert.ok(start >= 0, `fixture text not found: ${needle}`);
    return { value: needle, start, end: start + needle.length, type: 'symbol' };
}

function emptyFocus(overrides: Partial<Focus> & { id: string; file: string }): Focus {
    return {
        x: 0, y: 0, icon: [], textIcon: undefined, searchFilters: [],
        prerequisite: [], prerequisiteGroups: [],
        exclusive: [], exclusiveGroups: [],
        hasAllowBranch: false, inAllowBranch: [], allowBranch: undefined,
        relativePositionId: undefined, relativePositionIdToken: undefined, relativePositionIdRange: undefined,
        offset: [], text: undefined, overlay: undefined,
        token: undefined, idToken: undefined, xToken: undefined, yToken: undefined,
        blockRange: undefined,
        ...overrides,
    };
}

function applyEdits(source: string, edits: TextEdit[]): string {
    const sorted = [...edits].sort((a, b) => b.start - a.start);
    let result = source;
    for (const edit of sorted) {
        result = result.slice(0, edit.start) + edit.newText + result.slice(edit.end);
    }
    return result;
}

const FILE = 'test/focus.txt';

// -- Fixture: a small two-focus tree -------------------------------------

const source =
`focus_tree = {
	id = test_tree
	focus = {
		id = focus_a
		x = 0
		y = 0
		prerequisite = { focus = focus_b }
	}
	focus = {
		id = focus_b
		x = 1
		y = 0
		mutually_exclusive = { focus = focus_a }
	}
}
`;

const treeRange = findBlock(source, 'focus_tree = {');
const blockA = findBlock(source, 'focus = {\n\t\tid = focus_a');
const blockB = findBlock(source, 'focus = {\n\t\tid = focus_b');
const prereqGroupA = findBlock(source, 'prerequisite = {', blockA.start);
const exclusiveGroupB = findBlock(source, 'mutually_exclusive = {', blockB.start);

function buildTree(): FocusTree {
    const focusA = emptyFocus({
        id: 'focus_a', file: FILE, blockRange: blockA,
        idToken: findToken(source, 'focus_a', blockA.start),
        x: 0, y: 0,
        xToken: findToken(source, '0', source.indexOf('x = 0', blockA.start)),
        yToken: findToken(source, '0', source.indexOf('y = 0', blockA.start)),
        prerequisite: [['focus_b']],
        prerequisiteGroups: [{ ids: ['focus_b'], range: prereqGroupA }],
    });
    const focusB = emptyFocus({
        id: 'focus_b', file: FILE, blockRange: blockB,
        idToken: findToken(source, 'focus_b', blockB.start),
        x: 1, y: 0,
        xToken: findToken(source, '1', source.indexOf('x = 1', blockB.start)),
        yToken: findToken(source, '0', source.indexOf('y = 0', blockB.start)),
        exclusive: ['focus_a'],
        exclusiveGroups: [{ ids: ['focus_a'], range: exclusiveGroupB }],
    });
    return {
        id: 'test_tree', focuses: { focus_a: focusA, focus_b: focusB },
        allowBranchOptions: [], conditionExprs: [], isSharedFocues: false, warnings: [],
        file: FILE, treeRange,
        searchFilters: [], inlayWindows: [], continuousFocusPositionToken: undefined,
    };
}

describe('focustree edits: minimal, git-friendly text patches', () => {
    it('setPrerequisites leaves an unchanged group byte-for-byte untouched', () => {
        const tree = buildTree();
        const edits = setPrerequisites(tree.focuses.focus_a, source, [['focus_b']]);
        assert.deepStrictEqual(edits, []);
    });

    it('setPrerequisites appends a new OR-group without touching the existing one', () => {
        const tree = buildTree();
        const edits = setPrerequisites(tree.focuses.focus_a, source, [['focus_b'], ['focus_c']]);
        const result = applyEdits(source, edits);
        assert.ok(result.includes('prerequisite = { focus = focus_b }'));
        assert.ok(result.includes('prerequisite = { focus = focus_c }'));
        // Only the new line was added: every other line is unchanged.
        const originalLines = source.split('\n');
        const resultLines = result.split('\n');
        assert.strictEqual(resultLines.length, originalLines.length + 1);
    });

    it('setPrerequisites removes a group that is no longer desired, leaving no orphaned indentation', () => {
        const tree = buildTree();
        const edits = setPrerequisites(tree.focuses.focus_a, source, []);
        const result = applyEdits(source, edits);
        assert.ok(!result.includes('prerequisite'));
        assert.strictEqual(result, source.replace('\t\tprerequisite = { focus = focus_b }\n', ''));
    });

    it('setMutuallyExclusive is a no-op when the desired list already matches', () => {
        const tree = buildTree();
        const edits = setMutuallyExclusive(tree.focuses.focus_b, source, [['focus_a']]);
        assert.deepStrictEqual(edits, []);
    });

    it('setMutuallyExclusive preserves a multi-focus block instead of flattening it', () => {
        const withGroupedMutex = source.replace(
            'mutually_exclusive = { focus = focus_a }',
            'mutually_exclusive = { focus = focus_a focus = focus_c }',
        );
        const focus = emptyFocus({
            id: 'focus_b',
            file: FILE,
            blockRange: findBlock(withGroupedMutex, 'focus = {\n\t\tid = focus_b'),
            exclusive: ['focus_a', 'focus_c'],
            exclusiveGroups: [{
                ids: ['focus_a', 'focus_c'],
                range: findBlock(withGroupedMutex, 'mutually_exclusive = {'),
            }],
        });
        assert.deepStrictEqual(setMutuallyExclusive(focus, withGroupedMutex, [['focus_a', 'focus_c']]), []);
    });

    it('setRelativePosition inserts a new statement before the closing brace', () => {
        const tree = buildTree();
        const edits = setRelativePosition(tree.focuses.focus_b, source, 'focus_a');
        const result = applyEdits(source, edits);
        assert.ok(/relative_position_id = focus_a\s*\n\s*\}/.test(result));
    });

    it('setRelativePosition patches an existing token in place', () => {
        const withRelative = source.replace(
            'mutually_exclusive = { focus = focus_a }',
            'mutually_exclusive = { focus = focus_a }\n\t\trelative_position_id = focus_a'
        );
        const relativeToken = findToken(withRelative, 'focus_a', withRelative.indexOf('relative_position_id ='));
        const focusB = emptyFocus({
            id: 'focus_b', file: FILE,
            blockRange: findBlock(withRelative, 'focus = {\n\t\tid = focus_b'),
            relativePositionId: 'focus_a',
            relativePositionIdToken: relativeToken,
            relativePositionIdRange: { start: withRelative.indexOf('relative_position_id ='), end: relativeToken.end },
        });
        const edits = setRelativePosition(focusB, withRelative, 'focus_c');
        assert.strictEqual(edits.length, 1);
        const result = applyEdits(withRelative, edits);
        assert.ok(result.includes('relative_position_id = focus_c'));
        // A patch-in-place changes only the token span, nothing else.
        assert.strictEqual(result.length, withRelative.length - 'focus_a'.length + 'focus_c'.length);
    });

    it('setRelativePosition(undefined) deletes the whole statement and its line', () => {
        const withRelative = source.replace(
            'mutually_exclusive = { focus = focus_a }',
            'mutually_exclusive = { focus = focus_a }\n\t\trelative_position_id = focus_a'
        );
        const start = withRelative.indexOf('relative_position_id =');
        const relativeToken = findToken(withRelative, 'focus_a', start);
        const focusB = emptyFocus({
            id: 'focus_b', file: FILE,
            blockRange: findBlock(withRelative, 'focus = {\n\t\tid = focus_b'),
            relativePositionId: 'focus_a',
            relativePositionIdToken: relativeToken,
            relativePositionIdRange: { start, end: relativeToken.end },
        });
        const edits = setRelativePosition(focusB, withRelative, undefined);
        const result = applyEdits(withRelative, edits);
        assert.ok(!result.includes('relative_position_id'));
        assert.strictEqual(result, source);
    });

    it('setFocusProperties adds gameplay fields in one insertion without touching unknown script', () => {
        const tree = buildTree();
        const focus = tree.focuses.focus_b;
        const edits = setFocusProperties(focus, source, {
            icon: 'GFX_goal_test',
            cost: '10',
            completion_reward: 'add_political_power = 50',
            cancel_if_invalid: true,
        });
        const result = applyEdits(source, edits);
        assert.ok(result.includes('\t\ticon = GFX_goal_test'));
        assert.ok(result.includes('\t\tcost = 10'));
        assert.ok(result.includes('\t\tcompletion_reward = {\n\t\t\tadd_political_power = 50\n\t\t}'));
        assert.ok(result.includes('\t\tcancel_if_invalid = yes'));
        assert.ok(result.includes('mutually_exclusive = { focus = focus_a }'));
        assert.strictEqual(edits.filter(edit => edit.start === focus.blockRange!.end - 1).length, 1);
    });

    it('setFocusProperties replaces and removes known fields while preserving neighboring statements', () => {
        const withProperties = source.replace(
            '\t\ty = 0\n\t\tmutually_exclusive',
            '\t\ty = 0\n\t\tcost = 7\n\t\tavailable = { has_war = yes }\n\t\tmutually_exclusive',
        );
        const focus = emptyFocus({
            id: 'focus_b',
            file: FILE,
            blockRange: findBlock(withProperties, 'focus = {\n\t\tid = focus_b'),
        });
        const edits = setFocusProperties(focus, withProperties, { cost: '14', available: '' });
        const result = applyEdits(withProperties, edits);
        assert.ok(result.includes('\t\tcost = 14'));
        assert.ok(!result.includes('available ='));
        assert.ok(result.includes('mutually_exclusive = { focus = focus_a }'));
    });

    it('setFocusProperties preserves comments and whitespace supplied by the raw block editor', () => {
        const tree = buildTree();
        const rawBody = '\n\t\t\t# Keep this custom condition\n\t\t\tcustom_trigger = yes\n\t\t';
        const result = applyEdits(source, setFocusProperties(tree.focuses.focus_b, source, { available: rawBody }));
        assert.ok(result.includes(`available = {${rawBody}}`));
        assert.ok(result.includes('mutually_exclusive = { focus = focus_a }'));
    });

    it('createFocus appends a new block after the last sibling, matching its indentation', () => {
        const tree = buildTree();
        const edits = createFocus(tree, source, { id: 'focus_c', x: 2, y: 0 });
        const result = applyEdits(source, edits);
        assert.ok(result.includes('\tfocus = {\n\t\tid = focus_c\n\t\tx = 2\n\t\ty = 0\n\t}'));
        // Everything before the insertion point is untouched.
        assert.ok(result.startsWith(source.slice(0, blockB.end)));
    });

    it('createFocus anchors to the tree itself when it has no focuses yet', () => {
        const empty = 'focus_tree = {\n\tid = empty_tree\n}\n';
        const emptyTreeRange = findBlock(empty, 'focus_tree = {');
        const tree: FocusTree = {
            id: 'empty_tree', focuses: {}, allowBranchOptions: [], conditionExprs: [],
            isSharedFocues: false, warnings: [], file: FILE, treeRange: emptyTreeRange,
            searchFilters: [], inlayWindows: [], continuousFocusPositionToken: undefined,
        };
        const edits = createFocus(tree, empty, { id: 'focus_a', x: 0, y: 0 });
        const result = applyEdits(empty, edits);
        assert.ok(result.includes('\tfocus = {\n\t\tid = focus_a\n\t\tx = 0\n\t\ty = 0\n\t}\n'));
    });

    it('deleteFocus removes the block and strips every reference to it in one batch, with clean whitespace', () => {
        const tree = buildTree();
        const edits = deleteFocus(tree, { [FILE]: source }, 'focus_a');
        const result = applyEdits(source, edits);
        assert.strictEqual(
            result,
            `focus_tree = {\n\tid = test_tree\n\tfocus = {\n\t\tid = focus_b\n\t\tx = 1\n\t\ty = 0\n\t}\n}\n`,
        );
    });

    it('renameFocus updates the id and every reference across the tree', () => {
        const tree = buildTree();
        const edits = renameFocus(tree, 'focus_b', 'focus_b_renamed');
        const result = applyEdits(source, edits);
        assert.ok(result.includes('id = focus_b_renamed'));
        assert.ok(result.includes('prerequisite = { focus = focus_b_renamed }'));
        assert.ok(result.includes('mutually_exclusive = { focus = focus_a }'));
        assert.ok(!result.includes('id = focus_b\n'));
    });

    it('findFocusIdReferences patches only parsed focus-reference properties', () => {
        const projectFile = `# focus_b must stay in this comment\ncountry_event = {\n\tid = focus_b\n\ttrigger = { has_completed_focus = focus_b }\n\tcomplete_national_focus = focus_b\n\tcustom_key = focus_b\n}\n`;
        const result = applyEdits(projectFile, findFocusIdReferences(FILE, projectFile, 'focus_b', 'focus_new'));
        assert.ok(result.includes('# focus_b must stay in this comment'));
        assert.ok(result.includes('id = focus_b'));
        assert.ok(result.includes('has_completed_focus = focus_new'));
        assert.ok(result.includes('complete_national_focus = focus_new'));
        assert.ok(result.includes('custom_key = focus_b'));
    });

    it('findFocusLocalisationKeys renames exact name/description keys but not similar prefixes or values', () => {
        const localisation = `l_english:\n focus_b:0 "Focus focus_b"\n focus_b_desc:0 "Description"\n focus_bonus:0 "Other"\n`;
        const result = applyEdits(localisation, findFocusLocalisationKeys('test.yml', localisation, 'focus_b', 'focus_new'));
        assert.ok(result.includes('focus_new:0 "Focus focus_b"'));
        assert.ok(result.includes('focus_new_desc:0 "Description"'));
        assert.ok(result.includes('focus_bonus:0 "Other"'));
    });

    it('deleteFocuses removes multiple focuses and every cross-reference between them in one atomic batch', () => {
        const tree = buildTree();
        const edits = deleteFocuses(tree, { [FILE]: source }, ['focus_a', 'focus_b']);
        const result = applyEdits(source, edits);
        assert.strictEqual(result, `focus_tree = {\n\tid = test_tree\n}\n`);
    });

    it('deleteFocuses strips a group down to only the surviving ids when just one of several deleted focuses is referenced', () => {
        const withThird = source.replace(
            'mutually_exclusive = { focus = focus_a }',
            'mutually_exclusive = { focus = focus_a focus = focus_c }'
        );
        const tree = buildTree();
        tree.focuses.focus_b.exclusiveGroups = [{
            ids: ['focus_a', 'focus_c'],
            range: findBlock(withThird, 'mutually_exclusive = {', tree.focuses.focus_b.blockRange!.start),
        }];
        const edits = deleteFocuses(tree, { [FILE]: withThird }, ['focus_a']);
        const result = applyEdits(withThird, edits);
        assert.ok(result.includes('mutually_exclusive = { focus = focus_c }'));
        assert.ok(!result.includes('id = focus_a\n'));
    });

    it('duplicateFocuses copies the full raw block, patching only id/x/y, and anchors after the last sibling', () => {
        const tree = buildTree();
        const { edits, skipped } = duplicateFocuses(tree, source, ['focus_a'], 1, 1);
        assert.deepStrictEqual(skipped, []);
        const result = applyEdits(source, edits);
        // Original untouched, including its own prerequisite block.
        assert.ok(result.includes('id = focus_a\n\t\tx = 0\n\t\ty = 0\n\t\tprerequisite = { focus = focus_b }'));
        // Duplicate carries the same script (prerequisite included) but a fresh id/position.
        assert.ok(result.includes('id = focus_a_copy\n\t\tx = 1\n\t\ty = 1\n\t\tprerequisite = { focus = focus_b }'));
        // Inserted after the last sibling (focus_b), same as createFocus.
        assert.ok(result.indexOf('id = focus_a_copy') > result.indexOf('id = focus_b'));
    });

    it('duplicateFocuses picks a fresh id when the first candidate is already taken', () => {
        const withCopy = buildTree();
        withCopy.focuses.focus_a_copy = { ...withCopy.focuses.focus_a, id: 'focus_a_copy' };
        const { edits } = duplicateFocuses(withCopy, source, ['focus_a'], 1, 1);
        const result = applyEdits(source, edits);
        assert.ok(result.includes('id = focus_a_copy2'));
    });

    it('duplicateFocuses skips a focus whose x/y are not plain numeric tokens', () => {
        const tree = buildTree();
        tree.focuses.focus_a.xToken = undefined;
        const { edits, skipped } = duplicateFocuses(tree, source, ['focus_a'], 1, 1);
        assert.deepStrictEqual(skipped, ['focus_a']);
        assert.deepStrictEqual(edits, []);
    });

    it('duplicateFocuses duplicates a partial batch, reporting only the ones it could not copy', () => {
        const tree = buildTree();
        tree.focuses.focus_b.idToken = undefined;
        const { edits, skipped } = duplicateFocuses(tree, source, ['focus_a', 'focus_b'], 1, 1);
        assert.deepStrictEqual(skipped, ['focus_b']);
        const result = applyEdits(source, edits);
        assert.ok(result.includes('id = focus_a_copy'));
        assert.ok(!result.includes('focus_b_copy'));
    });

    it('duplicateBranch copies a focus and its downstream branch, remapping references between them', () => {
        const tree = buildTree();
        // focus_a requires focus_b, so the branch rooted at focus_b is { focus_b, focus_a }.
        const { edits, skipped } = duplicateBranch(tree, source, 'focus_b', 1, 1);
        assert.deepStrictEqual(skipped, []);
        const result = applyEdits(source, edits);

        // Originals are untouched.
        assert.ok(result.includes('id = focus_a\n\t\tx = 0\n\t\ty = 0\n\t\tprerequisite = { focus = focus_b }'));
        assert.ok(result.includes('id = focus_b\n\t\tx = 1\n\t\ty = 0\n\t\tmutually_exclusive = { focus = focus_a }'));

        // Copies reference each other's new ids, not the originals.
        assert.ok(result.includes('id = focus_a_copy\n\t\tx = 1\n\t\ty = 1\n\t\tprerequisite = { focus = focus_b_copy }'));
        assert.ok(result.includes('id = focus_b_copy\n\t\tx = 2\n\t\ty = 1\n\t\tmutually_exclusive = { focus = focus_a_copy }'));
    });

    it('duplicateBranch duplicates a leaf alone when nothing depends on it, keeping its outward reference untouched', () => {
        const tree = buildTree();
        // focus_a has no downstream dependents, so its branch is just itself; its
        // own prerequisite on focus_b is an *upstream* reference and stays as-is.
        const { edits, skipped } = duplicateBranch(tree, source, 'focus_a', 1, 1);
        assert.deepStrictEqual(skipped, []);
        const result = applyEdits(source, edits);
        assert.ok(result.includes('id = focus_a_copy\n\t\tx = 1\n\t\ty = 1\n\t\tprerequisite = { focus = focus_b }'));
        assert.ok(!result.includes('focus_b_copy'));
    });

    it('duplicateBranch skips an undupliable member and reports it, leaving the rest of the branch pointing at its original', () => {
        const tree = buildTree();
        tree.focuses.focus_b.xToken = undefined;
        const { edits, skipped } = duplicateBranch(tree, source, 'focus_b', 1, 1);
        assert.deepStrictEqual(skipped, ['focus_b']);
        const result = applyEdits(source, edits);
        // focus_a is still duplicated (it was independently qualifiable), but since
        // focus_b couldn't be copied, the copy's prerequisite still points at the original.
        assert.ok(result.includes('id = focus_a_copy\n\t\tx = 1\n\t\ty = 1\n\t\tprerequisite = { focus = focus_b }'));
        assert.ok(!result.includes('focus_b_copy'));
    });
});

describe('focus edit regressions', () => {
    it('validates focus IDs', () => {
        const { isValidFocusId } = require('../../src/previewdef/focustree/focusid');
        assert.ok(isValidFocusId('GER_a.b-c'));
        for (const bad of ['a b', 'a=b', 'a{', '', 'a#b', '"a"']) {
            assert.ok(!isValidFocusId(bad), bad);
        }
    });
});
