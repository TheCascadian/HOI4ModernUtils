import { Subscriber, toBehaviorSubject } from "../util/event";
import { Loader, FEWorldMap, StateSnapshot } from "./loader";
import { ViewPoint } from "./viewpoint";
import { vscode } from "../util/vscode";
import { PersistedState, WorldMapMessage, WorldMapWarning } from "../../src/previewdef/worldmap/definitions";
import { feLocalize } from "../util/i18n";
import { DivDropdown } from "../util/dropdown";
import { BehaviorSubject, combineLatest, fromEvent } from 'rxjs';
import { Renderer } from './renderer';
import { sendEvent } from '../util/telemetry';

export type ViewMode = 'province' | 'state' | 'strategicregion' | 'supplyarea' | 'warnings';
export type ColorSet = 'provinceid' | 'provincetype' | 'terrain' | 'country' | 'stateid' | 'manpower' |
    'victorypoint' | 'continent' | 'warnings' | 'strategicregionid' | 'supplyareaid' | 'supplyvalue' | 'resources';

export const topBarHeight = 40;

interface MapEditAction {
    before: StateSnapshot[];
    after: StateSnapshot[];
}

export class TopBar extends Subscriber {
    public viewMode$: BehaviorSubject<ViewMode>;
    public colorSet$: BehaviorSubject<ColorSet>;
    public hoverProvinceId$: BehaviorSubject<number | undefined>;
    // Backward-compat alias for older callers/tools expecting a single selected province stream
    public selectedProvinceId$: BehaviorSubject<number | undefined>;
    public selectedProvinceIds$: BehaviorSubject<Set<number>>;
    public hoverStateId$: BehaviorSubject<number | undefined>;
    public selectedStateId$: BehaviorSubject<number | undefined>;
    public hoverStrategicRegionId$: BehaviorSubject<number | undefined>;
    public selectedStrategicRegionId$: BehaviorSubject<number | undefined>;
    public hoverSupplyAreaId$: BehaviorSubject<number | undefined>;
    public selectedSupplyAreaId$: BehaviorSubject<number | undefined>;
    public mapMutation$: BehaviorSubject<number>;
    public warningFilter: DivDropdown;
    public display: DivDropdown;

    public warningsVisible: boolean = false;

    private searchBox: HTMLInputElement;
    private dragProcessedProvinceIds: Set<number>;
    private selectionUndoStack: Set<number>[];
    private selectionRedoStack: Set<number>[];
    private mapUndoStack: MapEditAction[];
    private mapRedoStack: MapEditAction[];

    constructor(canvas: HTMLCanvasElement, private viewPoint: ViewPoint, private loader: Loader, state: any) {
        super();

        this.addSubscription(this.warningFilter = new DivDropdown(document.getElementById('warningfilter') as HTMLDivElement, true));
        this.addSubscription(this.display = new DivDropdown(document.getElementById('display') as HTMLDivElement, true));

        this.viewMode$ = toBehaviorSubject(document.getElementById('viewmode') as HTMLSelectElement, state.viewMode ?? 'province');
        this.colorSet$ = toBehaviorSubject(document.getElementById('colorset') as HTMLSelectElement, state.colorSet ?? 'provinceid');
        this.hoverProvinceId$ = new BehaviorSubject<number | undefined>(undefined);
        this.selectedProvinceIds$ = new BehaviorSubject<Set<number>>(new Set<number>(state.selectedProvinceIds ?? []));
        this.selectedProvinceId$ = new BehaviorSubject<number | undefined>(state.selectedProvinceId ?? state.selectedProvinceIds?.[0] ?? undefined);
        this.hoverStateId$ = new BehaviorSubject<number | undefined>(undefined);
        this.selectedStateId$ = new BehaviorSubject<number | undefined>(state.selectedStateId ?? undefined);
        this.hoverStrategicRegionId$ = new BehaviorSubject<number | undefined>(undefined);
        this.selectedStrategicRegionId$ = new BehaviorSubject<number | undefined>(state.selectedStrategicRegionId ?? undefined);
        this.hoverSupplyAreaId$ = new BehaviorSubject<number | undefined>(undefined);
        this.selectedSupplyAreaId$ = new BehaviorSubject<number | undefined>(state.selectedSupplyAreaId ?? undefined);
        this.mapMutation$ = new BehaviorSubject<number>(0);
        this.dragProcessedProvinceIds = new Set<number>();
        this.selectionUndoStack = [];
        this.selectionRedoStack = [];
        this.mapUndoStack = [];
        this.mapRedoStack = [];
        if (state.warningFilter) {
            this.warningFilter.selectedValues$.next(state.warningFilter);
        } else {
            this.warningFilter.selectAll();
        }
        if (state.display) {
            this.display.selectedValues$.next(state.display);
        } else {
            this.display.selectAll();
        }

        this.addSubscription(this.selectedProvinceIds$.subscribe(set => {
            this.selectedProvinceId$.next(set.values().next().value);
        }));

        this.searchBox = document.getElementById("searchbox") as HTMLInputElement;

        this.loadControls();
        this.registerEventListeners(canvas);
    }

    private onViewModeChange() {
        document.querySelectorAll('#colorset > option[viewmode]').forEach(v => {
            (v as HTMLOptionElement).hidden = true;
        });
    
        let colorSetHidden = true;
        document.querySelectorAll('#colorset > option[viewmode~="' + this.viewMode$.value + '"]').forEach(v => {
            (v as HTMLOptionElement).hidden = false;
            if ((v as HTMLOptionElement).value === this.colorSet$.value) {
                colorSetHidden = false;
            }
        });
        
        document.querySelectorAll('#colorset > option:not([viewmode])').forEach(v => {
            if ((v as HTMLOptionElement).value === this.colorSet$.value) {
                colorSetHidden = false;
            }
        });

        document.querySelectorAll('button[viewmode]').forEach(v => {
            (v as HTMLButtonElement).style.display = 'none';
        });

        document.querySelectorAll('button[viewmode~="' + this.viewMode$.value + '"]').forEach(v => {
            (v as HTMLButtonElement).style.display = 'inline-block';
        });

        document.querySelectorAll('.group[viewmode]').forEach(v => {
            (v as HTMLDivElement).style.display = 'none';
        });

        document.querySelectorAll('.group[viewmode~="' + this.viewMode$.value + '"]').forEach(v => {
            (v as HTMLDivElement).style.display = 'inline-block';
        });
    
        if (colorSetHidden) {
            const newColorset = (document.querySelector('#colorset > option:not(*[hidden])') as HTMLOptionElement)?.value;
            this.colorSet$.next(newColorset as any);
        }

        this.setSearchBoxPlaceHolder();
    }
    
    private loadControls() {
        this.loadWarningButton();
        this.loadSearchBox();
        this.loadRefreshButton();
        this.loadOpenButton();
        this.loadStateEditButtons();
        this.loadExportButton();
    }

    private loadStateEditButtons() {
        const createStateButton = document.getElementById('create-state-from-selection') as HTMLButtonElement;
        const assignSelectionButton = document.getElementById('assign-selection-to-state') as HTMLButtonElement;

        this.addSubscription(fromEvent<PointerEvent>(createStateButton, 'pointerdown').subscribe(e => {
            e.preventDefault();
            e.stopPropagation();
            this.createStateFromSelection();
        }));

        this.addSubscription(fromEvent<PointerEvent>(assignSelectionButton, 'pointerdown').subscribe(e => {
            e.preventDefault();
            e.stopPropagation();
            this.assignSelectionToState();
        }));

        this.addSubscription(combineLatest([this.selectedProvinceIds$, this.selectedStateId$]).subscribe(([selectedProvinceIds, selectedStateId]) => {
            createStateButton.disabled = selectedProvinceIds.size === 0;
            assignSelectionButton.disabled = selectedProvinceIds.size === 0 || selectedStateId === undefined;
        }));
    }

    private loadWarningButton() {
        const warningsContainer = document.getElementById('warnings-container')!;
        const showWarnings = document.getElementById('show-warnings')!;
        this.addSubscription(fromEvent(showWarnings, 'click').subscribe(() => {
            this.warningsVisible = !this.warningsVisible;
            if (this.warningsVisible) {
                sendEvent('worldmap.openwarnings');
                warningsContainer.style.display = 'block';
            } else {
                warningsContainer.style.display = 'none';
            }
        }));
    }

    private loadSearchBox() {
        const searchBox = this.searchBox;
        const search = document.getElementById("search")!;
        this.addSubscription(fromEvent<KeyboardEvent>(searchBox, 'keypress').subscribe((e) => {
            if (e.code === 'Enter') {
                sendEvent('worldmap.search', { keypress: 'true' });
                this.search(searchBox.value);
            }
        }));
        this.addSubscription(fromEvent(search, 'click').subscribe(() => {
            sendEvent('worldmap.search', { keypress: 'false' });
            this.search(searchBox.value);
        }));
    }

    private loadRefreshButton() {
        const refresh = document.getElementById("refresh") as HTMLButtonElement;
        this.addSubscription(fromEvent(refresh, 'click').subscribe(() => {
            if (!refresh.disabled) {
                sendEvent('worldmap.refresh');
                this.loader.refresh();
            }
        }));
        this.addSubscription(this.loader.loading$.subscribe(v => {
            refresh.disabled = v;
        }));
    }

    private openMapItem(useHoverValue = false) {
        sendEvent('worldmap.open.' + this.viewMode$.value + (useHoverValue ? '.dblclick' : ''));
        if (this.viewMode$.value === 'state') {
            const selected = useHoverValue ? this.hoverStateId$.value : this.selectedStateId$.value;
            if (selected) {
                const state = this.loader.worldMap.getStateById(selected);
                if (state) {
                    vscode.postMessage<WorldMapMessage>({ command: 'openfile', type: 'state', file: state.file, start: state.token?.start, end: state.token?.end });
                }
            }
        } else if (this.viewMode$.value === 'strategicregion') {
            const selected = useHoverValue ? this.hoverStrategicRegionId$.value : this.selectedStrategicRegionId$.value;
            if (selected) {
                const strategicRegion = this.loader.worldMap.getStrategicRegionById(selected);
                if (strategicRegion) {
                    vscode.postMessage<WorldMapMessage>({ command: 'openfile', type: 'strategicregion', file: strategicRegion.file,
                        start: strategicRegion.token?.start, end: strategicRegion.token?.end });
                }
            }
        } else if (this.viewMode$.value === 'supplyarea') {
            const selected = useHoverValue ? this.hoverSupplyAreaId$.value : this.selectedSupplyAreaId$.value;
            if (selected) {
                const supplyArea = this.loader.worldMap.getSupplyAreaById(selected);
                if (supplyArea) {
                    vscode.postMessage<WorldMapMessage>({ command: 'openfile', type: 'supplyarea', file: supplyArea.file,
                        start: supplyArea.token?.start, end: supplyArea.token?.end });
                }
            }
        }
    }

    private loadOpenButton() {
        const open = document.getElementById("open") as HTMLButtonElement;
        this.addSubscription(fromEvent(open, 'click').subscribe((e) => {
            e.stopPropagation();
            this.openMapItem();
        }));

        this.addSubscription(combineLatest([this.viewMode$, this.selectedStateId$, this.selectedStrategicRegionId$, this.selectedSupplyAreaId$]).subscribe(
            ([viewMode, selectedStateId, selectedStrategicRegionId, selectedSupplyAreaId]) => {
                open.disabled = !((viewMode === 'state' && selectedStateId !== undefined) ||
                    (viewMode === 'strategicregion' && selectedStrategicRegionId !== undefined) ||
                    (viewMode === 'supplyarea' && selectedSupplyAreaId !== undefined));
            }
        ));
    }

    private loadExportButton() {
        const exportButton = document.getElementById("export") as HTMLButtonElement;
        exportButton.disabled = true;
        this.addSubscription(this.loader.worldMap$.subscribe(wm => {
            exportButton.disabled = !wm;
        }));
        this.addSubscription(fromEvent(exportButton, 'click').subscribe(e => {
            e.stopPropagation();
            vscode.postMessage({ command: 'requestexportmap' });
        }));
        this.addSubscription(fromEvent<MessageEvent>(window, 'message').subscribe(event => {
            const message = event.data as WorldMapMessage;
            if (message.command !== 'requestexportmap') {
                return;
            }

            const worldMap = this.loader.worldMap;
            if (!worldMap) {
                return;
            }

            sendEvent('worldmap.export');
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, worldMap.width);
            canvas.height = Math.max(1, worldMap.height);
            const viewPoint = new ViewPoint(canvas, this.loader, 0, { x: 0, y: 0, scale: 1 });
            Renderer.renderMapImpl(canvas, this, viewPoint, worldMap, { preciseEdge: true, overwriteRenderPrecision: 1 });
            vscode.postMessage({ command: 'exportmap', dataUrl: canvas.toDataURL() });
        }));
    }
    
    private registerEventListeners(canvas: HTMLCanvasElement) {
        this.addSubscription(fromEvent<MouseEvent>(canvas, 'mousemove').subscribe((e) => {
            if (!this.loader.worldMap) {
                this.hoverProvinceId$.next(undefined);
                this.hoverStateId$.next(undefined);
                this.hoverStrategicRegionId$.next(undefined);
                this.hoverSupplyAreaId$.next(undefined);
                return;
            }
    
            const worldMap = this.loader.worldMap;
            let x = this.viewPoint.convertBackX(e.pageX);
            let y = this.viewPoint.convertBackY(e.pageY);
            if (x < 0) {
                x += worldMap.width;
            }
            while (x >= worldMap.width && worldMap.width > 0) {
                x -= worldMap.width;
            }

            this.hoverProvinceId$.next(worldMap.getProvinceByPosition(x, y)?.id);
            this.hoverStateId$.next(this.hoverProvinceId$.value === undefined ? undefined : worldMap.getStateByProvinceId(this.hoverProvinceId$.value)?.id);
            this.hoverStrategicRegionId$.next(this.hoverProvinceId$.value === undefined ? undefined : worldMap.getStrategicRegionByProvinceId(this.hoverProvinceId$.value)?.id);
            this.hoverSupplyAreaId$.next(this.hoverStateId$.value === undefined ? undefined : worldMap.getSupplyAreaByStateId(this.hoverStateId$.value)?.id);
        }));
    
        this.addSubscription(fromEvent(canvas, 'mouseleave').subscribe(() => {
            this.hoverProvinceId$.next(undefined);
            this.hoverStateId$.next(undefined);
            this.hoverStrategicRegionId$.next(undefined);
            this.hoverSupplyAreaId$.next(undefined);
        }));

        // Ctrl+Left-click: toggle a single province in the selection set (province view)
        // Regular click: clear selection and select just the hovered province (or deselect if already sole selection)
        // Drag selection requires Shift + left mouse down + drag.
        let pressedLeft = false;
        let dragMoved = false;
        let dragStarted = false;

        this.addSubscription(fromEvent<MouseEvent>(canvas, 'mousedown').subscribe((e) => {
            if (e.button === 0) {
                dragMoved = false;
                dragStarted = false;
                this.dragProcessedProvinceIds.clear();

                if (this.viewMode$.value === 'province') {
                    const prov = this.hoverProvinceId$.value;
                    if (prov !== undefined) {
                        if (e.ctrlKey) {
                            // Ctrl+mousedown: toggle this province immediately and track for drag
                            this.toggleSelectedProvince(prov);
                        } else if (e.shiftKey) {
                            // Shift+mousedown starts drag-selection and adds the hovered province.
                            pressedLeft = true;
                            dragStarted = true;
                            const next = new Set(this.selectedProvinceIds$.value);
                            next.add(prov);
                            this.setSelectedProvinceIds(next, true);
                        } else {
                            pressedLeft = false;
                        }
                        this.dragProcessedProvinceIds.add(prov);
                    } else {
                        pressedLeft = e.shiftKey;
                    }
                } else {
                    pressedLeft = false;
                }
            }
        }));

        this.addSubscription(fromEvent<MouseEvent>(document.body, 'mousemove').subscribe(() => {
            if (!pressedLeft || this.viewMode$.value !== 'province') {
                return;
            }
            dragMoved = true;
            const prov = this.hoverProvinceId$.value;
            if (prov !== undefined && !this.dragProcessedProvinceIds.has(prov)) {
                const next = new Set(this.selectedProvinceIds$.value);
                next.add(prov);
                this.setSelectedProvinceIds(next, false);
                this.dragProcessedProvinceIds.add(prov);
            }
        }));

        this.addSubscription(fromEvent<MouseEvent>(document.body, 'mouseup').subscribe(() => {
            pressedLeft = false;
            this.dragProcessedProvinceIds.clear();
            if (dragStarted) {
                this.selectionRedoStack.length = 0;
            }
            dragStarted = false;
        }));

        this.addSubscription(fromEvent<MouseEvent>(canvas, 'click').subscribe((e) => {
            if (dragMoved) {
                dragMoved = false;
                return; // already handled by drag
            }
            switch (this.viewMode$.value) {
                case 'province':
                    {
                        const prov = this.hoverProvinceId$.value;
                        if (e.ctrlKey) {
                            // Ctrl+click: toggle (already handled on mousedown, skip to avoid double-toggle)
                        } else {
                            // Plain click: if this province is the only selected one, deselect; else select only this one
                            if (prov !== undefined) {
                                const cur = this.selectedProvinceIds$.value;
                                if (cur.size === 1 && cur.has(prov)) {
                                    this.setSelectedProvinceIds(new Set(), true);
                                } else {
                                    this.setSelectedProvinceIds(new Set([prov]), true);
                                }
                            } else {
                                this.setSelectedProvinceIds(new Set(), true);
                            }
                        }
                    }
                    break;
                case 'state':
                    this.selectedStateId$.next(this.selectedStateId$.value === this.hoverStateId$.value ? undefined : this.hoverStateId$.value);
                    break;
                case 'strategicregion':
                    this.selectedStrategicRegionId$.next(this.selectedStrategicRegionId$.value === this.hoverStrategicRegionId$.value ? undefined : this.hoverStrategicRegionId$.value);
                    break;
                case 'supplyarea':
                    this.selectedSupplyAreaId$.next(this.selectedSupplyAreaId$.value === this.hoverSupplyAreaId$.value ? undefined : this.hoverSupplyAreaId$.value);
                    break;
            }
        }));

        this.addSubscription(fromEvent(canvas, 'dblclick').subscribe(e => {
            e.stopPropagation();
            this.openMapItem(true);
        }));

        this.addSubscription(this.viewMode$.subscribe(() => this.onViewModeChange()));

        this.addSubscription(this.loader.worldMap$.subscribe(wm => {
            const warnings = document.getElementById('warnings') as HTMLTextAreaElement;
            if (wm.warnings.length === 0) {
                warnings.value = feLocalize('worldmap.warnings.nowarnings', 'No warnings.');
            } else {
                warnings.value = feLocalize('worldmap.warnings', 'World map warnings: \n\n{0}', wm.warnings.map(warningToString).join('\n'));
            }

            this.setSearchBoxPlaceHolder(wm);
        }));

        this.addSubscription(fromEvent<KeyboardEvent>(document, 'keydown').subscribe(e => {
            if (this.shouldIgnoreGlobalShortcut(e.target)) {
                return;
            }

            const key = e.key.toLowerCase();
            if (e.ctrlKey && !e.shiftKey && key === 'z') {
                e.preventDefault();
                if (this.undoMapEdit()) {
                    return;
                }
                this.undoProvinceSelection();
                return;
            }

            if (e.ctrlKey && !e.shiftKey && key === 'y') {
                e.preventDefault();
                if (this.redoMapEdit()) {
                    return;
                }
                this.redoProvinceSelection();
                return;
            }

            // Rapid state creation: Ctrl+Shift+N (N = New state)
            if (e.ctrlKey && e.shiftKey && key === 'n') {
                e.preventDefault();
                this.createStateFromSelection();
            }
        }));
    }

    private toggleSelectedProvince(provinceId: number) {
        const next = new Set(this.selectedProvinceIds$.value);
        if (next.has(provinceId)) {
            next.delete(provinceId);
        } else {
            next.add(provinceId);
        }
        this.setSelectedProvinceIds(next, true);
    }

    private setSelectedProvinceIds(nextSelection: Set<number>, recordHistory: boolean) {
        const current = this.selectedProvinceIds$.value;
        if (this.isSameSelection(current, nextSelection)) {
            return;
        }

        if (recordHistory) {
            this.selectionUndoStack.push(new Set(current));
            if (this.selectionUndoStack.length > 200) {
                this.selectionUndoStack.shift();
            }
            this.selectionRedoStack.length = 0;
        }

        this.selectedProvinceIds$.next(new Set(nextSelection));
    }

    private undoProvinceSelection() {
        const previous = this.selectionUndoStack.pop();
        if (!previous) {
            return;
        }

        this.selectionRedoStack.push(new Set(this.selectedProvinceIds$.value));
        this.selectedProvinceIds$.next(previous);
    }

    private redoProvinceSelection() {
        const next = this.selectionRedoStack.pop();
        if (!next) {
            return;
        }

        this.selectionUndoStack.push(new Set(this.selectedProvinceIds$.value));
        this.selectedProvinceIds$.next(next);
    }

    private isSameSelection(a: Set<number>, b: Set<number>): boolean {
        if (a.size !== b.size) {
            return false;
        }

        for (const v of a) {
            if (!b.has(v)) {
                return false;
            }
        }

        return true;
    }

    private shouldIgnoreGlobalShortcut(target: EventTarget | null): boolean {
        if (!(target instanceof HTMLElement)) {
            return false;
        }

        const tag = target.tagName;
        return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
    }

    private assignSelectionToState() {
        const selectedStateId = this.selectedStateId$.value;
        if (selectedStateId === undefined) {
            return;
        }

        const selectedProvinceIds = Array.from(this.selectedProvinceIds$.value.values());
        if (selectedProvinceIds.length === 0) {
            return;
        }

        const affectedStateIds = new Set<number>([selectedStateId]);
        for (const provinceId of selectedProvinceIds) {
            const sourceState = this.loader.worldMap.getStateByProvinceId(provinceId);
            if (sourceState) {
                affectedStateIds.add(sourceState.id);
            }
        }
        const before = this.loader.worldMap.snapshotStates(Array.from(affectedStateIds.values()));

        const changedStateIds = this.loader.worldMap.assignProvincesToState(selectedProvinceIds, selectedStateId);
        if (changedStateIds && changedStateIds.length > 0) {
            const after = this.loader.worldMap.snapshotStates(changedStateIds);
            this.recordMapEdit(before, after);
            this.persistStates(changedStateIds);
            this.mapMutation$.next(this.mapMutation$.value + 1);
        }
    }

    private createStateFromSelection() {
        const selectedProvinceIds = Array.from(this.selectedProvinceIds$.value.values());
        if (selectedProvinceIds.length === 0) {
            return;
        }

        const nextStateId = this.loader.worldMap.getNextStateId();
        const beforeStateIds = new Set<number>([nextStateId]);
        for (const provinceId of selectedProvinceIds) {
            const sourceState = this.loader.worldMap.getStateByProvinceId(provinceId);
            if (sourceState) {
                beforeStateIds.add(sourceState.id);
            }
        }
        const before = this.loader.worldMap.snapshotStates(Array.from(beforeStateIds.values()));

        const created = this.loader.worldMap.createStateFromProvinces(selectedProvinceIds);
        if (created !== undefined) {
            const after = this.loader.worldMap.snapshotStates(created.changedStateIds);
            this.recordMapEdit(before, after);
            this.persistStates(created.changedStateIds);
            this.selectedStateId$.next(created.newStateId);
            this.mapMutation$.next(this.mapMutation$.value + 1);
        }
    }

    private persistStates(stateIds: number[], deletedFiles: string[] = []) {
        const payload: PersistedState[] = Array.from(new Set(stateIds))
            .map(id => this.loader.worldMap.getStateById(id))
            .filter((state): state is NonNullable<typeof state> => !!state)
            .map(state => ({
                id: state.id,
                name: state.name,
                manpower: state.manpower,
                category: state.category,
                owner: state.owner,
                provinces: [...state.provinces],
                cores: [...state.cores],
                impassable: state.impassable,
                victoryPoints: { ...state.victoryPoints },
                resources: { ...state.resources },
                file: state.file,
                tokenStart: state.token?.start,
                tokenEnd: state.token?.end,
            }));

        if (payload.length > 0 || deletedFiles.length > 0) {
            vscode.postMessage<WorldMapMessage>({ command: 'persiststates', states: payload, deletedFiles: Array.from(new Set(deletedFiles)) });
        }
    }

    private recordMapEdit(before: StateSnapshot[], after: StateSnapshot[]) {
        this.mapUndoStack.push({ before, after });
        if (this.mapUndoStack.length > 200) {
            this.mapUndoStack.shift();
        }
        this.mapRedoStack.length = 0;
    }

    private undoMapEdit(): boolean {
        const action = this.mapUndoStack.pop();
        if (!action) {
            return false;
        }

        this.loader.worldMap.restoreStates(action.before);
        this.mapRedoStack.push(action);
        const { stateIds, deletedFiles } = this.getPersistenceTargets(action.before, action.after);
        this.persistStates(stateIds, deletedFiles);
        this.mapMutation$.next(this.mapMutation$.value + 1);
        return true;
    }

    private redoMapEdit(): boolean {
        const action = this.mapRedoStack.pop();
        if (!action) {
            return false;
        }

        this.loader.worldMap.restoreStates(action.after);
        this.mapUndoStack.push(action);
        const { stateIds, deletedFiles } = this.getPersistenceTargets(action.after, action.before);
        this.persistStates(stateIds, deletedFiles);
        this.mapMutation$.next(this.mapMutation$.value + 1);
        return true;
    }

    private getPersistenceTargets(target: StateSnapshot[], source: StateSnapshot[]): { stateIds: number[]; deletedFiles: string[] } {
        const stateIds: number[] = [];
        const deletedFiles: string[] = [];

        const sourceById: Record<number, StateSnapshot['state']> = {};
        for (const snapshot of source) {
            sourceById[snapshot.id] = snapshot.state;
        }

        for (const snapshot of target) {
            if (snapshot.state) {
                stateIds.push(snapshot.id);
                continue;
            }

            const previous = sourceById[snapshot.id];
            if (previous && previous.token === null) {
                deletedFiles.push(previous.file);
            }
        }

        return { stateIds, deletedFiles };
    }

    private search(text: string) {
        const number = parseInt(text);
        if (isNaN(number)) {
            return;
        }

        const viewMode = this.viewMode$.value;
        const [getRegionById, selectedId] =
            viewMode === 'province' ? [this.loader.worldMap.getProvinceById, undefined as any] :
            viewMode === 'state' ? [this.loader.worldMap.getStateById, this.selectedStateId$] :
            viewMode === 'strategicregion' ? [this.loader.worldMap.getStrategicRegionById, this.selectedStrategicRegionId$] :
            viewMode === 'supplyarea' ? [this.loader.worldMap.getSupplyAreaById, this.selectedSupplyAreaId$] :
            [() => undefined, undefined];
            
        const region = getRegionById(number);
        if (region) {
            if (viewMode === 'province') {
                this.setSelectedProvinceIds(new Set([number]), true);
            } else {
                selectedId?.next(number);
            }
            this.viewPoint.centerZone(region.boundingBox);
        }
    }

    private setSearchBoxPlaceHolder(worldMap?: FEWorldMap) {
        if (!worldMap) {
            worldMap = this.loader.worldMap;
        }

        let placeholder = '';
        switch (this.viewMode$.value) {
            case 'province':
                placeholder = worldMap.provincesCount > 1 ? `1-${worldMap.provincesCount - 1}` : '';
                break;
            case 'state':
                placeholder = worldMap.statesCount > 1 ? `1-${worldMap.statesCount - 1}` : '';
                break;
            case 'strategicregion':
                placeholder = worldMap.strategicRegionsCount > 1 ? `1-${worldMap.strategicRegionsCount - 1}` : '';
                break;
            case 'supplyarea':
                placeholder = worldMap.supplyAreasCount > 1 ? `1-${worldMap.supplyAreasCount - 1}` : '';
                break;
            default:
                break;
        }

        if (placeholder) {
            this.searchBox.placeholder = feLocalize('worldmap.topbar.search.placeholder', 'Range: {0}', placeholder);
        } else {
            this.searchBox.placeholder = '';
        }
    }
}

function warningToString(warning: WorldMapWarning): string {
    return `[${warning.source.map(s => `${s.type[0].toUpperCase()}${s.type.substr(1)} ${'id' in s ? s.id : s.name}`).join(', ')}] ${warning.text}`;
}
