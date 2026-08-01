import * as assert from 'assert';
import { calculateProvinceIdCap } from '../../src/previewdef/worldmap/maplimits';

describe('world map province limits', () => {
    it('derives the maximum province ID from one eighth of total map pixels', () => {
        assert.deepStrictEqual(calculateProvinceIdCap(5632, 2048), {
            width: 5632,
            height: 2048,
            totalPixels: 11534336,
            maxProvinceId: 1441792,
        });
        assert.strictEqual(calculateProvinceIdCap(17, 9).maxProvinceId, 19);
    });

    it('normalizes invalid dimensions without using a fixed fallback cap', () => {
        assert.deepStrictEqual(calculateProvinceIdCap(Number.NaN, -4), {
            width: 0,
            height: 0,
            totalPixels: 0,
            maxProvinceId: 0,
        });
    });
});
