import { Province, River } from './definitions';

export interface SelectableWorldMap {
    width: number;
    rivers: River[];
    forEachProvince(callback: (province: Province) => boolean | void): void;
    getProvinceByPosition(x: number, y: number): Province | undefined;
}

export interface EditableProvinceLookup {
    getProvinceById(provinceId: number): Province | undefined;
}

export function isPersistableProvinceDefinition(
    province: Pick<Province, 'id' | 'color'>
): boolean {
    return province.id > 0 && province.color !== 0;
}

export function normalizeEditableProvinceIds(
    worldMap: EditableProvinceLookup,
    provinceIds: Iterable<number>
): number[] {
    const result: number[] = [];
    const seen = new Set<number>();
    for (const id of provinceIds) {
        if (seen.has(id)) {
            continue;
        }
        const province = worldMap.getProvinceById(id);
        if (!province || !isPersistableProvinceDefinition(province)) {
            continue;
        }
        seen.add(id);
        result.push(id);
    }
    return result;
}

export interface ProvinceSelectionSnapshot {
    provinceIds: Set<number>;
    riverIds: Set<number>;
}

export class ProvinceSelectionHistory {
    private readonly undoStack: ProvinceSelectionSnapshot[] = [];
    private readonly redoStack: ProvinceSelectionSnapshot[] = [];

    constructor(private readonly limit = 200) {}

    public record(current: ProvinceSelectionSnapshot): void {
        this.undoStack.push(this.clone(current));
        while (this.undoStack.length > this.limit) {
            this.undoStack.shift();
        }
        this.redoStack.length = 0;
    }

    public undo(current: ProvinceSelectionSnapshot): ProvinceSelectionSnapshot | undefined {
        const previous = this.undoStack.pop();
        if (!previous) {
            return undefined;
        }
        this.redoStack.push(this.clone(current));
        return this.clone(previous);
    }

    public redo(current: ProvinceSelectionSnapshot): ProvinceSelectionSnapshot | undefined {
        const next = this.redoStack.pop();
        if (!next) {
            return undefined;
        }
        this.undoStack.push(this.clone(current));
        return this.clone(next);
    }

    public clearRedo(): void {
        this.redoStack.length = 0;
    }

    private clone(snapshot: ProvinceSelectionSnapshot): ProvinceSelectionSnapshot {
        return {
            provinceIds: new Set(snapshot.provinceIds),
            riverIds: new Set(snapshot.riverIds),
        };
    }
}

export function selectProvinceIds(
    worldMap: SelectableWorldMap,
    predicate: (province: Province) => boolean
): Set<number> {
    const result = new Set<number>();
    worldMap.forEachProvince(province => {
        // Negative/zero IDs are loader-generated recovery records (for
        // example, an unmatched black BMP colour), not editable provinces.
        if (isPersistableProvinceDefinition(province) && predicate(province)) {
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
