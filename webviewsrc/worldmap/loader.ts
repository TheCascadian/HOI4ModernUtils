import { WorldMapMessage, Province, WorldMapData, RequestMapItemMessage, State, Country, Point, Zone } from "./definitions";
import { copyArray } from "../util/common";
import { inBBox } from "./graphutils";
import { Subscriber } from "../util/event";
import { WorldMapWarning, Terrain, StrategicRegion, SupplyArea, Railway, SupplyNode, Resource, River } from "../../src/previewdef/worldmap/definitions";
import { vscode } from "../util/vscode";
import { BehaviorSubject, fromEvent, Observable, ObservedValueOf, Subject } from 'rxjs';

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
    getNextStateId(): number;
    snapshotStates(stateIds: number[]): StateSnapshot[];
    restoreStates(snapshots: StateSnapshot[]): void;

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
                    console.log(message.data);
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

class FEWorldMapClass implements FEWorldMap {
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

    private provinces!: (Province | null | undefined)[];
    private states!: (State | null | undefined)[];
    private strategicRegions!: (StrategicRegion | null | undefined)[];
    private supplyAreas!: (SupplyArea | null | undefined)[];
    private railways!: (Railway | null | undefined)[];
    private supplyNodes!: (SupplyNode | null | undefined)[];

    constructor(worldMap?: WorldMapData & ExtraMapData) {
        Object.assign(this, worldMap ?? ({
            width: 0, height: 0,
            provinces: [], states: [], countries: [], warnings: [], continents: [], strategicRegions: [], supplyAreas: [], terrains: [],
            railways: [], supplyNodes: [], resources: [], rivers: [],
            provincesCount: 0, statesCount: 0, countriesCount: 0, strategicRegionsCount: 0, supplyAreasCount: 0,
            badProvincesCount: 0, badStatesCount: 0, badStrategicRegionsCount: 0, badSupplyAreasCount: 0,
            railwaysCount: 0, supplyNodesCount: 0,
        } as WorldMapData & ExtraMapData));
    }

    public getProvinceById = (provinceId: number | undefined): Province | undefined => {
        return provinceId ? this.provinces[provinceId] ?? undefined : undefined;
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
            manpower: 0,
            category: template?.category ?? 'rural',
            owner: template?.owner,
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

    public snapshotStrategicRegions(strategicRegionIds: number[]): StrategicRegionSnapshot[] {
        const uniqueIds = Array.from(new Set(strategicRegionIds));
        return uniqueIds.map(id => ({
            id,
            strategicRegion: this.cloneStrategicRegion(this.getStrategicRegionById(id)),
        }));
    }

    public restoreStrategicRegions(snapshots: StrategicRegionSnapshot[]): void {
        for (const snapshot of snapshots) {
            this.strategicRegions[snapshot.id] = this.cloneStrategicRegion(snapshot.strategicRegion);
        }

        let lastId = this.badStrategicRegionsCount - 1;
        for (let i = this.strategicRegions.length - 1; i >= this.badStrategicRegionsCount; i--) {
            if (this.strategicRegions[i]) {
                lastId = i;
                break;
            }
        }

        this.strategicRegionsCount = Math.max(this.badStrategicRegionsCount, lastId + 1);
    }

    public addStatesToStrategicRegion(stateIds: number[], targetStrategicRegionId: number): number[] | undefined {
        const target = this.getStrategicRegionById(targetStrategicRegionId);
        if (!target) {
            return undefined;
        }

        const uniqueStateIds = Array.from(new Set(stateIds)).filter(id => !!this.getStateById(id));
        if (uniqueStateIds.length === 0) {
            return undefined;
        }

        let changed = false;
        const changedRegionIds = new Set<number>();

        // Collect provinces from given states
        const provincesToAdd = new Set<number>();
        for (const stateId of uniqueStateIds) {
            const state = this.getStateById(stateId);
            if (!state) continue;
            for (const p of state.provinces) provincesToAdd.add(p);
        }

        if (provincesToAdd.size === 0) {
            return undefined;
        }

        // Remove these provinces from other strategic regions
        this.forEachStrategicRegion(sr => {
            if (sr.id === targetStrategicRegionId) return;
            const beforeLength = sr.provinces.length;
            sr.provinces = sr.provinces.filter(id => !provincesToAdd.has(id));
            if (sr.provinces.length !== beforeLength) {
                changed = true;
                changedRegionIds.add(sr.id);
            }
        });

        // Add to target
        for (const p of provincesToAdd) {
            if (!target.provinces.includes(p)) {
                target.provinces.push(p);
                changed = true;
            }
        }

        if (!changed) {
            return undefined;
        }

        target.provinces.sort((a, b) => a - b);
        changedRegionIds.add(targetStrategicRegionId);

        changedRegionIds.forEach(id => {
            const sr = this.getStrategicRegionById(id);
            if (sr) {
                this.recomputeStrategicRegionGeometry(sr);
            }
        });

        return Array.from(changedRegionIds.values());
    }

    private recomputeStrategicRegionGeometry(strategicRegion: StrategicRegion): void {
        const provinces = strategicRegion.provinces
            .map(id => this.getProvinceById(id))
            .filter((p): p is Province => !!p);

        if (provinces.length === 0) {
            strategicRegion.boundingBox = { x: 0, y: 0, w: 0, h: 0 };
            strategicRegion.centerOfMass = { x: 0, y: 0 };
            strategicRegion.mass = 0;
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

        strategicRegion.boundingBox = bbox;
        strategicRegion.mass = totalMass;
        strategicRegion.centerOfMass = {
            x: weightedX / totalMass,
            y: weightedY / totalMass,
        };
    }

    private cloneStrategicRegion(strategicRegion: StrategicRegion | undefined): StrategicRegion | undefined {
        if (!strategicRegion) return undefined;

        return {
            ...strategicRegion,
            provinces: [...strategicRegion.provinces],
            token: strategicRegion.token ? { ...strategicRegion.token } : null,
            boundingBox: { ...strategicRegion.boundingBox },
            centerOfMass: { ...strategicRegion.centerOfMass },
        };
    }

    public createStrategicRegionFromStates(stateIds: number[]): { newStrategicRegionId: number; changedRegionIds: number[] } | undefined {
        const uniqueStateIds = Array.from(new Set(stateIds)).filter(id => !!this.getStateById(id));
        if (uniqueStateIds.length === 0) {
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

        const changed = this.addStatesToStrategicRegion(uniqueStateIds, newId);
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

        return { newStrategicRegionId: newId, changedRegionIds: changed };
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
