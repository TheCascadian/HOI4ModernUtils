import { PersistedProvince, Province, River } from './definitions';

export interface ClippedRiverOceanProvince extends PersistedProvince {
    riverId: number;
    strategicRegionId?: number;
    sourceProvinceIds: number[];
    pixelCount: number;
}

export interface ClippedRiverOceanEdit {
    paintedPixels: number[][];
    provinces: ClippedRiverOceanProvince[];
    skippedWaterPixels: number;
}

interface RiverPixelGroup {
    riverId: number;
    strategicRegionId?: number;
    pixels: Array<[number, number]>;
    sourceProvinceIds: Set<number>;
}

/**
 * Builds province-BMP edits from the exact rivers.bmp component pixels.
 *
 * Only pixels currently backed by land provinces are extracted. Existing
 * province definitions are never converted; each river/strategic-region
 * segment becomes a new ocean province instead.
 */
export function buildClippedRiverOceanEdit(
    width: number,
    height: number,
    colorByPosition: ArrayLike<number>,
    provinces: ReadonlyArray<Province | undefined | null>,
    rivers: readonly River[],
    selectedRiverIds: ReadonlySet<number>,
    strategicRegionByProvinceId: Readonly<Record<number, number | undefined>> = {}
): ClippedRiverOceanEdit {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0 ||
        colorByPosition.length !== width * height) {
        throw new Error('River conversion requires a complete province pixel map.');
    }

    const provinceByColor = new Map<number, Province>();
    const provinceById = new Map<number, Province>();
    const usedIds = new Set<number>();
    const usedColors = new Set<number>();
    for (const province of provinces) {
        if (!province || province.id <= 0 || province.color === 0) {
            continue;
        }
        provinceByColor.set(province.color, province);
        provinceById.set(province.id, province);
        usedIds.add(province.id);
        usedColors.add(province.color >>> 0);
    }

    const groups = new Map<string, RiverPixelGroup>();
    const claimedPixels = new Set<number>();
    const claimedPixelCountByProvinceId = new Map<number, number>();
    let skippedWaterPixels = 0;
    for (const riverId of Array.from(selectedRiverIds).sort((a, b) => a - b)) {
        const river = rivers[riverId];
        if (!river || river.boundingBox.w <= 0 || river.boundingBox.h <= 0) {
            continue;
        }
        for (const key of Object.keys(river.colors)) {
            const offset = Number(key);
            if (!Number.isInteger(offset) || offset < 0 ||
                offset >= river.boundingBox.w * river.boundingBox.h) {
                continue;
            }
            const x = river.boundingBox.x + offset % river.boundingBox.w;
            const y = river.boundingBox.y + Math.floor(offset / river.boundingBox.w);
            if (x < 0 || x >= width || y < 0 || y >= height) {
                continue;
            }
            const position = y * width + x;
            if (claimedPixels.has(position)) {
                continue;
            }
            const source = provinceByColor.get(colorByPosition[position]);
            if (!source || source.type.toLowerCase() !== 'land') {
                skippedWaterPixels++;
                continue;
            }
            claimedPixels.add(position);
            claimedPixelCountByProvinceId.set(
                source.id,
                (claimedPixelCountByProvinceId.get(source.id) ?? 0) + 1
            );
            const strategicRegionId = strategicRegionByProvinceId[source.id];
            const groupKey = `${riverId}:${strategicRegionId ?? 'unassigned'}`;
            let group = groups.get(groupKey);
            if (!group) {
                group = {
                    riverId,
                    strategicRegionId,
                    pixels: [],
                    sourceProvinceIds: new Set<number>(),
                };
                groups.set(groupKey, group);
            }
            group.pixels.push([x, y]);
            group.sourceProvinceIds.add(source.id);
        }
    }

    const emptiedProvinceIds = Array.from(claimedPixelCountByProvinceId)
        .filter(([provinceId, claimedPixelCount]) =>
            claimedPixelCount >= (provinceById.get(provinceId)?.mass ?? Number.MAX_SAFE_INTEGER)
        )
        .map(([provinceId]) => provinceId)
        .sort((a, b) => a - b);
    if (emptiedProvinceIds.length > 0) {
        throw new Error(
            `River conversion would remove every pixel from donor province(s): ${emptiedProvinceIds.join(', ')}.`
        );
    }

    const nextId = createPositiveAllocator(usedIds);
    const nextColor = createColorAllocator(usedColors);
    const paintedPixels: number[][] = [];
    const newProvinces: ClippedRiverOceanProvince[] = [];
    const sortedGroups = Array.from(groups.values()).sort((a, b) =>
        a.riverId - b.riverId ||
        (a.strategicRegionId ?? Number.MAX_SAFE_INTEGER) -
            (b.strategicRegionId ?? Number.MAX_SAFE_INTEGER)
    );
    for (const group of sortedGroups) {
        if (group.pixels.length === 0) {
            continue;
        }
        const id = nextId();
        const color = nextColor();
        for (const [x, y] of group.pixels) {
            paintedPixels.push([x, y, color]);
        }
        newProvinces.push({
            id,
            color,
            type: 'sea',
            coastal: false,
            terrain: 'ocean',
            continent: 0,
            riverId: group.riverId,
            strategicRegionId: group.strategicRegionId,
            sourceProvinceIds: Array.from(group.sourceProvinceIds).sort((a, b) => a - b),
            pixelCount: group.pixels.length,
        });
    }

    return { paintedPixels, provinces: newProvinces, skippedWaterPixels };
}

function createPositiveAllocator(used: Set<number>): () => number {
    let candidate = Math.max(0, ...used) + 1;
    return () => {
        while (used.has(candidate)) {
            candidate++;
        }
        const result = candidate;
        used.add(result);
        candidate++;
        return result;
    };
}

function createColorAllocator(used: Set<number>): () => number {
    let candidate = Math.max(0, ...used);
    return () => {
        for (let checked = 0; checked < 0xFFFFFF; checked++) {
            candidate = candidate >= 0xFFFFFF ? 1 : candidate + 1;
            if (!used.has(candidate)) {
                used.add(candidate);
                return candidate;
            }
        }
        throw new Error('No unused RGB province color is available for the clipped river.');
    };
}
