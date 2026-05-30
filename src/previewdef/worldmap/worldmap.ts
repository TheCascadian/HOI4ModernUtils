import * as vscode from 'vscode';
import worldmapview from './worldmapview.html';
import worldmapviewstyles from './worldmapview.css';
import { localize, localizeText, i18nTableAsScript } from '../../util/i18n';
import { html } from '../../util/html';
import { error, debug } from '../../util/debug';
import { WorldMapMessage, ProgressReporter, WorldMapData, MapItemMessage, RequestMapItemMessage, PersistedState, PersistedStrategicRegion } from './definitions';
import { matchPathEnd } from '../../util/nodecommon';
import { writeFile, mkdirs, getDocumentByUri, dirUri } from '../../util/vsccommon';
import { slice, debounceByInput, forceError } from '../../util/common';
import { getFilePathFromMod, getHoiOpenedFileOriginalUri, readFileFromModOrHOI4, readFileFromPath } from '../../util/fileloader';
import { WorldMapLoader } from './loader/worldmaploader';
import { isEqual } from 'lodash';
import { LoaderSession } from '../../util/loader/loader';
import { TelemetryMessage, sendByMessage } from '../../util/telemetry';
import { getConfiguration } from '../../util/vsccommon';

export class WorldMap {
    public panel: vscode.WebviewPanel | undefined;

    private worldMapLoader: WorldMapLoader;
    private worldMapDependencies: string[] | undefined;
    private cachedWorldMap: WorldMapData | undefined;

    private lastRequestedExportUri: vscode.Uri | undefined;

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
        this.panel = undefined;
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
                { content: 'window.__worldMapKeybinds = ' + JSON.stringify(worldMapKeybinds) + ';' },
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
                case 'exportmap':
                    await this.exportMap(msg.dataUrl);
                    break;
                case 'persiststates':
                    await this.persistStates(msg.states, msg.deletedFiles ?? []);
                    break;
                case 'persiststrategicregions':
                    await this.persistStrategicRegions(msg.strategicRegions, msg.deletedFiles ?? []);
                    break;
                
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

    private async persistStrategicRegions(regions: PersistedStrategicRegion[], deletedFiles: string[]) {
        const uniqueDeletedFiles = Array.from(new Set(deletedFiles));
        for (const relativePath of uniqueDeletedFiles) {
            const targetFile = await this.resolveTargetFile(relativePath);
            try {
                await vscode.workspace.fs.delete(targetFile, { useTrash: false, recursive: false });
            } catch {
                // Ignore if file does not exist or cannot be deleted.
            }
        }

        if (regions.length === 0) {
            return;
        }

        const groupedByFile = new Map<string, PersistedStrategicRegion[]>();
        for (const region of regions) {
            const existing = groupedByFile.get(region.file);
            if (existing) existing.push(region);
            else groupedByFile.set(region.file, [region]);
        }

        for (const [relativePath, fileRegions] of groupedByFile) {
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
                // If file does not exist yet, we'll create it from region data.
            }

            const eol = sourceText.includes('\r\n') ? '\r\n' : '\n';
            const newContent = this.applyStrategicRegionUpdates(sourceText, fileRegions, eol, relativePath);

            await mkdirs(dirUri(targetFile));
            await writeFile(targetFile, Buffer.from(newContent, 'utf-8'));
        }
    }

    private async resolveTargetFile(relativePath: string): Promise<vscode.Uri> {
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

    private applyStrategicRegionUpdates(sourceText: string, regions: PersistedStrategicRegion[], eol: string, relativePath: string): string {
        let text = sourceText;
        const replacementRegions = regions.filter(r => r.tokenStart !== undefined && r.tokenEnd !== undefined);

        for (const region of replacementRegions) {
            const range = this.findStrategicRegionBlockRangeById(text, region.id);
            if (!range) {
                throw new Error(`Failed to locate existing strategic region block by id ${region.id} in ${relativePath}`);
            }

            const serialized = this.serializeStrategicRegion(region, eol);
            text = text.substring(0, range.start) + serialized + text.substring(range.end);
        }

        const tokenlessRegions = regions.filter(r => r.tokenStart === undefined || r.tokenEnd === undefined);
        if (tokenlessRegions.length > 0) {
            const chunks = tokenlessRegions.map(r => this.serializeStrategicRegion(r, eol));
            const body = chunks.join(eol + eol);

            if (replacementRegions.length > 0) {
                throw new Error(`Refusing to mix tokenless and tokened strategic region writes in one file: ${relativePath}`);
            }

            text = body + eol;
        }

        return text;
    }

    private findStrategicRegionBlockRangeById(text: string, regionId: number): { start: number; end: number } | undefined {
        let cursor = 0;
        while (cursor < text.length) {
            const idx = text.indexOf('strategic_region', cursor);
            if (idx === -1) {
                return undefined;
            }

            const before = idx > 0 ? text[idx - 1] : ' ';
            const after = idx + 16 < text.length ? text[idx + 16] : ' ';
            if ((/[A-Za-z0-9_]/.test(before)) || (/[A-Za-z0-9_]/.test(after))) {
                cursor = idx + 16;
                continue;
            }

            let index = idx + 16;
            while (index < text.length && /\s/.test(text[index])) index++;
            if (index >= text.length || text[index] !== '=') { cursor = idx + 16; continue; }
            index++;
            while (index < text.length && /\s/.test(text[index])) index++;
            if (index >= text.length || text[index] !== '{') { cursor = idx + 16; continue; }

            const blockStart = idx;
            let depth = 1;
            let blockEnd = index + 1;
            while (blockEnd < text.length && depth > 0) {
                if (text[blockEnd] === '{') depth++;
                else if (text[blockEnd] === '}') depth--;
                blockEnd++;
            }

            const blockText = text.substring(blockStart, blockEnd);
            const idRegex = new RegExp(`\\bid\\s*=\\s*${regionId}\\b`);
            if (idRegex.test(blockText)) {
                return { start: blockStart, end: blockEnd };
            }

            cursor = blockEnd;
        }

        return undefined;
    }

    private serializeStrategicRegion(region: PersistedStrategicRegion, eol: string): string {
        const provinces = [...region.provinces].sort((a, b) => a - b).join(' ');
        const lines: string[] = [
            'strategic_region = {',
            `	id = ${region.id}`,
            `	name = "${region.name}"`,
            `	provinces = { ${provinces} }`,
        ];

        if (region.navalTerrain) {
            lines.push(`	naval_terrain = ${region.navalTerrain}`);
        }

        lines.push('}');
        return lines.join(eol);
    }
}
