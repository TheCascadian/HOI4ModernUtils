import * as assert from 'assert';
import { Province, State, StrategicRegion, WorldMapData } from '../../src/previewdef/worldmap/definitions';
import { planClusterMergeGroups } from '../../webviewsrc/worldmap/mergeplanning';

(global as any).acquireVsCodeApi = () => ({ postMessage: () => undefined, getState: () => undefined, setState: () => undefined });
(global as any).window = { __i18ntable: {}, addEventListener: () => undefined };

const { FEWorldMapClass } = require('../../webviewsrc/worldmap/loader') as typeof import('../../webviewsrc/worldmap/loader');

function province(id: number, edges: number[]): Province {
    return {
        id, color: id * 11, type: 'land', terrain: 'plains', continent: 1, coastal: false,
        boundingBox: { x: id - 1, y: 0, w: 1, h: 1 }, centerOfMass: { x: id - 0.5, y: 0.5 },
        mass: 1, coverZones: [{ x: id - 1, y: 0, w: 1, h: 1 }],
        edges: edges.map(to => ({ to, toColor: to * 11, type: '' } as any)),
    };
}

function state(id: number, provinces: number[]): State {
    return {
        id, name: `STATE_${id}`, localisedName: undefined, manpower: 0, category: 'rural', categoryColor: 0,
        owner: [], controller: [], provinces, cores: [], claimBy: [], isDemilitarizedZone: [], impassable: false,
        victoryPoints: {}, resources: {}, file: `history/states/${id}.txt`, token: null,
        boundingBox: { x: 0, y: 0, w: 1, h: 1 }, centerOfMass: { x: 0, y: 0 }, mass: provinces.length,
    };
}

function region(id: number, provinces: number[]): StrategicRegion {
    return {
        id, name: `STRATEGIC_REGION_${id}`, localisedName: undefined, provinces, navalTerrain: null,
        file: `map/strategicregions/${id}.txt`, token: null,
        boundingBox: { x: 0, y: 0, w: 1, h: 1 }, centerOfMass: { x: 0, y: 0 }, mass: provinces.length,
    };
}

describe('auto-merge country workflow', () => {
    it('plans and applies merges after moving a country into one region', () => {
        const data: any = {
            width: 6, height: 1, colorByPosition: new Uint32Array([11, 22, 33, 44, 55, 66]),
            provinces: [undefined, province(1, [2]), province(2, [1, 3]), province(3, [2, 4]),
                province(4, [3, 5]), province(5, [4, 6]), province(6, [5])],
            states: [undefined, state(1, [1, 2, 3]), state(2, [4, 5, 6])],
            stateCategories: [], countries: [],
            strategicRegions: [undefined, region(1, [1, 2, 4]), region(2, [3, 5, 6])],
            supplyAreas: [], railways: [], supplyNodes: [],
            provincesCount: 7, statesCount: 3, countriesCount: 0, railwaysCount: 0, supplyNodesCount: 0,
            strategicRegionsCount: 3, supplyAreasCount: 0, badProvincesCount: 0, badStatesCount: 0,
            badStrategicRegionsCount: 0, badSupplyAreasCount: 0, continents: ['', 'Europe'],
            terrains: [{ name: 'plains', color: 0, isNaval: false, file: '' }],
            resources: [], rivers: [], conditionExprs: [], bookmarks: [], diplomacyRelations: [],
            countryHistoryFiles: {}, warnings: [],
        };
        const map = new FEWorldMapClass(data as WorldMapData);
        assert.ok(map.createStrategicRegionFromProvinces([1, 2, 3, 4, 5, 6]));
        const groups = planClusterMergeGroups(map, [1, 2, 3, 4, 5, 6]);
        assert.strictEqual(groups.length, 1);
        const result = map.mergeProvinceGroups(groups);
        assert.ok(result);
        assert.strictEqual(result.deletedProvinceIds.length, 5);
        const targetStateId = map.getStateByProvinceId(groups[0].targetId)!.id;
        const emptied = [1, 2].filter(id => id !== targetStateId && map.getStateById(id)!.provinces.length === 0);
        assert.strictEqual(emptied.length, 1);
        assert.ok(map.mergeStates(targetStateId, emptied));
        assert.deepStrictEqual(map.getStateById(targetStateId)!.provinces, [groups[0].targetId]);
    });
});
