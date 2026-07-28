import { Subscriber, toBehaviorSubject } from "../util/event";
import { Loader, FEWorldMap, StateSnapshot, StrategicRegionSnapshot, ProvinceSnapshot } from "./loader";
import { ViewPoint } from "./viewpoint";
import { vscode } from "../util/vscode";
import { PersistedState, WorldMapMessage, WorldMapWarning, ProvinceDraft, WorldMapRuntimeTestOptimization } from "../../src/previewdef/worldmap/definitions";
import { feLocalize } from "../util/i18n";
import { DivDropdown } from "../util/dropdown";
import { ContextMenu, ContextMenuItem } from "../util/contextmenu";
import { BehaviorSubject, combineLatest, fromEvent } from 'rxjs';
import { Renderer, solveWithCondition, solveWithConditionAsSet } from './renderer';
import { sendEvent } from '../util/telemetry';
import { getState, setState } from "../util/common";
import { ConditionItem, conditionItemToStringValue, conditionToString, stringValueToConditionItem } from "../../src/hoiformat/condition";
import { Zone } from "../../src/previewdef/worldmap/definitions";
import { applyBrushStroke, getBrushBounds, getInterpolatedBrushPositions } from "./brush";
import { PaintDraftHistory } from "./paintdraft";
import { ProvinceSelectionHistory, ProvinceSelectionSnapshot, selectProvinceIds, selectRiverProvinceIds } from "./selection";
import { OceanTileReadinessIssue, verifyOceanTileReadiness } from "../../src/previewdef/worldmap/areaoperations";

export type ViewMode = 'province' | 'state' | 'strategicregion' | 'supplyarea' | 'warnings' | 'country';
export type ColorSet = 'provinceid' | 'provincetype' | 'terrain' | 'owner' | 'controller' | 'stateid' | 'manpower' |
    'victorypoint' | 'continent' | 'warnings' | 'strategicregionid' | 'supplyareaid' | 'supplyvalue' | 'resources' | 'statecategory';

export const topBarHeight = 68;

const renderOptimizationValues = new Set<WorldMapRuntimeTestOptimization>([
    'webgl2-base',
    'warning-index',
    'edge-decimation',
    'river-device-pixel-collapse',
    'label-grid-dedupe',
    'coarse-provinces',
]);

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

function getConfirmNewProvinceCreation(): boolean {
    const value = (window as any)['__confirmNewProvinceCreation'];
    return value !== false;
}

function getAutoCoreTransfers(): boolean {
    return (window as any)['__autoCoreTransfers'] === true;
}

export class TopBar extends Subscriber {
    public viewMode$: BehaviorSubject<ViewMode>;
    public colorSet$: BehaviorSubject<ColorSet>;
    public hoverProvinceId$: BehaviorSubject<number | undefined>;
    // Backward-compat alias for older callers/tools expecting a single selected province stream
    public selectedProvinceId$: BehaviorSubject<number | undefined>;
    public selectedProvinceIds$: BehaviorSubject<Set<number>>;
    /** River components whose exact rivers.bmp pixels form the active selection overlay. */
    public selectedRiverIds$: BehaviorSubject<Set<number>>;
    public selectedStateIds$: BehaviorSubject<Set<number>>;
    public hoverStateId$: BehaviorSubject<number | undefined>;
    public selectedStateId$: BehaviorSubject<number | undefined>;
    public hoverStrategicRegionId$: BehaviorSubject<number | undefined>;
    public selectedStrategicRegionId$: BehaviorSubject<number | undefined>;
    public hoverSupplyAreaId$: BehaviorSubject<number | undefined>;
    public selectedSupplyAreaId$: BehaviorSubject<number | undefined>;
    public hoverCountryTag$: BehaviorSubject<string | undefined>;
    public selectedCountryTag$: BehaviorSubject<string | undefined>;
    public mapMutation$: BehaviorSubject<number>;
    public selectedConditions$: BehaviorSubject<ConditionItem[]>;
    public warningFilter: DivDropdown;
    public display: DivDropdown;
    public conditions: DivDropdown;
    /** Explicitly enabled experimental render optimizations. Empty by default. */
    public renderOptimizations$: BehaviorSubject<ReadonlySet<WorldMapRuntimeTestOptimization>>;
    /** Whether enabling an experimental render optimization requires confirmation. */
    public renderOptimizationConfirmationRequired$: BehaviorSubject<boolean>;

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
    private pendingProvinceMerge: { targetId: number; sourceCount: number } | undefined;
    /** Whether to refresh after the pending paintbrush save completes */
    private refreshAfterPaintbrushSave = false;
    private mergeRequestSequence = 0;
    private pendingStateMerge: {
        requestId: string;
        targetId: number;
        sourceCount: number;
        before: StateSnapshot[];
        after: StateSnapshot[];
    } | undefined;
    /** Can redo a paintbrush operation */
    public paintbrushCanRedo$: BehaviorSubject<boolean>;

    public warningsVisible: boolean = false;
    private warningsFilterByViewMode: boolean = false;
    private warningsFilterByColorSet: boolean = false;
    private exportIncludeBorder: boolean = true;
    private pendingExport: { bbox: Zone; includeBorder: boolean } | undefined;
    private contextMenu: ContextMenu = new ContextMenu();
    private pendingPuppetWrite = false;
    private countryActionMode: 'puppet' | 'annex' | 'transfer' = 'puppet';
    private autoCoreTransfers = getAutoCoreTransfers();
    private pendingCreatedCountryStateIds: number[] = [];
    private areaPerContinent = getState().areaPerContinent === true;
    private areaIncludeWasteland = getState().areaIncludeWasteland === true;
    private areaOperationPending = false;
    private continentPipelinePending = false;
    private selectedContinentPipelineId: number | undefined;
    private continentPipelineQueue: Array<{ continentId: number; targetCountryTag: string }> = [];
    private continentPipelineTotals = { provinces: 0, states: 0, regions: 0, records: 0, completed: 0 };
    private removeAllCoresPending = false;
    private reindexPending = false;
    private pendingConfirmedAreaOperation: {
        operation: import('../../src/previewdef/worldmap/definitions').AreaOperation;
        provinceIds: number[];
        stateIds: number[];
        perContinent: boolean;
        reindexAfter: boolean;
        riverIds: number[];
    } | undefined;
    private pendingConfirmedAction: (() => void) | undefined;
    private paintTool: 'brush' | 'fill' | 'erase' = 'brush';
    private paintDraftHistory = new PaintDraftHistory();
    private paintStrokeHistoryRecorded = false;
    private paintDraftCanUndo$ = new BehaviorSubject<boolean>(false);
    private paintDraftCanRedo$ = new BehaviorSubject<boolean>(false);
    private paintAllowedProvinceIds: Set<number> | undefined;
    private transferWandActive = false;
    private transferWandTargetStateId: number | undefined;
    private transferWandOwner: string | undefined;
    private transferWandController: string | undefined;

    /** Whether to show the confirmation dialog before creating a new province (mirrors the `worldMapConfirmNewProvinceCreation` setting). */
    private confirmNewProvinceCreation: boolean = getConfirmNewProvinceCreation();
    /** Last map position painted during the current stroke, used to interpolate a continuous line between mousemove events. */
    private lastPaintMapPosition: { x: number; y: number } | undefined;

    private searchBox: HTMLInputElement;
    private dragProcessedProvinceIds: Set<number>;
    private dragProcessedStateIds: Set<number>;
    private provinceSelectionHistory: ProvinceSelectionHistory;
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
            groupElement.hidden = true;
        }
        this.addSubscription(loader.worldMap$.subscribe(this.setupConditions));

        this.viewMode$ = toBehaviorSubject(document.getElementById('viewmode') as HTMLSelectElement, state.viewMode ?? 'province');
        this.colorSet$ = toBehaviorSubject(document.getElementById('colorset') as HTMLSelectElement, state.colorSet ?? 'provinceid');
        this.hoverProvinceId$ = new BehaviorSubject<number | undefined>(undefined);
        this.selectedProvinceIds$ = new BehaviorSubject<Set<number>>(new Set<number>(state.selectedProvinceIds ?? []));
        this.selectedRiverIds$ = new BehaviorSubject<Set<number>>(new Set<number>());
        this.selectedProvinceId$ = new BehaviorSubject<number | undefined>(state.selectedProvinceId ?? state.selectedProvinceIds?.[0] ?? undefined);
        this.selectedStateIds$ = new BehaviorSubject<Set<number>>(new Set<number>(state.selectedStateIds ?? []));
        this.hoverStateId$ = new BehaviorSubject<number | undefined>(undefined);
        this.selectedStateId$ = new BehaviorSubject<number | undefined>(state.selectedStateId ?? undefined);
        this.hoverStrategicRegionId$ = new BehaviorSubject<number | undefined>(undefined);
        this.selectedStrategicRegionId$ = new BehaviorSubject<number | undefined>(state.selectedStrategicRegionId ?? undefined);
        this.hoverSupplyAreaId$ = new BehaviorSubject<number | undefined>(undefined);
        this.selectedSupplyAreaId$ = new BehaviorSubject<number | undefined>(state.selectedSupplyAreaId ?? undefined);
        this.hoverCountryTag$ = new BehaviorSubject<string | undefined>(undefined);
        this.selectedCountryTag$ = new BehaviorSubject<string | undefined>(state.selectedCountryTag ?? undefined);
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
        this.renderOptimizations$ = new BehaviorSubject<ReadonlySet<WorldMapRuntimeTestOptimization>>(
            new Set<WorldMapRuntimeTestOptimization>(
                (state.renderOptimizations ?? []).filter(
                    (value: unknown): value is WorldMapRuntimeTestOptimization =>
                        typeof value === 'string' &&
                        renderOptimizationValues.has(value as WorldMapRuntimeTestOptimization)
                )
            )
        );
        this.renderOptimizationConfirmationRequired$ = new BehaviorSubject<boolean>(
            state.renderOptimizationConfirmationRequired !== false
        );
        this.dragProcessedProvinceIds = new Set<number>();
        this.dragProcessedStateIds = new Set<number>();
        this.provinceSelectionHistory = new ProvinceSelectionHistory();
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
            this.display.selectedValues$.next(
                this.display.selectedValues$.value.filter(
                    value => value !== 'oceanstateboundary' && value !== 'compacttooltip'
                )
            );
        }

        this.addSubscription(this.selectedProvinceIds$.subscribe(set => {
            if (this.selectedRiverIds$.value.size > 0) {
                this.selectedRiverIds$.next(new Set<number>());
            }
            this.selectedProvinceId$.next(set.values().next().value);
        }));

        // Wire brush size dropdown
        const brushSizeSelect = document.getElementById('brushsize') as HTMLSelectElement;
        if (brushSizeSelect) {
            this.brushSize$.next(getBrushBounds(parseInt(brushSizeSelect.value, 10)).size);
            this.addSubscription(fromEvent(brushSizeSelect, 'change').subscribe(() => {
                this.brushSize$.next(getBrushBounds(parseInt(brushSizeSelect.value, 10)).size);
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
                    this.pendingProvinceMerge = undefined;
                    this.refreshAfterPaintbrushSave = false;

                    console.error(
                        'Province BMP persistence failed:',
                        data.error
                    );
                    this.showActionStatus(
                        data.error ?? feLocalize('worldmap.action.mergeprovinces.savefailed', 'Province changes could not be saved. The map was reloaded without the merge.'),
                        'warn'
                    );

                    // Restore authoritative geometry after any optimistic
                    // paint/merge mutation when persistence did not complete.
                    this.loader.refresh();

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
                const completedProvinceMerge = this.pendingProvinceMerge;
                this.pendingProvinceMerge = undefined;

                if (shouldRefresh) {
                    this.loader.refresh();
                }
                if (completedProvinceMerge) {
                    this.showActionStatus(
                        feLocalize(
                            'worldmap.action.mergeprovinces.done',
                            'Merged {0} provinces into province {1} and updated state/strategic-region membership.',
                            completedProvinceMerge.sourceCount,
                            completedProvinceMerge.targetId
                        )
                    );
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

        this.addSubscription(this.contextMenu);
        this.loadControls();
        this.registerEventListeners(canvas);
    }

    private setupConditions = (worldMap: FEWorldMap) => {
        this.conditions.setupOptions(worldMap.conditionExprs.map(option => ({ value: conditionItemToStringValue(option), text: conditionToString(option) })));
        const selectedConditions = getState().selectedConditions ?? [];
        this.conditions.selectedValues$.next(selectedConditions);
        const groupElement = this.conditions.select.closest<HTMLDivElement>('.group');
        if (groupElement) {
            /*
             * Do not set an inline display value here. The topbar depends on
             * `.group { display: inline-flex; }`; using inline-block collapses
             * the flex-sized dropdown container to its zero-width basis.
             */
            groupElement.hidden = worldMap.conditionExprs.length === 0;
            window.dispatchEvent(new Event('resize'));
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
            (v as HTMLDivElement).style.display = 'inline-flex';
        });
    
        if (colorSetHidden) {
            const newColorset = (document.querySelector('#colorset > option:not(*[hidden])') as HTMLOptionElement)?.value;
            this.colorSet$.next(newColorset as any);
        }

        this.setSearchBoxPlaceHolder();
    }
    
    private loadControls() {
        this.loadSearchBox();
        this.loadRefreshButton();
        this.loadOpenButton();
        this.loadStrategicRegionEditButtons();
        this.loadNewProvinceButton();
        this.loadPaintbrushToggleButton();
        this.loadFillBucketButton();
        this.loadTransferWandButton();
        this.loadPaintbrushPanel();
        this.loadNewProvinceConfirmModal();
        this.loadAccessibilityControls();
        this.loadRenderOptimizationControls();
        this.loadResponsiveTopbar();
        this.loadCountryPuppetModal();
        this.loadCreateCountryModal();
        this.loadMergeStatesModal();
        this.loadResolveProvinceWarnings();
        this.loadAreaOperationResults();
        this.loadNorthAmericaPipelineModal();
        this.loadOceanReadinessModal();
        this.initExportMapMessageListener();
    }

    private loadOceanReadinessModal() {
        const modal = document.getElementById('ocean-readiness-modal') as HTMLDivElement | null;
        const close = document.getElementById('ocean-readiness-close') as HTMLButtonElement | null;
        if (!modal || !close) {
            return;
        }
        this.addSubscription(fromEvent(close, 'click').subscribe(event => {
            event.preventDefault();
            modal.hidden = true;
            modal.style.display = 'none';
        }));
    }

    private loadAccessibilityControls() {
        const button = document.getElementById('accessibility-options-button') as HTMLButtonElement | null;
        const menu = document.getElementById('accessibility-options-menu') as HTMLDivElement | null;
        const resetButton = document.getElementById('accessibility-options-reset') as HTMLButtonElement | null;
        if (!button || !menu) {
            return;
        }
        // Keep the button aligned with the other topbar controls, but portal
        // the popup out of the toolbar stacking/clipping context.
        document.body.appendChild(menu);

        type AccessibilityOption = 'reducedMotion' | 'highContrast' | 'largeText' | 'largeTargets';
        const defaults: Record<AccessibilityOption, boolean> = {
            reducedMotion: false,
            highContrast: false,
            largeText: false,
            largeTargets: false,
        };
        const saved = getState().accessibilityOptions ?? {};
        const values: Record<AccessibilityOption, boolean> = {
            reducedMotion: saved.reducedMotion === true,
            highContrast: saved.highContrast === true,
            largeText: saved.largeText === true,
            largeTargets: saved.largeTargets === true,
        };
        const checkboxes = Array.from(
            menu.querySelectorAll<HTMLInputElement>('input[data-accessibility-option]')
        );

        const apply = () => {
            document.body.dataset.reducedMotion = String(values.reducedMotion);
            document.body.dataset.highContrast = String(values.highContrast);
            document.body.dataset.largeText = String(values.largeText);
            document.body.dataset.largeTargets = String(values.largeTargets);
            const enabled = Object.values(values).filter(Boolean).length;
            button.classList.toggle('active', enabled > 0);
            button.setAttribute('aria-pressed', String(enabled > 0));
            button.setAttribute('aria-label', enabled > 0
                ? `Accessibility options, ${enabled} enabled`
                : 'Accessibility options');
            for (const checkbox of checkboxes) {
                const option = checkbox.dataset.accessibilityOption as AccessibilityOption;
                checkbox.checked = values[option] ?? defaults[option];
            }
        };
        const close = () => {
            menu.hidden = true;
            button.setAttribute('aria-expanded', 'false');
        };
        const positionMenu = () => {
            if (menu.hidden) {
                return;
            }
            const buttonBounds = button.getBoundingClientRect();
            const menuBounds = menu.getBoundingClientRect();
            const gap = 8;
            const left = Math.max(
                gap,
                Math.min(buttonBounds.right - menuBounds.width, window.innerWidth - menuBounds.width - gap)
            );
            const top = Math.max(8, Math.min(buttonBounds.bottom + 8, window.innerHeight - 80));
            menu.style.left = `${left}px`;
            menu.style.right = 'auto';
            menu.style.top = `${top}px`;
            menu.style.maxHeight = `${Math.max(72, window.innerHeight - top - 8)}px`;
        };
        const toggleMenu = () => {
            const opening = menu.hidden;
            menu.hidden = !opening;
            button.setAttribute('aria-expanded', String(opening));
            if (opening) {
                positionMenu();
                checkboxes[0]?.focus();
            }
        };

        apply();
        this.addSubscription(fromEvent<MouseEvent>(button, 'click').subscribe(event => {
            event.preventDefault();
            event.stopPropagation();
            toggleMenu();
        }));
        for (const checkbox of checkboxes) {
            this.addSubscription(fromEvent<Event>(checkbox, 'change').subscribe(() => {
                const option = checkbox.dataset.accessibilityOption as AccessibilityOption;
                values[option] = checkbox.checked;
                setState({ accessibilityOptions: { ...values } });
                apply();
            }));
        }
        if (resetButton) {
            this.addSubscription(fromEvent<MouseEvent>(resetButton, 'click').subscribe(event => {
                event.preventDefault();
                for (const option of Object.keys(values) as AccessibilityOption[]) {
                    values[option] = false;
                }
                setState({ accessibilityOptions: { ...values } });
                apply();
                checkboxes[0]?.focus();
            }));
        }
        this.addSubscription(fromEvent(window, 'resize').subscribe(positionMenu));
        const toolbarOuter = document.querySelector('.toolbar-outer');
        if (toolbarOuter) {
            this.addSubscription(fromEvent(toolbarOuter, 'scroll').subscribe(positionMenu));
        }
        this.addSubscription(fromEvent<KeyboardEvent>(menu, 'keydown').subscribe(event => {
            if (event.key !== 'Tab') {
                return;
            }
            const focusable = [...checkboxes, ...(resetButton ? [resetButton] : [])];
            if (focusable.length === 0) {
                return;
            }
            const activeIndex = focusable.indexOf(document.activeElement as HTMLInputElement | HTMLButtonElement);
            if (event.shiftKey && activeIndex <= 0) {
                event.preventDefault();
                focusable[focusable.length - 1].focus();
            } else if (!event.shiftKey && activeIndex === focusable.length - 1) {
                event.preventDefault();
                focusable[0].focus();
            }
        }));
        this.addSubscription(fromEvent<PointerEvent>(document, 'pointerdown').subscribe(event => {
            const target = event.target as Node;
            if (!menu.hidden && !menu.contains(target) && !button.contains(target)) {
                close();
            }
        }));
        this.addSubscription(fromEvent<KeyboardEvent>(document, 'keydown').subscribe(event => {
            if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'a') {
                event.preventDefault();
                toggleMenu();
            } else if (event.key === 'Escape' && !menu.hidden) {
                event.preventDefault();
                close();
                button.focus();
            }
        }));
    }

    private loadRenderOptimizationControls() {
        const button = document.getElementById('render-optimizations-button') as HTMLButtonElement | null;
        const menu = document.getElementById('render-optimizations-menu') as HTMLDivElement | null;
        const badge = document.getElementById('render-optimizations-count');
        const modal = document.getElementById('render-optimization-confirm-modal') as HTMLDivElement | null;
        const modalName = document.getElementById('render-optimization-confirm-name');
        const modalImpact = document.getElementById('render-optimization-confirm-impact');
        const dontAsk = document.getElementById('render-optimization-confirm-dontask') as HTMLInputElement | null;
        const cancel = document.getElementById('render-optimization-confirm-cancel') as HTMLButtonElement | null;
        const confirm = document.getElementById('render-optimization-confirm-ok') as HTMLButtonElement | null;

        if (!button || !menu || !modal || !cancel || !confirm) {
            return;
        }
        // The toolbar is a horizontally scrolling, backdrop-filtered stacking
        // context. Keep the popup at the webview root so it overlays the map
        // instead of being clipped or painted underneath it.
        document.body.appendChild(menu);

        const checkboxes = Array.from(
            menu.querySelectorAll<HTMLInputElement>('input[data-render-optimization]')
        );
        let pending: WorldMapRuntimeTestOptimization | undefined;

        const updateMenu = (selected: ReadonlySet<WorldMapRuntimeTestOptimization>) => {
            for (const checkbox of checkboxes) {
                checkbox.checked = selected.has(
                    checkbox.dataset.renderOptimization as WorldMapRuntimeTestOptimization
                );
            }
            if (badge) {
                badge.textContent = selected.size > 0 ? String(selected.size) : '';
                badge.classList.toggle('hidden', selected.size === 0);
            }
            button.classList.toggle('active', selected.size > 0);
            button.setAttribute(
                'aria-label',
                selected.size > 0
                    ? `Experimental performance options, ${selected.size} enabled`
                    : 'Experimental performance options'
            );
        };

        const closeMenu = () => {
            menu.hidden = true;
            button.setAttribute('aria-expanded', 'false');
        };
        const positionMenu = () => {
            if (menu.hidden) {
                return;
            }
            const buttonBounds = button.getBoundingClientRect();
            const menuBounds = menu.getBoundingClientRect();
            const gap = 8;
            const left = Math.max(
                gap,
                Math.min(buttonBounds.right - menuBounds.width, window.innerWidth - menuBounds.width - gap)
            );
            const top = Math.max(gap, Math.min(buttonBounds.bottom + gap, window.innerHeight - 80));
            menu.style.left = `${left}px`;
            menu.style.right = 'auto';
            menu.style.top = `${top}px`;
            menu.style.maxHeight = `${Math.max(72, window.innerHeight - top - gap)}px`;
        };

        const closeModal = () => {
            pending = undefined;
            modal.hidden = true;
            modal.style.display = 'none';
            if (dontAsk) {
                dontAsk.checked = false;
            }
        };

        const setOptimization = (optimization: WorldMapRuntimeTestOptimization, enabled: boolean) => {
            const next = new Set(this.renderOptimizations$.value);
            if (enabled) {
                next.add(optimization);
            } else {
                next.delete(optimization);
            }
            this.renderOptimizations$.next(next);
        };

        const showConfirmation = (checkbox: HTMLInputElement, optimization: WorldMapRuntimeTestOptimization) => {
            closeMenu();
            pending = optimization;
            const name = checkbox.dataset.optimizationName ?? optimization;
            const impact = checkbox.dataset.optimizationImpact ?? '';
            if (modalName) {
                modalName.textContent = name;
            }
            if (modalImpact) {
                modalImpact.textContent = impact;
            }
            modal.hidden = false;
            modal.style.display = 'flex';
            confirm.focus();
        };

        this.addSubscription(this.renderOptimizations$.subscribe(updateMenu));

        this.addSubscription(fromEvent<MouseEvent>(button, 'click').subscribe(event => {
            event.preventDefault();
            event.stopPropagation();
            const opening = menu.hidden;
            menu.hidden = !opening;
            button.setAttribute('aria-expanded', String(opening));
            if (opening) {
                positionMenu();
                checkboxes[0]?.focus();
            }
        }));
        this.addSubscription(fromEvent(window, 'resize').subscribe(positionMenu));
        const toolbarOuter = document.querySelector('.toolbar-outer');
        if (toolbarOuter) {
            this.addSubscription(fromEvent(toolbarOuter, 'scroll').subscribe(positionMenu));
        }

        for (const checkbox of checkboxes) {
            this.addSubscription(fromEvent<Event>(checkbox, 'change').subscribe(() => {
                const optimization = checkbox.dataset.renderOptimization as WorldMapRuntimeTestOptimization;
                if (!checkbox.checked) {
                    setOptimization(optimization, false);
                    return;
                }

                checkbox.checked = false;
                if (this.renderOptimizationConfirmationRequired$.value) {
                    showConfirmation(checkbox, optimization);
                } else {
                    setOptimization(optimization, true);
                }
            }));
        }

        this.addSubscription(fromEvent<MouseEvent>(cancel, 'click').subscribe(event => {
            event.preventDefault();
            closeModal();
        }));

        this.addSubscription(fromEvent<MouseEvent>(confirm, 'click').subscribe(event => {
            event.preventDefault();
            if (pending) {
                setOptimization(pending, true);
                if (dontAsk?.checked) {
                    this.renderOptimizationConfirmationRequired$.next(false);
                }
            }
            closeModal();
        }));

        this.addSubscription(fromEvent<PointerEvent>(modal, 'pointerdown').subscribe(event => {
            if (event.target === modal) {
                closeModal();
            }
        }));

        this.addSubscription(fromEvent<PointerEvent>(document, 'pointerdown').subscribe(event => {
            const target = event.target as Node;
            if (!menu.hidden && !menu.contains(target) && !button.contains(target)) {
                closeMenu();
            }
        }));

        this.addSubscription(fromEvent<KeyboardEvent>(document, 'keydown').subscribe(event => {
            if (event.key !== 'Escape') {
                return;
            }
            if (!modal.hidden) {
                event.preventDefault();
                closeModal();
                button.focus();
            } else if (!menu.hidden) {
                event.preventDefault();
                closeMenu();
                button.focus();
            }
        }));
    }

    private loadResponsiveTopbar(): void {
        const toolbar = document.getElementById('topbar');
        const overflowGroup = toolbar?.querySelector<HTMLElement>('.topbar-overflow') ?? null;
        const button = document.getElementById('topbar-overflow-button') as HTMLButtonElement | null;
        const menu = document.getElementById('topbar-overflow-menu') as HTMLDivElement | null;
        if (!toolbar || !overflowGroup || !button || !menu) {
            return;
        }

        document.body.appendChild(menu);
        const candidates = Array.from(
            toolbar.querySelectorAll<HTMLElement>('.group[data-overflow-priority]')
        ).sort((a, b) =>
            Number(a.dataset.overflowPriority ?? 0) - Number(b.dataset.overflowPriority ?? 0)
        );
        const anchors = new Map<HTMLElement, Comment>();
        for (const candidate of candidates) {
            const anchor = document.createComment(`topbar:${candidate.dataset.overflowPriority}`);
            candidate.before(anchor);
            anchors.set(candidate, anchor);
        }

        const close = () => {
            menu.hidden = true;
            button.setAttribute('aria-expanded', 'false');
        };
        const positionMenu = () => {
            if (menu.hidden) {
                return;
            }
            const bounds = button.getBoundingClientRect();
            const menuBounds = menu.getBoundingClientRect();
            const gap = 8;
            menu.style.left = `${Math.max(
                gap,
                Math.min(bounds.right - menuBounds.width, window.innerWidth - menuBounds.width - gap)
            )}px`;
            menu.style.top = `${Math.min(bounds.bottom + gap, window.innerHeight - 80)}px`;
            menu.style.maxHeight = `${Math.max(72, window.innerHeight - bounds.bottom - gap * 2)}px`;
        };
        const restoreCandidates = () => {
            for (const candidate of candidates) {
                const anchor = anchors.get(candidate);
                if (anchor?.parentNode) {
                    anchor.parentNode.insertBefore(candidate, anchor.nextSibling);
                }
            }
        };
        const relayout = () => {
            close();
            restoreCandidates();
            overflowGroup.hidden = true;
            if (toolbar.scrollWidth <= toolbar.clientWidth + 1) {
                return;
            }

            overflowGroup.hidden = false;
            for (const candidate of candidates) {
                if (window.getComputedStyle(candidate).display === 'none') {
                    continue;
                }
                menu.appendChild(candidate);
                if (toolbar.scrollWidth <= toolbar.clientWidth + 1) {
                    break;
                }
            }
            overflowGroup.hidden = menu.childElementCount === 0;
        };
        let layoutFrame: number | undefined;
        const scheduleRelayout = () => {
            if (layoutFrame !== undefined) {
                cancelAnimationFrame(layoutFrame);
            }
            layoutFrame = requestAnimationFrame(() => {
                layoutFrame = undefined;
                relayout();
            });
        };

        this.addSubscription(fromEvent<MouseEvent>(button, 'click').subscribe(event => {
            event.preventDefault();
            event.stopPropagation();
            const opening = menu.hidden;
            menu.hidden = !opening;
            button.setAttribute('aria-expanded', String(opening));
            if (opening) {
                positionMenu();
                menu.querySelector<HTMLElement>('button, select, input, [tabindex]')?.focus();
            }
        }));
        this.addSubscription(fromEvent<PointerEvent>(document, 'pointerdown').subscribe(event => {
            const target = event.target as Node;
            if (!menu.hidden && !menu.contains(target) && !button.contains(target)) {
                close();
            }
        }));
        this.addSubscription(fromEvent<KeyboardEvent>(document, 'keydown').subscribe(event => {
            if (event.key === 'Escape' && !menu.hidden) {
                event.preventDefault();
                close();
                button.focus();
            }
        }));
        this.addSubscription(fromEvent(window, 'resize').subscribe(scheduleRelayout));
        this.addSubscription(this.viewMode$.subscribe(scheduleRelayout));
        const observer = new ResizeObserver(scheduleRelayout);
        observer.observe(toolbar);
        scheduleRelayout();
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
        const eraseBtn = document.getElementById('paintbrush-erase') as HTMLButtonElement | null;
        const draftUndoBtn = document.getElementById('paintbrush-draft-undo') as HTMLButtonElement | null;
        const draftRedoBtn = document.getElementById('paintbrush-draft-redo') as HTMLButtonElement | null;

        // Show/hide panel with paintbrush active state
        this.addSubscription(this.paintbrushActive$.subscribe(active => {
            panel.hidden = !active;
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

        // Apply button: confirm (if creating a new province) then commit and exit
        if (applyBtn) {
            this.addSubscription(fromEvent<MouseEvent>(applyBtn, 'click').subscribe(e => {
                e.preventDefault();
                e.stopPropagation();

                const draft = this.provinceDraft$.value;
                if (draft?.isNewProvince && this.confirmNewProvinceCreation) {
                    this.showNewProvinceConfirmModal(draft);
                } else {
                    this.exitPaintbrushMode();
                }
            }));
        }

        // Cancel button: discard and exit
        if (cancelBtn) {
            this.addSubscription(fromEvent<MouseEvent>(cancelBtn, 'click').subscribe(e => {
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

        if (eraseBtn) {
            this.addSubscription(fromEvent<MouseEvent>(eraseBtn, 'click').subscribe(e => {
                e.preventDefault();
                e.stopPropagation();
                this.togglePaintEraser();
            }));
            this.addSubscription(this.paintbrushActive$.subscribe(active => {
                const erasing = active && this.paintTool === 'erase';
                eraseBtn.setAttribute('aria-pressed', String(erasing));
                eraseBtn.disabled = !active || this.paintbrushSavePending;
            }));
        }
        if (draftUndoBtn) {
            this.addSubscription(fromEvent<MouseEvent>(draftUndoBtn, 'click').subscribe(e => {
                e.preventDefault();
                e.stopPropagation();
                this.undoPaintDraft();
            }));
            this.addSubscription(this.paintDraftCanUndo$.subscribe(canUndo => {
                draftUndoBtn.disabled = !canUndo || this.paintbrushSavePending;
            }));
        }
        if (draftRedoBtn) {
            this.addSubscription(fromEvent<MouseEvent>(draftRedoBtn, 'click').subscribe(e => {
                e.preventDefault();
                e.stopPropagation();
                this.redoPaintDraft();
            }));
            this.addSubscription(this.paintDraftCanRedo$.subscribe(canRedo => {
                draftRedoBtn.disabled = !canRedo || this.paintbrushSavePending;
            }));
        }
    }

    /**
     * Wire the "Confirm new province creation" modal shown when Apply is
     * clicked while a brand-new province (not a boundary edit) is being created.
     */
    private loadNewProvinceConfirmModal() {
        const modal = document.getElementById('new-province-confirm-modal');
        if (!modal) {
            return;
        }

        const confirmBtn = document.getElementById('new-province-confirm-ok') as HTMLButtonElement | null;
        const cancelBtn = document.getElementById('new-province-confirm-cancel') as HTMLButtonElement | null;
        const dontAskCheckbox = document.getElementById('new-province-confirm-dontask') as HTMLInputElement | null;

        if (confirmBtn) {
            this.addSubscription(fromEvent<MouseEvent>(confirmBtn, 'click').subscribe(e => {
                e.preventDefault();
                e.stopPropagation();

                if (dontAskCheckbox?.checked) {
                    this.confirmNewProvinceCreation = false;
                    vscode.postMessage<WorldMapMessage>({ command: 'setconfirmnewprovincecreation', value: false });
                }

                this.hideNewProvinceConfirmModal();
                this.exitPaintbrushMode();
            }));
        }

        if (cancelBtn) {
            this.addSubscription(fromEvent<MouseEvent>(cancelBtn, 'click').subscribe(e => {
                e.preventDefault();
                e.stopPropagation();
                this.hideNewProvinceConfirmModal();
            }));
        }
    }

    private showNewProvinceConfirmModal(draft: ProvinceDraft) {
        const modal = document.getElementById('new-province-confirm-modal');
        if (!modal) {
            // Modal markup unavailable for some reason -  fall back to committing directly
            // rather than silently dropping the user's paint session.
            this.exitPaintbrushMode();
            return;
        }

        const summary = document.getElementById('new-province-confirm-summary');
        const dontAskCheckbox = document.getElementById('new-province-confirm-dontask') as HTMLInputElement | null;
        if (dontAskCheckbox) {
            dontAskCheckbox.checked = false;
        }

        if (summary) {
            const r = (draft.color >> 16) & 0xFF;
            const g = (draft.color >> 8) & 0xFF;
            const b = draft.color & 0xFF;
            summary.innerHTML =
                `<div>Pixels: ${draft.pixels.size}</div>` +
                `<div>Colour: rgb(${r}, ${g}, ${b})</div>` +
                `<div>Type: ${draft.type}</div>` +
                `<div>Terrain: ${draft.terrain || '(none)'}</div>` +
                `<div>Coastal: ${draft.coastal}</div>` +
                `<div>Continent: ${draft.continent}</div>`;
        }

        modal.hidden = false;
        modal.style.display = 'flex';
    }

    private hideNewProvinceConfirmModal() {
        const modal = document.getElementById('new-province-confirm-modal');
        if (modal) {
            modal.hidden = true;
            modal.style.display = 'none';
        }
    }

    private loadCountryPuppetModal() {
        const modal = document.getElementById('country-puppet-modal');
        const search = document.getElementById('country-puppet-search') as HTMLInputElement | null;
        const target = document.getElementById('country-puppet-target') as HTMLSelectElement | null;
        const autonomy = document.getElementById('country-puppet-autonomy') as HTMLSelectElement | null;
        const apply = document.getElementById('country-puppet-apply') as HTMLButtonElement | null;
        const cancel = document.getElementById('country-puppet-cancel') as HTMLButtonElement | null;
        if (!modal || !search || !target || !autonomy || !apply || !cancel) {
            return;
        }

        this.addSubscription(fromEvent(search, 'input').subscribe(() => {
            this.populateCountryPuppetTargets(search.value);
        }));
        this.addSubscription(fromEvent(cancel, 'click').subscribe(e => {
            e.preventDefault();
            if (!this.pendingPuppetWrite) {
                this.hideCountryPuppetModal();
            }
        }));
        this.addSubscription(fromEvent(apply, 'click').subscribe(e => {
            e.preventDefault();
            if (this.countryActionMode === 'annex') {
                this.annexCountries(Array.from(target.selectedOptions).map(option => option.value));
            } else if (this.countryActionMode === 'transfer') {
                this.transferSelectedStatesToCountry(target.value);
            } else {
                this.applyCountryPuppetRelationship(target.value, autonomy.value);
            }
        }));
        this.addSubscription(fromEvent<MessageEvent>(window, 'message').subscribe(event => {
            const message = event.data as WorldMapMessage;
            if (message.command !== 'countrydiplomacyupdated') {
                return;
            }

            this.pendingPuppetWrite = false;
            apply.disabled = false;
            cancel.disabled = false;
            if (!message.success) {
                this.setCountryPuppetError(message.error ?? feLocalize('worldmap.country.puppet.error', 'Could not update country history.'));
                return;
            }

            this.hideCountryPuppetModal();
            this.showActionStatus(feLocalize('worldmap.country.puppet.done', 'Country puppet relationship saved.'));
            this.loader.refresh();
        }));
    }

    private showCountryPuppetModal(mode: 'puppet' | 'annex' | 'transfer' = 'puppet') {
        const modal = document.getElementById('country-puppet-modal');
        const summary = document.getElementById('country-puppet-overlord');
        const title = document.getElementById('country-puppet-title');
        const autonomy = document.getElementById('country-puppet-autonomy') as HTMLSelectElement | null;
        const autonomyLabel = autonomy?.previousElementSibling as HTMLElement | null;
        const apply = document.getElementById('country-puppet-apply') as HTMLButtonElement | null;
        const search = document.getElementById('country-puppet-search') as HTMLInputElement | null;
        const target = document.getElementById('country-puppet-target') as HTMLSelectElement | null;
        const selectedTag = this.selectedCountryTag$.value;
        if (!modal || !search || !target) {
            return;
        }

        if ((mode === 'puppet' || mode === 'annex') && !selectedTag) {
            return;
        }
        if (mode === 'puppet' && selectedTag && !this.loader.worldMap.countryHistoryFiles[selectedTag]) {
            this.showActionStatus(
                feLocalize('worldmap.country.puppet.nohistory', 'No country history file was found for {0}.', selectedTag),
                'warn'
            );
            return;
        }

        this.countryActionMode = mode;
        target.multiple = mode === 'annex';
        const isPuppet = mode === 'puppet';
        if (autonomy) autonomy.style.display = isPuppet ? 'block' : 'none';
        if (autonomyLabel) autonomyLabel.style.display = isPuppet ? 'block' : 'none';
        if (title) {
            title.textContent = mode === 'annex'
                ? feLocalize('worldmap.country.annex.title', 'Annex Country')
                : mode === 'transfer'
                    ? feLocalize('worldmap.country.transfer.title', 'Transfer State to Country')
                    : feLocalize('worldmap.country.puppet.title', 'Force Puppet State');
        }
        if (apply) {
            apply.textContent = mode === 'annex'
                ? feLocalize('worldmap.country.annex.apply', 'Annex Country')
                : mode === 'transfer'
                    ? feLocalize('worldmap.country.transfer.apply', 'Transfer Selected States')
                    : feLocalize('worldmap.country.puppet.apply', 'Apply Puppet Relationship');
        }
        if (summary) {
            summary.textContent = mode === 'transfer'
                ? feLocalize('worldmap.country.transfer.summary', 'Selected states: {0}', this.selectedStateIds$.value.size)
                : mode === 'annex'
                    ? feLocalize('worldmap.country.annex.summary', 'Annexing country: {0}', selectedTag)
                    : feLocalize('worldmap.country.puppet.overlord', 'Overlord: {0}', selectedTag);
        }
        search.value = '';
        this.setCountryPuppetError('');
        this.populateCountryPuppetTargets('');
        modal.hidden = false;
        modal.style.display = 'flex';
        search.focus();
    }

    private hideCountryPuppetModal() {
        const modal = document.getElementById('country-puppet-modal');
        if (modal) {
            modal.hidden = true;
            modal.style.display = 'none';
        }
        this.setCountryPuppetError('');
    }

    private populateCountryPuppetTargets(filter: string) {
        const select = document.getElementById('country-puppet-target') as HTMLSelectElement | null;
        if (!select) {
            return;
        }

        const selectedTag = this.countryActionMode === 'transfer' ? undefined : this.selectedCountryTag$.value;
        const normalizedFilter = filter.trim().toUpperCase();
        const previousValue = select.value;
        select.replaceChildren();

        const tags = this.loader.worldMap.countries
            .map(country => country.tag)
            .filter(tag => tag !== selectedTag && tag.includes(normalizedFilter))
            .sort((a, b) => a.localeCompare(b));
        for (const tag of tags) {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            select.appendChild(option);
        }

        if (tags.includes(previousValue)) {
            select.value = previousValue;
        } else if (tags.length > 0) {
            select.selectedIndex = 0;
        }
    }

    private applyCountryPuppetRelationship(subject: string, autonomyState: string) {
        const overlord = this.selectedCountryTag$.value;
        const file = overlord ? this.loader.worldMap.countryHistoryFiles[overlord] : undefined;
        if (!overlord || !file || !subject) {
            this.setCountryPuppetError(feLocalize('worldmap.country.puppet.missingtarget', 'Choose a target country.'));
            return;
        }

        const apply = document.getElementById('country-puppet-apply') as HTMLButtonElement | null;
        const cancel = document.getElementById('country-puppet-cancel') as HTMLButtonElement | null;
        this.pendingPuppetWrite = true;
        if (apply) apply.disabled = true;
        if (cancel) cancel.disabled = true;
        this.setCountryPuppetError('');
        vscode.postMessage<WorldMapMessage>({
            command: 'persistcountrydiplomacy',
            action: 'puppet',
            file,
            overlord,
            subject,
            autonomyState,
        });
    }

    private releaseSelectedPuppet() {
        const relation = this.getCurrentPuppetRelation();
        if (!relation) {
            this.showActionStatus(feLocalize('worldmap.country.release.notpuppet', 'The selected country is not an active puppet.'), 'warn');
            return;
        }
        const file = this.loader.worldMap.countryHistoryFiles[relation.overlord];
        if (!file) {
            this.showActionStatus(feLocalize('worldmap.country.release.nohistory', 'No country history file was found for overlord {0}.', relation.overlord), 'warn');
            return;
        }

        vscode.postMessage<WorldMapMessage>({
            command: 'persistcountrydiplomacy',
            action: 'end_puppet',
            file,
            overlord: relation.overlord,
            subject: relation.subject,
        });
        this.showActionStatus(
            feLocalize('worldmap.country.release.pending', 'Releasing {0} from puppet status under {1}...', relation.subject, relation.overlord)
        );
    }

    private getCurrentPuppetRelation() {
        const subject = this.selectedCountryTag$.value;
        if (!subject) {
            return undefined;
        }
        const candidates = this.loader.worldMap.diplomacyRelations
            .filter(relation => relation.subject === subject)
            .map(relation => ({ condition: relation.condition, value: relation }));
        const active = solveWithCondition(candidates, this.selectedConditions$.value);
        return active && active.level !== 'independent' && active.level !== 'annexed'
            ? active
            : undefined;
    }

    private annexCountries(targetTags: string[]) {
        const annexingTag = this.selectedCountryTag$.value;
        const normalizedTargets = Array.from(new Set(targetTags.filter(tag => tag && tag !== annexingTag)));
        if (!annexingTag || normalizedTargets.length === 0) {
            this.setCountryPuppetError(feLocalize('worldmap.country.annex.missingtarget', 'Choose one or more different countries to annex.'));
            return;
        }

        const affectedStates: number[] = [];
        this.loader.worldMap.forEachState(state => {
            if (normalizedTargets.includes(solveWithCondition(state.owner, this.selectedConditions$.value) ?? '')) {
                affectedStates.push(state.id);
            }
        });
        if (affectedStates.length === 0) {
            this.setCountryPuppetError(feLocalize('worldmap.country.annex.nostates', 'The selected countries own no states under the selected conditions.'));
            return;
        }

        const before = this.loader.worldMap.snapshotStates(affectedStates);
        for (const stateId of affectedStates) {
            const state = this.loader.worldMap.getStateById(stateId);
            if (state) {
                this.transferStateOwnership(state, annexingTag);
            }
        }
        const after = this.loader.worldMap.snapshotStates(affectedStates);
        this.recordMapEdit(before, after);
        this.persistStates(affectedStates);
        this.mapMutation$.next(this.mapMutation$.value + 1);
        this.hideCountryPuppetModal();
        this.showActionStatus(feLocalize('worldmap.country.annex.done', 'Transferred {0} states from {1} countries to {2}.', affectedStates.length, normalizedTargets.length, annexingTag));
    }

    private transferSelectedStatesToCountry(targetTag: string) {
        const stateIds = Array.from(this.selectedStateIds$.value);
        if (!targetTag || stateIds.length === 0) {
            this.setCountryPuppetError(feLocalize('worldmap.country.transfer.missing', 'Select one or more states and a target country.'));
            return;
        }

        const before = this.loader.worldMap.snapshotStates(stateIds);
        for (const stateId of stateIds) {
            const state = this.loader.worldMap.getStateById(stateId);
            if (state) {
                this.transferStateOwnership(state, targetTag);
            }
        }
        const after = this.loader.worldMap.snapshotStates(stateIds);
        this.recordMapEdit(before, after);
        this.persistStates(stateIds);
        this.mapMutation$.next(this.mapMutation$.value + 1);
        this.hideCountryPuppetModal();
        this.showActionStatus(feLocalize('worldmap.country.transfer.done', 'Transferred {0} states to {1}.', stateIds.length, targetTag));
    }

    private transferStateOwnership(state: any, targetTag: string) {
        state.owner = [{ condition: true, value: targetTag }];
        state.controller = [{ condition: true, value: targetTag }];
        if (this.autoCoreTransfers && !state.cores.some((core: any) => core.value === targetTag && core.condition === true)) {
            state.cores.push({ condition: true, value: targetTag });
        }
    }

    private setCountryPuppetError(message: string) {
        const errorElement = document.getElementById('country-puppet-error');
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    private loadCreateCountryModal() {
        const modal = document.getElementById('create-country-modal') as HTMLDivElement | null;
        const tag = document.getElementById('create-country-tag') as HTMLInputElement | null;
        const name = document.getElementById('create-country-name') as HTMLInputElement | null;
        const apply = document.getElementById('create-country-apply') as HTMLButtonElement | null;
        const cancel = document.getElementById('create-country-cancel') as HTMLButtonElement | null;
        if (!modal || !tag || !name || !apply || !cancel) return;

        this.addSubscription(fromEvent(tag, 'input').subscribe(() => {
            tag.value = tag.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
        }));
        this.addSubscription(fromEvent(cancel, 'click').subscribe(() => this.hideCreateCountryModal()));
        this.addSubscription(fromEvent(apply, 'click').subscribe(() => {
            const selected = Array.from(this.selectedStateIds$.value);
            if (selected.length === 0 || !/^[A-Z0-9]{3}$/.test(tag.value) || !name.value.trim()) {
                this.setCreateCountryError(feLocalize('worldmap.country.create.invalid', 'Enter a unique three-character TAG and localized name.'));
                return;
            }
            this.pendingCreatedCountryStateIds = selected;
            apply.disabled = true;
            cancel.disabled = true;
            vscode.postMessage<WorldMapMessage>({
                command: 'createcountry',
                tag: tag.value,
                localizedName: name.value.trim(),
                capitalStateId: selected[0],
            });
        }));
        this.addSubscription(fromEvent<MessageEvent>(window, 'message').subscribe(event => {
            const message = event.data as WorldMapMessage;
            if (message.command !== 'createcountryresult') return;
            apply.disabled = false;
            cancel.disabled = false;
            if (!message.success || !message.tag) {
                this.setCreateCountryError(message.error ?? feLocalize('worldmap.country.create.failed', 'Country creation failed.'));
                return;
            }

            const ids = [...this.pendingCreatedCountryStateIds];
            const before = this.loader.worldMap.snapshotStates(ids);
            for (const id of ids) {
                const state = this.loader.worldMap.getStateById(id);
                if (state) this.transferStateOwnership(state, message.tag);
            }
            const after = this.loader.worldMap.snapshotStates(ids);
            this.recordMapEdit(before, after);
            this.persistStates(ids);
            this.selectedCountryTag$.next(message.tag);
            this.hideCreateCountryModal();
            this.showActionStatus(feLocalize('worldmap.country.create.done', 'Created {0} and transferred {1} states.', message.tag, ids.length));
            this.loader.refresh();
        }));
    }

    private showCreateCountryModal() {
        const modal = document.getElementById('create-country-modal') as HTMLDivElement | null;
        const tag = document.getElementById('create-country-tag') as HTMLInputElement | null;
        const name = document.getElementById('create-country-name') as HTMLInputElement | null;
        const summary = document.getElementById('create-country-summary');
        if (!modal || !tag || !name || this.selectedStateIds$.value.size === 0) return;
        if (summary) summary.textContent = feLocalize('worldmap.country.create.summary', 'Selected states: {0}. Auto-core: {1}.', this.selectedStateIds$.value.size, this.autoCoreTransfers ? 'on' : 'off');
        tag.value = '';
        name.value = '';
        this.setCreateCountryError('');
        modal.hidden = false;
        modal.style.display = 'flex';
        tag.focus();
    }

    private hideCreateCountryModal() {
        const modal = document.getElementById('create-country-modal');
        if (modal) {
            modal.hidden = true;
            modal.style.display = 'none';
        }
        this.setCreateCountryError('');
    }

    private setCreateCountryError(message: string) {
        const error = document.getElementById('create-country-error');
        if (error) error.textContent = message;
    }

    private loadMergeStatesModal() {
        const modal = document.getElementById('merge-states-modal') as HTMLDivElement | null;
        const target = document.getElementById('merge-states-target') as HTMLSelectElement | null;
        const apply = document.getElementById('merge-states-apply') as HTMLButtonElement | null;
        const cancel = document.getElementById('merge-states-cancel') as HTMLButtonElement | null;
        if (!modal || !target || !apply || !cancel) return;
        this.addSubscription(fromEvent(cancel, 'click').subscribe(() => this.hideMergeStatesModal()));
        this.addSubscription(fromEvent<MessageEvent>(window, 'message').subscribe(event => {
            const message = event.data as WorldMapMessage;
            if (message.command !== 'persiststatesresult' ||
                !this.pendingStateMerge ||
                message.requestId !== this.pendingStateMerge.requestId) {
                return;
            }
            const pending = this.pendingStateMerge;
            this.pendingStateMerge = undefined;
            apply.disabled = false;
            cancel.disabled = false;
            if (!message.success) {
                this.loader.worldMap.restoreStates(pending.before);
                this.mapMutation$.next(this.mapMutation$.value + 1);
                this.showActionStatus(
                    message.error ?? feLocalize('worldmap.state.merge.failed', 'State merge could not be saved. No states were merged.'),
                    'warn'
                );
                return;
            }
            this.recordMapEdit(pending.before, pending.after);
            this.selectedStateIds$.next(new Set([pending.targetId]));
            this.mapMutation$.next(this.mapMutation$.value + 1);
            this.loader.refresh();
            this.hideMergeStatesModal();
            this.showActionStatus(feLocalize(
                'worldmap.state.merge.done',
                'Merged {0} states into state {1}.',
                pending.sourceCount,
                pending.targetId
            ));
        }));
        this.addSubscription(fromEvent(apply, 'click').subscribe(() => {
            if (this.pendingStateMerge) return;
            const ids = Array.from(this.selectedStateIds$.value);
            const targetId = Number.parseInt(target.value, 10);
            const states = ids.map(id => this.loader.worldMap.getStateById(id)).filter((state): state is NonNullable<typeof state> => !!state);
            const owners = new Set(states.map(state => solveWithCondition(state.owner, this.selectedConditions$.value) ?? ''));
            if (!Number.isInteger(targetId) || states.length !== ids.length) {
                const error = document.getElementById('merge-states-error');
                if (error) error.textContent = feLocalize('worldmap.state.merge.invalid', 'One or more selected states no longer exist.');
                return;
            }
            if (owners.size > 1) {
                const error = document.getElementById('merge-states-error');
                if (error) error.textContent = feLocalize('worldmap.state.merge.ownerconflict', 'Selected states must have the same active owner.');
                return;
            }
            const before = this.loader.worldMap.snapshotStates(ids);
            const result = this.loader.worldMap.mergeStates(targetId, ids.filter(id => id !== targetId));
            if (!result) return;
            const after = this.loader.worldMap.snapshotStates(ids);
            const requestId = `state-merge-${++this.mergeRequestSequence}`;
            this.pendingStateMerge = {
                requestId,
                targetId,
                sourceCount: ids.length - 1,
                before,
                after,
            };
            apply.disabled = true;
            cancel.disabled = true;
            this.persistStates(
                [targetId],
                result.deletedFiles,
                result.deletedStates,
                requestId,
                Object.fromEntries(ids.filter(id => id !== targetId).map(id => [id, targetId]))
            );
            this.mapMutation$.next(this.mapMutation$.value + 1);
            this.showActionStatus(feLocalize('worldmap.state.merge.pending', 'Saving state merge...'));
        }));
    }

    private showMergeStatesModal() {
        const modal = document.getElementById('merge-states-modal') as HTMLDivElement | null;
        const target = document.getElementById('merge-states-target') as HTMLSelectElement | null;
        const summary = document.getElementById('merge-states-summary');
        const ids = Array.from(this.selectedStateIds$.value);
        if (!modal || !target || ids.length < 2) return;
        target.replaceChildren();
        for (const id of ids) {
            const state = this.loader.worldMap.getStateById(id);
            if (!state) continue;
            const option = document.createElement('option');
            option.value = String(id);
            option.textContent = state.localisedName ? `${state.localisedName} (${id})` : `${state.name} (${id})`;
            target.appendChild(option);
        }
        if (summary) summary.textContent = feLocalize('worldmap.state.merge.summary', '{0} states selected. Manpower, resources, cores, provinces, and victory points will be combined.', ids.length);
        const error = document.getElementById('merge-states-error');
        if (error) error.textContent = '';
        modal.hidden = false;
        modal.style.display = 'flex';
        target.focus();
    }

    private hideMergeStatesModal() {
        const modal = document.getElementById('merge-states-modal');
        if (modal) {
            modal.hidden = true;
            modal.style.display = 'none';
        }
    }

    private toggleAutoCoreTransfers() {
        this.autoCoreTransfers = !this.autoCoreTransfers;
        vscode.postMessage<WorldMapMessage>({ command: 'setautocoretransfers', value: this.autoCoreTransfers });
        this.showActionStatus(feLocalize('worldmap.autocore.status', 'Auto-core transferred states: {0}.', this.autoCoreTransfers ? 'on' : 'off'));
    }

    private resolveProvinceWarnings() {
        if (!window.confirm(feLocalize(
            'worldmap.province.resolve.confirm',
            'Remove invalid province references from adjacencies, railways, and supply nodes, then reload the map?'
        ))) return;
        vscode.postMessage<WorldMapMessage>({ command: 'resolveprovincewarnings' });
        this.showActionStatus(feLocalize('worldmap.province.resolve.pending', 'Resolving province warnings...'));
    }

    private loadResolveProvinceWarnings() {
        this.addSubscription(fromEvent<MessageEvent>(window, 'message').subscribe(event => {
            const message = event.data as WorldMapMessage;
            if (message.command !== 'resolveprovincewarningsresult') return;
            if (!message.success) {
                this.showActionStatus(message.error ?? feLocalize('worldmap.province.resolve.failed', 'Province warning repair failed.'), 'warn');
                return;
            }
            const warningCount = message.warnings?.length ?? 0;
            this.showActionStatus(feLocalize('worldmap.province.resolve.done', 'Province references repaired. Remaining repair warnings: {0}.', warningCount));
            this.loader.refresh();
        }));
        this.addSubscription(fromEvent<MessageEvent>(window, 'message').subscribe(event => {
            const message = event.data as WorldMapMessage;
            if (message.command !== 'reindexmapresult') return;
            this.reindexPending = false;
            if (!message.success) {
                this.showActionStatus(message.error ?? feLocalize('worldmap.reindex.failed', 'Sequential reindexing failed.'), 'warn');
                return;
            }
            this.showActionStatus(feLocalize(
                'worldmap.reindex.done',
                'Sequential province/state reindex complete: {0} references changed.',
                message.changedRecords ?? 0
            ));
            this.loader.refresh();
        }));
    }

    private runAreaOperation(operation: import('../../src/previewdef/worldmap/definitions').AreaOperation) {
        if (this.areaOperationPending) return;
        const currentViewMode = this.viewMode$.value;
        const provinceIds = currentViewMode === 'province'
            ? Array.from(this.selectedProvinceIds$.value)
            : [];
        const stateIds = currentViewMode === 'state'
            ? Array.from(this.selectedStateIds$.value)
            : currentViewMode === 'supplyarea'
                ? [...(this.loader.worldMap.getSupplyAreaById(this.selectedSupplyAreaId$.value)?.states ?? [])]
                : [];
        const riverIds = operation === 'convert-to-ocean'
            ? Array.from(this.selectedRiverIds$.value)
            : [];
        if (provinceIds.length === 0 && stateIds.length === 0) {
            this.showActionStatus(feLocalize('worldmap.area.noselection', 'Select one or more provinces or states first.'), 'warn');
            return;
        }
        const labels: Record<typeof operation, string> = {
            'clear-railways': 'clear every railway touching the area',
            'clear-buildings': 'remove all state and map buildings in the area',
            'one-population-per-state': 'set every affected state to 1 population',
            'clear-supply-hubs': 'remove every supply hub in the area',
            'clear-water-crossings': 'remove every strait, canal, and other water-based crossing touching the area',
            'clear-resources': 'remove all resource blocks from affected states',
            'lowest-development': `set every affected state to ${this.areaIncludeWasteland ? 'wasteland' : 'the lowest non-wasteland level'}`,
            'convert-to-ocean': riverIds.length > 0
                ? 'extract the exact selected rivers.bmp pixels into new ocean provinces without converting the land provinces underneath'
                : 'convert the area to ocean and rebuild dependent state, strategic-region, adjacency, railway, supply-hub, and building data',
        };
        const scope = riverIds.length > 0
            ? `${riverIds.length} selected river component(s)`
            : this.areaPerContinent ? 'the entire touched continent or continents' : 'the selected area';
        this.showAreaOperationConfirmation(
            operation,
            provinceIds,
            stateIds,
            riverIds.length === 0 && this.areaPerContinent,
            false,
            labels[operation],
            scope,
            riverIds
        );
    }

    private runGlobalAreaOperation(operation: 'clear-water-crossings' | 'clear-resources') {
        const worldMap = this.loader.worldMap;
        const provinceIds: number[] = [];
        worldMap.forEachProvince(province => {provinceIds.push(province.id);});
        const stateIds: number[] = [];
        worldMap.forEachState(state => {stateIds.push(state.id);});
        const description = operation === 'clear-water-crossings'
            ? 'remove every strait, canal, and water-based crossing from the loaded map'
            : 'remove every resource block from every loaded state';
        this.showAreaOperationConfirmation(operation, provinceIds, stateIds, false, true, description, 'the entire loaded map');
    }

    private showAreaOperationConfirmation(
        operation: import('../../src/previewdef/worldmap/definitions').AreaOperation,
        provinceIds: number[],
        stateIds: number[],
        perContinent: boolean,
        reindexAfter: boolean,
        description: string,
        scope: string,
        riverIds: number[] = []
    ) {
        const modal = document.getElementById('north-america-pipeline-modal') as HTMLDivElement | null;
        const target = document.getElementById('north-america-pipeline-target') as HTMLSelectElement | null;
        const targetLabel = document.getElementById('north-america-pipeline-target-label') as HTMLLabelElement | null;
        const title = document.getElementById('north-america-pipeline-title');
        const summary = document.getElementById('north-america-pipeline-summary');
        const apply = document.getElementById('north-america-pipeline-apply') as HTMLButtonElement | null;
        const cancel = document.getElementById('north-america-pipeline-cancel') as HTMLButtonElement | null;
        if (!modal || !target || !targetLabel || !title || !summary || !apply || !cancel) return;
        this.pendingConfirmedAreaOperation = {
            operation,
            provinceIds,
            stateIds,
            perContinent,
            reindexAfter,
            riverIds,
        };
        modal.dataset.mode = 'area-operation';
        this.setPipelineWarningVisible(false);
        title.textContent = feLocalize('worldmap.area.destructive.title', 'Confirm Destructive Action');
        summary.textContent = feLocalize(
            'worldmap.area.confirm',
            'This will {0} for {1}. Files are changed on disk and this action is not covered by map undo. Continue?',
            description,
            scope
        );
        target.hidden = true;
        targetLabel.hidden = true;
        apply.textContent = feLocalize('worldmap.area.confirm.apply', 'Continue');
        apply.disabled = false;
        cancel.hidden = false;
        cancel.disabled = false;
        this.setNorthAmericaPipelineError('');
        modal.hidden = false;
        modal.style.display = 'flex';
        apply.focus();
    }

    private submitPendingAreaOperation() {
        if (!this.pendingConfirmedAreaOperation || this.areaOperationPending) return;
        const pending = this.pendingConfirmedAreaOperation;
        this.pendingConfirmedAreaOperation = undefined;
        this.areaOperationPending = true;
        vscode.postMessage<WorldMapMessage>({
            command: 'runareaoperation',
            operation: pending.operation,
            provinceIds: pending.provinceIds,
            stateIds: pending.stateIds,
            perContinent: pending.perContinent,
            includeWasteland: this.areaIncludeWasteland,
            reindexAfter: pending.reindexAfter,
            riverIds: pending.riverIds,
        });
        this.hideNorthAmericaPipelineModal();
        this.showActionStatus(feLocalize('worldmap.area.pending', 'Applying area operation...'));
    }

    private loadAreaOperationResults() {
        this.addSubscription(fromEvent<MessageEvent>(window, 'message').subscribe(event => {
            const message = event.data as WorldMapMessage;
            if (message.command !== 'areaoperationresult') return;
            this.areaOperationPending = false;
            if (!message.success) {
                this.showActionStatus(message.error ?? feLocalize('worldmap.area.failed', 'Area operation failed.'), 'warn');
                return;
            }
            this.showActionStatus(feLocalize(
                'worldmap.area.done',
                'Area operation complete: {0} provinces, {1} states, {2} records changed.',
                message.affectedProvinces ?? 0,
                message.affectedStates ?? 0,
                message.changedRecords ?? 0
            ));
            this.loader.refresh();
        }));
    }

    private loadNorthAmericaPipelineModal() {
        const modal = document.getElementById('north-america-pipeline-modal') as HTMLDivElement | null;
        const target = document.getElementById('north-america-pipeline-target') as HTMLSelectElement | null;
        const apply = document.getElementById('north-america-pipeline-apply') as HTMLButtonElement | null;
        const cancel = document.getElementById('north-america-pipeline-cancel') as HTMLButtonElement | null;
        if (!modal || !target || !apply || !cancel) return;
        this.addSubscription(fromEvent(cancel, 'click').subscribe(event => {
            event.preventDefault();
            if (!this.continentPipelinePending) {
                this.pendingConfirmedAreaOperation = undefined;
                this.pendingConfirmedAction = undefined;
                this.hideNorthAmericaPipelineModal();
            }
        }));
        this.addSubscription(fromEvent(apply, 'click').subscribe(event => {
            event.preventDefault();
            if (modal.dataset.mode === 'reindex-map') {
                this.requestDestructiveReindex();
                this.hideNorthAmericaPipelineModal();
            } else if (modal.dataset.mode === 'area-operation') {
                this.submitPendingAreaOperation();
            } else if (modal.dataset.mode === 'remove-all-cores') {
                this.submitRemoveAllCores();
            } else if (modal.dataset.mode === 'custom-action') {
                const action = this.pendingConfirmedAction;
                this.pendingConfirmedAction = undefined;
                this.hideNorthAmericaPipelineModal();
                action?.();
            } else if (modal.dataset.mode === 'all') {
                this.submitAllContinentPipelines();
            } else {
                this.submitContinentPipeline(target.value);
            }
        }));
        this.addSubscription(fromEvent<MessageEvent>(window, 'message').subscribe(event => {
            const message = event.data as WorldMapMessage;
            if (message.command !== 'continentpipelineresult') return;
            if (!message.success) {
                this.continentPipelinePending = false;
                this.continentPipelineQueue = [];
                apply.disabled = false;
                cancel.disabled = false;
                const failure = message.error ?? feLocalize('worldmap.continent.failed', 'Continental consolidation failed.');
                this.setNorthAmericaPipelineError(failure);
                this.showActionStatus(failure, 'warn');
                return;
            }
            this.continentPipelineTotals.provinces += message.mergedProvinces ?? 0;
            this.continentPipelineTotals.states += message.mergedStates ?? 0;
            this.continentPipelineTotals.regions += message.mergedStrategicRegions ?? 0;
            this.continentPipelineTotals.records += message.changedRecords ?? 0;
            this.continentPipelineTotals.completed++;
            if (this.continentPipelineQueue.length > 0) {
                this.sendNextContinentPipeline();
                return;
            }
            this.continentPipelinePending = false;
            apply.disabled = false;
            cancel.disabled = false;
            this.hideNorthAmericaPipelineModal();
            this.showActionStatus(feLocalize(
                'worldmap.continent.done',
                'Continental workflow complete: {0} continent(s), {1} provinces, {2} states, {3} strategic regions, {4} dependent records changed.',
                this.continentPipelineTotals.completed,
                this.continentPipelineTotals.provinces,
                this.continentPipelineTotals.states,
                this.continentPipelineTotals.regions,
                this.continentPipelineTotals.records
            ));
            this.loader.refresh();
        }));
        this.addSubscription(fromEvent<MessageEvent>(window, 'message').subscribe(event => {
            const message = event.data as WorldMapMessage;
            if (message.command !== 'removeallcoresresult') return;
            this.removeAllCoresPending = false;
            apply.disabled = false;
            cancel.disabled = false;
            if (!message.success) {
                this.setNorthAmericaPipelineError(message.error ?? feLocalize('worldmap.cores.failed', 'Removing cores failed.'));
                this.showActionStatus(message.error ?? feLocalize('worldmap.cores.failed', 'Removing cores failed.'), 'warn');
                return;
            }
            this.hideNorthAmericaPipelineModal();
            this.showActionStatus(feLocalize(
                'worldmap.cores.done',
                'Removed {0} core records across {1} loaded states.',
                message.changedRecords ?? 0,
                message.affectedStates ?? 0
            ));
            this.loader.refresh();
        }));
    }

    private showDestructiveActionConfirmation(
        titleText: string,
        summaryText: string,
        applyText: string,
        action: () => void
    ) {
        const modal = document.getElementById('north-america-pipeline-modal') as HTMLDivElement | null;
        const target = document.getElementById('north-america-pipeline-target') as HTMLSelectElement | null;
        const targetLabel = document.getElementById('north-america-pipeline-target-label') as HTMLLabelElement | null;
        const title = document.getElementById('north-america-pipeline-title');
        const summary = document.getElementById('north-america-pipeline-summary');
        const apply = document.getElementById('north-america-pipeline-apply') as HTMLButtonElement | null;
        const cancel = document.getElementById('north-america-pipeline-cancel') as HTMLButtonElement | null;
        if (!modal || !target || !targetLabel || !title || !summary || !apply || !cancel) {
            return;
        }
        this.pendingConfirmedAction = action;
        modal.dataset.mode = 'custom-action';
        title.textContent = titleText;
        summary.textContent = summaryText;
        target.hidden = true;
        targetLabel.hidden = true;
        this.setPipelineWarningVisible(false);
        apply.textContent = applyText;
        apply.disabled = false;
        cancel.hidden = false;
        cancel.disabled = false;
        this.setNorthAmericaPipelineError('');
        modal.hidden = false;
        modal.style.display = 'flex';
        apply.focus();
    }

    private setPipelineWarningVisible(visible: boolean) {
        const warning = document.getElementById('north-america-pipeline-warning');
        if (warning) {
            warning.hidden = !visible;
        }
    }

    private showNorthAmericaPipelineModal(continentId?: number) {
        const modal = document.getElementById('north-america-pipeline-modal') as HTMLDivElement | null;
        const target = document.getElementById('north-america-pipeline-target') as HTMLSelectElement | null;
        const targetLabel = document.getElementById('north-america-pipeline-target-label') as HTMLLabelElement | null;
        const title = document.getElementById('north-america-pipeline-title');
        const summary = document.getElementById('north-america-pipeline-summary');
        const apply = document.getElementById('north-america-pipeline-apply') as HTMLButtonElement | null;
        const cancel = document.getElementById('north-america-pipeline-cancel') as HTMLButtonElement | null;
        if (!modal || !target || !summary || !apply || !cancel || !targetLabel || !title) {
            this.showActionStatus(feLocalize('worldmap.continent.modal.missing', 'The continental pipeline dialog is unavailable. Reload the extension window.'), 'warn');
            return;
        }
        const worldMap = this.loader.worldMap;
        const allMode = continentId === undefined;
        modal.dataset.mode = allMode ? 'all' : 'single';
        this.setPipelineWarningVisible(true);
        this.selectedContinentPipelineId = continentId;
        title.textContent = allMode
            ? feLocalize('worldmap.continent.modal.alltitle', 'Run All Continental Workflows')
            : feLocalize('worldmap.continent.modal.singletitle', '{0} Consolidation Pipeline', worldMap.continents[continentId]);
        const provinceIds = new Set<number>();
        worldMap.forEachProvince(province => {
            if (allMode ? province.continent > 0 : province.continent === continentId) provinceIds.add(province.id);
        });
        const stateCount = new Set(
            Array.from(provinceIds)
                .map(id => worldMap.getStateByProvinceId(id)?.id)
                .filter((id): id is number => id !== undefined)
        ).size;
        const strategicRegionCount = new Set(
            Array.from(provinceIds)
                .map(id => worldMap.getStrategicRegionByProvinceId(id)?.id)
                .filter((id): id is number => id !== undefined)
        ).size;

        target.replaceChildren();
        const tags = worldMap.countries.map(country => country.tag).sort((a, b) => a.localeCompare(b));
        for (const tag of tags) {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            target.appendChild(option);
        }
        const selectedOwner = this.selectedCountryTag$.value ??
            (() => {
                const state = worldMap.getStateById(this.selectedStateId$.value);
                return state ? solveWithCondition(state.owner, this.selectedConditions$.value) : undefined;
            })();
        const preferred = selectedOwner && tags.includes(selectedOwner)
            ? selectedOwner
            : tags.includes('USA') ? 'USA' : tags[0];
        if (preferred) target.value = preferred;

        target.hidden = allMode;
        targetLabel.hidden = allMode;
        apply.textContent = feLocalize('worldmap.northamerica.modal.apply', 'Run Pipeline');
        cancel.hidden = false;
        const validContinents = this.getRunnableContinents();
        const preflightValid = allMode
            ? validContinents.length > 0
            : !!continentId && provinceIds.size > 0 && stateCount > 0 && tags.length > 0;
        summary.textContent = allMode && preflightValid
            ? feLocalize(
                'worldmap.continent.modal.allsummary',
                '{0} continental workflows will run sequentially. Each continent uses its most common current owner as the resulting owner and controller.',
                validContinents.length
            )
            : preflightValid
            ? feLocalize(
                'worldmap.continent.modal.summary',
                'Detected continent {0}: {1} provinces, {2} states, and {3} strategic regions will be consolidated.',
                continentId === undefined ? '' : worldMap.continents[continentId],
                provinceIds.size,
                stateCount,
                strategicRegionCount
            )
            : feLocalize(
                'worldmap.continent.modal.preflightfailed',
                'Preflight failed. Detected continent ID: {0}; provinces: {1}; states: {2}; strategic regions: {3}; countries: {4}.',
                continentId ?? 0,
                provinceIds.size,
                stateCount,
                strategicRegionCount,
                tags.length
            );
        this.setNorthAmericaPipelineError(preflightValid ? '' : summary.textContent);
        apply.disabled = !preflightValid;
        cancel.disabled = false;
        modal.hidden = false;
        modal.style.display = 'flex';
        (preflightValid && !allMode ? target : allMode && preflightValid ? apply : cancel).focus();
    }

    private submitContinentPipeline(targetCountryTag: string) {
        if (this.continentPipelinePending || this.selectedContinentPipelineId === undefined) return;
        const normalizedTag = targetCountryTag.trim().toUpperCase();
        if (!/^[A-Z0-9]{3}$/.test(normalizedTag) ||
            !this.loader.worldMap.countries.some(country => country.tag.toUpperCase() === normalizedTag)) {
            this.setNorthAmericaPipelineError(feLocalize('worldmap.continent.unknowncountry', 'Choose a valid loaded country.'));
            return;
        }
        this.startContinentPipelineQueue([{
            continentId: this.selectedContinentPipelineId,
            targetCountryTag: normalizedTag,
        }]);
    }

    private submitAllContinentPipelines() {
        if (this.continentPipelinePending) return;
        const queue = this.getRunnableContinents()
            .map(continentId => ({
                continentId,
                targetCountryTag: this.getDominantOwnerForContinent(continentId),
            }))
            .filter((item): item is { continentId: number; targetCountryTag: string } => !!item.targetCountryTag);
        if (queue.length === 0) {
            this.setNorthAmericaPipelineError(feLocalize('worldmap.continent.noowners', 'No runnable continent has a loaded owner country.'));
            return;
        }
        this.startContinentPipelineQueue(queue);
    }

    private startContinentPipelineQueue(queue: Array<{ continentId: number; targetCountryTag: string }>) {
        const apply = document.getElementById('north-america-pipeline-apply') as HTMLButtonElement | null;
        const cancel = document.getElementById('north-america-pipeline-cancel') as HTMLButtonElement | null;
        this.continentPipelinePending = true;
        this.continentPipelineQueue = queue.slice();
        this.continentPipelineTotals = { provinces: 0, states: 0, regions: 0, records: 0, completed: 0 };
        if (apply) apply.disabled = true;
        if (cancel) cancel.disabled = true;
        this.sendNextContinentPipeline();
    }

    private sendNextContinentPipeline() {
        const next = this.continentPipelineQueue.shift();
        if (!next) return;
        const name = this.loader.worldMap.continents[next.continentId] ?? String(next.continentId);
        this.setNorthAmericaPipelineError(feLocalize('worldmap.continent.pending', 'Running {0} consolidation for {1}...', name, next.targetCountryTag));
        vscode.postMessage<WorldMapMessage>({
            command: 'runcontinentpipeline',
            continentId: next.continentId,
            targetCountryTag: next.targetCountryTag,
        });
        this.showActionStatus(feLocalize('worldmap.continent.pending', 'Running {0} consolidation for {1}...', name, next.targetCountryTag));
    }

    private getRunnableContinents(): number[] {
        const counts = new Map<number, number>();
        this.loader.worldMap.forEachProvince(province => {
            if (province.continent > 0) counts.set(province.continent, (counts.get(province.continent) ?? 0) + 1);
        });
        return Array.from(counts)
            .filter(([, count]) => count > 0)
            .map(([id]) => id)
            .filter(id => !!this.loader.worldMap.continents[id])
            .sort((a, b) => this.loader.worldMap.continents[a].localeCompare(this.loader.worldMap.continents[b]));
    }

    private getDominantOwnerForContinent(continentId: number): string | undefined {
        const counts = new Map<string, number>();
        this.loader.worldMap.forEachProvince(province => {
            if (province.continent !== continentId) return;
            const state = this.loader.worldMap.getStateByProvinceId(province.id);
            const owner = solveWithCondition(state?.owner, this.selectedConditions$.value);
            if (owner && this.loader.worldMap.countries.some(country => country.tag === owner)) {
                counts.set(owner, (counts.get(owner) ?? 0) + 1);
            }
        });
        return Array.from(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
    }

    private confirmRemoveAllCores() {
        const modal = document.getElementById('north-america-pipeline-modal') as HTMLDivElement | null;
        const target = document.getElementById('north-america-pipeline-target') as HTMLSelectElement | null;
        const targetLabel = document.getElementById('north-america-pipeline-target-label') as HTMLLabelElement | null;
        const title = document.getElementById('north-america-pipeline-title');
        const summary = document.getElementById('north-america-pipeline-summary');
        const apply = document.getElementById('north-america-pipeline-apply') as HTMLButtonElement | null;
        const cancel = document.getElementById('north-america-pipeline-cancel') as HTMLButtonElement | null;
        if (!modal || !target || !targetLabel || !title || !summary || !apply || !cancel) return;
        modal.dataset.mode = 'remove-all-cores';
        this.setPipelineWarningVisible(false);
        title.textContent = feLocalize('worldmap.cores.title', 'REMOVE ALL CORES');
        summary.textContent = feLocalize(
            'worldmap.cores.warning',
            'This permanently removes every core assignment from all loaded state history files. Owners and controllers remain unchanged. This action cannot be undone in the map editor.'
        );
        target.hidden = true;
        targetLabel.hidden = true;
        apply.textContent = feLocalize('worldmap.cores.apply', 'Remove All Cores');
        apply.disabled = false;
        cancel.hidden = false;
        cancel.disabled = false;
        this.setNorthAmericaPipelineError('');
        modal.hidden = false;
        modal.style.display = 'flex';
        apply.focus();
    }

    private submitRemoveAllCores() {
        if (this.removeAllCoresPending) return;
        const apply = document.getElementById('north-america-pipeline-apply') as HTMLButtonElement | null;
        const cancel = document.getElementById('north-america-pipeline-cancel') as HTMLButtonElement | null;
        this.removeAllCoresPending = true;
        if (apply) apply.disabled = true;
        if (cancel) cancel.disabled = true;
        this.setNorthAmericaPipelineError(feLocalize('worldmap.cores.pending', 'Removing all core records...'));
        vscode.postMessage<WorldMapMessage>({ command: 'removeallcores' });
    }

    private confirmSequentialReindex() {
        const modal = document.getElementById('north-america-pipeline-modal') as HTMLDivElement | null;
        const target = document.getElementById('north-america-pipeline-target') as HTMLSelectElement | null;
        const targetLabel = document.getElementById('north-america-pipeline-target-label') as HTMLLabelElement | null;
        const title = document.getElementById('north-america-pipeline-title');
        const summary = document.getElementById('north-america-pipeline-summary');
        const apply = document.getElementById('north-america-pipeline-apply') as HTMLButtonElement | null;
        const cancel = document.getElementById('north-america-pipeline-cancel') as HTMLButtonElement | null;
        if (!modal || !target || !targetLabel || !title || !summary || !apply || !cancel) return;
        modal.dataset.mode = 'reindex-map';
        this.setPipelineWarningVisible(false);
        title.textContent = feLocalize('worldmap.reindex.title', 'REINDEX ALL PROVINCES AND STATES');
        summary.textContent = feLocalize(
            'worldmap.reindex.warning',
            'This renumbers all loaded provinces and states sequentially from 1 and rewrites dependent map references. External scripts outside the loaded map may still require manual updates. This cannot be undone in the map editor.'
        );
        target.hidden = true;
        targetLabel.hidden = true;
        apply.textContent = feLocalize('worldmap.reindex.apply', 'Reindex Map');
        apply.disabled = false;
        cancel.hidden = false;
        cancel.disabled = false;
        this.setNorthAmericaPipelineError('');
        modal.hidden = false;
        modal.style.display = 'flex';
        apply.focus();
    }

    private hideNorthAmericaPipelineModal() {
        const modal = document.getElementById('north-america-pipeline-modal');
        if (modal) {
            modal.hidden = true;
            modal.style.display = 'none';
        }
        this.setNorthAmericaPipelineError('');
    }

    private setNorthAmericaPipelineError(message: string) {
        const error = document.getElementById('north-america-pipeline-error');
        if (error) error.textContent = message;
    }

    private toggleAreaPerContinent() {
        this.areaPerContinent = !this.areaPerContinent;
        setState({ areaPerContinent: this.areaPerContinent });
    }

    private toggleAreaIncludeWasteland() {
        this.areaIncludeWasteland = !this.areaIncludeWasteland;
        setState({ areaIncludeWasteland: this.areaIncludeWasteland });
    }

    private loadStrategicRegionEditButtons() {
        const assignToSRButton = document.getElementById('assign-to-strategicregion') as HTMLButtonElement;

        this.addSubscription(fromEvent<MouseEvent>(assignToSRButton, 'click').subscribe(e => {
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

        this.addSubscription(fromEvent<MouseEvent>(newProvinceButton, 'click').subscribe(e => {
            e.preventDefault();
            e.stopPropagation();
            this.createNewProvince();
        }));

        this.addSubscription(this.selectedProvinceIds$.subscribe(selectedProvinceIds => {
            // Enable when at least one province is selected (multi-selection is
            // supported: painting stays clamped to the whole selected group).
            newProvinceButton.disabled = selectedProvinceIds.size === 0;
        }));
    }

    private loadPaintbrushToggleButton() {
        const toggleButton = document.getElementById('toggle-paintbrush') as HTMLButtonElement;
        if (!toggleButton) {
            return;
        }

        this.addSubscription(fromEvent<MouseEvent>(toggleButton, 'click').subscribe(e => {
            e.preventDefault();
            e.stopPropagation();
            this.paintTool = 'brush';
            this.togglePaintbrushMode();
        }));

        // Update button visual state when paintbrush mode changes
        this.addSubscription(this.paintbrushActive$.subscribe(active => {
            const brushActive = active && this.paintTool === 'brush';
            toggleButton.setAttribute('aria-pressed', String(brushActive));
            if (brushActive) {
                toggleButton.classList.add('active');
            } else {
                toggleButton.classList.remove('active');
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

    private toggleWarningsVisible() {
        const warningsContainer = document.getElementById('warnings-container')!;
        this.warningsVisible = !this.warningsVisible;
        if (this.warningsVisible) {
            sendEvent('worldmap.openwarnings');
            warningsContainer.style.display = 'block';
            this.refreshWarningsDisplay();
        } else {
            warningsContainer.style.display = 'none';
        }
    }

    private toggleWarningsFilterByViewMode() {
        this.warningsFilterByViewMode = !this.warningsFilterByViewMode;
        this.refreshWarningsDisplay();
    }

    private toggleWarningsFilterByColorSet() {
        this.warningsFilterByColorSet = !this.warningsFilterByColorSet;
        this.refreshWarningsDisplay();
    }

    private refreshWarningsDisplay() {
        const worldMap = this.loader.worldMap;
        const warnings = document.getElementById('warnings') as HTMLTextAreaElement;
        if (!worldMap || !warnings) {
            return;
        }

        const filtered = this.filterWarnings(worldMap.warnings);
        if (filtered.length === 0) {
            warnings.value = feLocalize('worldmap.warnings.nowarnings', 'No warnings.');
        } else {
            warnings.value = feLocalize('worldmap.warnings', 'World map warnings: \n\n{0}', filtered.map(warningToString).join('\n'));
        }
    }

    private filterWarnings(warnings: WorldMapWarning[]): WorldMapWarning[] {
        if (!this.warningsFilterByViewMode && !this.warningsFilterByColorSet) {
            return warnings;
        }

        const allowedTypes = new Set<string>();
        if (this.warningsFilterByViewMode) {
            allowedTypes.add(this.viewMode$.value);
        }
        if (this.warningsFilterByColorSet) {
            const type = colorSetToWarningSourceType(this.colorSet$.value);
            if (type) {
                allowedTypes.add(type);
            }
        }

        if (allowedTypes.size === 0) {
            return warnings;
        }

        return warnings.filter(w => w.source.some(s => allowedTypes.has(s.type)));
    }

    private getSelectedRegionBoundingBox(): Zone | undefined {
        const worldMap = this.loader.worldMap;
        if (!worldMap) {
            return undefined;
        }

        const viewMode = this.viewMode$.value;
        let zones: Zone[] = [];

        if (viewMode === 'province') {
            zones = Array.from(this.selectedProvinceIds$.value)
                .map(id => worldMap.getProvinceById(id)?.boundingBox)
                .filter((z): z is Zone => !!z);
        } else if (viewMode === 'state') {
            zones = Array.from(this.selectedStateIds$.value)
                .map(id => worldMap.getStateById(id)?.boundingBox)
                .filter((z): z is Zone => !!z);
        } else if (viewMode === 'strategicregion') {
            const sr = worldMap.getStrategicRegionById(this.selectedStrategicRegionId$.value);
            if (sr) {
                zones = [sr.boundingBox];
            }
        } else if (viewMode === 'supplyarea') {
            const sa = worldMap.getSupplyAreaById(this.selectedSupplyAreaId$.value);
            if (sa) {
                zones = [sa.boundingBox];
            }
        }

        return unionZones(zones);
    }

    private exportSelectedRegion(includeBorder: boolean) {
        this.exportIncludeBorder = includeBorder;

        const bbox = this.getSelectedRegionBoundingBox();
        if (!bbox || bbox.w <= 0 || bbox.h <= 0) {
            this.showActionStatus(feLocalize('worldmap.action.export.noselection', 'Select a province, state, strategic region, or supply area first.'), 'warn');
            return;
        }

        this.pendingExport = { bbox, includeBorder };
        vscode.postMessage({ command: 'requestexportmap' });
    }

    private initExportMapMessageListener() {
        this.addSubscription(fromEvent<MessageEvent>(window, 'message').subscribe(event => {
            const message = event.data as WorldMapMessage;
            if (message.command !== 'requestexportmap') {
                return;
            }

            const worldMap = this.loader.worldMap;
            const pendingExport = this.pendingExport;
            this.pendingExport = undefined;
            if (!worldMap || !pendingExport) {
                return;
            }

            sendEvent('worldmap.export');
            const { bbox, includeBorder } = pendingExport;
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(bbox.w));
            canvas.height = Math.max(1, Math.round(bbox.h));
            const viewPoint = new ViewPoint(canvas, this.loader, 0, { x: bbox.x, y: bbox.y, scale: 1 });
            Renderer.renderMapImpl(canvas, this, viewPoint, worldMap, { preciseEdge: true, overwriteRenderPrecision: 1 });

            if (includeBorder) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.save();
                    ctx.strokeStyle = '#ff3b30';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(1.5, 1.5, canvas.width - 3, canvas.height - 3);
                    ctx.restore();
                }
            }

            vscode.postMessage({ command: 'exportmap', dataUrl: canvas.toDataURL() });
        }));
    }

    public showToolsContextMenu(x: number, y: number) {
        this.contextMenu.show(x, y, this.buildToolsMenuItems());
    }

    private selectAllProvinces(
        label: string,
        selector: () => Set<number>,
        selectedRiverIds: Set<number> = new Set<number>()
    ) {
        const selection = selector();
        this.viewMode$.next('province');
        this.setSelectedProvinceIds(selection, true, selectedRiverIds);
        this.showActionStatus(
            feLocalize(
                'worldmap.action.selectall.done',
                'Selected {0} {1} province(s).',
                selection.size,
                label
            )
        );
    }

    private buildSelectAllMenuItems(): ContextMenuItem[] {
        const worldMap = this.loader.worldMap;
        const byType = (type: string) => selectProvinceIds(
            worldMap,
            province => province.type.toLowerCase() === type
        );
        const terrainNames = new Set<string>();
        const extraTypes = new Set<string>();
        worldMap.forEachProvince(province => {
            if (province.terrain) terrainNames.add(province.terrain);
            const type = province.type.toLowerCase();
            if (type !== 'land' && type !== 'sea' && type !== 'lake') {
                extraTypes.add(province.type);
            }
        });

        const items: ContextMenuItem[] = [
            {
                label: feLocalize('worldmap.contextmenu.selectall.provinces', 'Select All Provinces'),
                action: () => this.selectAllProvinces(
                    'map',
                    () => selectProvinceIds(worldMap, () => true)
                ),
            },
            {
                label: feLocalize('worldmap.contextmenu.selectall.land', 'Select All Land'),
                action: () => this.selectAllProvinces('land', () => byType('land')),
            },
            {
                label: feLocalize('worldmap.contextmenu.selectall.oceans', 'Select All Ocean(s)'),
                action: () => this.selectAllProvinces('ocean', () => byType('sea')),
            },
            {
                label: feLocalize('worldmap.contextmenu.selectall.rivers', 'Select All River(s)'),
                tooltip: feLocalize(
                    'worldmap.contextmenu.selectall.rivers.tooltip',
                    'Select exact rivers.bmp component pixels for clipped river-to-ocean conversion. Other area tools still use the touched provinces.'
                ),
                disabled: worldMap.rivers.length === 0,
                action: () => this.selectAllProvinces(
                    'river-touched',
                    () => selectRiverProvinceIds(worldMap),
                    new Set(worldMap.rivers.map((_, index) => index))
                ),
            },
            {
                label: feLocalize('worldmap.contextmenu.selectall.lakes', 'Select All Lakes'),
                action: () => this.selectAllProvinces('lake', () => byType('lake')),
            },
            {
                label: feLocalize('worldmap.contextmenu.selectall.coastal', 'Select All Coastal Provinces'),
                action: () => this.selectAllProvinces(
                    'coastal',
                    () => selectProvinceIds(worldMap, province => province.coastal)
                ),
            },
        ];

        if (extraTypes.size > 0) {
            items.push({
                label: feLocalize('worldmap.contextmenu.selectall.types', 'Other Province Types'),
                submenu: Array.from(extraTypes).sort().map(type => ({
                    label: feLocalize(
                        'worldmap.contextmenu.selectall.type',
                        'Select All {0}',
                        type
                    ),
                    action: () => this.selectAllProvinces(
                        type,
                        () => byType(type.toLowerCase())
                    ),
                })),
            });
        }

        items.push({
            label: feLocalize('worldmap.contextmenu.selectall.terrain', 'Select All by Terrain'),
            submenu: Array.from(terrainNames).sort().map(terrain => ({
                label: feLocalize(
                    'worldmap.contextmenu.selectall.terrainitem',
                    'Select All {0}',
                    terrain
                ),
                action: () => this.selectAllProvinces(
                    terrain,
                    () => selectProvinceIds(worldMap, province => province.terrain === terrain)
                ),
            })),
        });

        return items;
    }

    private buildToolsMenuItems(): ContextMenuItem[] {
        const selectedProvinceIds = this.selectedProvinceIds$.value;
        const selectedStateIds = this.selectedStateIds$.value;
        const selectedStateId = this.selectedStateId$.value;
        const selectedStrategicRegionId = this.selectedStrategicRegionId$.value;
        const hasRegion = this.getSelectedRegionBoundingBox() !== undefined;
        const selectedCountryTag = this.selectedCountryTag$.value;
        const currentViewMode = this.viewMode$.value;
        const provinceAreaMode = currentViewMode === 'province';
        const stateAreaMode = currentViewMode === 'state';
        const supplyAreaMode = currentViewMode === 'province' || currentViewMode === 'supplyarea';
        const hasAreaSelection =
            (provinceAreaMode && selectedProvinceIds.size > 0) ||
            (stateAreaMode && selectedStateIds.size > 0) ||
            (currentViewMode === 'supplyarea' && this.selectedSupplyAreaId$.value !== undefined);

        const items: ContextMenuItem[] = [
            {
                label: feLocalize('worldmap.contextmenu.selectall', 'Select All'),
                submenu: this.buildSelectAllMenuItems(),
            },
            {
                label: feLocalize('worldmap.contextmenu.export', 'Export as Image (Selected Region)'),
                disabled: !hasRegion,
                action: () => this.exportSelectedRegion(this.exportIncludeBorder),
                submenu: [
                    {
                        label: feLocalize('worldmap.contextmenu.export.include', 'Include region outline'),
                        checked: this.exportIncludeBorder,
                        disabled: !hasRegion,
                        action: () => this.exportSelectedRegion(true),
                    },
                    {
                        label: feLocalize('worldmap.contextmenu.export.exclude', 'Exclude region outline'),
                        checked: !this.exportIncludeBorder,
                        disabled: !hasRegion,
                        action: () => this.exportSelectedRegion(false),
                    },
                ],
            },
            {
                label: feLocalize('worldmap.contextmenu.warnings', 'Toggle Warnings'),
                action: () => this.toggleWarningsVisible(),
                submenu: [
                    {
                        label: feLocalize('worldmap.contextmenu.warnings.byviewmode', 'Only show warnings for current view mode'),
                        checked: this.warningsFilterByViewMode,
                        action: () => this.toggleWarningsFilterByViewMode(),
                    },
                    {
                        label: feLocalize('worldmap.contextmenu.warnings.bycolorset', 'Only show warnings for current color set'),
                        checked: this.warningsFilterByColorSet,
                        action: () => this.toggleWarningsFilterByColorSet(),
                    },
                ],
            },
            {
                label: feLocalize('worldmap.contextmenu.areatools', 'Selected Area Tools'),
                disabled: !hasAreaSelection || this.areaOperationPending,
                submenu: [
                    {
                        label: feLocalize('worldmap.contextmenu.areatools.continent', 'Apply Per Continent'),
                        checked: this.areaPerContinent,
                        action: () => this.toggleAreaPerContinent(),
                    },
                    {
                        label: feLocalize('worldmap.contextmenu.areatools.railways', 'Clear Railways'),
                        disabled: !supplyAreaMode,
                        action: () => this.runAreaOperation('clear-railways'),
                    },
                    {
                        label: feLocalize('worldmap.contextmenu.areatools.buildings', 'Clear Buildings'),
                        disabled: !stateAreaMode,
                        action: () => this.runAreaOperation('clear-buildings'),
                    },
                    {
                        label: feLocalize('worldmap.contextmenu.areatools.population', 'Set 1 Population Per State'),
                        disabled: !stateAreaMode,
                        action: () => this.runAreaOperation('one-population-per-state'),
                    },
                    {
                        label: feLocalize('worldmap.contextmenu.areatools.supply', 'Clear Supply Hubs'),
                        disabled: !supplyAreaMode,
                        action: () => this.runAreaOperation('clear-supply-hubs'),
                    },
                    {
                        label: feLocalize('worldmap.contextmenu.areatools.crossings', 'Clear Water Crossings'),
                        disabled: !provinceAreaMode,
                        action: () => this.runAreaOperation('clear-water-crossings'),
                    },
                    {
                        label: feLocalize('worldmap.contextmenu.areatools.resources', 'Clear Resources'),
                        disabled: !stateAreaMode,
                        action: () => this.runAreaOperation('clear-resources'),
                    },
                    {
                        label: feLocalize('worldmap.contextmenu.areatools.development', 'Development to Lowest Available'),
                        disabled: !stateAreaMode,
                        action: () => this.runAreaOperation('lowest-development'),
                        submenu: [
                            {
                                label: feLocalize('worldmap.contextmenu.areatools.wasteland', 'Include Wasteland'),
                                checked: this.areaIncludeWasteland,
                                action: () => this.toggleAreaIncludeWasteland(),
                            },
                        ],
                    },
                    {
                        label: this.selectedRiverIds$.value.size > 0
                            ? feLocalize('TODO', 'Convert River Pixels to Ocean (Clipped)')
                            : feLocalize('worldmap.contextmenu.areatools.ocean', 'Convert Selection to Ocean (Auto-Rebuild)'),
                        disabled: !provinceAreaMode,
                        action: () => this.runAreaOperation('convert-to-ocean'),
                    },
                ],
            },
            {
                label: feLocalize('worldmap.contextmenu.continents', 'Continental Consolidation'),
                tooltip: feLocalize('worldmap.contextmenu.continents.tooltip', 'Consolidate each continent while preserving separate land and water provinces, strategic regions, and existing surviving IDs.'),
                disabled: this.continentPipelinePending,
                submenu: [
                    ...this.getRunnableContinents().map(continentId => ({
                        label: this.loader.worldMap.continents[continentId],
                        tooltip: feLocalize(
                            'worldmap.contextmenu.continent.tooltip',
                            'Consolidate {0} with separate land/water survivors, clear infrastructure and water crossings, preserve surviving IDs, and choose the resulting owner/controller.',
                            this.loader.worldMap.continents[continentId]
                        ),
                        disabled: this.continentPipelinePending,
                        action: () => this.showNorthAmericaPipelineModal(continentId),
                    })),
                    {
                        label: feLocalize('worldmap.contextmenu.continents.all', 'Run All Continental Workflows Automatically'),
                        tooltip: feLocalize('worldmap.contextmenu.continents.all.tooltip', 'Run every available continent sequentially; each uses its most common current owner as the resulting owner and controller.'),
                        disabled: this.continentPipelinePending,
                        action: () => this.showNorthAmericaPipelineModal(),
                    },
                ],
            },
            {
                label: feLocalize('worldmap.contextmenu.destructive', 'Destructive Actions'),
                tooltip: feLocalize('worldmap.contextmenu.destructive.tooltip', 'Global operations that rewrite loaded mod files and cannot be undone from the map editor.'),
                submenu: [
                    {
                        label: feLocalize('worldmap.contextmenu.removeallcrossings', 'REMOVE ALL WATER CROSSINGS'),
                        tooltip: feLocalize('worldmap.contextmenu.removeallcrossings.tooltip', 'Remove every strait, canal, and water-based adjacency record without renumbering provinces or states.'),
                        disabled: this.areaOperationPending,
                        action: () => this.runGlobalAreaOperation('clear-water-crossings'),
                    },
                    {
                        label: feLocalize('worldmap.contextmenu.clearallresources', 'CLEAR ALL RESOURCES'),
                        tooltip: feLocalize('worldmap.contextmenu.clearallresources.tooltip', 'Remove resource blocks from every loaded state without renumbering provinces or states.'),
                        disabled: this.areaOperationPending,
                        action: () => this.runGlobalAreaOperation('clear-resources'),
                    },
                    {
                        label: feLocalize('worldmap.contextmenu.reindexall', 'REINDEX ALL PROVINCES AND STATES'),
                        tooltip: feLocalize('worldmap.contextmenu.reindexall.tooltip', 'Renumber all loaded provinces and states sequentially from 1 and rewrite map, state, strategic-region, supply-area, capital, railway, supply-node, adjacency, and building references.'),
                        disabled: this.areaOperationPending || this.continentPipelinePending || this.reindexPending,
                        action: () => this.confirmSequentialReindex(),
                    },
                    {
                        label: feLocalize('worldmap.contextmenu.removeallcores', 'REMOVE ALL CORES'),
                        tooltip: feLocalize('worldmap.contextmenu.removeallcores.tooltip', 'Remove every add_core_of and remove_core_of record from all loaded state history files. Owners and controllers are unchanged.'),
                        disabled: this.removeAllCoresPending,
                        action: () => this.confirmRemoveAllCores(),
                    },
                ],
            },
            {
                label: feLocalize('worldmap.contextmenu.provincetools', 'Province Tools'),
                submenu: [
                    {
                        label: feLocalize('worldmap.contextmenu.provincetools.resolvewarnings', 'Resolve Province Warnings Automatically'),
                        action: () => this.resolveProvinceWarnings(),
                    },
                    {
                        label: selectedProvinceIds.size >= 2
                            ? feLocalize(
                                'worldmap.contextmenu.provincetools.merge',
                                'Merge Selected Provinces into First Selected (#{0})',
                                Array.from(selectedProvinceIds)[0]
                            )
                            : feLocalize(
                                'worldmap.contextmenu.provincetools.merge.disabled',
                                'Merge Selected Provinces'
                            ),
                        disabled: selectedProvinceIds.size < 2 || this.paintbrushSavePending,
                        action: () => this.mergeSelectedProvinces(),
                    },
                    {
                        label: feLocalize('worldmap.contextmenu.provincetools.createstate', 'State from Selected Provinces'),
                        disabled: selectedProvinceIds.size === 0,
                        action: () => this.createStateFromSelection(),
                    },
                    {
                        label: feLocalize('worldmap.contextmenu.provincetools.assignstate', 'Assign Selected Provinces to Existing State'),
                        disabled: selectedProvinceIds.size === 0 || selectedStateId === undefined,
                        action: () => this.assignSelectionToState(),
                    },
                    {
                        label: feLocalize('worldmap.contextmenu.provincetools.createstrategic', 'New Strat Region from Selected Provinces'),
                        disabled: selectedProvinceIds.size === 0,
                        action: () => this.createStrategicRegionFromSelectedProvinces(),
                    },
                    {
                        label: feLocalize('worldmap.contextmenu.provincetools.verifyocean', 'Verify Ocean-Tile Readiness'),
                        disabled: selectedProvinceIds.size === 0,
                        action: () => this.verifySelectedOceanTileReadiness(),
                    },
                ],
            },
            {
                label: feLocalize('worldmap.contextmenu.statetools', 'State Tools'),
                submenu: [
                    {
                        label: feLocalize('worldmap.contextmenu.statetools.createtag', 'Create New TAG from Selected States'),
                        disabled: selectedStateIds.size === 0,
                        action: () => this.showCreateCountryModal(),
                    },
                    {
                        label: feLocalize('worldmap.contextmenu.statetools.mergestates', 'Merge Selected States'),
                        disabled: selectedStateIds.size < 2,
                        action: () => this.showMergeStatesModal(),
                    },
                    {
                        label: feLocalize('worldmap.contextmenu.statetools.createstrategic', 'Create Strat Region from Selected States'),
                        disabled: selectedStateIds.size === 0,
                        action: () => this.createStrategicRegionFromSelection(),
                    },
                    {
                        label: feLocalize('worldmap.contextmenu.statetools.assignstrategic', 'Assign Selected State(s) to Existing Strat Region'),
                        disabled: (selectedProvinceIds.size === 0 && selectedStateIds.size === 0) || selectedStrategicRegionId === undefined,
                        action: () => this.assignStatesToStrategicRegion(),
                    },
                    {
                        label: feLocalize('worldmap.contextmenu.statetools.empty', 'Remove All Provinces from Selected State(s)'),
                        disabled: selectedStateIds.size === 0,
                        action: () => this.confirmRemoveAllProvincesFromSelectedStates(),
                    },
                    {
                        label: feLocalize('worldmap.contextmenu.statetools.transfercountry', 'Transfer Selected State(s) to Country'),
                        disabled: selectedStateIds.size === 0,
                        action: () => this.showCountryPuppetModal('transfer'),
                    },
                    {
                        label: feLocalize('worldmap.contextmenu.statetools.autocore', 'Auto-Core All Transferred States'),
                        checked: this.autoCoreTransfers,
                        action: () => this.toggleAutoCoreTransfers(),
                    },
                ],
            },
            {
                label: feLocalize('worldmap.contextmenu.countrytools', 'Country Tools'),
                disabled: this.viewMode$.value !== 'country' || !selectedCountryTag,
                submenu: [
                    {
                        label: feLocalize('worldmap.contextmenu.countrytools.forcepuppet', 'Force Puppet State'),
                        disabled: !selectedCountryTag ||
                            !this.loader.worldMap.countryHistoryFiles[selectedCountryTag],
                        action: () => this.showCountryPuppetModal('puppet'),
                    },
                    {
                        label: feLocalize('worldmap.contextmenu.countrytools.releasepuppet', 'Release Puppet'),
                        disabled: !this.getCurrentPuppetRelation(),
                        action: () => this.releaseSelectedPuppet(),
                    },
                    {
                        label: feLocalize('worldmap.contextmenu.countrytools.annex', 'Annex Country'),
                        disabled: !selectedCountryTag,
                        action: () => this.showCountryPuppetModal('annex'),
                    },
                ],
            },
        ];
        const describeAction = (label: string): string => {
            const value = label.toLowerCase();
            if (value.includes('export')) return 'Save the selected map rectangle as an image; use the submenu to include or omit its outline.';
            if (value.includes('warning')) return 'Show, hide, filter, or automatically repair map validation warnings.';
            if (value.includes('apply per continent')) return 'Split the selected-area operation by continent instead of treating the selection as one group.';
            if (value.includes('railway')) return 'Remove railway routes that touch the current selected area.';
            if (value.includes('building')) return 'Remove state and map building records in the current selected area.';
            if (value.includes('population')) return 'Set each selected state manpower value to 1.';
            if (value.includes('supply hub')) return 'Remove supply-node records in the current selected area.';
            if (value.includes('water crossing')) return 'Remove strait, canal, and water-based adjacency records touching the current selected area.';
            if (value.includes('resource')) return 'Remove state resource blocks in the current selected area.';
            if (value.includes('development')) return 'Set selected states to the lowest available state category.';
            if (value.includes('wasteland')) return 'Allow the lowest-development action to use the wasteland category.';
            if (value.includes('verify ocean')) return 'Check whether selected provinces satisfy loaded ocean-tile requirements without changing files.';
            if (value.includes('ocean')) return 'Convert selected provinces to ocean and rebuild affected map memberships.';
            if (value.includes('merge selected provinces')) return 'Transfer every selected province pixel into the first selected province and repair references.';
            if (value.includes('state from selected')) return 'Create a new state containing the selected provinces.';
            if (value.includes('assign selected provinces')) return 'Move selected provinces into the currently selected existing state.';
            if (value.includes('new strat region')) return 'Move exactly the selected provinces into a newly created strategic region.';
            if (value.includes('create new tag')) return 'Create a country tag from the selected states.';
            if (value.includes('merge selected states')) return 'Combine selected states into a chosen surviving state.';
            if (value.includes('create strat')) return 'Create a strategic region from the current state or province selection.';
            if (value.includes('assign selected state')) return 'Move selected states into the currently selected strategic region.';
            if (value.includes('remove all provinces')) return 'Clear province membership and direct victory points from the selected states while retaining their records.';
            if (value.includes('transfer selected')) return 'Change owner and controller for the selected states.';
            if (value.includes('auto-core')) return 'Automatically add the new owner as a core when transferring states.';
            if (value.includes('force puppet')) return 'Create or replace the selected country subject relationship.';
            if (value.includes('release puppet')) return 'Remove the selected country subject relationship.';
            if (value.includes('annex country')) return 'Transfer every state owned by the selected country to another country.';
            if (value.includes('province tools')) return 'Create, merge, assign, and repair province records.';
            if (value.includes('state tools')) return 'Create, merge, transfer, and assign state records.';
            if (value.includes('country tools')) return 'Change ownership and subject relationships for the selected country.';
            if (value.includes('selected area')) return 'Run bulk map and history operations inside the current selection.';
            return feLocalize('worldmap.contextmenu.action.tooltip', 'Run or configure: {0}', label);
        };
        const addFallbackTooltips = (menuItems: ContextMenuItem[]) => {
            for (const item of menuItems) {
                item.tooltip ??= describeAction(item.label);
                if (item.submenu) addFallbackTooltips(item.submenu);
            }
        };
        addFallbackTooltips(items);
        return items;
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
                    this.hoverCountryTag$.next(undefined);
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
                    this.paintLineTo(mapX, mapY);
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

                const hoverState = stateId === undefined ? undefined : worldMap.getStateById(stateId);
                this.hoverCountryTag$.next(
                    hoverState ? solveWithCondition(hoverState.owner, this.selectedConditions$.value) : undefined
                );
            })
        );

        this.addSubscription(
            fromEvent(canvas, 'mouseleave').subscribe(() => {
                this.hoverProvinceId$.next(undefined);
                this.hoverStateId$.next(undefined);
                this.hoverStrategicRegionId$.next(undefined);
                this.hoverSupplyAreaId$.next(undefined);
                this.hoverCountryTag$.next(undefined);

                this.isPainting = false;
                this.lastPaintMapPosition = undefined;
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
                    if (this.paintbrushSavePending) {
                        e.preventDefault();
                        return;
                    }
                    this.paintStrokeHistoryRecorded = false;
                    const position = this.eventToMapPosition(canvas, e);

                    if (
                        position &&
                        position.y >= 0 &&
                        position.y < this.loader.worldMap!.height
                    ) {
                        this.hoverMapX$.next(position.x);
                        this.hoverMapY$.next(position.y);
                        if (this.paintTool === 'fill') {
                            this.isPainting = false;
                            this.lastPaintMapPosition = undefined;
                            this.fillAtPosition(position.x, position.y);
                        } else {
                            this.isPainting = true;
                            this.lastPaintMapPosition = { x: position.x, y: position.y };
                            this.paintAtPosition(position.x, position.y);
                        }
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
                this.lastPaintMapPosition = undefined;
                return;
            }

            pressedLeft = false;
            this.paintStrokeHistoryRecorded = false;
            this.dragProcessedProvinceIds.clear();
            this.dragProcessedStateIds.clear();
            if (dragStarted) {
                this.provinceSelectionHistory.clearRedo();
                this.selectionRedoStackStates.length = 0;
            }
            dragStarted = false;
        }));

        this.addSubscription(fromEvent<MouseEvent>(canvas, 'click').subscribe((e) => {
            if (this.paintbrushActive$.value) {
                return;
            }
            if (dragMoved) {
                dragMoved = false;
                return; // already handled by drag
            }
            if (this.transferWandActive && (this.viewMode$.value === 'province' || this.viewMode$.value === 'state')) {
                e.preventDefault();
                this.applyTransferWand(e.shiftKey);
                return;
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
                case 'country':
                    this.selectedCountryTag$.next(this.selectedCountryTag$.value === this.hoverCountryTag$.value ? undefined : this.hoverCountryTag$.value);
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

        this.addSubscription(this.viewMode$.subscribe(() => {
            this.resetTransferWandTarget();
            this.onViewModeChange();
        }));

        this.addSubscription(this.loader.worldMap$.subscribe(wm => {
            this.refreshWarningsDisplay();
            this.setSearchBoxPlaceHolder(wm);
        }));

        this.addSubscription(combineLatest([this.viewMode$, this.colorSet$]).subscribe(() => {
            if (this.warningsFilterByViewMode || this.warningsFilterByColorSet) {
                this.refreshWarningsDisplay();
            }
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
                if (this.paintbrushActive$.value) {
                    this.undoPaintDraft();
                } else if (this.viewMode$.value === 'state') {
                    this.undoStateSelection();
                } else {
                    this.undoProvinceSelection();
                }
                return;
            }

            if (this.matchesShortcut(e, this.keybinds.selectionRedo)) {
                e.preventDefault();
                if (this.paintbrushActive$.value) {
                    this.redoPaintDraft();
                } else if (this.viewMode$.value === 'state') {
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
                this.paintTool = 'brush';
                this.togglePaintbrushMode();
                return;
            }

            if (key === 'e' && !e.ctrlKey && !e.altKey && !e.metaKey &&
                this.paintbrushActive$.value) {
                e.preventDefault();
                this.togglePaintEraser();
                return;
            }

            if (key === 'f' && !e.ctrlKey && !e.altKey && !e.metaKey) {
                e.preventDefault();
                this.toggleFillBucketMode();
                return;
            }

            if (key === 'w' && !e.ctrlKey && !e.altKey && !e.metaKey) {
                e.preventDefault();
                this.toggleTransferWand();
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

    private setSelectedProvinceIds(
        nextSelection: Set<number>,
        recordHistory: boolean,
        nextRiverIds: Set<number> = new Set<number>()
    ) {
        const current = this.selectedProvinceIds$.value;
        const currentRiverIds = this.selectedRiverIds$.value;
        if (this.isSameSelection(current, nextSelection) &&
            this.isSameSelection(currentRiverIds, nextRiverIds)) {
            return;
        }

        const largeSelectionReplaced = recordHistory && current.size >= 8 && nextSelection.size <= 1;

        if (recordHistory) {
            this.provinceSelectionHistory.record({
                provinceIds: new Set(current),
                riverIds: new Set(currentRiverIds),
            });
        }

        this.selectedProvinceIds$.next(new Set(nextSelection));
        this.selectedRiverIds$.next(new Set(nextRiverIds));

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
        const previous = this.provinceSelectionHistory.undo(
            this.currentProvinceSelectionSnapshot()
        );
        if (!previous) {
            this.showActionStatus(feLocalize('worldmap.action.noselectionundo', 'No selection history to undo.'));
            return;
        }

        this.selectedProvinceIds$.next(new Set(previous.provinceIds));
        this.selectedRiverIds$.next(new Set(previous.riverIds));
        this.showActionStatus(feLocalize(
            'worldmap.action.selectionundo',
            'Restored selection: {0} provinces selected.',
            previous.provinceIds.size
        ));
    }

    private redoProvinceSelection() {
        const next = this.provinceSelectionHistory.redo(
            this.currentProvinceSelectionSnapshot()
        );
        if (!next) {
            this.showActionStatus(feLocalize('worldmap.action.noselectionredo', 'No selection history to redo.'));
            return;
        }

        this.selectedProvinceIds$.next(new Set(next.provinceIds));
        this.selectedRiverIds$.next(new Set(next.riverIds));
        this.showActionStatus(feLocalize(
            'worldmap.action.selectionredo',
            'Reapplied selection: {0} provinces selected.',
            next.provinceIds.size
        ));
    }

    private currentProvinceSelectionSnapshot(): ProvinceSelectionSnapshot {
        return {
            provinceIds: new Set(this.selectedProvinceIds$.value),
            riverIds: new Set(this.selectedRiverIds$.value),
        };
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

    private applyTransferWand(forceRetarget: boolean) {
        const worldMap = this.loader.worldMap;
        if (this.viewMode$.value === 'province') {
            const provinceId = this.hoverProvinceId$.value;
            if (provinceId === undefined) return;
            const hoveredState = worldMap.getStateByProvinceId(provinceId);
            if (forceRetarget || this.transferWandTargetStateId === undefined) {
                if (!hoveredState) {
                    this.showActionStatus(
                        feLocalize('worldmap.wand.unassigned', 'That province is not assigned to a state. Choose an assigned target province first.'),
                        'warn'
                    );
                    return;
                }
                this.transferWandTargetStateId = hoveredState.id;
                this.showActionStatus(feLocalize(
                    'worldmap.wand.targetstate',
                    'Transfer Wand target is state {0}. Click any land, lake, or ocean province to move it. Shift+click to retarget.',
                    hoveredState.id
                ));
                return;
            }
            if (hoveredState?.id === this.transferWandTargetStateId) {
                this.showActionStatus(feLocalize('worldmap.wand.alreadyassigned', 'Province {0} is already in target state {1}.', provinceId, hoveredState.id));
                return;
            }
            if (hoveredState && hoveredState.provinces.length <= 1) {
                this.showActionStatus(feLocalize(
                    'worldmap.wand.wouldemptystate',
                    'Moving province {0} would leave state {1} empty. Merge the state or move another province into it first.',
                    provinceId,
                    hoveredState.id
                ), 'warn');
                return;
            }
            const affected = [
                ...(hoveredState ? [hoveredState.id] : []),
                this.transferWandTargetStateId,
            ];
            const before = worldMap.snapshotStates(affected);
            const changed = worldMap.assignProvincesToState([provinceId], this.transferWandTargetStateId);
            if (!changed?.length) {
                this.showActionStatus(feLocalize('worldmap.wand.nochange', 'The province could not be reassigned.'), 'warn');
                return;
            }
            const after = worldMap.snapshotStates(changed);
            this.recordMapEdit(before, after);
            this.persistStates(changed);
            this.mapMutation$.next(this.mapMutation$.value + 1);
            this.showActionStatus(feLocalize(
                'worldmap.wand.provincemoved',
                'Moved province {0} from state {1} to state {2}.',
                provinceId,
                hoveredState?.id ?? 'unassigned',
                this.transferWandTargetStateId
            ));
            return;
        }

        const stateId = this.hoverStateId$.value;
        const state = worldMap.getStateById(stateId);
        if (!state) return;
        if (forceRetarget || (this.transferWandOwner === undefined && this.transferWandController === undefined)) {
            this.transferWandOwner = solveWithCondition(state.owner, this.selectedConditions$.value);
            this.transferWandController = solveWithCondition(state.controller, this.selectedConditions$.value);
            if (!this.transferWandOwner && !this.transferWandController) {
                this.showActionStatus(feLocalize('worldmap.wand.noownership', 'That state has no active owner or controller to copy.'), 'warn');
                return;
            }
            this.showActionStatus(feLocalize(
                'worldmap.wand.targetownership',
                'Transfer Wand copied owner {0} and controller {1} from state {2}. Click states to apply both. Shift+click to copy a new source.',
                this.transferWandOwner ?? 'none',
                this.transferWandController ?? this.transferWandOwner ?? 'none',
                state.id
            ));
            return;
        }

        const before = worldMap.snapshotStates([state.id]);
        if (this.transferWandOwner) {
            state.owner = [{ condition: true, value: this.transferWandOwner }];
            if (this.autoCoreTransfers && !state.cores.some(core => core.value === this.transferWandOwner && core.condition === true)) {
                state.cores.push({ condition: true, value: this.transferWandOwner });
            }
        }
        const controller = this.transferWandController ?? this.transferWandOwner;
        state.controller = controller ? [{ condition: true, value: controller }] : [];
        const after = worldMap.snapshotStates([state.id]);
        this.recordMapEdit(before, after);
        this.persistStates([state.id]);
        this.mapMutation$.next(this.mapMutation$.value + 1);
        this.showActionStatus(feLocalize(
            'worldmap.wand.ownershipapplied',
            'Applied owner {0} and controller {1} to state {2}.',
            this.transferWandOwner ?? 'none',
            controller ?? 'none',
            state.id
        ));
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
        // Works with one or more selected provinces. With multiple selected,
        // painting stays clamped to their union (see paintAtPosition); the
        // first selected province is only used as the metadata/type source.
        const selectedProvinceIds = Array.from(this.selectedProvinceIds$.value.values());
        if (selectedProvinceIds.length < 1) {
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

    private loadFillBucketButton() {
        const button = document.getElementById('toggle-fillbucket') as HTMLButtonElement | null;
        if (!button) return;
        this.addSubscription(fromEvent<MouseEvent>(button, 'click').subscribe(event => {
            event.preventDefault();
            event.stopPropagation();
            this.toggleFillBucketMode();
        }));
        this.addSubscription(combineLatest([
            this.selectedProvinceIds$,
            this.paintbrushActive$,
            this.loader.loading$,
        ]).subscribe(([selected, active, loading]) => {
            button.disabled = loading || this.paintbrushSavePending || (!active && selected.size !== 1);
            button.classList.toggle('active', active && this.paintTool === 'fill');
            button.setAttribute('aria-pressed', String(active && this.paintTool === 'fill'));
        }));
    }

    private toggleFillBucketMode() {
        if (this.paintbrushActive$.value) {
            this.paintTool = this.paintTool === 'fill' ? 'brush' : 'fill';
            this.paintbrushActive$.next(true);
            this.showActionStatus(this.paintTool === 'fill'
                ? feLocalize('worldmap.fillbucket.active', 'Fill bucket active. Click a connected donor province area, then Apply.')
                : feLocalize('worldmap.paintbrush.active', 'Paintbrush active. Drag to transfer pixels, then Apply.'));
            return;
        }
        const selected = Array.from(this.selectedProvinceIds$.value);
        const target = selected.length === 1
            ? this.loader.worldMap.getProvinceById(selected[0])
            : undefined;
        if (!target) {
            this.showActionStatus(feLocalize('worldmap.fillbucket.target', 'Select exactly one existing target province before using Fill Bucket.'), 'warn');
            return;
        }
        this.paintTool = 'fill';
        this.enterPaintbrushMode(target, true);
        this.showActionStatus(feLocalize('worldmap.fillbucket.active', 'Fill bucket active. Click a connected donor province area, then Apply.'));
    }

    private loadTransferWandButton() {
        const button = document.getElementById('toggle-transfer-wand') as HTMLButtonElement | null;
        if (!button) return;
        this.addSubscription(fromEvent<MouseEvent>(button, 'click').subscribe(event => {
            event.preventDefault();
            event.stopPropagation();
            this.toggleTransferWand();
        }));
        this.addSubscription(combineLatest([this.viewMode$, this.loader.loading$]).subscribe(([mode, loading]) => {
            button.disabled = loading || (mode !== 'province' && mode !== 'state');
            button.classList.toggle('active', this.transferWandActive);
            button.setAttribute('aria-pressed', String(this.transferWandActive));
        }));
    }

    private toggleTransferWand() {
        this.transferWandActive = !this.transferWandActive;
        this.resetTransferWandTarget();
        const button = document.getElementById('toggle-transfer-wand') as HTMLButtonElement | null;
        button?.classList.toggle('active', this.transferWandActive);
        if (button) {
            button.setAttribute('aria-pressed', String(this.transferWandActive));
        }
        this.showActionStatus(this.transferWandActive
            ? feLocalize('worldmap.wand.picktarget', 'Transfer Wand active. Click a target state or ownership source first. Shift+click later to retarget.')
            : feLocalize('worldmap.wand.off', 'Transfer Wand disabled.'));
    }

    private resetTransferWandTarget() {
        this.transferWandTargetStateId = undefined;
        this.transferWandOwner = undefined;
        this.transferWandController = undefined;
    }

    private mergeSelectedProvinces() {
        const selectedIds = Array.from(this.selectedProvinceIds$.value);
        if (selectedIds.length < 2 || this.paintbrushSavePending || this.pendingProvinceMerge) {
            return;
        }

        const targetId = selectedIds[0];
        const target = this.loader.worldMap.getProvinceById(targetId);
        const sources = selectedIds.slice(1)
            .map(id => this.loader.worldMap.getProvinceById(id))
            .filter((province): province is NonNullable<typeof province> => !!province);
        if (!target || target.id <= 0 || target.color === 0 ||
            sources.length !== selectedIds.length - 1 ||
            sources.some(source => source.id <= 0 || source.color === 0)) {
            this.showActionStatus(feLocalize('worldmap.action.mergeprovinces.invalid', 'One or more selected provinces no longer exist.'), 'warn');
            return;
        }
        if (sources.some(source => source.type !== target.type)) {
            this.showActionStatus(
                feLocalize('worldmap.action.mergeprovinces.mixedtypes', 'Land, sea, and lake provinces cannot be merged together.'),
                'warn'
            );
            return;
        }
        const targetStateId = this.loader.worldMap.getStateByProvinceId(targetId)?.id;
        const targetRegionId = this.loader.worldMap.getStrategicRegionByProvinceId(targetId)?.id;
        if (sources.some(source => this.loader.worldMap.getStateByProvinceId(source.id)?.id !== targetStateId)) {
            this.showActionStatus(
                feLocalize('worldmap.action.mergeprovinces.mixedstates', 'Selected provinces must belong to the same state before merging.'),
                'warn'
            );
            return;
        }
        if (sources.some(source => this.loader.worldMap.getStrategicRegionByProvinceId(source.id)?.id !== targetRegionId)) {
            this.showActionStatus(
                feLocalize('worldmap.action.mergeprovinces.mixedregions', 'Selected provinces must belong to the same strategic region before merging.'),
                'warn'
            );
            return;
        }

        const previousProvinces = this.collectCurrentProvinceDefs();
        const result = this.loader.worldMap.mergeProvinces(targetId, selectedIds.slice(1));
        if (!result || result.paintedPixels.size === 0) {
            this.showActionStatus(feLocalize('worldmap.action.mergeprovinces.nochange', 'No provinces were merged.'), 'warn');
            return;
        }

        this.setSelectedProvinceIds(new Set([targetId]), true);
        this.mapMutation$.next(this.mapMutation$.value + 1);
        this.refreshAfterPaintbrushSave = true;
        this.pendingProvinceMerge = {
            targetId,
            sourceCount: selectedIds.length - 1,
        };

        vscode.postMessage<WorldMapMessage>({
            command: 'persistprovincebmp',
            paintedPixels: Array.from(result.paintedPixels.entries()).map(([key, color]) => {
                const [x, y] = key.split(',').map(Number);
                return [x, y, color];
            }),
            width: this.loader.worldMap.width,
            height: this.loader.worldMap.height,
            provinces: this.collectCurrentProvinceDefs(),
            previousProvinces,
            deletedProvinceIds: result.deletedProvinceIds,
            provinceReplacements: Object.fromEntries(result.deletedProvinceIds.map(id => [id, targetId])),
            targetProvinceId: targetId,
            states: this.collectPersistedStates(result.changedStateIds),
            strategicRegions: this.collectPersistedStrategicRegions(result.changedStrategicRegionIds),
        });

        this.showActionStatus(feLocalize('worldmap.action.mergeprovinces.pending', 'Saving province merge...'));
    }

    private requestDestructiveReindex() {
        if (this.reindexPending) return;
        this.reindexPending = true;
        vscode.postMessage<WorldMapMessage>({ command: 'reindexmap' });
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
        if (targetProvince && useExistingColor) {
            clampedIds.delete(targetProvince.id);
            // With one selected target, allow transfer from any same-type
            // existing province. With multiple selections, the remaining
            // selected provinces are an explicit donor clamp.
            this.paintAllowedProvinceIds = clampedIds.size > 0 ? clampedIds : undefined;
        } else {
            this.paintAllowedProvinceIds = clampedIds.size > 0 ? clampedIds : undefined;
        }

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
            // A brand-new province is being created whenever we're not simply
            // repainting an existing province's own colour (see the branch above).
            isNewProvince: !(targetProvince && useExistingColor),
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
        this.paintDraftHistory.clear();
        this.syncPaintDraftHistoryAvailability();
        this.paintStrokeHistoryRecorded = false;
        this.lastPaintMapPosition = undefined;

        // Show the confirmation panel immediately (belt-and-suspenders
        // with the subscription-based approach in loadPaintbrushPanel).
        const panel = document.getElementById('paintbrush-panel');
        if (panel) {
            panel.hidden = false;
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
        this.paintDraftHistory.clear();
        this.syncPaintDraftHistoryAvailability();

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
        this.paintAllowedProvinceIds = undefined;
        this.paintTool = 'brush';
        this.paintbrushSavePending = false;
        this.refreshAfterPaintbrushSave = false;
        this.isPainting = false;
        this.lastPaintMapPosition = undefined;
        this.paintDraftHistory.clear();
        this.syncPaintDraftHistoryAvailability();
        this.paintStrokeHistoryRecorded = false;

        // Hide the confirmation panel directly.
        const panel = document.getElementById('paintbrush-panel');
        if (panel) {
            panel.hidden = true;
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
        this.paintAllowedProvinceIds = undefined;
        this.paintTool = 'brush';
        this.paintbrushSavePending = false;
        this.refreshAfterPaintbrushSave = false;
        this.isPainting = false;
        this.lastPaintMapPosition = undefined;
        this.paintDraftHistory.clear();
        this.syncPaintDraftHistoryAvailability();
        this.paintStrokeHistoryRecorded = false;

        // Hide the confirmation panel directly.
        const panel = document.getElementById('paintbrush-panel');
        if (panel) {
            panel.hidden = true;
            panel.style.display = 'none';
        }

        // No reload needed -  the live map was never mutated.
        this.mapMutation$.next(this.mapMutation$.value + 1);
        sendEvent('worldmap.paintbrush.cancel');
    }

    private syncPaintDraftHistoryAvailability(): void {
        this.paintDraftCanUndo$.next(this.paintDraftHistory.canUndo);
        this.paintDraftCanRedo$.next(this.paintDraftHistory.canRedo);
    }

    private recordPaintDraftHistoryBeforeMutation(pixels: ReadonlyMap<string, number>): void {
        if (this.paintStrokeHistoryRecorded) {
            return;
        }
        this.paintDraftHistory.record(pixels);
        this.paintStrokeHistoryRecorded = true;
        this.syncPaintDraftHistoryAvailability();
    }

    private restorePaintDraftPixels(pixels: Map<string, number>): void {
        const draft = this.provinceDraft$.value;
        if (!draft) {
            return;
        }
        const restoredPixels = new Map(pixels);
        this.provinceDraft$.next({ ...draft, pixels: restoredPixels });
        this.paintedPixels$.next(restoredPixels);
        this.isPainting = false;
        this.lastPaintMapPosition = undefined;
        this.paintStrokeHistoryRecorded = false;
    }

    private undoPaintDraft(): void {
        const draft = this.provinceDraft$.value;
        if (!this.paintbrushActive$.value || this.paintbrushSavePending || !draft) {
            return;
        }
        const previous = this.paintDraftHistory.undo(draft.pixels);
        if (!previous) {
            this.showActionStatus(feLocalize(
                'worldmap.paintbrush.nodraftundo',
                'No earlier painted region to restore.'
            ));
            return;
        }
        this.restorePaintDraftPixels(previous);
        this.syncPaintDraftHistoryAvailability();
        this.showActionStatus(feLocalize(
            'worldmap.paintbrush.draftundo',
            'Restored painted region: {0} staged pixels.',
            previous.size
        ));
    }

    private redoPaintDraft(): void {
        const draft = this.provinceDraft$.value;
        if (!this.paintbrushActive$.value || this.paintbrushSavePending || !draft) {
            return;
        }
        const next = this.paintDraftHistory.redo(draft.pixels);
        if (!next) {
            this.showActionStatus(feLocalize(
                'worldmap.paintbrush.nodraftredo',
                'No later painted region to reapply.'
            ));
            return;
        }
        this.restorePaintDraftPixels(next);
        this.syncPaintDraftHistoryAvailability();
        this.showActionStatus(feLocalize(
            'worldmap.paintbrush.draftredo',
            'Reapplied painted region: {0} staged pixels.',
            next.size
        ));
    }

    private togglePaintEraser(): void {
        if (!this.paintbrushActive$.value || this.paintbrushSavePending) {
            return;
        }
        this.paintTool = this.paintTool === 'erase' ? 'brush' : 'erase';
        this.isPainting = false;
        this.lastPaintMapPosition = undefined;
        this.paintStrokeHistoryRecorded = false;
        this.paintbrushActive$.next(true);
        this.showActionStatus(this.paintTool === 'erase'
            ? feLocalize(
                'worldmap.paintbrush.eraseractive',
                'Paint eraser active. Drag over staged pixels to reveal their original map colors.'
            )
            : feLocalize('worldmap.paintbrush.active', 'Paintbrush active. Drag to transfer pixels, then Apply.'));
    }

    /**
     * Paint a continuous stroke from the last painted position to (mapX, mapY),
     * interpolating intermediate points so fast mouse movement doesn't leave gaps
     * between mousemove samples. Falls back to a single dab when there's no
     * previous position (start of stroke) or no movement occurred.
     */
    private paintLineTo(mapX: number, mapY: number) {
        const worldMap = this.loader.worldMap;
        const last = this.lastPaintMapPosition;
        const positions = getInterpolatedBrushPositions(
            last,
            { x: mapX, y: mapY },
            worldMap?.width ?? 0
        );
        this.paintAtPositions(positions);
        this.lastPaintMapPosition = { x: mapX, y: mapY };
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
        this.paintAtPositions([{ x: mapX, y: mapY }]);
    }

    /**
     * Apply all dabs produced by one sampled pointer event as one transaction.
     * This keeps stroke interpolation exact without cloning and rendering the
     * growing draft once per intermediate map pixel.
     */
    private paintAtPositions(positions: ReadonlyArray<{ x: number; y: number }>) {
        const draft = this.provinceDraft$.value;
        if (!this.paintbrushActive$.value || !draft) {
            return;
        }

        const worldMap = this.loader.worldMap;
        const result = applyBrushStroke(
            draft.pixels,
            {
                width: worldMap.width,
                height: worldMap.height,
                getColorAt: (x, y) => worldMap.getColorAt(x, y),
                getProvinceIdAt: (x, y) => worldMap.getProvinceByPosition(x, y)?.id,
                getProvinceTypeAt: (x, y) => worldMap.getProvinceTypeAt(x, y),
            },
            {
                positions,
                size: this.brushSize$.value,
                color: this.paintbrushColor$.value,
                tool: this.paintTool === 'erase' ? 'erase' : 'brush',
                sourceProvinceType: this.sourceProvinceType,
                allowedProvinceIds: this.paintAllowedProvinceIds,
            }
        );

        if (result.changed) {
            this.recordPaintDraftHistoryBeforeMutation(draft.pixels);
            this.provinceDraft$.next({ ...draft, pixels: result.pixels });
            this.paintedPixels$.next(result.pixels);
        }
    }

    /**
     * Flood-fill one connected component of an existing donor province into
     * the selected existing target province. This never allocates a new color
     * or province record.
     */
    private fillAtPosition(mapX: number, mapY: number) {
        const draft = this.provinceDraft$.value;
        const worldMap = this.loader.worldMap;
        if (!this.paintbrushActive$.value || !draft || draft.isNewProvince) {
            this.showActionStatus(feLocalize('worldmap.fillbucket.existingonly', 'Fill Bucket requires an existing target province.'), 'warn');
            return;
        }
        const startColor = worldMap.getColorAt(mapX, mapY);
        const targetColor = this.paintbrushColor$.value;
        if (startColor === undefined || startColor === 0 || startColor === targetColor) {
            this.showActionStatus(feLocalize('worldmap.fillbucket.invalidstart', 'Click pixels belonging to a different existing province.'), 'warn');
            return;
        }
        const donor = worldMap.getProvinceByPosition(mapX, mapY);
        if (!donor || donor.type !== this.sourceProvinceType) {
            this.showActionStatus(feLocalize('worldmap.fillbucket.mixedtypes', 'Fill Bucket cannot transfer pixels between land, sea, and lake province types.'), 'warn');
            return;
        }
        if (this.paintAllowedProvinceIds && !this.paintAllowedProvinceIds.has(donor.id)) {
            this.showActionStatus(feLocalize('worldmap.fillbucket.outsideclamp', 'That province is outside the selected donor set.'), 'warn');
            return;
        }

        const width = worldMap.width;
        const height = worldMap.height;
        const pending: number[] = [mapY * width + mapX];
        const visited = new Set<number>();
        const newDraftPixels = new Map(draft.pixels);
        const newOverlayPixels = new Map(this.paintedPixels$.value);
        let changed = 0;
        while (pending.length > 0) {
            const index = pending.pop()!;
            if (visited.has(index)) continue;
            visited.add(index);
            const x = index % width;
            const y = Math.floor(index / width);
            const key = `${x},${y}`;
            const effectiveColor = draft.pixels.get(key) ?? worldMap.getColorAt(x, y);
            if (effectiveColor !== startColor) continue;
            newDraftPixels.set(key, targetColor);
            newOverlayPixels.set(key, targetColor);
            changed++;

            const left = y * width + ((x - 1 + width) % width);
            const right = y * width + ((x + 1) % width);
            pending.push(left, right);
            if (y > 0) pending.push(index - width);
            if (y + 1 < height) pending.push(index + width);
        }
        if (changed === 0) return;
        let previouslyTransferred = 0;
        for (const key of draft.pixels.keys()) {
            const [x, y] = key.split(',').map(Number);
            if (worldMap.getColorAt(x, y) === startColor) previouslyTransferred++;
        }
        if (donor.mass - previouslyTransferred - changed <= 0) {
            this.showActionStatus(feLocalize(
                'worldmap.fillbucket.woulddelete',
                'Fill would remove every pixel of province {0}. Use Merge Provinces for a whole-province transfer.',
                donor.id
            ), 'warn');
            return;
        }
        this.recordPaintDraftHistoryBeforeMutation(draft.pixels);
        this.provinceDraft$.next({ ...draft, pixels: newDraftPixels });
        this.paintedPixels$.next(newOverlayPixels);
        this.showActionStatus(feLocalize(
            'worldmap.fillbucket.done',
            'Filled {0} connected pixels from province {1} into province {2}. Review the preview, then Apply.',
            changed,
            donor.id,
            draft.sourceProvinceId
        ));
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

    private persistStrategicRegions(
        srIds: number[],
        deletedFiles: string[] = [],
        deletedRegions: Array<{ id: number; file: string }> = []
    ) {
        const payload = this.collectPersistedStrategicRegions(srIds);

        if (payload.length > 0 || deletedFiles.length > 0 || deletedRegions.length > 0) {
            vscode.postMessage<WorldMapMessage>({
                command: 'persiststrategicregions',
                strategicRegions: payload,
                deletedFiles: Array.from(new Set(deletedFiles)),
                deletedRegions,
            } as any);
        }
    }

    private collectPersistedStrategicRegions(srIds: number[]) {
        return Array.from(new Set(srIds))
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
                preserveUnknownContent: !!sr.token,
            }));
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

    private createStrategicRegionFromSelectedProvinces() {
        const selectedProvinceIds = Array.from(this.selectedProvinceIds$.value.values());
        if (selectedProvinceIds.length === 0) {
            this.showActionStatus(feLocalize(
                'worldmap.action.createstrategic.provinces.missingselection',
                'Select one or more provinces first.'
            ), 'warn');
            return;
        }
        this.showDestructiveActionConfirmation(
            feLocalize('worldmap.action.createstrategic.provinces.title', 'Create Strategic Region from Provinces'),
            feLocalize(
                'worldmap.action.createstrategic.provinces.confirm',
                'Move exactly {0} selected province(s) out of their current strategic regions and into a new strategic region? Empty source regions will be removed.',
                selectedProvinceIds.length
            ),
            feLocalize('worldmap.action.createstrategic.provinces.apply', 'Create Region'),
            () => this.applyCreateStrategicRegionFromProvinces(selectedProvinceIds)
        );
    }

    private applyCreateStrategicRegionFromProvinces(selectedProvinceIds: number[]) {
        const nextId = this.loader.worldMap.getNextStrategicRegionId();
        const beforeIds = new Set<number>([nextId]);
        for (const provinceId of selectedProvinceIds) {
            const source = this.loader.worldMap.getStrategicRegionByProvinceId(provinceId);
            if (source) {
                beforeIds.add(source.id);
            }
        }
        const before = this.loader.worldMap.snapshotStrategicRegions(Array.from(beforeIds));
        const created = this.loader.worldMap.createStrategicRegionFromProvinces(selectedProvinceIds);
        if (!created) {
            this.showActionStatus(feLocalize(
                'worldmap.action.createstrategic.provinces.nochange',
                'No strategic region was created.'
            ), 'warn');
            return;
        }
        const after = this.loader.worldMap.snapshotStrategicRegions(created.changedRegionIds);
        this.recordMapEdit(before, after, 'strategicregion');
        this.persistStrategicRegions(
            created.changedRegionIds,
            created.deletedFiles,
            created.deletedRegions
        );
        this.selectedStrategicRegionId$.next(created.newStrategicRegionId);
        this.mapMutation$.next(this.mapMutation$.value + 1);
        this.showActionStatus(feLocalize(
            'worldmap.action.createstrategic.provinces.done',
            'Created strategic region {0} from {1} selected province(s).',
            created.newStrategicRegionId,
            selectedProvinceIds.length
        ));
    }

    private verifySelectedOceanTileReadiness() {
        const selectedProvinceIds = Array.from(this.selectedProvinceIds$.value.values());
        if (selectedProvinceIds.length === 0) {
            this.showActionStatus(feLocalize(
                'worldmap.ocean.readiness.missingselection',
                'Select one or more provinces to verify.'
            ), 'warn');
            return;
        }
        const selected = new Set(selectedProvinceIds);
        const stateIdsByProvince = new Map<number, number[]>();
        this.loader.worldMap.forEachState(state => {
            for (const provinceId of state.provinces) {
                if (!selected.has(provinceId)) {
                    continue;
                }
                const ids = stateIdsByProvince.get(provinceId) ?? [];
                ids.push(state.id);
                stateIdsByProvince.set(provinceId, ids);
            }
        });
        const regionIdsByProvince = new Map<number, number[]>();
        this.loader.worldMap.forEachStrategicRegion(region => {
            for (const provinceId of region.provinces) {
                if (!selected.has(provinceId)) {
                    continue;
                }
                const ids = regionIdsByProvince.get(provinceId) ?? [];
                ids.push(region.id);
                regionIdsByProvince.set(provinceId, ids);
            }
        });
        const railwayReferences = new Map<number, number>();
        this.loader.worldMap.forEachRailway(railway => {
            for (const provinceId of new Set(railway.provinces)) {
                if (selected.has(provinceId)) {
                    railwayReferences.set(
                        provinceId,
                        (railwayReferences.get(provinceId) ?? 0) + 1
                    );
                }
            }
        });
        const supplyNodeProvinceIds = new Set<number>();
        this.loader.worldMap.forEachSupplyNode(node => {
            if (selected.has(node.province)) {
                supplyNodeProvinceIds.add(node.province);
            }
        });
        const issueLabels: Record<OceanTileReadinessIssue, string> = {
            'invalid-id': 'invalid or synthetic province ID',
            'missing-color': 'missing nonzero definition color',
            'missing-pixels': 'no loaded province pixels',
            'not-sea': 'definition type is not sea',
            'not-ocean-terrain': 'terrain is not ocean',
            'nonzero-continent': 'continent is not 0',
            'coastal-flag': 'coastal flag is true',
            'state-membership': 'still belongs to a state',
            'strategic-region-membership': 'must belong to exactly one strategic region',
            'railway-reference': 'still referenced by a railway',
            'supply-node-reference': 'still has a supply hub',
        };
        const reports = selectedProvinceIds.map(provinceId => {
            const province = this.loader.worldMap.getProvinceById(provinceId);
            const result = verifyOceanTileReadiness({
                id: province?.id ?? provinceId,
                color: province?.color ?? 0,
                mass: province?.mass ?? 0,
                type: province?.type ?? '',
                terrain: province?.terrain ?? '',
                continent: province?.continent ?? -1,
                coastal: province?.coastal ?? false,
                stateIds: stateIdsByProvince.get(provinceId) ?? [],
                strategicRegionIds: regionIdsByProvince.get(provinceId) ?? [],
                railwayReferences: railwayReferences.get(provinceId) ?? 0,
                hasSupplyNode: supplyNodeProvinceIds.has(provinceId),
            });
            return { provinceId, ...result };
        });
        const readyCount = reports.filter(report => report.ready).length;
        const lines = [
            feLocalize(
                'worldmap.ocean.readiness.summary',
                '{0} of {1} selected province(s) are ocean-tile ready.',
                readyCount,
                reports.length
            ),
            feLocalize(
                'worldmap.ocean.readiness.readonly',
                'Read-only verification: no files were changed. Map-building and external scripted references are not loaded by this check.'
            ),
            '',
            ...reports.slice(0, 100).map(report => report.ready
                ? `READY  Province ${report.provinceId}`
                : `BLOCKED  Province ${report.provinceId}: ${report.issues.map(issue => issueLabels[issue]).join('; ')}`
            ),
        ];
        if (reports.length > 100) {
            lines.push(feLocalize(
                'worldmap.ocean.readiness.truncated',
                'Only the first 100 province results are shown.'
            ));
        }
        const modal = document.getElementById('ocean-readiness-modal') as HTMLDivElement | null;
        const summary = document.getElementById('ocean-readiness-summary');
        const close = document.getElementById('ocean-readiness-close') as HTMLButtonElement | null;
        if (!modal || !summary || !close) {
            this.showActionStatus(lines[0], readyCount === reports.length ? undefined : 'warn');
            return;
        }
        summary.textContent = lines.join('\n');
        modal.hidden = false;
        modal.style.display = 'flex';
        close.focus();
        this.showActionStatus(lines[0], readyCount === reports.length ? undefined : 'warn');
    }

    private createStrategicRegionFromSelection() {
        const explicitStateSelection = Array.from(this.selectedStateIds$.value.values());
        const selectedStateIds = new Set<number>(explicitStateSelection);

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
            this.persistStrategicRegions(
                created.changedRegionIds,
                created.deletedFiles,
                created.deletedRegions
            );
            this.selectedStrategicRegionId$.next(created.newStrategicRegionId);
            this.mapMutation$.next(this.mapMutation$.value + 1);
            this.showActionStatus(feLocalize('worldmap.action.createstrategic.done', 'Created strategic region {0} from selection.', created.newStrategicRegionId));
        } else {
            this.showActionStatus(feLocalize('worldmap.action.createstrategic.nochange', 'No strategic region was created.'), 'warn');
        }
    }

    private persistStates(
        stateIds: number[],
        deletedFiles: string[] = [],
        deletedStates: Array<{ id: number; file: string }> = [],
        requestId?: string,
        stateReplacements?: Record<number, number>
    ) {
        const payload = this.collectPersistedStates(stateIds);

        if (payload.length > 0 || deletedFiles.length > 0 || deletedStates.length > 0) {
            vscode.postMessage<WorldMapMessage>({
                command: 'persiststates',
                states: payload,
                deletedFiles: Array.from(new Set(deletedFiles)),
                deletedStates,
                requestId,
                stateReplacements,
            });
        }
    }

    private collectPersistedStates(stateIds: number[]): PersistedState[] {
        return Array.from(new Set(stateIds))
            .map(id => this.loader.worldMap.getStateById(id))
            .filter((state): state is NonNullable<typeof state> => !!state)
            .map(state => ({
                id: state.id,
                name: state.name,
                manpower: state.manpower,
                category: state.category,
                owner: solveWithCondition(state.owner, this.selectedConditions$.value),
                controller: solveWithCondition(state.controller, this.selectedConditions$.value),
                provinces: [...state.provinces],
                cores: solveWithConditionAsSet(state.cores, this.selectedConditions$.value),
                impassable: state.impassable,
                victoryPoints: { ...state.victoryPoints },
                resources: { ...state.resources },
                file: state.file,
                tokenStart: state.token?.start,
                tokenEnd: state.token?.end,
                preserveUnknownContent: true,
            }));
    }

    private confirmRemoveAllProvincesFromSelectedStates() {
        const stateIds = Array.from(this.selectedStateIds$.value)
            .filter(id => !!this.loader.worldMap.getStateById(id));
        if (stateIds.length === 0) {
            this.showActionStatus(feLocalize(
                'worldmap.action.emptystates.missingselection',
                'Select one or more states first.'
            ), 'warn');
            return;
        }
        const provinceCount = new Set(stateIds.flatMap(
            id => this.loader.worldMap.getStateById(id)?.provinces ?? []
        )).size;
        this.showDestructiveActionConfirmation(
            feLocalize('worldmap.action.emptystates.title', 'Remove All Provinces from States'),
            feLocalize(
                'worldmap.action.emptystates.confirm',
                'Remove {0} province membership(s) and all direct victory points from {1} selected state(s)? The state records and their other content remain. Empty states are not HOI4-ready until provinces are reassigned or the states are deleted.',
                provinceCount,
                stateIds.length
            ),
            feLocalize('worldmap.action.emptystates.apply', 'Remove Provinces'),
            () => this.applyRemoveAllProvincesFromStates(stateIds)
        );
    }

    private applyRemoveAllProvincesFromStates(stateIds: number[]) {
        const before = this.loader.worldMap.snapshotStates(stateIds);
        const changedStateIds = this.loader.worldMap.clearStateProvinceMembership(stateIds);
        if (!changedStateIds) {
            this.showActionStatus(feLocalize(
                'worldmap.action.emptystates.nochange',
                'The selected states already have no province membership.'
            ));
            return;
        }
        const after = this.loader.worldMap.snapshotStates(changedStateIds);
        this.recordMapEdit(before, after, 'state');
        this.persistStates(changedStateIds);
        this.mapMutation$.next(this.mapMutation$.value + 1);
        this.showActionStatus(feLocalize(
            'worldmap.action.emptystates.done',
            'Removed every province and direct victory point from {0} state(s).',
            changedStateIds.length
        ));
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

    private getPersistenceTargets(
        target: any[],
        source: any[],
        type: 'state' | 'strategicregion' | 'province'
    ): {
        ids: number[];
        deletedFiles: string[];
        deletedRecords: Array<{ id: number; file: string }>;
    } {
        const ids: number[] = [];
        const deletedFiles: string[] = [];
        const deletedRecords: Array<{ id: number; file: string }> = [];

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
        }

        for (const snapshot of target) {
            const current = type === 'strategicregion' ? snapshot.strategicRegion :
                type === 'province' ? snapshot.province : snapshot.state;
            if (current) continue;
            const previous = sourceById[snapshot.id];
            if (!previous?.file) {
                continue;
            }
            let hasRetainedRecord = false;
            if (type === 'strategicregion') {
                this.loader.worldMap.forEachStrategicRegion(region => {
                    if (region.file === previous.file) {
                        hasRetainedRecord = true;
                        return false;
                    }
                });
            } else if (type === 'state') {
                this.loader.worldMap.forEachState(state => {
                    if (state.file === previous.file) {
                        hasRetainedRecord = true;
                        return false;
                    }
                });
            }
            if (hasRetainedRecord) {
                deletedRecords.push({ id: snapshot.id, file: previous.file });
            } else {
                deletedFiles.push(previous.file);
            }
        }

        return { ids, deletedFiles, deletedRecords };
    }

    private applyPersistence(
        persister: {
            ids: number[];
            deletedFiles: string[];
            deletedRecords: Array<{ id: number; file: string }>;
        },
        type: 'state' | 'strategicregion' | 'province'
    ) {
        switch (type) {
            case 'strategicregion':
                this.persistStrategicRegions(
                    persister.ids,
                    persister.deletedFiles,
                    persister.deletedRecords
                );
                break;
            case 'province':
                this.persistProvinces(persister.ids, persister.deletedFiles);
                break;
            default:
                this.persistStates(
                    persister.ids,
                    persister.deletedFiles,
                    persister.deletedRecords
                );
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

function unionZones(zones: Zone[]): Zone | undefined {
    if (zones.length === 0) {
        return undefined;
    }

    let minX = zones[0].x;
    let minY = zones[0].y;
    let maxX = zones[0].x + zones[0].w;
    let maxY = zones[0].y + zones[0].h;

    for (const z of zones.slice(1)) {
        minX = Math.min(minX, z.x);
        minY = Math.min(minY, z.y);
        maxX = Math.max(maxX, z.x + z.w);
        maxY = Math.max(maxY, z.y + z.h);
    }

    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function colorSetToWarningSourceType(colorSet: ColorSet): string | undefined {
    switch (colorSet) {
        case 'provinceid':
        case 'provincetype':
        case 'terrain':
        case 'continent':
            return 'province';
        case 'stateid':
        case 'statecategory':
        case 'manpower':
        case 'victorypoint':
        case 'resources':
        case 'owner':
        case 'controller':
            return 'state';
        case 'strategicregionid':
            return 'strategicregion';
        case 'supplyareaid':
        case 'supplyvalue':
            return 'supplyarea';
        default:
            return undefined;
    }
}
