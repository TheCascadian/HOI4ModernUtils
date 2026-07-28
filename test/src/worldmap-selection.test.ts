import * as assert from 'assert';
import { Province, River } from '../../webviewsrc/worldmap/definitions';
import {
    forEachRiverPixel,
    ProvinceSelectionHistory,
    SelectableWorldMap,
    selectProvinceIds,
    selectRiverProvinceIds,
} from '../../webviewsrc/worldmap/selection';

function province(id: number, type: string, terrain: string, coastal = false): Province {
    return {
        id,
        type,
        terrain,
        coastal,
        color: id,
        continent: 1,
        boundingBox: { x: id - 1, y: 0, w: 1, h: 1 },
        centerOfMass: { x: id - 1, y: 0 },
        mass: 1,
        coverZones: [{ x: id - 1, y: 0, w: 1, h: 1 }],
        edges: [],
    };
}

function worldMap(provinces: Province[], rivers: River[] = []): SelectableWorldMap {
    return {
        width: provinces.length,
        rivers,
        forEachProvince(callback) {
            for (const item of provinces) {
                if (callback(item)) break;
            }
        },
        getProvinceByPosition(x, y) {
            return y === 0 ? provinces[x] : undefined;
        },
    };
}

describe('world map bulk selections', () => {
    const provinces = [
        province(1, 'land', 'plains', true),
        province(2, 'sea', 'ocean'),
        province(3, 'lake', 'lakes'),
    ];

    it('selects province types and terrain using predicates', () => {
        const map = worldMap(provinces);
        assert.deepStrictEqual(Array.from(selectProvinceIds(map, item => item.type === 'land')), [1]);
        assert.deepStrictEqual(Array.from(selectProvinceIds(map, item => item.terrain === 'ocean')), [2]);
        assert.deepStrictEqual(Array.from(selectProvinceIds(map, item => item.coastal)), [1]);
    });

    it('never bulk-selects synthetic or zero-color recovery provinces', () => {
        const invalid = [
            province(-1, 'sea', ''),
            { ...province(4, 'sea', 'ocean'), color: 0 },
            province(5, 'sea', 'ocean'),
        ];
        assert.deepStrictEqual(
            Array.from(selectProvinceIds(worldMap(invalid), item => item.type === 'sea')),
            [5]
        );
    });

    it('selects each province touched by river pixels without duplicates', () => {
        const map = worldMap(provinces, [{
            boundingBox: { x: 0, y: 0, w: 3, h: 1 },
            colors: { 0: 0, 1: 3, 2: 5 },
            ends: [0, 2],
        }]);

        assert.deepStrictEqual(Array.from(selectRiverProvinceIds(map)), [1, 2, 3]);
    });

    it('maps local river component offsets back to exact rivers.bmp coordinates', () => {
        const pixels: Array<[number, number, number]> = [];
        forEachRiverPixel({
            boundingBox: { x: 10, y: 20, w: 3, h: 2 },
            colors: { 0: 0, 2: 3, 4: 7 },
            ends: [0, 4],
        }, (x, y, color) => pixels.push([x, y, color]));

        assert.deepStrictEqual(pixels, [
            [10, 20, 0],
            [12, 20, 3],
            [11, 21, 7],
        ]);
    });

    it('undoes and redoes exact river-component selections, not only touched provinces', () => {
        const history = new ProvinceSelectionHistory();
        const rivers = {
            provinceIds: new Set([1, 2, 3]),
            riverIds: new Set([4, 7]),
        };
        history.record(rivers);
        const single = {
            provinceIds: new Set([9]),
            riverIds: new Set<number>(),
        };
        const restored = history.undo(single);
        assert.deepStrictEqual(Array.from(restored?.provinceIds ?? []), [1, 2, 3]);
        assert.deepStrictEqual(Array.from(restored?.riverIds ?? []), [4, 7]);

        restored?.provinceIds.clear();
        restored?.riverIds.clear();
        const reapplied = history.redo(restored ?? single);
        assert.deepStrictEqual(Array.from(reapplied?.provinceIds ?? []), [9]);
        assert.deepStrictEqual(Array.from(reapplied?.riverIds ?? []), []);
    });
});
