import * as vscode from 'vscode';
import * as path from 'path';
import { PromiseCache } from './cache';
import { isSamePath } from './nodecommon';
import { getLastModifiedAsync, readDirFiles, isFile, isDirectory, readFile, readDir, isSameUri, fileOrUriStringToUri, ensureFileScheme, readDirFilesRecursively } from './vsccommon';
import { parseHoi4File } from '../hoiformat/hoiparser';
import { localize } from './i18n';
import { convertNodeToJson, SchemaDef, HOIPartial } from '../hoiformat/schema';
import { error } from './debug';
import { getImplicitWorkspaceModFile, updateSelectedModFileStatus } from './modfile';
import { getConfiguration, getDocumentByUri } from './vsccommon';
import { UserError } from './common';
import type * as AdmZip from 'adm-zip';
import { Hoi4FsScheme } from '../constants';
import { trimStart } from 'lodash';

const dlcZipPathsCache = new PromiseCache({
    factory: getDlcZipPaths,
    life: 10 * 60 * 1000,
});

const dlcPathsCache = new PromiseCache({
    factory: getDlcPaths,
    life: 10 * 60 * 1000,
});

const dlcIncludedFilePathsCache = new PromiseCache({
    factory: getDlcIncludedFilePaths,
    life: 10 * 60 * 1000,
});

let dlcZipCache: PromiseCache<AdmZip, vscode.Uri> | null = null;

if (!IS_WEB_EXT) {
    // adm-zip requires fs, which doesn't work on web.
    function getDlcZip(uri: vscode.Uri): Promise<AdmZip> {
        let dlcZipPath: string;
        if (uri.scheme === Hoi4FsScheme) {
            dlcZipPath = path.join(getConfiguration().installPath, trimStart(uri.path, '/'));
        } else {
            ensureFileScheme(uri);
            dlcZipPath = uri.fsPath;
        }

        const AdmZip: typeof import('adm-zip') = require('adm-zip');
        return Promise.resolve(new AdmZip(dlcZipPath));
    }

    dlcZipCache = new PromiseCache({
        factory: getDlcZip,
        expireWhenChange: key => getLastModifiedAsync(key),
        life: 15 * 1000,
    });
}

async function getDlcZipOrUndefined(uri: vscode.Uri): Promise<AdmZip | undefined> {
    if (dlcZipCache === null) {
        return undefined;
    }

    try {
        return await dlcZipCache.get(uri);
    } catch (e) {
        const detail = e instanceof Error ? e.message : String(e);
        error(new UserError(`Can't open HOI4 DLC archive "${uri.toString()}": ${detail}`));
        return undefined;
    }
}

export async function clearDlcZipCache() {
    dlcPathsCache.clear();
    dlcZipPathsCache.clear();
    dlcIncludedFilePathsCache.clear();
    dlcZipCache?.clear();
}

export function getFilePathFromMod(relativePath: string): Promise<vscode.Uri | undefined> {
    return getFilePathFromModOrHOI4(relativePath, { hoi4: false, dlc: false });
}

export async function getFilePathFromModOrHOI4(
    relativePath: string,
    options?: { mod?: boolean, hoi4?: boolean, dlc?: boolean }): Promise<vscode.Uri | undefined> {

    relativePath = relativePath.replace(/\/\/+|\\+/g, '/');
    let absolutePath: vscode.Uri | undefined = undefined;

    if (options?.mod !== false) {
        // Find in opened workspace folders
        if (vscode.workspace.workspaceFolders) {
            for (const folder of vscode.workspace.workspaceFolders) {
                const findPath = vscode.Uri.joinPath(folder.uri, relativePath);
                if (await isFile(findPath)) {
                    absolutePath = findPath;
                    break;
                }
            }
            
            if (absolutePath !== undefined) {
                // Opened document
                const document = vscode.workspace.textDocuments.find(d => isSameUri(d.uri, absolutePath!));
                if (document) {
                    return document.uri.with({ fragment: ':opened' });
                }
            }
        }

        if (absolutePath !== undefined) {
            return absolutePath;
        }

        // The selected descriptor may point at a mod directory which is not an
        // opened workspace folder. Writes already use this path, so reads must
        // search it too or a later map edit will fall back to vanilla files and
        // overwrite earlier province/ocean consolidations.
        const configuredModPath = await getModPathFromDescriptor();
        if (configuredModPath) {
            const findPath = vscode.Uri.joinPath(configuredModPath, relativePath);
            if (await isFile(findPath)) {
                const document = vscode.workspace.textDocuments.find(d => isSameUri(d.uri, findPath));
                return document?.uri.with({ fragment: ':opened' }) ?? findPath;
            }
        }

        const replacePaths = await getReplacePaths();
        if (replacePaths) {
            const relativePathDir = path.dirname(relativePath);
            for (const replacePath of replacePaths) {
                if (isSamePath(relativePathDir, replacePath)) {
                    return absolutePath;
                }
            }
        }
    }

    const installPath = vscode.Uri.parse(Hoi4FsScheme + ':/');
    const conf = getConfiguration();
    const paths = await dlcIncludedFilePathsCache.get(installPath);
    if (options?.dlc !== false && !absolutePath && conf.loadDlcContents && paths.has(relativePath)) {
        // Find in HOI4 DLCs
        const dlcs = await dlcZipPathsCache.get(installPath);
        if (dlcs !== null && dlcZipCache !== null) {
            for (const dlc of dlcs) {
                const dlcZip = await getDlcZipOrUndefined(dlc);
                if (!dlcZip) {
                    continue;
                }
                const entry = dlcZip.getEntry(relativePath);
                if (entry !== null) {
                    return dlc.with({ fragment: relativePath });
                }
            }
        }

        const dlcFolders = await dlcPathsCache.get(installPath);
        if (dlcFolders !== null) {
            for (const dlc of dlcFolders) {
                const findPath = vscode.Uri.joinPath(dlc, relativePath);
                if (await isFile(findPath)) {
                    return findPath;
                }
            }
        }
    }

    if (options?.hoi4 !== false) {
        // Find in HOI4 install path
        if (!absolutePath) {
            const findPath = vscode.Uri.joinPath(installPath, relativePath);
            if (await isFile(findPath)) {
                absolutePath = findPath;
            }
        }
    }


    return absolutePath;
}

export function isHoiFileOpened(path: vscode.Uri): boolean {
    return path.fragment === ':opened';
}

export function getHoiOpenedFileOriginalUri(path: vscode.Uri): vscode.Uri {
    return path.with({ fragment: '' });
}

export function isHoiFileFromDlc(path: vscode.Uri): boolean {
    return path.fragment !== '' && path.path.endsWith('.zip');
}

export function getHoiDlcFileOriginalUri(path: vscode.Uri): { uri: vscode.Uri, entryPath: string } {
    return { uri: path.with({ fragment: '' }), entryPath: path.fragment };
}

export async function hoiFileExpiryToken(relativePath: string): Promise<string> {
    return await expiryToken(await getFilePathFromModOrHOI4(relativePath));;
}

export async function expiryToken(realPath: vscode.Uri | undefined): Promise<string> {
    if (!realPath) {
        return '';
    }

    if (isHoiFileOpened(realPath)) {
        return realPath.toString() + '@' + Date.now();
    } else if (isHoiFileFromDlc(realPath)) {
        return realPath.with({ fragment: '' }).toString() + '@' + await getLastModifiedAsync(realPath);
    }

    return realPath.toString() + '@' + await getLastModifiedAsync(realPath);
}

export async function readFileFromPath(realPath: vscode.Uri, relativePath?: string): Promise<[Buffer, vscode.Uri]> {
    if (isHoiFileOpened(realPath)) {
        const realPathWithoutOpenMark = getHoiOpenedFileOriginalUri(realPath);
        const document = getDocumentByUri(realPathWithoutOpenMark);
        if (document) {
            return [Buffer.from(document.getText()), realPath];
        }

        realPath = realPathWithoutOpenMark;

    } else if (realPath.fragment !== '' && realPath.path.endsWith('.zip')) {
        if (dlcZipCache !== null) {
            const { uri: dlc, entryPath: filePath } = getHoiDlcFileOriginalUri(realPath);

            const dlcZip = await getDlcZipOrUndefined(dlc);
            if (dlcZip) {
                const entry = dlcZip.getEntry(filePath);
                if (entry !== null) {
                    return [await new Promise<Buffer>(resolve => entry.getDataAsync(resolve)), realPath];
                }
            }
        }

        throw new UserError("Can't find file " + relativePath);
    }

    return [ await readFile(realPath), realPath ];
}

export async function readFileFromModOrHOI4(relativePath: string, options?: { mod?: boolean, hoi4?: boolean, dlc?: boolean }): Promise<[Buffer, vscode.Uri]> {
    const realPath = await getFilePathFromModOrHOI4(relativePath, options);

    if (!realPath) {
        throw new UserError("Can't find file " + relativePath);
    }

    return await readFileFromPath(realPath, relativePath);
}

export async function readFileFromModOrHOI4AsJson<T>(relativePath: string, schema: SchemaDef<T>): Promise<HOIPartial<T>> {
    const [buffer, realPath] = await readFileFromModOrHOI4(relativePath);
    const nodes = parseHoi4File(buffer.toString(), localize('infile', 'In file {0}:\n', realPath));
    return convertNodeToJson<T>(nodes, schema);
}

export async function listFilesFromModOrHOI4(
    relativePath: string,
    options?: { mod?: boolean, hoi4?: boolean, recursively?: boolean, dlc?: boolean }): Promise<string[]> {

    const readFunction = options?.recursively ? readDirFilesRecursively : readDirFiles;
    relativePath = relativePath.replace(/\/\/+|\\+/g, '/');
    const result: string[] = [];

    if (options?.mod !== false) {
        // Find in opened workspace folders
        if (vscode.workspace.workspaceFolders) {
            for (const folder of vscode.workspace.workspaceFolders) {
                const findPath = vscode.Uri.joinPath(folder.uri, relativePath);
                if (await isDirectory(findPath)) {
                    try {
                        result.push(...await readFunction(findPath));
                    } catch(e) {}
                }
            }
        }

        // Include the effective mod root selected by the descriptor even when
        // that directory is outside the workspace. This keeps folder-based
        // loaders and destructive materialization aligned with single-file
        // resolution above.
        const configuredModPath = await getModPathFromDescriptor();
        if (configuredModPath) {
            const findPath = vscode.Uri.joinPath(configuredModPath, relativePath);
            if (await isDirectory(findPath)) {
                try {
                    result.push(...await readFunction(findPath));
                } catch(e) {}
            }
        }

        const replacePaths = await getReplacePaths();
        if (replacePaths) {
            for (const replacePath of replacePaths) {
                if (isSamePath(relativePath, replacePath)) {
                    return Array.from(new Set(result));
                }
            }
        }
    }

    const installPath = vscode.Uri.parse(Hoi4FsScheme + ':/');
    // Find in HOI4 DLCs
    const conf = getConfiguration();
    if (options?.dlc !== false && conf.loadDlcContents && (await dlcIncludedFilePathsCache.get(installPath)).has(relativePath)) {
        const dlcs = await dlcZipPathsCache.get(installPath);
        if (dlcs !== null && dlcZipCache !== null) {
            for (const dlc of dlcs) {
                const dlcZip = await getDlcZipOrUndefined(dlc);
                if (!dlcZip) {
                    continue;
                }
                const folderEntry = dlcZip.getEntry(relativePath);
                if (folderEntry && folderEntry.isDirectory) {
                    for (const entry of dlcZip.getEntries()) {
                        if (isSamePath(path.dirname(entry.entryName.replace(/^[\\/]/, '')), relativePath) && !entry.isDirectory) {
                            result.push(path.basename(entry.name));
                        }
                    }
                }
            }
        }

        const dlcFolders = await dlcPathsCache.get(installPath);
        if (dlcFolders !== null) {
            for (const dlc of dlcFolders) {
                const findPath = vscode.Uri.joinPath(dlc, relativePath);
                if (await isDirectory(findPath)) {
                    try {
                        result.push(...await readFunction(findPath));
                    } catch(e) {}
                }
            }
        }
    }

    if (options?.hoi4 !== false) {
        // Find in HOI4 install path
        const findPath = vscode.Uri.joinPath(installPath, relativePath);
        if (await isDirectory(findPath)) {
            try {
                result.push(...await readFunction(findPath));
            } catch(e) {}
        }
    }

    return Array.from(new Set(result));
}

async function getDlcZipPaths(installPathUri: vscode.Uri): Promise<vscode.Uri[] | null> {
    const dlcPath = vscode.Uri.joinPath(installPathUri, 'dlc');
    if (!await isDirectory(dlcPath)) {
        return null;
    }

    const dlcFolders = await readDir(dlcPath);
    const paths = await Promise.all(dlcFolders.map(async (dlcFolder) => {
        const dlcZipFolder = vscode.Uri.joinPath(dlcPath, dlcFolder);
        if (await isDirectory(dlcZipFolder)) {
            const files =  await readDir(dlcZipFolder);
            const zipFile = files.find(file => file.endsWith('.zip'));
            if (zipFile) {
                return vscode.Uri.joinPath(dlcZipFolder, zipFile);
            }
        }

        return null;
    }));

    return paths.filter((path): path is vscode.Uri => path !== null);
}

async function getDlcPaths(installPathUri: vscode.Uri): Promise<vscode.Uri[] | null> {
    const dlcPath = vscode.Uri.joinPath(installPathUri, 'dlc');
    if (!await isDirectory(dlcPath)) {
        return null;
    }

    const dlcFolders = await readDir(dlcPath);
    const paths = await Promise.all(dlcFolders.map(async (dlcFolder) => {
        const dlcZipFolder = vscode.Uri.joinPath(dlcPath, dlcFolder);
        if (await isDirectory(dlcZipFolder) && dlcFolder.startsWith("dlc")) {
            return dlcZipFolder;
        }

        return null;
    }));

    return paths.filter((path): path is vscode.Uri => path !== null);
}

async function getDlcIncludedFilePaths(installPath: vscode.Uri): Promise<Set<string>> {
    const result = new Set<string>();
    const conf = getConfiguration();
    if (!conf.loadDlcContents) {
        return result;
    }

    const dlcs = await dlcZipPathsCache.get(installPath);
    if (dlcs !== null && dlcZipCache !== null) {
        for (const dlc of dlcs) {
            const dlcZip = await getDlcZipOrUndefined(dlc);
            if (!dlcZip) {
                continue;
            }
            for (const entry of dlcZip.getEntries()) {
                result.add(entry.entryName.replace(/^[\\/]/, ''));
            }
        }
    }

    const dlcFolders = await dlcPathsCache.get(installPath);
    if (dlcFolders !== null) {
        for (const dlc of dlcFolders) {
            if (await isDirectory(dlc)) {
                try {
                    for (const entry of await readDirFilesRecursively(dlc)) {
                        result.add(entry);
                    }
                } catch(e) {}
            }
        }
    }

    return result;
}

const replacePathsCache = new PromiseCache({
    factory: getReplacePathsFromModFile,
    expireWhenChange: key => getLastModifiedAsync(vscode.Uri.parse(key)),
    life: 60 * 1000,
});

const modPathCache = new PromiseCache<vscode.Uri | undefined>({
    factory: async (modFileUri: string) => {
        const modFile = vscode.Uri.parse(modFileUri);
        const content = (await readFile(modFile)).toString();
        const node = parseHoi4File(content, localize('infile', 'In file {0}:\n', modFileUri));
        const parsed = convertNodeToJson<ModFile>(node, modFileSchema);

        if (parsed.path) {
            const modDirPath = parsed.path.replace(/[\\/]+$/, '');
            if (path.isAbsolute(modDirPath)) {
                return vscode.Uri.file(modDirPath);
            }
            return vscode.Uri.joinPath(vscode.Uri.file(path.dirname(modFile.fsPath)), modDirPath);
        }

        return vscode.Uri.file(path.dirname(modFile.fsPath));
    },
    expireWhenChange: key => getLastModifiedAsync(vscode.Uri.parse(key)),
    life: 60 * 1000,
});

interface ModFile {
    replace_path: string[];
    path?: string;
    archive?: string;
}

const modFileSchema: SchemaDef<ModFile> = {
    replace_path: {
        _innerType: "string",
        _type: "array",
    },
    path: {
        _type: "string",
    },
    archive: {
        _type: "string",
    },
};

/**
 * Resolve the selected .mod descriptor file URI.
 */
export async function getSelectedModFileUri(): Promise<vscode.Uri | undefined> {
    const conf = getConfiguration();
    let modFile = fileOrUriStringToUri(conf.modFile);

    if (conf.modFile === "") {
        modFile = await getImplicitWorkspaceModFile();
    }

    if (modFile && await isFile(modFile)) {
        return modFile;
    }

    return undefined;
}

/**
 * Read the `path` attribute from the selected .mod descriptor file to determine
 * the mod folder where game files (maps, BMPs, CSVs) should be written.
 * Returns undefined if no mod is selected or the path attribute is absent.
 */
export async function getModPathFromDescriptor(): Promise<vscode.Uri | undefined> {
    const modFile = await getSelectedModFileUri();
    if (!modFile) {
        return undefined;
    }

    try {
        return await modPathCache.get(modFile.toString());
    } catch {
        return undefined;
    }
}

async function getReplacePaths(): Promise<string[] | undefined> {
    const conf = getConfiguration();
    let modFile = fileOrUriStringToUri(conf.modFile);

    if (conf.modFile === "") {
        modFile = await getImplicitWorkspaceModFile();
    }

    try {
        if (modFile && await isFile(modFile)) {
            const result = await replacePathsCache.get(modFile.toString());
            updateSelectedModFileStatus(modFile);
            return result;
        }
    } catch (e) {
        error(e);
    }

    updateSelectedModFileStatus(modFile, true);
    return undefined;
}

export function invalidateModDescriptorCaches(): void {
    replacePathsCache.clear();
    modPathCache.clear();
}

async function getReplacePathsFromModFile(absolutePath: string): Promise<string[]> {
    const content = (await readFile(vscode.Uri.parse(absolutePath))).toString();
    const node = parseHoi4File(content, localize('infile', 'In file {0}:\n', absolutePath));
    const modFile = convertNodeToJson<ModFile>(node, modFileSchema);
    return modFile.replace_path.filter((v): v is string => typeof v === 'string');
}
