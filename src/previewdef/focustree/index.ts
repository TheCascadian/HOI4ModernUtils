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
    SetPrerequisitesMessage,
    SetRelativePositionMessage,
    UpdateFocusPositionsMessage,
} from './schema';
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
        if (newId !== msg.oldId && newId in msg.tree.focuses) {
            await vscode.window.showErrorMessage(localize('preview.focustree.duplicateid', 'A focus with ID "{0}" already exists in this tree.', newId));
            return;
        }

        await this.applyTextEdits(edits.renameFocus(msg.tree, msg.oldId, newId));
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
        await this.applyTextEdits(edits.setMutuallyExclusive(msg.focus, sourceText, msg.ids));
    }

    private async setRelativePosition(msg: SetRelativePositionMessage): Promise<void> {
        const sourceText = await this.readSourceText(msg.focus.file);
        if (sourceText === undefined) {
            return;
        }
        await this.applyTextEdits(edits.setRelativePosition(msg.focus, sourceText, msg.anchorId));
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
        for (const textEdit of textEdits) {
            let document = documents.get(textEdit.file);
            if (!document) {
                const resolved = await this.getDocumentForPreviewMessage(textEdit.file === this.focusTreeLoader.file ? undefined : textEdit.file);
                if (!resolved) {
                    return;
                }
                document = resolved;
                documents.set(textEdit.file, document);
            }
            edit.replace(document.uri, new vscode.Range(document.positionAt(textEdit.start), document.positionAt(textEdit.end)), textEdit.newText);
        }

        await vscode.workspace.applyEdit(edit);
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
