import * as assert from 'assert';
import { performance } from 'perf_hooks';
import { concatEdges } from '../../src/previewdef/worldmap/loader/edgeutils';
import type { Point, Province, WorldMapData } from '../../src/previewdef/worldmap/definitions';
import type { FEWorldMapClass as FEWorldMapClassType } from '../../webviewsrc/worldmap/loader';
import { parseHoi4File } from '../../src/hoiformat/hoiparser';

(global as any).window = {
    __i18ntable: {},
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
};
(global as any).acquireVsCodeApi = () => ({
    getState: () => undefined,
    setState: () => undefined,
    postMessage: () => undefined,
});
const { applyBrushStroke } = require('../../webviewsrc/worldmap/brush') as typeof import('../../webviewsrc/worldmap/brush');
const { FEWorldMapClass } = require('../../webviewsrc/worldmap/loader') as typeof import('../../webviewsrc/worldmap/loader');

function province(id: number): Province {
    return {
        id,
        color: id,
        type: 'land',
        coastal: false,
        terrain: 'plains',
        continent: 1,
        boundingBox: { x: id - 1, y: 0, w: 1, h: 1 },
        centerOfMass: { x: id - 0.5, y: 0.5 },
        mass: 1,
        coverZones: [{ x: id - 1, y: 0, w: 1, h: 1 }],
        edges: [],
    };
}

function syntheticMap(count: number): FEWorldMapClassType {
    const provinces = new Array<Province | undefined>(count + 1);
    const colors = new Uint32Array(count);
    for (let id = 1; id <= count; id++) {
        provinces[id] = province(id);
        colors[id - 1] = id;
    }
    const data: WorldMapData & {
        provincesCount: number;
        statesCount: number;
        countriesCount: number;
        railwaysCount: number;
        supplyNodesCount: number;
    } = {
        width: count,
        height: 1,
        colorByPosition: colors,
        provinces,
        states: [],
        countries: [],
        strategicRegions: [],
        supplyAreas: [],
        railways: [],
        supplyNodes: [],
        provincesCount: count + 1,
        statesCount: 0,
        countriesCount: 0,
        strategicRegionsCount: 0,
        supplyAreasCount: 0,
        railwaysCount: 0,
        supplyNodesCount: 0,
        badProvincesCount: 0,
        badStatesCount: 0,
        badStrategicRegionsCount: 0,
        badSupplyAreasCount: 0,
        continents: ['', 'europe'],
        terrains: [],
        resources: [],
        rivers: [],
        conditionExprs: [],
        bookmarks: [],
        diplomacyRelations: [],
        countryHistoryFiles: {},
        warnings: [],
    };
    return new FEWorldMapClass(data);
}

function median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
}

function time(action: () => void, samples = 5): number {
    const values: number[] = [];
    for (let i = 0; i < samples; i++) {
        const start = performance.now();
        action();
        values.push(performance.now() - start);
    }
    return median(values);
}

function legacyPositionLookup(map: FEWorldMapClassType, x: number, y: number): Province | undefined {
    let found: Province | undefined;
    map.forEachProvince(candidate => {
        if (candidate.boundingBox.x <= x && x < candidate.boundingBox.x + candidate.boundingBox.w &&
            candidate.boundingBox.y <= y && y < candidate.boundingBox.y + candidate.boundingBox.h &&
            candidate.coverZones.some(zone =>
                zone.x <= x && x < zone.x + zone.w && zone.y <= y && y < zone.y + zone.h)) {
            found = candidate;
            return true;
        }
    });
    return found;
}

function legacyBrushDab(pixels: ReadonlyMap<string, number>, x: number): Map<string, number> {
    const result = new Map(pixels);
    result.set(`${x},0`, 2);
    return result;
}

function legacyConcatEdges(edges: [Point, Point][]): Point[][] {
    const input = edges.map(([a, b]) => [{ ...a }, { ...b }] as [Point, Point]);
    const result: Point[][] = [];
    const accessed = new Array<boolean>(input.length).fill(false);
    const equal = (a: Point, b: Point) => a.x === b.x && a.y === b.y;
    for (let i = 0; i < input.length; i++) {
        if (accessed[i]) {
            continue;
        }
        const edge: Point[] = input[i];
        accessed[i] = true;
        let found = true;
        while (found) {
            found = false;
            const before = input.findIndex((candidate, index) => !accessed[index] && equal(edge[0], candidate[1]));
            if (before !== -1) {
                accessed[before] = found = true;
                edge.unshift(input[before][0]);
            }
            const after = input.findIndex((candidate, index) => !accessed[index] && equal(edge[edge.length - 1], candidate[0]));
            if (after !== -1) {
                accessed[after] = found = true;
                edge.push(input[after][1]);
            }
        }
        const simplified: Point[] = [];
        let last = edge[0];
        for (const point of edge) {
            if (simplified.length < 2) {
                simplified.push(point);
            } else if (point.x === last.x || point.y === last.y) {
                simplified[simplified.length - 1] = point;
            } else {
                last = simplified[simplified.length - 1];
                simplified.push(point);
            }
        }
        result.push(simplified);
    }
    return result;
}

describe('performance hotspot measurements', function() {
    this.timeout(30_000);

    it('keeps indexed hover lookup flat as total province count grows', () => {
        const rows = [1_000, 10_000, 50_000].map(count => {
            const map = syntheticMap(count);
            const x = count - 1;
            const beforeMs = time(() => {
                for (let i = 0; i < 100; i++) {
                    legacyPositionLookup(map, x, 0);
                }
            }, 3);
            const afterMs = time(() => {
                for (let i = 0; i < 100; i++) {
                    map.getProvinceByPosition(x, 0);
                }
            });
            assert.strictEqual(map.getProvinceByPosition(x, 0)?.id, count);
            return { count, beforeMs, afterMs };
        });
        console.log('hover lookup benchmark', rows);
        assert.ok(rows[2].beforeMs > rows[0].beforeMs * 8);
        assert.ok(rows[2].afterMs < rows[2].beforeMs / 20);
    });

    it('keeps brush dab cost independent of accumulated draft size', () => {
        const lengths = [100, 1_000, 10_000];
        const rows = lengths.map(length => {
            const beforeMs = time(() => {
                let pixels = new Map<string, number>();
                for (let x = 0; x < length; x++) {
                    pixels = legacyBrushDab(pixels, x);
                }
            }, length === 10_000 ? 1 : 3);
            const afterMs = time(() => {
                const pixels = new Map<string, number>();
                for (let x = 0; x < length; x++) {
                    applyBrushStroke(pixels, {
                        width: length,
                        height: 1,
                        getColorAt: () => 1,
                        getProvinceIdAt: () => 1,
                        getProvinceTypeAt: () => 'land',
                    }, {
                        positions: [{ x, y: 0 }],
                        size: 1,
                        color: 2,
                        tool: 'brush',
                        sourceProvinceType: 'land',
                    });
                }
                assert.strictEqual(pixels.size, length);
            }, 3);
            return { length, beforeMs, afterMs };
        });
        console.log('brush accumulation benchmark', rows);
        assert.ok(rows[2].beforeMs > rows[1].beforeMs * 10);
        assert.ok(rows[2].afterMs < rows[2].beforeMs / 10);
    });

    it('preserves stitched edge output while changing the curve to near-linear', () => {
        const rows = [100, 1_000, 10_000].map(count => {
            const edges = Array.from({ length: count }, (_, index) => [
                { x: index, y: 0 },
                { x: index + 1, y: 0 },
            ] as [Point, Point]).reverse();
            const expected = legacyConcatEdges(edges);
            assert.deepStrictEqual(concatEdges(edges), expected);
            return {
                count,
                beforeMs: time(() => legacyConcatEdges(edges), count === 10_000 ? 1 : 3),
                afterMs: time(() => concatEdges(edges), 3),
            };
        });
        console.log('edge stitching benchmark', rows);
        assert.ok(rows[2].afterMs < rows[2].beforeMs / 3);
    });

    it('uses linear Set dedupe semantics for large directory listings', () => {
        const values = Array.from({ length: 20_000 }, (_, index) => `file-${index % 10_000}`);
        const beforeMs = time(() => values.filter((value, index, array) => index === array.indexOf(value)), 1);
        const afterMs = time(() => Array.from(new Set(values)));
        assert.deepStrictEqual(
            Array.from(new Set(values)),
            values.filter((value, index, array) => index === array.indexOf(value))
        );
        console.log('directory dedupe benchmark', { count: values.length, beforeMs, afterMs });
        assert.ok(afterMs < beforeMs / 10);
    });

    it('removes repeated parser regex construction and success-path line indexing', () => {
        const input = Array.from({ length: 2_000 }, (_, index) =>
            `state_${index} = { id = ${index} owner = TAG # comment\n}`
        ).join('\n');
        const buildLegacyOverhead = () => {
            const entries: Array<[string, [string, number]]> = [
                ['comment', ['#.*(?:[\\r\\n]|$)', 0]],
                ['symbol', ['[-\\w@\\[\\]\\u00A0-\\u024F\\.+][\\w:\\._@\\[\\]\\-\\?\\^\\/\\u00A0-\\u024F|%+]*', 40]],
                ['operator', ['[={}<>;,]|>=|<=|!=', 10]],
                ['string', ['"(?:\\\\"|\\\\\\\\|[^"])*"', 10]],
                ['eof', ['$', 1000]],
            ];
            entries.sort((a, b) => a[1][1] - b[1][1]);
            void new RegExp(
                '\\s*(?<result>' + entries.map(([name, [source]]) => `(?<${name}>${source})`).join('|') + ')',
                'y'
            );
            let sum = 0;
            void input.split('\n').map(value => value.length).map(value => sum = sum + value + 1);
        };
        const cachedRegex = /\s*(?<result>(?<comment>#.*(?:[\r\n]|$))|(?<operator>[={}<>;,]|>=|<=|!=)|(?<string>"(?:\\"|\\\\|[^"])*")|(?<symbol>[-\w]+)|(?<eof>$))/y;
        const removedOverheadMs = time(buildLegacyOverhead, 9);
        const cachedOverheadMs = time(() => {
            cachedRegex.lastIndex = 0;
        }, 9);
        const parseMs = time(() => parseHoi4File(input), 5);
        console.log('parser repeated-call benchmark', {
            lines: 4_000,
            removedRegexAndLineIndexMs: removedOverheadMs,
            cachedSetupMs: cachedOverheadMs,
            currentParseMs: parseMs,
        });
        assert.ok(cachedOverheadMs < removedOverheadMs / 20);
    });

    it('bounds Canvas2D province candidate work by visible provinces', () => {
        const iterations = 25;
        const rows = [1_000, 10_000, 50_000].map(count => {
            const map = syntheticMap(count);
            const area = { x: count - 10, y: 0, w: 10, h: 1 };
            let beforeHits = 0;
            const beforeMs = time(() => {
                for (let iteration = 0; iteration < iterations; iteration++) {
                    map.forEachProvince(candidate => {
                        if (candidate.boundingBox.x < area.x + area.w &&
                            candidate.boundingBox.x + candidate.boundingBox.w > area.x) {
                            beforeHits++;
                        }
                    });
                }
            }) / iterations;
            const afterMs = time(() => {
                for (let iteration = 0; iteration < iterations; iteration++) {
                    assert.strictEqual(map.getProvincesInArea(area).length, 10);
                }
            }) / iterations;
            assert.ok(beforeHits > 0);
            return { count, visible: 10, beforeMs, afterMs };
        });
        console.log('Canvas2D visible candidate benchmark', rows);
        assert.ok(rows[2].beforeMs > rows[0].beforeMs * 8);
        assert.ok(rows[2].afterMs < rows[2].beforeMs / 2);
    });

    it('uses a compact structured-cloneable typed paint payload', () => {
        const count = 1_000_000;
        const boxed = Array.from({ length: count }, (_, index) => index & 0xffffff);
        const typed = Uint32Array.from(boxed);
        const jsonMs = time(() => JSON.parse(JSON.stringify(boxed)), 3);
        const cloneMs = time(() => structuredClone(typed), 5);
        assert.strictEqual(typed.byteLength, count * 4);
        assert.ok(structuredClone(typed) instanceof Uint32Array);
        console.log('paint payload benchmark', {
            pixels: count,
            boxedJsonMs: jsonMs,
            typedStructuredCloneMs: cloneMs,
            typedBytes: typed.byteLength,
        });
        assert.ok(cloneMs < jsonMs / 5);
    });
});
