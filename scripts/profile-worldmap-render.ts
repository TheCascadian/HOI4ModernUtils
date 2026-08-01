import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { performance } from 'perf_hooks';
import { Renderer } from '../webviewsrc/worldmap/renderer';

type Subject<T> = { value: T };
type Pair = { viewMode: string; colorSet: string };

const relevantDisplayFlags = [
    'edge', 'label', 'supply', 'river', 'stateboundary',
    'oceanstateboundary', 'fastrending', 'adaptzooming',
];
const samples = 1;
const warmups = 0;
const fixtureColumns = 144;
const fixtureRows = 20;
const cellSize = 8;

(globalThis as any).window = {
    __stateBoundaryColor: 'rgba(0, 0, 0, 0.4)',
    __stateBoundaryWidth: 1.5,
};

class CountingContext {
    public operations = 0;
    public fillStyle: any;
    public strokeStyle: any;
    public font = '';
    public textAlign: any;
    public textBaseline: any;
    public lineWidth = 1;
    public canvas = { width: 1280, height: 720 };
    fillRect() { this.operations++; }
    beginPath() { this.operations++; }
    moveTo() { this.operations++; }
    lineTo() { this.operations++; }
    stroke() { this.operations++; }
    fillText() { this.operations++; }
    drawImage() { this.operations++; }
    measureText(text: string) { return { width: text.length * 6 }; }
}

function subject<T>(value: T): Subject<T> {
    return { value };
}

function createFixture() {
    const provinces: any[] = new Array(fixtureColumns * fixtureRows);
    const states: any[] = [];
    const strategicRegions: any[] = [];
    const supplyAreas: any[] = [];
    const provinceToState: Record<number, number> = {};
    const provinceToStrategicRegion: Record<number, number> = {};
    const stateToSupplyArea: Record<number, number> = {};

    for (let y = 0; y < fixtureRows; y++) {
        for (let x = 0; x < fixtureColumns; x++) {
            const id = y * fixtureColumns + x;
            const stateId = Math.floor(id / 12);
            const strategicRegionId = Math.floor(id / 48);
            provinceToState[id] = stateId;
            provinceToStrategicRegion[id] = strategicRegionId;
            const edges: any[] = [];
            const neighbours = [[x - 1, y], [x, y - 1]];
            for (const [nx, ny] of neighbours) {
                if (nx < 0 || ny < 0) continue;
                const to = ny * fixtureColumns + nx;
                const vertical = nx !== x;
                const points = Array.from({ length: cellSize + 1 }, (_, i) => ({
                    x: vertical ? x * cellSize : x * cellSize + i,
                    y: vertical ? y * cellSize + i : y * cellSize,
                }));
                edges.push({ to, type: '', path: [points], start: points[0], stop: points[points.length - 1] });
            }
            provinces[id] = {
                id, color: (id * 2654435761) & 0xffffff,
                type: y < 2 ? 'sea' : 'land', coastal: y === 2,
                terrain: y < 2 ? 'ocean' : 'plains', continent: 1,
                boundingBox: { x: x * cellSize, y: y * cellSize, w: cellSize, h: cellSize },
                coverZones: [{ x: x * cellSize, y: y * cellSize, w: cellSize, h: cellSize }],
                centerOfMass: { x: x * cellSize + cellSize / 2, y: y * cellSize + cellSize / 2 },
                edges,
            };
        }
    }

    const stateCount = Math.ceil(provinces.length / 12);
    for (let id = 0; id < stateCount; id++) {
        const provinceIds = provinces.slice(id * 12, id * 12 + 12).map(p => p.id);
        states[id] = {
            id, name: `STATE_${id}`, localisedName: `State ${id}`,
            manpower: 1000 + id, category: 'rural', categoryColor: 0x669966,
            owner: [], controller: [], provinces: provinceIds, cores: [],
            impassable: false, victoryPoints: {}, resources: {},
            boundingBox: provinces[provinceIds[0]].boundingBox,
            centerOfMass: provinces[provinceIds[Math.floor(provinceIds.length / 2)]].centerOfMass,
            file: '',
        };
        stateToSupplyArea[id] = Math.floor(id / 4);
    }
    for (let id = 0; id < Math.ceil(provinces.length / 48); id++) {
        const provinceIds = provinces.slice(id * 48, id * 48 + 48).map(p => p.id);
        strategicRegions[id] = {
            id, name: `REGION_${id}`, localisedName: `Region ${id}`, provinces: provinceIds,
            navalTerrain: null, boundingBox: provinces[provinceIds[0]].boundingBox,
            centerOfMass: provinces[provinceIds[Math.floor(provinceIds.length / 2)]].centerOfMass,
            file: '',
        };
    }
    for (let id = 0; id < Math.ceil(states.length / 4); id++) {
        const stateIds = states.slice(id * 4, id * 4 + 4).map(s => s.id);
        supplyAreas[id] = {
            id, name: `SUPPLY_${id}`, localisedName: `Supply ${id}`, value: id + 1,
            states: stateIds, provinces: stateIds.flatMap(sid => states[sid].provinces),
            boundingBox: states[stateIds[0]].boundingBox,
            centerOfMass: states[stateIds[Math.floor(stateIds.length / 2)]].centerOfMass,
            file: '',
        };
    }

    const supplyNodes = provinces.filter((_, i) => i % 96 === 0).map(p => ({ province: p.id, level: 1 }));
    const railways = Array.from({ length: fixtureRows }, (_, y) => ({
        level: 2,
        provinces: Array.from({ length: fixtureColumns }, (_, x) => y * fixtureColumns + x),
    }));
    const rivers = Array.from({ length: fixtureRows }, (_, y) => ({
        colors: Object.fromEntries(Array.from({ length: fixtureColumns * cellSize }, (_, x) => [x, 3])),
        ends: [],
        boundingBox: { x: 0, y: y * cellSize, w: fixtureColumns * cellSize, h: 1 },
    }));

    const map: any = {
        width: fixtureColumns * cellSize, height: fixtureRows * cellSize,
        provincesCount: provinces.length, statesCount: states.length,
        strategicRegionsCount: strategicRegions.length, supplyAreasCount: supplyAreas.length,
        countries: [], terrains: [
            { name: 'plains', color: 0x88aa66, isNaval: false, file: '' },
            { name: 'ocean', color: 0x335588, isNaval: true, file: '' },
        ], resources: [], rivers,
        getProvinceToStateMap: () => provinceToState,
        getProvinceToStrategicRegionMap: () => provinceToStrategicRegion,
        getStateToSupplyAreaMap: () => stateToSupplyArea,
        forEachProvince: (fn: any) => provinces.forEach(fn),
        getProvincesInArea: (area: any) => provinces.filter(province =>
            province.boundingBox.x < area.x + area.w &&
            province.boundingBox.x + province.boundingBox.w > area.x &&
            province.boundingBox.y < area.y + area.h &&
            province.boundingBox.y + province.boundingBox.h > area.y
        ),
        forEachState: (fn: any) => states.forEach(fn),
        forEachSupplyArea: (fn: any) => supplyAreas.forEach(fn),
        forEachRailway: (fn: any) => railways.forEach(fn),
        forEachSupplyNode: (fn: any) => supplyNodes.forEach(fn),
        getProvinceById: (id: number | undefined) => id === undefined ? undefined : provinces[id],
        getStateById: (id: number | undefined) => id === undefined ? undefined : states[id],
        getStrategicRegionById: (id: number | undefined) => id === undefined ? undefined : strategicRegions[id],
        getSupplyAreaById: (id: number | undefined) => id === undefined ? undefined : supplyAreas[id],
        getSupplyNodeByProvinceId: (id: number) => supplyNodes.find(n => n.province === id),
        getProvinceByPosition: (x: number, y: number) => provinces[Math.floor(y / cellSize) * fixtureColumns + Math.floor(x / cellSize)],
        getProvinceWarnings: () => [],
        getRiverWarnings: () => [],
    };
    return map;
}

function parsePairs(): Pair[] {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'src/previewdef/worldmap/worldmapview.html'), 'utf8');
    const viewModes = [...html.matchAll(/<option value="([^"]+)"(?: enablesupplyarea="true")?>%worldmap\.topbar\.viewmode/g)].map(m => m[1]);
    const colorOptions = [...html.matchAll(/<option(?: viewmode="([^"]+)")? value="([^"]+)"(?: enablesupplyarea="true")?>%worldmap\.topbar\.colorset/g)]
        .map(m => ({ modes: m[1]?.split(/\s+/), colorSet: m[2] }));
    return viewModes.flatMap(viewMode => colorOptions
        .filter(option => option.modes ? option.modes.includes(viewMode) : option.colorSet === 'warnings' && viewMode === 'warnings')
        .map(option => ({ viewMode, colorSet: option.colorSet })));
}

function combinations(flags: string[]): string[][] {
    return Array.from({ length: 1 << flags.length }, (_, mask) =>
        flags.filter((_, bit) => (mask & (1 << bit)) !== 0));
}

function median(values: number[]) {
    const ordered = [...values].sort((a, b) => a - b);
    return ordered[Math.floor(ordered.length / 2)];
}

function main() {
    const outputIndex = process.argv.indexOf('--output');
    const outputPath = outputIndex >= 0 ? process.argv[outputIndex + 1] : 'profiles/worldmap-render-profile.json';
    const workerIndex = process.argv.indexOf('--worker');
    const pairs = parsePairs();
    if (workerIndex < 0) {
        const results = pairs.flatMap((_, index) => {
            const worker = spawnSync(process.execPath, ['--expose-gc', __filename, '--worker', index.toString()], {
                encoding: 'utf8',
                maxBuffer: 32 * 1024 * 1024,
            });
            if (worker.status !== 0) {
                throw new Error(`Profile worker ${index} failed: ${worker.stderr}`);
            }
            return JSON.parse(worker.stdout);
        });
        const ranked = [...results].sort((a, b) => b.durationMsMedian - a.durationMsMedian);
        const report = {
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            fixture: { provinces: fixtureColumns * fixtureRows, width: fixtureColumns * cellSize, height: fixtureRows * cellSize, canvas: [1280, 720], scale: 3 },
            matrix: { validModeColorPairs: pairs.length, displayFlags: relevantDisplayFlags, combinationsPerPair: 1 << relevantDisplayFlags.length, totalCases: results.length, samples, warmups },
            summary: {
                medianDurationMs: median(results.map(r => r.durationMsMedian)),
                maxDurationMs: ranked[0]?.durationMsMedian ?? 0,
                slowestCases: ranked.slice(0, 25),
            },
            results,
        };
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
        process.stdout.write(JSON.stringify({ outputPath, ...report.matrix, summary: report.summary }, null, 2));
        return;
    }

    const pairIndex = Number(process.argv[workerIndex + 1]);
    const map = createFixture();
    const displayCombinations = combinations(relevantDisplayFlags);
    const context = new CountingContext();
    const canvas: any = { width: context.canvas.width, height: context.canvas.height, getContext: () => context };
    const viewportX = 300;
    const viewPoint: any = {
        x: viewportX, y: 0, scale: 3,
        convertX: (x: number) => (x - viewportX) * 3,
        convertY: (y: number) => y * 3,
        bboxInView: (zone: any, xOffset = 0) =>
            zone.x + xOffset + zone.w >= viewportX &&
            zone.x + xOffset <= viewportX + canvas.width / 3 &&
            zone.y + zone.h >= 0 &&
            zone.y <= canvas.height / 3,
        getViewZone: (xOffset = 0) => ({
            x: viewportX - xOffset,
            y: 0,
            w: canvas.width / 3,
            h: canvas.height / 3,
        }),
        lineInView: () => true,
    };
    const results: any[] = [];

    let caseIndex = 0;
    for (const pair of [pairs[pairIndex]]) {
        for (const display of displayCombinations) {
            if (caseIndex > 0 && caseIndex % 128 === 0 && typeof (globalThis as any).gc === 'function') {
                (globalThis as any).gc();
            }
            caseIndex++;
            const topBar: any = {
                viewMode$: subject(pair.viewMode),
                colorSet$: subject(pair.colorSet),
                display: { selectedValues$: subject(display) },
                warningFilter: { selectedValues$: subject(['province', 'state', 'strategicregion', 'supplyarea', 'river']) },
                selectedConditions$: subject([]),
            };
            const timings: number[] = [];
            const heaps: number[] = [];
            let operations = 0;
            for (let run = 0; run < warmups + samples; run++) {
                context.operations = 0;
                const heapBefore = process.memoryUsage().heapUsed;
                const start = performance.now();
                Renderer.renderMapImpl(canvas, topBar, viewPoint, map,
                    display.includes('fastrending') ? {} : { preciseEdge: true, overwriteRenderPrecision: 1 });
                const durationMs = performance.now() - start;
                if (run >= warmups) {
                    timings.push(durationMs);
                    heaps.push(process.memoryUsage().heapUsed - heapBefore);
                    operations = context.operations;
                }
            }
            results.push({
                ...pair, display, durationMsMedian: median(timings),
                durationMsSamples: timings, heapDeltaBytesMedian: median(heaps), canvasOperations: operations,
            });
        }
    }

    process.stdout.write(JSON.stringify(results));
}

main();
