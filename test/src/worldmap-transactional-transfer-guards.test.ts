import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { Province, State, StrategicRegion, WorldMapData } from '../../src/previewdef/worldmap/definitions';

(global as any).acquireVsCodeApi = () => ({
    postMessage: () => undefined,
    getState: () => undefined,
    setState: () => undefined,
});
(global as any).window = {
    __i18ntable: {},
    addEventListener: () => undefined,
};

const { FEWorldMapClass } = require('../../webviewsrc/worldmap/loader') as typeof import('../../webviewsrc/worldmap/loader');

function province(id: number): Province {
    return {
        id,
        color: id * 11,
        type: 'land',
        terrain: 'plains',
        continent: 1,
        coastal: false,
        boundingBox: { x: id - 1, y: 0, w: 1, h: 1 },
        centerOfMass: { x: id - 0.5, y: 0.5 },
        mass: 1,
        coverZones: [{ x: id - 1, y: 0, w: 1, h: 1 }],
        edges: [],
    };
}

function state(id: number, provinces: number[]): State {
    return {
        id,
        name: `STATE_${id}`,
        localisedName: undefined,
        manpower: 1,
        category: 'rural',
        categoryColor: 0,
        owner: [],
        controller: [],
        provinces,
        cores: [],
        impassable: false,
        victoryPoints: {},
        resources: {},
        file: `history/states/${id}.txt`,
        token: null,
        boundingBox: { x: 0, y: 0, w: provinces.length, h: 1 },
        centerOfMass: { x: 0, y: 0 },
        mass: provinces.length,
    };
}

function region(id: number, provinces: number[]): StrategicRegion {
    return {
        id,
        name: `STRATEGIC_REGION_${id}`,
        localisedName: undefined,
        provinces,
        navalTerrain: null,
        file: `map/strategicregions/${id}.txt`,
        token: null,
        boundingBox: { x: 0, y: 0, w: provinces.length, h: 1 },
        centerOfMass: { x: 0, y: 0 },
        mass: provinces.length,
    };
}

function mapFixture(): InstanceType<typeof FEWorldMapClass> {
    const data: WorldMapData & {
        provincesCount: number;
        statesCount: number;
        countriesCount: number;
        railwaysCount: number;
        supplyNodesCount: number;
    } = {
        width: 3,
        height: 1,
        colorByPosition: new Uint32Array([11, 22, 33]),
        provinces: [undefined, province(1), province(2), province(3)],
        states: [undefined, state(1, [1, 3]), state(2, [2])],
        stateCategories: [],
        countries: [],
        strategicRegions: [undefined, region(1, [1, 3]), region(2, [2])],
        supplyAreas: [],
        railways: [],
        supplyNodes: [],
        provincesCount: 4,
        statesCount: 3,
        countriesCount: 0,
        strategicRegionsCount: 3,
        supplyAreasCount: 0,
        railwaysCount: 0,
        supplyNodesCount: 0,
        badProvincesCount: 0,
        badStatesCount: 0,
        badStrategicRegionsCount: 0,
        badSupplyAreasCount: 0,
        continents: ['', 'Europe'],
        terrains: [{ name: 'plains', color: 0, isNaval: false, file: '' }],
        resources: [],
        rivers: [],
        conditionExprs: [],
        bookmarks: [],
        diplomacyRelations: [],
        countryHistoryFiles: {},
        warnings: [],
    };
    return new FEWorldMapClass(data);
}

describe('world map transactional transfer guards', () => {
    it('refuses an all-province state transfer without changing either state', () => {
        const map = mapFixture();
        const result = map.assignProvincesToState([1, 3], 2);

        assert.strictEqual(result, undefined);
        assert.deepStrictEqual(map.getStateById(1)?.provinces, [1, 3]);
        assert.deepStrictEqual(map.getStateById(2)?.provinces, [2]);
    });

    it('allows a state transfer when every source state retains a province', () => {
        const map = mapFixture();
        const result = map.assignProvincesToState([1], 2);

        assert.deepStrictEqual(new Set(result), new Set([1, 2]));
        assert.deepStrictEqual(map.getStateById(1)?.provinces, [3]);
        assert.deepStrictEqual(map.getStateById(2)?.provinces, [1, 2]);
    });

    it('replaces a source state emptied by state creation', () => {
        const map = mapFixture();
        const result = map.createStateFromProvinces([1, 3]);

        assert.strictEqual(result?.newStateId, 3);
        assert.deepStrictEqual(map.getStateById(3)?.provinces, [1, 3]);
        assert.strictEqual(map.getStateById(1), undefined);
        assert.deepStrictEqual(result?.stateReplacements, { 1: 3 });
        assert.deepStrictEqual(result?.deletedFiles, ['history/states/1.txt']);
    });

    it('refuses an all-province strategic-region transfer without partial mutation', () => {
        const map = mapFixture();
        const result = map.assignProvincesToStrategicRegion([1, 3], 2);

        assert.strictEqual(result, undefined);
        assert.deepStrictEqual(map.getStrategicRegionById(1)?.provinces, [1, 3]);
        assert.deepStrictEqual(map.getStrategicRegionById(2)?.provinces, [2]);
    });

    it('keeps explicit create-region deletion semantics behind its confirmed route', () => {
        const map = mapFixture();
        const result = map.createStrategicRegionFromProvinces([1, 3]);

        assert.ok(result);
        assert.strictEqual(map.getStrategicRegionById(1), undefined);
        assert.deepStrictEqual(map.getStrategicRegionById(result!.newStrategicRegionId)?.provinces, [1, 3]);
    });

    it('creates membership payload records for a newly painted land province', () => {
        const map = mapFixture();
        const edit = map.applyPaintbrushEdits(new Map([['0,0', 44]]), 1);
        assert.ok(edit.newProvinceId);

        const stateIds = map.assignProvincesToState([edit.newProvinceId!], 1);
        const regionIds = map.assignProvincesToStrategicRegion([edit.newProvinceId!], 1);

        assert.deepStrictEqual(stateIds, [1]);
        assert.deepStrictEqual(regionIds, [1]);
        assert.ok(map.getStateById(1)?.provinces.includes(edit.newProvinceId!));
        assert.ok(map.getStrategicRegionById(1)?.provinces.includes(edit.newProvinceId!));
    });

    it('captures state-derived source regions and persists new-province memberships in the BMP transaction', () => {
        const source = fs.readFileSync(
            path.join(process.cwd(), 'webviewsrc/worldmap/topbar.ts'),
            'utf-8'
        );

        assert.ok(source.includes('for (const stateId of selectedStateIds)'));
        assert.ok(source.includes('for (const provinceId of selectedState?.provinces ?? [])'));
        assert.ok(source.includes('states: membershipStateIds.size > 0'));
        assert.ok(source.includes('strategicRegions: membershipStrategicRegionIds.size > 0'));
        assert.ok(source.indexOf('missingMembership.length > 0') < source.indexOf('applyPaintbrushEdits('));
    });
});
