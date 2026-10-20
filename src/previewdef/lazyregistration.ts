import * as vscode from 'vscode';
import { Commands, WebviewType } from '../constants';
import { sendEvent } from '../util/telemetry';
import { reportFailure } from '../util/errorreport';
import { localize } from '../util/i18n';

/** Runs a lazily-loaded feature entry point, surfacing load/runtime failures with a copyable error code. */
async function guarded<T>(operation: string, run: () => Promise<T>): Promise<T | undefined> {
    try {
        return await run();
    } catch (e) {
        await reportFailure(e, { area: 'activation', operation }, {
            modal: true,
            summary: localize('error.featurefailed', 'Could not start "{0}".', operation),
        });
        return undefined;
    }
}

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
    disposables.push(vscode.commands.registerCommand(Commands.Preview, (uri?: vscode.Uri) => guarded('preview', async () => {
        const { previewManager } = await loadPreviewManager();
        return previewManager.showPreview(uri);
    })));
    disposables.push(vscode.window.registerWebviewPanelSerializer(WebviewType.Preview, {
        async deserializeWebviewPanel(panel, state) {
            await guarded('preview.restore', async () => {
                const { previewManager } = await loadPreviewManager();
                return previewManager.deserializeWebviewPanel(panel, state);
            });
        },
    }));
    disposables.push(vscode.commands.registerCommand(Commands.PreviewWorld, () => guarded('worldmap', async () => {
        const { worldMap } = await loadWorldMap();
        return worldMap.openPreview();
    })));
    disposables.push(vscode.window.registerWebviewPanelSerializer(WebviewType.PreviewWorldMap, {
        async deserializeWebviewPanel(panel, state) {
            await guarded('worldmap.restore', async () => {
                const { worldMap } = await loadWorldMap();
                return worldMap.deserializeWebviewPanel(panel, state);
            });
        },
    }));

    const timer = setTimeout(async () => {
        const started = performance.now();
        try {
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
        } catch (e) {
            await reportFailure(e, { area: 'activation', operation: 'lazypreviews' }, {
                summary: localize('error.startupfailed', 'HOI4 Modern Utils failed to finish starting up. Some previews may not work.'),
            });
        }
    }, 0);
    disposables.push({ dispose: () => clearTimeout(timer) });
    return vscode.Disposable.from(...disposables);
}
