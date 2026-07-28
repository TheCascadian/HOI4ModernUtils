import * as assert from 'assert';
import { hashRgbaBytes } from '../../webviewsrc/worldmap/pixelhash';

describe('world map pixel fidelity hash', () => {
    it('detects changes in every RGBA channel', () => {
        const base = new Uint8ClampedArray([10, 20, 30, 40, 50, 60, 70, 80]);
        for (let channel = 0; channel < 4; channel++) {
            const changed = new Uint8ClampedArray(base);
            changed[channel]++;
            assert.notStrictEqual(hashRgbaBytes(base), hashRgbaBytes(changed));
        }
    });

    it('detects spatial changes outside the former sampled red bytes', () => {
        const base = new Uint8ClampedArray(640 * 360 * 4);
        const changed = new Uint8ClampedArray(base);
        changed[(639 + 359 * 640) * 4 + 1] = 255;
        assert.notStrictEqual(hashRgbaBytes(base), hashRgbaBytes(changed));
    });
});
