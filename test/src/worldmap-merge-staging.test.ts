import * as assert from 'assert';
import { repairStateProvinceBuildings } from '../../src/previewdef/worldmap/provincefixes';
import { dropOverlappingGroups, planStateMergeGroups } from '../../webviewsrc/worldmap/mergeplanning';

describe('repairStateProvinceBuildings', () => {
    const state = [
        'state = {',
        '\thistory = {',
        '\t\tbuildings = {',
        '\t\t\tinfrastructure = 3',
        '\t\t\t12 = {',
        '\t\t\t\tbunker = 2',
        '\t\t\t}',
        '\t\t\t13 = {',
        '\t\t\t\tbunker = 1',
        '\t\t\t}',
        '\t\t\t20 = {',
        '\t\t\t\tnaval_base = 1',
        '\t\t\t}',
        '\t\t}',
        '\t}',
        '}',
        '',
    ].join('\n');

    it('moves a removed province entry to its survivor', () => {
        const result = repairStateProvinceBuildings(state, { 20: 21 });
        assert.strictEqual(result.changed, 1);
        assert.ok(result.text.includes('\t\t\t21 = {\n\t\t\t\tnaval_base = 1'));
        assert.ok(!/\b20 = \{/.test(result.text));
    });

    it('drops the entry when the survivor already has one', () => {
        const result = repairStateProvinceBuildings(state, { 13: 12 });
        assert.strictEqual(result.changed, 1);
        assert.ok(!result.text.includes('bunker = 1'));
        assert.ok(result.text.includes('bunker = 2'));
    });

    it('leaves files without affected entries unchanged', () => {
        const result = repairStateProvinceBuildings(state, { 99: 12 });
        assert.strictEqual(result.changed, 0);
        assert.strictEqual(result.text, state);
    });
});

describe('merge planning', () => {
    const provinces = new Map([
        [1, { id: 1, type: 'land', mass: 10, edges: [{ to: 2 }] }],
        [2, { id: 2, type: 'land', mass: 30, edges: [{ to: 1 }] }],
        [3, { id: 3, type: 'land', mass: 5, edges: [] }],
        [4, { id: 4, type: 'land', mass: 5, edges: [{ to: 5 }] }],
        [5, { id: 5, type: 'land', mass: 5, edges: [{ to: 4 }] }],
        [6, { id: 6, type: 'sea', mass: 5, edges: [{ to: 1 }] }],
    ]);
    const world = {
        getStateById: (id: number) => id === 1 ? { provinces: [1, 2, 3, 4, 5, 6] } : undefined,
        getProvinceById: (id: number) => provinces.get(id),
        getStrategicRegionByProvinceId: (id: number) => ({ id: id === 5 ? 2 : 1 }),
    };

    it('merges connected same-region land clusters into the largest province', () => {
        assert.deepStrictEqual(planStateMergeGroups(world, [1]), [{ targetId: 2, sourceIds: [1] }]);
    });

    it('skips unknown states', () => {
        assert.deepStrictEqual(planStateMergeGroups(world, [9]), []);
    });

    it('drops groups that overlap staged ones', () => {
        const result = dropOverlappingGroups(
            [{ targetId: 2, sourceIds: [1] }],
            [{ targetId: 1, sourceIds: [3] }, { targetId: 4, sourceIds: [5] }]
        );
        assert.strictEqual(result.skipped, 1);
        assert.deepStrictEqual(result.accepted, [{ targetId: 4, sourceIds: [5] }]);
    });
});
