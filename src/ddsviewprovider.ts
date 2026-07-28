import * as vscode from 'vscode';
import { localize } from './util/i18n';
import { html, htmlEscape } from './util/html';
import { StyleTable } from './util/styletable';
import { sendEvent } from './util/telemetry';
import { forceError } from './util/common';
import { LazyAssetResult, LazyAssetService, registerLazyAssetService } from './fileSystem/lazyassetservice';

abstract class CommonViewProvider implements vscode.CustomReadonlyEditorProvider {
    private readonly assets: LazyAssetService;

    constructor(
        context: vscode.ExtensionContext,
        private readonly type: 'dds' | 'tga',
    ) {
        this.assets = registerLazyAssetService(context);
    }

    public async openCustomDocument(uri: vscode.Uri) {
        // Don't try opening it as text
        return { uri, dispose: () => { } };
    }

    public async resolveCustomEditor(document: vscode.CustomDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): Promise<void> {
        try {
            this.onOpen();

            webviewPanel.webview.options = { enableScripts: true };
            const preview = await this.assets.getThumbnail(document.uri, this.type, token);
            this.render(webviewPanel.webview, preview, true);
            const subscription = webviewPanel.webview.onDidReceiveMessage(async message => {
                if (message?.command !== 'decodeFull' || token.isCancellationRequested) {
                    return;
                }
                try {
                    const full = await this.assets.decodeFull(document.uri, this.type, token);
                    this.render(webviewPanel.webview, full, false);
                } catch (error) {
                    webviewPanel.webview.html = `${localize('error', 'Error')}: <br/>  <pre>${htmlEscape(forceError(error).toString())}</pre>`;
                }
            });
            webviewPanel.onDidDispose(() => subscription.dispose());
        } catch (e) {
            webviewPanel.webview.html = `${localize('error', 'Error')}: <br/>  <pre>${htmlEscape(forceError(e).toString())}</pre>`;
        }
    }

    protected abstract onOpen(): void;

    private render(webview: vscode.Webview, result: LazyAssetResult, thumbnail: boolean): void {
        const styleTable = new StyleTable();
        const notice = thumbnail
            ? `<div>
                <span>Low-memory ${result.width}×${result.height} preview${result.fromCache ? ' (cached)' : ''}.</span>
                <button id="decode-full">Decode full resolution</button>
            </div>`
            : `<div>Full-resolution ${result.width}×${result.height} image.</div>`;
        webview.html = html(
            webview,
            `${notice}
            <div class="${styleTable.oneTimeStyle('imagePreview', () => `width:${result.width}px;height:${result.height}px;`)}">
                <img src="data:image/png;base64,${result.png.toString('base64')}"/>
            </div>`,
            thumbnail ? [{
                content: `const vscode = acquireVsCodeApi();
                    document.getElementById('decode-full').addEventListener('click', () => {
                        vscode.postMessage({ command: 'decodeFull' });
                    });`,
            }] : [],
            [styleTable]
        );
    }
}

export class DDSViewProvider extends CommonViewProvider {
    constructor(context: vscode.ExtensionContext) {
        super(context, 'dds');
    }

    protected onOpen(): void {
        sendEvent('preview.dds');
    }
}

export class TGAViewProvider extends CommonViewProvider {
    constructor(context: vscode.ExtensionContext) {
        super(context, 'tga');
    }

    protected onOpen(): void {
        sendEvent('preview.tga');
    }
}
