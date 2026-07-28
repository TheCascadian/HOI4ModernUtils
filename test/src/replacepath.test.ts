import * as assert from 'assert';
import {
    addReplacePathsToDescriptor,
    normalizeReplacePath,
} from '../../src/util/replacepath';

describe('mod descriptor replace_path updates', () => {
    it('normalizes folder paths consistently', () => {
        assert.strictEqual(normalizeReplacePath(' /History\\States/ '), 'history/states');
    });

    it('adds only missing paths while preserving descriptor content and EOLs', () => {
        const source = [
            'name = "Example"',
            'replace_path = "history/states"',
            '# replace_path = "history/countries"',
            '',
        ].join('\r\n');

        const result = addReplacePathsToDescriptor(source, [
            'History\\States',
            'map/strategicregions',
            'history/countries',
        ]);

        assert.deepStrictEqual(result.added, [
            'map/strategicregions',
            'history/countries',
        ]);
        assert.ok(result.text.startsWith(source.trimEnd()));
        assert.ok(result.text.includes('\r\nreplace_path = "map/strategicregions"\r\n'));
        assert.ok(result.text.endsWith('replace_path = "history/countries"\r\n'));
    });

    it('is idempotent once all requested paths exist', () => {
        const source = '\uFEFFreplace_path = "history/states"\n';
        const result = addReplacePathsToDescriptor(source, ['history/states']);
        assert.deepStrictEqual(result, { text: source, added: [] });
    });
});
