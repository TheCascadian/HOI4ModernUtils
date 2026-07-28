import * as assert from 'assert';
import type { Province } from '../../src/previewdef/worldmap/definitions';

(globalThis as any).acquireVsCodeApi = () => ({
    getState: () => undefined,
    postMessage: () => undefined,
    setState: () => undefined,
});
(globalThis as any).window = {
    __i18ntable: {},
    addEventListener: () => undefined,
};

const { Renderer } = require('../../webviewsrc/worldmap/renderer') as typeof import('../../webviewsrc/worldmap/renderer');
const { calculateWheelZoom } = require('../../webviewsrc/worldmap/viewpoint') as typeof import('../../webviewsrc/worldmap/viewpoint');

type RendererInternals = {
    renderRivers(renderContext: any, worldMap: any, context: CanvasRenderingContext2D, xOffset: number): void;
    renderEdges(
        renderContext: any,
        province: Province,
        worldMap: any,
        context: CanvasRenderingContext2D,
        xOffset: number,
        isRed: boolean,
        preciseEdge?: boolean,
    ): void;
};

const rendererInternals = Renderer as unknown as RendererInternals;

class RecordingContext {
    public canvas = { width: 100, height: 80 };
    public fillStyle = '';
    public lineWidth = 1;
    public fillRects: number[][] = [];
    public moves: number[][] = [];
    public lines: number[][] = [];

    public fillRect(x: number, y: number, width: number, height: number) {
        this.fillRects.push([x, y, width, height]);
    }

    public moveTo(x: number, y: number) {
        this.moves.push([x, y]);
    }

    public lineTo(x: number, y: number) {
        this.lines.push([x, y]);
    }
}

function renderRiverPixel(
    x: number,
    y: number,
    xOffset = 0,
    scale = 10,
    riverDevicePixels?: Set<string>,
) {
    const context = new RecordingContext();
    const renderContext = {
        viewPoint: {
            scale,
            convertX: (mapX: number) => mapX * scale,
            convertY: (mapY: number) => mapY * scale,
            bboxInView: () => true,
        },
        topBar: {
            colorSet$: { value: 'provinceid' },
            warningFilter: { selectedValues$: { value: [] } },
        },
        riverDevicePixels,
    };
    const worldMap = {
        rivers: [{
            colors: { 0: 3 },
            ends: [],
            boundingBox: { x, y, w: 1, h: 1 },
        }],
        getRiverWarnings: () => [],
    };

    rendererInternals.renderRivers(
        renderContext,
        worldMap,
        context as unknown as CanvasRenderingContext2D,
        xOffset,
    );
    return context.fillRects;
}

function province(id: number, centerX: number, pathPoints: { x: number; y: number }[][] = []): Province {
    return {
        id,
        color: id,
        type: 'land',
        coastal: false,
        terrain: 'plains',
        continent: 1,
        boundingBox: { x: centerX - 1, y: 9, w: 2, h: 2 },
        coverZones: [],
        centerOfMass: { x: centerX, y: 10 },
        mass: 4,
        edges: pathPoints.length === 0 ? [] : [{
            to: -1,
            type: '',
            path: pathPoints,
        }],
    };
}

function renderFallbackEdge(from: Province, renderedProvincesById: Record<number, Province>) {
    const context = new RecordingContext();
    const renderContext = {
        provinceToState: {},
        provinceToStrategicRegion: {},
        stateToSupplyArea: {},
        renderedProvincesById,
        topBar: {
            viewMode$: { value: 'province' },
            selectedConditions$: { value: [] },
        },
        viewPoint: {
            scale: 1,
            convertX: (x: number) => x,
            convertY: (y: number) => y,
        },
    };
    const worldMap = { getStateById: () => undefined };

    rendererInternals.renderEdges(
        renderContext,
        from,
        worldMap,
        context as unknown as CanvasRenderingContext2D,
        0,
        true,
        true,
    );
    return context;
}

describe('World-map renderer regressions', () => {
    describe('wheel zoom', () => {
        it('allows continuous zoom between the former clamped levels', () => {
            assert.strictEqual(calculateWheelZoom(1, -100, 0, false), 1.1);
            assert.ok(Math.abs(calculateWheelZoom(1.3, -100, 0, false) - 1.43) < 1e-12);
        });

        it('supports Shift for fine adjustment and retains the zoom bounds', () => {
            assert.strictEqual(calculateWheelZoom(1, -100, 0, true), 1.025);
            assert.strictEqual(calculateWheelZoom(64, -100, 0, false), 64);
            assert.strictEqual(calculateWheelZoom(0.25, 100, 0, false), 0.25);
        });
    });

    describe('live Performance toggle mapping', () => {
        it('maps every sampling toggle into the live render context', () => {
            const normal = Renderer.resolveRenderOptions(false, new Set());
            assert.strictEqual(normal.preciseEdge, true);
            assert.strictEqual(normal.overwriteRenderPrecision, 1);

            const optimized = Renderer.resolveRenderOptions(
                false,
                new Set(['edge-decimation', 'coarse-provinces'] as const)
            );
            assert.strictEqual(optimized.preciseEdge, false);
            assert.strictEqual(optimized.edgeSampleBase, 20);
            assert.strictEqual(optimized.overwriteRenderPrecision, undefined);
            assert.strictEqual(optimized.renderPrecisionBase, 4);
        });

        it('passes fidelity-preserving and pixel-collapse switches through unchanged', () => {
            const selected = new Set(['warning-index', 'river-device-pixel-collapse', 'label-grid-dedupe'] as const);
            const options = Renderer.resolveRenderOptions(false, selected);
            assert.strictEqual(options.optimizations, selected);
        });
    });

    describe('river viewport clipping', () => {
        it('does not draw pixels fully outside any of the four canvas boundaries', () => {
            assert.deepStrictEqual(renderRiverPixel(-1, 2), []);
            assert.deepStrictEqual(renderRiverPixel(10, 2), []);
            assert.deepStrictEqual(renderRiverPixel(2, -1), []);
            assert.deepStrictEqual(renderRiverPixel(2, 8), []);
        });

        it('draws partially visible pixels crossing each canvas boundary', () => {
            assert.deepStrictEqual(renderRiverPixel(-0.5, 2), [[-5, 20, 10, 10]]);
            assert.deepStrictEqual(renderRiverPixel(9.5, 2), [[95, 20, 10, 10]]);
            assert.deepStrictEqual(renderRiverPixel(2, -0.5), [[20, -5, 10, 10]]);
            assert.deepStrictEqual(renderRiverPixel(2, 7.5), [[20, 75, 10, 10]]);
        });

        it('includes top-left boundary pixels and excludes right-bottom boundary pixels', () => {
            assert.deepStrictEqual(renderRiverPixel(0, 0), [[0, 0, 10, 10]]);
            assert.deepStrictEqual(renderRiverPixel(10, 8), []);
        });

        it('applies horizontal world wrapping through xOffset before clipping and drawing', () => {
            assert.deepStrictEqual(renderRiverPixel(-10, 2, 10), [[0, 20, 10, 10]]);
            assert.deepStrictEqual(renderRiverPixel(0, 2, 10), []);
        });

        it('collapses repeated subpixel river coordinates only when the aggressive set is supplied', () => {
            const devicePixels = new Set<string>();
            assert.deepStrictEqual(renderRiverPixel(0, 0, 0, 0.25, devicePixels), [[0, 0, 1, 1]]);
            assert.deepStrictEqual(renderRiverPixel(1, 0, 0, 0.25, devicePixels), []);
            assert.deepStrictEqual(renderRiverPixel(1, 0, 0, 0.25), [[0.25, 0, 0.25, 0.25]]);
        });
    });

    describe('ID-indexed edge neighbor lookup', () => {
        it('produces the same nearest-point coordinates as the previous neighbor lookup', () => {
            const neighbor = province(4, 13, [[{ x: 12, y: 10 }, { x: 14, y: 10 }]]);
            const from = province(5, 9, [[{ x: 8, y: 10 }, { x: 10, y: 10 }]]);
            from.edges.unshift({ to: neighbor.id, type: '', path: [] });

            const context = renderFallbackEdge(from, { [neighbor.id]: neighbor });

            assert.deepStrictEqual(context.moves, [[12, 10]]);
            assert.deepStrictEqual(context.lines, [[10, 10]]);
        });

        it('retains the centered fallback when the neighboring province is missing', () => {
            const from = province(5, 9);
            from.edges.push({ to: 4, type: '', path: [] });

            const context = renderFallbackEdge(from, {});

            assert.deepStrictEqual(context.moves, [[9, 10]]);
            assert.deepStrictEqual(context.lines, [[9, 10]]);
        });
    });
});
