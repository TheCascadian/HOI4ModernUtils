import { Subscription } from 'rxjs';
import { hashRgbaBytes } from './pixelhash';
import {
    WorldMapRuntimeTestCase,
    WorldMapRuntimeTestCaseResult,
    WorldMapRuntimeTestReport,
    WorldMapRuntimeTestRequest,
    WorldMapRuntimeTestRequestMessage,
    WorldMapRuntimeTestOptimization,
} from './definitions';
import { Loader } from './loader';
import { Renderer } from './renderer';
import { ColorSet, TopBar, ViewMode } from './topbar';
import { ViewPoint } from './viewpoint';
import { vscode } from '../util/vscode';

type RendererRuntimeTestInternals = {
    isRiverVisible(topBar: TopBar, viewPoint: ViewPoint): boolean;
    renderAllOffsets(
        viewPoint: ViewPoint,
        boundingBox: { x: number; y: number; w: number; h: number },
        step: number,
        callback: (xOffset: number) => void,
        minimalRenderCount?: number,
    ): void;
    renderRivers(
        renderContext: { viewPoint: ViewPoint; topBar: TopBar },
        worldMap: Loader['worldMap'],
        context: CanvasRenderingContext2D,
        xOffset: number,
    ): void;
};

const rendererInternals = Renderer as unknown as RendererRuntimeTestInternals;

export function registerWorldMapRuntimeTest(
    loader: Loader,
    topBar: TopBar,
    viewPoint: ViewPoint,
): void {
    if (!(window as any).__worldMapRuntimeTestEnabled) {
        return;
    }

    const runtimeErrors: string[] = [];
    window.addEventListener('error', event => {
        runtimeErrors.push(event.error instanceof Error ? event.error.stack ?? event.error.message : event.message);
    });
    window.addEventListener('unhandledrejection', event => {
        runtimeErrors.push(formatUnknown(event.reason));
    });
    window.addEventListener('message', event => {
        const message = event.data as WorldMapRuntimeTestRequestMessage;
        if (message.command !== 'worldmapruntimetest') {
            return;
        }

        void runRuntimeTest(loader, topBar, viewPoint, message.request, runtimeErrors)
            .then(report => {
                vscode.postMessage({
                    command: 'worldmapruntimetestresult',
                    requestId: message.requestId,
                    report,
                });
            })
            .catch(error => {
                vscode.postMessage({
                    command: 'worldmapruntimetestresult',
                    requestId: message.requestId,
                    error: formatUnknown(error),
                });
            });
    });

    vscode.postMessage({ command: 'worldmapruntimetestready' });
}

async function runRuntimeTest(
    loader: Loader,
    topBar: TopBar,
    viewPoint: ViewPoint,
    request: WorldMapRuntimeTestRequest,
    capturedRuntimeErrors: string[],
): Promise<WorldMapRuntimeTestReport> {
    await waitForWorldMap(loader, Math.min(request.timeoutMs ?? 180000, 180000));

    const canvasWidth = validateDimension(request.canvasWidth ?? 640, 'canvasWidth');
    const canvasHeight = validateDimension(request.canvasHeight ?? 360, 'canvasHeight');
    const samples = validateRunCount(request.samples ?? 1, 'samples', 10);
    const warmups = validateRunCount(request.warmups ?? 0, 'warmups', 10);
    const optimizations = validateOptimizations(request.optimizations ?? []);
    if (request.cases.length === 0) {
        throw new Error('World-map runtime test requires at least one case.');
    }

    const original = {
        viewMode: topBar.viewMode$.value,
        colorSet: topBar.colorSet$.value,
        display: topBar.display.selectedValues$.value,
        x: viewPoint.x,
        y: viewPoint.y,
        scale: viewPoint.scale,
    };
    const testCanvas = document.createElement('canvas');
    testCanvas.width = canvasWidth;
    testCanvas.height = canvasHeight;
    const runtimeErrors = [...capturedRuntimeErrors];
    const originalConsoleError = console.error;
    console.error = (...values: unknown[]) => {
        runtimeErrors.push(values.map(formatUnknown).join(' '));
        originalConsoleError.apply(console, values);
    };

    try {
        const results: WorldMapRuntimeTestCaseResult[] = [];
        for (const testCase of request.cases) {
            results.push(runCase(
                testCanvas,
                loader,
                topBar,
                viewPoint,
                testCase,
                samples,
                warmups,
                request.capturePixelHash ?? false,
                optimizations,
            ));
            await yieldToEventLoop();
        }

        return {
            environment: {
                canvasWidth,
                canvasHeight,
                devicePixelRatio: window.devicePixelRatio,
                userAgent: navigator.userAgent,
                mapWidth: loader.worldMap.width,
                mapHeight: loader.worldMap.height,
                provinces: loader.worldMap.provincesCount,
                rivers: loader.worldMap.rivers.length,
                optimizations,
            },
            results,
            runtimeErrors,
        };
    } finally {
        console.error = originalConsoleError;
        topBar.viewMode$.next(original.viewMode);
        topBar.colorSet$.next(original.colorSet);
        topBar.display.selectedValues$.next(original.display);
        viewPoint.x = original.x;
        viewPoint.y = original.y;
        viewPoint.scale = original.scale;
    }
}

function runCase(
    canvas: HTMLCanvasElement,
    loader: Loader,
    topBar: TopBar,
    viewPoint: ViewPoint,
    testCase: WorldMapRuntimeTestCase,
    samples: number,
    warmups: number,
    capturePixelHash: boolean,
    optimizations: WorldMapRuntimeTestOptimization[],
): WorldMapRuntimeTestCaseResult {
    const viewport = resolveViewport(testCase, loader.worldMap.width, loader.worldMap.height);
    const baseResult = {
        id: testCase.id,
        viewMode: testCase.viewMode,
        colorSet: testCase.colorSet,
        display: [...testCase.display],
        viewport,
    };

    try {
        validateModeColorPair(testCase.viewMode, testCase.colorSet);
        validateDisplay(testCase.display);
        topBar.viewMode$.next(testCase.viewMode as ViewMode);
        topBar.colorSet$.next(testCase.colorSet as ColorSet);
        topBar.display.selectedValues$.next([...testCase.display]);
        viewPoint.x = viewport.x;
        viewPoint.y = viewport.y;
        viewPoint.scale = viewport.scale;

        const durations: number[] = [];
        const heapDeltas: number[] = [];
        for (let run = 0; run < warmups + samples; run++) {
            const heapBefore = getHeapSize();
            const start = performance.now();
            Renderer.renderMapImpl(
                canvas,
                topBar,
                viewPoint,
                loader.worldMap,
                createRenderOptions(testCase.display, optimizations),
            );
            const duration = performance.now() - start;
            if (run >= warmups) {
                durations.push(duration);
                const heapAfter = getHeapSize();
                if (heapBefore !== undefined && heapAfter !== undefined) {
                    heapDeltas.push(heapAfter - heapBefore);
                }
            }
        }

        const riverMetrics = collectRiverMetrics(canvas, loader, topBar, viewPoint, optimizations);
        return {
            ...baseResult,
            durationMsMedian: median(durations),
            durationMsSamples: durations,
            heapDeltaBytesMedian: heapDeltas.length > 0 ? median(heapDeltas) : undefined,
            pixelHash: capturePixelHash ? hashCanvas(canvas) : undefined,
            ...riverMetrics,
        };
    } catch (error) {
        return {
            ...baseResult,
            durationMsMedian: 0,
            durationMsSamples: [],
            riverFillRects: 0,
            riverFullyOutsideViewport: 0,
            riverDuplicateRects: 0,
            riverCoordinateHash: '00000000',
            error: formatUnknown(error),
        };
    }
}

function collectRiverMetrics(
    canvas: HTMLCanvasElement,
    loader: Loader,
    topBar: TopBar,
    viewPoint: ViewPoint,
    optimizations: WorldMapRuntimeTestOptimization[],
): Pick<WorldMapRuntimeTestCaseResult, 'riverFillRects' | 'riverFullyOutsideViewport' | 'riverDuplicateRects' | 'riverCoordinateHash'> {
    if (!rendererInternals.isRiverVisible(topBar, viewPoint)) {
        return {
            riverFillRects: 0,
            riverFullyOutsideViewport: 0,
            riverDuplicateRects: 0,
            riverCoordinateHash: '00000000',
        };
    }

    const context = canvas.getContext('2d')!;
    const originalFillRect = context.fillRect.bind(context);
    const rects = new Set<string>();
    let fillRects = 0;
    let fullyOutside = 0;
    let duplicates = 0;
    let coordinateHash = 0x811c9dc5;
    const proxy = new Proxy(context, {
        get(target, property) {
            if (property === 'fillRect') {
                return (x: number, y: number, width: number, height: number) => {
                    fillRects++;
                    if (x + width <= 0 || x >= canvas.width || y + height <= 0 || y >= canvas.height) {
                        fullyOutside++;
                    }
                    const key = `${x},${y},${width},${height}`;
                    if (rects.has(key)) {
                        duplicates++;
                    }
                    rects.add(key);
                    coordinateHash = hashString(key, coordinateHash);
                    originalFillRect(x, y, width, height);
                };
            }

            const value = Reflect.get(target, property, target);
            return typeof value === 'function' ? value.bind(target) : value;
        },
        set(target, property, value) {
            return Reflect.set(target, property, value, target);
        },
    }) as CanvasRenderingContext2D;

    const optimizationSet = new Set(optimizations);
    const riverDevicePixels = optimizations.includes('river-device-pixel-collapse')
        ? new Set<string>()
        : undefined;
    rendererInternals.renderAllOffsets(
        viewPoint,
        { x: 0, y: 0, w: loader.worldMap.width, h: loader.worldMap.height },
        loader.worldMap.width,
        xOffset => rendererInternals.renderRivers(
            {
                viewPoint,
                topBar,
                optimizations: optimizationSet,
                riverDevicePixels,
            } as any,
            loader.worldMap,
            proxy,
            xOffset,
        ),
    );

    return {
        riverFillRects: fillRects,
        riverFullyOutsideViewport: fullyOutside,
        riverDuplicateRects: duplicates,
        riverCoordinateHash: toHash(coordinateHash),
    };
}

function createRenderOptions(
    display: string[],
    optimizations: WorldMapRuntimeTestOptimization[],
) {
    return Renderer.resolveRenderOptions(
        display.includes('fastrending'),
        new Set(optimizations)
    );
}

function resolveViewport(
    testCase: WorldMapRuntimeTestCase,
    mapWidth: number,
    mapHeight: number,
): { x: number; y: number; scale: number } {
    const scale = testCase.viewport.scale;
    if (!Number.isFinite(scale) || scale < 0.25 || scale > 64) {
        throw new Error(`Invalid scale for ${testCase.id}: ${scale}.`);
    }

    const x = testCase.viewport.x ??
        (testCase.viewport.xRatio !== undefined ? mapWidth * testCase.viewport.xRatio : 0);
    const y = testCase.viewport.y ??
        (testCase.viewport.yRatio !== undefined ? mapHeight * testCase.viewport.yRatio : 0);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
        throw new Error(`Invalid viewport position for ${testCase.id}: (${x}, ${y}).`);
    }
    return { x, y, scale };
}

function validateModeColorPair(viewMode: string, colorSet: string): void {
    const viewModes = Array.from((document.getElementById('viewmode') as HTMLSelectElement).options);
    if (!viewModes.some(option => option.value === viewMode)) {
        throw new Error(`Unknown view mode: ${viewMode}.`);
    }

    const colorSets = Array.from((document.getElementById('colorset') as HTMLSelectElement).options);
    const option = colorSets.find(candidate => candidate.value === colorSet);
    const modes = option?.getAttribute('viewmode')?.split(/\s+/);
    const valid = option !== undefined &&
        (modes ? modes.includes(viewMode) : colorSet === 'warnings' && viewMode === 'warnings');
    if (!valid) {
        throw new Error(`Invalid mode/color pair: ${viewMode}/${colorSet}.`);
    }
}

function validateDisplay(display: string[]): void {
    const validValues = new Set([
        'edge',
        'label',
        'tooltip',
        'supply',
        'river',
        'stateboundary',
        'oceanstateboundary',
        'mousehighlight',
        'fastrending',
        'adaptzooming',
        'compacttooltip',
    ]);
    const invalid = display.filter(value => !validValues.has(value));
    if (invalid.length > 0 || new Set(display).size !== display.length) {
        throw new Error(`Invalid display values: ${display.join(',')}.`);
    }
}

function validateDimension(value: number, name: string): number {
    if (!Number.isInteger(value) || value <= 0 || value > 4096) {
        throw new Error(`${name} must be an integer between 1 and 4096.`);
    }
    return value;
}

function validateRunCount(value: number, name: string, maximum: number): number {
    if (!Number.isInteger(value) || value < 0 || value > maximum || (name === 'samples' && value === 0)) {
        throw new Error(`${name} must be an integer between ${name === 'samples' ? 1 : 0} and ${maximum}.`);
    }
    return value;
}

function validateOptimizations(values: WorldMapRuntimeTestOptimization[]): WorldMapRuntimeTestOptimization[] {
    const valid = new Set<WorldMapRuntimeTestOptimization>([
        'warning-index',
        'edge-decimation',
        'river-device-pixel-collapse',
        'label-grid-dedupe',
        'coarse-provinces',
    ]);
    const invalid = values.filter(value => !valid.has(value));
    if (invalid.length > 0 || new Set(values).size !== values.length) {
        throw new Error(`Invalid world-map runtime optimizations: ${values.join(',')}.`);
    }
    return [...values];
}

function waitForWorldMap(loader: Loader, timeoutMs: number): Promise<void> {
    if (!loader.loading$.value) {
        return loader.worldMap.width > 0
            ? Promise.resolve()
            : Promise.reject(new Error(loader.progressText || 'World map finished loading without map data.'));
    }

    return new Promise<void>((resolve, reject) => {
        let subscription: Subscription | undefined;
        const timeout = window.setTimeout(() => {
            subscription?.unsubscribe();
            reject(new Error(`World map did not finish loading after ${timeoutMs}ms. Last progress: ${loader.progressText}`));
        }, timeoutMs);
        subscription = loader.loading$.subscribe(loading => {
            if (!loading) {
                window.clearTimeout(timeout);
                subscription?.unsubscribe();
                if (loader.worldMap.width > 0) {
                    resolve();
                } else {
                    reject(new Error(loader.progressText || 'World map finished loading without map data.'));
                }
            }
        });
    });
}

function hashCanvas(canvas: HTMLCanvasElement): string {
    const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    return hashRgbaBytes(data);
}

function hashString(value: string, initial: number): number {
    let hash = initial;
    for (let i = 0; i < value.length; i++) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return hash;
}

function toHash(value: number): string {
    return (value >>> 0).toString(16).padStart(8, '0');
}

function median(values: number[]): number {
    const ordered = [...values].sort((a, b) => a - b);
    return ordered[Math.floor(ordered.length / 2)];
}

function getHeapSize(): number | undefined {
    const memory = (performance as any).memory;
    return typeof memory?.usedJSHeapSize === 'number' ? memory.usedJSHeapSize : undefined;
}

function yieldToEventLoop(): Promise<void> {
    return new Promise(resolve => window.setTimeout(resolve, 0));
}

function formatUnknown(value: unknown): string {
    if (value instanceof Error) {
        return value.stack ?? value.message;
    }
    if (typeof value === 'string') {
        return value;
    }
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}
