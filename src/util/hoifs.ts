import * as vscode from 'vscode';
import { trimStart } from 'lodash';
import { Commands, ConfigurationKey, Hoi4FsScheme } from '../constants';
import { UserError } from './common';
import { clearDlcZipCache } from './fileloader';
import { clearImageCache } from '../util/image/imagecache';
import { sendEvent } from './telemetry';
import { getConfiguration, isFileScheme } from './vsccommon';
import { getFs } from './fs';
import { localize } from './i18n';

const installPathContainer: { current: vscode.Uri | null } = {
    current: null,
};

// Backup copy of the install path. The setting alone is not enough: writing it can fail or be
// skipped (non-file URIs, remote windows, read-only settings.json), and the path then vanished on relaunch.
const StoredInstallPathKey = 'hoi4ModernUtils.installPathUri';
let storage: vscode.Memento | undefined;

function readStoredInstallPath(): vscode.Uri | null {
    const stored = storage?.get<string>(StoredInstallPathKey);
    if (!stored) {
        return null;
    }

    try {
        return vscode.Uri.parse(stored, true);
    } catch {
        return null;
    }
}

export function registerHoiFs(context: vscode.ExtensionContext): vscode.Disposable {
    storage = context.globalState;
    const disposables: vscode.Disposable[] = [];
    disposables.push(vscode.commands.registerCommand(Commands.SelectHoiFolder, selectHoiFolder));
    disposables.push(vscode.workspace.registerFileSystemProvider(Hoi4FsScheme, hoi4FsProvider, { isReadonly: true }));
    disposables.push(hoi4FsProvider);

    if (!IS_WEB_EXT) {
        disposables.push(vscode.workspace.onDidChangeConfiguration(onChangeWorkspaceConfiguration));
    }

    return vscode.Disposable.from(...disposables);
}

async function selectHoiFolder(): Promise<void> {
    sendEvent('selectHoiFolder');

    const dialogOptions: vscode.OpenDialogOptions = { canSelectFolders: true, canSelectFiles: false, canSelectMany: false };
    // TODO proposed API
    // dialogOptions.allowUIResources = true;
    const result = await vscode.window.showOpenDialog(dialogOptions);
    if (!result) {
        return;
    }

    const uri = result[0];
    clearDlcZipCache();
    clearImageCache();

    await storage?.update(StoredInstallPathKey, uri.toString());

    if (!IS_WEB_EXT && isFileScheme(uri)) {
        try {
            await getConfiguration().update('installPath', uri.fsPath, vscode.ConfigurationTarget.Global);
        } catch (e) {
            vscode.window.showWarningMessage(localize('installpathsavefailed', 'Could not save the install path to settings ({0}). It is remembered by the extension instead.', (e as Error)?.message ?? String(e)));
        }
        installPathContainer.current = uri;
        vscode.window.showInformationMessage(localize('installpathsetto', 'Install path of Heart of Iron IV is set to: {0}.', uri.fsPath));
    } else {
        installPathContainer.current = uri;
        vscode.window.showInformationMessage(localize('installpathsetto', 'Install path of Heart of Iron IV is set to: {0}.', uri));
    }
}

function onChangeWorkspaceConfiguration(e: vscode.ConfigurationChangeEvent): void {
    if (e.affectsConfiguration(`${ConfigurationKey}.installPath`)) {
        installPathContainer.current = null;
        if (getConfiguration().installPath === '') {
            // User cleared the setting on purpose, so do not resurrect the backup.
            storage?.update(StoredInstallPathKey, undefined);
        }
        clearDlcZipCache();
        clearImageCache();
    }

    if (e.affectsConfiguration(`${ConfigurationKey}.loadDlcContents`)) {
        clearDlcZipCache();
        clearImageCache();
    }
}

class Hoi4UtilsFsProvider implements vscode.FileSystemProvider, vscode.Disposable {
    private onDidChangeFileEventEmitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();

    onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this.onDidChangeFileEventEmitter.event;

    watch(uri: vscode.Uri, options: { recursive: boolean; excludes: string[]; }): vscode.Disposable {
        // TODO empty implementation
        return { dispose: () => {} };
    }

    stat(uri: vscode.Uri): vscode.FileStat | Thenable<vscode.FileStat> {
        uri = this.makeNewUri(uri);
        return getFs(uri).stat(uri);
    }

    readDirectory(uri: vscode.Uri): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]> {
        uri = this.makeNewUri(uri);
        return getFs(uri).readDirectory(uri);
    }

    createDirectory(uri: vscode.Uri): void | Thenable<void> {
        uri = this.makeNewUri(uri);
        return getFs(uri).createDirectory(uri);
    }

    readFile(uri: vscode.Uri): Uint8Array | Thenable<Uint8Array> {
        uri = this.makeNewUri(uri);
        return getFs(uri).readFile(uri);
    }
    
    writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean; }): void | Thenable<void> {
        uri = this.makeNewUri(uri);
        return getFs(uri).writeFile(uri, content);
    }

    delete(uri: vscode.Uri, options: { recursive: boolean; }): void | Thenable<void> {
        uri = this.makeNewUri(uri);
        return getFs(uri).delete(uri, options);
    }

    rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean; }): void | Thenable<void> {
        oldUri = this.makeNewUri(oldUri);
        newUri = this.makeNewUri(newUri);
        const oldFs = getFs(oldUri);
        const fs = oldFs === getFs(newUri) ? oldFs : vscode.workspace.fs;
        return fs.rename(oldUri, newUri, options);
    }

    copy(source: vscode.Uri, destination: vscode.Uri, options: { overwrite: boolean; }): void | Thenable<void> {
        source = this.makeNewUri(source);
        destination = this.makeNewUri(destination);
        const sourceFs = getFs(source);
        const fs = sourceFs === getFs(destination) ? sourceFs : vscode.workspace.fs;
        return fs.copy(source, destination, options);
    }

    dispose(): void {
        this.onDidChangeFileEventEmitter.dispose();
    }

    private makeNewUri(uri: vscode.Uri): vscode.Uri {
        return vscode.Uri.joinPath(this.getInstallPath(), trimStart(uri.path, '/'));
    }

    private getInstallPath(): vscode.Uri {
        if (installPathContainer.current !== null) {
            return installPathContainer.current;
        }

        const installPath = getConfiguration().installPath;
        if (installPath !== '') {
            return installPathContainer.current = vscode.Uri.file(installPath);
        }

        const stored = readStoredInstallPath();
        if (stored !== null) {
            return installPathContainer.current = stored;
        }

        throw new UserError("Install path of Heart of Iron IV is not set.");
    }
}

export const hoi4FsProvider = new Hoi4UtilsFsProvider();
