import * as assert from 'assert';
import {
    createSequentialIdMap,
    reindexCountryHistoryFile,
    reindexDefinitions,
    reindexMapBuildings,
    reindexStateFile,
    reindexStrategicRegionFile,
    reindexSupplyAreaFile,
    reindexUnitStacks,
} from '../../src/previewdef/worldmap/reindex';

describe('destructive map reindexing', () => {
    const provinces = createSequentialIdMap([2, 7, 11]);
    const states = createSequentialIdMap([3, 9]);

    it('creates stable sequential maps', () => {
        assert.deepStrictEqual(provinces, { 2: 1, 7: 2, 11: 3 });
        assert.deepStrictEqual(states, { 3: 1, 9: 2 });
    });

    it('reindexes definitions and state-local province references', () => {
        const definitions = reindexDefinitions(
            '2;1;2;3;land;false;plains;1\n11;4;5;6;sea;false;ocean;1',
            provinces
        );
        assert.ok(definitions.text.startsWith('1;'));
        assert.ok(definitions.text.includes('\n3;'));
        const state = reindexStateFile(
            'state = { id = 9 provinces = { 2 11 } history = { victory_points = { 7 5 } buildings = { 11 = { naval_base = 2 } } } }',
            provinces,
            states
        );
        assert.strictEqual(
            state.text,
            'state = { id = 2 provinces = { 1 3 } history = { victory_points = { 2 5 } buildings = { 3 = { naval_base = 2 } } } }'
        );
    });

    it('drops unknown province-list IDs instead of preserving the CTD reproduction', () => {
        const result = reindexStrategicRegionFile(
            'provinces = { 2 3116 3127 }',
            provinces
        );
        assert.strictEqual(result.text, 'provinces = { 1 }');
        assert.strictEqual(result.changed, 3);
        assert.ok(!result.text.includes('3116'));
        assert.ok(!result.text.includes('3127'));
    });

    it('rewrites every victory-point pair and removes pairs for unknown provinces', () => {
        const result = reindexStateFile(
            'state = { id = 9 provinces = { 2 7 3116 } history = { victory_points = { 2 5 7 10 3127 3 } } }',
            provinces,
            states
        );
        assert.strictEqual(
            result.text,
            'state = { id = 2 provinces = { 1 2 } history = { victory_points = { 1 5 2 10 } } }'
        );
        assert.ok(!result.text.includes('3116'));
        assert.ok(!result.text.includes('3127'));
    });

    it('reindexes strategic regions, supply areas, capitals, and buildings', () => {
        assert.strictEqual(
            reindexStrategicRegionFile('provinces = { 2 7 11 }', provinces).text,
            'provinces = { 1 2 3 }'
        );
        assert.strictEqual(reindexSupplyAreaFile('states = { 3 9 }', states).text, 'states = { 1 2 }');
        assert.strictEqual(reindexCountryHistoryFile('capital = 9', states).text, 'capital = 2');
        assert.strictEqual(reindexMapBuildings('11;arms_factory;1', provinces).text, '3;arms_factory;1');
    });

    it('sanitizes unknown row references and rejects unknown scalar identities', () => {
        assert.strictEqual(
            reindexMapBuildings('2;arms_factory;1\n3116;dockyard;1\n7;radar_station;1', provinces).text,
            '1;arms_factory;1\n2;radar_station;1'
        );
        assert.throws(
            () => reindexCountryHistoryFile('capital = 3116', states),
            /unknown capital state ID 3116/
        );
        assert.throws(
            () => reindexDefinitions('3116;1;2;3;land;false;plains;1', provinces),
            /unknown province definition ID 3116/
        );
    });

    it('reindexes unitstacks column one, preserves payload columns, and drops unknown rows', () => {
        const input = [
            '# province;unknown;x;y;z;angle;scale',
            '2;0;3429.00;9.85;1699.00;0.00;0.30',
            '3116;38;10.00;11.00;12.00;13.00;0.40',
            '',
            '7;4;3367.00;10.40;1807.00;0.00;0.28',
        ].join('\n');
        const result = reindexUnitStacks(input, provinces);
        assert.strictEqual(result.text, [
            '# province;unknown;x;y;z;angle;scale',
            '1;0;3429.00;9.85;1699.00;0.00;0.30',
            '',
            '2;4;3367.00;10.40;1807.00;0.00;0.28',
        ].join('\n'));
        assert.strictEqual(result.changed, 3);
        assert.ok(!result.text.includes('3116'));
    });

    it('fails before output when a unitstacks data row is malformed', () => {
        assert.throws(
            () => reindexUnitStacks('not-a-province;0;1;2;3;4;5', provinces),
            /malformed unitstacks row 1/
        );
    });
});
