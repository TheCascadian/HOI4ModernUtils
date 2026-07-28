import { Province, River } from './definitions';

export interface SelectableWorldMap {
    width: number;
    rivers: River[];
    forEachProvince(callback: (province: Province) => boolean | void): void;
    getProvinceByPosition(x: number, y: number): Province | undefined;
}

export function selectProvinceIds(
    worldMap: SelectableWorldMap,
    predicate: (province: Province) => boolean
): Set<number> {
    const result = new Set<number>();
    worldMap.forEachProvince(province => {
        // Negative/zero IDs are loader-generated recovery records (for
        // example, an unmatched black BMP colour), not editable provinces.
        if (province.id > 0 && province.color !== 0 && predicate(province)) {
            result.add(province.id);
        }
    });
    return result;
}

export function forEachRiverPixel(
    river: River,
    callback: (x: number, y: number, color: number) => void
): void {
    const { x: originX, y: originY, w: riverWidth } = river.boundingBox;
    for (const key in river.colors) {
        const offset = Number(key);
        callback(
            originX + offset % riverWidth,
            originY + Math.floor(offset / riverWidth),
            river.colors[key]
        );
    }
}

/**
 * Rivers are bitmap features rather than province records. Return every
 * province containing at least one pixel from any loaded river.
 */
export function selectRiverProvinceIds(worldMap: SelectableWorldMap): Set<number> {
    const result = new Set<number>();

    for (const river of worldMap.rivers) {
        forEachRiverPixel(river, (x, y) => {
            const province = worldMap.getProvinceByPosition(x, y);
            if (province && province.id > 0 && province.color !== 0) {
                result.add(province.id);
            }
        });
    }

    return result;
}
