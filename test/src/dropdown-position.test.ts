import * as assert from 'assert';
import { calculateDropdownMenuPlacement } from '../../webviewsrc/util/dropdownposition';

describe('dropdown menu placement', () => {
    it('tracks the anchor below after a horizontal resize', () => {
        assert.deepStrictEqual(
            calculateDropdownMenuPlacement(
                { left: 120, top: 20, bottom: 46, width: 180 },
                120,
                640,
                480,
            ),
            { left: 120, top: 46, width: 180 }
        );
        assert.deepStrictEqual(
            calculateDropdownMenuPlacement(
                { left: 24, top: 70, bottom: 96, width: 260 },
                120,
                360,
                480,
            ),
            { left: 24, top: 96, width: 260 }
        );
    });

    it('clamps horizontally and flips above when the lower edge is crowded', () => {
        assert.deepStrictEqual(
            calculateDropdownMenuPlacement(
                { left: 330, top: 300, bottom: 326, width: 120 },
                160,
                400,
                360,
            ),
            { left: 276, top: 140, width: 120 }
        );
    });
});
