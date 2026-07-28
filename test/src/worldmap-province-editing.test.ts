import * as assert from 'assert';
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

function province(id: number, color: number, type: string, terrain: string, continent: number): Province {
    return {
        id,
        color,
        type,
        terrain,
        continent,
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
        manpower: 0,
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

function mapFixture() {
    const data: WorldMapData & {
        provincesCount: number;
        statesCount: number;
        countriesCount: number;
        railwaysCount: number;
        supplyNodesCount: number;
    } = {
        width: 2,
        height: 1,
        colorByPosition: [11, 22],
        provinces: [undefined, province(1, 11, 'sea', 'ocean', 0), province(2, 22, 'sea', 'ocean', 0)],
        states: [undefined, state(1, [1]), state(2, [2])],
        stateCategories: [],
        countries: [],
        strategicRegions: [undefined, region(1, [1]), region(2, [2])],
        supplyAreas: [],
        railways: [],
        supplyNodes: [],
        provincesCount: 3,
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
        terrains: [
            { name: 'ocean', color: 0, isNaval: true, file: '' },
            { name: 'plains', color: 0, isNaval: false, file: '' },
        ],
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

describe('world map province editing workflows', () => {
    it('consolidates ocean provinces across regions and clears state membership', () => {
        const map = mapFixture();
        const result = map.mergeProvinces(1, [2], true);
        assert.ok(result);
        assert.strictEqual(result.paintedPixels.size, 1);
        assert.strictEqual(map.getProvinceById(2), undefined);
        assert.deepStrictEqual(map.getStateById(1)?.provinces, []);
        assert.deepStrictEqual(map.getStateById(2)?.provinces, []);
        assert.strictEqual(map.getStrategicRegionById(2), undefined);
        assert.deepStrictEqual(result.deletedStrategicRegionFiles, ['map/strategicregions/2.txt']);
    });

    it('converts water to land with complete state and strategic-region membership', () => {
        const map = mapFixture();
        const result = map.convertWaterProvincesToLand([2], 'plains', 1, true, 1, 1);
        assert.ok(result);
        const converted = map.getProvinceById(2);
        assert.strictEqual(converted?.type, 'land');
        assert.strictEqual(converted?.terrain, 'plains');
        assert.strictEqual(converted?.continent, 1);
        assert.strictEqual(converted?.coastal, true);
        assert.deepStrictEqual(map.getStateById(1)?.provinces, [1, 2]);
        assert.deepStrictEqual(map.getStateById(2)?.provinces, []);
        assert.deepStrictEqual(map.getStrategicRegionById(1)?.provinces, [1, 2]);
        assert.strictEqual(map.getStrategicRegionById(2), undefined);
        assert.deepStrictEqual(result.deletedStrategicRegionFiles, ['map/strategicregions/2.txt']);
    });
});
