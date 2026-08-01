export interface BrushBounds {
    size: number;
    startOffset: number;
    endOffset: number;
}

export interface BrushPoint {
    x: number;
    y: number;
}

export interface BrushStrokeWorld {
    width: number;
    height: number;
    getColorAt(x: number, y: number): number | undefined;
    getProvinceIdAt(x: number, y: number): number | undefined;
    getProvinceTypeAt(x: number, y: number): string | undefined;
}

export interface BrushStrokeOptions {
    positions: readonly BrushPoint[];
    size: number;
    color: number;
    tool: 'brush' | 'erase';
    sourceProvinceType: string;
    allowedProvinceIds?: ReadonlySet<number>;
}

export interface BrushStrokeResult {
    changed: boolean;
    pixels: Map<string, number>;
    delta?: Map<string, number | undefined>;
}

export const MAX_BRUSH_SIZE = 512;

export function getBrushBounds(value: number): BrushBounds {
    const size = Math.max(1, Math.min(MAX_BRUSH_SIZE, Math.floor(Number.isFinite(value) ? value : 1)));
    const startOffset = Math.floor((size - 1) / 2) * -1 || 0;
    return {
        size,
        startOffset,
        endOffset: startOffset + size - 1,
    };
}

export interface LassoAssignmentOptions {
    points: readonly BrushPoint[];
    color: number;
    sourceProvinceType: string;
    inverted: boolean;
    allowedProvinceIds?: ReadonlySet<number>;
}

function pointInPolygon(x: number, y: number, points: readonly BrushPoint[]): boolean {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const a = points[i];
        const b = points[j];
        const crosses = (a.y > y) !== (b.y > y);
        if (crosses && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) {
            inside = !inside;
        }
    }
    return inside;
}

/**
 * Stage every same-type map pixel inside or outside a freehand polygon.
 * Polygon tests use pixel centers. Pixels already belonging to the target,
 * invalid background pixels, and land/water type mismatches are left intact.
 */
export function applyLassoAssignment(
    originalPixels: ReadonlyMap<string, number>,
    world: BrushStrokeWorld,
    options: LassoAssignmentOptions
): BrushStrokeResult {
    if (options.points.length < 3 || world.width <= 0 || world.height <= 0) {
        return { changed: false, pixels: new Map(originalPixels) };
    }

    const polygon: BrushPoint[] = [{ ...options.points[0] }];
    let crossesWorldSeam = false;
    for (let i = 1; i < options.points.length; i++) {
        const previous = polygon[i - 1];
        let x = options.points[i].x;
        while (x - previous.x > world.width / 2) {
            x -= world.width;
            crossesWorldSeam = true;
        }
        while (x - previous.x < -world.width / 2) {
            x += world.width;
            crossesWorldSeam = true;
        }
        polygon.push({ x, y: options.points[i].y });
    }

    const pixels = new Map(originalPixels);
    const allowedProvinceIds = options.allowedProvinceIds;
    const hasClamp = !!allowedProvinceIds && allowedProvinceIds.size > 0;
    const minX = options.inverted || crossesWorldSeam ? 0 : Math.max(0, Math.floor(Math.min(...polygon.map(point => point.x))));
    const maxX = options.inverted || crossesWorldSeam ? world.width - 1 : Math.min(world.width - 1, Math.ceil(Math.max(...polygon.map(point => point.x))));
    const minY = options.inverted ? 0 : Math.max(0, Math.floor(Math.min(...polygon.map(point => point.y))));
    const maxY = options.inverted ? world.height - 1 : Math.min(world.height - 1, Math.ceil(Math.max(...polygon.map(point => point.y))));
    const polygonCenterX = polygon.reduce((sum, point) => sum + point.x, 0) / polygon.length;
    let changed = false;

    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            const canonicalCenterX = x + 0.5;
            const wrappedCenterX = canonicalCenterX +
                Math.round((polygonCenterX - canonicalCenterX) / world.width) * world.width;
            const selected = pointInPolygon(wrappedCenterX, y + 0.5, polygon);
            if (selected === options.inverted) {
                continue;
            }
            const currentColor = world.getColorAt(x, y);
            if (currentColor === undefined || currentColor === 0 || currentColor === options.color) {
                continue;
            }
            if (hasClamp && !allowedProvinceIds!.has(world.getProvinceIdAt(x, y) ?? 0)) {
                continue;
            }
            const provinceType = world.getProvinceTypeAt(x, y);
            if (provinceType !== undefined && provinceType !== options.sourceProvinceType) {
                continue;
            }
            pixels.set(`${x},${y}`, options.color);
            changed = true;
        }
    }

    return { changed, pixels };
}

export function adjustBrushSizeForWheel(currentSize: number, deltaY: number): number {
    if (deltaY === 0) {
        return getBrushBounds(currentSize).size;
    }
    return getBrushBounds(currentSize + (deltaY < 0 ? 1 : -1)).size;
}

function distanceToSegment(point: BrushPoint, start: BrushPoint, end: BrushPoint): number {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    if (dx === 0 && dy === 0) {
        return Math.hypot(point.x - start.x, point.y - start.y);
    }
    const t = Math.max(0, Math.min(1,
        ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)
    ));
    return Math.hypot(
        point.x - (start.x + t * dx),
        point.y - (start.y + t * dy)
    );
}

/**
 * Collapse freehand lasso samples onto exact straight segments whenever every
 * intermediate sample stays within the configured map-pixel snapping radius.
 */
export function snapLassoPoints(
    points: readonly BrushPoint[],
    radius: number,
    mapWidth?: number
): BrushPoint[] {
    const tolerance = Math.max(0, Number.isFinite(radius) ? radius : 0);
    const workingPoints = points.map(point => ({ ...point }));
    if (mapWidth && mapWidth > 0) {
        for (let i = 1; i < workingPoints.length; i++) {
            while (workingPoints[i].x - workingPoints[i - 1].x > mapWidth / 2) {
                workingPoints[i].x -= mapWidth;
            }
            while (workingPoints[i].x - workingPoints[i - 1].x < -mapWidth / 2) {
                workingPoints[i].x += mapWidth;
            }
        }
    }
    if (points.length <= 2 || tolerance === 0) {
        return workingPoints.map(point => ({
            x: mapWidth ? ((point.x % mapWidth) + mapWidth) % mapWidth : point.x,
            y: point.y,
        }));
    }

    const keep = new Uint8Array(points.length);
    keep[0] = 1;
    keep[points.length - 1] = 1;
    const pending: Array<[number, number]> = [[0, points.length - 1]];

    while (pending.length > 0) {
        const [startIndex, endIndex] = pending.pop()!;
        let furthestIndex = -1;
        let furthestDistance = tolerance;
        for (let i = startIndex + 1; i < endIndex; i++) {
            const distance = distanceToSegment(workingPoints[i], workingPoints[startIndex], workingPoints[endIndex]);
            if (distance > furthestDistance) {
                furthestDistance = distance;
                furthestIndex = i;
            }
        }
        if (furthestIndex >= 0) {
            keep[furthestIndex] = 1;
            pending.push([startIndex, furthestIndex], [furthestIndex, endIndex]);
        }
    }

    return workingPoints.filter((_, index) => keep[index] === 1).map(point => ({
        x: mapWidth ? ((point.x % mapWidth) + mapWidth) % mapWidth : point.x,
        y: point.y,
    }));
}

/**
 * Return every map position needed for a gap-free stroke. Horizontal motion
 * follows the shorter path across the world-wrap seam.
 */
export function getInterpolatedBrushPositions(
    previous: BrushPoint | undefined,
    current: BrushPoint,
    mapWidth: number,
    maxSteps = 512
): BrushPoint[] {
    if (!previous || mapWidth <= 0) {
        return [{ ...current }];
    }

    let dx = current.x - previous.x;
    if (dx > mapWidth / 2) {
        dx -= mapWidth;
    } else if (dx < -mapWidth / 2) {
        dx += mapWidth;
    }
    const dy = current.y - previous.y;
    const steps = Math.min(
        Math.max(Math.abs(dx), Math.abs(dy)),
        Math.max(1, Math.floor(maxSteps))
    );

    if (steps <= 1) {
        return [{ ...current }];
    }

    const positions: BrushPoint[] = [];
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        positions.push({
            x: ((Math.round(previous.x + dx * t) % mapWidth) + mapWidth) % mapWidth,
            y: Math.round(previous.y + dy * t),
        });
    }
    return positions;
}

/**
 * Apply a sampled/interpolated stroke in place and return only this event's
 * changed keys. Stroke-level history owns the one full snapshot needed for
 * undo, so cloning the accumulated draft here would make a stroke quadratic.
 */
export function applyBrushStroke(
    pixels: Map<string, number>,
    world: BrushStrokeWorld,
    options: BrushStrokeOptions
): BrushStrokeResult {
    const delta = new Map<string, number | undefined>();
    const bounds = getBrushBounds(options.size);
    const allowedProvinceIds = options.allowedProvinceIds;
    const hasClamp = !!allowedProvinceIds && allowedProvinceIds.size > 0;
    let changed = false;

    for (const position of options.positions) {
        for (let dy = bounds.startOffset; dy <= bounds.endOffset; dy++) {
            for (let dx = bounds.startOffset; dx <= bounds.endOffset; dx++) {
                const y = position.y + dy;
                if (y < 0 || y >= world.height) {
                    continue;
                }

                const x = ((position.x + dx) % world.width + world.width) % world.width;
                const key = `${x},${y}`;
                if (options.tool === 'erase') {
                    if (pixels.delete(key)) {
                        delta.set(key, undefined);
                        changed = true;
                    }
                    continue;
                }

                if (pixels.get(key) === options.color) {
                    continue;
                }
                const currentColor = world.getColorAt(x, y);
                if (currentColor === undefined || currentColor === 0 || currentColor === options.color) {
                    continue;
                }
                if (hasClamp && !allowedProvinceIds!.has(world.getProvinceIdAt(x, y) ?? 0)) {
                    continue;
                }
                const targetType = world.getProvinceTypeAt(x, y);
                if (targetType !== undefined && targetType !== options.sourceProvinceType) {
                    continue;
                }

                pixels.set(key, options.color);
                delta.set(key, options.color);
                changed = true;
            }
        }
    }

    return { changed, pixels, delta };
}
