import * as assert from 'assert';
import { nearestPerformanceOverlayCorner } from '../../webviewsrc/worldmap/performancegeometry';

describe('world map performance debug overlay', () => {
    it('snaps to each nearest viewport corner', () => {
        assert.strictEqual(nearestPerformanceOverlayCorner(10, 10, 1000, 800), 'top-left');
        assert.strictEqual(nearestPerformanceOverlayCorner(990, 10, 1000, 800), 'top-right');
        assert.strictEqual(nearestPerformanceOverlayCorner(10, 790, 1000, 800), 'bottom-left');
        assert.strictEqual(nearestPerformanceOverlayCorner(990, 790, 1000, 800), 'bottom-right');
    });
});
