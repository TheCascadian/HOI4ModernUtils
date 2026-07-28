import * as vscode from 'vscode';
import * as path from 'path';
import { forEachConcurrent, IndexBase } from './indexbase';
import { IndexType } from './indexmanager';
import { listFilesFromModOrHOI4, readFileFromModOrHOI4 } from '../util/fileloader';
import { localize } from '../util/i18n';
import { uniq } from 'lodash';
import { Logger } from '../util/logger';
import { indexingWorker } from './indexingworker';

// sprite name -> gfx file path
class GfxIndex extends IndexBase<string> {
    public type: IndexType = 'gfx';

    public includesFile(file: vscode.Uri): boolean {
        return file.path.endsWith('.gfx') && file.path.includes('interface/');
    }

    public addWorkspaceIndex(file: vscode.Uri): void {
        const wsFolder = vscode.workspace.getWorkspaceFolder(file);
        if (wsFolder) {
            const relative = path.relative(wsFolder.uri.path, file.path).replace(/\\+/g, '/');
            if (relative && relative.startsWith('interface/')) {
                this.fillGfxItems(relative, this._workspaceIndex, { hoi4: false, dlc: false });
            }
        }
    }

    public removeWorkspaceIndex(file: vscode.Uri): void {
        const wsFolder = vscode.workspace.getWorkspaceFolder(file);
        if (wsFolder) {
            const relative = path.relative(wsFolder.uri.path, file.path).replace(/\\+/g, '/');
            if (relative && relative.startsWith('interface/')) {
                for (const [key, value] of this._workspaceIndex) {
                    if (value === relative) {
                        this._workspaceIndex.delete(key);
                    }
                }
            }
        }
    }
    
    public async buildIndex(index: Map<string, string>, estimatedSize: [number], options: { mod?: boolean; hoi4?: boolean; dlc?: boolean }): Promise<void> {
        const gfxFiles = (await listFilesFromModOrHOI4('interface', { ...options, recursively: true })).filter(f => f.toLocaleLowerCase().endsWith('.gfx'));
        await forEachConcurrent(gfxFiles, 4, f =>
            this.fillGfxItems('interface/' + f, index, options, estimatedSize)
        );
    }

    public getGfxContainerFile(gfxName: string | undefined): string | undefined {
        if (!gfxName) {
            return undefined;
        }
        return this.get(gfxName);
    }

    public getGfxContainerFiles(gfxNames: (string | undefined)[]): string[] {
        return uniq(gfxNames.map(name => this.getGfxContainerFile(name)).filter((v): v is string => v !== undefined));
    }

    private async fillGfxItems(gfxFile: string, gfxIndex: Map<string, string>, options: { mod?: boolean, hoi4?: boolean, dlc?: boolean }, estimatedSize?: [number]): Promise<void> {
        try {
            if (estimatedSize) {
                estimatedSize[0] += gfxFile.length;
            }
            const [fileBuffer, uri] = await readFileFromModOrHOI4(gfxFile, options);
            const entries = await indexingWorker.parse('gfx', uri.toString(), fileBuffer.toString());
            for (const [name] of entries) {
                gfxIndex.set(name, gfxFile);
                if (estimatedSize) {
                    estimatedSize[0] += name.length + 8;
                }
            }
        } catch(e) {
            const baseMessage = options.hoi4
                ? localize('prefix.vanilla', '[Vanilla]')
                : localize('prefix.mod', '[Mod]');

            const failureMessage = localize('index.error.parsingfailed', 'Parsing failed. Please check if the file has issues.');
            if (e instanceof Error) {
                Logger.error(`${baseMessage} ${gfxFile} ${failureMessage}\n${e.stack}`);
            }
        }
    }
}

export const gfxIndex = new GfxIndex();
