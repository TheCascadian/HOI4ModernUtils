import * as assert from 'assert';
import {
    clearMapBuildings,
    clearRailways,
    clearSupplyHubs,
    clearWaterCrossings,
    convertDefinitionsToOcean,
    removeAllCores,
    partitionLandAndWaterProvinces,
    partitionMappedMembership,
    patchStateMembershipPreservingContent,
    patchStatePreservingUnknownContent,
    planProvinceMergesByType,
    replaceStateIdsInSupplyAreas,
    removeProvincesFromRegionBlocks,
    transformSelectedStates,
} from '../../src/previewdef/worldmap/areaoperations';

describe('selected area operations', () => {
    const selected = new Set([2, 3]);

    it('clears railway lines touching the area', () => {
        assert.strictEqual(clearRailways('1 3 1 2 4\n2 2 5 6', selected).text, '2 2 5 6');
    });

    it('clears supply hubs and generated building rows by province', () => {
        assert.strictEqual(clearSupplyHubs('1 2\n3 9', selected).text, '3 9');
        assert.strictEqual(clearMapBuildings('2;arms_factory;1\n9;dockyard;1', selected).text, '9;dockyard;1');
    });

    it('converts definitions to ocean fields', () => {
        const result = convertDefinitionsToOcean('2;1;2;3;land;true;plains;4', selected);
        assert.strictEqual(result.text, '2;1;2;3;sea;false;ocean;0');
    });

    it('changes only selected state blocks and preserves unrelated content', () => {
        const source = [
            'state = { id = 1 manpower = 500 state_category = city history = { buildings = { arms_factory = 2 } } }',
            'state = { id = 2 manpower = 900 state_category = town history = { buildings = { dockyard = 1 } } }',
        ].join('\n');
        const population = transformSelectedStates(source, new Set([2]), 'one-population-per-state');
        assert.ok(population.text.includes('id = 1 manpower = 500'));
        assert.ok(population.text.includes('id = 2 manpower = 1'));
        const buildings = transformSelectedStates(source, new Set([2]), 'clear-buildings');
        assert.ok(buildings.text.includes('arms_factory = 2'));
        assert.ok(!buildings.text.includes('dockyard = 1'));
    });

    it('removes selected province membership while preserving others', () => {
        const result = removeProvincesFromRegionBlocks('provinces = { 1 2 3 4 }', selected);
        assert.strictEqual(result.text, 'provinces = { 1 4 }');
        assert.strictEqual(result.changed, 2);
    });

    it('drops emptied state and strategic-region blocks during ocean rebuilding', () => {
        const state = removeProvincesFromRegionBlocks(
            'state = { id = 2 provinces = { 2 3 } }',
            selected,
            true,
            'state'
        );
        assert.strictEqual(state.text, '');
        const region = removeProvincesFromRegionBlocks(
            'strategic_region = { id = 4 provinces = { 2 3 } }',
            selected,
            true,
            'strategic_region'
        );
        assert.strictEqual(region.text, '');
    });

    it('removes all core history records without changing owners or controllers', () => {
        const source = [
            'history = {',
            '\towner = USA',
            '\tcontroller = CAN',
            '\tadd_core_of = USA',
            '\tremove_core_of = MEX # conditional cleanup',
            '}',
        ].join('\n');
        const result = removeAllCores(source);
        assert.strictEqual(result.changed, 2);
        assert.ok(!result.text.includes('core_of'));
        assert.ok(result.text.includes('owner = USA'));
        assert.ok(result.text.includes('controller = CAN'));

        const inline = removeAllCores('history = { owner = USA add_core_of = USA }');
        assert.strictEqual(inline.changed, 1);
        assert.strictEqual(inline.text, 'history = { owner = USA  }');
    });

    it('removes water crossings in scope while preserving land and impassable rows', () => {
        const source = [
            'From;To;Type;Through;start_x;start_y;stop_x;stop_y;adjacency_rule_name',
            '1;2;sea;9;0;0;1;1;',
            '3;4;canal;-1;0;0;1;1;canal_rule',
            '5;6;land;-1;0;0;1;1;',
            '7;8;impassable;-1;0;0;1;1;',
            '-1;-1;;-1;-1;-1;-1;-1;',
        ].join('\n');
        const scoped = clearWaterCrossings(source, new Set([1]));
        assert.strictEqual(scoped.changed, 1);
        assert.ok(!scoped.text.includes('1;2;sea'));
        assert.ok(scoped.text.includes('3;4;canal'));
        const global = clearWaterCrossings(source);
        assert.strictEqual(global.changed, 2);
        assert.ok(global.text.includes('5;6;land'));
        assert.ok(global.text.includes('7;8;impassable'));
    });

    it('clears selected state resource blocks only', () => {
        const source = [
            'state = { id = 1 resources = { steel = 3 } }',
            'state = { id = 2 resources = { oil = 7 } }',
        ].join('\n');
        const result = transformSelectedStates(source, new Set([2]), 'clear-resources');
        assert.ok(result.text.includes('steel = 3'));
        assert.ok(!result.text.includes('oil = 7'));
    });

    it('keeps destructive strategic-region consolidation split by land and water', () => {
        const result = partitionLandAndWaterProvinces(
            [1, 2, 3, 4],
            { 2: 1, 4: 3 },
            { 1: 'land', 2: 'land', 3: 'sea', 4: 'lake' }
        );
        assert.deepStrictEqual(result.land, [1]);
        assert.deepStrictEqual(result.water, [3]);
    });

    it('never merges lake provinces into sea provinces during consolidation', () => {
        const result = planProvinceMergesByType([
            { id: 9, type: 'lake' },
            { id: 2, type: 'land' },
            { id: 7, type: 'sea' },
            { id: 3, type: 'land' },
            { id: 10, type: 'lake' },
            { id: 8, type: 'sea' },
        ]);
        assert.deepStrictEqual(result.survivorIds, [2, 7, 9]);
        assert.deepStrictEqual(result.replacements, { 3: 2, 8: 7, 10: 9 });
    });

    it('preserves prior out-of-continent edits in boundary records', () => {
        const result = partitionMappedMembership(
            [41, 900, 77, 1200],
            new Set([41, 77]),
            { 77: 41 }
        );
        assert.deepStrictEqual(result.inside, [41]);
        assert.deepStrictEqual(result.outside, [900, 1200]);
    });

    it('moves boundary membership without rewriting unrelated state data', () => {
        const source = [
            'state = {',
            '\tid = 8',
            '\tmanpower = 500',
            '\tprovinces = { 41 900 77 }',
            '\tresources = { steel = 3 }',
            '\thistory = {',
            '\t\towner = USA',
            '\t\tvictory_points = { 41 2 }',
            '\t\tvictory_points = { 900 5 }',
            '\t\t1939.1.1 = { owner = CAN }',
            '\t}',
            '}',
        ].join('\n');
        const result = patchStateMembershipPreservingContent(
            source,
            [900],
            { 900: 5 },
            '\n'
        );
        assert.ok(result.includes('provinces = { 900 }'));
        assert.ok(result.includes('manpower = 500'));
        assert.ok(result.includes('resources = { steel = 3 }'));
        assert.ok(result.includes('owner = USA'));
        assert.ok(result.includes('1939.1.1 = { owner = CAN }'));
        assert.ok(!result.includes('victory_points = { 41 2 }'));
        assert.ok(result.includes('victory_points = { 900 5 }'));
    });

    it('repairs and deduplicates supply-area state IDs after a state merge', () => {
        const result = replaceStateIdsInSupplyAreas(
            [
                'supply_area = { states = { 4 8 9 } }',
                'supply_area = { states = { 8 12 } }',
            ].join('\n'),
            { 8: 4, 9: 4 }
        );
        assert.strictEqual(result.text, [
            'supply_area = { states = { 4 } }',
            'supply_area = { states = { 12 } }',
        ].join('\n'));
        assert.strictEqual(result.changed, 3);
    });

    it('preserves target buildings and dated effects while patching merged state fields', () => {
        const source = [
            'state = {',
            '\tid = 4',
            '\tname = "OLD"',
            '\tmanpower = 10',
            '\tstate_category = rural',
            '\tprovinces = { 4 }',
            '\tresources = { steel = 1 }',
            '\thistory = {',
            '\t\towner = OLD',
            '\t\tadd_core_of = OLD',
            '\t\tbuildings = { infrastructure = 3 arms_factory = 2 }',
            '\t\t1939.1.1 = { add_core_of = LATER }',
            '\t}',
            '}',
        ].join('\n');
        const result = patchStatePreservingUnknownContent(source, {
            name: 'MERGED',
            manpower: 30,
            category: 'city',
            provinces: [4, 8],
            impassable: false,
            owner: 'NEW',
            controller: 'NEW',
            cores: ['NEW'],
            victoryPoints: { 4: 5 },
            resources: { steel: 3, oil: 2 },
        }, '\n');
        assert.ok(result.includes('name = "MERGED"'));
        assert.ok(result.includes('manpower = 30'));
        assert.ok(result.includes('provinces = { 4 8 }'));
        assert.ok(result.includes('buildings = { infrastructure = 3 arms_factory = 2 }'));
        assert.ok(result.includes('1939.1.1 = { add_core_of = LATER }'));
        assert.ok(result.includes('owner = NEW'));
        assert.ok(!result.includes('owner = OLD'));
        assert.ok(result.includes('victory_points = { 4 5 }'));
    });
});
