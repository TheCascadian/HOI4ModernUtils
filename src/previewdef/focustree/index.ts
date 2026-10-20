import * as vscode from 'vscode';
import { renderFocusTreeFile } from './contentbuilder';
import { matchPathEnd } from '../../util/nodecommon';
import { PreviewBase } from '../previewbase';
import { PreviewProviderDef } from '../previewmanager';
import { FocusTreeLoader } from './loader';
import { getDocumentByUri, getRelativePathInWorkspace } from '../../util/vsccommon';
import { getFilePathFromMod, getHoiOpenedFileOriginalUri } from '../../util/fileloader';
import { localize } from '../../util/i18n';
import {
    CreateFocusMessage,
    DeleteFocusMessage,
    DuplicateBranchMessage,
    DuplicateFocusMessage,
    FocusTree,
    FocusTreeEditorMessage,
    RenameFocusMessage,
    SetMutuallyExclusiveMessage,
    SetFocusPropertiesMessage,
    SetPrerequisitesMessage,
    SetRelativePositionMessage,
    UpdateFocusPositionsMessage,
} from './schema';
import { reportFailure } from '../../util/errorreport';
import { isValidFocusId } from './focusid';
import * as edits from './edits';
import { updateFocusTreeDiagnostics, clearFocusTreeDiagnostics } from './diagnostics';

interface FocusPositionUpdate {
    document: vscode.TextDocument;
    range: vscode.Range;
    updatedText: string;
}

function canPreviewFocusTree(document: vscode.TextDocument) {
    const uri = document.uri;
    if (matchPathEnd(uri.toString().toLowerCase(), ['common', 'national_focus', '*']) && uri.path.toLowerCase().endsWith('.txt')) {
        return 0;
    }

    const text = document.getText();
    return /(focus_tree|shared_focus|joint_focus)\s*=\s*{/.exec(text)?.index;
}

class FocusTreePreview extends PreviewBase {
    private focusTreeLoader: FocusTreeLoader;
    private content: string | undefined;
    private diagnosedFiles = new Map<string, vscode.Uri>();

    constructor(uri: vscode.Uri, panel: vscode.WebviewPanel) {
        super(uri, panel);
        this.focusTreeLoader = new FocusTreeLoader(getRelativePathInWorkspace(this.uri), () => Promise.resolve(this.content ?? ''));
        this.focusTreeLoader.onLoadDone(r => this.updateDependencies(r.dependencies));
    }

    protected async getContent(document: vscode.TextDocument): Promise<string> {
        this.content = document.getText();
        const result = await renderFocusTreeFile(
            this.focusTreeLoader,
            document.uri,
            this.panel.webview,
            this.lastDocumentChangeTimestamp,
            focusTrees => {
                updateFocusTreeDiagnostics(getRelativePathInWorkspace(this.uri), document, focusTrees, this.diagnosedFiles)
                    .then(newFiles => this.diagnosedFiles = newFiles);
            },
        );
        this.content = undefined;
        return result;
    }

    public dispose(): void {
        clearFocusTreeDiagnostics(this.diagnosedFiles);
        this.diagnosedFiles = new Map();
        super.dispose();
    }

    protected async handleMessage(msg: FocusTreeEditorMessage): Promise<void> {
        if (this.pendingChangeDocument || this.lastDocumentChangeTimestamp !== msg.lastDocumentChangeTimestamp) {
            await vscode.window.showWarningMessage(localize('preview.focustree.stale', 'The focus tree changed while this edit was in flight, so it was not applied. Please try again.'));
            return;
        }

        switch (msg.command) {
            case 'updateFocusPositions':
                await this.updateFocusPositions(msg);
                break;
            case 'createFocus':
                await this.createFocus(msg);
                break;
            case 'deleteFocus':
                await this.deleteFocus(msg);
                break;
            case 'duplicateFocus':
                await this.duplicateFocus(msg);
                break;
            case 'duplicateBranch':
                await this.duplicateBranch(msg);
                break;
            case 'renameFocus':
                await this.renameFocus(msg);
                break;
            case 'setPrerequisites':
                await this.setPrerequisites(msg);
                break;
            case 'setMutuallyExclusive':
                await this.setMutuallyExclusive(msg);
                break;
            case 'setRelativePosition':
                await this.setRelativePosition(msg);
                break;
            case 'setFocusProperties':
                await this.setFocusProperties(msg);
                break;
        }
    }

    private async updateFocusPositions(msg: UpdateFocusPositionsMessage): Promise<void> {
        const focuses = msg.focuses;
        if (focuses.length === 0) {
            await vscode.window.showErrorMessage(localize('preview.focusposition.invalidmessage', 'Cannot update focus position: invalid focus metadata.'));
            return;
        }

        const updates: FocusPositionUpdate[] = [];
        for (const focus of focuses) {
            const update = await this.getFocusPositionUpdates(focus);
            if (update) {
                updates.push(...update);
            }
        }

        const edit = new vscode.WorkspaceEdit();
        for (const update of updates) {
            edit.replace(update.document.uri, update.range, update.updatedText);
        }

        await vscode.workspace.applyEdit(edit);
        this.reload();
    }

    private async getFocusPositionUpdates(msg: UpdateFocusPositionsMessage['focuses'][number]): Promise<FocusPositionUpdate[] | undefined> {
        const xToken = msg.focus.xToken;
        const yToken = msg.focus.yToken;
        const x = Number.isFinite(msg.x) ? msg.x : undefined;
        const y = Number.isFinite(msg.y) ? msg.y : undefined;

        if (xToken === undefined || yToken === undefined || x === undefined || y === undefined) {
            await vscode.window.showErrorMessage(localize('preview.focusposition.invalidmessage', 'Cannot update focus position: invalid focus metadata.'));
            return undefined;
        }

        const document = await this.getDocumentForPreviewMessage(msg.file);
        if (!document) {
            return undefined;
        }

        if (!xToken.value.match(/^-?\d+$/) || !yToken.value.match(/^-?\d+$/)) {
            await vscode.window.showErrorMessage(localize('preview.focusposition.unsupported', 'Cannot update focus position: x/y must be explicit numeric values in the focus block.'));
            return undefined;
        }

        return [
            { document, range: new vscode.Range(document.positionAt(xToken.start), document.positionAt(xToken.end)), updatedText: x.toString() },
            { document, range: new vscode.Range(document.positionAt(yToken.start), document.positionAt(yToken.end)), updatedText: y.toString() },
        ];
    }

    private async createFocus(msg: CreateFocusMessage): Promise<void> {
        if (!msg.id.trim()) {
            await vscode.window.showErrorMessage(localize('preview.focustree.invalidid', 'Cannot create a focus: it needs an ID.'));
            return;
        }
        if (!isValidFocusId(msg.id.trim())) {
            await vscode.window.showErrorMessage(localize('preview.focustree.badidchars', 'Focus IDs may only contain letters, digits, "_", ".", "-" and "\'".'));
            return;
        }
        if (msg.id in msg.tree.focuses) {
            await vscode.window.showErrorMessage(localize('preview.focustree.duplicateid', 'A focus with ID "{0}" already exists in this tree.', msg.id));
            return;
        }

        const sourceText = await this.readSourceText(msg.tree.file);
        if (sourceText === undefined) {
            return;
        }

        const textEdits = edits.createFocus(msg.tree, sourceText, { id: msg.id, x: msg.x, y: msg.y });
        if (textEdits.length === 0) {
            await vscode.window.showErrorMessage(localize('preview.focustree.cannotcreate', 'Cannot create a focus here: this tree has no anchor to insert a new focus against.'));
            return;
        }

        await this.applyTextEdits(textEdits);
    }

    private async deleteFocus(msg: DeleteFocusMessage): Promise<void> {
        if (msg.focusIds.length === 0) {
            return;
        }

        const confirmation = msg.focusIds.length === 1 ?
            localize('preview.focustree.confirmdelete', 'Delete focus "{0}"? Every reference to it will also be removed.', msg.focusIds[0]) :
            localize('preview.focustree.confirmdeletemultiple', 'Delete {0} focuses? Every reference to them will also be removed.', msg.focusIds.length.toString());
        const deleteLabel = localize('preview.focustree.delete', 'Delete');
        const choice = await vscode.window.showWarningMessage(confirmation, { modal: true }, deleteLabel);
        if (choice !== deleteLabel) {
            return;
        }

        const sourceTextByFile = await this.readSourceTextForTree(msg.tree);
        if (!sourceTextByFile) {
            return;
        }

        await this.applyTextEdits(edits.deleteFocuses(msg.tree, sourceTextByFile, msg.focusIds));
    }

    private async duplicateFocus(msg: DuplicateFocusMessage): Promise<void> {
        if (msg.focusIds.length === 0) {
            return;
        }

        const sourceText = await this.readSourceText(msg.tree.file);
        if (sourceText === undefined) {
            return;
        }

        const { edits: textEdits, skipped } = edits.duplicateFocuses(msg.tree, sourceText, msg.focusIds, 1, 1);
        if (skipped.length > 0) {
            await vscode.window.showWarningMessage(localize(
                'preview.focustree.duplicateskipped',
                'Could not duplicate: {0}. Their ID, x, or y is not a plain value Modern Utils can safely copy.',
                skipped.join(', '),
            ));
        }

        await this.applyTextEdits(textEdits);
    }

    private async duplicateBranch(msg: DuplicateBranchMessage): Promise<void> {
        const sourceText = await this.readSourceText(msg.tree.file);
        if (sourceText === undefined) {
            return;
        }

        const { edits: textEdits, skipped } = edits.duplicateBranch(msg.tree, sourceText, msg.rootFocusId, 1, 1);
        if (skipped.length > 0) {
            await vscode.window.showWarningMessage(localize(
                'preview.focustree.duplicatebranchskipped',
                'Could not duplicate as part of the branch: {0}. Their ID, x, or y is not a plain value Modern Utils can safely copy; anything downstream still points at the original.',
                skipped.join(', '),
            ));
        }

        await this.applyTextEdits(textEdits);
    }

    private async renameFocus(msg: RenameFocusMessage): Promise<void> {
        const newId = msg.newId.trim();
        if (!newId) {
            await vscode.window.showErrorMessage(localize('preview.focustree.invalidid', 'Cannot create a focus: it needs an ID.'));
            return;
        }
        if (!isValidFocusId(newId)) {
            await vscode.window.showErrorMessage(localize('preview.focustree.badidchars', 'Focus IDs may only contain letters, digits, "_", ".", "-" and "\'".'));
            return;
        }
        if (newId !== msg.oldId && newId in msg.tree.focuses) {
            await vscode.window.showErrorMessage(localize('preview.focustree.duplicateid', 'A focus with ID "{0}" already exists in this tree.', newId));
            return;
        }

        const target = msg.tree.focuses[msg.oldId];
        if (!target?.idToken) {
            await vscode.window.showErrorMessage(localize('preview.focustree.renamenotsafe', 'Cannot rename this focus because its ID is not a plain source token.'));
            return;
        }

        const textEdits: edits.TextEdit[] = [edits.patchToken(target.file, target.idToken, newId)];
        textEdits.push(...await this.findProjectFocusRenameEdits(msg.oldId, newId));
        await this.applyTextEdits(textEdits);
    }

    private async findProjectFocusRenameEdits(oldId: string, newId: string): Promise<edits.TextEdit[]> {
        const uris = await vscode.workspace.findFiles('**/*.{txt,yml,yaml}', '**/{.git,node_modules,out,dist}/**');
        const uniqueUris = new Map(uris.map(uri => [uri.toString(), uri]));
        uniqueUris.set(this.uri.toString(), this.uri);

        const result: edits.TextEdit[] = [];
        for (const uri of uniqueUris.values()) {
            let text: string;
            try {
                const openDocument = getDocumentByUri(uri);
                text = openDocument?.getText() ?? new TextDecoder().decode(await vscode.workspace.fs.readFile(uri));
            } catch {
                continue;
            }
            const file = uri.toString();
            if (/\.txt$/i.test(uri.path)) {
                // A different file that defines its own focus with this ID is a different
                // tree; its references point at its own focus, not the one being renamed.
                const definesSameId = uri.toString() !== this.uri.toString() &&
                    new RegExp(`\\bid\\s*=\\s*"?${oldId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"?(?![\\w.\\-'])`).test(text);
                if (definesSameId) {
                    continue;
                }
                result.push(...edits.findFocusIdReferences(file, text, oldId, newId, file));
            } else {
                result.push(...edits.findFocusLocalisationKeys(file, text, oldId, newId, file));
            }
        }
        return result;
    }

    private async setPrerequisites(msg: SetPrerequisitesMessage): Promise<void> {
        const sourceText = await this.readSourceText(msg.focus.file);
        if (sourceText === undefined) {
            return;
        }
        await this.applyTextEdits(edits.setPrerequisites(msg.focus, sourceText, msg.groups));
    }

    private async setMutuallyExclusive(msg: SetMutuallyExclusiveMessage): Promise<void> {
        const sourceText = await this.readSourceText(msg.focus.file);
        if (sourceText === undefined) {
            return;
        }
        await this.applyTextEdits(edits.setMutuallyExclusive(msg.focus, sourceText, msg.groups));
    }

    private async setRelativePosition(msg: SetRelativePositionMessage): Promise<void> {
        const sourceText = await this.readSourceText(msg.focus.file);
        if (sourceText === undefined) {
            return;
        }
        if ((msg.x !== undefined || msg.y !== undefined) && (!msg.focus.xToken || !msg.focus.yToken ||
            !/^-?\d+$/.test(msg.focus.xToken.value) || !/^-?\d+$/.test(msg.focus.yToken.value))) {
            await vscode.window.showErrorMessage(localize('preview.focusposition.unsupported', 'Cannot update focus position: x/y must be explicit numeric values in the focus block.'));
            return;
        }
        const textEdits = edits.setRelativePosition(msg.focus, sourceText, msg.anchorId);
        if (msg.x !== undefined && msg.y !== undefined && msg.focus.xToken && msg.focus.yToken &&
            /^-?\d+$/.test(msg.focus.xToken.value) && /^-?\d+$/.test(msg.focus.yToken.value)) {
            textEdits.push(
                edits.patchToken(msg.focus.file, msg.focus.xToken, String(msg.x)),
                edits.patchToken(msg.focus.file, msg.focus.yToken, String(msg.y)),
            );
        }
        await this.applyTextEdits(textEdits);
    }

    private async setFocusProperties(msg: SetFocusPropertiesMessage): Promise<void> {
        const sourceText = await this.readSourceText(msg.focus.file);
        if (sourceText === undefined) {
            return;
        }
        await this.applyTextEdits(edits.setFocusProperties(msg.focus, sourceText, msg.properties));
    }

    /** Reads the full text of every file a tree's focuses live in (shared_focus can span files), keyed by file path. */
    private async readSourceTextForTree(tree: FocusTree): Promise<Record<string, string> | undefined> {
        const files = new Set(Object.values(tree.focuses).map(f => f.file));
        const result: Record<string, string> = {};
        for (const file of files) {
            const text = await this.readSourceText(file);
            if (text === undefined) {
                return undefined;
            }
            result[file] = text;
        }
        return result;
    }

    private async readSourceText(file: string): Promise<string | undefined> {
        const document = await this.getDocumentForPreviewMessage(file === this.focusTreeLoader.file ? undefined : file);
        return document?.getText();
    }

    private async applyTextEdits(textEdits: edits.TextEdit[]): Promise<void> {
        if (textEdits.length === 0) {
            return;
        }

        const documents = new Map<string, vscode.TextDocument>();
        const edit = new vscode.WorkspaceEdit();
        const seen = new Set<string>();
        for (const textEdit of textEdits) {
            const documentKey = textEdit.documentUri ?? textEdit.file;
            let document = documents.get(documentKey);
            if (!document) {
                const resolved = textEdit.documentUri ?
                    (getDocumentByUri(vscode.Uri.parse(textEdit.documentUri)) ?? await vscode.workspace.openTextDocument(vscode.Uri.parse(textEdit.documentUri))) :
                    await this.getDocumentForPreviewMessage(textEdit.file === this.focusTreeLoader.file ? undefined : textEdit.file);
                if (!resolved) {
                    return;
                }
                document = resolved;
                documents.set(documentKey, document);
            }
            const editKey = `${document.uri.toString()}:${textEdit.start}:${textEdit.end}:${textEdit.newText}`;
            if (seen.has(editKey)) {
                continue;
            }
            seen.add(editKey);
            edit.replace(document.uri, new vscode.Range(document.positionAt(textEdit.start), document.positionAt(textEdit.end)), textEdit.newText);
        }

        const applied = await vscode.workspace.applyEdit(edit);
        if (!applied) {
            await reportFailure(new Error('vscode.workspace.applyEdit returned false'), {
                area: 'focustree',
                operation: 'applyedit',
                file: this.uri.toString(),
                details: { editCount: textEdits.length, documents: [...documents.keys()].join(', ') },
            }, {
                modal: true,
                summary: localize('preview.focustree.editfailed', 'The focus-tree edit could not be applied. Check that the source files are writable and try again.'),
            });
            return;
        }
        this.reload();
    }

    private async getDocumentForPreviewMessage(file: string | undefined): Promise<vscode.TextDocument | undefined> {
        if (!file) {
            return getDocumentByUri(this.uri) ?? await vscode.workspace.openTextDocument(this.uri);
        }

        const filePathInMod = await getFilePathFromMod(file);
        if (filePathInMod === undefined) {
            await vscode.window.showErrorMessage(localize('preview.focusposition.filenotfound', 'Cannot update focus position: file "{0}" is not in the current mod workspace.', file));
            return undefined;
        }

        const uri = getHoiOpenedFileOriginalUri(filePathInMod);
        return getDocumentByUri(uri) ?? await vscode.workspace.openTextDocument(uri);
    }
}

export const focusTreePreviewDef: PreviewProviderDef = {
    type: 'focustree',
    canPreview: canPreviewFocusTree,
    previewContructor: FocusTreePreview,
};
