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
}

export function getBrushBounds(value: number): BrushBounds {
    const size = Math.max(1, Math.min(9, Math.floor(Number.isFinite(value) ? value : 1)));
    const startOffset = Math.floor((size - 1) / 2) * -1 || 0;
    return {
        size,
        startOffset,
        endOffset: startOffset + size - 1,
    };
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
 * Apply a complete sampled/interpolated stroke with one draft-map clone.
 * Callers can then publish one observable update for the whole pointer event.
 */
export function applyBrushStroke(
    originalPixels: ReadonlyMap<string, number>,
    world: BrushStrokeWorld,
    options: BrushStrokeOptions
): BrushStrokeResult {
    const pixels = new Map(originalPixels);
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
                    changed = pixels.delete(key) || changed;
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
                changed = true;
            }
        }
    }

    return { changed, pixels };
}
