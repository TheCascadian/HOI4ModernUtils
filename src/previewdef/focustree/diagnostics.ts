import * as vscode from 'vscode';
import { FocusTree } from './schema';
import { getDocumentByUri } from '../../util/vsccommon';
import { getFilePathFromMod, getHoiOpenedFileOriginalUri } from '../../util/fileloader';
import { computeFocusTreeDiagnostics } from './diagnosticscore';

/**
 * Native VS Code Problems-panel view of `FocusTree.warnings`, kept alongside
 * (not instead of) the in-webview warnings panel. One collection shared by
 * every focus tree preview; each preview tracks and clears only the file
 * URIs it last populated, so two previews touching overlapping shared_focus
 * files never stomp on each other's diagnostics. The actual warning ->
 * position math lives in the pure, unit-tested `diagnosticscore.ts`.
 */
let diagnosticCollection: vscode.DiagnosticCollection | undefined;

export function registerFocusTreeDiagnostics(): vscode.DiagnosticCollection {
    diagnosticCollection = vscode.languages.createDiagnosticCollection('hoi4-focus-tree');
    return diagnosticCollection;
}

async function resolveDocument(file: string, ownFile: string, ownDocument: vscode.TextDocument, cache: Map<string, vscode.TextDocument>): Promise<vscode.TextDocument | undefined> {
    if (file === ownFile) {
        return ownDocument;
    }

    const cached = cache.get(file);
    if (cached) {
        return cached;
    }

    try {
        const filePathInMod = await getFilePathFromMod(file);
        if (filePathInMod === undefined) {
            return undefined;
        }
        const uri = getHoiOpenedFileOriginalUri(filePathInMod);
        const document = getDocumentByUri(uri) ?? await vscode.workspace.openTextDocument(uri);
        cache.set(file, document);
        return document;
    } catch {
        return undefined;
    }
}

/**
 * Publishes `focusTrees[].warnings` as native diagnostics and returns the set
 * of file paths that now have diagnostics from this preview, so the caller
 * can pass it back in as `previousFiles` next time and have stale entries
 * (from files that no longer have any warnings) cleared automatically.
 */
export async function updateFocusTreeDiagnostics(
    ownFile: string,
    ownDocument: vscode.TextDocument,
    focusTrees: FocusTree[],
    previousFiles: ReadonlyMap<string, vscode.Uri>,
): Promise<Map<string, vscode.Uri>> {
    if (!diagnosticCollection) {
        return new Map();
    }

    const files = new Set<string>();
    for (const tree of focusTrees) {
        for (const warning of tree.warnings) {
            for (const nav of (warning.navigations && warning.navigations.length > 0 ? warning.navigations : [{ file: tree.file }])) {
                files.add(nav.file);
            }
        }
    }

    const documentCache = new Map<string, vscode.TextDocument>();
    const sourceTextByFile: Record<string, string> = {};
    for (const file of files) {
        const document = await resolveDocument(file, ownFile, ownDocument, documentCache);
        if (document) {
            documentCache.set(file, document);
            sourceTextByFile[file] = document.getText();
        }
    }

    const byFile = computeFocusTreeDiagnostics(focusTrees, sourceTextByFile);

    for (const [file, uri] of previousFiles) {
        if (!byFile.has(file)) {
            diagnosticCollection.delete(uri);
        }
    }

    const newFiles = new Map<string, vscode.Uri>();
    for (const [file, entries] of byFile) {
        const document = documentCache.get(file);
        if (!document) {
            continue;
        }
        const diagnostics = entries.map(entry => {
            const range = new vscode.Range(
                new vscode.Position(entry.start.line, entry.start.character),
                new vscode.Position(entry.end.line, entry.end.character),
            );
            const diagnostic = new vscode.Diagnostic(range, entry.message, vscode.DiagnosticSeverity.Warning);
            diagnostic.source = 'HOI4 Modern Utils';
            return diagnostic;
        });
        diagnosticCollection.set(document.uri, diagnostics);
        newFiles.set(file, document.uri);
    }

    return newFiles;
}

export function clearFocusTreeDiagnostics(files: ReadonlyMap<string, vscode.Uri>): void {
    if (!diagnosticCollection) {
        return;
    }
    for (const uri of files.values()) {
        diagnosticCollection.delete(uri);
    }
}
