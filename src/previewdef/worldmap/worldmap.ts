import * as vscode from 'vscode';
import worldmapview from './worldmapview.html';
import worldmapviewstyles from './worldmapview.css';
import { localize, localizeText, i18nTableAsScript } from '../../util/i18n';
import { html } from '../../util/html';
import { error, debug } from '../../util/debug';
import { WorldMapMessage, ProgressReporter, WorldMapData, MapItemMessage, RequestMapItemMessage, PersistedState, PersistedStrategicRegion, PersistedProvince, PaintbrushConfig, PersistVictoryPointLocalisationMessage, PersistCountryDiplomacyMessage, WorldMapRuntimeTestReport, WorldMapRuntimeTestRequest, WorldMapRuntimeTestResultMessage } from './definitions';
import { matchPathEnd } from '../../util/nodecommon';
import { writeFile, mkdirs, getDocumentByUri, dirUri } from '../../util/vsccommon';
import { slice, debounceByInput, forceError } from '../../util/common';
import { getFilePathFromMod, getHoiOpenedFileOriginalUri, readFileFromModOrHOI4, readFileFromPath, getModPathFromDescriptor } from '../../util/fileloader';
import { WorldMapLoader } from './loader/worldmaploader';
import { isEqual } from 'lodash';
import { LoaderSession } from '../../util/loader/loader';
import { TelemetryMessage, sendByMessage } from '../../util/telemetry';
import { getConfiguration } from '../../util/vsccommon';

export const WorldMapRuntimeTestCommand = 'hoi4modernutils.test.worldmap.renderCases';

export function isWorldMapRuntimeTestEnabled(): boolean {
    return !IS_WEB_EXT &&
        typeof process !== 'undefined' &&
        process.env.HOI4MU_WORLD_MAP_TEST === '1';
}

export class WorldMap {
    public panel: vscode.WebviewPanel | undefined;

    private worldMapLoader: WorldMapLoader;
    private worldMapDependencies: string[] | undefined;
    private cachedWorldMap: WorldMapData | undefined;

    private lastRequestedExportUri: vscode.Uri | undefined;
    private runtimeTestReady = false;
    private runtimeTestRequestCounter = 0;
    private runtimeTestReadyWaiters: (() => void)[] = [];
    private runtimeTestRequests = new Map<string, {
        resolve: (report: WorldMapRuntimeTestReport) => void;
        reject: (error: Error) => void;
        timeout: NodeJS.Timeout;
    }>();

    /** Undo stack for province BMP edits: stores raw BMP buffers and CSV snapshots */
    private bmpUndoStack: { bmpBuffer: Buffer; provinces: PersistedProvince[]; deletedProvinceIds?: number[] }[] = [];
    /** Redo stack for province BMP edits */
    private bmpRedoStack: { bmpBuffer: Buffer; provinces: PersistedProvince[]; deletedProvinceIds?: number[] }[] = [];

    private getMaxUndoSteps(): number {
        return (getConfiguration() as any).paintbrushMaxUndoSteps ?? 5;
    }

    constructor(panel: vscode.WebviewPanel) {
        this.panel = panel;
        this.worldMapLoader = new WorldMapLoader();
        this.worldMapLoader.onProgress(this.progressReporter);
    }

    public initialize(): void {
        if (!this.panel) {
            return;
        }

        const webview = this.panel.webview;
        webview.html = this.renderWorldMap(webview);
        webview.onDidReceiveMessage((msg) => this.onMessage(msg));
    }

    public onDocumentChange = debounceByInput(
        (uri: vscode.Uri) => {
            if (!this.worldMapDependencies) {
                return;
            }

            if (this.worldMapDependencies.some(d => matchPathEnd(uri.toString(), d.split('/')))) {
                this.sendProvinceMapSummaryToWebview(false);
            }
        },
        uri => uri.toString(),
        1000,
        { trailing: true });

    public dispose() {
        const disposedError = new Error('World-map runtime test webview was disposed.');
        for (const pending of this.runtimeTestRequests.values()) {
            clearTimeout(pending.timeout);
            pending.reject(disposedError);
        }
        this.runtimeTestRequests.clear();
        this.runtimeTestReadyWaiters.length = 0;
        this.panel = undefined;
    }

    public async runRuntimeTest(request: WorldMapRuntimeTestRequest): Promise<WorldMapRuntimeTestReport> {
        if (!isWorldMapRuntimeTestEnabled()) {
            throw new Error('World-map runtime testing is disabled. Set HOI4MU_WORLD_MAP_TEST=1 before launching VS Code.');
        }

        await this.waitForRuntimeTestReady(Math.min(request.timeoutMs ?? 360000, 360000));

        const requestId = `${Date.now()}-${++this.runtimeTestRequestCounter}`;
        const timeoutMs = Math.min(request.timeoutMs ?? 360000, 360000);
        const result = new Promise<WorldMapRuntimeTestReport>((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.runtimeTestRequests.delete(requestId);
                reject(new Error(`World-map runtime test ${requestId} timed out after ${timeoutMs}ms.`));
            }, timeoutMs);
            this.runtimeTestRequests.set(requestId, { resolve, reject, timeout });
        });

        const posted = await this.postMessageToWebview({
            command: 'worldmapruntimetest',
            requestId,
            request,
        });
        if (!posted) {
            const pending = this.runtimeTestRequests.get(requestId);
            if (pending) {
                clearTimeout(pending.timeout);
                this.runtimeTestRequests.delete(requestId);
                pending.reject(new Error('Failed to post the world-map runtime test request to the webview.'));
            }
        }

        return await result;
    }

    private renderWorldMap(webview: vscode.Webview): string {
        const conf = getConfiguration();
        const worldMapKeybinds = {
            selectionUndo: conf.get<string>('worldMapSelectionUndoKeybind', 'T'),
            selectionRedo: conf.get<string>('worldMapSelectionRedoKeybind', 'R'),
            mapUndo: conf.get<string>('worldMapMapUndoKeybind', 'Ctrl+Z'),
            mapRedo: conf.get<string>('worldMapMapRedoKeybind', 'Ctrl+Y'),
            createStateFromSelection: conf.get<string>('worldMapCreateStateKeybind', 'Ctrl+Shift+N'),
            assignSelectionToState: conf.get<string>('worldMapAssignSelectionKeybind', 'Ctrl+Enter'),
            assignSelectionToStrategicRegion: conf.get<string>('worldMapAssignSelectionToStrategicRegionKeybind', 'Ctrl+Shift+G'),
        };

        return html(
            webview,
            localizeText(worldmapview),
            [
                { content: i18nTableAsScript() },
                { content: 'window.__enableSupplyArea = ' + getConfiguration().enableSupplyArea + ';' },
                { content: 'window.__stateBoundaryColor = ' + JSON.stringify(getConfiguration().stateBoundaryColor) + ';' },
                { content: 'window.__stateBoundaryWidth = ' + getConfiguration().stateBoundaryWidth + ';' },
                { content: 'window.__worldMapKeybinds = ' + JSON.stringify(worldMapKeybinds) + ';' },
                { content: 'window.__confirmNewProvinceCreation = ' + (conf.get<boolean>('worldMapConfirmNewProvinceCreation', true)) + ';' },
                { content: 'window.__worldMapRuntimeTestEnabled = ' + isWorldMapRuntimeTestEnabled() + ';' },
                'common.js',
                'worldmap.js'
            ],
            ['common.css', 'codicon.css', { content: worldmapviewstyles }]
        );
    }

    private async onMessage(msg: WorldMapMessage | TelemetryMessage): Promise<void> {
        try {
            debug('worldmap message ' + JSON.stringify(msg));
            switch (msg.command) {
                case 'worldmapruntimetestready':
                    if (isWorldMapRuntimeTestEnabled()) {
                        this.runtimeTestReady = true;
                        for (const resolve of this.runtimeTestReadyWaiters.splice(0)) {
                            resolve();
                        }
                    }
                    break;
                case 'worldmapruntimetestresult':
                    if (isWorldMapRuntimeTestEnabled()) {
                        this.resolveRuntimeTest(msg);
                    }
                    break;
                case 'loaded':
                    await this.sendProvinceMapSummaryToWebview(msg.force);
                    break;
                case 'requestprovinces':
                    await this.sendMapData('provinces', msg, (await this.worldMapLoader.getWorldMap()).provinces);
                    break;
                case 'requeststates':
                    await this.sendMapData('states', msg, (await this.worldMapLoader.getWorldMap()).states);
                    break;
                case 'requestcountries':
                    await this.sendMapData('countries', msg, (await this.worldMapLoader.getWorldMap()).countries);
                    break;
                case 'requeststrategicregions':
                    await this.sendMapData('strategicregions', msg, (await this.worldMapLoader.getWorldMap()).strategicRegions);
                    break;
                case 'requestsupplyareas':
                    await this.sendMapData('supplyareas', msg, (await this.worldMapLoader.getWorldMap()).supplyAreas);
                    break;
                case 'requestrailways':
                    await this.sendMapData('railways', msg, (await this.worldMapLoader.getWorldMap()).railways);
                    break;
                case 'requestsupplynodes':
                    await this.sendMapData('supplynodes', msg, (await this.worldMapLoader.getWorldMap()).supplyNodes);
                    break;
                case 'openfile':
                    await this.openFile(msg.file, msg.type, msg.start, msg.end);
                    break;
                case 'telemetry':
                    await sendByMessage(msg);
                    break;
                case 'requestexportmap':
                    await this.requestExportMap();
                    break;
                case 'setconfirmnewprovincecreation':
                    await this.setConfirmNewProvinceCreation((msg as any).value);
                    break;
                case 'exportmap':
                    await this.exportMap(msg.dataUrl);
                    break;
                case 'persiststates':
                    await this.persistStates(msg.states, msg.deletedFiles ?? []);
                    break;
                case 'persistcountrydiplomacy':
                    try {
                        await this.persistCountryDiplomacy(msg as PersistCountryDiplomacyMessage);
                    } catch (e) {
                        error(e);
                        await this.postMessageToWebview({
                            command: 'countrydiplomacyupdated',
                            success: false,
                            error: e instanceof Error ? e.message : String(e),
                        });
                    }
                    break;
                case 'persiststrategicregions':
                    await this.persistStrategicRegions((msg as any).strategicRegions, (msg as any).deletedFiles ?? []);
                    break;
                case 'persistvictorypointlocalisation':
                    await this.persistVictoryPointLocalisation(msg as PersistVictoryPointLocalisationMessage);
                    break;
                case 'persistprovinces':
                    await this.persistProvinces((msg as any).provinces, (msg as any).deletedFiles ?? []);
                    break;
                case 'persistprovincebmp':
                    try {
                        await this.persistProvinceBmp(msg as any);

                        await this.postMessageToWebview({
                            command: 'provincebmpupdated',
                            data: JSON.stringify({
                                success: true,
                                canUndo: this.bmpUndoStack.length > 0,
                                canRedo: this.bmpRedoStack.length > 0,
                                forceReload: true,
                            }),
                            start: 0,
                            end: 0,
                        } as any);

                        // Remind the user to assign the new province to a
                        // strategic region and state.
                        vscode.window.showInformationMessage(
                            'Province BMP updated. ' +
                            'Remember to assign any new province(s) to a strategic region and state.'
                        );
                    } catch (e) {
                        error(e);

                        await this.postMessageToWebview({
                            command: 'provincebmpupdated',
                            data: JSON.stringify({
                                success: false,
                                error:
                                    e instanceof Error
                                        ? e.message
                                        : String(e),
                                canUndo: this.bmpUndoStack.length > 0,
                                canRedo: this.bmpRedoStack.length > 0,
                                forceReload: false,
                            }),
                            start: 0,
                            end: 0,
                        } as any);
                    }
                    break;
                case 'requestprovincebmp':
                    await this.sendProvinceBmpData();
                    break;
                case 'undoprovincebmp':
                    await this.undoProvinceBmp();
                    break;
                case 'redoprovincebmp':
                    await this.redoProvinceBmp();
                    break;
            }
        } catch (e) {
            error(e);
        }
    }

    private sendMapData(command: MapItemMessage['command'], msg: RequestMapItemMessage, value: unknown[]) {
        return this.postMessageToWebview({
            command: command,
            data: JSON.stringify(slice(value, msg.start, msg.end)),
            start: msg.start,
            end: msg.end,
        } as WorldMapMessage);
    }

    private progressReporter: ProgressReporter = async (progress: string) => {
        debug('Progress:', progress);
        await this.postMessageToWebview({
            command: 'progress',
            data: progress,
        } as WorldMapMessage);
    };

    private async sendProvinceMapSummaryToWebview(force: boolean) {
        try {
            this.worldMapLoader.shallowForceReload();
            const oldCachedWorldMap = this.cachedWorldMap;
            const loaderSession = new LoaderSession(force, () => this.panel === undefined);
            const { result: worldMap, dependencies } = await this.worldMapLoader.load(loaderSession);
            this.worldMapDependencies = dependencies;
            this.cachedWorldMap = worldMap;

            if (!force && oldCachedWorldMap && await this.sendDifferences(oldCachedWorldMap, worldMap)) {
                return;
            }

            const summary: WorldMapData = {
                ...worldMap,
                provinces: [],
                states: [],
                countries: [],
                strategicRegions: [],
                supplyAreas: [],
            };

            await this.postMessageToWebview({
                command: 'provincemapsummary',
                data: summary,
            } as WorldMapMessage);
        } catch (e) {
            error(e);

            await this.postMessageToWebview({
                command: 'error',
                data: localize('worldmap.failedtoload', 'Failed to load world map: {0}.', forceError(e).toString()),
            } as WorldMapMessage);
        }
    }

    private async openFile(file: string, type: 'state' | 'strategicregion' | 'supplyarea', start: number | undefined, end: number | undefined): Promise<void> {
        // TODO duplicate with previewbase.ts
        const filePathInMod = await getFilePathFromMod(file);
        if (filePathInMod !== undefined) {
            const filePathInModWithoutOpened = getHoiOpenedFileOriginalUri(filePathInMod);
            const document = getDocumentByUri(filePathInModWithoutOpened) ?? await vscode.workspace.openTextDocument(filePathInModWithoutOpened);
            await vscode.window.showTextDocument(document, {
                selection: start !== undefined && end !== undefined ? new vscode.Range(document.positionAt(start), document.positionAt(end)) : undefined,
            });
            return;
        }

        const typeName = localize('worldmap.openfiletype.' + type as any, type);
        
        if (!vscode.workspace.workspaceFolders?.length) {
            await vscode.window.showErrorMessage(localize('worldmap.mustopenafolder', 'Must open a folder before opening {0} file.', typeName));
            return;
        }

        let targetFolderUri = vscode.workspace.workspaceFolders[0].uri;
        if (vscode.workspace.workspaceFolders.length >= 1) {
            const folder = await vscode.window.showWorkspaceFolderPick({ placeHolder: localize('worldmap.selectafolder', 'Select a folder to copy {0} file', typeName) });
            if (!folder) {
                return;
            }

            targetFolderUri = folder.uri;
        }

        try {
            const [buffer] = await readFileFromModOrHOI4(file);
            const targetPath = vscode.Uri.joinPath(targetFolderUri, file);
            await mkdirs(dirUri(targetPath));
            await writeFile(targetPath, buffer);

            const document = await vscode.workspace.openTextDocument(targetPath);
            await vscode.window.showTextDocument(document, {
                selection: start !== undefined && end !== undefined ? new vscode.Range(document.positionAt(start), document.positionAt(end)) : undefined,
            });

        } catch (e) {
            await vscode.window.showErrorMessage(localize('worldmap.failedtoopenstate', 'Failed to open {0} file: {1}.', typeName, forceError(e).toString()));
        }
    }

    private async sendDifferences(cachedWorldMap: WorldMapData, worldMap: WorldMapData): Promise<boolean> {
        await this.progressReporter(localize('worldmap.progress.comparing', 'Comparing changes...'));
        const changeMessages: WorldMapMessage[] = [];

        if ((['width', 'height', 'provincesCount', 'statesCount', 'countriesCount', 'strategicRegionsCount', 'supplyAreasCount',
            'railwaysCount', 'supplyNodesCount',
            'badProvincesCount', 'badStatesCount', 'badStrategicRegionsCount', 'badSupplyAreasCount'] as (keyof WorldMapData)[])
            .some(k => !isEqual(cachedWorldMap[k], worldMap[k]))) {
            return false;
        }

        if (!isEqual(cachedWorldMap.warnings, worldMap.warnings)) {
            changeMessages.push({ command: 'warnings', data: JSON.stringify(worldMap.warnings), start: 0, end: 0 });
        }

        if (!isEqual(cachedWorldMap.continents, worldMap.continents)) {
            changeMessages.push({ command: 'continents', data: JSON.stringify(worldMap.continents), start: 0, end: 0 });
        }

        if (!isEqual(cachedWorldMap.terrains, worldMap.terrains)) {
            changeMessages.push({ command: 'terrains', data: JSON.stringify(worldMap.terrains), start: 0, end: 0 });
        }

        if (!isEqual(cachedWorldMap.resources, worldMap.resources)) {
            changeMessages.push({ command: 'resources', data: JSON.stringify(worldMap.resources), start: 0, end: 0 });
        }

        if (!isEqual(cachedWorldMap.rivers, worldMap.rivers)) {
            changeMessages.push({ command: 'rivers', data: JSON.stringify(worldMap.rivers), start: 0, end: 0 });
        }

        if (!isEqual(cachedWorldMap.conditionExprs, worldMap.conditionExprs)) {
            changeMessages.push({ command: 'conditionexprs', data: JSON.stringify(worldMap.conditionExprs), start: 0, end: 0 });
        }

        if (!this.fillMessageForItem(changeMessages, worldMap.provinces, cachedWorldMap.provinces, 'provinces', worldMap.badProvincesCount, worldMap.provincesCount)) {
            return false;
        }

        if (!this.fillMessageForItem(changeMessages, worldMap.states, cachedWorldMap.states, 'states', worldMap.badStatesCount, worldMap.statesCount)) {
            return false;
        }

        if (!this.fillMessageForItem(changeMessages, worldMap.countries, cachedWorldMap.countries, 'countries', 0, worldMap.countriesCount)) {
            return false;
        }

        if (!this.fillMessageForItem(changeMessages, worldMap.strategicRegions, cachedWorldMap.strategicRegions, 'strategicregions', worldMap.badStrategicRegionsCount, worldMap.strategicRegionsCount)) {
            return false;
        }

        if (!this.fillMessageForItem(changeMessages, worldMap.supplyAreas, cachedWorldMap.supplyAreas, 'supplyareas', worldMap.badSupplyAreasCount, worldMap.supplyAreasCount)) {
            return false;
        }

        if (!this.fillMessageForItem(changeMessages, worldMap.railways, cachedWorldMap.railways, 'railways', 0, worldMap.railwaysCount)) {
            return false;
        }

        if (!this.fillMessageForItem(changeMessages, worldMap.supplyNodes, cachedWorldMap.supplyNodes, 'supplynodes', 0, worldMap.supplyNodesCount)) {
            return false;
        }

        await this.progressReporter(localize('worldmap.progress.applying', 'Applying changes...'));

        for (const message of changeMessages) {
            await this.postMessageToWebview(message);
        }

        await this.progressReporter('');
        return true;
    }

    private fillMessageForItem(
        changeMessages: WorldMapMessage[],
        list: unknown[],
        cachedList: unknown[],
        command: MapItemMessage['command'],
        listStart: number,
        listEnd: number,
    ): boolean {
        const changeMessagesCountLimit = 30;
        const messageCountLimit = 300;

        let lastDifferenceStart: number | undefined = undefined;
        for (let i = listStart; i <= listEnd; i++) {
            if (i === listEnd || isEqual(list[i], cachedList[i])) {
                if (lastDifferenceStart !== undefined) {
                    changeMessages.push({
                        command,
                        data: JSON.stringify(slice(list, lastDifferenceStart, i)),
                        start: lastDifferenceStart,
                        end: i,
                    });
                    if (changeMessages.length > changeMessagesCountLimit) {
                        return false;
                    }
                    lastDifferenceStart = undefined;
                }
            } else {
                if (lastDifferenceStart === undefined) {
                    lastDifferenceStart = i;
                } else if (i - lastDifferenceStart >= messageCountLimit) {
                    changeMessages.push({
                        command,
                        data: JSON.stringify(slice(list, lastDifferenceStart, i)),
                        start: lastDifferenceStart,
                        end: i,
                    });
                    if (changeMessages.length > changeMessagesCountLimit) {
                        return false;
                    }
                    lastDifferenceStart = i;
                }
            }
        }

        return true;
    }

    private async postMessageToWebview(message: WorldMapMessage) {
        if (!this.panel) {
            return false;
        }

        return await this.panel.webview.postMessage(message);
    }

    private async waitForRuntimeTestReady(timeoutMs: number): Promise<void> {
        if (this.runtimeTestReady) {
            return;
        }

        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                const index = this.runtimeTestReadyWaiters.indexOf(onReady);
                if (index >= 0) {
                    this.runtimeTestReadyWaiters.splice(index, 1);
                }
                reject(new Error(`World-map runtime test controller was not ready after ${timeoutMs}ms.`));
            }, timeoutMs);
            const onReady = () => {
                clearTimeout(timeout);
                resolve();
            };
            this.runtimeTestReadyWaiters.push(onReady);
        });
    }

    private resolveRuntimeTest(message: WorldMapRuntimeTestResultMessage): void {
        const pending = this.runtimeTestRequests.get(message.requestId);
        if (!pending) {
            return;
        }

        clearTimeout(pending.timeout);
        this.runtimeTestRequests.delete(message.requestId);
        if (message.error) {
            pending.reject(new Error(message.error));
        } else if (message.report) {
            pending.resolve(message.report);
        } else {
            pending.reject(new Error('World-map runtime test returned neither a report nor an error.'));
        }
    }

    private async setConfirmNewProvinceCreation(value: boolean) {
        await getConfiguration().update('worldMapConfirmNewProvinceCreation', value, vscode.ConfigurationTarget.Global);
    }

    private async requestExportMap() {
        const uri = await vscode.window.showSaveDialog({ filters: { [localize('pngfile', 'PNG file')]: ['png'] } });
        this.lastRequestedExportUri = uri;
        if (!uri) {
            return;
        }

        await this.postMessageToWebview({ command: 'requestexportmap' });
    }

    private async exportMap(dataUrl?: string) {
        const uri = this.lastRequestedExportUri;
        if (!uri) {
            return;
        }

        const prefix = 'data:image/png;base64,';
        if (!dataUrl || !dataUrl.startsWith(prefix)) {
            vscode.window.showErrorMessage(localize('worldmap.export.error.imgformat', 'Can\'t export world map: Image is not in correct format.'));
            return;
        }

        try {
            const base64 = dataUrl.substring(prefix.length);
            const buffer = Buffer.from(base64, 'base64');

            await writeFile(uri, buffer);

            vscode.window.showInformationMessage(localize('worldmap.export.success', 'Successfully exported world map.'));

        } catch (e) {
            error(e);
            vscode.window.showErrorMessage(localize('worldmap.export.error', 'Can\'t export world map: {0}.', e));
        }
    }

    private async persistStates(states: PersistedState[], deletedFiles: string[]) {
        const uniqueDeletedFiles = Array.from(new Set(deletedFiles));
        for (const relativePath of uniqueDeletedFiles) {
            const targetFile = await this.resolveTargetFile(relativePath);
            try {
                await vscode.workspace.fs.delete(targetFile, { useTrash: false, recursive: false });
            } catch {
                // Ignore if file does not exist or cannot be deleted.
            }
        }

        if (states.length === 0) {
            return;
        }

        const groupedByFile = new Map<string, PersistedState[]>();
        for (const state of states) {
            const existing = groupedByFile.get(state.file);
            if (existing) {
                existing.push(state);
            } else {
                groupedByFile.set(state.file, [state]);
            }
        }

        for (const [relativePath, fileStates] of groupedByFile) {
            const targetFile = await this.resolveTargetFile(relativePath);
            let sourceText = '';
            try {
                const sourcePath = await getFilePathFromMod(relativePath);
                if (sourcePath) {
                    sourceText = (await readFileFromPath(sourcePath))[0].toString('utf-8').replace(/^\uFEFF/, '');
                } else {
                    sourceText = (await readFileFromModOrHOI4(relativePath))[0].toString('utf-8').replace(/^\uFEFF/, '');
                }
            } catch {
                // If file does not exist yet, we'll create it from state data.
            }

            const eol = sourceText.includes('\r\n') ? '\r\n' : '\n';
            const newContent = this.applyStateUpdates(sourceText, fileStates, eol, relativePath);

            await mkdirs(dirUri(targetFile));
            await writeFile(targetFile, Buffer.from(newContent, 'utf-8'));
        }
    }

    private async persistCountryDiplomacy(msg: PersistCountryDiplomacyMessage) {
        const tagPattern = /^[A-Z0-9]{3}$/;
        const autonomyPattern = /^autonomy_[a-z0-9_]+$/;
        const overlord = msg.overlord.toUpperCase();
        const subject = msg.subject.toUpperCase();

        if (!tagPattern.test(overlord) || !tagPattern.test(subject) || overlord === subject) {
            throw new Error('Invalid country selection for puppet relationship.');
        }
        if (msg.action === 'puppet' && (!msg.autonomyState || !autonomyPattern.test(msg.autonomyState))) {
            throw new Error('Invalid autonomy state.');
        }
        if (msg.action !== 'puppet' && msg.action !== 'end_puppet') {
            throw new Error('Invalid diplomacy action.');
        }

        const normalizedFile = msg.file.replace(/\\/g, '/');
        const fileName = normalizedFile.substring(normalizedFile.lastIndexOf('/') + 1);
        if (!normalizedFile.startsWith('history/countries/') ||
            !fileName.toUpperCase().startsWith(overlord)) {
            throw new Error(`Country history file does not match ${overlord}.`);
        }

        let sourceText = '';
        try {
            const sourcePath = await getFilePathFromMod(normalizedFile);
            sourceText = sourcePath
                ? (await readFileFromPath(sourcePath))[0].toString('utf-8').replace(/^\uFEFF/, '')
                : (await readFileFromModOrHOI4(normalizedFile))[0].toString('utf-8').replace(/^\uFEFF/, '');
        } catch {
            // The loader normally supplies an existing file. Keep creation as a
            // safe fallback for newly introduced country tags.
        }

        const eol = sourceText.includes('\r\n') ? '\r\n' : '\n';
        const effect = msg.action === 'end_puppet'
            ? `end_puppet = ${subject}`
            : msg.autonomyState === 'autonomy_puppet'
                ? `puppet = ${subject}`
                : [
                'set_autonomy = {',
                `\ttarget = ${subject}`,
                `\tautonomous_state = ${msg.autonomyState}`,
                '}',
                ].join(eol);
        const trimmed = sourceText.replace(/\s+$/, '');
        const newContent = trimmed.length > 0
            ? `${trimmed}${eol}${eol}${effect}${eol}`
            : `${effect}${eol}`;
        const targetFile = await this.resolveTargetFile(normalizedFile);

        await mkdirs(dirUri(targetFile));
        await writeFile(targetFile, Buffer.from(newContent, 'utf-8'));
        this.cachedWorldMap = undefined;
        this.worldMapDependencies = undefined;

        await this.postMessageToWebview({
            command: 'countrydiplomacyupdated',
            success: true,
        });
    }

    private async persistVictoryPointLocalisation(msg: PersistVictoryPointLocalisationMessage) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            debug('No workspace folder open; skipping victory point localisation write.');
            return;
        }

        const localisationDir = vscode.Uri.joinPath(workspaceFolder.uri, 'localisation');
        const targetFile = vscode.Uri.joinPath(localisationDir, 'victory_points_l_english.yml');
        const entryText = ` ${msg.key}:0 "${msg.value}"`;

        let existingContent = '';
        try {
            const sourceBytes = await vscode.workspace.fs.readFile(targetFile);
            existingContent = Buffer.from(sourceBytes).toString('utf-8').replace(/^\uFEFF/, '');
        } catch {
            // File does not exist yet; create it.
        }

        const eol = existingContent.includes('\r\n') ? '\r\n' : '\n';

        if (existingContent.includes(`${msg.key}:`)) {
            debug(`Localisation key ${msg.key} already exists; skipping.`);
            return;
        }

        let newContent: string;
        if (existingContent.length === 0) {
            newContent = `l_english:${eol}${entryText}${eol}`;
        } else {
            const trimmed = existingContent.replace(/\s+$/, '');
            newContent = `${trimmed}${eol}${entryText}${eol}`;
        }

        await mkdirs(localisationDir);
        await writeFile(targetFile, Buffer.from(newContent, 'utf-8'));
        debug(`Wrote victory point localisation entry ${msg.key} to ${targetFile.fsPath}`);
    }

    private async resolveTargetFile(relativePath: string): Promise<vscode.Uri> {
        const modFile = await getFilePathFromMod(relativePath);
        if (modFile) {
            return getHoiOpenedFileOriginalUri(modFile);
        }

        // File doesn't exist in the mod yet -  write into the mod folder determined
        // by the selected .mod descriptor's `path` attribute.
        const modPath = await getModPathFromDescriptor();
        if (modPath) {
            return vscode.Uri.joinPath(modPath, relativePath);
        }

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('Must open a folder before saving state changes.');
        }

        return vscode.Uri.joinPath(workspaceFolder.uri, relativePath);
    }

    private applyStateUpdates(sourceText: string, states: PersistedState[], eol: string, relativePath: string): string {
        let text = sourceText;
        const replacementStates = states.filter(s => s.tokenStart !== undefined && s.tokenEnd !== undefined);

        for (const state of replacementStates) {
            const range = this.findStateBlockRangeById(text, state.id);
            if (!range) {
                throw new Error(`Failed to locate existing state block by id ${state.id} in ${relativePath}`);
            }

            const serialized = this.serializeState(state, eol);
            text = text.substring(0, range.start) + serialized + text.substring(range.end);
        }

        const tokenlessStates = states.filter(s => s.tokenStart === undefined || s.tokenEnd === undefined);
        if (tokenlessStates.length > 0) {
            // For newly created states we always overwrite their dedicated target file,
            // never append into an existing file.
            const chunks = tokenlessStates.map(state => this.serializeState(state, eol));
            const body = chunks.join(eol + eol);

            if (replacementStates.length > 0) {
                throw new Error(`Refusing to mix tokenless and tokened state writes in one file: ${relativePath}`);
            }

            text = body + eol;
        }

        return text;
    }

    private findStateBlockRangeById(text: string, stateId: number): { start: number; end: number } | undefined {
        let cursor = 0;
        while (cursor < text.length) {
            const stateIndex = text.indexOf('state', cursor);
            if (stateIndex === -1) {
                return undefined;
            }

            const before = stateIndex > 0 ? text[stateIndex - 1] : ' ';
            const after = stateIndex + 5 < text.length ? text[stateIndex + 5] : ' ';
            if ((/[A-Za-z0-9_]/.test(before)) || (/[A-Za-z0-9_]/.test(after))) {
                cursor = stateIndex + 5;
                continue;
            }

            let index = stateIndex + 5;
            while (index < text.length && /\s/.test(text[index])) {
                index++;
            }

            if (index >= text.length || text[index] !== '=') {
                cursor = stateIndex + 5;
                continue;
            }

            index++;
            while (index < text.length && /\s/.test(text[index])) {
                index++;
            }

            if (index >= text.length || text[index] !== '{') {
                cursor = stateIndex + 5;
                continue;
            }

            const blockStart = stateIndex;
            let depth = 0;
            let blockEnd = index;
            for (let i = index; i < text.length; i++) {
                const ch = text[i];
                if (ch === '{') {
                    depth++;
                } else if (ch === '}') {
                    depth--;
                    if (depth === 0) {
                        blockEnd = i + 1;
                        break;
                    }
                }
            }

            if (depth !== 0) {
                return undefined;
            }

            const blockText = text.substring(blockStart, blockEnd);
            const idRegex = new RegExp(`\\bid\\s*=\\s*${stateId}\\b`);
            if (idRegex.test(blockText)) {
                return { start: blockStart, end: blockEnd };
            }

            cursor = blockEnd;
        }

        return undefined;
    }

    private serializeState(state: PersistedState, eol: string): string {
        const provinces = [...state.provinces].sort((a, b) => a - b).join(' ');
        const coreLines = [...state.cores].filter((v, i, a) => v && a.indexOf(v) === i).map(core => `\t\tadd_core_of = ${core}`);
        const vpEntries = Object.entries(state.victoryPoints)
            .map(([provinceId, value]) => [parseInt(provinceId), value] as const)
            .filter(([, value]) => value !== undefined)
            .sort((a, b) => a[0] - b[0])
            .map(([provinceId, value]) => `\t\tvictory_points = { ${provinceId} ${value} }`);
        const resourceEntries = Object.entries(state.resources)
            .filter(([, value]) => value !== undefined)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([key, value]) => `\t\t${key} = ${value}`);

        const lines: string[] = [
            'state = {',
            `\tid = ${state.id}`,
            `\tname = "${state.name}"`,
            `\tmanpower = ${state.manpower}`,
            `\tstate_category = ${state.category}`,
            `\tprovinces = { ${provinces} }`,
        ];

        if (state.impassable) {
            lines.push('\timpassable = yes');
        }

        if (resourceEntries.length > 0) {
            lines.push('\tresources = {');
            lines.push(...resourceEntries);
            lines.push('\t}');
        }

        lines.push('\thistory = {');
        if (state.owner) {
            lines.push(`\t\towner = ${state.owner}`);
        }
        lines.push(...coreLines);
        lines.push(...vpEntries);
        lines.push('\t}');
        lines.push('}');

        return lines.join(eol);
    }

    private async persistStrategicRegions(strategicRegions: PersistedStrategicRegion[], deletedFiles: string[]) {
        const uniqueDeletedFiles = Array.from(new Set(deletedFiles));
        for (const relativePath of uniqueDeletedFiles) {
            const targetFile = await this.resolveTargetFile(relativePath);
            try {
                await vscode.workspace.fs.delete(targetFile, { useTrash: false, recursive: false });
            } catch {
                // Ignore if file does not exist or cannot be deleted.
            }
        }

        if (strategicRegions.length === 0) {
            return;
        }

        const groupedByFile = new Map<string, PersistedStrategicRegion[]>();
        for (const sr of strategicRegions) {
            const existing = groupedByFile.get(sr.file);
            if (existing) {
                existing.push(sr);
            } else {
                groupedByFile.set(sr.file, [sr]);
            }
        }

        for (const [relativePath, fileSRs] of groupedByFile) {
            const targetFile = await this.resolveTargetFile(relativePath);
            let sourceText = '';
            try {
                const sourcePath = await getFilePathFromMod(relativePath);
                if (sourcePath) {
                    sourceText = (await readFileFromPath(sourcePath))[0].toString('utf-8').replace(/^\uFEFF/, '');
                } else {
                    sourceText = (await readFileFromModOrHOI4(relativePath))[0].toString('utf-8').replace(/^\uFEFF/, '');
                }
            } catch {
                // If file does not exist yet, we'll create it from sr data.
            }

            const eol = sourceText.includes('\r\n') ? '\r\n' : '\n';
            const newContent = this.applyStrategicRegionUpdates(sourceText, fileSRs, eol, relativePath);

            await mkdirs(dirUri(targetFile));
            await writeFile(targetFile, Buffer.from(newContent, 'utf-8'));
        }
    }

    private applyStrategicRegionUpdates(sourceText: string, srs: PersistedStrategicRegion[], eol: string, relativePath: string): string {
        let text = sourceText;
        const replacementSRs = srs.filter(s => s.tokenStart !== undefined && s.tokenEnd !== undefined);

        for (const sr of replacementSRs) {
            const range = this.findStrategicRegionBlockRangeById(text, sr.id);
            if (!range) {
                throw new Error(`Failed to locate existing strategic region block by id ${sr.id} in ${relativePath}`);
            }

            const serialized = this.serializeStrategicRegion(sr, eol);
            text = text.substring(0, range.start) + serialized + text.substring(range.end);
        }

        const tokenlessSRs = srs.filter(s => s.tokenStart === undefined || s.tokenEnd === undefined);
        if (tokenlessSRs.length > 0) {
            const chunks = tokenlessSRs.map(sr => this.serializeStrategicRegion(sr, eol));
            const body = chunks.join(eol + eol);

            if (replacementSRs.length > 0) {
                throw new Error(`Refusing to mix tokenless and tokened strategic region writes in one file: ${relativePath}`);
            }

            text = body + eol;
        }

        return text;
    }

    private findStrategicRegionBlockRangeById(text: string, srId: number): { start: number; end: number } | undefined {
        let cursor = 0;
        while (cursor < text.length) {
            const srIndex = text.indexOf('strategic_region', cursor);
            if (srIndex === -1) {
                return undefined;
            }

            const before = srIndex > 0 ? text[srIndex - 1] : ' ';
            const after = srIndex + 16 < text.length ? text[srIndex + 16] : ' ';
            if ((/[A-Za-z0-9_]/.test(before)) || (/[A-Za-z0-9_]/.test(after))) {
                cursor = srIndex + 16;
                continue;
            }

            let index = srIndex + 16;
            while (index < text.length && /\s/.test(text[index])) {
                index++;
            }

            if (index >= text.length || text[index] !== '=') {
                cursor = srIndex + 16;
                continue;
            }

            index++;
            while (index < text.length && /\s/.test(text[index])) {
                index++;
            }

            if (index >= text.length || text[index] !== '{') {
                cursor = srIndex + 16;
                continue;
            }

            const blockStart = srIndex;
            let depth = 0;
            let blockEnd = index;
            for (let i = index; i < text.length; i++) {
                const ch = text[i];
                if (ch === '{') {
                    depth++;
                } else if (ch === '}') {
                    depth--;
                    if (depth === 0) {
                        blockEnd = i + 1;
                        break;
                    }
                }
            }

            if (depth !== 0) {
                return undefined;
            }

            const blockText = text.substring(blockStart, blockEnd);
            const idRegex = new RegExp(`\\bid\\s*=\\s*${srId}\\b`);
            if (idRegex.test(blockText)) {
                return { start: blockStart, end: blockEnd };
            }

            cursor = blockEnd;
        }

        return undefined;
    }

    private serializeStrategicRegion(sr: PersistedStrategicRegion, eol: string): string {
        const provinces = [...sr.provinces].sort((a, b) => a - b).join(' ');
        const lines: string[] = [
            'strategic_region = {',
            `\tid = ${sr.id}`,
            `\tname = "${sr.name}"`,
            `\tprovinces = { ${provinces} }`,
        ];

        if (sr.navalTerrain) {
            lines.push(`\tnaval_terrain = ${sr.navalTerrain}`);
        }

        lines.push('}');
        return lines.join(eol);
    }

    private async persistProvinces(
        provinces: PersistedProvince[],
        deletedFiles: string[]
    ): Promise<void> {
        const definitionPath = 'map/definition.csv';
        const targetFile = await this.resolveTargetFile(definitionPath);

        let sourceText: string;

        try {
            const sourcePath = await getFilePathFromMod(definitionPath);

            sourceText = sourcePath
                ? (await readFileFromPath(sourcePath))[0]
                    .toString('utf-8')
                    .replace(/^\uFEFF/, '')
                : (await readFileFromModOrHOI4(definitionPath))[0]
                    .toString('utf-8')
                    .replace(/^\uFEFF/, '');
        } catch {
            throw new Error('Unable to read map/definition.csv.');
        }

        const eol = sourceText.includes('\r\n') ? '\r\n' : '\n';
        const lines = sourceText.split(/\r?\n/);

        const rowById = new Map<number, number>();

        for (let i = 0; i < lines.length; i++) {
            const fields = lines[i].split(';');
            const id = Number.parseInt(fields[0], 10);

            if (Number.isInteger(id) && id >= 0) {
                rowById.set(id, i);
            }
        }

        for (const province of provinces) {
            if (!Number.isInteger(province.id) || province.id <= 0) {
                throw new Error(
                    `Refusing to persist invalid province ID ${province.id}.`
                );
            }

            const color = province.color >>> 0;

            const red = (color >>> 16) & 0xff;
            const green = (color >>> 8) & 0xff;
            const blue = color & 0xff;

            if (!province.terrain) {
                throw new Error(
                    `Province ${province.id} has no terrain.`
                );
            }

            const row = [
                province.id.toString(),
                red.toString(),
                green.toString(),
                blue.toString(),
                province.type,
                province.coastal ? 'true' : 'false',
                province.terrain,
                province.continent.toString(),
            ].join(';');

            const existingIndex = rowById.get(province.id);

            if (existingIndex !== undefined) {
                lines[existingIndex] = row;
            } else {
                rowById.set(province.id, lines.length);
                lines.push(row);
            }
        }

        const deletedSet = new Set(deletedFiles.map(value => Number.parseInt(value, 10)).filter(Number.isInteger));

        const output = lines.filter(line => {
            if (deletedSet.size === 0) {
                return true;
            }

            const id = Number.parseInt(line.split(';')[0], 10);
            return !deletedSet.has(id);
        });

        await mkdirs(dirUri(targetFile));
        await writeFile(
            targetFile,
            Buffer.from(output.join(eol), 'utf-8')
        );
    }

    /**
     * Atomically persist the province BMP and definition.csv after a paintbrush edit.
     * Applies pixel diffs to the existing BMP and saves the old BMP for undo.
     */
    private async persistProvinceBmp(msg: {
        paintedPixels: number[][];
        width: number;
        height: number;
        provinces: PersistedProvince[];
        previousProvinces?: PersistedProvince[];
        deletedProvinceIds?: number[];
        targetProvinceId: number;
    }) {
        const defaultMap = await this.readDefaultMapConfig();
        const bmpRelativePath = 'map/' + (defaultMap?.provinces ?? 'provinces.bmp');

        // Read current BMP to save for undo
        const oldBmpBuffer = await this.readBmpFile(bmpRelativePath);
        if (!oldBmpBuffer) {
            return; // Can't proceed without existing BMP
        }

        // Save undo snapshot
        if (msg.previousProvinces) {
            const previousIds = new Set(msg.previousProvinces.map(province => province.id));
            const addedIds = msg.provinces
                .map(province => province.id)
                .filter(id => !previousIds.has(id));
            this.bmpUndoStack.push({
                bmpBuffer: oldBmpBuffer,
                provinces: msg.previousProvinces,
                deletedProvinceIds: addedIds,
            });
            const maxSteps = this.getMaxUndoSteps();
            while (this.bmpUndoStack.length > maxSteps) {
                this.bmpUndoStack.shift();
            }
            this.bmpRedoStack.length = 0;
        }

        // Apply pixel diffs
        const newBmpBuffer = this.applyPixelDiffsToBmp(oldBmpBuffer, msg.paintedPixels);

        // Write BMP atomically
        await this.writeBmpAtomic(bmpRelativePath, newBmpBuffer);

        // Write definition.csv
        await this.persistProvinces(msg.provinces, (msg.deletedProvinceIds ?? []).map(String));
    }

    /**
     * Send the current province BMP pixel data to the webview (for paintbrush initialization).
     */
    private async sendProvinceBmpData() {
        try {
            const worldMap = await this.worldMapLoader.getWorldMap();
            const provinceMap = worldMap as any;
            if (provinceMap.colorByPosition && provinceMap.width && provinceMap.height) {
                await this.postMessageToWebview({
                    command: 'provincebmpdata',
                    colorByPosition: provinceMap.colorByPosition,
                    width: worldMap.width,
                    height: worldMap.height,
                } as any);
            }
        } catch (e) {
            error(e);
        }
    }

    /**
     * Undo the last province BMP edit by restoring the previous BMP and CSV.
     */
    private async undoProvinceBmp() {
        const snapshot = this.bmpUndoStack.pop();
        if (!snapshot) {
            return;
        }

        const defaultMap = await this.readDefaultMapConfig();
        const bmpRelativePath = 'map/' + (defaultMap?.provinces ?? 'provinces.bmp');

        // Save current BMP and CSV for redo
        const currentBmp = await this.readBmpFile(bmpRelativePath);
        const currentProvinces = await this.readCurrentProvinceDefs();
        if (currentBmp) {
            const currentIds = new Set(currentProvinces.map(province => province.id));
            this.bmpRedoStack.push({
                bmpBuffer: currentBmp,
                provinces: currentProvinces,
                deletedProvinceIds: snapshot.provinces
                    .map(province => province.id)
                    .filter(id => !currentIds.has(id)),
            });
            const maxSteps = this.getMaxUndoSteps();
            while (this.bmpRedoStack.length > maxSteps) {
                this.bmpRedoStack.shift();
            }
        }

        // Restore old BMP
        await this.writeBmpAtomic(bmpRelativePath, snapshot.bmpBuffer);

        // Restore old CSV
        await this.persistProvinces(snapshot.provinces, (snapshot.deletedProvinceIds ?? []).map(String));

        // Signal webview to reload
        await this.postMessageToWebview({
            command: 'provincebmpupdated',
            data: JSON.stringify({ canUndo: this.bmpUndoStack.length > 0, canRedo: this.bmpRedoStack.length > 0, forceReload: true }),
            start: 0,
            end: 0,
        } as any);
    }

    /**
     * Redo the last undone province BMP edit.
     */
    private async redoProvinceBmp() {
        const snapshot = this.bmpRedoStack.pop();
        if (!snapshot) {
            return;
        }

        const defaultMap = await this.readDefaultMapConfig();
        const bmpRelativePath = 'map/' + (defaultMap?.provinces ?? 'provinces.bmp');

        // Save current BMP and CSV for undo
        const currentBmp = await this.readBmpFile(bmpRelativePath);
        const currentProvinces = await this.readCurrentProvinceDefs();
        if (currentBmp) {
            const currentIds = new Set(currentProvinces.map(province => province.id));
            this.bmpUndoStack.push({
                bmpBuffer: currentBmp,
                provinces: currentProvinces,
                deletedProvinceIds: snapshot.provinces
                    .map(province => province.id)
                    .filter(id => !currentIds.has(id)),
            });
            const maxSteps = this.getMaxUndoSteps();
            while (this.bmpUndoStack.length > maxSteps) {
                this.bmpUndoStack.shift();
            }
        }

        // Restore redo BMP
        await this.writeBmpAtomic(bmpRelativePath, snapshot.bmpBuffer);

        // Restore redo CSV
        await this.persistProvinces(snapshot.provinces, (snapshot.deletedProvinceIds ?? []).map(String));

        await this.postMessageToWebview({
            command: 'provincebmpupdated',
            data: JSON.stringify({ canUndo: this.bmpUndoStack.length > 0, canRedo: this.bmpRedoStack.length > 0, forceReload: true }),
            start: 0,
            end: 0,
        } as any);
    }

    /**
     * Read current province definitions from definition.csv.
     * HOI4 format: id;red;green;blue;type;coastal;terrain;continent
     * Returns an array of PersistedProvince objects representing the current state.
     */
    private async readCurrentProvinceDefs(): Promise<PersistedProvince[]> {
        const definitionPath = 'map/definition.csv';
        try {
            const [buffer] = await readFileFromModOrHOI4(definitionPath);
            const text = buffer.toString('utf-8').replace(/^\uFEFF/, '');
            const lines = text.split(/\r?\n/);
            const provinces: PersistedProvince[] = [];

            // Skip header line (index 0)
            for (let i = 1; i < lines.length; i++) {
                const fields = lines[i].split(';');
                if (fields.length >= 8) {
                    const id = parseInt(fields[0], 10);
                    if (!isNaN(id) && id > 0) {
                        const r = parseInt(fields[1], 10) || 0;
                        const g = parseInt(fields[2], 10) || 0;
                        const b = parseInt(fields[3], 10) || 0;
                        const color = ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF);

                        provinces.push({
                            id,
                            color,
                            type: fields[4] || 'land',
                            coastal: fields[5]?.toLowerCase() === 'true',
                            terrain: fields[6] || '',
                            continent: parseInt(fields[7], 10) || 0,
                        });
                    }
                }
            }
            return provinces;
        } catch {
            return [];
        }
    }

    /**
     * Read the BMP file as a binary buffer.
     * Tries the mod folder first, then falls back to the base game.
     * This ensures paintbrush edits work even when the mod doesn't yet
     * have its own copy of the provinces BMP.
     */
    private async readBmpFile(bmpRelativePath: string): Promise<Buffer | undefined> {
        try {
            // First, try to read from the mod folder
            const modFile = await getFilePathFromMod(bmpRelativePath);
            if (modFile) {
                const data = await vscode.workspace.fs.readFile(
                    getHoiOpenedFileOriginalUri(modFile)
                );
                return Buffer.from(data);
            }

            // Fall back to the base game installation
            const [buffer] = await readFileFromModOrHOI4(bmpRelativePath);
            return buffer;
        } catch {
            return undefined;
        }
    }

    /**
     * Write a BMP buffer atomically (temp file + rename).
     */
    private async writeBmpAtomic(bmpRelativePath: string, buffer: Buffer): Promise<void> {
        const targetFile = await this.resolveTargetFile(bmpRelativePath);
        const tempFile = vscode.Uri.parse(targetFile.toString() + '.tmp');
        await mkdirs(dirUri(targetFile));
        await writeFile(tempFile, buffer);
        try {
            await vscode.workspace.fs.rename(tempFile, targetFile, { overwrite: true });
        } catch {
            await vscode.workspace.fs.copy(tempFile, targetFile, { overwrite: true });
            try { await vscode.workspace.fs.delete(tempFile); } catch { /* ignore */ }
        }
    }

    /**
     * Apply painted pixel diffs to a raw BMP file buffer in-place.
     * Supports 24-bit and 32-bit BMPs.
     */
    private applyPixelDiffsToBmp(bmpBuffer: Buffer, paintedPixels: number[][]): Buffer {
        const result = Buffer.from(bmpBuffer);

        if (result[0] !== 0x42 || result[1] !== 0x4D) {
            debug('applyPixelDiffsToBmp: not a valid BMP file (missing BM header)');
            return result;
        }

        const dataOffset = result.readUInt32LE(10);
        const width = result.readInt32LE(18);
        const height = result.readInt32LE(22);
        const bitsPerPixel = result.readUInt16LE(28);
        const bytesPerPixel = bitsPerPixel / 8;
        const rowSize = ((width * bitsPerPixel + 7 >> 3) + 3) & 0xFFFFFFFC;

        if (bitsPerPixel !== 24 && bitsPerPixel !== 32) {
            debug(`applyPixelDiffsToBmp: unsupported BMP bit depth ${bitsPerPixel} (only 24-bit and 32-bit are supported)`);
            return result;
        }

        for (const [x, y, newColor] of paintedPixels) {
            if (x < 0 || x >= width || y < 0 || y >= height) {
                continue;
            }

            // BMP is bottom-up: row (height - 1 - y)
            const row = height - 1 - y;
            const pixelOffset = dataOffset + row * rowSize + x * bytesPerPixel;

            if (pixelOffset + bytesPerPixel - 1 < result.length) {
                result[pixelOffset] = newColor & 0xFF;           // B
                result[pixelOffset + 1] = (newColor >> 8) & 0xFF; // G
                result[pixelOffset + 2] = (newColor >> 16) & 0xFF; // R
                // For 32-bit, leave the alpha byte unchanged
            }
        }

        return result;
    }

    /**
     * Read the default.map configuration to get the provinces BMP filename.
     */
    private async readDefaultMapConfig(): Promise<{ provinces: string } | undefined> {
        try {
            const [buffer] = await readFileFromModOrHOI4('map/default.map');
            const text = buffer.toString('utf-8');
            const match = text.match(/provinces\s*=\s*"([^"]+)"/);
            if (match) {
                return { provinces: match[1] };
            }
        } catch { /* ignore */ }
        return undefined;
    }
}
