import { Token } from "../../hoiformat/hoiparser";
import { Focus, FocusRelationGroup, FocusTree, TokenRange } from "./schema";

/**
 * A single surgical text replacement, expressed as byte offsets into the
 * source text of one file. Deliberately decoupled from `vscode.TextDocument`
 * so these functions are pure and unit-testable against plain fixture
 * strings; the caller (`index.ts`) converts offsets to `vscode.Range`s via
 * `document.positionAt()` and batches everything into one `WorkspaceEdit`,
 * exactly like the existing x/y drag handling already does.
 */
export interface TextEdit {
    file: string;
    start: number;
    end: number;
    newText: string;
}

const TAB = '\t';

function indentOf(sourceText: string, offset: number): string {
    const lineStart = sourceText.lastIndexOf('\n', offset - 1) + 1;
    const match = /^[ \t]*/.exec(sourceText.slice(lineStart, offset));
    return match ? match[0] : '';
}

function consumeTrailingNewline(sourceText: string, end: number): number {
    if (sourceText[end] === '\n') {
        return end + 1;
    }
    if (sourceText[end] === '\r' && sourceText[end + 1] === '\n') {
        return end + 2;
    }
    return end;
}

function deleteSpan(file: string, sourceText: string, range: TokenRange): TextEdit {
    // If the statement is the only thing on its line, remove its leading
    // indentation too, so deleting it doesn't leave an orphaned blank
    // (or, worse, whitespace silently prepended onto the next line).
    let start = range.start;
    const lineStart = sourceText.lastIndexOf('\n', start - 1) + 1;
    if (/^[ \t]*$/.test(sourceText.slice(lineStart, start))) {
        start = lineStart;
    }
    return { file, start, end: consumeTrailingNewline(sourceText, range.end), newText: '' };
}

function renderGroup(keyword: 'prerequisite' | 'mutually_exclusive', ids: string[]): string {
    return `${keyword} = { ${ids.map(id => `focus = ${id}`).join(' ')} }`;
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
    return a.size === b.size && [...a].every(v => b.has(v));
}

/** Patches a single-token value in place -- the general form of the existing x/y drag edit. */
export function patchToken(file: string, token: Token, newValue: string): TextEdit {
    return { file, start: token.start, end: token.end, newText: newValue };
}

/**
 * Reconciles a focus's `prerequisite = { ... }` (or `mutually_exclusive = { ... }`)
 * blocks against a desired set of OR-groups: untouched groups are left
 * completely alone (byte-for-byte), removed groups are deleted, and new
 * groups are appended in one batch just before the focus's closing brace.
 */
function setRelationGroups(
    focus: Focus,
    sourceText: string,
    keyword: 'prerequisite' | 'mutually_exclusive',
    currentGroups: FocusRelationGroup[],
    desiredGroups: string[][],
): TextEdit[] {
    if (!focus.blockRange) {
        return [];
    }

    const edits: TextEdit[] = [];
    const desiredSets = desiredGroups.map(ids => new Set(ids));
    const matchedDesired = new Set<number>();

    for (const group of currentGroups) {
        const groupSet = new Set(group.ids);
        const matchIndex = desiredSets.findIndex((set, i) => !matchedDesired.has(i) && setsEqual(set, groupSet));
        if (matchIndex >= 0) {
            matchedDesired.add(matchIndex);
        } else {
            edits.push(deleteSpan(focus.file, sourceText, group.range));
        }
    }

    const indent = indentOf(sourceText, focus.blockRange.start) + TAB;
    const newLines = desiredGroups
        .filter((_, i) => !matchedDesired.has(i))
        .map(ids => `${indent}${renderGroup(keyword, ids)}\n`)
        .join('');
    if (newLines) {
        edits.push({ file: focus.file, start: focus.blockRange.end - 1, end: focus.blockRange.end - 1, newText: newLines });
    }

    return edits;
}

/** Sets a focus's full prerequisite structure: AND-of-OR-groups, matching `Focus.prerequisite`. */
export function setPrerequisites(focus: Focus, sourceText: string, desiredGroups: string[][]): TextEdit[] {
    return setRelationGroups(focus, sourceText, 'prerequisite', focus.prerequisiteGroups, desiredGroups.filter(g => g.length > 0));
}

/** Sets a focus's full mutually-exclusive list. Always authors one ID per block; see module notes on multi-ID blocks. */
export function setMutuallyExclusive(focus: Focus, sourceText: string, desiredIds: string[]): TextEdit[] {
    return setRelationGroups(focus, sourceText, 'mutually_exclusive', focus.exclusiveGroups, desiredIds.map(id => [id]));
}

/** Sets, patches, or clears a focus's `relative_position_id`. */
export function setRelativePosition(focus: Focus, sourceText: string, newAnchorId: string | undefined): TextEdit[] {
    if (newAnchorId === undefined) {
        return focus.relativePositionIdRange ? [deleteSpan(focus.file, sourceText, focus.relativePositionIdRange)] : [];
    }
    if (focus.relativePositionIdToken) {
        return [patchToken(focus.file, focus.relativePositionIdToken, newAnchorId)];
    }
    if (!focus.blockRange) {
        return [];
    }
    const indent = indentOf(sourceText, focus.blockRange.start) + TAB;
    return [{
        file: focus.file,
        start: focus.blockRange.end - 1,
        end: focus.blockRange.end - 1,
        newText: `${indent}relative_position_id = ${newAnchorId}\n`,
    }];
}

/** Appends a brand-new `focus = { id = ...  x = ...  y = ... }` block to a tree, matching the indentation of its last sibling (or the tree itself, if it has none yet). */
export function createFocus(tree: FocusTree, sourceText: string, focus: { id: string; x: number; y: number }): TextEdit[] {
    const siblings = Object.values(tree.focuses).filter((f): f is Focus & { blockRange: TokenRange } => !!f.blockRange && f.file === tree.file);
    const last = siblings.length > 0 ? siblings.reduce((a, b) => (a.blockRange.end > b.blockRange.end ? a : b)) : undefined;

    if (last) {
        const indent = indentOf(sourceText, last.blockRange.start);
        const inner = indent + TAB;
        const block = `\n${indent}focus = {\n${inner}id = ${focus.id}\n${inner}x = ${focus.x}\n${inner}y = ${focus.y}\n${indent}}`;
        return [{ file: tree.file, start: last.blockRange.end, end: last.blockRange.end, newText: block }];
    }

    if (tree.treeRange) {
        const indent = indentOf(sourceText, tree.treeRange.start) + TAB;
        const inner = indent + TAB;
        const block = `${indent}focus = {\n${inner}id = ${focus.id}\n${inner}x = ${focus.x}\n${inner}y = ${focus.y}\n${indent}}\n`;
        return [{ file: tree.file, start: tree.treeRange.end - 1, end: tree.treeRange.end - 1, newText: block }];
    }

    // Empty shared/joint focus pseudo-tree: there is no enclosing block to anchor a new focus against.
    return [];
}

/**
 * Deletes one or more focuses and, in the same batch, strips every other
 * focus's reference to any of them (prerequisite, mutually_exclusive,
 * relative_position_id) so the tree never ends up with a dangling reference.
 * One `WorkspaceEdit` built from this list is one atomic undo step, whether
 * one focus or a whole multi-selection is being deleted.
 *
 * `sourceTextByFile` must contain the text of every file any focus in the
 * tree lives in (focuses can span files via shared_focus); files that
 * cannot be resolved are silently skipped, matching how the existing x/y
 * edit already treats an unresolvable file as "leave that part alone".
 */
export function deleteFocuses(tree: FocusTree, sourceTextByFile: Record<string, string>, focusIds: string[]): TextEdit[] {
    const targetSet = new Set(focusIds);
    const edits: TextEdit[] = [];

    for (const focusId of focusIds) {
        const target = tree.focuses[focusId];
        if (!target?.blockRange) {
            continue;
        }
        const targetSource = sourceTextByFile[target.file];
        if (targetSource !== undefined) {
            edits.push(deleteSpan(target.file, targetSource, target.blockRange));
        }
    }

    for (const other of Object.values(tree.focuses)) {
        if (targetSet.has(other.id)) {
            continue;
        }
        const otherSource = sourceTextByFile[other.file];
        if (otherSource === undefined) {
            continue;
        }

        for (const group of other.prerequisiteGroups) {
            if (group.ids.some(id => targetSet.has(id))) {
                const remaining = group.ids.filter(id => !targetSet.has(id));
                edits.push(remaining.length === 0 ?
                    deleteSpan(other.file, otherSource, group.range) :
                    { file: other.file, start: group.range.start, end: group.range.end, newText: renderGroup('prerequisite', remaining) });
            }
        }
        for (const group of other.exclusiveGroups) {
            if (group.ids.some(id => targetSet.has(id))) {
                const remaining = group.ids.filter(id => !targetSet.has(id));
                edits.push(remaining.length === 0 ?
                    deleteSpan(other.file, otherSource, group.range) :
                    { file: other.file, start: group.range.start, end: group.range.end, newText: renderGroup('mutually_exclusive', remaining) });
            }
        }
        if (other.relativePositionId !== undefined && targetSet.has(other.relativePositionId)) {
            edits.push(...setRelativePosition(other, otherSource, undefined));
        }
    }

    return edits;
}

/** Single-focus convenience wrapper around {@link deleteFocuses}. */
export function deleteFocus(tree: FocusTree, sourceTextByFile: Record<string, string>, focusId: string): TextEdit[] {
    return deleteFocuses(tree, sourceTextByFile, [focusId]);
}

function uniqueDuplicateId(baseId: string, taken: Set<string>): string {
    if (!taken.has(`${baseId}_copy`)) {
        return `${baseId}_copy`;
    }
    let n = 2;
    while (taken.has(`${baseId}_copy${n}`)) {
        n++;
    }
    return `${baseId}_copy${n}`;
}

/**
 * Copies a focus's exact source text (so icons, costs, effects, and any
 * script Modern Utils does not understand survive byte-for-byte), patching
 * its `id`/`x`/`y` tokens plus any prerequisite/mutually_exclusive group or
 * relative_position_id reference whose target is itself being remapped
 * (i.e. another member of the same batch of duplicates). References to
 * anything outside `idRemap` are left completely alone, so they keep
 * pointing at the original, untouched focus.
 */
function buildDuplicateBlock(focus: Focus & { blockRange: TokenRange; idToken: Token; xToken: Token; yToken: Token }, sourceText: string, idRemap: Record<string, string>, offsetX: number, offsetY: number): string {
    const blockStart = focus.blockRange.start;
    let text = sourceText.slice(blockStart, focus.blockRange.end);

    const patches: { start: number; end: number; value: string }[] = [
        { start: focus.idToken.start, end: focus.idToken.end, value: idRemap[focus.id] },
        { start: focus.xToken.start, end: focus.xToken.end, value: String(focus.x + offsetX) },
        { start: focus.yToken.start, end: focus.yToken.end, value: String(focus.y + offsetY) },
    ];

    for (const group of focus.prerequisiteGroups) {
        if (group.ids.some(id => idRemap[id])) {
            const remapped = group.ids.map(id => idRemap[id] ?? id);
            patches.push({ start: group.range.start, end: group.range.end, value: renderGroup('prerequisite', remapped) });
        }
    }
    for (const group of focus.exclusiveGroups) {
        if (group.ids.some(id => idRemap[id])) {
            const remapped = group.ids.map(id => idRemap[id] ?? id);
            patches.push({ start: group.range.start, end: group.range.end, value: renderGroup('mutually_exclusive', remapped) });
        }
    }
    if (focus.relativePositionId !== undefined && idRemap[focus.relativePositionId] && focus.relativePositionIdToken) {
        const token = focus.relativePositionIdToken;
        patches.push({ start: token.start, end: token.end, value: idRemap[focus.relativePositionId] });
    }

    patches.sort((a, b) => b.start - a.start);
    for (const patch of patches) {
        const relStart = patch.start - blockStart;
        const relEnd = patch.end - blockStart;
        text = text.slice(0, relStart) + patch.value + text.slice(relEnd);
    }

    return text;
}

/** Inserts freshly-authored focus blocks after the tree's last existing focus (or just inside an empty tree), matching indentation. */
function insertNewBlocks(tree: FocusTree, sourceText: string, newBlocks: string[]): TextEdit[] {
    if (newBlocks.length === 0) {
        return [];
    }

    const siblings = Object.values(tree.focuses).filter((f): f is Focus & { blockRange: TokenRange } => !!f.blockRange && f.file === tree.file);
    const last = siblings.length > 0 ? siblings.reduce((a, b) => (a.blockRange.end > b.blockRange.end ? a : b)) : undefined;

    if (last) {
        const indent = indentOf(sourceText, last.blockRange.start);
        const insertion = newBlocks.map(block => `\n${indent}${block}`).join('');
        return [{ file: tree.file, start: last.blockRange.end, end: last.blockRange.end, newText: insertion }];
    }

    if (tree.treeRange) {
        const indent = indentOf(sourceText, tree.treeRange.start) + TAB;
        const insertion = newBlocks.map(block => `${indent}${block}\n`).join('');
        return [{ file: tree.file, start: tree.treeRange.end - 1, end: tree.treeRange.end - 1, newText: insertion }];
    }

    return [];
}

type DuplicatableFocus = Focus & { blockRange: TokenRange; idToken: Token; xToken: Token; yToken: Token };

function isDuplicatable(focus: Focus | undefined, treeFile: string): focus is DuplicatableFocus {
    return !!focus?.blockRange && focus.file === treeFile && !!focus.idToken && !!focus.xToken && !!focus.yToken &&
        /^-?\d+$/.test(focus.xToken.value) && /^-?\d+$/.test(focus.yToken.value);
}

/**
 * Duplicates one or more focuses. References between the duplicated
 * focuses and anything outside the batch (including each other's original
 * versions) are left pointing at the originals -- these are independent
 * copies, not a linked branch; use {@link duplicateBranch} for that.
 * Focuses that live in a different file than the tree, or whose id/x/y are
 * not simple single-token values, are skipped -- duplication needs to know
 * exactly which bytes to patch, and cannot safely guess at an expression.
 */
export function duplicateFocuses(tree: FocusTree, sourceText: string, focusIds: string[], offsetX: number, offsetY: number): { edits: TextEdit[]; skipped: string[] } {
    const takenIds = new Set(Object.keys(tree.focuses));
    const skipped: string[] = [];
    const newBlocks: string[] = [];

    for (const focusId of focusIds) {
        const focus = tree.focuses[focusId];
        if (!isDuplicatable(focus, tree.file)) {
            skipped.push(focusId);
            continue;
        }

        const newId = uniqueDuplicateId(focus.id, takenIds);
        takenIds.add(newId);
        newBlocks.push(buildDuplicateBlock(focus, sourceText, { [focus.id]: newId }, offsetX, offsetY));
    }

    return { edits: insertNewBlocks(tree, sourceText, newBlocks), skipped };
}

/**
 * Finds a focus and every focus that transitively depends on it via
 * `prerequisite` (i.e. the whole downstream "branch" rooted at it).
 */
function collectBranch(tree: FocusTree, rootFocusId: string): Set<string> {
    const included = new Set<string>([rootFocusId]);
    let changed = true;
    while (changed) {
        changed = false;
        for (const focus of Object.values(tree.focuses)) {
            if (included.has(focus.id)) {
                continue;
            }
            if (focus.prerequisiteGroups.some(group => group.ids.some(id => included.has(id)))) {
                included.add(focus.id);
                changed = true;
            }
        }
    }
    return included;
}

/**
 * Duplicates a focus and every focus downstream of it (found by following
 * `prerequisite` references forward), remapping references *within* the
 * copied branch to point at the new copies -- so the duplicated branch is a
 * fully independent, self-consistent copy of the original, offset by
 * `(offsetX, offsetY)`. A member of the branch that cannot be safely
 * duplicated (wrong file, non-literal id/x/y) is skipped and left
 * unduplicated; anything else in the branch that referenced it keeps
 * pointing at the original.
 */
export function duplicateBranch(tree: FocusTree, sourceText: string, rootFocusId: string, offsetX: number, offsetY: number): { edits: TextEdit[]; skipped: string[] } {
    const branch = collectBranch(tree, rootFocusId);
    const takenIds = new Set(Object.keys(tree.focuses));
    const skipped: string[] = [];
    const qualifying: DuplicatableFocus[] = [];

    for (const id of branch) {
        const focus = tree.focuses[id];
        if (isDuplicatable(focus, tree.file)) {
            qualifying.push(focus);
        } else {
            skipped.push(id);
        }
    }

    if (qualifying.length === 0) {
        return { edits: [], skipped };
    }

    const idRemap: Record<string, string> = {};
    for (const focus of qualifying) {
        const newId = uniqueDuplicateId(focus.id, takenIds);
        takenIds.add(newId);
        idRemap[focus.id] = newId;
    }

    const newBlocks = [...qualifying]
        .sort((a, b) => a.blockRange.start - b.blockRange.start)
        .map(focus => buildDuplicateBlock(focus, sourceText, idRemap, offsetX, offsetY));

    return { edits: insertNewBlocks(tree, sourceText, newBlocks), skipped };
}

/**
 * Renames a focus's ID and every reference to it across the tree, as one
 * batch. Pure token/range replacement -- no indentation-aware insertion is
 * needed, so unlike `deleteFocus` this does not need source text at all.
 */
export function renameFocus(tree: FocusTree, oldId: string, newId: string): TextEdit[] {
    const target = tree.focuses[oldId];
    if (!target) {
        return [];
    }

    const edits: TextEdit[] = [];
    if (target.idToken) {
        edits.push(patchToken(target.file, target.idToken, newId));
    }

    for (const other of Object.values(tree.focuses)) {
        for (const group of other.prerequisiteGroups) {
            if (group.ids.includes(oldId)) {
                const renamed = group.ids.map(id => id === oldId ? newId : id);
                edits.push({ file: other.file, start: group.range.start, end: group.range.end, newText: renderGroup('prerequisite', renamed) });
            }
        }
        for (const group of other.exclusiveGroups) {
            if (group.ids.includes(oldId)) {
                const renamed = group.ids.map(id => id === oldId ? newId : id);
                edits.push({ file: other.file, start: group.range.start, end: group.range.end, newText: renderGroup('mutually_exclusive', renamed) });
            }
        }
        if (other.relativePositionId === oldId && other.relativePositionIdToken) {
            edits.push(patchToken(other.file, other.relativePositionIdToken, newId));
        }
    }

    return edits;
}
