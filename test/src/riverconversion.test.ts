import * as assert from 'assert';
import { Province, River } from '../../src/previewdef/worldmap/definitions';
import { buildClippedRiverOceanEdit } from '../../src/previewdef/worldmap/riverconversion';

function province(id: number, color: number, type: string): Province {
    return {
        id,
        color,
        type,
        coastal: false,
        terrain: type === 'land' ? 'plains' : 'ocean',
        continent: type === 'land' ? 1 : 0,
        boundingBox: { x: 0, y: 0, w: 4, h: 2 },
        centerOfMass: { x: 1, y: 0 },
        coverZones: [],
        edges: [],
        mass: 4,
    };
}

describe('clipped river to ocean conversion', () => {
    const land = province(1, 0x010101, 'land');
    const otherLand = province(2, 0x020202, 'land');
    const sea = province(3, 0x030303, 'sea');
    const river: River = {
        boundingBox: { x: 0, y: 0, w: 4, h: 1 },
        colors: { 0: 0, 1: 3, 2: 6, 3: 10 },
        ends: [0, 3],
    };

    it('extracts only exact river pixels over land and preserves donor definitions', () => {
        const result = buildClippedRiverOceanEdit(
            4,
            2,
            [
                land.color, land.color, otherLand.color, sea.color,
                land.color, land.color, otherLand.color, sea.color,
            ],
            [undefined, land, otherLand, sea],
            [river],
            new Set([0]),
            { 1: 10, 2: 20 }
        );

        assert.deepStrictEqual(
            result.paintedPixels.map(pixel => pixel.slice(0, 2)),
            [[0, 0], [1, 0], [2, 0]]
        );
        assert.strictEqual(result.skippedWaterPixels, 1);
        assert.deepStrictEqual(result.provinces.map(item => item.strategicRegionId), [10, 20]);
        assert.deepStrictEqual(result.provinces.map(item => item.sourceProvinceIds), [[1], [2]]);
        assert.ok(result.provinces.every(item =>
            item.type === 'sea' && item.terrain === 'ocean' && item.continent === 0
        ));
        assert.deepStrictEqual(
            [land.type, land.terrain, otherLand.type, otherLand.terrain],
            ['land', 'plains', 'land', 'plains']
        );
    });

    it('rejects incomplete base-map pixel data instead of guessing', () => {
        assert.throws(
            () => buildClippedRiverOceanEdit(
                4,
                2,
                [land.color],
                [undefined, land],
                [river],
                new Set([0])
            ),
            /complete province pixel map/
        );
    });

    it('rejects a clip that would leave a donor province with no pixels', () => {
        const singlePixelLand = {
            ...province(4, 0x040404, 'land'),
            mass: 1,
        };
        const singlePixelRiver: River = {
            boundingBox: { x: 0, y: 0, w: 1, h: 1 },
            colors: { 0: 0 },
            ends: [0],
        };

        assert.throws(
            () => buildClippedRiverOceanEdit(
                1,
                1,
                [singlePixelLand.color],
                [undefined, singlePixelLand],
                [singlePixelRiver],
                new Set([0]),
                { 4: 10 }
            ),
            /remove every pixel from donor province/
        );
    });
});
