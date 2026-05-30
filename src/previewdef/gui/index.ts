import * as vscode from 'vscode';
import { PreviewProviderDef } from '../previewmanager';
import { PreviewBase } from '../previewbase';
import { GuiFileLoader } from './loader';
import { getRelativePathInWorkspace, getDocumentByUri } from '../../util/vsccommon';
import { renderGuiFile } from './contentbuilder';

function canPreviewGui(document: vscode.TextDocument) {
    const uri = document.uri;
    return uri.path.toLowerCase().endsWith('.gui') ? 0 : undefined;
}

class GuiPreview extends PreviewBase {
    private guiFileLoader: GuiFileLoader;
    private content: string | undefined;

    constructor(uri: vscode.Uri, panel: vscode.WebviewPanel) {
        super(uri, panel);
        this.guiFileLoader = new GuiFileLoader(getRelativePathInWorkspace(this.uri), () => Promise.resolve(this.content ?? ''));
        this.guiFileLoader.onLoadDone(r => this.updateDependencies(r.dependencies));
    }

    protected registerEvents(panel: vscode.WebviewPanel): void {
        super.registerEvents(panel);

        panel.webview.onDidReceiveMessage(async (msg) => {
            if (msg.command === 'editGuiPosition') {
                const document = getDocumentByUri(this.uri);
                if (document) {
                    await this.applyPositionEdit(document, msg.start, msg.end, msg.dx, msg.dy);
                }
            }
        });
    }

    protected async getContent(document: vscode.TextDocument): Promise<string> {
        this.content = document.getText();
        const result = await renderGuiFile(this.guiFileLoader, document.uri, this.panel.webview);
        this.content = undefined;
        return result;
    }

    private async applyPositionEdit(document: vscode.TextDocument, start: number, end: number, dx: number, dy: number) {
        const text = document.getText();
        // Extract ONLY the text of the specific node we dragged
        const nodeText = text.substring(start, end);

        // Regex to find "position = { x = 123 y = 456 }"
        const positionRegex = /position\s*=\s*\{\s*x\s*=\s*(-?\d+)\s*y\s*=\s*(-?\d+)\s*\}/;
        const match = positionRegex.exec(nodeText);

        const edit = new vscode.WorkspaceEdit();

        if (match) {
            const oldX = parseInt(match[1], 10);
            const oldY = parseInt(match[2], 10);
            const newX = oldX + dx;
            const newY = oldY + dy;

            const matchStartOffset = start + match.index;
            const matchEndOffset = matchStartOffset + match[0].length;
            const range = new vscode.Range(document.positionAt(matchStartOffset), document.positionAt(matchEndOffset));

            edit.replace(document.uri, range, `position = { x = ${newX} y = ${newY} }`);
        } else {
            // Fallback: If position block is missing entirely, insert it after the name property
            const insertOffset = start + nodeText.indexOf('{') + 1;
            const insertPos = document.positionAt(insertOffset);
            edit.insert(document.uri, insertPos, `\n\t\tposition = { x = ${dx} y = ${dy} }`);
        }

        await vscode.workspace.applyEdit(edit);
    }
}

export const guiPreviewDef: PreviewProviderDef = {
    type: 'gui',
    canPreview: canPreviewGui,
    previewContructor: GuiPreview,
};
