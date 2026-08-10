import { FocusTree } from "./schema";

/**
 * Pure, vscode-free core of the diagnostics feature: turns `FocusTree.warnings`
 * into per-file, line/character-addressed entries from plain source text.
 * Kept separate from `diagnostics.ts` (which imports `vscode` to publish these
 * as real `Diagnostic`s) purely so it can be unit-tested against fixture
 * strings the same way `edits.ts` and `validation.ts` already are.
 */
export interface DiagnosticPosition {
    line: number;
    character: number;
}

export interface DiagnosticEntry {
    file: string;
    start: DiagnosticPosition;
    end: DiagnosticPosition;
    message: string;
}

/** Converts a byte offset into a source string to a zero-based line/character position, the same convention as `vscode.TextDocument.positionAt`. */
export function offsetToPosition(text: string, offset: number): DiagnosticPosition {
    let line = 0;
    let lastNewline = -1;
    const end = Math.min(offset, text.length);
    for (let i = 0; i < end; i++) {
        if (text[i] === '\n') {
            line++;
            lastNewline = i;
        }
    }
    return { line, character: end - lastNewline - 1 };
}

/**
 * Flattens every focus tree's warnings into diagnostic entries, grouped by
 * the file each one applies to. A warning with no `navigations` (e.g. "no
 * root focus") is anchored to the tree's own enclosing block so it is never
 * silently dropped from the Problems panel. Files missing from
 * `sourceTextByFile` are skipped, matching how unresolvable files are
 * already treated elsewhere in this feature (edits.ts, index.ts).
 */
export function computeFocusTreeDiagnostics(focusTrees: FocusTree[], sourceTextByFile: Record<string, string>): Map<string, DiagnosticEntry[]> {
    const byFile = new Map<string, DiagnosticEntry[]>();

    for (const tree of focusTrees) {
        for (const warning of tree.warnings) {
            const navigations = warning.navigations && warning.navigations.length > 0 ?
                warning.navigations :
                [{ file: tree.file, start: tree.treeRange?.start ?? 0, end: tree.treeRange?.end ?? 0 }];

            for (const nav of navigations) {
                const text = sourceTextByFile[nav.file];
                if (text === undefined) {
                    continue;
                }

                const entry: DiagnosticEntry = {
                    file: nav.file,
                    start: offsetToPosition(text, nav.start),
                    end: offsetToPosition(text, nav.end),
                    message: warning.text,
                };

                const list = byFile.get(nav.file);
                if (list) {
                    list.push(entry);
                } else {
                    byFile.set(nav.file, [entry]);
                }
            }
        }
    }

    return byFile;
}
