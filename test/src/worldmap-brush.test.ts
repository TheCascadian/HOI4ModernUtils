import * as assert from 'assert';
import {
    applyBrushStroke,
    getBrushBounds,
    getInterpolatedBrushPositions,
} from '../../webviewsrc/worldmap/brush';

describe('world map paintbrush', () => {
    it('keeps exact square sizes for odd and even brushes', () => {
        assert.deepStrictEqual(getBrushBounds(1), {
            size: 1,
            startOffset: 0,
            endOffset: 0,
        });
        assert.deepStrictEqual(getBrushBounds(4), {
            size: 4,
            startOffset: -1,
            endOffset: 2,
        });
    });

    it('interpolates a continuous stroke across the world-wrap seam', () => {
        assert.deepStrictEqual(
            getInterpolatedBrushPositions({ x: 9, y: 2 }, { x: 1, y: 2 }, 10),
            [{ x: 0, y: 2 }, { x: 1, y: 2 }]
        );
    });

    it('caps a large pointer jump while retaining the final point', () => {
        const positions = getInterpolatedBrushPositions(
            { x: 0, y: 0 },
            { x: 1000, y: 1000 },
            3000
        );
        assert.strictEqual(positions.length, 512);
        assert.deepStrictEqual(positions[positions.length - 1], { x: 1000, y: 1000 });
    });

    it('applies an interpolated event as one exact draft update', () => {
        const result = applyBrushStroke(
            new Map(),
            {
                width: 8,
                height: 4,
                getColorAt: () => 0x111111,
                getProvinceIdAt: () => 7,
                getProvinceTypeAt: () => 'land',
            },
            {
                positions: getInterpolatedBrushPositions(
                    { x: 1, y: 1 },
                    { x: 4, y: 1 },
                    8
                ),
                size: 1,
                color: 0x222222,
                tool: 'brush',
                sourceProvinceType: 'land',
                allowedProvinceIds: new Set([7]),
            }
        );

        assert.strictEqual(result.changed, true);
        assert.deepStrictEqual(Array.from(result.pixels.keys()), ['2,1', '3,1', '4,1']);
    });

    it('does not publish a change for an already-staged overlap', () => {
        const result = applyBrushStroke(
            new Map([['2,1', 0x222222]]),
            {
                width: 8,
                height: 4,
                getColorAt: () => 0x111111,
                getProvinceIdAt: () => 7,
                getProvinceTypeAt: () => 'land',
            },
            {
                positions: [{ x: 2, y: 1 }],
                size: 1,
                color: 0x222222,
                tool: 'brush',
                sourceProvinceType: 'land',
            }
        );

        assert.strictEqual(result.changed, false);
        assert.deepStrictEqual(Array.from(result.pixels), [['2,1', 0x222222]]);
    });
});
