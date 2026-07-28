import * as assert from 'assert';
import {
    formatTooltipWarnings,
    placeTooltip,
} from '../../webviewsrc/worldmap/tooltip';

describe('world map tooltip placement', () => {
    it('places a compact tooltip after the cursor when it fits', () => {
        assert.deepStrictEqual(
            placeTooltip(20, 30, 100, 80, 500, 400),
            { x: 30, y: 40 }
        );
    });

    it('flips a final-sized tooltip away from the lower-right edge', () => {
        assert.deepStrictEqual(
            placeTooltip(480, 380, 150, 120, 500, 400),
            { x: 320, y: 250 }
        );
    });

    it('clamps a tooltip larger than the available canvas', () => {
        assert.deepStrictEqual(
            placeTooltip(10, 10, 600, 500, 500, 400),
            { x: 0, y: 0 }
        );
    });

    it('compacts enormous validation messages without changing full mode', () => {
        const warnings = [
            'State 1082 is too large: 5620x2042',
            `In state 1082, province ${Array.from({ length: 500 }, (_, index) => index + 1).join(', ')}`,
        ];

        assert.strictEqual(
            formatTooltipWarnings(warnings, false),
            warnings.map(warning => `|r|${warning}`).join('\n')
        );

        const compact = formatTooltipWarnings(warnings, true);
        assert.ok(compact.includes('|r|State 1082 is too large: 5620x2042'));
        assert.ok(compact.includes('...'));
        assert.ok(compact.length < 150);
    });

    it('caps the number of warnings shown in compact mode', () => {
        const compact = formatTooltipWarnings(['one', 'two', 'three', 'four', 'five'], true);
        assert.strictEqual(compact, '|r|one\n|r|two\n|r|three\n|r|2 more warnings');
    });
});
