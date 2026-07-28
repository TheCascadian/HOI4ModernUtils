import { ConditionComplexExpr, ConditionItem } from "../../hoiformat/condition";
import { Token } from "../../hoiformat/hoiparser";
import { Warning } from "../../util/common";

export interface WorldMapData {
    width: number;
    height: number;
    colorByPosition: number[]; // width * height
    provinces: (Province | undefined | null)[]; // count of provinces
    states: (State | undefined | null)[];
    stateCategories?: StateCategory[];
    countries: Country[];
    strategicRegions: (StrategicRegion | undefined | null)[];
    supplyAreas: (SupplyArea | undefined | null)[];
    railways: (Railway | undefined | null)[];
    supplyNodes: (SupplyNode | undefined | null)[];
    provincesCount: number;
    statesCount: number;
    countriesCount: number;
    strategicRegionsCount: number;
    supplyAreasCount: number;
    railwaysCount: number;
    supplyNodesCount: number;
    badProvincesCount: number; // will be * -1
    badStatesCount: number; // will be * -1;
    badStrategicRegionsCount: number;
    badSupplyAreasCount: number;
    continents: string[];
    terrains: Terrain[];
    resources: Resource[];
    rivers: River[];
    conditionExprs: ConditionItem[];
    bookmarks: Bookmark[];
    diplomacyRelations: DiplomacyRelation[];
    countryHistoryFiles: Record<string, string>;
    warnings: WorldMapWarning[];
}

export type DiplomacyLevel = 'puppet' | 'independent' | 'annexed' | string; // string: autonomy_state name, e.g. autonomy_dominion

export interface DiplomacyRelation {
    overlord: string;
    subject: string;
    level: DiplomacyLevel; // most recent entries for a given (overlord, subject) pair come first
    condition: ConditionComplexExpr;
    file: string;
}

export interface ProvinceBmp {
    width: number;
    height: number;
    colorByPosition: number[]; // width * height
    colorToProvince: Record<number, ProvinceGraph>;
    provinces: ProvinceGraph[];
}

export interface ProvinceMap {
    width: number;
    height: number;
    colorByPosition: number[]; // width * height
    provinces: (Province | undefined | null)[]; // count of provinces
    badProvincesCount: number;
    continents: string[];
    terrains: Terrain[];
    rivers: River[];
}

export interface ProvinceGraph extends Region {
    color: number;
    coverZones: Zone[];
    edges: ProvinceEdgeGraph[];
}

export interface ProvinceDefinition {
    id: number;
    color: number;
    type: string;
    coastal: boolean;
    terrain: string;
    continent: number;
}

export type Province = Omit<ProvinceGraph & ProvinceDefinition, 'edges'> & {
    edges: ProvinceEdge[];
};

export interface ProvinceEdgeGraph {
    toColor: number;
    path: Point[][];
}

export interface ProvinceEdgeAdjacency {
    from: number;
    to: number;
    through?: number;
    type: 'impassable' | string;
    start?: Point;
    stop?: Point;
    rule?: string;
    row: string[];
}

export type ProvinceEdge = Omit<ProvinceEdgeGraph & ProvinceEdgeAdjacency, 'from' | 'row' | 'toColor'>;

export interface Bookmark {
    name: string;
    date: BookmarkDate;
};

export interface BookmarkDate {
    year: number;
    month: number;
    day: number;
    hour: number;
}

export interface State extends Region, TokenInFile {
    id: number;
    name: string;
    localisedName: string | undefined;
    manpower: number;
    category: string;
    categoryColor: number;
    owner: WithCondition<string>[]; // return the first matching country tag
    controller: WithCondition<string>[]; // return the first matching country tag
    provinces: number[];
    cores: WithCondition<string>[];  // each item is a country tag with a condition, representing the core of the state
    impassable: boolean;
    victoryPoints: Record<number, number | undefined>;
    resources: Record<string, number | undefined>;
}

export interface WithCondition<T> {
    condition: ConditionComplexExpr;
    value: T;
}

export interface Railway {
    provinces: number[];
    level: number;
}

export interface SupplyNode {
    province: number;
    level: number;
}

export interface WorldMapWarning extends Warning<WorldMapWarningSource[]> {
    relatedFiles: string[];
}

export type WorldMapWarningSource = WarningSourceProvince | WarningSourceIdOnly | WarningSourceName | WarningRiver;

interface WarningSourceBase {
    type: string;
}

interface WarningSourceProvince extends WarningSourceBase {
    type: 'province';
    id: number | null;
    color: number;
}

interface WarningSourceIdOnly extends WarningSourceBase {
    type: 'state' | 'strategicregion' | 'supplyarea' | 'railway' | 'supplynode';
    id: number;
}

interface WarningSourceName extends WarningSourceBase {
    type: 'statecategory';
    name: string;
}

interface WarningRiver extends WarningSourceBase {
    type: 'river';
    name: string;
    index: number;
}

export interface Country {
    tag: string;
    color: number;
}

export interface Terrain {
    name: string;
    color: number;
    isNaval: boolean;
    file: string;
}

export interface Resource {
    name: string;
    iconFrame: number;
    imageUri: string;
    file: string;
}

export interface StrategicRegion extends Region, TokenInFile {
    id: number;
    name: string;
    localisedName: string | undefined;
    provinces: number[];
    navalTerrain: string | null;
}

export interface SupplyArea extends Region, TokenInFile {
    id: number;
    name: string;
    localisedName: string | undefined;
    value: number;
    states: number[];
}

export interface StateCategory {
    name: string;
    color: number;
    localBuildingSlots: number;
    file: string;
}

export interface RiverBmp {
    width: number;
    height: number;
    rivers: River[];
}

export interface River {
    colors: Record<number, number>;
    ends: number[];
    boundingBox: Zone;
}

export interface Point {
    x: number;
    y: number;
}

export interface Zone {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface Region {
    boundingBox: Zone;
    centerOfMass: Point;
    mass: number;
}

export interface TokenInFile {
    file: string;
    token: Token | null;
}

export type WorldMapMessage = LoadedMessage | RequestMapItemMessage | MapItemMessage | ErrorMessage | ProgressMessage | ProvinceMapSummaryMessage | OpenFileMessage | ExportMapMessage | PersistStatesMessage | PersistStatesResultMessage | PersistStrategicRegionsMessage | PersistProvincesMessage | PersistProvinceBmpMessage | RequestProvinceBmpMessage | ProvinceBmpDataMessage | UndoProvinceBmpMessage | RedoProvinceBmpMessage | ProvinceBmpUpdatedMessage | ResolveProvinceWarningsMessage | ResolveProvinceWarningsResultMessage | RunAreaOperationMessage | AreaOperationResultMessage | RunContinentPipelineMessage | ContinentPipelineResultMessage | RemoveAllCoresMessage | RemoveAllCoresResultMessage | ReindexMapMessage | ReindexMapResultMessage | PersistVictoryPointLocalisationMessage | SetConfirmNewProvinceCreationMessage | SetAutoCoreTransfersMessage | PersistCountryDiplomacyMessage | CountryDiplomacyUpdatedMessage | CreateCountryMessage | CreateCountryResultMessage | WorldMapRuntimeTestReadyMessage | WorldMapRuntimeTestRequestMessage | WorldMapRuntimeTestResultMessage;

export interface LoadedMessage {
    command: 'loaded';
    force: boolean;
}

export interface WorldMapRuntimeTestViewport {
    scale: number;
    x?: number;
    y?: number;
    xRatio?: number;
    yRatio?: number;
}

export type WorldMapRuntimeTestOptimization =
    | 'webgl2-base'
    | 'warning-index'
    | 'edge-decimation'
    | 'river-device-pixel-collapse'
    | 'label-grid-dedupe'
    | 'coarse-provinces';

export interface WorldMapRuntimeTestCase {
    id: string;
    viewMode: string;
    colorSet: string;
    display: string[];
    viewport: WorldMapRuntimeTestViewport;
}

export interface WorldMapRuntimeTestRequest {
    cases: WorldMapRuntimeTestCase[];
    canvasWidth?: number;
    canvasHeight?: number;
    samples?: number;
    warmups?: number;
    capturePixelHash?: boolean;
    timeoutMs?: number;
    optimizations?: WorldMapRuntimeTestOptimization[];
    renderer?: 'canvas2d' | 'webgl2';
}

export interface WorldMapRuntimeTestCaseResult {
    id: string;
    viewMode: string;
    colorSet: string;
    display: string[];
    viewport: {
        x: number;
        y: number;
        scale: number;
    };
    durationMsMedian: number;
    durationMsSamples: number[];
    heapDeltaBytesMedian?: number;
    pixelHash?: string;
    riverFillRects: number;
    riverFullyOutsideViewport: number;
    riverDuplicateRects: number;
    riverCoordinateHash: string;
    error?: string;
}

export interface WorldMapRuntimeTestReport {
    environment: {
        canvasWidth: number;
        canvasHeight: number;
        devicePixelRatio: number;
        userAgent: string;
        mapWidth: number;
        mapHeight: number;
        provinces: number;
        rivers: number;
        optimizations: WorldMapRuntimeTestOptimization[];
        renderer: 'canvas2d' | 'webgl2';
    };
    results: WorldMapRuntimeTestCaseResult[];
    runtimeErrors: string[];
}

export interface WorldMapRuntimeTestReadyMessage {
    command: 'worldmapruntimetestready';
}

export interface WorldMapRuntimeTestRequestMessage {
    command: 'worldmapruntimetest';
    requestId: string;
    request: WorldMapRuntimeTestRequest;
}

export interface WorldMapRuntimeTestResultMessage {
    command: 'worldmapruntimetestresult';
    requestId: string;
    report?: WorldMapRuntimeTestReport;
    error?: string;
}

export interface RequestMapItemMessage {
    command: 'requestprovinces' | 'requeststates' | 'requestcountries' | 'requeststrategicregions' | 'requestsupplyareas' | 'requestrailways' | 'requestsupplynodes';
    start: number;
    end: number;
}

export interface MapItemMessage {
    command: 'provinces' | 'states' | 'countries' | 'warnings' | 'continents' | 'terrains' | 'strategicregions' | 'supplyareas' | 'railways' | 'supplynodes' | 'resources' | 'rivers' | 'conditionexprs';
    data: string;
    start: number;
    end: number;
}

export interface ErrorMessage {
    command: 'error';
    data: string;
}

export interface ProgressMessage {
    command: 'progress';
    data: string;
}

export interface ProvinceMapSummaryMessage {
    command: 'provincemapsummary';
    data: WorldMapData;
}

export interface OpenFileMessage {
    command: 'openfile';
    type: 'state' | 'strategicregion' | 'supplyarea';
    file: string;
    start: number | undefined;
    end: number | undefined;
}

export interface ExportMapMessage {
    command: 'exportmap' | 'requestexportmap';
    dataUrl?: string;
}

export interface SetConfirmNewProvinceCreationMessage {
    command: 'setconfirmnewprovincecreation';
    value: boolean;
}

export interface SetAutoCoreTransfersMessage {
    command: 'setautocoretransfers';
    value: boolean;
}

export interface ResolveProvinceWarningsMessage {
    command: 'resolveprovincewarnings';
}

export interface ResolveProvinceWarningsResultMessage {
    command: 'resolveprovincewarningsresult';
    success: boolean;
    warnings?: string[];
    error?: string;
}

export type AreaOperation = 'clear-railways' | 'clear-buildings' | 'one-population-per-state' |
    'clear-supply-hubs' | 'clear-water-crossings' | 'clear-resources' |
    'lowest-development' | 'convert-to-ocean';

export interface RunAreaOperationMessage {
    command: 'runareaoperation';
    operation: AreaOperation;
    provinceIds: number[];
    stateIds: number[];
    perContinent: boolean;
    includeWasteland: boolean;
    reindexAfter?: boolean;
    /** Exact rivers.bmp components to clip when converting river pixels to ocean. */
    riverIds?: number[];
}

export interface AreaOperationResultMessage {
    command: 'areaoperationresult';
    success: boolean;
    operation: AreaOperation;
    affectedProvinces?: number;
    affectedStates?: number;
    changedRecords?: number;
    error?: string;
}

export interface RunContinentPipelineMessage {
    command: 'runcontinentpipeline';
    continentId: number;
    targetCountryTag: string;
}

export interface ContinentPipelineResultMessage {
    command: 'continentpipelineresult';
    success: boolean;
    continentId: number;
    continentName?: string;
    targetCountryTag?: string;
    mergedProvinces?: number;
    mergedStates?: number;
    mergedStrategicRegions?: number;
    changedRecords?: number;
    error?: string;
}

export interface RemoveAllCoresMessage {
    command: 'removeallcores';
}

export interface RemoveAllCoresResultMessage {
    command: 'removeallcoresresult';
    success: boolean;
    affectedStates?: number;
    changedRecords?: number;
    error?: string;
}

export interface ReindexMapMessage {
    command: 'reindexmap';
}

export interface ReindexMapResultMessage {
    command: 'reindexmapresult';
    success: boolean;
    changedRecords?: number;
    error?: string;
}

export interface CreateCountryMessage {
    command: 'createcountry';
    tag: string;
    localizedName: string;
    capitalStateId: number;
}

export interface CreateCountryResultMessage {
    command: 'createcountryresult';
    success: boolean;
    tag?: string;
    error?: string;
}

export interface PersistCountryDiplomacyMessage {
    command: 'persistcountrydiplomacy';
    action: 'puppet' | 'end_puppet';
    file: string;
    overlord: string;
    subject: string;
    autonomyState?: string;
}

export interface CountryDiplomacyUpdatedMessage {
    command: 'countrydiplomacyupdated';
    success: boolean;
    error?: string;
}

export interface PersistedState {
    id: number;
    name: string;
    manpower: number;
    category: string;
    owner?: string;
    controller?: string;
    provinces: number[];
    cores: string[];
    impassable: boolean;
    victoryPoints: Record<number, number | undefined>;
    resources: Record<string, number | undefined>;
    file: string;
    tokenStart?: number;
    tokenEnd?: number;
    /** Update known map fields without discarding unsupported state content. */
    preserveUnknownContent?: boolean;
    /** Change only province membership and direct victory points. */
    preserveOnlyProvinceMembership?: boolean;
}

export interface PersistStatesMessage {
    command: 'persiststates';
    states: PersistedState[];
    deletedFiles?: string[];
    /** State blocks to remove while preserving other blocks in the same file. */
    deletedStates?: Array<{ id: number; file: string }>;
    /** Correlates destructive writes with their completion response. */
    requestId?: string;
    /** Deleted state ID to surviving state ID for supply-area repair. */
    stateReplacements?: Record<number, number>;
}

export interface PersistStatesResultMessage {
    command: 'persiststatesresult';
    requestId?: string;
    success: boolean;
    error?: string;
}

export interface PersistedStrategicRegion {
    id: number;
    name: string;
    provinces: number[];
    navalTerrain: string | null;
    file: string;
    tokenStart?: number;
    tokenEnd?: number;
    /** Update known region fields without discarding weather or unknown content. */
    preserveUnknownContent?: boolean;
}

export interface PersistStrategicRegionsMessage {
    command: 'persiststrategicregions';
    strategicRegions: PersistedStrategicRegion[];
    deletedFiles?: string[];
}

export interface PersistedProvince {
    id: number;
    color: number;
    type: string;
    coastal: boolean;
    terrain: string;
    continent: number;
}

export interface PersistProvincesMessage {
    command: 'persistprovinces';
    provinces: PersistedProvince[];
    deletedFiles?: string[];
}

/**
 * Sent from webview to extension to atomically persist the provinces.bmp
 * and definition.csv after a paintbrush edit.
 */
export interface PersistProvinceBmpMessage {
    command: 'persistprovincebmp';
    /** Painted pixels as an array of [x, y, newColor] triplets */
    paintedPixels: number[][];
    width: number;
    height: number;
    /** Province definitions to update in definition.csv */
    provinces: PersistedProvince[];
    /** Snapshot of previous province definitions for undo */
    previousProvinces?: PersistedProvince[];
    /** Province definition rows removed by this operation. */
    deletedProvinceIds?: number[];
    /** Deleted province ID to surviving province ID, used to repair dependent map files. */
    provinceReplacements?: Record<number, number>;
    /** The province ID being painted from (source) */
    targetProvinceId: number;
    /** Additional target provinces permitted in one atomic multi-color edit. */
    targetProvinceIds?: number[];
    /** Related state changes committed as part of the same province edit. */
    states?: PersistedState[];
    deletedStateFiles?: string[];
    deletedStates?: Array<{ id: number; file: string }>;
    stateReplacements?: Record<number, number>;
    /** Related strategic-region changes committed as part of the same province edit. */
    strategicRegions?: PersistedStrategicRegion[];
    deletedStrategicRegionFiles?: string[];
    deletedStrategicRegions?: Array<{ id: number; file: string }>;
}

/**
 * Request the current province BMP data from the extension.
 */
export interface RequestProvinceBmpMessage {
    command: 'requestprovincebmp';
}

/**
 * Province BMP pixel data sent from extension to webview.
 */
export interface ProvinceBmpDataMessage {
    command: 'provincebmpdata';
    colorByPosition: number[];
    width: number;
    height: number;
}

/**
 * Undo a province BMP edit.
 */
export interface UndoProvinceBmpMessage {
    command: 'undoprovincebmp';
}

/**
 * Redo a province BMP edit.
 */
export interface RedoProvinceBmpMessage {
    command: 'redoprovincebmp';
}

/**
 * Notification from extension that province BMP was updated (triggers reload).
 */
export interface ProvinceBmpUpdatedMessage {
    command: 'provincebmpupdated';
    data: string; // JSON: { canUndo: boolean; canRedo: boolean; forceReload?: boolean }
}

/**
 * Configuration for the paintbrush undo system.
 */
export interface PaintbrushConfig {
    /** Maximum number of undo steps (default 5) */
    maxUndoSteps: number;
}

/**
 * A provisional province edit that has not yet been committed.
 * Painting accumulates pixels into a draft; only Apply writes the
 * draft back into the live map and triggers persistence.
 */
export interface ProvinceDraft {
    /** ID of the province selected when paintbrush was entered (0 = none). */
    sourceProvinceId: number;
    /** The colour being painted with. */
    color: number;
    /** Set of painted pixel coordinates encoded as "x,y" strings. */
    pixels: Map<string, number>;
    /** Land/sea type inherited from source province (or 'land' by default). */
    type: string;
    /** Terrain inherited from source province. */
    terrain: string;
    /** Whether the source province is coastal. */
    coastal: boolean;
    /** Continent ID inherited from source province. */
    continent: number;
    /** True when the draft passes all validation checks. */
    valid: boolean;
    /** Human-readable validation messages. */
    errors: string[];
    /** True when this session is creating a brand-new province (fresh colour) rather than editing an existing one's boundary. */
    isNewProvince: boolean;
}

export interface PersistVictoryPointLocalisationMessage {
    command: 'persistvictorypointlocalisation';
    key: string;
    value: string;
    stateId: number;
}

export type ProgressReporter = (progress: string) => Promise<void>;

export type MapLoaderExtra = {
    warnings: WorldMapWarning[];
    conditionExprs?: ConditionItem[];
};
