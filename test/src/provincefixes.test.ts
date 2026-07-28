import * as assert from 'assert';
import { repairAdjacencies, repairRailways, repairSupplyNodes, validateProvinceBmpEdit } from '../../src/previewdef/worldmap/provincefixes';

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
