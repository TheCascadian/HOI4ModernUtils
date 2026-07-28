import * as assert from 'assert';
import {
    createSequentialIdMap,
    reindexCountryHistoryFile,
    reindexDefinitions,
    reindexMapBuildings,
    reindexStateFile,
    reindexStrategicRegionFile,
    reindexSupplyAreaFile,
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

    it('reindexes strategic regions, supply areas, capitals, and buildings', () => {
        assert.strictEqual(
            reindexStrategicRegionFile('provinces = { 2 7 11 }', provinces).text,
            'provinces = { 1 2 3 }'
        );
        assert.strictEqual(reindexSupplyAreaFile('states = { 3 9 }', states).text, 'states = { 1 2 }');
        assert.strictEqual(reindexCountryHistoryFile('capital = 9', states).text, 'capital = 2');
        assert.strictEqual(reindexMapBuildings('11;arms_factory;1', provinces).text, '3;arms_factory;1');
    });
});
