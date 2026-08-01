import * as vscode from 'vscode';
import { Commands } from '../constants';
import { WorldMapWarning, WorldMapWarningSource } from '../previewdef/worldmap/definitions';
import { forceError } from './common';
import { localize } from './i18n';
import { Logger } from './logger';

function formatWarningSource(source: WorldMapWarningSource): string {
    if ('id' in source) {
        return `${source.type} ${source.id ?? 'unknown'}`;
    }
    if ('index' in source) {
        return `${source.type} ${source.index} (${source.name})`;
    }
    return `${source.type} ${source.name}`;
}

export function formatWorldMapErrorReport(
    warnings: readonly WorldMapWarning[],
    scannedAt: Date,
    workspaceName: string,
): string {
    const lines = [
        'HOI4 Mod Utilities - World Map Error Scan',
        `Scanned: ${scannedAt.toISOString()}`,
        `Workspace: ${workspaceName}`,
        `Warnings: ${warnings.length}`,
        '',
    ];

    if (warnings.length === 0) {
        lines.push('No world map warnings were found.');
    } else {
        warnings.forEach((warning, index) => {
            lines.push(`[${index + 1}] ${warning.text}`);
            lines.push(`Sources: ${warning.source.length > 0
                ? warning.source.map(formatWarningSource).join(', ')
                : 'none reported'}`);
            lines.push(`Files: ${warning.relatedFiles.length > 0
                ? warning.relatedFiles.join(', ')
                : 'none reported'}`);
            lines.push('');
        });
    }

    return `${lines.join('\n')}\n`;
}

export function registerScanAndLogErrorsCommand(): vscode.Disposable {
    return vscode.commands.registerCommand(Commands.ScanAndLogErrors, async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            await vscode.window.showErrorMessage(localize(
                'worldmap.errorscan.noworkspace',
                'Open a workspace folder before scanning the world map.'
            ));
            return;
        }

        try {
            const reportUri = await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: localize('worldmap.errorscan.progress', 'Scanning HOI4 world map for errors...'),
                    cancellable: false,
                },
                async () => {
                    const scannedAt = new Date();
                    const { WorldMapLoader } = await import(
                        '../previewdef/worldmap/loader/worldmaploader'
                    );
                    const loader = new WorldMapLoader();
                    loader.onProgress(progress => Logger.info(`[World map scan] ${progress}`));
                    const worldMap = await loader.getWorldMap(true);
                    const report = formatWorldMapErrorReport(
                        worldMap.warnings,
                        scannedAt,
                        workspaceFolder.name
                    );
                    const timestamp = scannedAt.toISOString().replace(/[:.]/g, '-');
                    const uri = vscode.Uri.joinPath(
                        workspaceFolder.uri,
                        `hoi4-error-scan-${timestamp}.log`
                    );
                    await vscode.workspace.fs.writeFile(uri, Buffer.from(report, 'utf-8'));
                    worldMap.warnings.forEach(warning => Logger.warn(
                        `[World map scan] ${warning.text}`
                    ));
                    Logger.info(
                        `[World map scan] Completed with ${worldMap.warnings.length} warning(s). Report: ${uri.fsPath}`
                    );
                    return { uri, warningCount: worldMap.warnings.length };
                }
            );

            const openReport = localize('worldmap.errorscan.openreport', 'Open Report');
            const selection = await vscode.window.showInformationMessage(
                localize(
                    'worldmap.errorscan.complete',
                    'World map scan complete: {0} warning(s). Report written to {1}.',
                    reportUri.warningCount,
                    reportUri.uri.fsPath
                ),
                openReport
            );
            if (selection === openReport) {
                await vscode.window.showTextDocument(
                    await vscode.workspace.openTextDocument(reportUri.uri)
                );
            }
        } catch (e) {
            const message = forceError(e).message;
            Logger.error(`[World map scan] ${message}`);
            await vscode.window.showErrorMessage(localize(
                'worldmap.errorscan.failed',
                'World map error scan failed: {0}',
                message
            ));
        }
    });
}
