import * as assert from 'assert';
import { Quadtree } from '../../webviewsrc/worldmap/quadtree';
import { WebGL2Renderer } from '../../webviewsrc/worldmap/webgl2renderer';

describe('World map WebGL2 spatial pipeline', () => {
    it('quadtree returns intersecting items without duplicates', () => {
        const tree = new Quadtree<number>({ x: 0, y: 0, w: 100, h: 100 }, 1, 5);
        tree.insert({ bounds: { x: 5, y: 5, w: 10, h: 10 }, value: 1 });
        tree.insert({ bounds: { x: 45, y: 45, w: 20, h: 20 }, value: 2 });
        tree.insert({ bounds: { x: 80, y: 80, w: 10, h: 10 }, value: 3 });

        assert.deepStrictEqual(tree.query({ x: 0, y: 0, w: 20, h: 20 }), [1]);
        assert.deepStrictEqual(tree.query({ x: 40, y: 40, w: 30, h: 30 }), [2]);
        assert.deepStrictEqual(tree.query({ x: 0, y: 0, w: 100, h: 100 }).sort(), [1, 2, 3]);
    });

    it('RDP keeps endpoints and removes points within tolerance', () => {
        const simplified = WebGL2Renderer.simplifyPath([
            { x: 0, y: 0 },
            { x: 1, y: 0.01 },
            { x: 2, y: -0.01 },
            { x: 3, y: 0 },
        ], 0.1);
        assert.deepStrictEqual(simplified, [{ x: 0, y: 0 }, { x: 3, y: 0 }]);
    });

    it('RDP retains a material corner', () => {
        const simplified = WebGL2Renderer.simplifyPath([
            { x: 0, y: 0 },
            { x: 2, y: 3 },
            { x: 4, y: 0 },
        ], 0.5);
        assert.deepStrictEqual(simplified, [
            { x: 0, y: 0 },
            { x: 2, y: 3 },
            { x: 4, y: 0 },
        ]);
    });
});
