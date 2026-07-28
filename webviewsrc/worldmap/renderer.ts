import { Province, Point, State, Zone, Terrain, StrategicRegion, SupplyArea, WithCondition, WorldMapRuntimeTestOptimization } from "../../src/previewdef/worldmap/definitions";
import { FEWorldMap, Loader } from "./loader";
import { ViewPoint } from "./viewpoint";
import { bboxCenter, distanceSqr, distanceHamming } from "./graphutils";
import { TopBar, topBarHeight, ColorSet, ViewMode } from "./topbar";
import { Subscriber } from "../util/event";
import { arrayToMap } from "../util/common";
import { feLocalize } from "../util/i18n";
import { chain, max, padStart } from "lodash";
import { animationFrameScheduler, BehaviorSubject, combineLatest, fromEvent } from 'rxjs';
import { auditTime, distinctUntilChanged } from 'rxjs/operators';
import { applyCondition, ConditionItem } from "../../src/hoiformat/condition";
import { getBrushBounds } from "./brush";
import { formatTooltipWarnings, placeTooltip } from "./tooltip";
import { forEachRiverPixel } from "./selection";
import { WebGL2FrameResult, WebGL2Renderer } from "./webgl2renderer";
import { sendEvent } from "../util/telemetry";

const landWarning = 0xE02020;
const landNoWarning = 0x7FFF7F;
const waterWarning = 0xC00000;
const waterNoWarning = 0x20E020;

const renderScaleByViewMode: Record<ViewMode, { edge: number, labels: number }> = {
    province: { edge: 2, labels: 3 },
    state: { edge: 1, labels: 1 },
    strategicregion: { edge: 0.25, labels: 0.25 },
    supplyarea: { edge: 0.5, labels: 1 },
    country: { edge: 0.25, labels: 0.25 },
    warnings: { edge: 2, labels: 3 },
};

export interface WorldMapRenderStats {
    totalMs: number;
    mapMs: number;
    mapRedrawn: boolean;
    timestamp: number;
    canvasWidth: number;
    canvasHeight: number;
}

interface RenderContext {
    topBar: TopBar;
    viewPoint: ViewPoint;
    mapCanvasContext: CanvasRenderingContext2D;
    provinceToState: Record<number, number | undefined>;
    provinceToStrategicRegion: Record<number, number | undefined>;
    stateToSupplyArea: Record<number, number | undefined>;
    renderedProvincesByOffset: Record<number, Province[]>;
    renderedProvincesById: Record<number, Province>;
    renderedProvinces?: Province[];
    overwriteRenderPrecision?: number;
    renderPrecisionBase?: number;
    preciseEdge?: boolean;
    edgeSampleBase?: number;
    optimizations?: ReadonlySet<WorldMapRuntimeTestOptimization>;
    warningIndex?: WarningIndex;
    riverDevicePixels?: Set<string>;
    labelGridCells?: Set<string>;
    extraState: any;
}

interface WarningIndex {
    provinceIds: Set<number>;
    provinceColors: Set<number>;
    stateIds: Set<number>;
    strategicRegionIds: Set<number>;
    supplyAreaIds: Set<number>;
}

export class Renderer extends Subscriber {
    public readonly renderStats$ = new BehaviorSubject<WorldMapRenderStats | undefined>(undefined);
    private canvasWidth: number = 0;
    private canvasHeight: number = 0;
    
    private backCanvas: HTMLCanvasElement;
    private mapCanvas: HTMLCanvasElement;
    private mapOverlayCanvas: HTMLCanvasElement;
    private paintOverlayCanvas: HTMLCanvasElement;
    private mainCanvasContext: CanvasRenderingContext2D;
    private backCanvasContext: CanvasRenderingContext2D;
    private mapOverlayCanvasContext: CanvasRenderingContext2D;
    private paintOverlayCanvasContext: CanvasRenderingContext2D;
    private paintOverlayState: {
        pixels: ReadonlyMap<string, number>;
        color: number;
        x: number;
        y: number;
        scale: number;
        width: number;
        height: number;
    } | undefined;
    private webgl2Renderer: WebGL2Renderer | undefined;
    private webgl2Requested = false;
    private renderedFrameCount = 0;
    
    private cursorX = 0;
    private cursorY = 0;
    private tooltipRendered = false;
    private accessibleTooltipText = '';

    private static resourceImages: Record<string, HTMLImageElement | undefined> = {};

    constructor(private mainCanvas: HTMLCanvasElement, private viewPoint: ViewPoint, private loader: Loader, private topBar: TopBar) {
        super();

        this.addSubscription(fromEvent(window, 'resize').subscribe(this.resizeCanvas));

        this.mainCanvasContext = this.mainCanvas.getContext('2d')!;
        this.backCanvas = document.createElement('canvas');
        this.backCanvasContext = this.backCanvas.getContext('2d')!;
        this.mapCanvas = document.createElement('canvas');
        this.mapOverlayCanvas = document.createElement('canvas');
        this.mapOverlayCanvasContext = this.mapOverlayCanvas.getContext('2d')!;
        this.paintOverlayCanvas = document.createElement('canvas');
        this.paintOverlayCanvasContext = this.paintOverlayCanvas.getContext('2d')!;
        this.setWebGL2Enabled(this.topBar.renderOptimizations$.value.has('webgl2-base'));

        this.registerCanvasEventHandlers();
        this.resizeCanvas();

        this.addSubscription(loader.worldMap$.subscribe(this.reloadImages));
        this.addSubscription(loader.worldMap$.subscribe(this.renderCanvas));
        this.addSubscription(
            combineLatest([
                loader.progress$,
                viewPoint.observable$,
                topBar.viewMode$,
                topBar.colorSet$,
                topBar.hoverProvinceId$,
                topBar.selectedProvinceIds$,
                topBar.selectedRiverIds$,
                topBar.selectedStateIds$,
                topBar.hoverStateId$,
                topBar.selectedStateId$,
                topBar.hoverStrategicRegionId$,
                topBar.selectedStrategicRegionId$,
                topBar.hoverSupplyAreaId$,
                topBar.selectedSupplyAreaId$,
                topBar.hoverCountryTag$,
                topBar.selectedCountryTag$,
                topBar.mapMutation$,
                topBar.warningFilter.selectedValues$,
                topBar.display.selectedValues$,
                topBar.paintbrushActive$,
                topBar.paintedPixels$,
                topBar.brushSize$,
                topBar.hoverMapX$,
                topBar.hoverMapY$,
                topBar.selectedConditions$,
                topBar.renderOptimizations$,
            ]).pipe(
                distinctUntilChanged((x, y) => x.every((v, i) => v === y[i])),
                auditTime(0, animationFrameScheduler)
            ).subscribe(this.renderCanvas)
        );
    }

    private reloadImages = () => {
        for (const resource of this.loader.worldMap.resources) {
            const image = new Image();
            image.onload = () => {
                Renderer.resourceImages[resource.name] = image;
            };
            image.src = resource.imageUri;
        }
    };

    public renderCanvas = () => {
        if (this.canvasWidth <= 0 && this.canvasHeight <= 0) {
            return;
        }

        const renderStarted = performance.now();
        const backCanvasContext = this.backCanvasContext;
        this.tooltipRendered = false;
    
        backCanvasContext.fillStyle = 'black';
        backCanvasContext.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        backCanvasContext.fillStyle = 'white';
        backCanvasContext.font = '12px sans-serif';

        const mapResult = this.renderMap();
        backCanvasContext.drawImage(this.mapCanvas, 0, 0);
        if (this.webgl2Renderer) {
            backCanvasContext.drawImage(this.mapOverlayCanvas, 0, 0);
        }

        const viewMode = this.topBar.viewMode$.value;
        switch (viewMode) {
            case 'province':
            case 'warnings':
                this.renderProvinceHoverSelection(this.loader.worldMap);
                break;
            case 'state':
                this.renderStateHoverSelection(this.loader.worldMap);
                break;
            case 'strategicregion':
                this.renderStrategicRegionHoverSelection(this.loader.worldMap);
                break;
            case 'supplyarea':
                this.renderSupplyAreaHoverSelection(this.loader.worldMap);
                break;
            case 'country':
                this.renderCountryHoverSelection(this.loader.worldMap);
                break;
        }

        // Render paintbrush overlay
        if (this.topBar.paintbrushActive$.value) {
            this.renderPaintbrushOverlay(this.loader.worldMap);
        }

        if (this.loader.progressText !== '') {
            this.renderLoadingText(this.loader.progressText);
        } else if (this.loader.loading$.value) {
            this.renderLoadingText(feLocalize('worldmap.progress.visualizing', 'Visualizing map data: {0}', Math.round(this.loader.progress * 100) + '%'));
        }

        if (!this.tooltipRendered) {
            this.updateAccessibleTooltip('');
        }
    
        this.mainCanvasContext.drawImage(this.backCanvas, 0, 0);
        this.renderStats$.next({
            totalMs: performance.now() - renderStarted,
            mapMs: mapResult.durationMs,
            mapRedrawn: mapResult.redrawn,
            timestamp: performance.now(),
            canvasWidth: this.canvasWidth,
            canvasHeight: this.canvasHeight,
        });
        this.reportRenderPerformance(mapResult.durationMs, performance.now() - renderStarted);
    };
    
    private resizeCanvas = () => {
        this.canvasWidth = this.mainCanvas.width = this.mapCanvas.width = this.mapOverlayCanvas.width =
            this.paintOverlayCanvas.width = this.backCanvas.width = window.innerWidth;
        this.canvasHeight = this.mainCanvas.height = this.mapCanvas.height = this.mapOverlayCanvas.height =
            this.paintOverlayCanvas.height = this.backCanvas.height = window.innerHeight;
        this.paintOverlayState = undefined;
        this.renderCanvas();
    };

    private oldMapState: any = undefined;
    private renderMap(): { redrawn: boolean; durationMs: number } {
        const worldMap = this.loader.worldMap;
        const displayOptions = this.topBar.display.selectedValues$.value;
        this.setWebGL2Enabled(this.topBar.renderOptimizations$.value.has('webgl2-base'));
        const newMapState = {
            worldMap,
            canvasWidth: this.canvasWidth,
            canvasHeight: this.canvasHeight,
            viewMode: this.topBar.viewMode$.value,
            colorSet: this.topBar.colorSet$.value,
            warningFilter: this.topBar.warningFilter.selectedValues$.value,
            selectedConditions: this.topBar.selectedConditions$.value,
            edgeVisible: displayOptions.includes('edge'),
            labelVisible: displayOptions.includes('label'),
            adaptZooming: displayOptions.includes('adaptzooming'),
            fastRendering: displayOptions.includes('fastrending'),
            supplyVisible: displayOptions.includes('supply'),
            riverVisible: displayOptions.includes('river'),
            renderOptimizations: Array.from(this.topBar.renderOptimizations$.value).sort().join(','),
            mapMutation: this.topBar.mapMutation$.value,
            ...this.viewPoint.toJson(),
        };

        // State not changed
        if (this.oldMapState !== undefined && Object.keys(newMapState).every(k => this.oldMapState[k] === (newMapState as any)[k])) {
            return { redrawn: false, durationMs: 0 };
        }
        this.oldMapState = newMapState;
        const started = performance.now();
        performance.mark('hoi4mu.worldmap.render.start');
        if (this.webgl2Renderer) {
            const renderContext = Renderer.createRenderContext(
                this.mapOverlayCanvasContext,
                this.topBar,
                this.viewPoint,
                worldMap,
                Renderer.resolveRenderOptions(
                    newMapState.fastRendering,
                    this.topBar.renderOptimizations$.value
                ),
            );
            const gpuResult = this.webgl2Renderer.render(
                worldMap,
                this.viewPoint,
                newMapState.mapMutation,
                province => getColorByColorSet(this.topBar.colorSet$.value, province, worldMap, renderContext),
                Renderer.resolveGpuLodPrecision(renderContext, this.viewPoint.scale),
                [
                    newMapState.colorSet,
                    newMapState.warningFilter,
                    newMapState.selectedConditions,
                    newMapState.mapMutation,
                ].join('|'),
            );
            this.renderGpuForeground(worldMap, gpuResult, renderContext);
        } else {
            Renderer.renderMapImpl(this.mapCanvas, this.topBar, this.viewPoint, worldMap,
                Renderer.resolveRenderOptions(
                    newMapState.fastRendering,
                    this.topBar.renderOptimizations$.value
                ));
        }
        performance.mark('hoi4mu.worldmap.render.end');
        performance.measure('hoi4mu.worldmap.render', 'hoi4mu.worldmap.render.start', 'hoi4mu.worldmap.render.end');
        performance.clearMarks('hoi4mu.worldmap.render.start');
        performance.clearMarks('hoi4mu.worldmap.render.end');
        performance.clearMeasures('hoi4mu.worldmap.render');
        return { redrawn: true, durationMs: performance.now() - started };
    }

    public override dispose(): void {
        super.dispose();
        this.webgl2Renderer?.dispose();
        this.webgl2Renderer = undefined;
        this.mapCanvas.width = this.mapCanvas.height = 0;
        this.mapOverlayCanvas.width = this.mapOverlayCanvas.height = 0;
        this.paintOverlayCanvas.width = this.paintOverlayCanvas.height = 0;
        this.backCanvas.width = this.backCanvas.height = 0;
        for (const image of Object.values(Renderer.resourceImages)) {
            if (image) {
                image.src = '';
            }
        }
        Renderer.resourceImages = {};
        this.renderStats$.complete();
    }

    private renderGpuForeground(
        worldMap: FEWorldMap,
        gpuResult: WebGL2FrameResult,
        renderContext: RenderContext,
    ): void {
        Renderer.renderGpuForegroundImpl(worldMap, gpuResult, renderContext, this.viewPoint, this.mapOverlayCanvasContext);
    }

    public static renderMapWebGL2Impl(
        outputCanvas: HTMLCanvasElement,
        gpuCanvas: HTMLCanvasElement,
        overlayCanvas: HTMLCanvasElement,
        webgl2Renderer: WebGL2Renderer,
        topBar: TopBar,
        viewPoint: ViewPoint,
        worldMap: FEWorldMap,
        mutationToken: unknown,
        otherRenderContext?: Partial<RenderContext>,
    ): WebGL2FrameResult {
        const overlayContext = overlayCanvas.getContext('2d')!;
        const renderContext = Renderer.createRenderContext(
            overlayContext,
            topBar,
            viewPoint,
            worldMap,
            otherRenderContext,
        );
        const result = webgl2Renderer.render(
            worldMap,
            viewPoint,
            mutationToken,
            province => getColorByColorSet(topBar.colorSet$.value, province, worldMap, renderContext),
            Renderer.resolveGpuLodPrecision(renderContext, viewPoint.scale),
            `${topBar.colorSet$.value}|${topBar.warningFilter.selectedValues$.value.join(',')}|${mutationToken}`,
        );
        Renderer.renderGpuForegroundImpl(worldMap, result, renderContext, viewPoint, overlayContext);
        const output = outputCanvas.getContext('2d')!;
        output.fillStyle = 'black';
        output.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
        output.drawImage(gpuCanvas, 0, 0);
        output.drawImage(overlayCanvas, 0, 0);
        return result;
    }

    private static resolveGpuLodPrecision(renderContext: Partial<RenderContext>, scale: number): number {
        const overwrite = renderContext.overwriteRenderPrecision;
        const base = renderContext.renderPrecisionBase ?? 2;
        if (scale < 1) {
            return Math.pow(2, Math.floor(Math.log2(1 / scale)) + (overwrite !== undefined ? 0 : base));
        }
        return overwrite ?? (scale <= base ? Math.pow(2, base + 1 - Math.round(scale)) : 1);
    }

    private static renderGpuForegroundImpl(
        worldMap: FEWorldMap,
        gpuResult: WebGL2FrameResult,
        renderContext: RenderContext,
        viewPoint: ViewPoint,
        context: CanvasRenderingContext2D,
    ): void {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        const mapZone: Zone = { x: 0, y: 0, w: worldMap.width, h: worldMap.height };
        const requiresProvinceLists =
            Renderer.isEdgeVisible(renderContext.topBar, viewPoint) ||
            Renderer.isStateBoundaryVisible(renderContext.topBar) ||
            Renderer.isSupplyVisible(renderContext.topBar) ||
            Renderer.isLabelVisible(renderContext.topBar, viewPoint);
        const hasForeground = requiresProvinceLists || Renderer.isRiverVisible(renderContext.topBar, viewPoint);
        if (!hasForeground) {
            return;
        }
        if (requiresProvinceLists) {
            Renderer.renderAllOffsets(viewPoint, mapZone, worldMap.width, xOffset => {
                const renderedProvinces: Province[] = [];
                renderContext.renderedProvincesByOffset[xOffset] = renderedProvinces;
                for (const provinceId of gpuResult.visibleProvinceIds) {
                    const province = worldMap.getProvinceById(provinceId);
                    if (province && viewPoint.bboxInView(province.boundingBox, xOffset)) {
                        renderedProvinces.push(province);
                        renderContext.renderedProvincesById[province.id] = province;
                    }
                }
                Renderer.addVisibleSyntheticEdges(worldMap, xOffset, renderContext, renderedProvinces);
            });
            renderContext.renderedProvinces = Object.values(renderContext.renderedProvincesById);
        }
        Renderer.renderAllOffsets(viewPoint, mapZone, worldMap.width, xOffset =>
            Renderer.renderMapForeground(worldMap, xOffset, renderContext)
        );
    }

    private reportRenderPerformance(mapMs: number, totalMs: number): void {
        this.renderedFrameCount++;
        if (this.renderedFrameCount % 300 !== 0 && totalMs < 50) {
            return;
        }
        sendEvent('worldmap.render.performance', {
            renderer: this.webgl2Renderer ? 'webgl2' : 'canvas2d',
        }, {
            mapMs,
            totalMs,
            scale: this.viewPoint.scale,
            width: this.canvasWidth,
            height: this.canvasHeight,
        });
    }

    private setWebGL2Enabled(enabled: boolean): void {
        if (enabled === this.webgl2Requested) {
            return;
        }
        this.webgl2Requested = enabled;
        this.webgl2Renderer?.dispose();
        this.webgl2Renderer = undefined;
        this.mapCanvas.width = this.mapCanvas.height = 0;
        this.mapCanvas = document.createElement('canvas');
        this.mapCanvas.width = this.canvasWidth;
        this.mapCanvas.height = this.canvasHeight;
        if (enabled) {
            this.webgl2Renderer = WebGL2Renderer.create(this.mapCanvas);
        }
        this.oldMapState = undefined;
    }

    public static resolveRenderOptions(
        fastRendering: boolean,
        optimizations: ReadonlySet<WorldMapRuntimeTestOptimization>
    ): Partial<RenderContext> {
        return {
            optimizations,
            preciseEdge: optimizations.has('edge-decimation')
                ? false
                : fastRendering ? undefined : true,
            edgeSampleBase: optimizations.has('edge-decimation') ? 20 : undefined,
            overwriteRenderPrecision: optimizations.has('coarse-provinces') || fastRendering
                ? undefined
                : 1,
            renderPrecisionBase: optimizations.has('coarse-provinces') ? 4 : undefined,
        };
    }

    public static renderMapImpl(canvas: HTMLCanvasElement, topBar: TopBar, viewPoint: ViewPoint, worldMap: FEWorldMap, otherRenderContext?: Partial<RenderContext>) {
        const mapCanvasContext = canvas.getContext('2d')!;
        mapCanvasContext.fillStyle = 'black';
        mapCanvasContext.fillRect(0, 0, canvas.width, canvas.height);

        const renderContext = Renderer.createRenderContext(mapCanvasContext, topBar, viewPoint, worldMap, otherRenderContext);

        const mapZone: Zone = { x: 0, y: 0, w: worldMap.width, h: worldMap.height };
        if (renderContext.optimizations?.has('warning-index') && topBar.colorSet$.value === 'warnings') {
            renderContext.warningIndex = Renderer.buildWarningIndex(worldMap);
        }
        if (renderContext.optimizations?.has('river-device-pixel-collapse')) {
            renderContext.riverDevicePixels = new Set<string>();
        }
        if (renderContext.optimizations?.has('label-grid-dedupe')) {
            renderContext.labelGridCells = new Set<string>();
        }

        Renderer.renderAllOffsets(viewPoint, mapZone, worldMap.width, xOffset => Renderer.renderMapBackground(worldMap, xOffset, renderContext));

        renderContext.renderedProvinces = Object.values(renderContext.renderedProvincesById);
        Renderer.renderAllOffsets(viewPoint, mapZone, worldMap.width, xOffset => Renderer.renderMapForeground(worldMap, xOffset, renderContext));
    }

    private static createRenderContext(
        mapCanvasContext: CanvasRenderingContext2D,
        topBar: TopBar,
        viewPoint: ViewPoint,
        worldMap: FEWorldMap,
        otherRenderContext?: Partial<RenderContext>,
    ): RenderContext {
        return {
            topBar,
            viewPoint,
            mapCanvasContext,
            provinceToState: worldMap.getProvinceToStateMap(),
            provinceToStrategicRegion: worldMap.getProvinceToStrategicRegionMap(),
            stateToSupplyArea: worldMap.getStateToSupplyAreaMap(),
            renderedProvincesByOffset: {},
            renderedProvincesById: {},
            extraState: undefined,
            ...otherRenderContext,
        };
    }

    private static addVisibleSyntheticEdges(
        worldMap: FEWorldMap,
        xOffset: number,
        renderContext: RenderContext,
        renderedProvinces: Province[],
    ): void {
        if (!Renderer.isEdgeVisible(renderContext.topBar, renderContext.viewPoint)) {
            return;
        }
        worldMap.forEachProvince(province => {
            for (const edge of province.edges) {
                if (edge.path.length > 0) {
                    continue;
                }
                const toProvince = worldMap.getProvinceById(edge.to);
                if (!toProvince) {
                    continue;
                }
                const [startPoint, endPoint] = findNearestPoints(edge.start, edge.stop, province, toProvince);
                if (!renderContext.viewPoint.lineInView(startPoint, endPoint, xOffset)) {
                    continue;
                }
                if (!(province.id in renderContext.renderedProvincesById)) {
                    renderedProvinces.push(province);
                    renderContext.renderedProvincesById[province.id] = province;
                }
                if (!(edge.to in renderContext.renderedProvincesById)) {
                    renderedProvinces.push(toProvince);
                    renderContext.renderedProvincesById[edge.to] = toProvince;
                }
            }
        });
    }

    private static renderMapBackground(worldMap: FEWorldMap, xOffset: number, renderContext: RenderContext) {
        const { mapCanvasContext: context, topBar, viewPoint, overwriteRenderPrecision } = renderContext;
        const scale = viewPoint.scale;
        const renderedProvinces = renderContext.renderedProvincesByOffset[xOffset] ?? [];
        const { renderedProvincesById } = renderContext;
        renderContext.renderedProvincesByOffset[xOffset] = renderedProvinces;
        const edgeVisible = Renderer.isEdgeVisible(topBar, viewPoint);

        worldMap.forEachProvince(province => {
            if (renderContext.viewPoint.bboxInView(province.boundingBox, xOffset)) {
                const color = getColorByColorSet(topBar.colorSet$.value, province, worldMap, renderContext);
                context.fillStyle = toColor(color);
                Renderer.renderProvince(
                    viewPoint,
                    context,
                    province,
                    scale,
                    xOffset,
                    overwriteRenderPrecision,
                    renderContext.renderPrecisionBase,
                );
                renderedProvinces.push(province);
                renderedProvincesById[province.id] = province;
            }

            if (edgeVisible) {
                for (const edge of province.edges) {
                    if (edge.path.length > 0) {
                        continue;
                    }

                    const toProvince = worldMap.getProvinceById(edge.to);
                    if (!toProvince) {
                        continue;
                    }

                    const [startPoint, endPoint] = findNearestPoints(edge.start, edge.stop, province, toProvince);
                    if (renderContext.viewPoint.lineInView(startPoint, endPoint, xOffset)) {
                        if (!(province.id in renderedProvincesById)) {
                            renderedProvinces.push(province);
                            renderedProvincesById[province.id] = province;
                        }
                        if (!(edge.to in renderedProvincesById)) {
                            renderedProvinces.push(toProvince);
                            renderedProvincesById[edge.to] = toProvince;
                        }
                    }
                }
            }
        });
    }

    private static renderMapForeground(worldMap: FEWorldMap, xOffset: number, renderContext: RenderContext) {
        const { mapCanvasContext: context, topBar, viewPoint } = renderContext;

        if (Renderer.isRiverVisible(topBar, viewPoint)) {
            Renderer.renderRivers(renderContext, worldMap, context, xOffset);
        }

        if (Renderer.isEdgeVisible(topBar, viewPoint)) {
            Renderer.renderAllEdges(renderContext, worldMap, context, xOffset);
        }

        if (Renderer.isStateBoundaryVisible(topBar) && topBar.viewMode$.value === 'province') {
            Renderer.renderStateBoundaries(renderContext, worldMap, context, xOffset);
        }

        if (Renderer.isSupplyVisible(topBar)) {
            Renderer.renderSupplyRelated(renderContext, worldMap, context, xOffset);
        }

        if (Renderer.isLabelVisible(topBar, viewPoint)) {
            Renderer.renderMapLabels(renderContext, worldMap, context, xOffset);
        }
    }

    private static isEdgeVisible(topBar: TopBar, viewPoint: ViewPoint) {
        if (topBar.display.selectedValues$.value.includes('adaptzooming')) {
            const viewMode = topBar.viewMode$.value;
            const renderScale = renderScaleByViewMode[viewMode];
            const scale = viewPoint.scale;
            return renderScale.edge <= scale && topBar.display.selectedValues$.value.includes('edge');
        }

        return topBar.display.selectedValues$.value.includes('edge');
    }

    private static isLabelVisible(topBar: TopBar, viewPoint: ViewPoint) {
        if (topBar.display.selectedValues$.value.includes('adaptzooming')) {
            const viewMode = topBar.viewMode$.value;
            const renderScale = renderScaleByViewMode[viewMode];
            const scale = viewPoint.scale;
            return renderScale.labels <= scale && topBar.display.selectedValues$.value.includes('label');
        }

        return topBar.display.selectedValues$.value.includes('label');
    }

    private isMouseHighlightVisible() {
        return this.topBar.display.selectedValues$.value.includes('mousehighlight');
    }

    private isTooltipVisible() {
        return this.topBar.display.selectedValues$.value.includes('tooltip');
    }

    private static isStateBoundaryVisible(topBar: TopBar) {
        return topBar.display.selectedValues$.value.includes('stateboundary');
    }

    private static isSupplyVisible(topBar: TopBar) {
        return topBar.display.selectedValues$.value.includes('supply');
    }

    /**
     * Render the paintbrush overlay: shows brush cursor highlight and painted pixels.
     */
    private renderPaintbrushOverlay(_worldMap: FEWorldMap): void {
        const context = this.backCanvasContext;
        const paintedPixels = this.topBar.paintedPixels$.value;
        const brushColor = this.topBar.paintbrushColor$.value;
        const paintOverlayState = {
            pixels: paintedPixels,
            color: brushColor,
            x: this.viewPoint.x,
            y: this.viewPoint.y,
            scale: this.viewPoint.scale,
            width: this.canvasWidth,
            height: this.canvasHeight,
        };

        context.save();
        context.imageSmoothingEnabled = false;

        if (!this.paintOverlayState ||
            Object.keys(paintOverlayState).some(key =>
                (this.paintOverlayState as any)[key] !== (paintOverlayState as any)[key])) {
            const overlayContext = this.paintOverlayCanvasContext;
            overlayContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            overlayContext.fillStyle = toColorWithAlpha(brushColor, 0.5);
            for (const key of paintedPixels.keys()) {
                const separator = key.indexOf(',');
                const mapX = Number(key.substring(0, separator));
                const mapY = Number(key.substring(separator + 1));
                this.fillMapPixel(overlayContext, mapX, mapY);
            }
            this.paintOverlayState = paintOverlayState;
        }
        context.drawImage(this.paintOverlayCanvas, 0, 0);

        // Render the brush cursor from the exact same map-pixel bounds.
        if (this.topBar.paintbrushActive$.value) {
            const centerX = this.topBar.hoverMapX$.value;
            const centerY = this.topBar.hoverMapY$.value;
            const brushBounds = getBrushBounds(this.topBar.brushSize$.value);
            const startX = centerX + brushBounds.startOffset;
            const startY = centerY + brushBounds.startOffset;
            const endX = centerX + brushBounds.endOffset + 1;
            const endY = centerY + brushBounds.endOffset + 1;

            const bounds = this.mapRectToCanvasBounds(
                startX,
                startY,
                endX,
                endY
            );

            context.fillStyle = toColorWithAlpha(brushColor, 0.3);
            context.fillRect(
                bounds.x,
                bounds.y,
                bounds.width,
                bounds.height
            );

            // Half-pixel alignment keeps a one-device-pixel stroke crisp.
            context.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            context.lineWidth = 1;
            context.strokeRect(
                bounds.x + 0.5,
                bounds.y + 0.5,
                Math.max(0, bounds.width - 1),
                Math.max(0, bounds.height - 1)
            );
        }

        context.restore();
    }

    private fillMapPixel(
        context: CanvasRenderingContext2D,
        mapX: number,
        mapY: number
    ): void {
        // Adjacent map pixels must share the exact same canvas edge coordinate,
        // so both edges are rounded with the same function here (unlike
        // mapRectToCanvasBounds's outward floor/ceil snap for standalone rects).
        // Otherwise two neighbouring 0.5-alpha fills double-blend at the seam,
        // showing up as a visible grid of outlines over the painted area.
        const x1 = Math.round((mapX - this.viewPoint.x) * this.viewPoint.scale);
        const y1 = Math.round((mapY - this.viewPoint.y) * this.viewPoint.scale);
        const x2 = Math.round((mapX + 1 - this.viewPoint.x) * this.viewPoint.scale);
        const y2 = Math.round((mapY + 1 - this.viewPoint.y) * this.viewPoint.scale);

        context.fillRect(
            x1,
            y1,
            Math.max(1, x2 - x1),
            Math.max(1, y2 - y1)
        );
    }

    private mapRectToCanvasBounds(
        mapX1: number,
        mapY1: number,
        mapX2: number,
        mapY2: number
    ): {
        x: number;
        y: number;
        width: number;
        height: number;
    } {
        /*
        * Transform both edges using one consistent outward-snapping rule.
        * Never derive rendered size from Math.ceil(scale).
        */
        const x1 = Math.floor((mapX1 - this.viewPoint.x) * this.viewPoint.scale);
        const y1 = Math.floor((mapY1 - this.viewPoint.y) * this.viewPoint.scale);
        const x2 = Math.ceil((mapX2 - this.viewPoint.x) * this.viewPoint.scale);
        const y2 = Math.ceil((mapY2 - this.viewPoint.y) * this.viewPoint.scale);

        return {
            x: x1,
            y: y1,
            width: Math.max(1, x2 - x1),
            height: Math.max(1, y2 - y1),
        };
    }
    
    private static renderStateBoundaries(
        renderContext: RenderContext,
        worldMap: FEWorldMap,
        context: CanvasRenderingContext2D,
        xOffset: number
    ): void {
        const { provinceToState, renderedProvincesById, viewPoint } = renderContext;
        const scale = viewPoint.scale;
        const includeOceanBoundaries = renderContext.topBar.display.selectedValues$.value.includes('oceanstateboundary');

        const configColor = (window as any)['__stateBoundaryColor'] || 'rgba(0, 0, 0, 0.4)';
        const configWidth = (window as any)['__stateBoundaryWidth'] ?? 1.5;
        context.strokeStyle = configColor;
        context.lineWidth = Math.max(1, configWidth * scale);
        context.beginPath();

        for (const provinceId in renderedProvincesById) {
            const province = renderedProvincesById[provinceId];
            const stateFromId = provinceToState[province.id];

            for (const edge of province.edges) {
                if (edge.to <= province.id) {
                    continue;
                }
                const toProvince = worldMap.getProvinceById(edge.to);
                if (!includeOceanBoundaries && (province.type === 'sea' || toProvince?.type === 'sea')) {
                    continue;
                }
                const stateToId = provinceToState[edge.to];
                if (stateFromId === stateToId && stateFromId !== undefined) {
                    continue;
                }

                for (const path of edge.path) {
                    if (path.length === 0) {
                        continue;
                    }
                    context.moveTo(viewPoint.convertX(path[0].x + xOffset), viewPoint.convertY(path[0].y));
                    for (let j = 1; j < path.length; j++) {
                        const pos = path[j];
                        context.lineTo(viewPoint.convertX(pos.x + xOffset), viewPoint.convertY(pos.y));
                    }
                }
            }
        }

        context.stroke();
    }

    private static isRiverVisible(topBar: TopBar, viewPoint: ViewPoint) {
        if (topBar.display.selectedValues$.value.includes('adaptzooming')) {
            return 1 <= viewPoint.scale && topBar.display.selectedValues$.value.includes('river');
        }

        return topBar.display.selectedValues$.value.includes('river');
    }

    private static renderAllEdges(renderContext: RenderContext, worldMap: FEWorldMap, context: CanvasRenderingContext2D, xOffset: number) {
        const renderedProvinces = renderContext.renderedProvincesByOffset[xOffset] ?? [];
        const preciseEdge = renderContext.preciseEdge;

        context.strokeStyle = 'black';
        context.beginPath();
        for (const province of renderedProvinces) {
            Renderer.renderEdges(renderContext, province, worldMap, context, xOffset, false, preciseEdge);
        }
        context.stroke();

        context.strokeStyle = 'red';
        context.beginPath();
        for (const province of renderedProvinces) {
            Renderer.renderEdges(renderContext, province, worldMap, context, xOffset, true, preciseEdge);
        }
        context.stroke();
    }

    private static shouldRenderLabel(
        renderContext: RenderContext,
        context: CanvasRenderingContext2D,
        x: number,
        y: number,
    ): boolean {
        const cells = renderContext.labelGridCells;
        if (!cells || renderContext.viewPoint.scale >= 1) {
            return true;
        }
        if (x < 0 || x >= context.canvas.width || y < 0 || y >= context.canvas.height) {
            return false;
        }

        const key = `${Math.floor(x / 18)},${Math.floor(y / 12)}`;
        if (cells.has(key)) {
            return false;
        }
        cells.add(key);
        return true;
    }

    private static buildWarningIndex(worldMap: FEWorldMap): WarningIndex {
        const index: WarningIndex = {
            provinceIds: new Set<number>(),
            provinceColors: new Set<number>(),
            stateIds: new Set<number>(),
            strategicRegionIds: new Set<number>(),
            supplyAreaIds: new Set<number>(),
        };

        for (const warning of worldMap.warnings) {
            for (const source of warning.source) {
                switch (source.type) {
                    case 'province':
                        if (source.id !== null) {
                            index.provinceIds.add(source.id);
                        }
                        index.provinceColors.add(source.color);
                        break;
                    case 'state':
                        index.stateIds.add(source.id);
                        break;
                    case 'strategicregion':
                        index.strategicRegionIds.add(source.id);
                        break;
                    case 'supplyarea':
                        index.supplyAreaIds.add(source.id);
                        break;
                }
            }
        }
        return index;
    }

    private static renderMapLabels(renderContext: RenderContext, worldMap: FEWorldMap, context: CanvasRenderingContext2D, xOffset: number) {
        const { provinceToState, provinceToStrategicRegion, stateToSupplyArea, topBar, viewPoint } = renderContext;
        const renderedProvinces = renderContext.renderedProvincesByOffset[xOffset] ?? [];
        const viewMode = topBar.viewMode$.value;
        const colorSet = topBar.colorSet$.value;
        const showSupply = Renderer.isSupplyVisible(topBar);
        const fontSize = 10;

        context.font = `${fontSize}px sans-serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        if (viewMode === 'province' || viewMode === 'warnings') {
            for (const province of renderedProvinces) {
                const provinceColor = showSupply && worldMap.getSupplyNodeByProvinceId(province.id) ? 0xFF0000 :
                    getColorByColorSet(colorSet, province, worldMap, renderContext);
                context.fillStyle = toColor(getHighConstrastColor(provinceColor));
                const labelPosition = province.centerOfMass;
                const labelX = viewPoint.convertX(labelPosition.x + xOffset);
                const labelY = viewPoint.convertY(labelPosition.y);
                if (Renderer.shouldRenderLabel(renderContext, context, labelX, labelY)) {
                    context.fillText(province.id.toString(), labelX, labelY);
                }
            }
        } else {
            const renderedRegions: Record<number, boolean> = {};
            const regionMap = viewMode === 'state' ? provinceToState : provinceToStrategicRegion;
            const getRegionById = viewMode === 'state' ? worldMap.getStateById : viewMode === 'supplyarea' ? worldMap.getSupplyAreaById : worldMap.getStrategicRegionById;

            for (const province of renderedProvinces) {
                const stateId = viewMode === 'supplyarea' ? provinceToState[province.id] : undefined;
                const regionId = viewMode === 'supplyarea' ? (stateId !== undefined ? stateToSupplyArea[stateId] : undefined) : regionMap[province.id];
                if (regionId !== undefined && !renderedRegions[regionId]) {
                    renderedRegions[regionId] = true;
                    const region = getRegionById(regionId);
                    if (region) {
                        const labelPosition = region.centerOfMass;
                        const labelX = viewPoint.convertX(labelPosition.x + xOffset);
                        const labelY = viewPoint.convertY(labelPosition.y);
                        if (!Renderer.shouldRenderLabel(renderContext, context, labelX, labelY)) {
                            continue;
                        }
                        const provinceAtLabel = worldMap.getProvinceByPosition(labelPosition.x, labelPosition.y);
                        const provinceColor = getColorByColorSet(colorSet, provinceAtLabel ?? province, worldMap, renderContext);
                        context.fillStyle = toColor(getHighConstrastColor(provinceColor));
                        if (region.localisedName) {
                            context.fillText(region.localisedName, labelX, labelY - fontSize / 2);
                            context.fillText(region.id.toString(), labelX, labelY + fontSize / 2);
                        } else {
                            context.fillText(region.id.toString(), labelX, labelY);
                        }
                        if (viewMode === 'state' && colorSet === 'resources') {
                            const { width } = Renderer.getResourcesSize(region as State, 0.7, 16);
                            Renderer.renderResources(context, region as State, labelX - width / 2, labelY + 5, 0.7, 16);
                        }
                    }
                }
            }
        }
    }

    private static renderEdges(
        renderContext: RenderContext,
        province: Province,
        worldMap: FEWorldMap,
        context: CanvasRenderingContext2D,
        xOffset: number,
        isRed: boolean,
        preciseEdge?: boolean,
    ) {
        const { provinceToState, provinceToStrategicRegion, stateToSupplyArea, renderedProvincesById, topBar, viewPoint } = renderContext;
        const scale = viewPoint.scale;
        const viewMode = topBar.viewMode$.value;

        context.lineWidth = 2;
        for (const provinceEdge of province.edges) {
            if (!('path' in provinceEdge)) {
                continue;
            }

            if (provinceEdge.to > province.id) {
                continue;
            }

            const stateFromId = provinceToState[province.id];
            const stateToId = provinceToState[provinceEdge.to];

            if (viewMode === 'country') {
                const selectedConditions = topBar.selectedConditions$.value;
                const ownerFrom = solveWithCondition(worldMap.getStateById(stateFromId)?.owner, selectedConditions);
                const ownerTo = solveWithCondition(worldMap.getStateById(stateToId)?.owner, selectedConditions);
                if (ownerFrom === ownerTo) {
                    continue;
                }
            }

            const stateFromImpassable = worldMap.getStateById(stateFromId)?.impassable ?? false;
            const stateToImpassable = worldMap.getStateById(stateToId)?.impassable ?? false;

            const impassable = provinceEdge.type === 'impassable' || stateFromImpassable !== stateToImpassable;
            const paths = provinceEdge.path;
            
            if ((impassable || (paths.length === 0 && provinceEdge.type !== 'impassable')) !== isRed) {
                continue;
            }

            const strategicRegionFromId = provinceToStrategicRegion[province.id];
            const strategicRegionToId = provinceToStrategicRegion[provinceEdge.to];

            if (!impassable && paths.length > 0) {
                if (viewMode === 'state') {
                    if (stateFromId === stateToId && (stateFromId !== undefined || strategicRegionFromId === strategicRegionToId)) {
                        continue;
                    }
                } else if (viewMode === 'strategicregion') {
                    if (strategicRegionFromId === strategicRegionToId) {
                        continue;
                    }
                } else if (viewMode === 'supplyarea') {
                    if ((stateFromId === stateToId && (stateFromId !== undefined || strategicRegionFromId === strategicRegionToId)) ||
                        (stateFromId !== undefined && stateToId !== undefined && stateToSupplyArea[stateFromId] === stateToSupplyArea[stateToId])
                        ) {
                        continue;
                    }
                }
            }

            for (const path of paths) {
                if (path.length === 0) {
                    continue;
                }

                context.moveTo(viewPoint.convertX(path[0].x + xOffset), viewPoint.convertY(path[0].y));
                for (let j = 0; j < path.length; j++) {
                    const edgeSampleBase = renderContext.edgeSampleBase ?? 10;
                    if (!preciseEdge && scale <= 4 && j % (scale < 1 ? Math.floor(edgeSampleBase / scale) : 6 - scale) !== 0 && !isCriticalPoint(path, j)) {
                        continue;
                    }
                    const pos = path[j];
                    context.lineTo(viewPoint.convertX(pos.x + xOffset), viewPoint.convertY(pos.y));
                }
            }

            if (paths.length === 0 && provinceEdge.type !== 'impassable') {
                const toProvince = renderedProvincesById[provinceEdge.to];
                const [startPoint, endPoint] = findNearestPoints(provinceEdge.start, provinceEdge.stop, province, toProvince);

                context.moveTo(viewPoint.convertX(startPoint.x + xOffset), viewPoint.convertY(startPoint.y));
                context.lineTo(viewPoint.convertX(endPoint.x + xOffset), viewPoint.convertY(endPoint.y));
            }
        }
    }

    private static renderSupplyRelated(
        renderContext: RenderContext,
        worldMap: FEWorldMap,
        context: CanvasRenderingContext2D,
        xOffset: number
    ): void {
        const { renderedProvincesById, viewPoint } = renderContext;
        
        context.strokeStyle = 'rgb(200, 0, 0)';
        worldMap.forEachRailway(railway => {
            if (railway.provinces.every(id => !renderedProvincesById[id])) {
                return;
            }

            context.beginPath();
            context.lineWidth = Math.min(10, 2 * railway.level);
            let hasProvince = false;
            for (let i = 0; i < railway.provinces.length; i++) {
                const province = worldMap.getProvinceById(railway.provinces[i]);
                if (province) {
                    if (!hasProvince) {
                        context.moveTo(viewPoint.convertX(province.centerOfMass.x + xOffset), viewPoint.convertY(province.centerOfMass.y));
                    } else {
                        context.lineTo(viewPoint.convertX(province.centerOfMass.x + xOffset), viewPoint.convertY(province.centerOfMass.y));
                    }
                    hasProvince = true;
                } else {
                    context.stroke();
                    hasProvince = false;
                }
            }
            if (hasProvince) {
                context.stroke();
            }
        });

        context.fillStyle = 'rgb(200, 0, 0)';
        const size = Math.min(30, viewPoint.scale * 10);
        worldMap.forEachSupplyNode(supplyNode => {
            const province = renderedProvincesById[supplyNode.province];
            if (province) {
                const x = viewPoint.convertX(province.centerOfMass.x + xOffset);
                const y = viewPoint.convertY(province.centerOfMass.y);
                context.fillRect(x - size / 2, y - size / 2, size, size);
            }
        });
    }

    private static renderRivers(
        renderContext: RenderContext,
        worldMap: FEWorldMap,
        context: CanvasRenderingContext2D,
        xOffset: number
    ): void {
        const { viewPoint, topBar } = renderContext;
        const showRiverWarning = topBar.colorSet$.value === 'warnings' && topBar.warningFilter.selectedValues$.value.includes('river');

        const riverColors: string[] = [
            'rgb(0, 255, 0)',
            'rgb(255, 0, 0)',
            'rgb(255, 252, 0)',
            'rgb(0, 225, 255)',
            'rgb(0, 200, 255)',
            'rgb(0, 150, 255)',
            'rgb(0, 100, 255)',
            'rgb(0, 0, 255)',
            'rgb(0, 0, 255)',
            'rgb(0, 0, 200)',
            'rgb(0, 0, 150)',
            'rgb(0, 0, 100)',
        ];

        const warningColor = toColor(waterWarning);

        for (let i = 0; i < worldMap.rivers.length; i++) {
            const river = worldMap.rivers[i];
            if (!viewPoint.bboxInView(river.boundingBox, xOffset)) {
                continue;
            }

            const hasWarning = showRiverWarning && worldMap.getRiverWarnings(i).length > 0;
            for (const key in river.colors) {
                const index = parseInt(key, 10);
                const x = index % river.boundingBox.w + river.boundingBox.x;
                const y = Math.floor(index / river.boundingBox.w) + river.boundingBox.y;
                let canvasX = viewPoint.convertX(x + xOffset);
                let canvasY = viewPoint.convertY(y);
                let pixelSize = viewPoint.scale;
                if (renderContext.riverDevicePixels && viewPoint.scale < 1) {
                    canvasX = Math.floor(canvasX);
                    canvasY = Math.floor(canvasY);
                    pixelSize = 1;
                    const pixelKey = `${canvasX},${canvasY}`;
                    if (renderContext.riverDevicePixels.has(pixelKey)) {
                        continue;
                    }
                    renderContext.riverDevicePixels.add(pixelKey);
                }
                if (
                    canvasX + pixelSize <= 0 ||
                    canvasX >= context.canvas.width ||
                    canvasY + pixelSize <= 0 ||
                    canvasY >= context.canvas.height
                ) {
                    continue;
                }
                const color = river.colors[key];
                context.fillStyle = hasWarning && color >= 3 ? warningColor : riverColors[color];
                context.fillRect(canvasX, canvasY, pixelSize, pixelSize);
            }
        }
    }

    private static renderProvince(
        viewPoint: ViewPoint,
        context: CanvasRenderingContext2D,
        province: Province,
        scale?: number,
        xOffset: number = 0,
        overwriteRenderPrecision?: number,
        configuredRenderPrecisionBase?: number,
    ): void {
        scale = scale ?? viewPoint.scale;

        const renderPrecisionBase = configuredRenderPrecisionBase ?? 2;
        const renderPrecision =
            scale < 1
                ? Math.pow(
                    2,
                    Math.floor(Math.log2(1 / scale)) +
                        (overwriteRenderPrecision !== undefined
                            ? 0
                            : renderPrecisionBase)
                )
                : overwriteRenderPrecision ??
                  (scale <= renderPrecisionBase
                      ? Math.pow(
                          2,
                          renderPrecisionBase + 1 - Math.round(scale)
                      )
                      : 1);

        const renderPrecisionMask = renderPrecision - 1;
        const renderPrecisionOffset = (renderPrecision - 1) / 2;

        for (const zone of province.coverZones) {
            if (
                zone.w < renderPrecision &&
                (
                    (zone.x & renderPrecisionMask) !== 0 ||
                    (zone.y & renderPrecisionMask) !== 0
                )
            ) {
                continue;
            }

            const mapX1 = zone.x + xOffset - renderPrecisionOffset;
            const mapY1 = zone.y - renderPrecisionOffset;

            const renderedWidth =
                zone.w < renderPrecision ? renderPrecision : zone.w;

            const renderedHeight =
                zone.w < renderPrecision ? renderPrecision : zone.h;

            /*
             * Transform both edges, then snap outward. Never calculate the
             * right/bottom edge as transformed-start + scaled-size.
             */
            const x1 = Math.floor(viewPoint.convertX(mapX1));
            const y1 = Math.floor(viewPoint.convertY(mapY1));
            const x2 = Math.ceil(
                viewPoint.convertX(mapX1 + renderedWidth)
            );
            const y2 = Math.ceil(
                viewPoint.convertY(mapY1 + renderedHeight)
            );

            context.fillRect(
                x1,
                y1,
                Math.max(1, x2 - x1),
                Math.max(1, y2 - y1)
            );
        }
    }

    private renderProvince(context: CanvasRenderingContext2D, province: Province, scale?: number, xOffset: number = 0): void {
        Renderer.renderProvince(this.viewPoint, context, province, scale, xOffset);
    }

    private registerCanvasEventHandlers() {
        this.addSubscription(fromEvent<MouseEvent>(this.mainCanvas, 'mousemove').subscribe((e) => {
            this.cursorX = e.pageX;
            this.cursorY = e.pageY;
            this.renderCanvas();
        }));
    }

    private renderHoverProvince(province: Province, worldMap: FEWorldMap, renderAdjacent: boolean = true) {
        const backCanvasContext = this.backCanvasContext;
        const viewPoint = this.viewPoint;
        backCanvasContext.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.renderAllOffsets(province.boundingBox, worldMap.width, xOffset =>
            this.renderProvince(backCanvasContext, province, viewPoint.scale, xOffset));

        if (!renderAdjacent) {
            return;
        }

        for (const adjecent of province.edges) {
            const adjecentNumber = adjecent.to;
            if (adjecentNumber === -1 || adjecent.type === 'impassable') {
                continue;
            }
            const adjecentProvince = worldMap.getProvinceById(adjecentNumber);
            if (adjecentProvince) {
                backCanvasContext.fillStyle = 'rgba(255, 255, 255, 0.3)';
                this.renderAllOffsets(adjecentProvince.boundingBox, worldMap.width, xOffset =>
                    this.renderProvince(backCanvasContext, adjecentProvince, viewPoint.scale, xOffset));
            }
        }
    }

    private renderSelectedProvince(province: Province, worldMap: FEWorldMap) {
        this.backCanvasContext.fillStyle = 'rgba(128, 255, 128, 0.7)';
        this.renderAllOffsets(province.boundingBox, worldMap.width, xOffset =>
            this.renderProvince(this.backCanvasContext, province, this.viewPoint.scale, xOffset));
    }

    private renderProvinceTooltip(province: Province, worldMap: FEWorldMap, selectedConditions: ConditionItem[]) {
        const stateObject = worldMap.getStateByProvinceId(province.id);
        const strategicRegion = worldMap.getStrategicRegionByProvinceId(province.id);
        const supplyArea = stateObject ? worldMap.getSupplyAreaByStateId(stateObject.id) : undefined;
        const railwayLevel = worldMap.getRailwayLevelByProvinceId(province.id);
        const supplyNode = worldMap.getSupplyNodeByProvinceId(province.id);
        const vp = stateObject?.victoryPoints[province.id];
        const owner = solveWithCondition(stateObject?.owner, selectedConditions);
        const controller = solveWithCondition(stateObject?.controller, selectedConditions);
        const compact = this.isCompactTooltipEnabled();
        const cores = solveWithConditionAsSet(stateObject?.cores, selectedConditions);
        const adjacencies = province.edges.filter(e => e.type !== 'impassable' && e.to !== -1).map(e => e.to);

        this.renderTooltip(`
${stateObject?.impassable ? '|r|' + feLocalize('worldmap.tooltip.impassable', 'Impassable') : ''}
${feLocalize('worldmap.tooltip.province', 'Province')}=${province.id}
${vp ? `${feLocalize('worldmap.tooltip.victorypoint', 'Victory point')}=${vp}` : ''}
${stateObject ? `
${feLocalize('worldmap.tooltip.state', 'State')}=${stateObject?.localisedName ? `${stateObject.localisedName} (${stateObject.id})` : stateObject.id}`: ''
}
${supplyArea ? `
${feLocalize('worldmap.tooltip.supplyarea', 'Supply area')}=${supplyArea.id}
` : ''}
${railwayLevel ? `
${feLocalize('worldmap.tooltip.railwaylevel', 'Railway level')}=${railwayLevel}
` : ''}
${supplyNode ? `
${feLocalize('worldmap.tooltip.supplynode', 'Supply node')}=true
` : ''}
${strategicRegion ? `
${feLocalize('worldmap.tooltip.strategicregion', 'Strategic region')}=${strategicRegion.id}
`: ''
}
${stateObject ? `
${feLocalize('worldmap.tooltip.owner', 'Owner')}=${owner}
${controller && owner !== controller ? `${feLocalize('worldmap.tooltip.controller', 'Controller')}=${controller}` : ''}
${feLocalize('worldmap.tooltip.coreof', 'Core of')}=${compact ? `${cores.length} countr${cores.length === 1 ? 'y' : 'ies'}` : cores.join(',')}
${feLocalize('worldmap.tooltip.manpower', 'Manpower')}=${toCommaDivideNumber(stateObject.manpower)}` : ''
}
${supplyArea ? `
${feLocalize('worldmap.tooltip.supplyvalue', 'Supply value')}=${supplyArea.value}
` : ''}
${feLocalize('worldmap.tooltip.type', 'Type')}=${province.type}
${feLocalize('worldmap.tooltip.terrain', 'Terrain')}=${province.terrain}
${strategicRegion && strategicRegion.navalTerrain ? `
${feLocalize('worldmap.tooltip.navalterrain', 'Naval terrain')}=${strategicRegion.navalTerrain}
`: ''
}
${feLocalize('worldmap.tooltip.coastal', 'Coastal')}=${province.coastal}
${feLocalize('worldmap.tooltip.continent', 'Continent')}=${province.continent !== 0 ? `${worldMap.continents[province.continent]}${compact ? '' : `(${province.continent})`}` : '0'}
${feLocalize('worldmap.tooltip.adjacencies', 'Adjacencies')}=${compact ? adjacencies.length : adjacencies.join(',')}
${formatTooltipWarnings(
    worldMap.getProvinceWarnings(province, stateObject, strategicRegion, supplyArea),
    compact
)}`
        );
    }

    private renderLoadingText(text: string) {
        const backCanvasContext = this.backCanvasContext;
        backCanvasContext.font = '12px sans-serif';
        const mesurement = backCanvasContext.measureText(text);
        backCanvasContext.fillStyle = 'black';
        backCanvasContext.fillRect(0, topBarHeight, 20 + mesurement.width, 32);
        backCanvasContext.fillStyle = 'white';
        backCanvasContext.textAlign = 'start';
        backCanvasContext.textBaseline = 'top';
        backCanvasContext.fillText(text, 10, 10 + topBarHeight);
    }

    private renderProvinceHoverSelection(worldMap: FEWorldMap) {
        const selectedIds = this.topBar.selectedProvinceIds$.value;
        const selectedRiverIds = this.topBar.selectedRiverIds$.value;
        if (selectedRiverIds.size > 0) {
            this.renderSelectedRivers(worldMap, selectedRiverIds);
        } else {
            for (const id of selectedIds) {
                const sel = worldMap.getProvinceById(id);
                if (sel) {
                    this.renderSelectedProvince(sel, worldMap);
                }
            }
        }
        const province = worldMap.getProvinceById(this.topBar.hoverProvinceId$.value);
        if (province) {
            if (!selectedIds.has(province.id) && this.isMouseHighlightVisible()) {
                this.renderHoverProvince(province, worldMap);
            }
            if (this.isTooltipVisible()) {
                this.renderProvinceTooltip(province, worldMap, this.topBar.selectedConditions$.value);
            }
        }
    }

    private renderStateHoverSelection(worldMap: FEWorldMap) {
        const hover = worldMap.getStateById(this.topBar.hoverStateId$.value);

        // Build the selected provinces set for multi-state selection support.
        const selectedStateIds = this.topBar.selectedStateIds$?.value ?? new Set<number>();
        let selected: { provinces: number[] } | undefined = undefined;
        if (selectedStateIds.size > 0) {
            const provincesSet = new Set<number>();
            for (const sid of selectedStateIds) {
                const s = worldMap.getStateById(sid);
                if (s) {
                    for (const p of s.provinces) provincesSet.add(p);
                }
            }
            selected = { provinces: Array.from(provincesSet) };
        } else {
            const sel = worldMap.getStateById(this.topBar.selectedStateId$.value);
            if (sel) selected = { provinces: sel.provinces };
        }

        this.renderHoverSelection(worldMap, hover, selected);
        hover && this.isTooltipVisible() && this.renderStateTooltip(hover, worldMap, this.topBar.selectedConditions$.value);
    }

    private renderStrategicRegionHoverSelection(worldMap: FEWorldMap) {
        const hover = worldMap.getStrategicRegionById(this.topBar.hoverStrategicRegionId$.value);
        this.renderHoverSelection(worldMap, hover, worldMap.getStrategicRegionById(this.topBar.selectedStrategicRegionId$.value));
        hover && this.isTooltipVisible() && this.renderStrategicRegionTooltip(hover, worldMap);
    }

    private renderSupplyAreaHoverSelection(worldMap: FEWorldMap) {
        const hover = worldMap.getSupplyAreaById(this.topBar.hoverSupplyAreaId$.value);
        const selected = worldMap.getSupplyAreaById(this.topBar.selectedSupplyAreaId$.value);
        const toProvinces = (supplyArea: SupplyArea | undefined) => {
            return supplyArea ?
                {
                    provinces: chain(supplyArea.states)
                        .map(stateId => worldMap.getStateById(stateId)?.provinces)
                        .filter((v): v is number[] => !!v)
                        .flatten()
                        .value()
                } :
                undefined;
        };

        this.renderHoverSelection(worldMap, toProvinces(hover), toProvinces(selected));
        hover && this.isTooltipVisible() && this.renderSupplyAreaTooltip(hover, worldMap);
    }

    private getProvincesOwnedByCountry(worldMap: FEWorldMap, tag: string | undefined): { provinces: number[] } | undefined {
        if (!tag) {
            return undefined;
        }

        const selectedConditions = this.topBar.selectedConditions$.value;
        const provinces: number[] = [];
        worldMap.forEachState(state => {
            if (solveWithCondition(state.owner, selectedConditions) === tag) {
                provinces.push(...state.provinces);
            }
        });

        return provinces.length > 0 ? { provinces } : undefined;
    }

    private renderCountryHoverSelection(worldMap: FEWorldMap) {
        const hoverTag = this.topBar.hoverCountryTag$.value;
        const hover = this.getProvincesOwnedByCountry(worldMap, hoverTag);
        const selected = this.getProvincesOwnedByCountry(worldMap, this.topBar.selectedCountryTag$.value);
        this.renderHoverSelection(worldMap, hover, selected);
        if (hoverTag && this.isTooltipVisible()) {
            this.renderCountryTooltip(hoverTag, worldMap);
        }
    }

    /**
     * Draw the selection from the actual rivers.bmp component pixels. The
     * underlying province selection remains available to area operations, but
     * the visible lasso no longer expands to whole touched provinces.
     */
    private renderSelectedRivers(worldMap: FEWorldMap, selectedRiverIds: ReadonlySet<number>) {
        const context = this.backCanvasContext;
        const viewPoint = this.viewPoint;
        const pixelSize = Math.max(1, viewPoint.scale);
        context.fillStyle = 'rgba(128, 255, 128, 0.9)';

        for (const riverId of selectedRiverIds) {
            const river = worldMap.rivers[riverId];
            if (!river) {
                continue;
            }
            for (const xOffset of [-worldMap.width, 0, worldMap.width]) {
                if (!viewPoint.bboxInView(river.boundingBox, xOffset)) {
                    continue;
                }
                forEachRiverPixel(river, (x, mapY) => {
                    const mapX = x + xOffset;
                    const canvasX = viewPoint.convertX(mapX);
                    const canvasY = viewPoint.convertY(mapY);
                    if (canvasX + pixelSize <= 0 || canvasX >= context.canvas.width ||
                        canvasY + pixelSize <= 0 || canvasY >= context.canvas.height) {
                        return;
                    }
                    context.fillRect(canvasX, canvasY, pixelSize, pixelSize);
                });
            }
        }
    }

    private renderCountryTooltip(tag: string, worldMap: FEWorldMap) {
        const selectedConditions = this.topBar.selectedConditions$.value;
        const ownedStates: State[] = [];
        let controlledStates = 0;
        let coreStates = 0;
        let provinces = 0;
        let manpower = 0;
        let victoryPoints = 0;
        const resources: Record<string, number | undefined> = {};

        worldMap.forEachState(state => {
            const owner = solveWithCondition(state.owner, selectedConditions);
            const controller = solveWithCondition(state.controller, selectedConditions) ?? owner;
            if (controller === tag) {
                controlledStates++;
            }
            if (solveWithConditionAsSet(state.cores, selectedConditions).includes(tag)) {
                coreStates++;
            }
            if (owner !== tag) {
                return;
            }

            ownedStates.push(state);
            provinces += state.provinces.length;
            manpower += state.manpower;
            victoryPoints += Object.values(state.victoryPoints)
                .reduce<number>((total, value) => total + (value ?? 0), 0);
            for (const [resource, value] of Object.entries(state.resources)) {
                resources[resource] = (resources[resource] ?? 0) + (value ?? 0);
            }
        });

        const resourceState = { resources } as State;
        this.renderTooltip(`
${feLocalize('worldmap.tooltip.country', 'Country')}=${tag}
${feLocalize('worldmap.tooltip.ownedstates', 'Owned states')}=${ownedStates.length}
${feLocalize('worldmap.tooltip.controlledstates', 'Controlled states')}=${controlledStates}
${feLocalize('worldmap.tooltip.corestates', 'Core states')}=${coreStates}
${feLocalize('worldmap.tooltip.provinces', 'Provinces')}=${provinces}
${feLocalize('worldmap.tooltip.manpower', 'Manpower')}=${toCommaDivideNumber(manpower)}
${feLocalize('worldmap.tooltip.victorypoints', 'Victory points')}=${toCommaDivideNumber(victoryPoints)}`,
            (width, height) => {
                const { width: resourceWidth, height: resourceHeight } = Renderer.getResourcesSize(resourceState);
                return {
                    width: Math.max(width, resourceWidth),
                    height: height + resourceHeight,
                };
            },
            (x, y) => {
                Renderer.renderResources(this.backCanvasContext, resourceState, x, y);
            });
    }

    private renderHoverSelection(worldMap: FEWorldMap, hover: { provinces: number[] } | undefined, selected: { provinces: number[] } | undefined) {
        if (selected) {
            for (const provinceId of selected.provinces) {
                const province = worldMap.getProvinceById(provinceId);
                if (province) {
                    this.renderSelectedProvince(province, worldMap);
                }
            }
        }

        if (hover && this.isMouseHighlightVisible() && hover !== selected) {
            for (const provinceId of hover.provinces) {
                const province = worldMap.getProvinceById(provinceId);
                if (province) {
                    this.renderHoverProvince(province, worldMap, false);
                }
            }
        }
    }

    private renderStateTooltip(state: State, worldMap: FEWorldMap, selectedConditions: ConditionItem[]) {
        const supplyArea = worldMap.getSupplyAreaByStateId(state.id);
        const owner = solveWithCondition(state.owner, selectedConditions);
        const controller = solveWithCondition(state.controller, selectedConditions);
        const compact = this.isCompactTooltipEnabled();
        const cores = solveWithConditionAsSet(state.cores, selectedConditions);
        this.renderTooltip(`
${state.impassable ? '|r|' + feLocalize('worldmap.tooltip.impassable', 'Impassable') : ''}
${feLocalize('worldmap.tooltip.state', 'State')}=${state.localisedName ? `${state.localisedName} (${state.id})` : state.id}
${supplyArea ? `
${feLocalize('worldmap.tooltip.supplyarea', 'Supply area')}=${supplyArea.id}
` : ''}
${feLocalize('worldmap.tooltip.owner', 'Owner')}=${owner}
${controller && owner !== controller ? `${feLocalize('worldmap.tooltip.controller', 'Controller')}=${controller}` : ''}
${feLocalize('worldmap.tooltip.coreof', 'Core of')}=${compact ? `${cores.length} countr${cores.length === 1 ? 'y' : 'ies'}` : cores.join(',')}
${feLocalize('worldmap.tooltip.manpower', 'Manpower')}=${toCommaDivideNumber(state.manpower)}
${feLocalize('worldmap.tooltip.category', 'Category')}=${state.category}
${supplyArea ? `
${feLocalize('worldmap.tooltip.supplyvalue', 'Supply value')}=${supplyArea.value}
` : ''}
${feLocalize('worldmap.tooltip.provinces', 'Provinces')}=${compact ? state.provinces.length : state.provinces.join(',')}
${formatTooltipWarnings(worldMap.getStateWarnings(state, supplyArea), compact)}`,
            (width, height) => {
                const { width: w, height: h } = Renderer.getResourcesSize(state);
                return { width: Math.max(width, w), height: height + h };
            },
            (x, y) => {
                Renderer.renderResources(this.backCanvasContext, state, x, y);
            });
    }

    private renderStrategicRegionTooltip(strategicRegion: StrategicRegion, worldMap: FEWorldMap) {
        const compact = this.isCompactTooltipEnabled();
        this.renderTooltip(`
${feLocalize('worldmap.tooltip.strategicregion', 'Strategic region')}=${strategicRegion.id}
${strategicRegion.navalTerrain ? `
${feLocalize('worldmap.tooltip.navalterrain', 'Naval terrain')}=${strategicRegion.navalTerrain}
`: ''
}
${feLocalize('worldmap.tooltip.provinces', 'Provinces')}=${compact ? strategicRegion.provinces.length : strategicRegion.provinces.join(',')}
${formatTooltipWarnings(worldMap.getStrategicRegionWarnings(strategicRegion), compact)}`);
    }

    private renderSupplyAreaTooltip(supplyArea: SupplyArea, worldMap: FEWorldMap) {
        const compact = this.isCompactTooltipEnabled();
        this.renderTooltip(`
${feLocalize('worldmap.tooltip.supplyarea', 'Supply area')}=${supplyArea.id}
${feLocalize('worldmap.tooltip.supplyvalue', 'Supply value')}=${supplyArea.value}
${feLocalize('worldmap.tooltip.states', 'States')}=${compact ? supplyArea.states.length : supplyArea.states.join(',')}
${formatTooltipWarnings(worldMap.getSupplyAreaWarnings(supplyArea), compact)}`);
    }

    private renderTooltip(tooltip: string, sizeCallback?: (width: number, height: number) => {width: number, height: number}, renderCallback?: (x: number, y: number) => void) {
        const backCanvasContext = this.backCanvasContext;
        const cursorX = this.cursorX;
        const cursorY = this.cursorY;
        this.tooltipRendered = true;
        this.updateAccessibleTooltip(
            tooltip
                .replace(/\|r\|/g, `${feLocalize('worldmap.warning', 'Warning')}: `)
                .split('\n')
                .map(line => line.trim().replace('=', ': '))
                .filter(Boolean)
                .join('. ')
        );

        let mapX = this.viewPoint.convertBackX(cursorX);
        if (this.loader.worldMap.width > 0 && mapX >= this.loader.worldMap.width) {
            mapX -= this.loader.worldMap.width;
        }
        const mapY = this.viewPoint.convertBackY(cursorY);

        tooltip = this.isCompactTooltipEnabled()
            ? `X=${mapX}, Z=${this.loader.worldMap.height - 1 - mapY}\n${tooltip}`
            : `(${mapX}, ${mapY})\nX=${mapX}, Z=${this.loader.worldMap.height - 1 - mapY}\n${tooltip}`;

        const colorPrefix = /^\|r\|/;
        const regex = /(\n)|((?:\|r\|)?(?:.{40,59}[, ]|.{60}))/g;
        const text = tooltip.trim()
            .split(regex)
            .map((v, i, a) => {
                if (!v?.trim() || colorPrefix.test(v)) {
                    return v;
                }
                for (let j = i - 1; j >= 0; j--) {
                    if (!a[j] || a[j] === '\n') {
                        return v;
                    }
                    const match = colorPrefix.exec(a[j]);
                    if (match) {
                        return match[0] + v;
                    }
                }
                return v;
            })
            .filter(v => v?.trim());

        const fontSize = document.body.dataset.largeText === 'true' ? 17 : 14;
        const marginX = 10;
        const marginY = 10;
        const linePadding = 3;

        backCanvasContext.font = `${fontSize}px sans-serif`;
        backCanvasContext.textAlign = 'start';
        let width = max(text.map(t => backCanvasContext.measureText(t).width)) ?? 0;
        let height = fontSize * text.length + linePadding * (text.length - 1);

        if (sizeCallback) {
            const result = sizeCallback(width, height);
            width = result.width;
            height = result.height;
        }

        const position = placeTooltip(
            cursorX,
            cursorY,
            width + 2 * marginX,
            height + 2 * marginY,
            this.canvasWidth,
            this.canvasHeight
        );
        backCanvasContext.strokeStyle = '#7F7F7F';
        backCanvasContext.fillStyle = 'white';
        backCanvasContext.textBaseline = 'top';
        backCanvasContext.fillRect(position.x, position.y, width + 2 * marginX, height + 2 * marginY);
        backCanvasContext.strokeRect(position.x, position.y, width + 2 * marginX, height + 2 * marginY);

        text.forEach((t, i) => {
            backCanvasContext.fillStyle = 'black';
            if (t.startsWith('|r|')) {
                backCanvasContext.fillStyle = 'red';
                t = t.substring(3);
            }
            t = t.trim();
            backCanvasContext.fillText(t, position.x + marginX, position.y + marginY + i * (fontSize + linePadding));
        });

        backCanvasContext.fillStyle = 'black';
        if (renderCallback) {
            renderCallback(position.x + marginX, position.y + marginY + text.length * (fontSize + linePadding));
        }
    }

    private updateAccessibleTooltip(text: string): void {
        if (text === this.accessibleTooltipText) {
            return;
        }
        this.accessibleTooltipText = text;
        const status = document.getElementById('map-accessible-status');
        if (status) {
            status.textContent = text;
        }
    }

    private isCompactTooltipEnabled(): boolean {
        return this.topBar.display.selectedValues$.value.includes('compacttooltip');
    }

    private static renderAllOffsets(viewPoint: ViewPoint, boundingBox: Zone, step: number, callback: (xOffset: number) => void, minimalRenderCount: number = 1) {
        let xOffset = 0;
        let i = 0;
        let inView = viewPoint.bboxInView(boundingBox, xOffset);
        while (inView || i < minimalRenderCount) {
            if (inView) {
                callback(xOffset);
            }
            if (step <= 0) {
                return;
            }
            xOffset += step;
            i++;
            inView = viewPoint.bboxInView(boundingBox, xOffset);
        }
    }

    private renderAllOffsets(boundingBox: Zone, step: number, callback: (xOffset: number) => void, minimalRenderCount: number = 1) {
        Renderer.renderAllOffsets(this.viewPoint, boundingBox, step, callback, minimalRenderCount);
    }

    private static getResourcesSize(state: State, scale: number = 1, labelWidth: number = 30): { width: number, height: number } {
        let fullWidth = 0;
        let maxHeight = 0;
        for (const resource in state.resources) {
            if (!state.resources[resource]) {
                continue;
            }
            const image = Renderer.resourceImages[resource];
            if (image) {
                maxHeight = Math.max(maxHeight, image.naturalHeight * scale);
                fullWidth += image.naturalWidth * scale;
            } else {
                maxHeight = Math.max(maxHeight, 24 * scale);
                fullWidth += 24 * scale;
            }
            fullWidth += labelWidth;
        }
        return { width: fullWidth, height: maxHeight };
    }

    private static renderResources(context: CanvasRenderingContext2D, state: State, x: number, y: number, scale: number = 1, labelWidth: number = 30) {
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        for (const resource in state.resources) {
            const resourceNumber = state.resources[resource];
            if (!resourceNumber) {
                continue;
            }

            const image = Renderer.resourceImages[resource];
            if (image) {
                context.drawImage(image, x, y, image.naturalWidth * scale, image.naturalHeight * scale);
                context.fillText(resourceNumber.toString(), x + (image?.naturalWidth ?? 0) * scale + labelWidth / 2, y + Math.max(0, image?.naturalHeight ?? 0) * scale / 2);
                x += (image?.naturalWidth ?? 0) * scale + labelWidth;
            } else {
                context.fillStyle = 'gray';
                context.fillRect(x, y, 24 * scale, 24 * scale);
                context.fillText(resourceNumber.toString(), x + 24 * scale + labelWidth / 2, y + 24 * scale / 2);
                x += 24 * scale + labelWidth;
            }
        }
    }
}

export function solveWithCondition<T>(value: WithCondition<T>[] | undefined, selectedConditions: ConditionItem[]): T | undefined {
    return value?.find(o => applyCondition(o.condition, selectedConditions))?.value;
}

export function solveWithConditionAsSet<T>(value: WithCondition<T>[] | undefined, selectedConditions: ConditionItem[]): T[] {
    return value?.filter(o => applyCondition(o.condition, selectedConditions)).map(o => o.value) ?? [];
}

function toColor(colorNum: number) {
    return '#' + padStart(colorNum.toString(16), 6, '0');
}

function toColorWithAlpha(colorNum: number, alpha: number) {
    const r = (colorNum >> 16) & 0xFF;
    const g = (colorNum >> 8) & 0xFF;
    const b = colorNum & 0xFF;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function findNearestPoints(start: Point | undefined, end: Point | undefined, a: Province, b: Province | undefined): [Point, Point] {
    if (start && end) { return [start, end]; }
    if (!b) { return [bboxCenter(a.boundingBox), bboxCenter(a.boundingBox)]; };
    if (!start) { const t = start, u = a; start = end; a = b; end = t; b = u; }
    if (!start) {
        let nearestPair: [Point, Point] | undefined = undefined;
        let nearestPairDistance = 1e10;
        for (const ape of a.edges) {
            for (const ap of ape.path) {
                for (const app of ap) {
                    for (const bpe of b.edges) {
                        for (const bp of bpe.path) {
                            for (const bpp of bp) {
                                const disSqr = distanceSqr(app, bpp);
                                if (disSqr < nearestPairDistance) {
                                    nearestPairDistance = disSqr;
                                    nearestPair = [app, bpp];
                                }
                            }
                        }
                    }
                }
            }
        }
        return nearestPair ?? [bboxCenter(a.boundingBox), bboxCenter(a.boundingBox)];
    } else {
        let nearestPair: [Point, Point] | undefined = undefined;
        let nearestPairDistance = 1e10;
        for (const bpe of b.edges) {
            for (const bp of bpe.path) {
                for (const bpp of bp) {
                    const disSqr = distanceSqr(start, bpp);
                    if (disSqr < nearestPairDistance) {
                        nearestPairDistance = disSqr;
                        nearestPair = [start, bpp];
                    }
                }
            }
        }
        return nearestPair ?? [bboxCenter(a.boundingBox), bboxCenter(a.boundingBox)];
    }
}

function getColorByColorSet(
    colorSet: ColorSet,
    province: Province,
    worldMap: FEWorldMap,
    renderContext: RenderContext
): number {
    const { provinceToState,
        provinceToStrategicRegion,
        stateToSupplyArea,
        topBar } = renderContext;
    switch (colorSet) {
        case 'provincetype':
            return (province.type === 'land' ? 0x007F00 : province.type === 'lake' ? 0x00FFFF : 0x00007F) | (province.coastal ? 0x7F0000 : 0);
        case 'owner':
            {
                const stateId = provinceToState[province.id];
                const owner = solveWithCondition(worldMap.getStateById(stateId)?.owner, renderContext.topBar.selectedConditions$.value);
                return worldMap.countries.find(c => c && c.tag === owner)?.color ?? defaultColor(province);
            }
        case 'controller':
            {
                const stateId = provinceToState[province.id];
                const state = worldMap.getStateById(stateId);
                const controller = solveWithCondition(state?.controller, renderContext.topBar.selectedConditions$.value) ??
                    solveWithCondition(state?.owner, renderContext.topBar.selectedConditions$.value);
                return worldMap.countries.find(c => c && c.tag === controller)?.color ?? defaultColor(province);
            }
        case 'statecategory':
            {
                const stateId = provinceToState[province.id];
                const state = worldMap.getStateById(stateId);
                return state?.categoryColor ?? defaultColor(province);
            }
        case 'terrain':
            {
                if (renderContext.extraState === undefined) {
                    renderContext.extraState = arrayToMap(worldMap.terrains, 'name');
                }

                const navalTerrain = province.type === 'land' ? undefined : worldMap.getStrategicRegionById(provinceToStrategicRegion[province.id])?.navalTerrain;
                return (renderContext.extraState as Record<string, Terrain | undefined>)[navalTerrain ?? province.terrain]?.color ?? 0;
            }
        case 'continent':
            if (renderContext.extraState === undefined) {
                let continent = 0;
                worldMap.forEachProvince(p => (p.continent > continent ? continent = p.continent : 0, false));
                renderContext.extraState = avoidPowerOf2(continent + 1);
            }
            return province.continent !== 0 ? valueAndMaxToColor(province.continent + 1, renderContext.extraState) : defaultColor(province);
        case 'stateid':
            {
                if (renderContext.extraState === undefined) {
                    renderContext.extraState = avoidPowerOf2(worldMap.statesCount);
                }
                const stateId = provinceToState[province.id];
                return stateId !== undefined ? valueAndMaxToColor(stateId < 0 ? 0 : stateId, renderContext.extraState) : defaultColor(province);
            }
        case 'warnings':
            {
                const isLand = province.type === 'land';
                const viewMode = topBar.viewMode$.value;
                const warningFilter = topBar.warningFilter.selectedValues$.value;
                const stateId = provinceToState[province.id];
                const state = worldMap.getStateById(stateId);
                const strategicRegion = worldMap.getStrategicRegionById(provinceToStrategicRegion[province.id]);
                const supplyAreaId = stateId ? stateToSupplyArea[stateId] : undefined;
                const supplyArea = worldMap.getSupplyAreaById(supplyAreaId);
                const warningIndex = renderContext.warningIndex;
                const hasWarning = warningIndex
                    ? (
                        (viewMode !== 'warnings' || warningFilter.includes('province')) &&
                            (warningIndex.provinceIds.has(province.id) || warningIndex.provinceColors.has(province.color)) ||
                        (viewMode !== 'warnings' || warningFilter.includes('state')) &&
                            state !== undefined && warningIndex.stateIds.has(state.id) ||
                        (viewMode !== 'warnings' || warningFilter.includes('strategicregion')) &&
                            strategicRegion !== undefined && warningIndex.strategicRegionIds.has(strategicRegion.id) ||
                        (viewMode !== 'warnings' || warningFilter.includes('supplyarea')) &&
                            supplyArea !== undefined && warningIndex.supplyAreaIds.has(supplyArea.id)
                    )
                    : worldMap.getProvinceWarnings(
                        viewMode !== "warnings" || warningFilter.includes('province') ? province : undefined,
                        viewMode !== "warnings" || warningFilter.includes('state') ? state : undefined,
                        viewMode !== "warnings" || warningFilter.includes('strategicregion') ? strategicRegion : undefined,
                        viewMode !== "warnings" || warningFilter.includes('supplyarea') ? supplyArea : undefined
                    ).length > 0;
                return hasWarning ?
                    (isLand ? landWarning : waterWarning) :
                    (isLand ? landNoWarning : waterNoWarning);
            }
        case 'manpower':
            {
                if (province.type === 'sea') {
                    return defaultColor(province);
                }

                if (renderContext.extraState === undefined) {
                    let maxManpower = 0;
                    worldMap.forEachState(state => (state.manpower > maxManpower ? maxManpower = state.manpower : 0, false));
                    renderContext.extraState = maxManpower;
                }

                const stateId = provinceToState[province.id];
                const state = worldMap.getStateById(stateId);
                const value = manpowerHandler(state?.manpower ?? 0) / manpowerHandler(renderContext.extraState);
                return valueToColorGYR(value);
            }
        case 'victorypoint':
            {
                if (renderContext.extraState === undefined) {
                    let maxVictoryPoint = 0;
                    worldMap.forEachState(state => Object.values(state.victoryPoints).forEach(
                        vp => vp !== undefined && vp > maxVictoryPoint ? maxVictoryPoint = vp: 0));
                    renderContext.extraState = maxVictoryPoint;
                }

                const stateId = provinceToState[province.id];
                const state = worldMap.getStateById(stateId);
                const value = victoryPointsHandler(state ? state.victoryPoints[province.id] ?? 0.1 : 0) / victoryPointsHandler(renderContext.extraState);
                return valueToColorGreyScale(value);
            }
        case 'resources':
            {
                if (province.type === 'sea') {
                    return defaultColor(province);
                }

                if (renderContext.extraState === undefined) {
                    let maxResources = 0;
                    worldMap.forEachState(state => {
                        const numResources = Object.values(state.resources).reduce<number>((p, c) => p + (c ?? 0), 0);
                        if (numResources > maxResources) {
                            maxResources = numResources;
                        }
                        return false;
                    });
                    renderContext.extraState = maxResources;
                }

                const stateId = provinceToState[province.id];
                const state = worldMap.getStateById(stateId);
                const numResources = state ? Object.values(state.resources).reduce<number>((p, c) => p + (c ?? 0), 0) : 0;
                const value = resourcesHandler(numResources) / resourcesHandler(renderContext.extraState);
                return valueToColorGYR(value);
            }
        case 'strategicregionid':
            {
                if (renderContext.extraState === undefined) {
                    renderContext.extraState = avoidPowerOf2(worldMap.strategicRegionsCount);
                }
                const strategicRegionId = provinceToStrategicRegion[province.id];
                return valueAndMaxToColor(strategicRegionId === undefined || strategicRegionId < 0 ? 0 : strategicRegionId, renderContext.extraState);
            }
        case 'supplyareaid':
            {
                if (renderContext.extraState === undefined) {
                    renderContext.extraState = avoidPowerOf2(worldMap.supplyAreasCount);
                }
                const stateId = provinceToState[province.id];
                const supplyAreaId = stateId !== undefined ? stateToSupplyArea[stateId] : undefined;
                return supplyAreaId !== undefined ? valueAndMaxToColor(supplyAreaId < 0 ? 0 : supplyAreaId, renderContext.extraState) : defaultColor(province);
            }
        case 'supplyvalue':
            {
                if (province.type === 'sea') {
                    return defaultColor(province);
                }

                if (renderContext.extraState === undefined) {
                    let maxSupplyValue = 0;
                    worldMap.forEachSupplyArea(supplyArea => (supplyArea.value > maxSupplyValue ? maxSupplyValue = supplyArea.value: 0, false));
                    renderContext.extraState = maxSupplyValue;
                }

                const stateId = provinceToState[province.id];
                const supplyAreaId = stateId ? stateToSupplyArea[stateId] : undefined;
                const supplyArea = worldMap.getSupplyAreaById(supplyAreaId);
                const value = (supplyArea?.value ?? 0) / (renderContext.extraState);
                return valueToColorGYR(value);
            }
        default:
            return province.color;
    }
}

function manpowerHandler(manpower: number): number {
    if (manpower < 0) {
        manpower = 0;
    }
    return Math.pow(manpower, 0.2);
}

function victoryPointsHandler(victoryPoints: number): number {
    if (victoryPoints < 0) {
        victoryPoints = 0;
    }
    return Math.pow(victoryPoints, 0.5);
}

function resourcesHandler(resources: number): number {
    if (resources < 0) {
        resources = 0;
    }
    return Math.pow(resources, 0.2);
}

function valueToColorRYG(value: number): number {
    return value < 0.5 ? (0xFF0000 | (Math.floor(255 * 2 * value) << 8)) : (0xFF00 | (Math.floor(255 * 2 * (1 - value)) << 16));
}

function valueToColorGYR(value: number): number {
    return value < 0.5 ? (0xFF00 | (Math.floor(255 * 2 * value) << 16)) : (0xFF0000 | (Math.floor(255 * 2 * (1 - value)) << 8));
}

function valueToColorBCG(value: number): number {
    return value < 0.5 ? (0xFF | (Math.floor(255 * 2 * value) << 8)) : (0xFF00 | Math.floor(255 * 2 * (1 - value)));
}

function valueToColorGreyScale(value: number): number {
    return Math.floor(value * 255) * 0x10101;
}

function valueAndMaxToColor(value: number, max: number): number {
    return Math.floor(value * (0xFFFFFF / max));
}

function getHighConstrastColor(color: number): number {
    const r = (color >> 16) & 0xFF;
    const g = (color >> 8) & 0xFF;
    const b = color & 0xFF;
    return r * 0.7 + g * 2 + b * 0.3 > 3 * 0x7F ? 0 : 0xFFFFFF;
}

function avoidPowerOf2(value: number): number {
    const v = Math.log2(value);
    if (v > 0 && (v >>> 0) === v) {
        return value + 1;
    }

    return value;
}

function isCriticalPoint(path: Point[], index: number): boolean {
    return index === 0 || index === path.length - 1 ||
        (distanceHamming(path[index], path[index - 1]) > 2 && distanceHamming(path[index], path[index + 1]) > 2);
}

function defaultColor(province: Province) {
    return province.type === 'land' ? 0 : 0x1010B0;
}

function toCommaDivideNumber(value: number): string {
    return value.toString(10).replace(/(?<!^)(\d{3})(?=(?:\d{3})*$)/g, ',$1');
}
