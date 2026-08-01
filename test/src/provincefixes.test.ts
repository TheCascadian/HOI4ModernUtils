import * as assert from 'assert';
import {
    extractProvinceBmpColors,
    repairAdjacencies,
    repairRailways,
    repairSupplyNodes,
    validateNewProvinceMembership,
    validateProvinceBmpEdit,
} from '../../src/previewdef/worldmap/provincefixes';

function makeBmp(
    rows: number[][],
    bitsPerPixel: 24 | 32,
    topDown: boolean
): Buffer {
    const width = rows[0].length;
    const height = rows.length;
    const bytesPerPixel = bitsPerPixel / 8;
    const rowSize = Math.ceil(width * bytesPerPixel / 4) * 4;
    const dataOffset = 54;
    const result = Buffer.alloc(dataOffset + rowSize * height, 0xee);
    result.write('BM', 0, 'ascii');
    result.writeUInt32LE(result.length, 2);
    result.writeUInt32LE(dataOffset, 10);
    result.writeUInt32LE(40, 14);
    result.writeInt32LE(width, 18);
    result.writeInt32LE(topDown ? -height : height, 22);
    result.writeUInt16LE(1, 26);
    result.writeUInt16LE(bitsPerPixel, 28);
    result.writeUInt32LE(0, 30);
    result.writeUInt32LE(rowSize * height, 34);
    const storedRows = topDown ? rows : [...rows].reverse();
    storedRows.forEach((row, y) => row.forEach((color, x) => {
        const offset = dataOffset + y * rowSize + x * bytesPerPixel;
        result[offset] = color & 0xff;
        result[offset + 1] = color >>> 8 & 0xff;
        result[offset + 2] = color >>> 16 & 0xff;
        if (bitsPerPixel === 32) {
            result[offset + 3] = 0x7f;
        }
    }));
    return result;
}

describe('province reference repairs', () => {
    it('rejects destructive edits targeting a synthetic black province', () => {
        assert.throws(
            () => validateProvinceBmpEdit(
                [{ id: -1, color: 0, terrain: '' }],
                [[10, 20, 0]],
                -1,
                [3]
            ),
            /invalid province ID -1/
        );
    });

    it('accepts pixels only when they match a retained valid target definition', () => {
        const definitions = [
            { id: 1, color: 0x112233, terrain: 'plains' },
            { id: 2, color: 0x445566, terrain: 'ocean' },
        ];
        assert.doesNotThrow(() => validateProvinceBmpEdit(definitions, [[2, 3, 0x112233]], 1, [2]));
        assert.throws(
            () => validateProvinceBmpEdit(definitions, [[2, 3, 0]], 1, [2]),
            /does not use an allowed target province/
        );
    });

    it('accepts an automatically allocated new-province color when it targets the new definition', () => {
        const definitions = [
            { id: 7, color: 0x112233, terrain: 'plains' },
            { id: 8, color: 0x112234, terrain: 'plains' },
        ];

        assert.doesNotThrow(() => validateProvinceBmpEdit(
            definitions,
            [[2, 3, 0x112234]],
            8
        ));
    });

    it('requires new land-province memberships in the same transaction', () => {
        const definitions = [
            { id: 1, color: 0x112233, terrain: 'plains', type: 'land' },
            { id: 2, color: 0x445566, terrain: 'plains', type: 'land' },
        ];
        assert.throws(
            () => validateNewProvinceMembership([1], definitions, [{ provinces: [1, 2] }], []),
            /strategic region in the same transaction/
        );
        assert.throws(
            () => validateNewProvinceMembership([1], definitions, [], [{ provinces: [1, 2] }]),
            /state in the same transaction/
        );
        assert.doesNotThrow(() => validateNewProvinceMembership(
            [1],
            definitions,
            [{ provinces: [1, 2] }],
            [{ provinces: [1, 2] }]
        ));
    });

    it('requires a new sea province only in a strategic region', () => {
        const definitions = [
            { id: 1, color: 0x112233, terrain: 'ocean', type: 'sea' },
            { id: 2, color: 0x445566, terrain: 'ocean', type: 'sea' },
        ];
        assert.doesNotThrow(() => validateNewProvinceMembership(
            [1],
            definitions,
            [],
            [{ provinces: [1, 2] }]
        ));
    });

    it('accepts an atomic edit that paints multiple retained target provinces', () => {
        const definitions = [
            { id: 1, color: 0x112233, terrain: 'ocean' },
            { id: 2, color: 0x445566, terrain: 'ocean' },
        ];
        assert.doesNotThrow(() => validateProvinceBmpEdit(
            definitions,
            [[2, 3, 0x112233], [4, 5, 0x445566]],
            1,
            [],
            [1, 2]
        ));
    });

    it('rejects deleted colors remaining anywhere in the complete final raster', () => {
        const definitions = [{ id: 1, color: 0x112233, terrain: 'plains' }];
        assert.throws(
            () => validateProvinceBmpEdit(
                definitions,
                [[0, 0, 0x112233]],
                1,
                [2],
                [1],
                new Set([0x112233, 0x445566])
            ),
            /color 4478310 without a retained definition/
        );
    });

    it('rejects retained definitions missing from the complete final raster', () => {
        const definitions = [
            { id: 1, color: 0x112233, terrain: 'plains' },
            { id: 2, color: 0x445566, terrain: 'ocean' },
        ];
        assert.throws(
            () => validateProvinceBmpEdit(
                definitions,
                [[0, 0, 0x112233]],
                1,
                [],
                [1],
                new Set([0x112233])
            ),
            /definition color 4478310 has no pixels/
        );
        assert.doesNotThrow(() => validateProvinceBmpEdit(
            definitions,
            [[0, 0, 0x112233]],
            1,
            [],
            [1],
            new Set([0x112233, 0x445566])
        ));
    });

    it('extracts only 24-bit pixel colors across bottom-up rows and padding', () => {
        const bmp = makeBmp([[0x112233], [0x445566]], 24, false);
        assert.deepStrictEqual(
            Array.from(extractProvinceBmpColors(bmp, 1, 2)).sort((a, b) => a - b),
            [0x112233, 0x445566].sort((a, b) => a - b)
        );
        assert.ok(!extractProvinceBmpColors(bmp).has(0xeeeeee));
    });

    it('extracts top-down 32-bit colors while ignoring alpha bytes', () => {
        const bmp = makeBmp([[0x102030, 0xa0b0c0], [0x010203, 0xf0e0d0]], 32, true);
        assert.deepStrictEqual(
            Array.from(extractProvinceBmpColors(bmp, 2, 2)).sort((a, b) => a - b),
            [0x010203, 0x102030, 0xa0b0c0, 0xf0e0d0].sort((a, b) => a - b)
        );
        assert.ok(!extractProvinceBmpColors(bmp).has(0x7f7f7f));
    });

    it('rejects truncated BMP pixel arrays before validation', () => {
        const bmp = makeBmp([[0x112233]], 24, false);
        assert.throws(
            () => extractProvinceBmpColors(bmp.subarray(0, bmp.length - 1)),
            /pixel array is truncated/
        );
    });

    it('rewrites adjacency endpoints and removes collapsed and duplicate rows', () => {
        const input = [
            'From;To;Type;Through;start_x;start_y;stop_x;stop_y;adjacency_rule_name',
            '10;20;sea;-1;1;2;3;4;rule',
            '11;20;sea;-1;1;2;3;4;rule',
            '11;10;canal;-1;1;2;3;4;canal_rule',
            '-1;-1;;-1;-1;-1;-1;-1;',
        ].join('\r\n');
        const result = repairAdjacencies(input, { 11: 10 });

        assert.ok(result.text.includes('10;20;sea'));
        assert.ok(!result.text.includes('11;'));
        assert.ok(!result.text.includes('10;10;canal'));
        assert.ok(result.text.includes('-1;-1;'));
        assert.strictEqual(result.removals, 2);
        assert.ok(result.text.includes('\r\n'));
    });

    it('rewrites railways, collapses consecutive duplicates, and corrects counts', () => {
        const result = repairRailways('1 4 5 6 7 8\n2 2 6 8', { 6: 5 });
        assert.strictEqual(result.text, '1 3 5 7 8\n2 2 5 8');
        assert.strictEqual(result.removals, 1);
    });

    it('drops invalid railway nodes during standalone repair', () => {
        const result = repairRailways('1 4 5 99 6 7', {}, new Set([5, 6, 7]));
        assert.strictEqual(result.text, '1 3 5 6 7');
    });

    it('deduplicates supply nodes on the surviving province and keeps the highest level', () => {
        const result = repairSupplyNodes('1 10\n3 11\n2 12', { 11: 10 });
        assert.strictEqual(result.text, '3 10\n2 12');
        assert.strictEqual(result.removals, 1);
    });

    it('removes invalid adjacency rows during standalone repair', () => {
        const input = [
            'From;To;Type;Through;start_x;start_y;stop_x;stop_y;adjacency_rule_name',
            '1;2;sea;-1;1;2;3;4;rule',
            '1;99;sea;-1;1;2;3;4;rule',
            '-1;-1;;-1;-1;-1;-1;-1;',
        ].join('\n');
        const result = repairAdjacencies(input, {}, new Set([1, 2]));
        assert.ok(result.text.includes('1;2;sea'));
        assert.ok(!result.text.includes('1;99;sea'));
        assert.ok(result.text.includes('-1;-1;'));
    });

    it('does not retarget an invalid old ID that collides with the new ID range', () => {
        const result = repairAdjacencies(
            '1;7;sea;-1;1;2;3;4;rule',
            { 2: 1, 7: 2, 11: 3 },
            new Set([1, 2, 3]),
            new Set([2, 7, 11])
        );
        assert.strictEqual(result.text, '');
        assert.strictEqual(result.removals, 1);
    });
});
