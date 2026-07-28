import * as vscode from 'vscode';
import { Commands, WebviewType } from '../constants';
import { sendEvent } from '../util/telemetry';

type PreviewManagerModule = typeof import('./previewmanager');
type WorldMapModule = typeof import('./worldmap');

let previewManagerModule: Promise<PreviewManagerModule> | undefined;
let worldMapModule: Promise<WorldMapModule> | undefined;

function loadPreviewManager(): Promise<PreviewManagerModule> {
    return previewManagerModule ??= import('./previewmanager');
}
function loadWorldMap(): Promise<WorldMapModule> {
    return worldMapModule ??= import('./worldmap');
}

export function registerLazyPreviews(context: vscode.ExtensionContext): vscode.Disposable {
    const disposables: vscode.Disposable[] = [];
    disposables.push(vscode.commands.registerCommand(Commands.Preview, async (uri?: vscode.Uri) => {
        const { previewManager } = await loadPreviewManager();
        return previewManager.showPreview(uri);
    }));
    disposables.push(vscode.window.registerWebviewPanelSerializer(WebviewType.Preview, {
        async deserializeWebviewPanel(panel, state) {
            const { previewManager } = await loadPreviewManager();
            return previewManager.deserializeWebviewPanel(panel, state);
        },
    }));
    disposables.push(vscode.commands.registerCommand(Commands.PreviewWorld, async () => {
        const { worldMap } = await loadWorldMap();
        return worldMap.openPreview();
    }));
    disposables.push(vscode.window.registerWebviewPanelSerializer(WebviewType.PreviewWorldMap, {
        async deserializeWebviewPanel(panel, state) {
            const { worldMap } = await loadWorldMap();
            return worldMap.deserializeWebviewPanel(panel, state);
        },
    }));

    const timer = setTimeout(async () => {
        const started = performance.now();
        const [{ previewManager }, { worldMap }] = await Promise.all([
            loadPreviewManager(),
            loadWorldMap(),
        ]);
        context.subscriptions.push(
            previewManager.register({ command: false, serializer: false }),
            worldMap.register({ command: false, serializer: false }),
        );
        sendEvent('extension.lazyPreviews.ready', undefined, {
            durationMs: performance.now() - started,
        });
    }, 0);
    disposables.push({ dispose: () => clearTimeout(timer) });
    return vscode.Disposable.from(...disposables);
}
