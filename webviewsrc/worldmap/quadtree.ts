import { Zone } from './definitions';

export interface SpatialItem<T> {
    bounds: Zone;
    value: T;
}
function intersects(a: Zone, b: Zone): boolean {
    return a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y;
}

/**
 * Immutable-after-build quadtree used by the renderer. Items that cross a
 * child boundary remain in the parent so each item is stored exactly once.
 */
export class Quadtree<T> {
    private items: SpatialItem<T>[] = [];
    private children: Quadtree<T>[] | undefined;

    constructor(
        private readonly bounds: Zone,
        private readonly maxItems: number = 24,
        private readonly maxDepth: number = 9,
        private readonly depth: number = 0,
    ) {
    }

    public insert(item: SpatialItem<T>): void {
        if (!intersects(this.bounds, item.bounds)) {
            return;
        }

        if (this.children) {
            const child = this.containingChild(item.bounds);
            if (child) {
                child.insert(item);
                return;
            }
        }

        this.items.push(item);
        if (!this.children && this.items.length > this.maxItems && this.depth < this.maxDepth) {
            this.split();
        }
    }

    public query(area: Zone, output: T[] = []): T[] {
        if (!intersects(this.bounds, area)) {
            return output;
        }

        for (const item of this.items) {
            if (intersects(item.bounds, area)) {
                output.push(item.value);
            }
        }
        if (this.children) {
            for (const child of this.children) {
                child.query(area, output);
            }
        }
        return output;
    }

    public clear(): void {
        this.items.length = 0;
        this.children = undefined;
    }

    private split(): void {
        const halfWidth = this.bounds.w / 2;
        const halfHeight = this.bounds.h / 2;
        const x = this.bounds.x;
        const y = this.bounds.y;
        this.children = [
            new Quadtree({ x, y, w: halfWidth, h: halfHeight }, this.maxItems, this.maxDepth, this.depth + 1),
            new Quadtree({ x: x + halfWidth, y, w: halfWidth, h: halfHeight }, this.maxItems, this.maxDepth, this.depth + 1),
            new Quadtree({ x, y: y + halfHeight, w: halfWidth, h: halfHeight }, this.maxItems, this.maxDepth, this.depth + 1),
            new Quadtree({ x: x + halfWidth, y: y + halfHeight, w: halfWidth, h: halfHeight }, this.maxItems, this.maxDepth, this.depth + 1),
        ];

        const retained: SpatialItem<T>[] = [];
        for (const item of this.items) {
            const child = this.containingChild(item.bounds);
            if (child) {
                child.insert(item);
            } else {
                retained.push(item);
            }
        }
        this.items = retained;
    }

    private containingChild(bounds: Zone): Quadtree<T> | undefined {
        return this.children?.find(child =>
            bounds.x >= child.bounds.x &&
            bounds.y >= child.bounds.y &&
            bounds.x + bounds.w <= child.bounds.x + child.bounds.w &&
            bounds.y + bounds.h <= child.bounds.y + child.bounds.h
        );
    }
}
