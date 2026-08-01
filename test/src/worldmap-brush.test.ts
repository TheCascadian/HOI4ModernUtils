import * as assert from 'assert';
import {
    adjustBrushSizeForWheel,
    applyLassoAssignment,
    applyBrushStroke,
    getBrushBounds,
    getInterpolatedBrushPositions,
    snapLassoPoints,
} from '../../webviewsrc/worldmap/brush';

describe('world map paintbrush', () => {
    it('adjusts wheel brush sizes one step and clamps to the supported range', () => {
        assert.strictEqual(adjustBrushSizeForWheel(4, -100), 5);
        assert.strictEqual(adjustBrushSizeForWheel(4, 100), 3);
        assert.strictEqual(adjustBrushSizeForWheel(511, -100), 512);
        assert.strictEqual(adjustBrushSizeForWheel(512, -100), 512);
        assert.strictEqual(adjustBrushSizeForWheel(1, 100), 1);
        assert.strictEqual(adjustBrushSizeForWheel(4, 0), 4);
    });

    it('snaps a nearly straight lasso edge to exact endpoints within its radius', () => {
        assert.deepStrictEqual(
            snapLassoPoints([
                { x: 0, y: 10 },
                { x: 3, y: 11 },
                { x: 6, y: 9 },
                { x: 10, y: 10 },
            ], 1),
            [{ x: 0, y: 10 }, { x: 10, y: 10 }]
        );
    });

    it('preserves a lasso corner outside its snapping radius', () => {
        assert.deepStrictEqual(
            snapLassoPoints([
                { x: 0, y: 0 },
                { x: 5, y: 0 },
                { x: 5, y: 5 },
            ], 1),
            [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }]
        );
    });

    it('assigns only same-type pixels inside a lasso', () => {
        const result = applyLassoAssignment(
            new Map(),
            {
                width: 4,
                height: 3,
                getColorAt: (x) => x === 0 ? 0x222222 : 0x111111,
                getProvinceIdAt: () => 7,
                getProvinceTypeAt: (x) => x === 3 ? 'sea' : 'land',
            },
            {
                points: [
                    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
                    { x: 3, y: 3 }, { x: 2, y: 3 }, { x: 1, y: 3 }, { x: 0, y: 3 },
                ],
                color: 0x222222,
                sourceProvinceType: 'land',
                inverted: false,
            }
        );

        assert.deepStrictEqual(Array.from(result.pixels.keys()), [
            '1,0', '2,0', '1,1', '2,1', '1,2', '2,2',
        ]);
    });

    it('supports inverted lasso assignment', () => {
        const result = applyLassoAssignment(
            new Map(),
            {
                width: 4,
                height: 2,
                getColorAt: () => 0x111111,
                getProvinceIdAt: () => 7,
                getProvinceTypeAt: () => 'sea',
            },
            {
                points: [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }],
                color: 0x222222,
                sourceProvinceType: 'sea',
                inverted: true,
            }
        );

        assert.deepStrictEqual(Array.from(result.pixels.keys()), ['2,0', '3,0', '2,1', '3,1']);
    });

    it('uses the short polygon path across the horizontal world seam', () => {
        const result = applyLassoAssignment(
            new Map(),
            {
                width: 10,
                height: 2,
                getColorAt: () => 0x111111,
                getProvinceIdAt: () => 7,
                getProvinceTypeAt: () => 'land',
            },
            {
                points: [{ x: 9, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 2 }, { x: 9, y: 2 }],
                color: 0x222222,
                sourceProvinceType: 'land',
                inverted: false,
            }
        );

        assert.deepStrictEqual(Array.from(result.pixels.keys()), ['0,0', '9,0', '0,1', '9,1']);
    });

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
