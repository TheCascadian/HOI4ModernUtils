import { WorldMapMessage, Province, WorldMapData, RequestMapItemMessage, State, Country, Point, Zone, ProvinceEdge, DiplomacyRelation } from "./definitions";
import { copyArray } from "../util/common";
import { inBBox } from "./graphutils";
import { Subscriber } from "../util/event";
import { WorldMapWarning, Terrain, StrategicRegion, SupplyArea, Railway, SupplyNode, Resource, River, Bookmark } from "../../src/previewdef/worldmap/definitions";
import { vscode } from "../util/vscode";
import { BehaviorSubject, fromEvent, Observable, ObservedValueOf, Subject } from 'rxjs';
import { ConditionItem } from "../../src/hoiformat/condition";

interface ExtraMapData {
    provincesCount: number;
    statesCount: number;
    countriesCount: number;
    railwaysCount: number;
    supplyNodesCount: number;
}

interface FEWorldMapClassExtra {
    getProvinceById(provinceId: number | undefined): Province | undefined;
    getStateById(stateId: number | undefined): State | undefined;
    getStrategicRegionById(strategicRegionId: number | undefined): StrategicRegion | undefined;
    getSupplyAreaById(supplyAreaId: number | undefined): SupplyArea | undefined;

    getStateByProvinceId(provinceId: number): State | undefined;
    getProvinceToStateMap(): Record<number, number | undefined>;
    
    getStrategicRegionByProvinceId(provinceId: number): StrategicRegion | undefined;
    getProvinceToStrategicRegionMap(): Record<number, number | undefined>;

    getSupplyAreaByStateId(stateId: number): SupplyArea | undefined;
    getStateToSupplyAreaMap(): Record<number, number | undefined>;

    getRailwayLevelByProvinceId(provinceId: number): number | undefined;

    getSupplyNodeByProvinceId(provinceId: number): SupplyNode | undefined;

    getProvinceByPosition(x: number, y: number): Province | undefined;

    getProvinceWarnings(province?: Province, state?: State, strategicRegion?: StrategicRegion, supplyArea?: SupplyArea): string[];
    getStateWarnings(state: State, supplyArea?: SupplyArea): string[];
    getStrategicRegionWarnings(strategicRegion: StrategicRegion): string[];
    getSupplyAreaWarnings(supplyArea: SupplyArea): string[];
    getRiverWarnings(riverIndex: number): string[];

    assignProvincesToState(provinceIds: number[], targetStateId: number): number[] | undefined;
    createStateFromProvinces(provinceIds: number[]): { newStateId: number; changedStateIds: number[] } | undefined;
    mergeStates(targetStateId: number, sourceStateIds: number[]): { changedStateIds: number[]; deletedFiles: string[] } | undefined;
    clearStateProvinceMembership(stateIds: number[]): number[] | undefined;
    getNextStateId(): number;
    snapshotStates(stateIds: number[]): StateSnapshot[];
    restoreStates(snapshots: StateSnapshot[]): void;

    assignProvincesToStrategicRegion(provinceIds: number[], targetSRId: number): number[] | undefined;
    assignStatesToStrategicRegion(stateIds: number[], targetSRId: number): number[] | undefined;
    createStrategicRegionFromProvinces(provinceIds: number[]): {
        newStrategicRegionId: number;
        changedRegionIds: number[];
        deletedFiles: string[];
        deletedRegions: Array<{ id: number; file: string }>;
    } | undefined;
    createStrategicRegionFromStates(stateIds: number[]): {
        newStrategicRegionId: number;
        changedRegionIds: number[];
        deletedFiles: string[];
        deletedRegions: Array<{ id: number; file: string }>;
    } | undefined;
    getNextStrategicRegionId(): number;
    snapshotStrategicRegions(srIds: number[]): StrategicRegionSnapshot[];
    restoreStrategicRegions(snapshots: StrategicRegionSnapshot[]): void;

    createProvinceAt(targetProvinceId: number): Province | undefined;
    getNextProvinceId(): number;
    snapshotProvinces(provinceIds: number[]): ProvinceSnapshot[];
    restoreProvinces(snapshots: ProvinceSnapshot[]): void;
    mergeProvinces(targetProvinceId: number, sourceProvinceIds: number[], removeTargetFromStates?: boolean): {
        paintedPixels: Map<string, number>;
        deletedProvinceIds: number[];
        changedStateIds: number[];
        changedStrategicRegionIds: number[];
        deletedStrategicRegionFiles: string[];
        deletedStrategicRegions: Array<{ id: number; file: string }>;
    } | undefined;
    convertWaterProvincesToLand(
        provinceIds: number[],
        terrain: string,
        continent: number,
        coastal: boolean,
        targetStateId: number,
        targetStrategicRegionId: number
    ): {
        changedStateIds: number[];
        changedStrategicRegionIds: number[];
        deletedStrategicRegionFiles: string[];
        deletedStrategicRegions: Array<{ id: number; file: string }>;
    } | undefined;

    /** Paintbrush: get the color at a pixel position */
    getColorAt(x: number, y: number): number | undefined;
    /** Paintbrush: set the color at a pixel position */
    setColorAt(x: number, y: number, color: number): void;
    /** Paintbrush: get province type ('land','sea',etc.) at a pixel position */
    getProvinceTypeAt(x: number, y: number): string | undefined;
    /** Paintbrush: get the full colorByPosition array */
    getColorByPosition(): number[];
    /** Paintbrush: set the full colorByPosition array */
    setColorByPosition(colors: number[]): void;
    /** Paintbrush: apply painted pixels to province data structures */
    applyPaintbrushEdits(paintedPixels: Map<string, number>, sourceProvinceId?: number): { affectedProvinceIds: number[]; newProvinceId?: number };
    /** Find the next available color for a new province */
    findNextProvinceColor(): number | undefined;

    forEachProvince(callback: (province: Province) => boolean | void): void;
    forEachState(callback: (state: State) => boolean | void): void;
    forEachStrategicRegion(callback: (strategicRegion: StrategicRegion) => boolean | void): void;
    forEachSupplyArea(callback: (supplyArea: SupplyArea) => boolean | void): void;
    forEachRailway(callback: (railway: Railway) => boolean | void): void;
    forEachSupplyNode(callback: (supplyNode: SupplyNode) => boolean | void): void;
}

export type FEWorldMap = Omit<WorldMapData, 'states' | 'provinces' | 'strategicRegions' | 'supplyAreas' | 'railways' | 'supplyNodes'>
    & ExtraMapData & FEWorldMapClassExtra;

export interface StateSnapshot {
    id: number;
    state: State | undefined;
}

export interface StrategicRegionSnapshot {
    id: number;
    strategicRegion: StrategicRegion | undefined;
}

export interface ProvinceSnapshot {
    id: number;
    province: Province | undefined;
}

export class Loader extends Subscriber {
    public worldMap: FEWorldMapClass;
    public loading$ = new BehaviorSubject<boolean>(false);
    public progress: number = 0;
    public progressText: string = '';

    private writableWorldMap$ = new Subject<FEWorldMap>();
    public worldMap$: Observable<FEWorldMap> = this.writableWorldMap$;

    private writableProgress$ = new BehaviorSubject({ progress: 0, progressText: '' });
    public progress$: Observable<ObservedValueOf<Loader['writableProgress$']>> = this.writableProgress$;

    private loadingProvinceMap: WorldMapData & { provincesCount: number; statesCount: number; countriesCount: number; } | undefined;
    private loadingQueue: WorldMapMessage[] = [];
    private loadingQueueStartLength = 0;

    constructor() {
        super();
        this.worldMap = new FEWorldMapClass();
        this.load();
        this.worldMap$.subscribe(wm => (window as any)['worldMap'] = wm);
    }

    public refresh() {
        this.worldMap = new FEWorldMapClass();
        this.writableWorldMap$.next(this.worldMap);
        vscode.postMessage({ command: 'loaded', force: true } as WorldMapMessage);
        this.loading$.next(true);
    }

    private load() {
        this.addSubscription(fromEvent<MessageEvent>(window, 'message').subscribe(event => {
            const message = event.data as WorldMapMessage;
            switch (message.command) {
                case 'provincemapsummary':
                    this.loadingProvinceMap = { ...message.data };
                    this.loadingProvinceMap.provinces = new Array(this.loadingProvinceMap.provincesCount);
                    this.loadingProvinceMap.states = new Array(this.loadingProvinceMap.statesCount);
                    this.loadingProvinceMap.countries = new Array(this.loadingProvinceMap.countriesCount);
                    this.loadingProvinceMap.strategicRegions = new Array(this.loadingProvinceMap.strategicRegionsCount);
                    this.startLoading();
                    break;
                case 'provinces':
                    this.receiveData(this.loadingProvinceMap?.provinces, message.start, message.end, message.data);
                    this.loadNext();
                    break;
                case 'states':
                    this.receiveData(this.loadingProvinceMap?.states, message.start, message.end, message.data);
                    this.loadNext();
                    break;
                case 'countries':
                    this.receiveData(this.loadingProvinceMap?.countries, message.start, message.end, message.data);
                    this.loadNext();
                    break;
                case 'strategicregions':
                    this.receiveData(this.loadingProvinceMap?.strategicRegions, message.start, message.end, message.data);
                    this.loadNext();
                    break;
                case 'supplyareas':
                    this.receiveData(this.loadingProvinceMap?.supplyAreas, message.start, message.end, message.data);
                    this.loadNext();
                    break;
                case 'railways':
                    this.receiveData(this.loadingProvinceMap?.railways, message.start, message.end, message.data);
                    this.loadNext();
                    break;
                case 'supplynodes':
                    this.receiveData(this.loadingProvinceMap?.supplyNodes, message.start, message.end, message.data);
                    this.loadNext();
                    break;
                case 'warnings':
                    if (this.loadingProvinceMap) {
                        this.loadingProvinceMap.warnings = JSON.parse(message.data);
                        this.loadNext();
                    }
                    break;
                case 'continents':
                    if (this.loadingProvinceMap) {
                        this.loadingProvinceMap.continents = JSON.parse(message.data);
                        this.loadNext();
                    }
                    break;
                case 'terrains':
                    if (this.loadingProvinceMap) {
                        this.loadingProvinceMap.terrains = JSON.parse(message.data);
                        this.loadNext();
                    }
                    break;
                case 'resources':
                    if (this.loadingProvinceMap) {
                        this.loadingProvinceMap.resources = JSON.parse(message.data);
                        this.loadNext();
                    }
                    break;
                case 'rivers':
                    if (this.loadingProvinceMap) {
                        this.loadingProvinceMap.rivers = JSON.parse(message.data);
                        this.loadNext();
                    }
                    break;
                case 'conditionexprs':
                    if (this.loadingProvinceMap) {
                        this.loadingProvinceMap.conditionExprs = JSON.parse(message.data);
                        this.loadNext();
                    }
                    break;
                case 'progress':
                    this.progressText = message.data;
                    this.writableProgress$.next({ progressText: this.progressText, progress: this.progress });
                    break;
                case 'error':
                    this.progressText = message.data;
                    this.writableProgress$.next({ progressText: this.progressText, progress: this.progress });
                    this.loading$.next(false);
                    break;
            }
        }));

        vscode.postMessage({ command: 'loaded', force: false } as WorldMapMessage);
        this.loading$.next(true);
    }

    private startLoading() {
        if (!this.loadingProvinceMap) {
            return;
        }
    
        this.loadingQueue.length = 0;
    
        this.queueLoadingRequest('requestcountries', this.loadingProvinceMap.countriesCount, 300);
        this.queueLoadingRequest('requeststrategicregions', this.loadingProvinceMap.strategicRegionsCount, 300);
        this.queueLoadingRequest('requeststrategicregions', -this.loadingProvinceMap.badStrategicRegionsCount, 300, this.loadingProvinceMap.badStrategicRegionsCount);
        this.queueLoadingRequest('requestsupplyareas', this.loadingProvinceMap.supplyAreasCount, 300);
        this.queueLoadingRequest('requestsupplyareas', -this.loadingProvinceMap.badSupplyAreasCount, 300, this.loadingProvinceMap.badSupplyAreasCount);
        this.queueLoadingRequest('requeststates', this.loadingProvinceMap.statesCount, 300);
        this.queueLoadingRequest('requeststates', -this.loadingProvinceMap.badStatesCount, 300, this.loadingProvinceMap.badStatesCount);
        this.queueLoadingRequest('requestprovinces', this.loadingProvinceMap.provincesCount, 300);
        this.queueLoadingRequest('requestprovinces', -this.loadingProvinceMap.badProvincesCount, 300, this.loadingProvinceMap.badProvincesCount);
        this.queueLoadingRequest('requestrailways', this.loadingProvinceMap.railwaysCount, 1000);
        this.queueLoadingRequest('requestsupplynodes', this.loadingProvinceMap.supplyNodesCount, 2000);

        this.loadingQueueStartLength = this.loadingQueue.length;
        this.progressText = '';
        this.loadNext();
    }

    private queueLoadingRequest<C extends RequestMapItemMessage['command']>(command: C, count: number, step: number, offset: number = 0) {
        for (let i = offset, j = 0; j < count; i += step, j += step) {
            this.loadingQueue.push({
                command,
                start: i,
                end: Math.min(i + step, offset + count),
            });
        }
    }

    private loadNext(updateMap: boolean = true) {
        this.progress = 1 - this.loadingQueue.length / this.loadingQueueStartLength;
    
        if (updateMap) {
            this.worldMap = new FEWorldMapClass(this.loadingProvinceMap!);
            this.writableWorldMap$.next(this.worldMap);
        }
    
        if (this.loadingQueue.length === 0) {
            this.loading$.next(false);
        } else {
            vscode.postMessage(this.loadingQueue.shift());
        }

        this.writableProgress$.next({ progressText: this.progressText, progress: this.progress });
    }
    
    private receiveData<T>(arr: T[] | undefined, start: number, end: number, data: string): void {
        if (arr) {
            copyArray(JSON.parse(data), arr, 0, start, end - start);
        }
    }
}

export class FEWorldMapClass implements FEWorldMap {
    width!: number;
    height!: number;
    countries!: Country[];
    warnings!: WorldMapWarning[];
    provincesCount!: number;
    statesCount!: number;
    countriesCount!: number;
    strategicRegionsCount!: number;
    supplyAreasCount!: number;
    railwaysCount!: number;
    supplyNodesCount!: number;
    badProvincesCount!: number;
    badStatesCount!: number;
    badStrategicRegionsCount!: number;
    badSupplyAreasCount!: number;
    continents!: string[];
    terrains!: Terrain[];
    resources!: Resource[];
    rivers!: River[];
    colorByPosition!: number[];
    conditionExprs!: ConditionItem[];
    bookmarks!: Bookmark[];
    diplomacyRelations!: DiplomacyRelation[];
    countryHistoryFiles!: Record<string, string>;

    private provinces!: (Province | null | undefined)[];
    private states!: (State | null | undefined)[];
    private strategicRegions!: (StrategicRegion | null | undefined)[];
    private supplyAreas!: (SupplyArea | null | undefined)[];
    private railways!: (Railway | null | undefined)[];
    private supplyNodes!: (SupplyNode | null | undefined)[];

    constructor(worldMap?: WorldMapData & ExtraMapData) {
        Object.assign(this, worldMap ?? ({
            width: 0, height: 0, colorByPosition: [],
            provinces: [], states: [], countries: [], warnings: [], continents: [], strategicRegions: [], supplyAreas: [], terrains: [],
            railways: [], supplyNodes: [], resources: [], rivers: [],
            provincesCount: 0, statesCount: 0, countriesCount: 0, strategicRegionsCount: 0, supplyAreasCount: 0,
            badProvincesCount: 0, badStatesCount: 0, badStrategicRegionsCount: 0, badSupplyAreasCount: 0,
            railwaysCount: 0, supplyNodesCount: 0,
            conditionExprs: [], bookmarks: [], diplomacyRelations: [], countryHistoryFiles: {}
        } as WorldMapData & ExtraMapData));
    }

    public getProvinceById = (provinceId: number | undefined): Province | undefined => {
        if (provinceId === undefined || provinceId === null) {
            return undefined;
        }
        return this.provinces[provinceId] ?? undefined;
    };

    public getStateById = (stateId: number | undefined): State | undefined => {
        return stateId ? this.states[stateId] ?? undefined : undefined;
    };

    public getStrategicRegionById = (strategicRegionId: number | undefined): StrategicRegion | undefined => {
        return strategicRegionId ? this.strategicRegions[strategicRegionId] ?? undefined : undefined;
    };

    public getSupplyAreaById = (supplyAreaId: number | undefined): SupplyArea | undefined => {
        return supplyAreaId ? this.supplyAreas[supplyAreaId] ?? undefined : undefined;
    };

    public getStateByProvinceId(provinceId: number): State | undefined {
        let resultState: State | undefined = undefined;
        this.forEachState(state => {
            if (state.provinces.includes(provinceId)) {
                resultState = state;
                return true;
            }
        });
        return resultState;
    }
    
    public getStrategicRegionByProvinceId(provinceId: number): StrategicRegion | undefined {
        let resultStrategicRegion: StrategicRegion | undefined = undefined;
        this.forEachStrategicRegion(strategicRegion => {
            if (strategicRegion.provinces.includes(provinceId)) {
                resultStrategicRegion = strategicRegion;
                return true;
            }
        });
        return resultStrategicRegion;
    }

    public getSupplyAreaByStateId(stateId: number): SupplyArea | undefined {
        let resultSupplyArea: SupplyArea | undefined = undefined;
        this.forEachSupplyArea(supplyArea => {
            if (supplyArea.states.includes(stateId)) {
                resultSupplyArea = supplyArea;
                return true;
            }
        });
        return resultSupplyArea;
    }

    public getRailwayLevelByProvinceId(provinceId: number): number | undefined {
        let resultRailwayLevel = -1;
        this.forEachRailway(railway => {
            if (railway.provinces.includes(provinceId)) {
                resultRailwayLevel = Math.max(resultRailwayLevel, railway.level);
            }
        });
        return resultRailwayLevel === -1 ? undefined : resultRailwayLevel;
    }

    public getSupplyNodeByProvinceId(provinceId: number): SupplyNode | undefined {
        let resultSupplyNode: SupplyNode | undefined = undefined;
        this.forEachSupplyNode(supplyNode => {
            if (supplyNode.province === provinceId) {
                resultSupplyNode = supplyNode;
                return true;
            }
        });
        return resultSupplyNode;
    }
    
    public getProvinceByPosition(x: number, y: number): Province | undefined {
        const point: Point = { x, y };
        let resultProvince: Province | undefined = undefined;
        this.forEachProvince(province => {
            if (inBBox(point, province.boundingBox) && province.coverZones.some(z => inBBox(point, z))) {
                resultProvince = province;
                return true;
            }
        });
        return resultProvince;
    }

    public getProvinceToStateMap(): Record<number, number | undefined> {
        const result: Record<number, number | undefined> = {};

        this.forEachState(state =>
            state.provinces.forEach(p => {
                result[p] = state.id;
            })
        );
    
        return result;
    }

    public getProvinceToStrategicRegionMap(): Record<number, number | undefined> {
        const result: Record<number, number | undefined> = {};

        this.forEachStrategicRegion(strategicRegion =>
            strategicRegion.provinces.forEach(p => {
                result[p] = strategicRegion.id;
            })
        );
    
        return result;
    }

    public getStateToSupplyAreaMap(): Record<number, number | undefined> {
        const result: Record<number, number | undefined> = {};

        this.forEachSupplyArea(supplyArea =>
            supplyArea.states.forEach(s => {
                result[s] = supplyArea.id;
            })
        );
    
        return result;
    }

    public forEachProvince(callback: (province: Province) => boolean | void) {
        const count = this.provincesCount;
        for (let i = this.badProvincesCount; i < count; i++) {
            const province = this.provinces[i];
            if (province && callback(province)) {
                break;
            }
        }
    }

    public forEachState(callback: (state: State) => boolean | void) {
        const count = this.statesCount;
        for (let i = this.badStatesCount; i < count; i++) {
            const state = this.states[i];
            if (state && callback(state)) {
                break;
            }
        }
    }

    public forEachStrategicRegion(callback: (strategicRegion: StrategicRegion) => boolean | void): void {
        const count = this.strategicRegionsCount;
        for (let i = this.badStrategicRegionsCount; i < count; i++) {
            const strategicRegion = this.strategicRegions[i];
            if (strategicRegion && callback(strategicRegion)) {
                break;
            }
        }
    }
    
    public forEachSupplyArea(callback: (supplyArea: SupplyArea) => boolean | void): void {
        const count = this.supplyAreasCount;
        for (let i = this.badSupplyAreasCount; i < count; i++) {
            const supplyArea = this.supplyAreas[i];
            if (supplyArea && callback(supplyArea)) {
                break;
            }
        }
    }
    
    public forEachRailway(callback: (railway: Railway) => boolean | void): void {
        const count = this.railwaysCount;
        for (let i = 0; i < count; i++) {
            const railway = this.railways[i];
            if (railway && callback(railway)) {
                break;
            }
        }
    }
    
    public forEachSupplyNode(callback: (supplyNode: SupplyNode) => boolean | void): void {
        const count = this.supplyNodesCount;
        for (let i = 0; i < count; i++) {
            const supplyNode = this.supplyNodes[i];
            if (supplyNode && callback(supplyNode)) {
                break;
            }
        }
    }

    public getProvinceWarnings(province?: Province, state?: State, strategicRegion?: StrategicRegion, supplyArea?: SupplyArea): string[] {
        return this.warnings
            .filter(v => v.source.some(s =>
                (province && s.type === 'province' && (s.id === province.id || s.color === province.color)) || 
                (state && s.type === 'state' && s.id === state.id) ||
                (strategicRegion && s.type === 'strategicregion' && s.id === strategicRegion.id) ||
                (supplyArea && s.type === 'supplyarea' && s.id === supplyArea.id)
                ))
            .map(v => v.text);
    }

    public getStateWarnings(state: State, supplyArea?: SupplyArea): string[] {
        return this.warnings
            .filter(v => v.source.some(s =>
                (s.type === 'state' && s.id === state.id) ||
                (supplyArea && s.type === 'supplyarea' && s.id === supplyArea.id)
                ))
            .map(v => v.text);
    }

    public getStrategicRegionWarnings(strategicRegion: StrategicRegion): string[] {
        return this.warnings.filter(v => v.source.some(s => s.type === 'strategicregion' && s.id === strategicRegion.id)).map(v => v.text);
    }
    
    public getSupplyAreaWarnings(supplyArea: SupplyArea): string[] {
        return this.warnings.filter(v => v.source.some(s => s.type === 'supplyarea' && s.id === supplyArea.id)).map(v => v.text);
    }

    public getRiverWarnings(riverIndex: number): string[] {
        return this.warnings.filter(v => v.source.some(s => s.type === 'river' && s.index === riverIndex)).map(v => v.text);
    }

    public assignProvincesToState(provinceIds: number[], targetStateId: number): number[] | undefined {
        const target = this.getStateById(targetStateId);
        if (!target) {
            return undefined;
        }

        const normalizedIds = this.normalizeProvinceIds(provinceIds);
        if (normalizedIds.length === 0) {
            return undefined;
        }

        let changed = false;
        const changedStateIds = new Set<number>();

        this.forEachState(state => {
            if (state.id === targetStateId) {
                return;
            }

            const beforeLength = state.provinces.length;
            state.provinces = state.provinces.filter(id => !normalizedIds.includes(id));
            if (state.provinces.length !== beforeLength) {
                changed = true;
                changedStateIds.add(state.id);
            }
        });

        for (const provinceId of normalizedIds) {
            if (!target.provinces.includes(provinceId)) {
                target.provinces.push(provinceId);
                changed = true;
            }
        }

        if (!changed) {
            return undefined;
        }

        target.provinces.sort((a, b) => a - b);
        changedStateIds.add(targetStateId);
        changedStateIds.forEach(stateId => {
            const state = this.getStateById(stateId);
            if (state) {
                this.recomputeStateGeometry(state);
            }
        });

        return Array.from(changedStateIds.values());
    }

    public createStateFromProvinces(provinceIds: number[]): { newStateId: number; changedStateIds: number[] } | undefined {
        const normalizedIds = this.normalizeProvinceIds(provinceIds);
        if (normalizedIds.length === 0) {
            return undefined;
        }

        const template = this.getStateByProvinceId(normalizedIds[0]);
        const newStateId = this.findNextStateId();
        const newState: State = {
            id: newStateId,
            name: `STATE_${newStateId}`,
            localisedName: undefined,
            manpower: 0,
            category: template?.category ?? 'rural',
            categoryColor: template?.categoryColor ?? 0,
            owner: template?.owner ?? [],
            controller: template?.controller ?? [],
            provinces: [],
            cores: [...(template?.cores ?? [])],
            impassable: template?.impassable ?? false,
            victoryPoints: {},
            resources: {},
            // New states always go to their own file to avoid mutating unrelated state files.
            file: `history/states/${newStateId}-state.txt`,
            token: null,
            boundingBox: { x: 0, y: 0, w: 0, h: 0 },
            centerOfMass: { x: 0, y: 0 },
            mass: 0,
        };

        this.states[newStateId] = newState;
        if (newStateId >= this.statesCount) {
            this.statesCount = newStateId + 1;
        }

        const changedStateIds = this.assignProvincesToState(normalizedIds, newStateId);
        if (!changedStateIds) {
            return undefined;
        }

        return { newStateId, changedStateIds };
    }

    public mergeStates(targetStateId: number, sourceStateIds: number[]): {
        changedStateIds: number[];
        deletedFiles: string[];
        deletedStates: Array<{ id: number; file: string }>;
    } | undefined {
        const target = this.getStateById(targetStateId);
        const sources = Array.from(new Set(sourceStateIds))
            .filter(id => id !== targetStateId)
            .map(id => this.getStateById(id))
            .filter((state): state is State => !!state);
        if (!target || sources.length === 0) {
            return undefined;
        }

        const deletedFiles: string[] = [];
        const deletedStates = sources.map(source => ({ id: source.id, file: source.file }));
        const provinces = new Set(target.provinces);
        const coreKeys = new Set(target.cores.map(core => JSON.stringify(core)));
        for (const source of sources) {
            source.provinces.forEach(id => provinces.add(id));
            target.manpower += source.manpower;
            for (const [resource, value] of Object.entries(source.resources)) {
                if (value !== undefined) {
                    target.resources[resource] = (target.resources[resource] ?? 0) + value;
                }
            }
            for (const [province, value] of Object.entries(source.victoryPoints)) {
                if (value !== undefined) {
                    target.victoryPoints[Number(province)] = (target.victoryPoints[Number(province)] ?? 0) + value;
                }
            }
            for (const core of source.cores) {
                const key = JSON.stringify(core);
                if (!coreKeys.has(key)) {
                    coreKeys.add(key);
                    target.cores.push(core);
                }
            }
            this.states[source.id] = undefined;
        }
        for (const file of new Set(sources.map(source => source.file))) {
            const hasRetainedState = this.states.some(state => state?.file === file);
            if (!hasRetainedState) {
                deletedFiles.push(file);
            }
        }

        target.provinces = Array.from(provinces).sort((a, b) => a - b);
        this.recomputeStateGeometry(target);
        return {
            changedStateIds: [targetStateId, ...sources.map(source => source.id)],
            deletedFiles: Array.from(new Set(deletedFiles)),
            deletedStates: deletedStates.filter(state => !deletedFiles.includes(state.file)),
        };
    }

    public clearStateProvinceMembership(stateIds: number[]): number[] | undefined {
        const changedStateIds: number[] = [];
        for (const stateId of new Set(stateIds)) {
            const state = this.getStateById(stateId);
            if (!state || (state.provinces.length === 0 &&
                Object.keys(state.victoryPoints).length === 0)) {
                continue;
            }
            state.provinces = [];
            state.victoryPoints = {};
            this.recomputeStateGeometry(state);
            changedStateIds.push(state.id);
        }
        return changedStateIds.length > 0 ? changedStateIds : undefined;
    }

    public getNextStateId(): number {
        return this.findNextStateId();
    }

    public getNextStrategicRegionId(): number {
        return this.findNextStrategicRegionId();
    }

    public snapshotStates(stateIds: number[]): StateSnapshot[] {
        const uniqueStateIds = Array.from(new Set(stateIds));
        return uniqueStateIds.map(id => ({
            id,
            state: this.cloneState(this.getStateById(id)),
        }));
    }

    public restoreStates(snapshots: StateSnapshot[]): void {
        for (const snapshot of snapshots) {
            this.states[snapshot.id] = this.cloneState(snapshot.state);
        }

        let lastStateId = this.badStatesCount - 1;
        for (let i = this.states.length - 1; i >= this.badStatesCount; i--) {
            if (this.states[i]) {
                lastStateId = i;
                break;
            }
        }

        this.statesCount = Math.max(this.badStatesCount, lastStateId + 1);
    }

    private normalizeProvinceIds(provinceIds: number[]): number[] {
        const unique = new Set<number>();
        for (const provinceId of provinceIds) {
            if (this.getProvinceById(provinceId)) {
                unique.add(provinceId);
            }
        }
        return Array.from(unique.values());
    }

    private findNextStateId(): number {
        // Strict contiguous numbering: choose the first missing positive state id.
        for (let id = 1; id < this.states.length; id++) {
            if (!this.states[id]) {
                return id;
            }
        }

        return Math.max(1, this.states.length);
    }

    private findNextStrategicRegionId(): number {
        for (let id = 1; id < this.strategicRegions.length; id++) {
            if (!this.strategicRegions[id]) {
                return id;
            }
        }

        return Math.max(1, this.strategicRegions.length);
    }

    private recomputeStateGeometry(state: State): void {
        const provinces = state.provinces
            .map(id => this.getProvinceById(id))
            .filter((p): p is Province => !!p);

        if (provinces.length === 0) {
            state.boundingBox = { x: 0, y: 0, w: 0, h: 0 };
            state.centerOfMass = { x: 0, y: 0 };
            state.mass = 0;
            return;
        }

        const bbox = this.computeBoundingBox(provinces.map(p => p.boundingBox));
        let totalMass = 0;
        let weightedX = 0;
        let weightedY = 0;
        for (const province of provinces) {
            const mass = Math.max(1, province.mass);
            totalMass += mass;
            weightedX += province.centerOfMass.x * mass;
            weightedY += province.centerOfMass.y * mass;
        }

        state.boundingBox = bbox;
        state.mass = totalMass;
        state.centerOfMass = {
            x: weightedX / totalMass,
            y: weightedY / totalMass,
        };
    }

    // ======== Strategic Region Methods ========

    public assignProvincesToStrategicRegion(provinceIds: number[], targetSRId: number): number[] | undefined {
        const target = this.getStrategicRegionById(targetSRId);
        if (!target) {
            return undefined;
        }

        const normalizedIds = this.normalizeProvinceIds(provinceIds);
        if (normalizedIds.length === 0) {
            return undefined;
        }

        let changed = false;
        const changedSRIds = new Set<number>();

        this.forEachStrategicRegion(sr => {
            if (sr.id === targetSRId) {
                return;
            }

            const beforeLength = sr.provinces.length;
            sr.provinces = sr.provinces.filter(id => !normalizedIds.includes(id));
            if (sr.provinces.length !== beforeLength) {
                changed = true;
                changedSRIds.add(sr.id);
            }
        });

        for (const provinceId of normalizedIds) {
            if (!target.provinces.includes(provinceId)) {
                target.provinces.push(provinceId);
                changed = true;
            }
        }

        if (!changed) {
            return undefined;
        }

        target.provinces.sort((a, b) => a - b);
        changedSRIds.add(targetSRId);
        changedSRIds.forEach(srId => {
            const sr = this.getStrategicRegionById(srId);
            if (sr) {
                this.recomputeRegionGeometry(sr);
            }
        });

        return Array.from(changedSRIds.values());
    }

    public assignStatesToStrategicRegion(stateIds: number[], targetSRId: number): number[] | undefined {
        const allProvinceIds: number[] = [];
        for (const stateId of stateIds) {
            const state = this.getStateById(stateId);
            if (state) {
                allProvinceIds.push(...state.provinces);
            }
        }
        return this.assignProvincesToStrategicRegion(allProvinceIds, targetSRId);
    }

    public snapshotStrategicRegions(srIds: number[]): StrategicRegionSnapshot[] {
        const uniqueSrIds = Array.from(new Set(srIds));
        return uniqueSrIds.map(id => ({
            id,
            strategicRegion: this.cloneStrategicRegion(this.getStrategicRegionById(id)),
        }));
    }

    public restoreStrategicRegions(snapshots: StrategicRegionSnapshot[]): void {
        for (const snapshot of snapshots) {
            this.strategicRegions[snapshot.id] = this.cloneStrategicRegion(snapshot.strategicRegion);
        }

        let lastSRId = this.badStrategicRegionsCount - 1;
        for (let i = this.strategicRegions.length - 1; i >= this.badStrategicRegionsCount; i--) {
            if (this.strategicRegions[i]) {
                lastSRId = i;
                break;
            }
        }
        this.strategicRegionsCount = Math.max(this.badStrategicRegionsCount, lastSRId + 1);
    }

    private deleteEmptyStrategicRegions(regionIds: number[]): {
        deletedFiles: string[];
        deletedRegions: Array<{ id: number; file: string }>;
    } {
        const deletedRegionRecords = Array.from(new Set(regionIds))
            .map(id => this.getStrategicRegionById(id))
            .filter((region): region is StrategicRegion => !!region && region.provinces.length === 0)
            .map(region => ({ id: region.id, file: region.file }));
        for (const region of deletedRegionRecords) {
            this.strategicRegions[region.id] = undefined as any;
        }

        let lastRegionId = this.badStrategicRegionsCount - 1;
        for (let id = this.strategicRegions.length - 1; id >= this.badStrategicRegionsCount; id--) {
            if (this.strategicRegions[id]) {
                lastRegionId = id;
                break;
            }
        }
        this.strategicRegionsCount = Math.max(
            this.badStrategicRegionsCount,
            lastRegionId + 1
        );

        const deletedFiles = Array.from(new Set(
            deletedRegionRecords
                .map(region => region.file)
                .filter(file => !this.strategicRegions.some(region => region?.file === file))
        ));
        return {
            deletedFiles,
            deletedRegions: deletedRegionRecords.filter(region => !deletedFiles.includes(region.file)),
        };
    }

    private recomputeRegionGeometry(region: StrategicRegion | State): void {
        const provinces = region.provinces
            .map(id => this.getProvinceById(id))
            .filter((p): p is Province => !!p);

        if (provinces.length === 0) {
            region.boundingBox = { x: 0, y: 0, w: 0, h: 0 };
            region.centerOfMass = { x: 0, y: 0 };
            region.mass = 0;
            return;
        }

        const bbox = this.computeBoundingBox(provinces.map(p => p.boundingBox));
        let totalMass = 0;
        let weightedX = 0;
        let weightedY = 0;
        for (const province of provinces) {
            const mass = Math.max(1, province.mass);
            totalMass += mass;
            weightedX += province.centerOfMass.x * mass;
            weightedY += province.centerOfMass.y * mass;
        }

        region.boundingBox = bbox;
        region.mass = totalMass;
        region.centerOfMass = {
            x: weightedX / totalMass,
            y: weightedY / totalMass,
        };
    }

    private cloneStrategicRegion(sr: StrategicRegion | undefined): StrategicRegion | undefined {
        if (!sr) {
            return undefined;
        }
        return {
            ...sr,
            provinces: [...sr.provinces],
            boundingBox: { ...sr.boundingBox },
            centerOfMass: { ...sr.centerOfMass },
            token: sr.token ? { ...sr.token } : null,
        };
    }

    // ======== Province Creation Methods ========

    public createProvinceAt(targetProvinceId: number): Province | undefined {
        const sourceProvince = this.getProvinceById(targetProvinceId);
        if (!sourceProvince) {
            return undefined;
        }

        const newProvinceId = this.getNextProvinceId();
        const newColor = this.findNextProvinceColor();

        if (newColor === undefined) {
            return undefined;
        }

        // Split the source province's cover zones: take roughly half
        const halfIndex = Math.floor(sourceProvince.coverZones.length / 2);
        const newZones = sourceProvince.coverZones.splice(halfIndex);

        // Create the new province
        const newProvince: Province = {
            id: newProvinceId,
            color: newColor,
            type: sourceProvince.type,
            coastal: sourceProvince.coastal,
            terrain: sourceProvince.terrain,
            continent: sourceProvince.continent,
            coverZones: newZones,
            edges: [],
            boundingBox: this.computeBoundingBox(newZones),
            centerOfMass: this.computeCenterOfMass(newZones),
            mass: newZones.reduce((sum, z) => sum + z.w * z.h, 0),
        };

        // Recompute source province after losing zones
        if (sourceProvince.coverZones.length > 0) {
            sourceProvince.boundingBox = this.computeBoundingBox(sourceProvince.coverZones);
            sourceProvince.centerOfMass = this.computeCenterOfMass(sourceProvince.coverZones);
            sourceProvince.mass = sourceProvince.coverZones.reduce((sum, z) => sum + z.w * z.h, 0);
        }

        // Add edge between new and source province
        newProvince.edges.push({
            to: sourceProvince.id,
            type: 'land',
            path: [],
            rule: undefined,
        } as ProvinceEdge);
        sourceProvince.edges.push({
            to: newProvinceId,
            type: 'land',
            path: [],
            rule: undefined,
        } as ProvinceEdge);

        // Add edges to all provinces that were adjacent to source
        for (const edge of sourceProvince.edges) {
            if (edge.to === newProvinceId) {
                continue;
            }
            newProvince.edges.push({
                to: edge.to,
                type: edge.type,
                path: edge.path.length > 0 ? edge.path.map(p => [...p]) : [],
                rule: edge.rule,
            } as ProvinceEdge);

            const neighbor = this.getProvinceById(edge.to);
            if (neighbor) {
                const existingEdge = neighbor.edges.find(e => e.to === sourceProvince.id);
                if (existingEdge && !neighbor.edges.some(e => e.to === newProvinceId)) {
                    neighbor.edges.push({
                        to: newProvinceId,
                        type: existingEdge.type,
                        path: existingEdge.path.length > 0 ? existingEdge.path.map(p => [...p]) : [],
                        rule: existingEdge.rule,
                    } as ProvinceEdge);
                }
            }
        }

        // Store the new province
        this.provinces[newProvinceId] = newProvince;
        if (newProvinceId >= this.provincesCount) {
            this.provincesCount = newProvinceId + 1;
        }

        // Add new province to the source province's state (if any)
        const sourceState = this.getStateByProvinceId(sourceProvince.id);
        if (sourceState && !sourceState.provinces.includes(newProvinceId)) {
            sourceState.provinces.push(newProvinceId);
            sourceState.provinces.sort((a, b) => a - b);
            this.recomputeStateGeometry(sourceState);
        }

        // Add new province to the source province's strategic region (if any)
        const sourceSR = this.getStrategicRegionByProvinceId(sourceProvince.id);
        if (sourceSR && !sourceSR.provinces.includes(newProvinceId)) {
            sourceSR.provinces.push(newProvinceId);
            sourceSR.provinces.sort((a, b) => a - b);
            this.recomputeRegionGeometry(sourceSR);
        }

        return newProvince;
    }

    public getNextProvinceId(): number {
        // HOI4 province IDs start at 1.  Bad provinces occupy negative
        // indices in the array, so start scanning from index 1 at minimum.
        const startId = Math.max(1, Math.floor(this.badProvincesCount + 1));
        for (let id = startId; id < this.provinces.length; id++) {
            if (!this.provinces[id]) {
                return Math.max(1, id);
            }
        }
        return Math.max(1, startId, Math.floor(this.provinces.length));
    }

    public snapshotProvinces(provinceIds: number[]): ProvinceSnapshot[] {
        const uniqueIds = Array.from(new Set(provinceIds));
        return uniqueIds.map(id => ({
            id,
            province: this.cloneProvince(this.getProvinceById(id)),
        }));
    }

    public restoreProvinces(snapshots: ProvinceSnapshot[]): void {
        for (const snapshot of snapshots) {
            if (snapshot.id >= 1) {
                this.provinces[snapshot.id] = this.cloneProvince(snapshot.province);
            }
        }

        // Only scan non-negative, non-zero IDs to find the last valid province
        const startScan = Math.max(1, this.badProvincesCount + 1);
        let lastProvinceId = startScan - 1;
        for (let i = this.provinces.length - 1; i >= startScan; i--) {
            if (this.provinces[i]) {
                lastProvinceId = i;
                break;
            }
        }
        this.provincesCount = Math.max(startScan, lastProvinceId + 1);
    }

    public mergeProvinces(targetProvinceId: number, sourceProvinceIds: number[], removeTargetFromStates = false): {
        paintedPixels: Map<string, number>;
        deletedProvinceIds: number[];
        changedStateIds: number[];
        changedStrategicRegionIds: number[];
        deletedStrategicRegionFiles: string[];
        deletedStrategicRegions: Array<{ id: number; file: string }>;
    } | undefined {
        const target = this.getProvinceById(targetProvinceId);
        const sources = Array.from(new Set(sourceProvinceIds))
            .filter(id => id !== targetProvinceId)
            .map(id => this.getProvinceById(id))
            .filter((province): province is Province => !!province);
        if (!target || target.id <= 0 || target.color === 0 ||
            sources.length === 0 || sources.some(source => source.id <= 0 || source.color === 0) ||
            !this.colorByPosition) {
            return undefined;
        }
        if (sources.some(source => source.type !== target.type)) {
            return undefined;
        }

        const sourceColors = new Set(sources.map(source => source.color));
        const paintedPixels = new Map<string, number>();
        for (let y = 0; y < this.height; y++) {
            const row = y * this.width;
            for (let x = 0; x < this.width; x++) {
                if (sourceColors.has(this.colorByPosition[row + x])) {
                    this.colorByPosition[row + x] = target.color;
                    paintedPixels.set(`${x},${y}`, target.color);
                }
            }
        }

        const deletedProvinceIds = sources.map(source => source.id);
        const deletedSet = new Set(deletedProvinceIds);
        const stateRemovalSet = removeTargetFromStates
            ? new Set([targetProvinceId, ...deletedProvinceIds])
            : deletedSet;
        this.rebuildCoverZonesFromPixels(target);
        const changedStateIds = new Set<number>();
        this.forEachState(state => {
            const next = state.provinces.filter(id => !stateRemovalSet.has(id));
            if (next.length !== state.provinces.length) {
                state.provinces = next;
                changedStateIds.add(state.id);
                this.recomputeStateGeometry(state);
            }
            for (const removedId of stateRemovalSet) {
                const value = state.victoryPoints[removedId];
                if (value !== undefined) {
                    if (!removeTargetFromStates) {
                        state.victoryPoints[targetProvinceId] = (state.victoryPoints[targetProvinceId] ?? 0) + value;
                    }
                    delete state.victoryPoints[removedId];
                    changedStateIds.add(state.id);
                }
            }
        });
        const targetState = this.getStateByProvinceId(targetProvinceId);
        if (targetState) {
            changedStateIds.add(targetState.id);
            this.recomputeStateGeometry(targetState);
        }

        const changedStrategicRegionIds = new Set<number>();
        this.forEachStrategicRegion(region => {
            const next = region.provinces.filter(id => !deletedSet.has(id));
            if (next.length !== region.provinces.length) {
                region.provinces = next;
                changedStrategicRegionIds.add(region.id);
                this.recomputeRegionGeometry(region);
            }
        });
        const targetRegion = this.getStrategicRegionByProvinceId(targetProvinceId);
        if (targetRegion) {
            changedStrategicRegionIds.add(targetRegion.id);
            this.recomputeRegionGeometry(targetRegion);
        }
        const deletedRegionResult = this.deleteEmptyStrategicRegions(
            Array.from(changedStrategicRegionIds).filter(id => id !== targetRegion?.id)
        );

        for (const source of sources) {
            this.provinces[source.id] = undefined;
        }

        // Do not synthesize edge polylines for a merge in the webview. A
        // merged province can contain multiple complex boundary components,
        // and the optimistic point-ordering algorithm can connect unrelated
        // fragments with long straight lines. The extension reloads the saved
        // BMP immediately after persistence, at which point the authoritative
        // province-map loader rebuilds all edges correctly.
        const staleEdgeIds = new Set([target.id, ...deletedProvinceIds]);
        this.forEachProvince(province => {
            if (province.id === target.id) {
                province.edges = [];
            } else {
                province.edges = province.edges.filter(edge => !staleEdgeIds.has(edge.to));
            }
        });

        return {
            paintedPixels,
            deletedProvinceIds,
            changedStateIds: Array.from(changedStateIds),
            changedStrategicRegionIds: Array.from(changedStrategicRegionIds),
            deletedStrategicRegionFiles: deletedRegionResult.deletedFiles,
            deletedStrategicRegions: deletedRegionResult.deletedRegions,
        };
    }

    public convertWaterProvincesToLand(
        provinceIds: number[],
        terrain: string,
        continent: number,
        coastal: boolean,
        targetStateId: number,
        targetStrategicRegionId: number
    ): {
        changedStateIds: number[];
        changedStrategicRegionIds: number[];
        deletedStrategicRegionFiles: string[];
        deletedStrategicRegions: Array<{ id: number; file: string }>;
    } | undefined {
        const normalizedIds = this.normalizeProvinceIds(provinceIds);
        const provinces = normalizedIds
            .map(id => this.getProvinceById(id))
            .filter((province): province is Province => !!province);
        const targetState = this.getStateById(targetStateId);
        const targetRegion = this.getStrategicRegionById(targetStrategicRegionId);
        const selectedTerrain = this.terrains.find(value => value.name === terrain && !value.isNaval);
        if (provinces.length !== normalizedIds.length || provinces.length === 0 ||
            provinces.some(province => province.id <= 0 || province.color === 0 ||
                (province.type !== 'sea' && province.type !== 'lake')) ||
            !targetState || !targetRegion || !selectedTerrain ||
            continent <= 0 || !this.continents[continent]) {
            return undefined;
        }

        const sourceRegionIds = new Set<number>();
        for (const province of provinces) {
            const sourceRegion = this.getStrategicRegionByProvinceId(province.id);
            if (sourceRegion) {
                sourceRegionIds.add(sourceRegion.id);
            }
            province.type = 'land';
            province.terrain = terrain;
            province.continent = continent;
            province.coastal = coastal;
        }

        const changedStateIds = new Set(
            this.assignProvincesToState(normalizedIds, targetStateId) ?? []
        );
        changedStateIds.add(targetStateId);
        const changedStrategicRegionIds = new Set(
            this.assignProvincesToStrategicRegion(normalizedIds, targetStrategicRegionId) ?? []
        );
        changedStrategicRegionIds.add(targetStrategicRegionId);
        const deletedRegionResult = this.deleteEmptyStrategicRegions(
            Array.from(sourceRegionIds).filter(id => id !== targetStrategicRegionId)
        );
        return {
            changedStateIds: Array.from(changedStateIds),
            changedStrategicRegionIds: Array.from(changedStrategicRegionIds),
            deletedStrategicRegionFiles: deletedRegionResult.deletedFiles,
            deletedStrategicRegions: deletedRegionResult.deletedRegions,
        };
    }

    public findNextProvinceColor(): number | undefined {
        // Find the maximum color in use and return the next available value.
        // HOI4 province colors are packed RGB values; we use max+1.
        let maxColor = 0;
        this.forEachProvince(p => {
            if (p.color > maxColor) {
                maxColor = p.color;
            }
        });

        // Avoid overflow
        if (maxColor >= 0xFFFFFF) {
            // Try to find a gap by scanning used colors
            const usedColors = new Set<number>();
            this.forEachProvince(p => { usedColors.add(p.color); });
            for (let c = 1; c < 0xFFFFFF; c++) {
                if (!usedColors.has(c)) {
                    return c;
                }
            }
            return undefined;
        }

        return maxColor + 1;
    }

    private cloneProvince(province: Province | undefined): Province | undefined {
        if (!province) {
            return undefined;
        }
        return {
            ...province,
            coverZones: province.coverZones.map(z => ({ ...z })),
            edges: province.edges.map(e => ({
                ...e,
                path: e.path.map(p => [...p]),
                start: e.start ? { ...e.start } : undefined,
                stop: e.stop ? { ...e.stop } : undefined,
            })),
            boundingBox: { ...province.boundingBox },
            centerOfMass: { ...province.centerOfMass },
        };
    }

    // ======== Paintbrush / Pixel-Level Methods ========

    /**
     * Get the province color at a specific pixel position.
     */
    public getColorAt(x: number, y: number): number | undefined {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return undefined;
        }
        if (!this.colorByPosition) {
            return undefined;
        }
        return this.colorByPosition[y * this.width + x];
    }

    /**
     * Set the province color at a specific pixel position.
     */
    public setColorAt(x: number, y: number, color: number): void {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return;
        }
        if (!this.colorByPosition) {
            this.colorByPosition = new Array(this.width * this.height).fill(0);
        }
        this.colorByPosition[y * this.width + x] = color;
    }

    /**
     * Get the province type ('land', 'sea', etc.) at a pixel position.
     * Returns undefined if the position is out of bounds or no province is found.
     */
    public getProvinceTypeAt(x: number, y: number): string | undefined {
        const color = this.getColorAt(x, y);
        if (color === undefined) {
            return undefined;
        }
        const province = this.getProvinceByColor(color);
        return province?.type;
    }

    /**
     * Get the full colorByPosition array (a copy for safety).
     */
    public getColorByPosition(): number[] {
        return this.colorByPosition ? [...this.colorByPosition] : [];
    }

    /**
     * Set the full colorByPosition array.
     */
    public setColorByPosition(colors: number[]): void {
        this.colorByPosition = [...colors];
    }

    /**
     * Apply painted pixels to province data structures.
     * First writes the pixels into the live colorByPosition buffer,
     * then rebuilds coverZones, edges, and province records.
     * @param paintedPixels - Map of "x,y" -> new color
     * @returns Affected province IDs and new province ID if one was created
     */
    public applyPaintbrushEdits(paintedPixels: Map<string, number>, sourceProvinceId?: number): { affectedProvinceIds: number[]; newProvinceId?: number } {
        const affectedProvinceIds = new Set<number>();
        // Record donor provinces before replacing their colors. Their geometry
        // must be rebuilt just as the receiving province's geometry is.
        for (const key of paintedPixels.keys()) {
            const [x, y] = key.split(',').map(Number);
            const previousColor = this.getColorAt(x, y);
            if (previousColor === undefined) continue;
            const previousProvince = this.getProvinceByColor(previousColor);
            if (previousProvince) affectedProvinceIds.add(previousProvince.id);
        }

        // --- Write draft pixels into the live colour buffer ---------------
        for (const [key, color] of paintedPixels) {
            const [x, y] = key.split(',').map(Number);
            this.setColorAt(x, y, color);
        }

        let newProvinceId: number | undefined;

        // Collect unique colors used in paint operations
        const newColorSet = new Set<number>();
        for (const color of paintedPixels.values()) {
            newColorSet.add(color);
        }

        // For each unique new color, handle the province update
        for (const newColor of newColorSet) {
            // Check if this color already corresponds to a province
            const existingProvince = this.getProvinceByColor(newColor);

            if (existingProvince) {
                // Existing province: we're adding pixels to it
                affectedProvinceIds.add(existingProvince.id);
            } else {
                // New color: create a new province
                const nextId = Math.max(1, Math.floor(this.getNextProvinceId()));
                if (this.provinces[nextId]) {
                    throw new Error(`Refusing to overwrite existing province ID ${nextId}.`);
                }
                newProvinceId = nextId;

                const sourceProvince = sourceProvinceId !== undefined ? this.getProvinceById(sourceProvinceId) : undefined;

                const newProvince: Province = {
                    id: nextId,
                    color: newColor,
                    type: sourceProvince?.type ?? 'land',
                    coastal: sourceProvince?.coastal ?? false,
                    terrain: sourceProvince?.terrain ?? '',
                    continent: sourceProvince?.continent ?? 0,
                    coverZones: [],
                    edges: [],
                    boundingBox: { x: 0, y: 0, w: 0, h: 0 },
                    centerOfMass: { x: 0, y: 0 },
                    mass: 0,
                };

                this.provinces[nextId] = newProvince;
                if (nextId >= this.provincesCount) {
                    this.provincesCount = nextId + 1;
                }
                affectedProvinceIds.add(nextId);
                if (sourceProvinceId !== undefined) {
                    affectedProvinceIds.add(sourceProvinceId);
                }
            }
        }

        // Rebuild coverZones for all affected provinces from the updated colorByPosition
        for (const provId of affectedProvinceIds) {
            const province = this.getProvinceById(provId);
            if (province) {
                this.rebuildCoverZonesFromPixels(province);
            }
        }

        // Atomic edge rebuild: expand to neighbors, clear once, scan once, install pairs
        this.rebuildAffectedProvinceEdges(affectedProvinceIds);

        return { affectedProvinceIds: Array.from(affectedProvinceIds), newProvinceId };
    }

    /**
     * Find a province by its color value.
     */
    private getProvinceByColor(color: number): Province | undefined {
        for (let i = 0; i < this.provinces.length; i++) {
            const p = this.provinces[i];
            if (p && p.color === color) {
                return p;
            }
        }
        return undefined;
    }

    /**
     * Rebuild coverZones for a province from the current colorByPosition pixel data.
     */
    private rebuildCoverZonesFromPixels(province: Province): void {
        const zones: Zone[] = [];
        const color = province.color;
        const width = this.width;
        const height = this.height;
        const pixels = this.colorByPosition;

        if (!pixels) {
            return;
        }

        const visited = new Uint8Array(width * height);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = y * width + x;

                if (visited[index] || pixels[index] !== color) {
                    continue;
                }

                let zoneWidth = 1;

                while (
                    x + zoneWidth < width &&
                    pixels[y * width + x + zoneWidth] === color &&
                    !visited[y * width + x + zoneWidth]
                ) {
                    zoneWidth++;
                }

                let zoneHeight = 1;
                let canExpand = true;

                while (canExpand && y + zoneHeight < height) {
                    for (let dx = 0; dx < zoneWidth; dx++) {
                        const checkIndex =
                            (y + zoneHeight) * width + x + dx;

                        if (
                            pixels[checkIndex] !== color ||
                            visited[checkIndex]
                        ) {
                            canExpand = false;
                            break;
                        }
                    }

                    if (canExpand) {
                        zoneHeight++;
                    }
                }

                for (let dy = 0; dy < zoneHeight; dy++) {
                    const rowIndex = (y + dy) * width + x;

                    for (let dx = 0; dx < zoneWidth; dx++) {
                        visited[rowIndex + dx] = 1;
                    }
                }

                zones.push({
                    x,
                    y,
                    w: zoneWidth,
                    h: zoneHeight,
                });
            }
        }

        province.coverZones = zones;
        province.mass = zones.reduce(
            (sum, zone) => sum + zone.w * zone.h,
            0
        );

        if (zones.length === 0) {
            province.boundingBox = {
                x: 0,
                y: 0,
                w: 0,
                h: 0,
            };

            province.centerOfMass = {
                x: 0,
                y: 0,
            };

            return;
        }

        province.boundingBox = this.computeBoundingBox(zones);
        province.centerOfMass = this.computeCenterOfMass(zones);
    }

    /**
     * Atomically rebuild edges for every province touched by a paintbrush edit
     * (including all immediate neighbours of directly-affected provinces).
     *
     * Two-phase approach:
     *   1. Expand the affected set and clear *all* old edges once.
     *   2. Scan the pixel buffer once, build canonical boundary polylines
     *      per colour-pair, then install matching forward/reverse edges
     *      from the same shared geometry.
     *
     * Invariant after this call: for every edge A→B there is a corresponding
     * edge B→A with reversed (but geometrically identical) paths.
     */
    private rebuildAffectedProvinceEdges(seedIds: Set<number>): void {
        // --- Phase 1: expand the affected set and clear old edges ----------
        const allAffected = new Set(seedIds);

        for (const id of seedIds) {
            const province = this.getProvinceById(id);
            if (!province) continue;

            for (const edge of province.edges) {
                allAffected.add(edge.to);
            }
        }

        for (const id of allAffected) {
            const province = this.getProvinceById(id);
            if (!province) continue;

            // Remove reverse edges that point AT this province from neighbours
            for (const edge of province.edges) {
                const neighbor = this.getProvinceById(edge.to);
                if (neighbor) {
                    neighbor.edges = neighbor.edges.filter(
                        e => e.to !== province.id
                    );
                }
            }

            province.edges = [];
        }

        // --- Phase 2: scan pixels once, build canonical boundary data ------
        const w = this.width;
        const h = this.height;
        const pixels = this.colorByPosition;
        if (!pixels) return;

        // Key: "fromColor|toColor" → array of boundary segment pairs.
        // A segment pair is { x1,y1 (our pixel), x2,y2 (adjacent pixel) }.
        type Segment = { x1: number; y1: number; x2: number; y2: number };
        const segmentsByPair = new Map<string, Segment[]>();

        for (const id of allAffected) {
            const province = this.getProvinceById(id);
            if (!province) continue;

            const color = province.color;

            for (const zone of province.coverZones) {
                for (let dy = 0; dy < zone.h; dy++) {
                    for (let dx = 0; dx < zone.w; dx++) {
                        const x = zone.x + dx;
                        const y = zone.y + dy;
                        const idx = y * w + x;

                        if (pixels[idx] !== color) continue;

                        const neighbors: [number, number][] = [
                            [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
                        ];

                        for (const [nx, ny] of neighbors) {
                            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
                            const nColor = pixels[ny * w + nx];
                            if (nColor === color || nColor === 0) continue;

                            const key = `${color}|${nColor}`;
                            if (!segmentsByPair.has(key)) {
                                segmentsByPair.set(key, []);
                            }
                            segmentsByPair.get(key)!.push({
                                x1: x, y1: y,
                                x2: nx, y2: ny,
                            });
                        }
                    }
                }
            }
        }

        // --- Phase 3: install matched edge pairs from shared geometry ------
        for (const [key, segments] of segmentsByPair) {
            const [fromColorStr, toColorStr] = key.split('|');
            const fromColor = Number(fromColorStr);
            const toColor = Number(toColorStr);

            const fromProvince = this.getProvinceByColor(fromColor);
            const toProvince = this.getProvinceByColor(toColor);
            if (!fromProvince || !toProvince) continue;

            // Build the shared forward polyline (from-province → to-province).
            const forwardPaths = this.buildBoundaryPolylines(segments);

            // Forward edge: fromProvince → toProvince.
            // Paths trace "our side" points; the renderer draws lines between
            // consecutive points, which produces the boundary stroke.
            fromProvince.edges.push({
                to: toProvince.id,
                type: 'land',
                path: forwardPaths,
                rule: undefined,
            });

            // Reverse edge: toProvince → fromProvince.
            // Same geometry, reversed point order.
            toProvince.edges.push({
                to: fromProvince.id,
                type: 'land',
                path: forwardPaths.map(p => [...p].reverse().map(pt => ({ ...pt }))),
                rule: undefined,
            });
        }
    }

    /**
     * Convert raw boundary segments into contiguous polylines.
     *
     * Each segment records a boundary pixel (x1,y1) that belongs to our
     * province and touches a neighbour pixel (x2,y2).  We collect the
     * (x1,y1) points, find connected components via 8-neighbour BFS,
     * then greedily order each component into a polyline.
     */
    private buildBoundaryPolylines(
        segments: { x1: number; y1: number; x2: number; y2: number }[]
    ): Point[][] {
        if (segments.length === 0) return [];

        // Deduplicate "our side" points.
        const pointSet = new Set<string>();
        for (const s of segments) {
            pointSet.add(`${s.x1},${s.y1}`);
        }

        const grid = new Map<string, Point>();
        for (const key of pointSet) {
            const [px, py] = key.split(',').map(Number);
            grid.set(key, { x: px, y: py });
        }

        const visited = new Set<string>();
        const result: Point[][] = [];

        for (const [key, pt] of grid) {
            if (visited.has(key)) continue;

            // BFS to find the connected component.
            const component: Point[] = [];
            const queue: Point[] = [pt];
            visited.add(key);

            while (queue.length > 0) {
                const cur = queue.shift()!;
                component.push(cur);

                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const nk = `${cur.x + dx},${cur.y + dy}`;
                        if (!visited.has(nk) && grid.has(nk)) {
                            visited.add(nk);
                            queue.push(grid.get(nk)!);
                        }
                    }
                }
            }

            // Order the component into a coherent polyline.
            if (component.length >= 2) {
                const ordered = this.orderBoundaryPoints(component);
                if (ordered.length >= 2) {
                    result.push(ordered);
                }
            }
        }

        return result;
    }

    /**
     * Greedily order a set of boundary points into a polyline by
     * repeatedly moving to the nearest unvisited point.
     */
    private orderBoundaryPoints(points: Point[]): Point[] {
        if (points.length <= 2) return [...points];

        const remaining = new Set(points.map((_p, i) => i));

        // Start from the top-left-most point.
        let curIdx = 0;
        let minKey = Infinity;
        for (let i = 0; i < points.length; i++) {
            const k = points[i].y * 100000 + points[i].x;
            if (k < minKey) {
                minKey = k;
                curIdx = i;
            }
        }

        const ordered: Point[] = [points[curIdx]];
        remaining.delete(curIdx);

        while (remaining.size > 0) {
            const last = ordered[ordered.length - 1];
            let bestIdx = -1;
            let bestDist = Infinity;

            for (const idx of remaining) {
                const d = Math.abs(points[idx].x - last.x) + Math.abs(points[idx].y - last.y);
                if (d < bestDist) {
                    bestDist = d;
                    bestIdx = idx;
                }
            }

            if (bestIdx < 0 || bestDist > 3) break;

            ordered.push(points[bestIdx]);
            remaining.delete(bestIdx);
        }

        return ordered;
    }

    private computeCenterOfMass(zones: { x: number; y: number; w: number; h: number }[]): { x: number; y: number } {
        let totalMass = 0;
        let weightedX = 0;
        let weightedY = 0;
        for (const zone of zones) {
            const mass = zone.w * zone.h;
            totalMass += mass;
            weightedX += (zone.x + zone.w / 2) * mass;
            weightedY += (zone.y + zone.h / 2) * mass;
        }
        if (totalMass === 0) {
            return { x: 0, y: 0 };
        }
        return {
            x: weightedX / totalMass,
            y: weightedY / totalMass,
        };
    }

    private cloneState(state: State | undefined): State | undefined {
        if (!state) {
            return undefined;
        }

        return {
            ...state,
            provinces: [...state.provinces],
            cores: [...state.cores],
            victoryPoints: { ...state.victoryPoints },
            resources: { ...state.resources },
            boundingBox: { ...state.boundingBox },
            centerOfMass: { ...state.centerOfMass },
            token: state.token ? { ...state.token } : null,
        };
    }

    public createStrategicRegionFromProvinces(provinceIds: number[]): {
        newStrategicRegionId: number;
        changedRegionIds: number[];
        deletedFiles: string[];
        deletedRegions: Array<{ id: number; file: string }>;
    } | undefined {
        const normalizedProvinceIds = this.normalizeProvinceIds(provinceIds);
        if (normalizedProvinceIds.length === 0) {
            return undefined;
        }

        const newId = this.findNextStrategicRegionId();
        const newRegion = {
            id: newId,
            name: `STRATEGIC_REGION_${newId}`,
            provinces: [] as number[],
            navalTerrain: null,
            file: `map/strategicregions/${newId}-strategicregion.txt`,
            token: null,
            boundingBox: { x: 0, y: 0, w: 0, h: 0 },
            centerOfMass: { x: 0, y: 0 },
            mass: 0,
        } as StrategicRegion;

        this.strategicRegions[newId] = newRegion;
        if (newId >= this.strategicRegionsCount) {
            this.strategicRegionsCount = newId + 1;
        }

        const changed = this.assignProvincesToStrategicRegion(normalizedProvinceIds, newId);
        if (!changed || changed.length === 0) {
            // Revert creation
            this.strategicRegions[newId] = undefined as any;
            let lastId = this.badStrategicRegionsCount - 1;
            for (let i = this.strategicRegions.length - 1; i >= this.badStrategicRegionsCount; i--) {
                if (this.strategicRegions[i]) {
                    lastId = i;
                    break;
                }
            }

            this.strategicRegionsCount = Math.max(this.badStrategicRegionsCount, lastId + 1);
            return undefined;
        }

        const deletedRegionRecords = changed
            .filter(id => id !== newId)
            .map(id => this.getStrategicRegionById(id))
            .filter((region): region is StrategicRegion => !!region && region.provinces.length === 0)
            .map(region => ({ id: region.id, file: region.file }));
        for (const region of deletedRegionRecords) {
            this.strategicRegions[region.id] = undefined as any;
        }
        let lastRegionId = this.badStrategicRegionsCount - 1;
        for (let id = this.strategicRegions.length - 1; id >= this.badStrategicRegionsCount; id--) {
            if (this.strategicRegions[id]) {
                lastRegionId = id;
                break;
            }
        }
        this.strategicRegionsCount = Math.max(
            this.badStrategicRegionsCount,
            lastRegionId + 1
        );
        const deletedFiles = Array.from(new Set(
            deletedRegionRecords
                .map(region => region.file)
                .filter(file => !this.strategicRegions.some(region => region?.file === file))
        ));
        return {
            newStrategicRegionId: newId,
            changedRegionIds: changed,
            deletedFiles,
            deletedRegions: deletedRegionRecords.filter(region => !deletedFiles.includes(region.file)),
        };
    }

    public createStrategicRegionFromStates(stateIds: number[]): {
        newStrategicRegionId: number;
        changedRegionIds: number[];
        deletedFiles: string[];
        deletedRegions: Array<{ id: number; file: string }>;
    } | undefined {
        const provinceIds: number[] = [];
        for (const stateId of new Set(stateIds)) {
            const state = this.getStateById(stateId);
            if (state) {
                provinceIds.push(...state.provinces);
            }
        }
        return this.createStrategicRegionFromProvinces(provinceIds);
    }

    private computeBoundingBox(boxes: Zone[]): Zone {
        let minX = Number.MAX_SAFE_INTEGER;
        let minY = Number.MAX_SAFE_INTEGER;
        let maxX = Number.MIN_SAFE_INTEGER;
        let maxY = Number.MIN_SAFE_INTEGER;

        for (const box of boxes) {
            minX = Math.min(minX, box.x);
            minY = Math.min(minY, box.y);
            maxX = Math.max(maxX, box.x + box.w);
            maxY = Math.max(maxY, box.y + box.h);
        }

        return {
            x: minX,
            y: minY,
            w: Math.max(0, maxX - minX),
            h: Math.max(0, maxY - minY),
        };
    }
}
