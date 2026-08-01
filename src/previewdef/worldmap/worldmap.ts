import * as vscode from 'vscode';
import worldmapview from './worldmapview.html';
import worldmapviewstyles from './worldmapview.css';
import { localize, localizeText, i18nTableAsScript } from '../../util/i18n';
import { html } from '../../util/html';
import { error, debug } from '../../util/debug';
import { WorldMapMessage, ProgressReporter, WorldMapData, MapItemMessage, RequestMapItemMessage, PersistedState, PersistedStrategicRegion, PersistedProvince, PaintbrushConfig, PersistProvinceBmpMessage, PersistVictoryPointLocalisationMessage, PersistCountryDiplomacyMessage, CreateCountryMessage, RunAreaOperationMessage, RunContinentPipelineMessage, WorldMapRuntimeTestReport, WorldMapRuntimeTestRequest, WorldMapRuntimeTestResultMessage } from './definitions';
import { matchPathEnd } from '../../util/nodecommon';
import { writeFile, mkdirs, getDocumentByUri, dirUri } from '../../util/vsccommon';
import { slice, debounceByInput, forceError } from '../../util/common';
import { getFilePathFromMod, getFilePathFromModOrHOI4, getHoiOpenedFileOriginalUri, readFileFromModOrHOI4, readFileFromPath, getModPathFromDescriptor, getSelectedModFileUri, invalidateModDescriptorCaches, listFilesFromModOrHOI4 } from '../../util/fileloader';
import { WorldMapLoader } from './loader/worldmaploader';
import { isEqual } from 'lodash';
import { LoaderSession } from '../../util/loader/loader';
import { TelemetryMessage, sendByMessage } from '../../util/telemetry';
import { getConfiguration } from '../../util/vsccommon';
import { extractProvinceBmpColors, repairAdjacencies, repairRailways, repairSupplyNodes, validateNewProvinceMembership, validateProvinceBmpEdit } from './provincefixes';
import { clearMapBuildings, clearRailways, clearSupplyHubs, clearWaterCrossings, convertDefinitionsToOcean, partitionLandAndWaterProvinces, partitionMappedMembership, patchStateMembershipPreservingContent, patchStatePreservingUnknownContent, planProvinceMergesByType, removeAllCores, removeProvincesFromRegionBlocks, replaceStateIdsInSupplyAreas, transformSelectedStates } from './areaoperations';
import { createSequentialIdMap, reindexCountryHistoryFile, reindexDefinitions, reindexMapBuildings, reindexStateFile, reindexStrategicRegionFile, reindexSupplyAreaFile, reindexUnitStacks } from './reindex';
import { addReplacePathsToDescriptor } from '../../util/replacepath';
import { buildClippedRiverOceanEdit } from './riverconversion';
import { applyEntriesWithRollback } from './transactionjournal';

export const WorldMapRuntimeTestCommand = 'hoi4modernutils.test.worldmap.renderCases';

interface OperationalSnapshotEntry {
    target: vscode.Uri;
    previous?: Buffer;
    binary: boolean;
}

type OperationalSnapshot = Map<string, OperationalSnapshotEntry>;

interface ProvinceBmpTransactionSnapshot {
    files: OperationalSnapshotEntry[];
}

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
    private messageQueue: Promise<void> = Promise.resolve();

    private lastRequestedExportUri: vscode.Uri | undefined;
    private runtimeTestReady = false;
    private runtimeTestRequestCounter = 0;
    private runtimeTestReadyWaiters: (() => void)[] = [];
    private runtimeTestRequests = new Map<string, {
        resolve: (report: WorldMapRuntimeTestReport) => void;
        reject: (error: Error) => void;
        timeout: NodeJS.Timeout;
    }>();

    /** Undo/redo snapshots cover every file touched by a province-BMP transaction. */
    private bmpUndoStack: ProvinceBmpTransactionSnapshot[] = [];
    private bmpRedoStack: ProvinceBmpTransactionSnapshot[] = [];

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
        webview.onDidReceiveMessage((msg) => {
            this.messageQueue = this.messageQueue
                .then(() => this.onMessage(msg))
                .catch(e => error(e));
        });
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
                { content: 'window.__autoCoreTransfers = ' + (conf.get<boolean>('worldMapAutoCoreTransfers', false)) + ';' },
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
                case 'setautocoretransfers':
                    await getConfiguration().update('worldMapAutoCoreTransfers', (msg as any).value, vscode.ConfigurationTarget.Global);
                    break;
                case 'createcountry':
                    await this.createCountry(msg as CreateCountryMessage);
                    break;
                case 'resolveprovincewarnings':
                    await this.resolveProvinceWarnings(msg.requestId);
                    break;
                case 'runareaoperation':
                    await this.runAreaOperation(msg as RunAreaOperationMessage);
                    break;
                case 'runcontinentpipeline':
                    await this.runContinentPipeline(msg as RunContinentPipelineMessage);
                    break;
                case 'removeallcores':
                    await this.removeAllCores(msg.requestId);
                    break;
                case 'reindexmap':
                    await this.runReindexMap(msg.requestId);
                    break;
                case 'exportmap':
                    await this.exportMap(msg.dataUrl);
                    break;
                case 'persiststates':
                    try {
                        await this.persistStates(
                            msg.states,
                            msg.deletedFiles ?? [],
                            msg.deletedStates ?? [],
                            msg.stateReplacements ?? {}
                        );
                        await this.postMessageToWebview({
                            command: 'persiststatesresult',
                            requestId: msg.requestId,
                            success: true,
                        });
                    } catch (e) {
                        await this.postMessageToWebview({
                            command: 'persiststatesresult',
                            requestId: msg.requestId,
                            success: false,
                            error: e instanceof Error ? e.message : String(e),
                        });
                    }
                    break;
                case 'persistcountrydiplomacy':
                    try {
                        await this.persistCountryDiplomacy(msg as PersistCountryDiplomacyMessage);
                    } catch (e) {
                        error(e);
                        await this.postMessageToWebview({
                            command: 'countrydiplomacyupdated',
                            requestId: msg.requestId,
                            success: false,
                            error: e instanceof Error ? e.message : String(e),
                        });
                    }
                    break;
                case 'persiststrategicregions':
                    try {
                        await this.persistStrategicRegions(
                            msg.strategicRegions,
                            msg.deletedFiles ?? [],
                            msg.deletedRegions ?? []
                        );
                        await this.postMessageToWebview({
                            command: 'persiststrategicregionsresult',
                            requestId: msg.requestId,
                            success: true,
                        });
                    } catch (e) {
                        error(e);
                        await this.postMessageToWebview({
                            command: 'persiststrategicregionsresult',
                            requestId: msg.requestId,
                            success: false,
                            error: e instanceof Error ? e.message : String(e),
                        });
                    }
                    break;
                case 'persistvictorypointlocalisation':
                    try {
                        await this.persistVictoryPointLocalisation(msg);
                        await this.postMessageToWebview({
                            command: 'persistvictorypointlocalisationresult',
                            requestId: msg.requestId,
                            success: true,
                        });
                    } catch (e) {
                        error(e);
                        await this.postMessageToWebview({
                            command: 'persistvictorypointlocalisationresult',
                            requestId: msg.requestId,
                            success: false,
                            error: e instanceof Error ? e.message : String(e),
                        });
                    }
                    break;
                case 'persistprovinces':
                    try {
                        await this.persistProvinces(msg.provinces, msg.deletedFiles ?? []);
                        await this.postMessageToWebview({
                            command: 'persistprovincesresult',
                            requestId: msg.requestId,
                            success: true,
                        });
                    } catch (e) {
                        error(e);
                        await this.postMessageToWebview({
                            command: 'persistprovincesresult',
                            requestId: msg.requestId,
                            success: false,
                            error: e instanceof Error ? e.message : String(e),
                        });
                    }
                    break;
                case 'persistprovincebmp':
                    try {
                        await this.persistProvinceBmp(msg);

                        await this.postMessageToWebview({
                            command: 'provincebmpupdated',
                            requestId: msg.requestId,
                            success: true,
                            canUndo: this.bmpUndoStack.length > 0,
                            canRedo: this.bmpRedoStack.length > 0,
                            forceReload: true,
                        });

                        vscode.window.showInformationMessage(
                            'Province BMP and dependent map records updated.'
                        );
                    } catch (e) {
                        error(e);

                        await this.postMessageToWebview({
                            command: 'provincebmpupdated',
                            requestId: msg.requestId,
                            success: false,
                            error: e instanceof Error ? e.message : String(e),
                            canUndo: this.bmpUndoStack.length > 0,
                            canRedo: this.bmpRedoStack.length > 0,
                            forceReload: false,
                        });
                    }
                    break;
                case 'requestprovincebmp':
                    await this.sendProvinceBmpData(msg.requestId);
                    break;
                case 'undoprovincebmp':
                    await this.undoProvinceBmp(msg.requestId);
                    break;
                case 'redoprovincebmp':
                    await this.redoProvinceBmp(msg.requestId);
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

    private async persistStates(
        states: PersistedState[],
        deletedFiles: string[],
        deletedStates: Array<{ id: number; file: string }> = [],
        stateReplacements: Record<number, number> = {}
    ) {
        const uniqueDeletedFiles = Array.from(new Set(deletedFiles));
        const replaceStateFolder = uniqueDeletedFiles.length > 0;
        let descriptorSnapshot: { target: vscode.Uri; previous: Buffer } | undefined;

        // Deleting state records cannot be represented safely with isolated
        // overrides alone. Preflight the descriptor before changing any file.
        if (replaceStateFolder) {
            const descriptor = await getSelectedModFileUri();
            if (!descriptor) {
                throw new Error(
                    'Merging or deleting states requires a selected .mod descriptor so replace_path can be set for history/states.'
                );
            }
            descriptorSnapshot = {
                target: descriptor,
                previous: (await this.readOperationalSnapshot(descriptor)) ??
                    Buffer.from(await vscode.workspace.fs.readFile(descriptor)),
            };
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
        const deletedStateIdsByFile = new Map<string, number[]>();
        for (const deleted of deletedStates) {
            if (!Number.isInteger(deleted.id) || deleted.id <= 0 || !deleted.file) {
                continue;
            }
            const ids = deletedStateIdsByFile.get(deleted.file) ?? [];
            ids.push(deleted.id);
            deletedStateIdsByFile.set(deleted.file, ids);
            if (!groupedByFile.has(deleted.file)) {
                groupedByFile.set(deleted.file, []);
            }
        }

        const pending = new Map<string, {
            target: vscode.Uri;
            previous?: Buffer;
            next?: Buffer;
        }>();
        const queue = async (relativePath: string, next?: Buffer) => {
            const existing = pending.get(relativePath);
            if (existing) {
                existing.next = next;
                return;
            }
            const target = await this.resolveTargetFile(relativePath);
            const previous = await this.readOperationalSnapshot(target);
            pending.set(relativePath, { target, previous, next });
        };

        if (replaceStateFolder) {
            // replace_path hides the entire inherited folder. Materialize every
            // effective file first, including files with no changed state.
            const effectiveFiles = await listFilesFromModOrHOI4(
                'history/states',
                { recursively: true }
            );
            for (const file of effectiveFiles) {
                const relativePath = `history/states/${file}`.replace(/\\/g, '/');
                const [source] = await readFileFromModOrHOI4(relativePath);
                await queue(relativePath, source);
            }
        }

        for (const [relativePath, fileStates] of groupedByFile) {
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
            const newContent = this.applyStateUpdates(
                sourceText,
                fileStates,
                eol,
                relativePath,
                deletedStateIdsByFile.get(relativePath) ?? []
            );

            await queue(relativePath, Buffer.from(newContent, 'utf-8'));
        }

        for (const relativePath of uniqueDeletedFiles) {
            // Once history/states is replaced, omitting the old file is the
            // correct deletion. No empty placeholder is needed.
            await queue(relativePath, undefined);
        }
        if (Object.keys(stateReplacements).length > 0) {
            const supplyAreaFiles = await listFilesFromModOrHOI4(
                'map/supplyareas',
                { recursively: true }
            );
            for (const file of supplyAreaFiles) {
                const relativePath = `map/supplyareas/${file}`.replace(/\\/g, '/');
                let source: Buffer;
                try {
                    [source] = await readFileFromModOrHOI4(relativePath);
                } catch {
                    continue;
                }
                const sourceText = source.toString('utf-8').replace(/^\uFEFF/, '');
                const nextText = replaceStateIdsInSupplyAreas(
                    sourceText,
                    stateReplacements
                ).text;
                if (nextText !== sourceText) {
                    await queue(relativePath, Buffer.from(nextText, 'utf-8'));
                }
            }
            const countryHistoryFiles = await listFilesFromModOrHOI4(
                'history/countries',
                { recursively: true }
            );
            for (const file of countryHistoryFiles) {
                const relativePath = `history/countries/${file}`.replace(/\\/g, '/');
                let source: Buffer;
                try {
                    [source] = await readFileFromModOrHOI4(relativePath);
                } catch {
                    continue;
                }
                const sourceText = source.toString('utf-8').replace(/^\uFEFF/, '');
                const nextText = reindexCountryHistoryFile(
                    sourceText,
                    stateReplacements
                ).text;
                if (nextText !== sourceText) {
                    await queue(relativePath, Buffer.from(nextText, 'utf-8'));
                }
            }
        }

        const completed: Array<{
            target: vscode.Uri;
            previous?: Buffer;
            next?: Buffer;
        }> = [];
        try {
            for (const operation of pending.values()) {
                if (operation.next) {
                    await mkdirs(dirUri(operation.target));
                    await this.writeOperationalFile(operation.target, operation.next);
                } else if (operation.previous) {
                    await vscode.workspace.fs.delete(
                        operation.target,
                        { recursive: false, useTrash: false }
                    );
                }
                completed.push(operation);
            }
            if (replaceStateFolder) {
                await this.ensureDescriptorReplacePaths(['history/states']);
            }
        } catch (e) {
            for (const operation of completed.reverse()) {
                try {
                    if (operation.previous) {
                        await mkdirs(dirUri(operation.target));
                        await this.writeOperationalFile(operation.target, operation.previous);
                    } else if (operation.next) {
                        await vscode.workspace.fs.delete(
                            operation.target,
                            { recursive: false, useTrash: false }
                        );
                    }
                } catch {
                    // Preserve the original persistence failure.
                }
            }
            if (descriptorSnapshot) {
                try {
                    await this.writeOperationalFile(descriptorSnapshot.target, descriptorSnapshot.previous);
                    invalidateModDescriptorCaches();
                } catch {
                    // Preserve the original persistence failure.
                }
            }
            throw e;
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
        await this.writeOperationalFile(targetFile, Buffer.from(newContent, 'utf-8'));
        this.cachedWorldMap = undefined;
        this.worldMapDependencies = undefined;

        await this.postMessageToWebview({
            command: 'countrydiplomacyupdated',
            requestId: msg.requestId,
            success: true,
        });
    }

    private async createCountry(msg: CreateCountryMessage): Promise<void> {
        const tag = msg.tag.trim().toUpperCase();
        const localizedName = msg.localizedName.trim();
        try {
            if (!/^[A-Z0-9]{3}$/.test(tag)) {
                throw new Error('Country tag must contain exactly three letters or digits.');
            }
            if (!localizedName) {
                throw new Error('Localized country name is required.');
            }
            if (!Number.isInteger(msg.capitalStateId) || msg.capitalStateId <= 0) {
                throw new Error('A valid selected capital state is required.');
            }

            const worldMap = await this.worldMapLoader.getWorldMap();
            if (worldMap.countries.some(country => country.tag.toUpperCase() === tag)) {
                throw new Error(`Country tag ${tag} already exists.`);
            }

            const hash = Array.from(tag).reduce((value, char) => ((value * 33) ^ char.charCodeAt(0)) >>> 0, 5381);
            const red = 48 + (hash & 0x9f);
            const green = 48 + ((hash >>> 8) & 0x9f);
            const blue = 48 + ((hash >>> 16) & 0x9f);
            const writes = [
                {
                    path: 'common/country_tags/zz_hoi4modernutils_tags.txt',
                    append: `${tag} = "countries/${tag}.txt"`,
                },
                {
                    path: `common/countries/${tag}.txt`,
                    create: `color = rgb { ${red} ${green} ${blue} }\ncolor_ui = rgb { ${red} ${green} ${blue} }\n`,
                },
                {
                    path: `history/countries/${tag} - ${this.sanitizeFileName(localizedName)}.txt`,
                    create: `capital = ${msg.capitalStateId}\nset_research_slots = 2\nset_stability = 0.5\nset_war_support = 0.5\n`,
                },
                {
                    path: 'localisation/english/hoi4modernutils_countries_l_english.yml',
                    append: [
                        ` ${tag}:0 "${this.escapeLocalisation(localizedName)}"`,
                        ` ${tag}_DEF:0 "${this.escapeLocalisation(localizedName)}"`,
                        ` ${tag}_ADJ:0 "${this.escapeLocalisation(localizedName)}"`,
                    ].join('\n'),
                    header: 'l_english:',
                    bom: true,
                },
            ];

            const pending: { target: vscode.Uri; previous?: Buffer; next: Buffer }[] = [];
            for (const item of writes) {
                const target = await this.resolveTargetFile(item.path);
                const previous = await this.readOperationalSnapshot(target);
                if (item.create !== undefined && previous) {
                    throw new Error(`Refusing to overwrite existing file ${item.path}.`);
                }

                const source = previous?.toString('utf-8').replace(/^\uFEFF/, '') ?? '';
                const eol = source.includes('\r\n') ? '\r\n' : '\n';
                let next: string;
                if (item.create !== undefined) {
                    next = item.create.replace(/\n/g, eol);
                } else {
                    const header = !source && item.header ? `${item.header}${eol}` : '';
                    const body = source.replace(/\s+$/, '');
                    const separator = body ? eol : '';
                    next = `${header}${body}${separator}${item.append!.replace(/\n/g, eol)}${eol}`;
                }
                const includeBom = ('bom' in item && item.bom === true) || previous?.slice(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]));
                pending.push({ target, previous, next: Buffer.from((includeBom ? '\uFEFF' : '') + next, 'utf-8') });
            }

            const completed: typeof pending = [];
            try {
                for (const write of pending) {
                    await mkdirs(dirUri(write.target));
                    await this.writeOperationalFile(write.target, write.next);
                    completed.push(write);
                }
            } catch (e) {
                for (const write of completed.reverse()) {
                    try {
                        if (write.previous) {
                            await this.writeOperationalFile(write.target, write.previous);
                        } else {
                            await vscode.workspace.fs.delete(write.target, { recursive: false, useTrash: false });
                        }
                    } catch {
                        // Preserve original failure.
                    }
                }
                throw e;
            }

            this.cachedWorldMap = undefined;
            this.worldMapDependencies = undefined;
            await this.postMessageToWebview({
                command: 'createcountryresult',
                requestId: msg.requestId,
                success: true,
                tag,
            });
        } catch (e) {
            await this.postMessageToWebview({
                command: 'createcountryresult',
                requestId: msg.requestId,
                success: false,
                error: e instanceof Error ? e.message : String(e),
            });
        }
    }

    private sanitizeFileName(value: string): string {
        const result = value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').trim().replace(/\s+/g, ' ');
        return result || 'Country';
    }

    private escapeLocalisation(value: string): string {
        return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
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
        await this.writeOperationalFile(targetFile, Buffer.from(newContent, 'utf-8'));
        debug(`Wrote victory point localisation entry ${msg.key} to ${targetFile.fsPath}`);
    }

    private async resolveTargetFile(relativePath: string): Promise<vscode.Uri> {
        // A selected descriptor is the authority for operational writes. The
        // general read resolver searches open workspace folders first, which is
        // useful for previews but can otherwise redirect an edit away from the
        // selected mod when another workspace contains the same relative file.
        const modPath = await getModPathFromDescriptor();
        if (modPath) {
            return vscode.Uri.joinPath(modPath, relativePath);
        }

        const modFile = await getFilePathFromMod(relativePath);
        if (modFile) {
            return getHoiOpenedFileOriginalUri(modFile);
        }

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('Must open a folder before saving state changes.');
        }

        return vscode.Uri.joinPath(workspaceFolder.uri, relativePath);
    }

    private async ensureDescriptorReplacePaths(paths: readonly string[]): Promise<void> {
        if (paths.length === 0) {
            return;
        }

        const descriptor = await getSelectedModFileUri();
        if (!descriptor) {
            throw new Error(
                `Destructive map edits require a selected .mod descriptor so replace_path can be set for: ${paths.join(', ')}.`
            );
        }

        const source = Buffer.from(await vscode.workspace.fs.readFile(descriptor)).toString('utf-8');
        const update = addReplacePathsToDescriptor(source, paths);
        if (update.added.length === 0) {
            return;
        }

        await this.writeOperationalFile(descriptor, Buffer.from(update.text, 'utf-8'));
        invalidateModDescriptorCaches();
        debug(`Added descriptor replace_path entries: ${update.added.join(', ')}`);
    }

    private applyStateUpdates(
        sourceText: string,
        states: PersistedState[],
        eol: string,
        relativePath: string,
        deletedStateIds: readonly number[] = []
    ): string {
        let text = sourceText;
        const deletionRanges = Array.from(new Set(deletedStateIds))
            .map(id => this.findStateBlockRangeById(text, id))
            .filter((range): range is { start: number; end: number } => !!range)
            .sort((a, b) => b.start - a.start);
        for (const range of deletionRanges) {
            text = text.substring(0, range.start) + text.substring(range.end);
        }
        const replacementStates = states.filter(s => s.tokenStart !== undefined && s.tokenEnd !== undefined);

        for (const state of replacementStates) {
            const range = this.findStateBlockRangeById(text, state.id);
            if (!range) {
                if (!text.trim()) {
                    text = this.serializeState(state, eol) + eol;
                    continue;
                }
                throw new Error(`Failed to locate existing state block by id ${state.id} in ${relativePath}`);
            }

            const original = text.substring(range.start, range.end);
            const serialized = state.preserveOnlyProvinceMembership
                ? patchStateMembershipPreservingContent(
                    original,
                    state.provinces,
                    state.victoryPoints,
                    eol
                )
                : state.preserveUnknownContent
                    ? patchStatePreservingUnknownContent(original, state, eol)
                    : this.serializeState(state, eol);
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
        if (state.controller) {
            lines.push(`\t\tcontroller = ${state.controller}`);
        }
        lines.push(...coreLines);
        lines.push(...vpEntries);
        lines.push('\t}');
        lines.push('}');

        return lines.join(eol);
    }

    private async persistStrategicRegions(
        strategicRegions: PersistedStrategicRegion[],
        deletedFiles: string[],
        deletedRegions: Array<{ id: number; file: string }> = []
    ) {
        const uniqueDeletedFiles = Array.from(new Set(deletedFiles));

        const groupedByFile = new Map<string, PersistedStrategicRegion[]>();
        for (const sr of strategicRegions) {
            const existing = groupedByFile.get(sr.file);
            if (existing) {
                existing.push(sr);
            } else {
                groupedByFile.set(sr.file, [sr]);
            }
        }
        const deletedRegionIdsByFile = new Map<string, number[]>();
        for (const deleted of deletedRegions) {
            const ids = deletedRegionIdsByFile.get(deleted.file) ?? [];
            ids.push(deleted.id);
            deletedRegionIdsByFile.set(deleted.file, ids);
            if (!groupedByFile.has(deleted.file)) {
                groupedByFile.set(deleted.file, []);
            }
        }

        const pending: Array<{ target: vscode.Uri; previous?: Buffer; next: Buffer }> = [];
        for (const [relativePath, fileSRs] of groupedByFile) {
            const targetFile = await this.resolveTargetFile(relativePath);
            let sourceText = '';
            try {
                const targetSnapshot = await this.readOperationalSnapshot(targetFile);
                if (targetSnapshot !== undefined) {
                    sourceText = targetSnapshot.toString('utf-8').replace(/^\uFEFF/, '');
                } else {
                    sourceText = (await readFileFromModOrHOI4(relativePath))[0].toString('utf-8').replace(/^\uFEFF/, '');
                }
            } catch {
                // If file does not exist yet, we'll create it from sr data.
            }

            const eol = sourceText.includes('\r\n') ? '\r\n' : '\n';
            const newContent = this.applyStrategicRegionUpdates(
                sourceText,
                fileSRs,
                eol,
                relativePath,
                deletedRegionIdsByFile.get(relativePath) ?? []
            );
            pending.push({
                target: targetFile,
                previous: await this.readOperationalSnapshot(targetFile),
                next: Buffer.from(newContent, 'utf-8'),
            });
        }

        for (const relativePath of uniqueDeletedFiles) {
            const targetFile = await this.resolveTargetFile(relativePath);
            // Empty overrides suppress inherited strategic-region records.
            pending.push({
                target: targetFile,
                previous: await this.readOperationalSnapshot(targetFile),
                next: Buffer.from('', 'utf-8'),
            });
        }

        const completed: typeof pending = [];
        try {
            for (const write of pending) {
                await mkdirs(dirUri(write.target));
                await this.writeOperationalFile(write.target, write.next);
                debug(`Wrote strategic-region changes to ${write.target.fsPath}`);
                completed.push(write);
            }
            invalidateModDescriptorCaches();
            this.cachedWorldMap = undefined;
            this.worldMapDependencies = undefined;
        } catch (e) {
            const rollbackErrors: unknown[] = [];
            for (const write of completed.reverse()) {
                try {
                    if (write.previous !== undefined) {
                        await this.writeOperationalFile(write.target, write.previous);
                    } else {
                        await vscode.workspace.fs.delete(write.target, { recursive: false, useTrash: false });
                    }
                } catch (rollbackError) {
                    rollbackErrors.push(rollbackError);
                }
            }
            if (rollbackErrors.length > 0) {
                const original = e instanceof Error ? e.message : String(e);
                const rollback = rollbackErrors
                    .map(value => value instanceof Error ? value.message : String(value))
                    .join('; ');
                throw new Error(`Strategic-region persistence failed: ${original}. Rollback failed: ${rollback}`);
            }
            throw e;
        }
    }

    private applyStrategicRegionUpdates(
        sourceText: string,
        srs: PersistedStrategicRegion[],
        eol: string,
        relativePath: string,
        deletedRegionIds: number[] = []
    ): string {
        let text = sourceText;
        const deletedRanges = deletedRegionIds
            .map(id => this.findStrategicRegionBlockRangeById(text, id))
            .filter((range): range is { start: number; end: number } => !!range)
            .sort((a, b) => b.start - a.start);
        for (const range of deletedRanges) {
            text = text.slice(0, range.start) + text.slice(range.end);
        }
        const replacementSRs = srs.filter(s => s.tokenStart !== undefined && s.tokenEnd !== undefined);

        for (const sr of replacementSRs) {
            const range = this.findStrategicRegionBlockRangeById(text, sr.id);
            if (!range) {
                throw new Error(`Failed to locate existing strategic region block by id ${sr.id} in ${relativePath}`);
            }

            const original = text.substring(range.start, range.end);
            const serialized = sr.preserveUnknownContent
                ? this.patchStrategicRegionPreservingUnknownContent(original, sr, eol)
                : this.serializeStrategicRegion(sr, eol);
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

    private patchStrategicRegionPreservingUnknownContent(
        original: string,
        sr: PersistedStrategicRegion,
        eol: string
    ): string {
        let text = original;
        const escapedName = sr.name.replace(/"/g, '\\"');
        text = /\bname\s*=\s*"[^"]*"/.test(text)
            ? text.replace(/\bname\s*=\s*"[^"]*"/, `name = "${escapedName}"`)
            : text.replace(/\{/, `{${eol}\tname = "${escapedName}"`);
        const provinces = [...sr.provinces].sort((a, b) => a - b).join(' ');
        text = /\bprovinces\s*=\s*\{[^}]*\}/.test(text)
            ? text.replace(/\bprovinces\s*=\s*\{[^}]*\}/, `provinces = { ${provinces} }`)
            : text.replace(/\{/, `{${eol}\tprovinces = { ${provinces} }`);
        if (sr.navalTerrain) {
            text = /\bnaval_terrain\s*=\s*[^\s#}]+/.test(text)
                ? text.replace(/\bnaval_terrain\s*=\s*[^\s#}]+/, `naval_terrain = ${sr.navalTerrain}`)
                : text.replace(/\}(\s*)$/, `\tnaval_terrain = ${sr.navalTerrain}${eol}}$1`);
        } else {
            text = text.replace(/^[ \t]*naval_terrain\s*=\s*[^\r\n#}]+(?:\r?\n)?/m, '');
        }
        return text;
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
        await this.writeOperationalFile(
            targetFile,
            Buffer.from(output.join(eol), 'utf-8')
        );
    }

    /**
     * Atomically persist the province BMP and definition.csv after a paintbrush edit.
     * Applies pixel diffs to the existing BMP and saves the old BMP for undo.
     */
    private async persistProvinceBmp(msg: Omit<PersistProvinceBmpMessage, 'command' | 'requestId'> & {
        command?: PersistProvinceBmpMessage['command'];
        requestId?: string;
        relatedPaths?: string[];
        afterPersist?: () => Promise<void>;
    }) {
        validateProvinceBmpEdit(
            msg.provinces,
            msg.paintedPixels,
            msg.targetProvinceId,
            msg.deletedProvinceIds,
            msg.targetProvinceIds
        );

        const existingProvinces = await this.readCurrentProvinceDefs();
        const existingProvinceIds = new Set(existingProvinces.map(province => province.id));
        validateNewProvinceMembership(
            existingProvinceIds,
            msg.provinces,
            msg.states,
            msg.strategicRegions
        );

        const defaultMap = await this.readDefaultMapConfig();
        const bmpRelativePath = 'map/' + (defaultMap?.provinces ?? 'provinces.bmp');

        // Read current BMP to save for undo
        const oldBmpBuffer = await this.readBmpFile(bmpRelativePath);
        if (!oldBmpBuffer) {
            throw new Error(`Unable to read ${bmpRelativePath}; no consolidation changes were written.`);
        }

        // Apply pixel diffs
        const newBmpBuffer = this.applyPixelDiffsToBmp(
            oldBmpBuffer,
            msg.paintedPixels,
            msg.width,
            msg.height
        );
        const finalProvinceById = new Map(existingProvinces.map(province => [province.id, province]));
        for (const province of msg.provinces) {
            finalProvinceById.set(province.id, province);
        }
        for (const deletedId of msg.deletedProvinceIds ?? []) {
            finalProvinceById.delete(deletedId);
        }
        const finalProvinces = Array.from(finalProvinceById.values());
        const finalRasterColors = extractProvinceBmpColors(newBmpBuffer, msg.width, msg.height);
        validateProvinceBmpEdit(
            finalProvinces,
            msg.paintedPixels,
            msg.targetProvinceId,
            msg.deletedProvinceIds,
            msg.targetProvinceIds,
            finalRasterColors
        );
        const bmpTarget = await this.resolveTargetFile(bmpRelativePath);
        const definitionsTarget = await this.resolveTargetFile('map/definition.csv');
        const transactionSnapshot: OperationalSnapshot = new Map();
        await this.captureOperationalTarget(transactionSnapshot, bmpTarget, true);
        await this.captureOperationalTarget(transactionSnapshot, definitionsTarget);
        const snapshotTarget = async (target: vscode.Uri): Promise<void> => {
            await this.captureOperationalTarget(transactionSnapshot, target);
        };
        const relatedPaths = new Set<string>([
            ...(msg.states ?? []).map(state => state.file),
            ...(msg.deletedStateFiles ?? []),
            ...(msg.deletedStates ?? []).map(state => state.file),
            ...(msg.strategicRegions ?? []).map(region => region.file),
            ...(msg.deletedStrategicRegionFiles ?? []),
            ...(msg.deletedStrategicRegions ?? []).map(region => region.file),
            ...(msg.relatedPaths ?? []),
        ]);
        if (msg.provinceReplacements && Object.keys(msg.provinceReplacements).length > 0) {
            relatedPaths.add(`map/${defaultMap?.adjacencies ?? 'adjacencies.csv'}`);
            relatedPaths.add('map/railways.txt');
            relatedPaths.add('map/supply_nodes.txt');
        }
        for (const relativePath of relatedPaths) {
            await snapshotTarget(await this.resolveTargetFile(relativePath));
        }
        if ((msg.deletedStateFiles?.length ?? 0) > 0) {
            const effectiveStateFiles = await listFilesFromModOrHOI4(
                'history/states',
                { recursively: true }
            );
            for (const file of effectiveStateFiles) {
                await snapshotTarget(await this.resolveTargetFile(
                    `history/states/${file}`.replace(/\\/g, '/')
                ));
            }
            const descriptor = await getSelectedModFileUri();
            if (descriptor) {
                await snapshotTarget(descriptor);
            }
        }
        if (msg.stateReplacements && Object.keys(msg.stateReplacements).length > 0) {
            for (const folder of ['map/supplyareas', 'history/countries']) {
                const files = await listFilesFromModOrHOI4(folder, { recursively: true });
                for (const file of files) {
                    await snapshotTarget(await this.resolveTargetFile(
                        `${folder}/${file}`.replace(/\\/g, '/')
                    ));
                }
            }
        }

        try {
            await this.writeBmpAtomic(bmpRelativePath, newBmpBuffer);
            await this.persistProvinces(msg.provinces, (msg.deletedProvinceIds ?? []).map(String));

            if (msg.provinceReplacements && Object.keys(msg.provinceReplacements).length > 0) {
                const repair = await this.repairProvinceReferenceFiles(msg.provinceReplacements);
                if (repair.warnings.length > 0) {
                    vscode.window.showWarningMessage(
                        `Province references repaired with ${repair.warnings.length} warning(s): ${repair.warnings.join(' ')}`
                    );
                }
            }
            if ((msg.states?.length ?? 0) > 0 ||
                (msg.deletedStateFiles?.length ?? 0) > 0 ||
                (msg.deletedStates?.length ?? 0) > 0) {
                await this.persistStates(
                    msg.states ?? [],
                    msg.deletedStateFiles ?? [],
                    msg.deletedStates ?? [],
                    msg.stateReplacements ?? {}
                );
            }
            if ((msg.strategicRegions?.length ?? 0) > 0 ||
                (msg.deletedStrategicRegionFiles?.length ?? 0) > 0 ||
                (msg.deletedStrategicRegions?.length ?? 0) > 0) {
                await this.persistStrategicRegions(
                    msg.strategicRegions ?? [],
                    msg.deletedStrategicRegionFiles ?? [],
                    msg.deletedStrategicRegions ?? []
                );
            }
            await msg.afterPersist?.();
        } catch (e) {
            try {
                await this.restoreOperationalSnapshot(transactionSnapshot);
                if ((msg.deletedStateFiles?.length ?? 0) > 0) {
                    invalidateModDescriptorCaches();
                }
            } catch (rollbackError) {
                const original = e instanceof Error ? e.message : String(e);
                const rollback = rollbackError instanceof Error ? rollbackError.message : String(rollbackError);
                throw new Error(`Province BMP transaction failed: ${original}. Rollback failed: ${rollback}`);
            }
            throw e;
        }

        // Record undo only after the complete transaction succeeds.
        if (msg.previousProvinces) {
            this.bmpUndoStack.push({
                files: Array.from(transactionSnapshot.values()),
            });
            const maxSteps = this.getMaxUndoSteps();
            while (this.bmpUndoStack.length > maxSteps) {
                this.bmpUndoStack.shift();
            }
            this.bmpRedoStack.length = 0;
        }
    }

    private async repairProvinceReferenceFiles(
        replacements: Record<number, number>,
        validProvinceIds?: ReadonlySet<number>
    ): Promise<{ warnings: string[] }> {
        const defaultMap = await this.readDefaultMapConfig();
        const targets = [
            {
                path: `map/${defaultMap?.adjacencies ?? 'adjacencies.csv'}`,
                transform: repairAdjacencies,
            },
            { path: 'map/railways.txt', transform: repairRailways },
            { path: 'map/supply_nodes.txt', transform: repairSupplyNodes },
        ];
        const pending: { target: vscode.Uri; previous?: Buffer; next: Buffer }[] = [];
        const warnings: string[] = [];

        for (const item of targets) {
            const sourcePath = await getFilePathFromModOrHOI4(item.path);
            if (!sourcePath) {
                // These files are optional in small and total-conversion maps.
                continue;
            }
            const source = (await readFileFromPath(sourcePath, item.path))[0];
            const text = source.toString('utf-8').replace(/^\uFEFF/, '');
            const result = item.transform(text, replacements, validProvinceIds);
            warnings.push(...result.warnings.map(value => `${item.path}: ${value}`));
            if (result.text !== text) {
                const target = await this.resolveTargetFile(item.path);
                const previous = await this.readOperationalSnapshot(target);
                pending.push({ target, previous, next: Buffer.from(result.text, 'utf-8') });
            }
        }

        const completed: typeof pending = [];
        try {
            for (const write of pending) {
                await mkdirs(dirUri(write.target));
                await this.writeOperationalFile(write.target, write.next);
                completed.push(write);
            }
        } catch (e) {
            const rollbackErrors: unknown[] = [];
            for (const write of completed.reverse()) {
                try {
                    if (write.previous !== undefined) {
                        await this.writeOperationalFile(write.target, write.previous);
                    } else {
                        await vscode.workspace.fs.delete(write.target, { recursive: false, useTrash: false });
                    }
                } catch (rollbackError) {
                    rollbackErrors.push(rollbackError);
                }
            }
            if (rollbackErrors.length > 0) {
                const original = e instanceof Error ? e.message : String(e);
                const rollback = rollbackErrors
                    .map(value => value instanceof Error ? value.message : String(value))
                    .join('; ');
                throw new Error(`Province-reference repair failed: ${original}. Rollback failed: ${rollback}`);
            }
            throw e;
        }

        return { warnings };
    }

    private async resolveProvinceWarnings(requestId: string): Promise<void> {
        try {
            const worldMap = await this.worldMapLoader.getWorldMap();
            const validProvinceIds = new Set<number>();
            for (let id = 1; id < worldMap.provinces.length; id++) {
                if (worldMap.provinces[id]) {
                    validProvinceIds.add(id);
                }
            }
            const result = await this.repairProvinceReferenceFiles({}, validProvinceIds);
            this.cachedWorldMap = undefined;
            this.worldMapDependencies = undefined;
            await this.postMessageToWebview({
                command: 'resolveprovincewarningsresult',
                requestId,
                success: true,
                warnings: result.warnings,
            });
        } catch (e) {
            await this.postMessageToWebview({
                command: 'resolveprovincewarningsresult',
                requestId,
                success: false,
                error: e instanceof Error ? e.message : String(e),
            });
        }
    }

    private async runAreaOperation(msg: RunAreaOperationMessage): Promise<void> {
        try {
            const worldMap = await this.worldMapLoader.getWorldMap();
            const riverIds = new Set(
                (msg.riverIds ?? []).filter(id =>
                    Number.isInteger(id) && id >= 0 && id < worldMap.rivers.length
                )
            );
            if (msg.operation === 'convert-to-ocean' && riverIds.size > 0) {
                const result = await this.convertClippedRiversToOcean(worldMap, riverIds);
                this.cachedWorldMap = undefined;
                this.worldMapDependencies = undefined;
                await this.postMessageToWebview({
                    command: 'areaoperationresult',
                    requestId: msg.requestId,
                    success: true,
                    operation: msg.operation,
                    affectedProvinces: result.provinces,
                    affectedStates: 0,
                    changedRecords: result.records,
                });
                return;
            }
            const provinceIds = new Set(msg.provinceIds.filter(id => Number.isInteger(id) && !!worldMap.provinces[id]));
            for (const stateId of msg.stateIds) {
                worldMap.states[stateId]?.provinces.forEach(id => provinceIds.add(id));
            }
            if (msg.perContinent) {
                const continents = new Set(Array.from(provinceIds, id => worldMap.provinces[id]?.continent).filter((id): id is number => id !== undefined));
                worldMap.provinces.forEach(province => {
                    if (province && continents.has(province.continent)) {provinceIds.add(province.id);}
                });
            }
            if (provinceIds.size === 0) {throw new Error('Select one or more provinces or states first.');}

            const stateIds = new Set<number>();
            worldMap.states.forEach(state => {
                if (state?.provinces.some(id => provinceIds.has(id))) {stateIds.add(state.id);}
            });

            const transforms = new Map<string, (text: string) => { text: string; changed: number }>();
            const addTransform = (path: string, transform: (text: string) => { text: string; changed: number }) => {
                const previous = transforms.get(path);
                transforms.set(path, previous
                    ? text => {
                        const first = previous(text);
                        const second = transform(first.text);
                        return { text: second.text, changed: first.changed + second.changed };
                    }
                    : transform);
            };

            if (msg.operation === 'clear-railways' || msg.operation === 'convert-to-ocean') {
                addTransform('map/railways.txt', text => clearRailways(text, provinceIds));
            }
            if (msg.operation === 'clear-supply-hubs' || msg.operation === 'convert-to-ocean') {
                addTransform('map/supply_nodes.txt', text => clearSupplyHubs(text, provinceIds));
            }
            if (msg.operation === 'clear-buildings' || msg.operation === 'convert-to-ocean') {
                addTransform(
                    'map/buildings.txt',
                    text => clearMapBuildings(text, msg.entireMap ? undefined : provinceIds)
                );
            }
            if (msg.operation === 'clear-water-crossings') {
                const defaultMap = await this.readDefaultMapConfig();
                addTransform(`map/${defaultMap?.adjacencies ?? 'adjacencies.csv'}`, text => clearWaterCrossings(text, provinceIds));
            }
            if (msg.operation === 'convert-to-ocean') {
                addTransform('map/definition.csv', text => convertDefinitionsToOcean(text, provinceIds));
                const defaultMap = await this.readDefaultMapConfig();
                addTransform(`map/${defaultMap?.adjacencies ?? 'adjacencies.csv'}`, text => {
                    const result = repairAdjacencies(text, {}, new Set(
                        worldMap.provinces.filter(p => p && !provinceIds.has(p.id)).map(p => p!.id)
                    ));
                    return { text: result.text, changed: result.replacements + result.removals };
                });
                for (const state of worldMap.states) {
                    if (state && stateIds.has(state.id)) {
                        addTransform(state.file, text => removeProvincesFromRegionBlocks(text, provinceIds, true, 'state'));
                    }
                }
                for (const region of worldMap.strategicRegions) {
                    if (region?.provinces.some(id => provinceIds.has(id))) {
                        addTransform(region.file, text => removeProvincesFromRegionBlocks(text, provinceIds, true, 'strategic_region'));
                    }
                }
            } else if (msg.operation === 'clear-buildings' || msg.operation === 'clear-resources' ||
                msg.operation === 'one-population-per-state' || msg.operation === 'lowest-development') {
                const stateOperation = msg.operation;
                const lowestCategory = (worldMap.stateCategories ?? [])
                    .filter(category => msg.includeWasteland || category.name.toLowerCase() !== 'wasteland')
                    .sort((a, b) => a.localBuildingSlots - b.localBuildingSlots || a.name.localeCompare(b.name))[0]?.name;
                if (stateOperation === 'lowest-development' && !lowestCategory) {
                    throw new Error('No eligible state development category is available.');
                }
                for (const state of worldMap.states) {
                    if (!state || !stateIds.has(state.id)) {continue;}
                    addTransform(state.file, text => transformSelectedStates(
                        text,
                        stateIds,
                        stateOperation,
                        lowestCategory ?? 'pastoral'
                    ));
                }
            }

            const transactionSnapshot: OperationalSnapshot = new Map();
            const pending: { target: vscode.Uri; previous?: Buffer; next: Buffer }[] = [];
            let changedRecords = 0;
            for (const [path, transform] of transforms) {
                const optional = path.startsWith('map/') && path !== 'map/definition.csv' &&
                    !(msg.operation === 'clear-buildings' && path === 'map/buildings.txt');
                const sourcePath = await getFilePathFromModOrHOI4(path);
                if (!sourcePath) {
                    if (optional) {
                        // Railways, supply nodes, generated buildings, and
                        // adjacencies are validly absent in some total conversions.
                        continue;
                    }
                    throw new Error(`Unable to find required area-operation input ${path}.`);
                }
                const source = (await readFileFromPath(sourcePath, path))[0];
                const sourceText = source.toString('utf-8').replace(/^\uFEFF/, '');
                let result: { text: string; changed: number };
                try {
                    result = transform(sourceText);
                } catch (e) {
                    const detail = e instanceof Error ? e.message : String(e);
                    throw new Error(`Unable to transform ${path}: ${detail}`);
                }
                changedRecords += result.changed;
                if (result.text === sourceText) {continue;}
                const target = await this.resolveTargetFile(path);
                await this.captureOperationalTarget(transactionSnapshot, target);
                const previous = transactionSnapshot.get(target.toString())?.previous;
                pending.push({ target, previous, next: Buffer.from(result.text, 'utf-8') });
            }
            if (pending.length === 0) {throw new Error('The selected operation found no matching records to change.');}

            try {
                for (const write of pending) {
                    await mkdirs(dirUri(write.target));
                    await this.writeOperationalFile(write.target, write.next);
                }
            } catch (e) {
                try {
                    await this.restoreOperationalSnapshot(transactionSnapshot);
                } catch (rollbackError) {
                    const original = e instanceof Error ? e.message : String(e);
                    const rollback = rollbackError instanceof Error ? rollbackError.message : String(rollbackError);
                    throw new Error(`Area operation failed: ${original}. Rollback failed: ${rollback}`);
                }
                throw e;
            }

            if (msg.reindexAfter) {
                changedRecords += await this.reindexMapSequentially(transactionSnapshot);
            }
            this.cachedWorldMap = undefined;
            this.worldMapDependencies = undefined;
            await this.postMessageToWebview({
                command: 'areaoperationresult',
                requestId: msg.requestId,
                success: true,
                operation: msg.operation,
                affectedProvinces: provinceIds.size,
                affectedStates: stateIds.size,
                changedRecords,
            });
        } catch (e) {
            await this.postMessageToWebview({
                command: 'areaoperationresult',
                requestId: msg.requestId,
                success: false,
                operation: msg.operation,
                error: e instanceof Error ? e.message : String(e),
            });
        }
    }

    private async writeOperationalFile(target: vscode.Uri, content: Buffer): Promise<void> {
        const openDocument = getDocumentByUri(target);
        const expectedText = content.toString('utf-8').replace(/^\uFEFF/, '');
        if (openDocument) {
            const edit = new vscode.WorkspaceEdit();
            edit.replace(
                target,
                new vscode.Range(
                    openDocument.positionAt(0),
                    openDocument.positionAt(openDocument.getText().length)
                ),
                expectedText
            );
            if (!await vscode.workspace.applyEdit(edit)) {
                throw new Error(`VS Code rejected changes to the open file ${target.fsPath}.`);
            }
            if (!await openDocument.save()) {
                throw new Error(`VS Code could not save changes to ${target.fsPath}.`);
            }
        } else {
            await writeFile(target, content);
        }

        const persisted = Buffer.from(await vscode.workspace.fs.readFile(target));
        if (persisted.toString('utf-8').replace(/^\uFEFF/, '') !== expectedText) {
            throw new Error(`Verification failed after writing ${target.fsPath}.`);
        }
    }

    private isFileNotFoundError(value: unknown): boolean {
        return value instanceof vscode.FileSystemError && value.code === 'FileNotFound';
    }

    private async readOperationalSnapshot(target: vscode.Uri): Promise<Buffer | undefined> {
        const openDocument = getDocumentByUri(target);
        if (openDocument) {
            return Buffer.from(openDocument.getText(), 'utf-8');
        }
        try {
            return Buffer.from(await vscode.workspace.fs.readFile(target));
        } catch (e) {
            if (this.isFileNotFoundError(e)) {
                return undefined;
            }
            throw e;
        }
    }

    private async captureOperationalTarget(
        snapshot: OperationalSnapshot,
        target: vscode.Uri,
        binary = false
    ): Promise<void> {
        const key = target.toString();
        if (snapshot.has(key)) {
            return;
        }

        let previous: Buffer | undefined;
        if (binary) {
            try {
                previous = Buffer.from(await vscode.workspace.fs.readFile(target));
            } catch (e) {
                if (!this.isFileNotFoundError(e)) {
                    throw e;
                }
            }
        } else {
            previous = await this.readOperationalSnapshot(target);
        }
        snapshot.set(key, { target, previous, binary });
    }

    private async applyOperationalSnapshotEntry(entry: OperationalSnapshotEntry): Promise<void> {
        if (entry.previous !== undefined) {
            await mkdirs(dirUri(entry.target));
            if (entry.binary) {
                await this.writeBinaryFileAtomic(entry.target, entry.previous);
            } else {
                await this.writeOperationalFile(entry.target, entry.previous);
            }
            return;
        }

        try {
            await vscode.workspace.fs.delete(entry.target, { recursive: false, useTrash: false });
        } catch (e) {
            if (!this.isFileNotFoundError(e)) {
                throw e;
            }
        }
    }

    /**
     * Restore a multi-file snapshot as one recoverable operation. If any restore
     * fails, every successful restore step is put back to its pre-restore value.
     */
    private async restoreOperationalSnapshot(snapshot: OperationalSnapshot): Promise<void> {
        await applyEntriesWithRollback(
            Array.from(snapshot.values()),
            async entry => {
                const current: OperationalSnapshot = new Map();
                await this.captureOperationalTarget(current, entry.target, entry.binary);
                return current.get(entry.target.toString())!;
            },
            entry => this.applyOperationalSnapshotEntry(entry)
        );
    }

    private snapshotFromEntries(entries: readonly OperationalSnapshotEntry[]): OperationalSnapshot {
        return new Map(entries.map(entry => [entry.target.toString(), entry]));
    }

    private async convertClippedRiversToOcean(
        worldMap: WorldMapData,
        riverIds: ReadonlySet<number>
    ): Promise<{ provinces: number; records: number }> {
        const strategicRegionByProvinceId: Record<number, number | undefined> = {};
        for (const region of worldMap.strategicRegions) {
            if (!region) {
                continue;
            }
            for (const provinceId of region.provinces) {
                strategicRegionByProvinceId[provinceId] = region.id;
            }
        }
        const edit = buildClippedRiverOceanEdit(
            worldMap.width,
            worldMap.height,
            worldMap.colorByPosition,
            worldMap.provinces,
            worldMap.rivers,
            riverIds,
            strategicRegionByProvinceId
        );
        if (edit.provinces.length === 0 || edit.paintedPixels.length === 0) {
            throw new Error('The selected river components contain no land pixels to convert.');
        }

        const additionsByRegion = new Map<number, number[]>();
        for (const province of edit.provinces) {
            if (province.strategicRegionId === undefined) {
                continue;
            }
            const additions = additionsByRegion.get(province.strategicRegionId) ?? [];
            additions.push(province.id);
            additionsByRegion.set(province.strategicRegionId, additions);
        }
        const updatedRegions: PersistedStrategicRegion[] = [];
        for (const [regionId, additions] of additionsByRegion) {
            const region = worldMap.strategicRegions.find(candidate => candidate?.id === regionId);
            if (!region) {
                continue;
            }
            updatedRegions.push({
                id: region.id,
                name: region.name,
                provinces: Array.from(new Set([...region.provinces, ...additions])).sort((a, b) => a - b),
                navalTerrain: region.navalTerrain,
                file: region.file,
                tokenStart: region.token?.start,
                tokenEnd: region.token?.end,
            });
        }

        await this.persistProvinceBmp({
            paintedPixels: edit.paintedPixels,
            width: worldMap.width,
            height: worldMap.height,
            provinces: edit.provinces,
            targetProvinceId: edit.provinces[0].id,
            targetProvinceIds: edit.provinces.map(province => province.id),
            strategicRegions: updatedRegions,
        });

        return {
            provinces: edit.provinces.length,
            records: edit.provinces.length + updatedRegions.length,
        };
    }

    private async runReindexMap(requestId: string): Promise<void> {
        try {
            const changedRecords = await this.reindexMapSequentially();
            await this.postMessageToWebview({
                command: 'reindexmapresult',
                requestId,
                success: true,
                changedRecords,
            });
        } catch (e) {
            await this.postMessageToWebview({
                command: 'reindexmapresult',
                requestId,
                success: false,
                error: e instanceof Error ? e.message : String(e),
            });
        }
    }

    private async reindexMapSequentially(
        transactionSnapshot: OperationalSnapshot = new Map()
    ): Promise<number> {
        try {
        const worldMap = await this.worldMapLoader.getWorldMap(true);
        const provinceIds = worldMap.provinces
            .filter((province): province is NonNullable<typeof province> => !!province)
            .map(province => province.id);
        const stateIds = worldMap.states
            .filter((state): state is NonNullable<typeof state> => !!state)
            .map(state => state.id);
        const provinceMap = createSequentialIdMap(provinceIds);
        const stateMap = createSequentialIdMap(stateIds);
        const validProvinceIds = new Set(Object.values(provinceMap));
        const validSourceProvinceIds = new Set(Object.keys(provinceMap).map(Number));
        const pending = new Map<string, { target: vscode.Uri; previous?: Buffer; next: Buffer; changed: number }>();
        const provinceIdsChanged = Object.entries(provinceMap).some(([from, to]) => Number(from) !== to);
        const stateIdsChanged = Object.entries(stateMap).some(([from, to]) => Number(from) !== to);
        const replacementFolders: string[] = [];

        const queue = async (
            path: string,
            transform: (text: string) => { text: string; changed: number },
            optional = false,
            materialize = false
        ) => {
            if (pending.has(path)) {return;}
            const sourcePath = await getFilePathFromModOrHOI4(path);
            if (!sourcePath) {
                if (optional) {
                    return;
                }
                throw new Error(`Unable to find required reindex input ${path}.`);
            }
            const source = (await readFileFromPath(sourcePath, path))[0];
            const sourceText = source.toString('utf-8').replace(/^\uFEFF/, '');
            const result = transform(sourceText);
            if (result.text === sourceText && !materialize) {return;}
            const target = await this.resolveTargetFile(path);
            await this.captureOperationalTarget(transactionSnapshot, target);
            const previous = transactionSnapshot.get(target.toString())?.previous;
            pending.set(path, { target, previous, next: Buffer.from(result.text, 'utf-8'), changed: result.changed });
        };

        const materializeFolder = async (folder: string) => {
            const files = await listFilesFromModOrHOI4(folder, { recursively: true });
            if (files.length === 0) {
                return;
            }
            for (const file of files) {
                await queue(
                    `${folder}/${file}`.replace(/\\/g, '/'),
                    text => ({ text, changed: 0 }),
                    false,
                    true
                );
            }
            replacementFolders.push(folder);
        };

        await queue('map/definition.csv', text => reindexDefinitions(text, provinceMap));
        for (const file of new Set(worldMap.states.filter(Boolean).map(state => state!.file))) {
            await queue(file, text => reindexStateFile(text, provinceMap, stateMap));
        }
        for (const file of new Set(worldMap.strategicRegions.filter(Boolean).map(region => region!.file))) {
            await queue(file, text => reindexStrategicRegionFile(text, provinceMap));
        }
        for (const file of new Set(worldMap.supplyAreas.filter(Boolean).map(area => area!.file))) {
            await queue(file, text => reindexSupplyAreaFile(text, stateMap), true);
        }
        for (const file of new Set(Object.values(worldMap.countryHistoryFiles).filter(Boolean))) {
            await queue(file, text => reindexCountryHistoryFile(text, stateMap), true);
        }

        const defaultMap = await this.readDefaultMapConfig();
        await queue(`map/${defaultMap?.adjacencies ?? 'adjacencies.csv'}`, text => {
            const result = repairAdjacencies(text, provinceMap, validProvinceIds, validSourceProvinceIds);
            return { text: result.text, changed: result.replacements + result.removals };
        }, true);
        await queue('map/railways.txt', text => {
            const result = repairRailways(text, provinceMap, validProvinceIds, validSourceProvinceIds);
            return { text: result.text, changed: result.replacements + result.removals };
        }, true);
        await queue('map/supply_nodes.txt', text => {
            const result = repairSupplyNodes(text, provinceMap, validProvinceIds, validSourceProvinceIds);
            return { text: result.text, changed: result.replacements + result.removals };
        }, true);
        await queue('map/buildings.txt', text => reindexMapBuildings(text, provinceMap), true);
        await queue('map/unitstacks.txt', text => reindexUnitStacks(text, provinceMap), true);

        // A changed ID space invalidates inherited database folders. Copy the
        // complete effective contents before enabling replace_path so files
        // which did not need textual changes are not accidentally hidden.
        if (provinceIdsChanged || stateIdsChanged) {
            await materializeFolder('history/states');
        }
        if (provinceIdsChanged) {
            await materializeFolder('map/strategicregions');
        }
        if (stateIdsChanged) {
            await materializeFolder('map/supplyareas');
            await materializeFolder('history/countries');
        }

        if (replacementFolders.length > 0) {
            const descriptor = await getSelectedModFileUri();
            if (!descriptor) {
                throw new Error(
                    `Destructive map edits require a selected .mod descriptor so replace_path can be set for: ${replacementFolders.join(', ')}.`
                );
            }
            await this.captureOperationalTarget(transactionSnapshot, descriptor);
        }

        for (const write of pending.values()) {
            await mkdirs(dirUri(write.target));
            await this.writeOperationalFile(write.target, write.next);
        }
        await this.ensureDescriptorReplacePaths(replacementFolders);

        this.cachedWorldMap = undefined;
        this.worldMapDependencies = undefined;
        return Array.from(pending.values()).reduce((total, write) => total + write.changed, 0);
        } catch (e) {
            try {
                await this.restoreOperationalSnapshot(transactionSnapshot);
            } catch (rollbackError) {
                const original = e instanceof Error ? e.message : String(e);
                const rollback = rollbackError instanceof Error ? rollbackError.message : String(rollbackError);
                throw new Error(`Map reindex failed: ${original}. Rollback failed: ${rollback}`);
            }
            throw e;
        }
    }

    private async removeAllCores(requestId: string): Promise<void> {
        const transactionSnapshot: OperationalSnapshot = new Map();
        try {
            const worldMap = await this.worldMapLoader.getWorldMap(true);
            const stateFiles = Array.from(new Set(
                worldMap.states
                    .filter((state): state is NonNullable<typeof state> => !!state && !!state.file)
                    .map(state => state.file)
            ));
            let changedRecords = 0;
            for (const file of stateFiles) {
                const sourcePath = await getFilePathFromMod(file);
                const source = sourcePath
                    ? (await readFileFromPath(sourcePath))[0]
                    : (await readFileFromModOrHOI4(file))[0];
                const sourceText = source.toString('utf-8').replace(/^\uFEFF/, '');
                const result = removeAllCores(sourceText);
                if (result.changed === 0) {
                    continue;
                }
                const target = await this.resolveTargetFile(file);
                await this.captureOperationalTarget(transactionSnapshot, target);
                await mkdirs(dirUri(target));
                await this.writeOperationalFile(target, Buffer.from(result.text, 'utf-8'));
                changedRecords += result.changed;
            }
            changedRecords += await this.reindexMapSequentially(transactionSnapshot);
            this.cachedWorldMap = undefined;
            this.worldMapDependencies = undefined;
            await this.postMessageToWebview({
                command: 'removeallcoresresult',
                requestId,
                success: true,
                affectedStates: worldMap.states.filter(Boolean).length,
                changedRecords,
            });
        } catch (e) {
            let failure: unknown = e;
            try {
                await this.restoreOperationalSnapshot(transactionSnapshot);
            } catch (rollbackError) {
                const original = e instanceof Error ? e.message : String(e);
                const rollback = rollbackError instanceof Error ? rollbackError.message : String(rollbackError);
                failure = new Error(`Remove All Cores failed: ${original}. Rollback failed: ${rollback}`);
            }
            await this.postMessageToWebview({
                command: 'removeallcoresresult',
                requestId,
                success: false,
                error: failure instanceof Error ? failure.message : String(failure),
            });
        }
    }

    private async runContinentPipeline(msg: RunContinentPipelineMessage): Promise<void> {
        const targetCountryTag = msg.targetCountryTag.trim().toUpperCase();
        const continentId = msg.continentId;
        let continentName: string | undefined;
        try {
            if (!/^[A-Z0-9]{3}$/.test(targetCountryTag)) {
                throw new Error('Target country tag must contain exactly three letters or digits.');
            }
            const worldMap = await this.worldMapLoader.getWorldMap(true);
            if (!worldMap.countries.some(country => country.tag.toUpperCase() === targetCountryTag)) {
                throw new Error(`Country ${targetCountryTag} is not present on the loaded map.`);
            }
            continentName = worldMap.continents[continentId];
            if (!Number.isInteger(continentId) || continentId <= 0 || !continentName) {
                throw new Error(`Continent ID ${continentId} is not present on the loaded map. Loaded values: ${worldMap.continents.filter(Boolean).join(', ') || '(none)'}.`);
            }

            const continentProvinces = worldMap.provinces
                .filter((province): province is NonNullable<typeof province> => !!province && province.continent === continentId)
                .sort((a, b) => a.id - b.id);
            if (continentProvinces.length === 0) {
                throw new Error(`${continentName} contains no loaded provinces to consolidate.`);
            }
            const landProvinces = continentProvinces.filter(province => province.type === 'land');
            const mergePlan = planProvinceMergesByType(continentProvinces);
            const survivorIdSet = new Set(mergePlan.survivorIds);
            const survivors = continentProvinces.filter(province => survivorIdSet.has(province.id));
            const landSurvivor = survivors.find(province => province.type === 'land');
            const waterSurvivor = survivors.find(province => province.type === 'sea') ??
                survivors.find(province => province.type !== 'land');
            const primarySurvivor = landSurvivor ?? waterSurvivor;
            if (!primarySurvivor) {
                throw new Error(`${continentName} contains no usable land or water provinces.`);
            }
            const provinceIds = new Set(continentProvinces.map(province => province.id));
            const replacements = mergePlan.replacements;
            const deletedProvinceIds = Object.keys(replacements).map(Number);
            const replacementColorByColor = new Map<number, number>();
            for (const province of continentProvinces) {
                const survivorId = replacements[province.id] ?? province.id;
                const survivor = survivors.find(candidate => candidate.id === survivorId);
                if (survivor && survivor.color !== province.color) {
                    replacementColorByColor.set(province.color, survivor.color);
                }
            }
            const colorByPosition = ((worldMap as any).colorByPosition ?? []) as number[];
            if (replacementColorByColor.size > 0 &&
                colorByPosition.length !== worldMap.width * worldMap.height) {
                throw new Error('Province pixel data is unavailable for the consolidation pipeline.');
            }
            const paintedPixels: number[][] = [];
            for (let index = 0; index < colorByPosition.length; index++) {
                const replacementColor = replacementColorByColor.get(colorByPosition[index]);
                if (replacementColor === undefined) {continue;}
                paintedPixels.push([index % worldMap.width, Math.floor(index / worldMap.width), replacementColor]);
            }
            const touchedStates = worldMap.states
                .filter((state): state is NonNullable<typeof state> => !!state && state.provinces.some(id => provinceIds.has(id)))
                .sort((a, b) => a.id - b.id);
            const statePartitions = new Map(touchedStates.map(state => [
                state.id,
                partitionMappedMembership(state.provinces, provinceIds, replacements),
            ]));
            const fullyContainedStates = touchedStates.filter(
                state => statePartitions.get(state.id)?.outside.length === 0
            );
            const targetState = fullyContainedStates.find(state => state.provinces.includes(primarySurvivor.id)) ??
                fullyContainedStates[0] ??
                touchedStates.find(state => state.provinces.includes(primarySurvivor.id)) ??
                touchedStates[0];
            if (!targetState) {
                throw new Error(`No state contains a ${continentName} province.`);
            }
            const targetPartition = statePartitions.get(targetState.id)!;
            const stateSurvivorIds = new Set(
                touchedStates.flatMap(state => statePartitions.get(state.id)!.inside)
            );
            const combinedStateProvinces = new Set<number>([
                ...targetPartition.outside,
                ...stateSurvivorIds,
            ]);
            const combinedCores = new Set<string>([targetCountryTag]);
            const combinedVictoryPoints: Record<number, number | undefined> = {};
            const combinedResources: Record<string, number | undefined> = {};
            let manpower = 0;
            const aggregatedStates = touchedStates.filter(
                state => state.id === targetState.id ||
                    statePartitions.get(state.id)?.outside.length === 0
            );
            for (const state of aggregatedStates) {
                manpower += state.manpower;
                state.cores.forEach(core => {
                    if (core.condition === true && core.value) {
                        combinedCores.add(core.value);
                    }
                });
                for (const [resource, value] of Object.entries(state.resources)) {
                    if (value !== undefined) {
                        combinedResources[resource] = (combinedResources[resource] ?? 0) + value;
                    }
                }
            }
            for (const state of touchedStates) {
                for (const [provinceIdText, value] of Object.entries(state.victoryPoints)) {
                    if (value === undefined) {
                        continue;
                    }
                    const originalProvinceId = Number(provinceIdText);
                    if (!provinceIds.has(originalProvinceId) && state.id !== targetState.id) {
                        continue;
                    }
                    const provinceId = replacements[originalProvinceId] ?? originalProvinceId;
                    combinedVictoryPoints[provinceId] = (combinedVictoryPoints[provinceId] ?? 0) + value;
                }
            }
            const persistedStates: PersistedState[] = [{
                id: targetState.id,
                name: targetState.name,
                manpower,
                category: targetState.category,
                owner: targetCountryTag,
                controller: targetCountryTag,
                provinces: Array.from(combinedStateProvinces).sort((a, b) => a - b),
                cores: Array.from(combinedCores).sort(),
                impassable: targetState.impassable,
                victoryPoints: combinedVictoryPoints,
                resources: combinedResources,
                file: targetState.file,
                tokenStart: targetState.token?.start,
                tokenEnd: targetState.token?.end,
                preserveUnknownContent: true,
            }];
            for (const state of touchedStates) {
                if (state.id === targetState.id) {
                    continue;
                }
                const partition = statePartitions.get(state.id)!;
                if (partition.outside.length === 0) {
                    continue;
                }
                const outsideVictoryPoints = Object.fromEntries(
                    Object.entries(state.victoryPoints)
                        .map(([provinceId, value]) => [Number(provinceId), value] as const)
                        .filter(([provinceId]) => !provinceIds.has(provinceId))
                );
                persistedStates.push({
                    id: state.id,
                    name: state.name,
                    manpower: state.manpower,
                    category: state.category,
                    owner: state.owner.find(value => value.condition === true)?.value,
                    controller: state.controller.find(value => value.condition === true)?.value,
                    provinces: partition.outside,
                    cores: state.cores
                        .filter(value => value.condition === true && !!value.value)
                        .map(value => value.value),
                    impassable: state.impassable,
                    victoryPoints: outsideVictoryPoints,
                    resources: { ...state.resources },
                    file: state.file,
                    tokenStart: state.token?.start,
                    tokenEnd: state.token?.end,
                    preserveUnknownContent: true,
                    preserveOnlyProvinceMembership: true,
                });
            }
            const deletedStateRecords = touchedStates
                .filter(state => state.id !== targetState.id &&
                    statePartitions.get(state.id)?.outside.length === 0)
                .map(state => ({ id: state.id, file: state.file }));
            const deletedStateIds = new Set(deletedStateRecords.map(state => state.id));
            const deletedStateFiles = Array.from(new Set(deletedStateRecords
                .map(state => state.file)
                .filter(file => !worldMap.states.some(state =>
                    !!state && !deletedStateIds.has(state.id) && state.file === file
                ))));
            const sharedStateRecords = deletedStateRecords.filter(
                state => !deletedStateFiles.includes(state.file)
            );

            const touchedRegions = worldMap.strategicRegions
                .filter((region): region is NonNullable<typeof region> => !!region && region.provinces.some(id => provinceIds.has(id)))
                .sort((a, b) => a.id - b.id);
            const provinceTypes = Object.fromEntries(
                worldMap.provinces
                    .filter((province): province is NonNullable<typeof province> => !!province)
                    .map(province => [province.id, province.type])
            );
            const regionPartition = partitionLandAndWaterProvinces(
                continentProvinces.map(province => province.id),
                replacements,
                provinceTypes
            );
            const regionPartitions = new Map(touchedRegions.map(region => [
                region.id,
                partitionMappedMembership(region.provinces, provinceIds, replacements),
            ]));
            const fullyContainedRegions = touchedRegions.filter(
                region => regionPartitions.get(region.id)?.outside.length === 0
            );
            const usedRegionIds = new Set<number>();
            const chooseRegion = (survivorId: number | undefined) => {
                const region = fullyContainedRegions.find(candidate =>
                    !usedRegionIds.has(candidate.id) && survivorId !== undefined && candidate.provinces.includes(survivorId)
                ) ?? fullyContainedRegions.find(candidate => !usedRegionIds.has(candidate.id));
                if (region) {usedRegionIds.add(region.id);}
                return region;
            };
            let nextRegionId = Math.max(
                0,
                ...worldMap.strategicRegions.filter(Boolean).map(region => region!.id)
            ) + 1;
            const safeContinentName = continentName.replace(/[^A-Za-z0-9]+/g, '_');
            const persistedRegions: PersistedStrategicRegion[] = touchedRegions
                .filter(region => regionPartitions.get(region.id)!.outside.length > 0)
                .map(region => ({
                    id: region.id,
                    name: region.name,
                    provinces: regionPartitions.get(region.id)!.outside,
                    navalTerrain: region.navalTerrain,
                    file: region.file,
                    tokenStart: region.token?.start,
                    tokenEnd: region.token?.end,
                    preserveUnknownContent: true,
                }));
            const addConsolidatedRegion = (
                kind: 'Land' | 'Water',
                provinces: number[],
                survivorId: number | undefined
            ) => {
                if (provinces.length === 0) {
                    return;
                }
                const existing = chooseRegion(survivorId);
                const id = existing?.id ?? nextRegionId++;
                persistedRegions.push({
                    id,
                    name: `${continentName} ${kind}`,
                    provinces,
                    navalTerrain: kind === 'Water'
                        ? existing?.navalTerrain ??
                            touchedRegions.find(region => !!region.navalTerrain)?.navalTerrain ??
                            null
                        : null,
                    file: existing?.file ??
                        `map/strategicregions/${id}-${safeContinentName}_${kind.toUpperCase()}.txt`,
                    tokenStart: existing?.token?.start,
                    tokenEnd: existing?.token?.end,
                    preserveUnknownContent: !!existing,
                });
            };
            addConsolidatedRegion('Land', regionPartition.land, landSurvivor?.id);
            addConsolidatedRegion('Water', regionPartition.water, waterSurvivor?.id);
            const targetRegionIds = new Set(persistedRegions.map(region => region.id));
            const deletedRegionRecords = touchedRegions
                .filter(region => regionPartitions.get(region.id)!.outside.length === 0 &&
                    !targetRegionIds.has(region.id))
                .map(region => ({ id: region.id, file: region.file }));
            const deletedRegionIds = new Set(deletedRegionRecords.map(region => region.id));
            const deletedRegionFiles = Array.from(new Set(deletedRegionRecords
                .map(region => region.file)
                .filter(file => !worldMap.strategicRegions.some(region =>
                    !!region && !deletedRegionIds.has(region.id) && region.file === file
                ))));
            const sharedRegionRecords = deletedRegionRecords.filter(
                region => !deletedRegionFiles.includes(region.file)
            );

            const previousProvinces: PersistedProvince[] = worldMap.provinces
                .filter((province): province is NonNullable<typeof province> => !!province)
                .map(province => ({
                    id: province.id,
                    color: province.color,
                    type: province.type,
                    coastal: province.coastal,
                    terrain: province.terrain,
                    continent: province.continent,
                }));
            let changedRecords = 0;
            const defaultMap = await this.readDefaultMapConfig();
            const optionalTransforms: Array<[string, (text: string) => { text: string; changed: number }]> = [
                ['map/railways.txt', text => clearRailways(text, provinceIds)],
                ['map/supply_nodes.txt', text => clearSupplyHubs(text, provinceIds)],
                ['map/buildings.txt', text => clearMapBuildings(text, provinceIds)],
                [`map/${defaultMap?.adjacencies ?? 'adjacencies.csv'}`, text => clearWaterCrossings(text, provinceIds)],
            ];
            await this.persistProvinceBmp({
                paintedPixels,
                width: worldMap.width,
                height: worldMap.height,
                provinces: survivors.map(survivor => ({
                    id: survivor.id,
                    color: survivor.color,
                    type: survivor.type,
                    coastal: survivor.type === 'land' && landProvinces.some(province => province.coastal),
                    terrain: survivor.terrain,
                    continent: survivor.continent,
                })),
                previousProvinces,
                deletedProvinceIds,
                provinceReplacements: replacements,
                targetProvinceId: primarySurvivor.id,
                targetProvinceIds: survivors.map(survivor => survivor.id),
                states: persistedStates,
                deletedStateFiles,
                deletedStates: sharedStateRecords,
                stateReplacements: Object.fromEntries(
                    deletedStateRecords.map(state => [state.id, targetState.id])
                ),
                strategicRegions: persistedRegions,
                deletedStrategicRegionFiles: deletedRegionFiles,
                deletedStrategicRegions: sharedRegionRecords,
                relatedPaths: optionalTransforms.map(([path]) => path),
                afterPersist: async () => {
                    for (const [path, transform] of optionalTransforms) {
                        const sourcePath = await getFilePathFromModOrHOI4(path);
                        if (!sourcePath) {
                            // Optional in small and total-conversion maps.
                            continue;
                        }
                        const source = (await readFileFromPath(sourcePath, path))[0];
                        const sourceText = source.toString('utf-8').replace(/^\uFEFF/, '');
                        const result = transform(sourceText);
                        if (result.text === sourceText) {
                            continue;
                        }
                        const target = await this.resolveTargetFile(path);
                        await mkdirs(dirUri(target));
                        await this.writeOperationalFile(target, Buffer.from(result.text, 'utf-8'));
                        changedRecords += result.changed;
                    }
                },
            });
            this.cachedWorldMap = undefined;
            this.worldMapDependencies = undefined;
            await this.postMessageToWebview({
                command: 'continentpipelineresult',
                requestId: msg.requestId,
                success: true,
                continentId,
                continentName,
                targetCountryTag,
                mergedProvinces: deletedProvinceIds.length,
                mergedStates: deletedStateRecords.length,
                mergedStrategicRegions: deletedRegionRecords.length,
                changedRecords,
            });
        } catch (e) {
            await this.postMessageToWebview({
                command: 'continentpipelineresult',
                requestId: msg.requestId,
                success: false,
                continentId,
                continentName,
                targetCountryTag,
                error: e instanceof Error ? e.message : String(e),
            });
        }
    }

    /**
     * Send the current province BMP pixel data to the webview (for paintbrush initialization).
     */
    private async sendProvinceBmpData(requestId: string) {
        try {
            const worldMap = await this.worldMapLoader.getWorldMap();
            const provinceMap = worldMap as any;
            if (provinceMap.colorByPosition && provinceMap.width && provinceMap.height) {
                await this.postMessageToWebview({
                    command: 'provincebmpdata',
                    requestId,
                    success: true,
                    colorByPosition: provinceMap.colorByPosition,
                    width: worldMap.width,
                    height: worldMap.height,
                });
            }
        } catch (e) {
            error(e);
            await this.postMessageToWebview({
                command: 'provincebmpdata',
                requestId,
                success: false,
                error: e instanceof Error ? e.message : String(e),
                colorByPosition: new Uint32Array(),
                width: 0,
                height: 0,
            });
        }
    }

    /**
     * Undo the last province BMP edit by restoring the previous BMP and CSV.
     */
    private async undoProvinceBmp(requestId: string) {
        try {
            await this.undoProvinceBmpImpl(requestId);
        } catch (e) {
            error(e);
            await this.postMessageToWebview({
                command: 'provincebmpupdated',
                requestId,
                success: false,
                error: e instanceof Error ? e.message : String(e),
                canUndo: this.bmpUndoStack.length > 0,
                canRedo: this.bmpRedoStack.length > 0,
                forceReload: true,
            });
        }
    }

    private async undoProvinceBmpImpl(requestId: string) {
        const snapshot = this.bmpUndoStack[this.bmpUndoStack.length - 1];
        if (!snapshot) {
            await this.postMessageToWebview({
                command: 'provincebmpupdated',
                requestId,
                success: true,
                canUndo: false,
                canRedo: this.bmpRedoStack.length > 0,
                forceReload: false,
            });
            return;
        }

        const current: OperationalSnapshot = new Map();
        for (const entry of snapshot.files) {
            await this.captureOperationalTarget(current, entry.target, entry.binary);
        }
        await this.restoreOperationalSnapshot(this.snapshotFromEntries(snapshot.files));
        this.bmpUndoStack.pop();
        this.bmpRedoStack.push({ files: Array.from(current.values()) });
        const maxSteps = this.getMaxUndoSteps();
        while (this.bmpRedoStack.length > maxSteps) {
            this.bmpRedoStack.shift();
        }
        invalidateModDescriptorCaches();
        this.cachedWorldMap = undefined;
        this.worldMapDependencies = undefined;

        // Signal webview to reload
        await this.postMessageToWebview({
            command: 'provincebmpupdated',
            requestId,
            success: true,
            canUndo: this.bmpUndoStack.length > 0,
            canRedo: this.bmpRedoStack.length > 0,
            forceReload: true,
        });
    }

    /**
     * Redo the last undone province BMP edit.
     */
    private async redoProvinceBmp(requestId: string) {
        try {
            await this.redoProvinceBmpImpl(requestId);
        } catch (e) {
            error(e);
            await this.postMessageToWebview({
                command: 'provincebmpupdated',
                requestId,
                success: false,
                error: e instanceof Error ? e.message : String(e),
                canUndo: this.bmpUndoStack.length > 0,
                canRedo: this.bmpRedoStack.length > 0,
                forceReload: true,
            });
        }
    }

    private async redoProvinceBmpImpl(requestId: string) {
        const snapshot = this.bmpRedoStack[this.bmpRedoStack.length - 1];
        if (!snapshot) {
            await this.postMessageToWebview({
                command: 'provincebmpupdated',
                requestId,
                success: true,
                canUndo: this.bmpUndoStack.length > 0,
                canRedo: false,
                forceReload: false,
            });
            return;
        }

        const current: OperationalSnapshot = new Map();
        for (const entry of snapshot.files) {
            await this.captureOperationalTarget(current, entry.target, entry.binary);
        }
        await this.restoreOperationalSnapshot(this.snapshotFromEntries(snapshot.files));
        this.bmpRedoStack.pop();
        this.bmpUndoStack.push({ files: Array.from(current.values()) });
        const maxSteps = this.getMaxUndoSteps();
        while (this.bmpUndoStack.length > maxSteps) {
            this.bmpUndoStack.shift();
        }
        invalidateModDescriptorCaches();
        this.cachedWorldMap = undefined;
        this.worldMapDependencies = undefined;

        await this.postMessageToWebview({
            command: 'provincebmpupdated',
            requestId,
            success: true,
            canUndo: this.bmpUndoStack.length > 0,
            canRedo: this.bmpRedoStack.length > 0,
            forceReload: true,
        });
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
        } catch (e) {
            const detail = e instanceof Error ? e.message : String(e);
            throw new Error(`Unable to read current province definitions: ${detail}`);
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
        await this.writeBinaryFileAtomic(targetFile, buffer);
    }

    private async writeBinaryFileAtomic(targetFile: vscode.Uri, buffer: Buffer): Promise<void> {
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
    private applyPixelDiffsToBmp(
        bmpBuffer: Buffer,
        paintedPixels: number[][],
        expectedWidth?: number,
        expectedHeight?: number
    ): Buffer {
        const result = Buffer.from(bmpBuffer);

        if (result[0] !== 0x42 || result[1] !== 0x4D) {
            throw new Error('Refusing to edit an invalid provinces BMP (missing BM header).');
        }

        const dataOffset = result.readUInt32LE(10);
        const width = result.readInt32LE(18);
        const height = result.readInt32LE(22);
        const bitsPerPixel = result.readUInt16LE(28);
        const absoluteWidth = Math.abs(width);
        const absoluteHeight = Math.abs(height);
        const bytesPerPixel = bitsPerPixel / 8;
        const rowSize = ((absoluteWidth * bitsPerPixel + 7 >> 3) + 3) & 0xFFFFFFFC;

        if (bitsPerPixel !== 24 && bitsPerPixel !== 32) {
            throw new Error(`Unsupported provinces BMP bit depth ${bitsPerPixel}; expected 24-bit or 32-bit.`);
        }
        if ((expectedWidth !== undefined && expectedWidth !== absoluteWidth) ||
            (expectedHeight !== undefined && expectedHeight !== absoluteHeight)) {
            throw new Error(
                `Province edit dimensions ${expectedWidth}x${expectedHeight} do not match BMP dimensions ${absoluteWidth}x${absoluteHeight}.`
            );
        }

        for (const [x, y, newColor] of paintedPixels) {
            if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(newColor) ||
                x < 0 || x >= absoluteWidth || y < 0 || y >= absoluteHeight) {
                throw new Error(`Province pixel edit (${x}, ${y}) is outside the BMP.`);
            }

            const row = height > 0 ? absoluteHeight - 1 - y : y;
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
    private async readDefaultMapConfig(): Promise<{ provinces: string; adjacencies?: string } | undefined> {
        try {
            const [buffer] = await readFileFromModOrHOI4('map/default.map');
            const text = buffer.toString('utf-8');
            const provinces = text.match(/provinces\s*=\s*"([^"]+)"/);
            const adjacencies = text.match(/adjacencies\s*=\s*"([^"]+)"/);
            if (provinces) {
                return { provinces: provinces[1], adjacencies: adjacencies?.[1] };
            }
        } catch { /* ignore */ }
        return undefined;
    }
}
