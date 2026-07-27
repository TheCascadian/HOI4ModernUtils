import { Subscriber, toBehaviorSubject } from "../util/event";
import { Loader, FEWorldMap, StateSnapshot, StrategicRegionSnapshot, ProvinceSnapshot } from "./loader";
import { ViewPoint } from "./viewpoint";
import { vscode } from "../util/vscode";
import { PersistedState, WorldMapMessage, WorldMapWarning, ProvinceDraft } from "../../src/previewdef/worldmap/definitions";
import { feLocalize } from "../util/i18n";
import { DivDropdown } from "../util/dropdown";
import { BehaviorSubject, combineLatest, fromEvent } from 'rxjs';
import { Renderer, solveWithCondition, solveWithConditionAsSet } from './renderer';
import { sendEvent } from '../util/telemetry';
import { getState } from "../util/common";
import { ConditionItem, conditionItemToStringValue, conditionToString, stringValueToConditionItem } from "../../src/hoiformat/condition";

export type ViewMode = 'province' | 'state' | 'strategicregion' | 'supplyarea' | 'warnings';
export type ColorSet = 'provinceid' | 'provincetype' | 'terrain' | 'owner' | 'controller' | 'stateid' | 'manpower' |
    'victorypoint' | 'continent' | 'warnings' | 'strategicregionid' | 'supplyareaid' | 'supplyvalue' | 'resources' | 'statecategory';

export const topBarHeight = 40;

interface MapEditAction {
    type: 'state' | 'strategicregion' | 'province';
    before: StateSnapshot[] | StrategicRegionSnapshot[] | ProvinceSnapshot[];
    after: StateSnapshot[] | StrategicRegionSnapshot[] | ProvinceSnapshot[];
}

interface ShortcutSpec {
    key: string;
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    label: string;
}

interface WorldMapKeybindSpec {
    selectionUndo: ShortcutSpec;
    selectionRedo: ShortcutSpec;
    mapUndo: ShortcutSpec;
    mapRedo: ShortcutSpec;
    createStateFromSelection: ShortcutSpec;
    assignSelectionToState: ShortcutSpec;
    assignSelectionToStrategicRegion: ShortcutSpec;
}

const defaultKeybindLabels = {
    selectionUndo: 'T',
    selectionRedo: 'R',
    mapUndo: 'Ctrl+Z',
    mapRedo: 'Ctrl+Y',
    createStateFromSelection: 'Ctrl+Shift+N',
    assignSelectionToState: 'Ctrl+Enter',
    assignSelectionToStrategicRegion: 'Ctrl+Shift+G',
} as const;

function parseShortcutOrDefault(value: string | undefined, fallback: string): ShortcutSpec {
    const parsed = parseShortcut(value);
    if (parsed) {
        return parsed;
    }

    const fallbackParsed = parseShortcut(fallback);
    if (fallbackParsed) {
        return fallbackParsed;
    }

    return { key: 'unidentified', ctrl: false, shift: false, alt: false, label: fallback };
}

function parseShortcut(value: string | undefined): ShortcutSpec | undefined {
    if (!value) {
        return undefined;
    }

    const parts = value.split('+').map(x => x.trim()).filter(x => x.length > 0);
    if (parts.length === 0) {
        return undefined;
    }

    let ctrl = false;
    let shift = false;
    let alt = false;
    let key: string | undefined;

    for (const part of parts) {
        const lower = part.toLowerCase();
        if (lower === 'ctrl' || lower === 'control') {
            ctrl = true;
            continue;
        }
        if (lower === 'shift') {
            shift = true;
            continue;
        }
        if (lower === 'alt' || lower === 'option') {
            alt = true;
            continue;
        }

        key = lower === 'return' ? 'enter' : lower;
    }

    if (!key) {
        return undefined;
    }

    return { key, ctrl, shift, alt, label: value };
}

function getWorldMapKeybinds(): WorldMapKeybindSpec {
    const source = ((window as any)['__worldMapKeybinds'] ?? {}) as Partial<Record<keyof WorldMapKeybindSpec, string>>;
    return {
        selectionUndo: parseShortcutOrDefault(source.selectionUndo, defaultKeybindLabels.selectionUndo),
        selectionRedo: parseShortcutOrDefault(source.selectionRedo, defaultKeybindLabels.selectionRedo),
        mapUndo: parseShortcutOrDefault(source.mapUndo, defaultKeybindLabels.mapUndo),
        mapRedo: parseShortcutOrDefault(source.mapRedo, defaultKeybindLabels.mapRedo),
        createStateFromSelection: parseShortcutOrDefault(source.createStateFromSelection, defaultKeybindLabels.createStateFromSelection),
        assignSelectionToState: parseShortcutOrDefault(source.assignSelectionToState, defaultKeybindLabels.assignSelectionToState),
        assignSelectionToStrategicRegion: parseShortcutOrDefault(source.assignSelectionToStrategicRegion, defaultKeybindLabels.assignSelectionToStrategicRegion),
    };
}

export class TopBar extends Subscriber {
    public viewMode$: BehaviorSubject<ViewMode>;
    public colorSet$: BehaviorSubject<ColorSet>;
    public hoverProvinceId$: BehaviorSubject<number | undefined>;
    // Backward-compat alias for older callers/tools expecting a single selected province stream
    public selectedProvinceId$: BehaviorSubject<number | undefined>;
    public selectedProvinceIds$: BehaviorSubject<Set<number>>;
    public selectedStateIds$: BehaviorSubject<Set<number>>;
    public hoverStateId$: BehaviorSubject<number | undefined>;
    public selectedStateId$: BehaviorSubject<number | undefined>;
    public hoverStrategicRegionId$: BehaviorSubject<number | undefined>;
    public selectedStrategicRegionId$: BehaviorSubject<number | undefined>;
    public hoverSupplyAreaId$: BehaviorSubject<number | undefined>;
    public selectedSupplyAreaId$: BehaviorSubject<number | undefined>;
    public mapMutation$: BehaviorSubject<number>;
    public selectedConditions$: BehaviorSubject<ConditionItem[]>;
    public warningFilter: DivDropdown;
    public display: DivDropdown;
    public conditions: DivDropdown;

    /** Paintbrush mode state */
    public paintbrushActive$: BehaviorSubject<boolean>;
    /** Currently auto-selected paintbrush color */
    public paintbrushColor$: BehaviorSubject<number>;
    /** Set of painted pixel coords "x,y" -> new color (for rendering overlay) */
    public paintedPixels$: BehaviorSubject<Map<string, number>>;
    /** Current province draft (non-null when paintbrush is active) */
    public provinceDraft$: BehaviorSubject<ProvinceDraft | undefined>;
    /** Brush radius in pixels (1 = single pixel) */
    public brushSize$: BehaviorSubject<number>;
    /** Current hover map X coordinate (for brush cursor) */
    public hoverMapX$: BehaviorSubject<number>;
    /** Current hover map Y coordinate (for brush cursor) */
    public hoverMapY$: BehaviorSubject<number>;
    /** Whether user is currently painting (mouse down) */
    public isPainting: boolean = false;
    /** Previous province definitions snapshot for undo */
    public paintbrushPreviousProvinces: any[] | null = null;
    /** Source province type for land/water clamping */
    private sourceProvinceType: string = 'land';
    /** Maximum undo steps (configurable, default 5) */
    public maxUndoSteps: number = 5;
    /** Can undo a paintbrush operation */
    public paintbrushCanUndo$: BehaviorSubject<boolean>;
    /** Whether a paintbrush save is pending backend acknowledgment */
    private paintbrushSavePending = false;
    /** Whether to refresh after the pending paintbrush save completes */
    private refreshAfterPaintbrushSave = false;
    /** Can redo a paintbrush operation */
    public paintbrushCanRedo$: BehaviorSubject<boolean>;

    public warningsVisible: boolean = false;

    private searchBox: HTMLInputElement;
    private dragProcessedProvinceIds: Set<number>;
    private dragProcessedStateIds: Set<number>;
    private selectionUndoStack: Set<number>[];
    private selectionRedoStack: Set<number>[];
    private selectionUndoStackStates: Set<number>[];
    private selectionRedoStackStates: Set<number>[];
    private mapUndoStack: MapEditAction[];
    private mapRedoStack: MapEditAction[];

    private actionStatus: HTMLDivElement;
    private actionStatusTimer: ReturnType<typeof setTimeout> | undefined;
    private keybinds: WorldMapKeybindSpec;

    private eventToMapPosition(
        canvas: HTMLCanvasElement,
        event: MouseEvent
    ): { x: number; y: number } | undefined {
        const worldMap = this.loader.worldMap;

        if (!worldMap || worldMap.width <= 0 || worldMap.height <= 0) {
            return undefined;
        }

        const rect = canvas.getBoundingClientRect();

        if (rect.width <= 0 || rect.height <= 0) {
            return undefined;
        }

        /*
         * clientX/clientY and getBoundingClientRect() use the same coordinate
         * system. The scale factors support CSS scaling and webview zoom.
         */
        const canvasX =
            (event.clientX - rect.left) *
            (canvas.width / rect.width);

        const canvasY =
            (event.clientY - rect.top) *
            (canvas.height / rect.height);

        let mapX =
            canvasX / this.viewPoint.scale +
            this.viewPoint.x;

        const mapY =
            canvasY / this.viewPoint.scale +
            this.viewPoint.y;

        // Horizontal world wrapping.
        mapX =
            ((mapX % worldMap.width) + worldMap.width) %
            worldMap.width;

        return {
            x: Math.floor(mapX),
            y: Math.floor(mapY),
        };
    }

    constructor(canvas: HTMLCanvasElement, private viewPoint: ViewPoint, private loader: Loader, state: any) {
        super();

        this.addSubscription(this.warningFilter = new DivDropdown(document.getElementById('warningfilter') as HTMLDivElement, true));
        this.addSubscription(this.display = new DivDropdown(document.getElementById('display') as HTMLDivElement, true));
        this.addSubscription(this.conditions = new DivDropdown(document.getElementById('conditions') as HTMLDivElement, true));
        const groupElement = this.conditions.select.closest<HTMLDivElement>('.group');
        if (groupElement) {
            groupElement.style.display = 'none';
        }
        this.addSubscription(loader.worldMap$.subscribe(this.setupConditions));

        this.viewMode$ = toBehaviorSubject(document.getElementById('viewmode') as HTMLSelectElement, state.viewMode ?? 'province');
        this.colorSet$ = toBehaviorSubject(document.getElementById('colorset') as HTMLSelectElement, state.colorSet ?? 'provinceid');
        this.hoverProvinceId$ = new BehaviorSubject<number | undefined>(undefined);
        this.selectedProvinceIds$ = new BehaviorSubject<Set<number>>(new Set<number>(state.selectedProvinceIds ?? []));
        this.selectedProvinceId$ = new BehaviorSubject<number | undefined>(state.selectedProvinceId ?? state.selectedProvinceIds?.[0] ?? undefined);
        this.selectedStateIds$ = new BehaviorSubject<Set<number>>(new Set<number>(state.selectedStateIds ?? []));
        this.hoverStateId$ = new BehaviorSubject<number | undefined>(undefined);
        this.selectedStateId$ = new BehaviorSubject<number | undefined>(state.selectedStateId ?? undefined);
        this.hoverStrategicRegionId$ = new BehaviorSubject<number | undefined>(undefined);
        this.selectedStrategicRegionId$ = new BehaviorSubject<number | undefined>(state.selectedStrategicRegionId ?? undefined);
        this.hoverSupplyAreaId$ = new BehaviorSubject<number | undefined>(undefined);
        this.selectedSupplyAreaId$ = new BehaviorSubject<number | undefined>(state.selectedSupplyAreaId ?? undefined);
        this.mapMutation$ = new BehaviorSubject<number>(0);
        this.paintbrushActive$ = new BehaviorSubject<boolean>(false);
        this.paintbrushColor$ = new BehaviorSubject<number>(0);
        this.paintedPixels$ = new BehaviorSubject<Map<string, number>>(new Map());
        this.provinceDraft$ = new BehaviorSubject<ProvinceDraft | undefined>(undefined);
        this.brushSize$ = new BehaviorSubject<number>(1);
        this.hoverMapX$ = new BehaviorSubject<number>(0);
        this.hoverMapY$ = new BehaviorSubject<number>(0);
        this.paintbrushCanUndo$ = new BehaviorSubject<boolean>(false);
        this.paintbrushCanRedo$ = new BehaviorSubject<boolean>(false);
        this.dragProcessedProvinceIds = new Set<number>();
        this.dragProcessedStateIds = new Set<number>();
        this.selectionUndoStack = [];
        this.selectionRedoStack = [];
        this.selectionUndoStackStates = [];
        this.selectionRedoStackStates = [];
        this.mapUndoStack = [];
        this.mapRedoStack = [];
        this.selectedConditions$ = new BehaviorSubject<ConditionItem[]>((state.selectedConditions ?? []).map(stringValueToConditionItem));
        this.keybinds = getWorldMapKeybinds();

        this.addSubscription(this.conditions.selectedValues$.subscribe(selection => {
            this.selectedConditions$.next(selection.map(stringValueToConditionItem));
        }));

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

        // Wire brush size dropdown
        const brushSizeSelect = document.getElementById('brushsize') as HTMLSelectElement;
        if (brushSizeSelect) {
            this.brushSize$.next(parseInt(brushSizeSelect.value, 10) || 1);
            this.addSubscription(fromEvent(brushSizeSelect, 'change').subscribe(() => {
                this.brushSize$.next(parseInt(brushSizeSelect.value, 10) || 1);
            }));
        }

        // Listen for paintbrush BMP update messages from extension
        this.addSubscription(fromEvent<MessageEvent>(window, 'message').subscribe(event => {
            const message = event.data as WorldMapMessage;

            if (message.command === 'provincebmpupdated') {
                const data = JSON.parse(
                    (message as any).data ?? '{}'
                );

                if (data.success === false) {
                    this.paintbrushSavePending = false;
                    this.refreshAfterPaintbrushSave = false;

                    console.error(
                        'Province BMP persistence failed:',
                        data.error
                    );

                    return;
                }

                this.paintbrushCanUndo$.next(
                    data.canUndo ?? false
                );

                this.paintbrushCanRedo$.next(
                    data.canRedo ?? false
                );

                const shouldRefresh =
                    this.refreshAfterPaintbrushSave ||
                    data.forceReload === true;

                this.refreshAfterPaintbrushSave = false;

                if (this.paintbrushSavePending) {
                    this.finishPaintbrushSession();
                }

                if (shouldRefresh) {
                    this.loader.refresh();
                }

                return;
            }

            if (message.command === 'provincebmpdata') {
                const bmpMessage = message as any;

                if (
                    bmpMessage.colorByPosition &&
                    bmpMessage.width ===
                        this.loader.worldMap.width &&
                    bmpMessage.height ===
                        this.loader.worldMap.height
                ) {
                    this.loader.worldMap.setColorByPosition(
                        bmpMessage.colorByPosition
                    );
                }
            }
        }));

        this.addSubscription(this.selectedStateIds$.subscribe(set => {
            this.selectedStateId$.next(set.values().next().value);
        }));

        this.searchBox = document.getElementById("searchbox") as HTMLInputElement;
        this.actionStatus = document.getElementById('action-status') as HTMLDivElement;

        this.loadControls();
        this.registerEventListeners(canvas);
    }

    private setupConditions = (worldMap: FEWorldMap) => {
        this.conditions.setupOptions(worldMap.conditionExprs.map(option => ({ value: conditionItemToStringValue(option), text: conditionToString(option) })));
        const selectedConditions = getState().selectedConditions ?? [];
        this.conditions.selectedValues$.next(selectedConditions);
        const groupElement = this.conditions.select.closest<HTMLDivElement>('.group');
        if (groupElement) {
            groupElement.style.display = worldMap.conditionExprs.length > 0 ? 'inline-block' : 'none';
        }
    };

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
        this.loadStrategicRegionEditButtons();
        this.loadNewProvinceButton();
        this.loadPaintbrushToggleButton();
        this.loadPaintbrushPanel();
        this.loadExportButton();
    }

    /**
     * Wire the floating paintbrush confirmation panel.
     */
    private loadPaintbrushPanel() {
        const panel = document.getElementById('paintbrush-panel');
        if (!panel) return;

        const applyBtn = document.getElementById('paintbrush-apply') as HTMLButtonElement;
        const cancelBtn = document.getElementById('paintbrush-cancel') as HTMLButtonElement;
        const pixelCountEl = document.getElementById('paintbrush-pixel-count') as HTMLSpanElement;
        const colorPreviewEl = document.getElementById('paintbrush-color-preview') as HTMLSpanElement;
        const provinceInfoEl = document.getElementById('paintbrush-province-info') as HTMLSpanElement;
        const draftTypeEl = document.getElementById('paintbrush-draft-type') as HTMLSpanElement;
        const draftTerrainEl = document.getElementById('paintbrush-draft-terrain') as HTMLSpanElement;
        const draftCoastalEl = document.getElementById('paintbrush-draft-coastal') as HTMLSpanElement;
        const draftContinentEl = document.getElementById('paintbrush-draft-continent') as HTMLSpanElement;
        const draftErrorsEl = document.getElementById('paintbrush-draft-errors') as HTMLDivElement;

        // Show/hide panel with paintbrush active state
        this.addSubscription(this.paintbrushActive$.subscribe(active => {
            panel.style.display = active ? 'block' : 'none';
            if (!active && applyBtn) applyBtn.disabled = false;
        }));

        // Update pixel count from paintedPixels$
        this.addSubscription(this.paintedPixels$.subscribe(pixels => {
            if (pixelCountEl) {
                pixelCountEl.textContent = `${pixels.size} pixels`;
            }
        }));

        // Update color preview swatch
        this.addSubscription(this.paintbrushColor$.subscribe(color => {
            if (colorPreviewEl) {
                const r = (color >> 16) & 0xFF;
                const g = (color >> 8) & 0xFF;
                const b = color & 0xFF;
                colorPreviewEl.style.backgroundColor = `rgb(${r},${g},${b})`;
            }
        }));

        // Update panel from the ProvinceDraft
        this.addSubscription(this.provinceDraft$.subscribe(draft => {
            if (!draft) return;

            // Province info
            if (provinceInfoEl) {
                if (draft.sourceProvinceId > 0) {
                    provinceInfoEl.textContent = `Source: Province #${draft.sourceProvinceId}`;
                } else {
                    provinceInfoEl.textContent = 'New province';
                }
            }

            // Draft details
            if (draftTypeEl) draftTypeEl.textContent = `Type: ${draft.type}  `;
            if (draftTerrainEl) draftTerrainEl.textContent = `Terrain: ${draft.terrain || '(none)'}  `;
            if (draftCoastalEl) draftCoastalEl.textContent = `Coastal: ${draft.coastal}  `;
            if (draftContinentEl) draftContinentEl.textContent = `Continent: ${draft.continent}`;

            // Validation errors
            if (draftErrorsEl) {
                if (draft.errors.length > 0) {
                    draftErrorsEl.style.display = 'block';
                    draftErrorsEl.textContent = draft.errors.join('; ');
                } else {
                    draftErrorsEl.style.display = 'none';
                }
            }

            // Apply button enabled only when draft is valid with pixels
            if (applyBtn) {
                applyBtn.disabled = !draft.valid || draft.pixels.size === 0 || this.paintbrushSavePending;
            }
        }));

        // Apply button: commit and exit
        if (applyBtn) {
            this.addSubscription(fromEvent<PointerEvent>(applyBtn, 'pointerdown').subscribe(e => {
                e.preventDefault();
                e.stopPropagation();
                this.exitPaintbrushMode();
            }));
        }

        // Cancel button: discard and exit
        if (cancelBtn) {
            this.addSubscription(fromEvent<PointerEvent>(cancelBtn, 'pointerdown').subscribe(e => {
                e.preventDefault();
                e.stopPropagation();
                this.cancelPaintbrushMode();
            }));
        }

        // Keep apply disabled while save is pending
        this.addSubscription(this.paintbrushActive$.subscribe(() => {
            if (applyBtn) {
                const draft = this.provinceDraft$.value;
                applyBtn.disabled = !draft?.valid || (draft?.pixels.size ?? 0) === 0 || this.paintbrushSavePending;
            }
        }));
    }

    private loadStateEditButtons() {
        const createStateButton = document.getElementById('create-state-from-selection') as HTMLButtonElement;
        const assignSelectionButton = document.getElementById('assign-selection-to-state') as HTMLButtonElement;
        const assignStrategicButton = document.getElementById('assign-states-to-strategicregion') as HTMLButtonElement | null;
        const createStrategicButton = document.getElementById('create-strategicregion-from-selection') as HTMLButtonElement | null;

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

        if (assignStrategicButton) {
            this.addSubscription(fromEvent<PointerEvent>(assignStrategicButton, 'pointerdown').subscribe(e => {
                e.preventDefault();
                e.stopPropagation();
                this.assignStatesToStrategicRegion();
            }));
        }

        if (createStrategicButton) {
            this.addSubscription(fromEvent<PointerEvent>(createStrategicButton, 'pointerdown').subscribe(e => {
                e.preventDefault();
                e.stopPropagation();
                this.createStrategicRegionFromSelection();
            }));
        }

        this.addSubscription(combineLatest([this.selectedProvinceIds$, this.selectedStateIds$, this.selectedStateId$, this.selectedStrategicRegionId$]).subscribe(([selectedProvinceIds, selectedStateIds, selectedStateId, selectedStrategicRegionId]) => {
            createStateButton.disabled = selectedProvinceIds.size === 0;
            assignSelectionButton.disabled = selectedProvinceIds.size === 0 || selectedStateId === undefined;
            if (assignStrategicButton) {
                // Enabled when either provinces or states are selected, and a target strategic region is chosen
                assignStrategicButton.disabled = (selectedProvinceIds.size === 0 && selectedStateIds.size === 0) || selectedStrategicRegionId === undefined;
            }
            if (createStrategicButton) {
                createStrategicButton.disabled = (selectedProvinceIds.size === 0 && selectedStateIds.size === 0);
            }
        }));
    }

    private loadStrategicRegionEditButtons() {
        const assignToSRButton = document.getElementById('assign-to-strategicregion') as HTMLButtonElement;

        this.addSubscription(fromEvent<PointerEvent>(assignToSRButton, 'pointerdown').subscribe(e => {
            e.preventDefault();
            e.stopPropagation();
            this.assignSelectionToStrategicRegion();
        }));

        this.addSubscription(combineLatest([this.selectedProvinceIds$, this.selectedStrategicRegionId$]).subscribe(([selectedProvinceIds, selectedSRId]) => {
            assignToSRButton.disabled = selectedProvinceIds.size === 0 || selectedSRId === undefined;
        }));
    }

    private loadNewProvinceButton() {
        const newProvinceButton = document.getElementById('new-province') as HTMLButtonElement;

        this.addSubscription(fromEvent<PointerEvent>(newProvinceButton, 'pointerdown').subscribe(e => {
            e.preventDefault();
            e.stopPropagation();
            this.createNewProvince();
        }));

        this.addSubscription(this.selectedProvinceIds$.subscribe(selectedProvinceIds => {
            // Enable only when exactly one province is selected
            newProvinceButton.disabled = selectedProvinceIds.size !== 1;
        }));
    }

    private loadPaintbrushToggleButton() {
        const toggleButton = document.getElementById('toggle-paintbrush') as HTMLButtonElement;
        if (!toggleButton) {
            return;
        }

        this.addSubscription(fromEvent<PointerEvent>(toggleButton, 'pointerdown').subscribe(e => {
            e.preventDefault();
            e.stopPropagation();
            this.togglePaintbrushMode();
        }));

        // Update button visual state when paintbrush mode changes
        this.addSubscription(this.paintbrushActive$.subscribe(active => {
            if (active) {
                toggleButton.classList.add('active');
                toggleButton.style.backgroundColor = 'rgba(0,120,212,0.7)';
            } else {
                toggleButton.classList.remove('active');
                toggleButton.style.backgroundColor = '';
            }
        }));

        // Disable button when loading
        this.addSubscription(this.loader.loading$.subscribe(loading => {
            toggleButton.disabled = loading || this.paintbrushSavePending;
        }));

        // Disable button when a paintbrush save is pending
        this.addSubscription(this.paintbrushActive$.subscribe(() => {
            toggleButton.disabled = this.loader.loading$.value || this.paintbrushSavePending;
        }));
    }

    /**
     * Toggle paintbrush mode on/off.
     * When toggling on with a selected province, use its color for editing.
     * When toggling on without a selection, auto-generate a new color.
     */
    private togglePaintbrushMode() {
        if (this.paintbrushActive$.value) {
            // Turning off: commit changes
            this.exitPaintbrushMode();
        } else {
            // Turning on: enter paintbrush mode
            const selectedIds = Array.from(this.selectedProvinceIds$.value.values());
            let sourceProvince: any = undefined;

            if (selectedIds.length === 1) {
                sourceProvince = this.loader.worldMap.getProvinceById(selectedIds[0]);
            }

            this.enterPaintbrushMode(sourceProvince ?? undefined);
        }
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

    private loadRefreshButton(): void {
        const refresh =
            document.getElementById('refresh') as HTMLButtonElement;

        this.addSubscription(
            fromEvent(refresh, 'click').subscribe(() => {
                if (refresh.disabled) {
                    return;
                }

                sendEvent('worldmap.refresh');

                if (
                    this.paintbrushActive$.value &&
                    this.paintedPixels$.value.size > 0
                ) {
                    this.commitPaintbrushChanges(true);
                    return;
                }

                this.loader.refresh();
            })
        );

        this.addSubscription(
            combineLatest([
                this.loader.loading$,
                this.paintbrushActive$,
            ]).subscribe(([loading]) => {
                refresh.disabled =
                    loading || this.paintbrushSavePending;
            })
        );
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
        this.addSubscription(
            fromEvent<MouseEvent>(canvas, 'mousemove').subscribe((event) => {
                const worldMap = this.loader.worldMap;
                const position = this.eventToMapPosition(canvas, event);

                if (!worldMap || !position) {
                    this.hoverProvinceId$.next(undefined);
                    this.hoverStateId$.next(undefined);
                    this.hoverStrategicRegionId$.next(undefined);
                    this.hoverSupplyAreaId$.next(undefined);
                    return;
                }

                const { x: mapX, y: mapY } = position;

                this.hoverMapX$.next(mapX);
                this.hoverMapY$.next(mapY);

                if (
                    this.paintbrushActive$.value &&
                    this.isPainting &&
                    mapY >= 0 &&
                    mapY < worldMap.height
                ) {
                    this.paintAtPosition(mapX, mapY);
                }

                const province = worldMap.getProvinceByPosition(mapX, mapY);

                this.hoverProvinceId$.next(province?.id);
                this.hoverStateId$.next(
                    province
                        ? worldMap.getStateByProvinceId(province.id)?.id
                        : undefined
                );
                this.hoverStrategicRegionId$.next(
                    province
                        ? worldMap.getStrategicRegionByProvinceId(province.id)?.id
                        : undefined
                );

                const stateId = this.hoverStateId$.value;

                this.hoverSupplyAreaId$.next(
                    stateId === undefined
                        ? undefined
                        : worldMap.getSupplyAreaByStateId(stateId)?.id
                );
            })
        );
    
        this.addSubscription(
            fromEvent(canvas, 'mouseleave').subscribe(() => {
                this.hoverProvinceId$.next(undefined);
                this.hoverStateId$.next(undefined);
                this.hoverStrategicRegionId$.next(undefined);
                this.hoverSupplyAreaId$.next(undefined);

                this.isPainting = false;
            })
        );

        // Ctrl+Left-click: toggle a single province in the selection set (province view)
        // Regular click: clear selection and select just the hovered province (or deselect if already sole selection)
        // Drag selection requires Shift + left mouse down + drag.
        let pressedLeft = false;
        let dragMoved = false;
        let dragStarted = false;

        this.addSubscription(fromEvent<MouseEvent>(canvas, 'mousedown').subscribe((e) => {
            if (e.button === 0) {
                // Paintbrush mode: start painting
                if (this.paintbrushActive$.value) {
                    const position = this.eventToMapPosition(canvas, e);

                    if (
                        position &&
                        position.y >= 0 &&
                        position.y < this.loader.worldMap!.height
                    ) {
                        this.isPainting = true;
                        this.hoverMapX$.next(position.x);
                        this.hoverMapY$.next(position.y);
                        this.paintAtPosition(position.x, position.y);
                    }

                    e.preventDefault();
                    return;
                }

                dragMoved = false;
                dragStarted = false;
                this.dragProcessedProvinceIds.clear();
                this.dragProcessedStateIds.clear();

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
                } else if (this.viewMode$.value === 'state') {
                    const st = this.hoverStateId$.value;
                    if (st !== undefined) {
                        if (e.ctrlKey) {
                            // Ctrl+mousedown: toggle this state immediately and track for drag
                            this.toggleSelectedState(st);
                        } else if (e.shiftKey) {
                            // Shift+mousedown starts drag-selection and adds the hovered state.
                            pressedLeft = true;
                            dragStarted = true;
                            const next = new Set(this.selectedStateIds$.value);
                            next.add(st);
                            this.setSelectedStateIds(next, true);
                        } else {
                            pressedLeft = false;
                        }
                        this.dragProcessedStateIds.add(st);
                    } else {
                        pressedLeft = e.shiftKey;
                    }
                } else {
                    pressedLeft = false;
                }
            }
        }));

        this.addSubscription(fromEvent<MouseEvent>(document.body, 'mousemove').subscribe(() => {
            if (!pressedLeft) {
                return;
            }
            dragMoved = true;
            if (this.viewMode$.value === 'province') {
                const prov = this.hoverProvinceId$.value;
                if (prov !== undefined && !this.dragProcessedProvinceIds.has(prov)) {
                    const next = new Set(this.selectedProvinceIds$.value);
                    next.add(prov);
                    this.setSelectedProvinceIds(next, false);
                    this.dragProcessedProvinceIds.add(prov);
                }
            } else if (this.viewMode$.value === 'state') {
                const st = this.hoverStateId$.value;
                if (st !== undefined && !this.dragProcessedStateIds.has(st)) {
                    const next = new Set(this.selectedStateIds$.value);
                    next.add(st);
                    this.setSelectedStateIds(next, false);
                    this.dragProcessedStateIds.add(st);
                }
            }
        }));

        this.addSubscription(fromEvent<MouseEvent>(document.body, 'mouseup').subscribe(() => {
            // Paintbrush: stop painting but keep the panel open for confirmation.
            // The user must explicitly click Apply or Cancel.
            if (this.isPainting) {
                this.isPainting = false;
                return;
            }

            pressedLeft = false;
            this.dragProcessedProvinceIds.clear();
            this.dragProcessedStateIds.clear();
            if (dragStarted) {
                this.selectionRedoStack.length = 0;
                this.selectionRedoStackStates.length = 0;
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
                    {
                        const st = this.hoverStateId$.value;
                        if (e.ctrlKey) {
                            // Ctrl+click: toggle (already handled on mousedown)
                        } else {
                            if (st !== undefined) {
                                const cur = this.selectedStateIds$.value;
                                if (cur.size === 1 && cur.has(st)) {
                                    this.setSelectedStateIds(new Set(), true);
                                } else {
                                    this.setSelectedStateIds(new Set([st]), true);
                                }
                            } else {
                                this.setSelectedStateIds(new Set(), true);
                            }
                        }
                    }
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
            if (this.viewMode$.value === 'province') {
                const prov = this.hoverProvinceId$.value;
                if (prov !== undefined) {
                    this.toggleVictoryPoint(prov);
                }
            } else {
                this.openMapItem(true);
            }
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

            if (this.matchesShortcut(e, this.keybinds.mapUndo)) {
                e.preventDefault();
                // Paintbrush undo takes priority
                if (this.paintbrushCanUndo$.value) {
                    this.undoPaintbrushEdit();
                    return;
                }
                if (this.undoMapEdit()) {
                    this.showActionStatus(feLocalize('worldmap.action.mapundo', 'Undid last state transfer/create change.'));
                    return;
                }
                this.showActionStatus(feLocalize('worldmap.action.nomapundo', 'No map-edit history to undo.'));
                return;
            }

            if (this.matchesShortcut(e, this.keybinds.mapRedo)) {
                e.preventDefault();
                // Paintbrush redo takes priority
                if (this.paintbrushCanRedo$.value) {
                    this.redoPaintbrushEdit();
                    return;
                }
                if (this.redoMapEdit()) {
                    this.showActionStatus(feLocalize('worldmap.action.mapredo', 'Redid last state transfer/create change.'));
                    return;
                }
                this.showActionStatus(feLocalize('worldmap.action.nomapredo', 'No map-edit history to redo.'));
                return;
            }

            if (this.matchesShortcut(e, this.keybinds.selectionUndo)) {
                e.preventDefault();
                if (this.viewMode$.value === 'state') {
                    this.undoStateSelection();
                } else {
                    this.undoProvinceSelection();
                }
                return;
            }

            if (this.matchesShortcut(e, this.keybinds.selectionRedo)) {
                e.preventDefault();
                if (this.viewMode$.value === 'state') {
                    this.redoStateSelection();
                } else {
                    this.redoProvinceSelection();
                }
                return;
            }

            // Escape cancels paintbrush mode
            if (key === 'escape' && this.paintbrushActive$.value) {
                e.preventDefault();
                this.cancelPaintbrushMode();
                return;
            }

            // P toggles paintbrush mode (when not in an input)
            if (key === 'p' && !e.ctrlKey && !e.altKey && !e.metaKey) {
                e.preventDefault();
                this.togglePaintbrushMode();
                return;
            }

            if (this.matchesShortcut(e, this.keybinds.createStateFromSelection)) {
                e.preventDefault();
                this.createStateFromSelection();
                return;
            }

            if (this.matchesShortcut(e, this.keybinds.assignSelectionToState)) {
                e.preventDefault();
                this.assignSelectionToState();
                return;
            }

            if (this.matchesShortcut(e, this.keybinds.assignSelectionToStrategicRegion)) {
                e.preventDefault();
                this.assignSelectionToStrategicRegion();
                return;
            }

            // New province creation: Ctrl+Alt+P (Paint)
            if (e.ctrlKey && e.altKey && key === 'p') {
                e.preventDefault();
                this.createNewProvince();
            }
        }));
    }

    private matchesShortcut(e: KeyboardEvent, shortcut: ShortcutSpec): boolean {
        return e.key.toLowerCase() === shortcut.key &&
            e.ctrlKey === shortcut.ctrl &&
            e.shiftKey === shortcut.shift &&
            e.altKey === shortcut.alt;
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

        const largeSelectionReplaced = recordHistory && current.size >= 8 && nextSelection.size <= 1;

        if (recordHistory) {
            this.selectionUndoStack.push(new Set(current));
            if (this.selectionUndoStack.length > 200) {
                this.selectionUndoStack.shift();
            }
            this.selectionRedoStack.length = 0;
        }

        this.selectedProvinceIds$.next(new Set(nextSelection));

        if (largeSelectionReplaced) {
            this.showActionStatus(
                feLocalize('worldmap.action.selectionreplaced',
                    'Selection changed from {0} provinces to {1}. Press {2} to restore your previous selection.',
                    current.size,
                    nextSelection.size,
                    this.keybinds.selectionUndo.label),
                'warn');
        }
    }

    private toggleSelectedState(stateId: number) {
        const next = new Set(this.selectedStateIds$.value);
        if (next.has(stateId)) {
            next.delete(stateId);
        } else {
            next.add(stateId);
        }
        this.setSelectedStateIds(next, true);
    }

    private setSelectedStateIds(nextSelection: Set<number>, recordHistory: boolean) {
        const current = this.selectedStateIds$.value;
        if (this.isSameSelection(current, nextSelection)) {
            return;
        }

        const largeSelectionReplaced = recordHistory && current.size >= 8 && nextSelection.size <= 1;

        if (recordHistory) {
            this.selectionUndoStackStates.push(new Set(current));
            if (this.selectionUndoStackStates.length > 200) {
                this.selectionUndoStackStates.shift();
            }
            this.selectionRedoStackStates.length = 0;
        }

        this.selectedStateIds$.next(new Set(nextSelection));

        if (largeSelectionReplaced) {
            this.showActionStatus(
                feLocalize('worldmap.action.selectionreplaced',
                    'Selection changed from {0} provinces to {1}. Press {2} to restore your previous selection.',
                    current.size,
                    nextSelection.size,
                    this.keybinds.selectionUndo.label),
                'warn');
        }
    }

    private undoProvinceSelection() {
        const previous = this.selectionUndoStack.pop();
        if (!previous) {
            this.showActionStatus(feLocalize('worldmap.action.noselectionundo', 'No selection history to undo.'));
            return;
        }

        this.selectionRedoStack.push(new Set(this.selectedProvinceIds$.value));
        this.selectedProvinceIds$.next(previous);
        this.showActionStatus(feLocalize('worldmap.action.selectionundo', 'Restored selection: {0} provinces selected.', previous.size));
    }

    private redoProvinceSelection() {
        const next = this.selectionRedoStack.pop();
        if (!next) {
            this.showActionStatus(feLocalize('worldmap.action.noselectionredo', 'No selection history to redo.'));
            return;
        }

        this.selectionUndoStack.push(new Set(this.selectedProvinceIds$.value));
        this.selectedProvinceIds$.next(next);
        this.showActionStatus(feLocalize('worldmap.action.selectionredo', 'Reapplied selection: {0} provinces selected.', next.size));
    }

    private undoStateSelection() {
        const previous = this.selectionUndoStackStates.pop();
        if (!previous) {
            this.showActionStatus(feLocalize('worldmap.action.noselectionundo', 'No selection history to undo.'));
            return;
        }

        this.selectionRedoStackStates.push(new Set(this.selectedStateIds$.value));
        this.selectedStateIds$.next(previous);
        this.showActionStatus(feLocalize('worldmap.action.selectionundo', 'Restored selection: {0} provinces selected.', previous.size));
    }

    private redoStateSelection() {
        const next = this.selectionRedoStackStates.pop();
        if (!next) {
            this.showActionStatus(feLocalize('worldmap.action.noselectionredo', 'No selection history to redo.'));
            return;
        }

        this.selectionUndoStackStates.push(new Set(this.selectedStateIds$.value));
        this.selectedStateIds$.next(next);
        this.showActionStatus(feLocalize('worldmap.action.selectionredo', 'Reapplied selection: {0} provinces selected.', next.size));
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
            this.showActionStatus(feLocalize('worldmap.action.assign.missingstate', 'Select a target state first, then transfer provinces.'), 'warn');
            return;
        }

        const selectedProvinceIds = Array.from(this.selectedProvinceIds$.value.values());
        if (selectedProvinceIds.length === 0) {
            this.showActionStatus(feLocalize('worldmap.action.assign.missingselection', 'No provinces selected to transfer.'), 'warn');
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
            this.showActionStatus(feLocalize('worldmap.action.assign.done',
                'Transferred {0} provinces to state {1}.',
                selectedProvinceIds.length,
                selectedStateId));
        } else {
            this.showActionStatus(feLocalize('worldmap.action.assign.nochange', 'No provinces were moved.'));
        }
    }

    private showActionStatus(message: string, tone: 'info' | 'warn' = 'info') {
        if (!this.actionStatus) {
            return;
        }

        this.actionStatus.textContent = message;
        this.actionStatus.classList.remove('warn', 'hidden');
        if (tone === 'warn') {
            this.actionStatus.classList.add('warn');
        }

        if (this.actionStatusTimer) {
            clearTimeout(this.actionStatusTimer);
        }

        this.actionStatusTimer = setTimeout(() => {
            this.actionStatus.classList.add('hidden');
        }, 3200);
    }

    private toggleVictoryPoint(provinceId: number) {
        const worldMap = this.loader.worldMap;
        const state = worldMap.getStateByProvinceId(provinceId);
        if (!state) {
            this.showActionStatus(feLocalize('TODO', 'Province {0} is not part of any state.', provinceId), 'warn');
            return;
        }

        const before = worldMap.snapshotStates([state.id]);
        const currentVp = state.victoryPoints[provinceId];

        if (currentVp !== undefined) {
            delete state.victoryPoints[provinceId];
            const after = worldMap.snapshotStates([state.id]);
            this.recordMapEdit(before, after);
            this.persistStates([state.id]);
            this.mapMutation$.next(this.mapMutation$.value + 1);
            this.showActionStatus(feLocalize('TODO', 'Removed victory point from province {0} in state {1}.', provinceId, state.id));
        } else {
            state.victoryPoints[provinceId] = 1;
            const after = worldMap.snapshotStates([state.id]);
            this.recordMapEdit(before, after);
            this.persistStates([state.id]);
            this.mapMutation$.next(this.mapMutation$.value + 1);
            const localisationKey = `VICTORY_POINT_${state.id}`;
            vscode.postMessage<WorldMapMessage>({
                command: 'persistvictorypointlocalisation',
                key: localisationKey,
                value: `Victory Point ${state.id}`,
                stateId: state.id,
            } as WorldMapMessage);
            this.showActionStatus(feLocalize('TODO', 'Added victory point (value=1) to province {0} in state {1}. Localisation key: {2}', provinceId, state.id, localisationKey));
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

    private assignSelectionToStrategicRegion() {
        const selectedSRId = this.selectedStrategicRegionId$.value;
        if (selectedSRId === undefined) {
            return;
        }

        const selectedProvinceIds = Array.from(this.selectedProvinceIds$.value.values());
        if (selectedProvinceIds.length === 0) {
            return;
        }

        const affectedSRIds = new Set<number>([selectedSRId]);
        for (const provinceId of selectedProvinceIds) {
            const sourceSR = this.loader.worldMap.getStrategicRegionByProvinceId(provinceId);
            if (sourceSR) {
                affectedSRIds.add(sourceSR.id);
            }
        }
        const before = this.loader.worldMap.snapshotStrategicRegions(Array.from(affectedSRIds.values()));

        const changedSRIds = this.loader.worldMap.assignProvincesToStrategicRegion(selectedProvinceIds, selectedSRId);
        if (changedSRIds && changedSRIds.length > 0) {
            const after = this.loader.worldMap.snapshotStrategicRegions(changedSRIds);
            this.recordMapEdit(before, after);
            this.persistStrategicRegions(changedSRIds);
            this.mapMutation$.next(this.mapMutation$.value + 1);
        }
    }

    private createNewProvince() {
        const selectedProvinceIds = Array.from(this.selectedProvinceIds$.value.values());
        if (selectedProvinceIds.length !== 1) {
            return;
        }

        const targetProvinceId = selectedProvinceIds[0];
        const targetProvince = this.loader.worldMap.getProvinceById(targetProvinceId);
        if (!targetProvince) {
            return;
        }

        // Enter paintbrush mode with a NEW colour, inheriting metadata
        // from the source province (type, terrain, coastal, continent).
        this.enterPaintbrushMode(targetProvince, /* useExistingColor */ false);
    }

    /**
     * Enter paintbrush mode with an auto-selected color.
     * @param targetProvince - Optional source province for metadata inheritance.
     * @param useExistingColor - When true, paint with targetProvince's existing
     *   colour (edit boundaries). When false, auto-generate a new colour
     *   (create a brand-new province).
     */
    private enterPaintbrushMode(targetProvince?: any, useExistingColor = true) {
        let nextColor: number | undefined;

        if (targetProvince && useExistingColor) {
            // Edit boundaries of an existing province -  reuse its colour.
            nextColor = targetProvince.color;
        } else {
            // Create a new province -  generate a fresh, unused colour.
            nextColor = this.loader.worldMap.findNextProvinceColor?.() ?? this.findNextAvailableColor();
        }

        if (nextColor === undefined) {
            return; // No available colors
        }

        // Capture the full multi-selection for clamping.
        const clampedIds = new Set(this.selectedProvinceIds$.value);

        // Create a draft that accumulates painted pixels without mutating
        // the live map.  The live map is only touched on Apply.
        const sourceId = targetProvince?.id ?? 0;
        const inheritedTerrain = targetProvince?.terrain || 'plains';
        const draft: ProvinceDraft = {
            sourceProvinceId: sourceId,
            color: nextColor,
            pixels: new Map(),
            type: targetProvince?.type ?? 'land',
            terrain: inheritedTerrain,
            coastal: targetProvince?.coastal ?? false,
            continent: targetProvince?.continent ?? 0,
            valid: true,
            errors: [],
        };

        // Only flag missing terrain when we had a source province that
        // genuinely lacked it (editor data problem), not when creating
        // from nothing with a safe default.
        if (targetProvince && !targetProvince.terrain) {
            draft.valid = false;
            draft.errors.push('Source province has no terrain defined.');
        }

        // Save previous province definitions for undo
        this.paintbrushPreviousProvinces = this.collectCurrentProvinceDefs();

        // Store source province type for land/water clamping
        this.sourceProvinceType = targetProvince?.type ?? 'land';

        // Set paintbrush state
        this.paintbrushColor$.next(nextColor);
        this.paintedPixels$.next(new Map());
        this.provinceDraft$.next(draft);
        this.paintbrushActive$.next(true);
        this.paintbrushCanUndo$.next(false);
        this.paintbrushCanRedo$.next(false);

        // Show the confirmation panel immediately (belt-and-suspenders
        // with the subscription-based approach in loadPaintbrushPanel).
        const panel = document.getElementById('paintbrush-panel');
        if (panel) {
            panel.style.display = 'block';
        }

        sendEvent('worldmap.paintbrush.enter');
    }

    /**
     * Commit the current ProvinceDraft to the live map and persist.
     */
    private commitPaintbrushChanges(refreshAfterSave = false): void {
        const draft = this.provinceDraft$.value;

        if (!this.paintbrushActive$.value || this.paintbrushSavePending || !draft) {
            if (refreshAfterSave && !this.paintbrushSavePending) {
                this.loader.refresh();
            }
            return;
        }

        if (draft.pixels.size === 0 || !draft.valid) {
            this.finishPaintbrushSession();

            if (refreshAfterSave) {
                this.loader.refresh();
            }

            return;
        }

        // Apply the draft pixels to the live map and rebuild data structures.
        const { affectedProvinceIds, newProvinceId } =
            this.loader.worldMap.applyPaintbrushEdits(
                draft.pixels,
                draft.sourceProvinceId || undefined
            );

        const provinces = Array.from(new Set(affectedProvinceIds))
            .map(id => this.loader.worldMap.getProvinceById(id))
            .filter((province): province is NonNullable<typeof province> => {
                return province !== undefined;
            })
            .map(province => ({
                id: province.id,
                color: province.color,
                type: province.type,
                coastal: province.coastal,
                terrain: province.terrain,
                continent: province.continent,
            }));

        const pixelArray: number[][] = [];

        for (const [key, color] of draft.pixels) {
            const [x, y] = key.split(',').map(Number);
            pixelArray.push([x, y, color]);
        }

        const undoBaseline =
            this.paintbrushPreviousProvinces ?? undefined;

        this.paintbrushSavePending = true;
        this.refreshAfterPaintbrushSave = refreshAfterSave;

        vscode.postMessage({
            command: 'persistprovincebmp',
            paintedPixels: pixelArray,
            width: this.loader.worldMap.width,
            height: this.loader.worldMap.height,
            provinces,
            previousProvinces: undoBaseline,
            targetProvinceId: draft.sourceProvinceId || 0,
        } as any);

        // Clear draft pixels; the draft itself stays until finishPaintbrushSession.
        this.paintedPixels$.next(new Map());
        this.provinceDraft$.next({ ...draft, pixels: new Map() });

        this.paintbrushPreviousProvinces = this.collectCurrentProvinceDefs();

        if (newProvinceId !== undefined) {
            this.selectedProvinceIds$.next(new Set([newProvinceId]));
        }

        sendEvent('worldmap.paintbrush.commit', {
            pixelCount: draft.pixels.size.toString(),
        });
    }

    /**
     * Exit paintbrush mode and persist changes atomically.
     */
    private exitPaintbrushMode(): void {
        this.commitPaintbrushChanges(false);
    }

    /**
     * Clean up paintbrush session state after a commit completes.
     * Resets all session-scoped state; the session is fully done.
     */
    private finishPaintbrushSession(): void {
        this.paintbrushActive$.next(false);
        this.paintbrushColor$.next(0);
        this.paintedPixels$.next(new Map());
        this.provinceDraft$.next(undefined);
        this.brushSize$.next(1);

        this.paintbrushPreviousProvinces = null;
        this.sourceProvinceType = 'land';
        this.paintbrushSavePending = false;
        this.refreshAfterPaintbrushSave = false;
        this.isPainting = false;

        // Hide the confirmation panel directly.
        const panel = document.getElementById('paintbrush-panel');
        if (panel) {
            panel.style.display = 'none';
        }

        this.mapMutation$.next(this.mapMutation$.value + 1);
    }

    /**
     * Cancel paintbrush mode.  Discards the draft without touching the
     * live map -  no reload is necessary.
     */
    private cancelPaintbrushMode() {
        if (!this.paintbrushActive$.value) {
            return;
        }

        this.paintbrushActive$.next(false);
        this.paintbrushColor$.next(0);
        this.paintedPixels$.next(new Map());
        this.provinceDraft$.next(undefined);
        this.brushSize$.next(1);
        this.paintbrushPreviousProvinces = null;
        this.sourceProvinceType = 'land';
        this.paintbrushSavePending = false;
        this.refreshAfterPaintbrushSave = false;
        this.isPainting = false;

        // Hide the confirmation panel directly.
        const panel = document.getElementById('paintbrush-panel');
        if (panel) {
            panel.style.display = 'none';
        }

        // No reload needed -  the live map was never mutated.
        this.mapMutation$.next(this.mapMutation$.value + 1);
        sendEvent('worldmap.paintbrush.cancel');
    }

    /**
     * Paint a pixel at the given map coordinates.
     * Writes to the ProvinceDraft's pixel mask ONLY -  the live
     * worldMap.colorByPosition is NOT mutated until Apply.
     * Painting is clamped to the set of provinces that were selected
     * when paintbrush mode was entered.
     * Handles world wrapping for the brush radius.
     */
    private paintAtPosition(mapX: number, mapY: number) {
        const draft = this.provinceDraft$.value;
        if (!this.paintbrushActive$.value || !draft) {
            return;
        }

        const worldMap = this.loader.worldMap;
        const color = this.paintbrushColor$.value;
        const brushSize = this.brushSize$.value;
        const isSourceSea = this.sourceProvinceType === 'sea';
        const mapWidth = worldMap.width;
        const mapHeight = worldMap.height;

        // Build the set of allowed province IDs for clamping.
        // Uses the full multi-selection when multiple provinces are selected,
        // otherwise clamps to the single source province.  If nothing is
        // selected, painting is unrestricted.
        const allowedProvinceIds = new Set(this.selectedProvinceIds$.value);
        const hasClamp = allowedProvinceIds.size > 0;

        let anyPainted = false;

        // Accumulate new pixels locally, then push once at the end
        // to avoid a cascade of re-renders on every pixel.
        const newDraftPixels = new Map(draft.pixels);
        const newOverlayPixels = new Map(this.paintedPixels$.value);

        // Paint all pixels within brush radius
        const radius = Math.max(0, Math.floor((brushSize - 1) / 2));
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                let px = mapX + dx;
                const py = mapY + dy;

                // Skip out-of-bounds Y (no vertical wrapping)
                if (py < 0 || py >= mapHeight) {
                    continue;
                }

                // Wrap X horizontally for seamless world-map painting
                px = ((px % mapWidth) + mapWidth) % mapWidth;

                const currentColor = worldMap.getColorAt(px, py);
                // Skip uncolored pixels (0) and pixels already matching our color
                if (currentColor === undefined || currentColor === 0 || currentColor === color) {
                    continue;
                }

                // Province clamping: only paint within the selected province(s).
                if (hasClamp) {
                    const provinceAtPixel = worldMap.getProvinceByPosition(px, py);
                    if (!provinceAtPixel || !allowedProvinceIds.has(provinceAtPixel.id)) {
                        continue;
                    }
                }

                // Land/water clamping: only paint over compatible province types
                const targetType = worldMap.getProvinceTypeAt(px, py);
                if (targetType !== undefined) {
                    const targetIsSea = targetType === 'sea';
                    if (isSourceSea !== targetIsSea) {
                        continue; // skip: can't paint sea over land or land over sea
                    }
                }

                const key = `${px},${py}`;
                newDraftPixels.set(key, color);
                newOverlayPixels.set(key, color);
                anyPainted = true;
            }
        }

        if (anyPainted) {
            // Push both the updated draft and overlay in one batch.
            draft.pixels = newDraftPixels;
            this.provinceDraft$.next({ ...draft });
            this.paintedPixels$.next(newOverlayPixels);
            this.mapMutation$.next(this.mapMutation$.value + 1);
        }
    }

    /**
     * Find the next available color for a new province.
     */
    private findNextAvailableColor(): number | undefined {
        const result = this.loader.worldMap.findNextProvinceColor();
        if (result !== undefined) {
            return result;
        }

        let maxColor = 0;
        this.loader.worldMap.forEachProvince(p => {
            if (p.color > maxColor) maxColor = p.color;
        });

        if (maxColor >= 0xFFFFFF) {
            const used = new Set<number>();
            this.loader.worldMap.forEachProvince(p => { used.add(p.color); });
            for (let c = 1; c < 0xFFFFFF; c++) {
                if (!used.has(c)) return c;
            }
            return undefined;
        }
        return maxColor + 1;
    }

    /**
     * Collect current province definitions for undo snapshot.
     */
    private collectCurrentProvinceDefs(): any[] {
        const defs: any[] = [];
        this.loader.worldMap.forEachProvince(p => {
            defs.push({
                id: p.id,
                color: p.color,
                type: p.type,
                coastal: p.coastal,
                terrain: p.terrain,
                continent: p.continent,
            });
        });
        return defs;
    }

    /**
     * Undo the last paintbrush BMP edit via the backend.
     */
    private undoPaintbrushEdit() {
        vscode.postMessage({ command: 'undoprovincebmp' } as any);
        this.paintbrushCanUndo$.next(false);
    }

    /**
     * Redo the last undone paintbrush BMP edit via the backend.
     */
    private redoPaintbrushEdit() {
        vscode.postMessage({ command: 'redoprovincebmp' } as any);
        this.paintbrushCanRedo$.next(false);
    }

    private persistStrategicRegions(srIds: number[], deletedFiles: string[] = []) {
        const payload = Array.from(new Set(srIds))
            .map(id => this.loader.worldMap.getStrategicRegionById(id))
            .filter((sr): sr is NonNullable<typeof sr> => !!sr)
            .map(sr => ({
                id: sr.id,
                name: sr.name,
                provinces: [...sr.provinces],
                navalTerrain: sr.navalTerrain,
                file: sr.file,
                tokenStart: sr.token?.start,
                tokenEnd: sr.token?.end,
            }));

        if (payload.length > 0 || deletedFiles.length > 0) {
            vscode.postMessage<WorldMapMessage>({
                command: 'persiststrategicregions',
                strategicRegions: payload,
                deletedFiles: Array.from(new Set(deletedFiles)),
            } as any);
        }
    }

    private persistProvinces(provinceIds: number[], deletedFiles: string[] = []) {
        const payload = Array.from(new Set(provinceIds))
            .map(id => this.loader.worldMap.getProvinceById(id))
            .filter((p): p is NonNullable<typeof p> => !!p)
            .map(p => ({
                id: p.id,
                color: p.color,
                type: p.type,
                coastal: p.coastal,
                terrain: p.terrain,
                continent: p.continent,
            }));

        if (payload.length > 0 || deletedFiles.length > 0) {
            vscode.postMessage<WorldMapMessage>({
                command: 'persistprovinces',
                provinces: payload,
                deletedFiles: Array.from(new Set(deletedFiles)),
            } as any);
        }
    }

    private createStrategicRegionFromSelection() {
        const explicitStateSelection = Array.from(this.selectedStateIds$.value.values());
        const selectedProvinceIds = Array.from(this.selectedProvinceIds$.value.values());

        const selectedStateIds = new Set<number>(explicitStateSelection.length > 0 ? explicitStateSelection : []);
        if (selectedStateIds.size === 0) {
            for (const provinceId of selectedProvinceIds) {
                const s = this.loader.worldMap.getStateByProvinceId(provinceId);
                if (s) selectedStateIds.add(s.id);
            }
        }

        if (selectedStateIds.size === 0) {
            this.showActionStatus(feLocalize('worldmap.action.createstrategic.missingselection', 'No states selected to create strategic region from.'), 'warn');
            return;
        }

        const nextId = this.loader.worldMap.getNextStrategicRegionId();
        const beforeIds = new Set<number>([nextId]);
        for (const stateId of selectedStateIds) {
            const st = this.loader.worldMap.getStateById(stateId);
            if (st) {
                for (const pid of st.provinces) {
                    const src = this.loader.worldMap.getStrategicRegionByProvinceId(pid);
                    if (src) beforeIds.add(src.id);
                }
            }
        }

        const before = this.loader.worldMap.snapshotStrategicRegions(Array.from(beforeIds.values()));

        const created = this.loader.worldMap.createStrategicRegionFromStates(Array.from(selectedStateIds.values()));
        if (created !== undefined) {
            const after = this.loader.worldMap.snapshotStrategicRegions(created.changedRegionIds);
            this.recordMapEdit(before, after, 'strategicregion');
            this.persistStrategicRegions(created.changedRegionIds);
            this.selectedStrategicRegionId$.next(created.newStrategicRegionId);
            this.mapMutation$.next(this.mapMutation$.value + 1);
            this.showActionStatus(feLocalize('worldmap.action.createstrategic.done', 'Created strategic region {0} from selection.', created.newStrategicRegionId));
        } else {
            this.showActionStatus(feLocalize('worldmap.action.createstrategic.nochange', 'No strategic region was created.'), 'warn');
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
                owner: solveWithCondition(state.owner, this.selectedConditions$.value),
                provinces: [...state.provinces],
                cores: solveWithConditionAsSet(state.cores, this.selectedConditions$.value),
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

    private assignStatesToStrategicRegion() {
        const selectedStrategicRegionId = this.selectedStrategicRegionId$.value;
        if (selectedStrategicRegionId === undefined) {
            this.showActionStatus(feLocalize('worldmap.action.assignstrategic.missingregion', 'Select a target strategic region first, then add states.'), 'warn');
            return;
        }

        const selectedProvinceIds = Array.from(this.selectedProvinceIds$.value.values());
        const explicitStateSelection = Array.from(this.selectedStateIds$.value.values());
        if (selectedProvinceIds.length === 0 && explicitStateSelection.length === 0) {
            this.showActionStatus(feLocalize('worldmap.action.assignstrategic.missingselection', 'No states selected to add.'), 'warn');
            return;
        }

        const selectedStateIds = new Set<number>(explicitStateSelection.length > 0 ? explicitStateSelection : []);
        if (selectedStateIds.size === 0) {
            for (const provinceId of selectedProvinceIds) {
                const s = this.loader.worldMap.getStateByProvinceId(provinceId);
                if (s) selectedStateIds.add(s.id);
            }
        }

        if (selectedStateIds.size === 0) {
            this.showActionStatus(feLocalize('worldmap.action.assignstrategic.missingselection', 'No states selected to add.'), 'warn');
            return;
        }

        const affectedRegionIds = new Set<number>([selectedStrategicRegionId]);
        for (const provinceId of selectedProvinceIds) {
            const src = this.loader.worldMap.getStrategicRegionByProvinceId(provinceId);
            if (src) affectedRegionIds.add(src.id);
        }

        const before = this.loader.worldMap.snapshotStrategicRegions(Array.from(affectedRegionIds.values()));

        const changed = this.loader.worldMap.assignStatesToStrategicRegion(Array.from(selectedStateIds.values()), selectedStrategicRegionId);
        if (changed && changed.length > 0) {
            const after = this.loader.worldMap.snapshotStrategicRegions(changed);
            this.recordMapEdit(before, after, 'strategicregion');
            this.persistStrategicRegions(changed);
            this.mapMutation$.next(this.mapMutation$.value + 1);
            this.showActionStatus(feLocalize('worldmap.action.assignstrategic.done', 'Added {0} states to strategic region {1}.', selectedStateIds.size, selectedStrategicRegionId));
        } else {
            this.showActionStatus(feLocalize('worldmap.action.assignstrategic.nochange', 'No states were moved.'));
        }
    }

    private recordMapEdit(before: any[], after: any[], type: 'state' | 'strategicregion' | 'province' = 'state') {
        // Detect type from first element if not provided
        if (before.length > 0 && (before[0] as any).strategicRegion !== undefined) {
            type = 'strategicregion';
        } else if (before.length > 0 && (before[0] as any).province !== undefined) {
            type = 'province';
        }

        this.mapUndoStack.push({ type, before, after });
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

        switch (action.type) {
            case 'strategicregion':
                this.loader.worldMap.restoreStrategicRegions(action.before as StrategicRegionSnapshot[]);
                break;
            case 'province':
                this.loader.worldMap.restoreProvinces(action.before as ProvinceSnapshot[]);
                break;
            default:
                this.loader.worldMap.restoreStates(action.before as StateSnapshot[]);
                break;
        }

        this.mapRedoStack.push(action);
        const persister = this.getPersistenceTargets(action.before, action.after, action.type);
        this.applyPersistence(persister, action.type);
        this.mapMutation$.next(this.mapMutation$.value + 1);
        return true;
    }

    private redoMapEdit(): boolean {
        const action = this.mapRedoStack.pop();
        if (!action) {
            return false;
        }

        switch (action.type) {
            case 'strategicregion':
                this.loader.worldMap.restoreStrategicRegions(action.after as StrategicRegionSnapshot[]);
                break;
            case 'province':
                this.loader.worldMap.restoreProvinces(action.after as ProvinceSnapshot[]);
                break;
            default:
                this.loader.worldMap.restoreStates(action.after as StateSnapshot[]);
                break;
        }

        this.mapUndoStack.push(action);
        const persister = this.getPersistenceTargets(action.after, action.before, action.type);
        this.applyPersistence(persister, action.type);
        this.mapMutation$.next(this.mapMutation$.value + 1);
        return true;
    }

    private getPersistenceTargets(target: any[], source: any[], type: 'state' | 'strategicregion' | 'province'): { ids: number[]; deletedFiles: string[] } {
        const ids: number[] = [];
        const deletedFiles: string[] = [];

        const sourceById: Record<number, any> = {};
        for (const snapshot of source) {
            sourceById[snapshot.id] = type === 'strategicregion' ? snapshot.strategicRegion :
                type === 'province' ? snapshot.province : snapshot.state;
        }

        for (const snapshot of target) {
            const current = type === 'strategicregion' ? snapshot.strategicRegion :
                type === 'province' ? snapshot.province : snapshot.state;

            if (current) {
                ids.push(snapshot.id);
                continue;
            }

            const previous = sourceById[snapshot.id];
            if (previous && previous.token === null) {
                deletedFiles.push(previous.file);
            }
        }

        return { ids, deletedFiles };
    }

    private applyPersistence(persister: { ids: number[]; deletedFiles: string[] }, type: 'state' | 'strategicregion' | 'province') {
        switch (type) {
            case 'strategicregion':
                this.persistStrategicRegions(persister.ids, persister.deletedFiles);
                break;
            case 'province':
                this.persistProvinces(persister.ids, persister.deletedFiles);
                break;
            default:
                this.persistStates(persister.ids, persister.deletedFiles);
                break;
        }
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
