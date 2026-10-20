import { BehaviorSubject } from 'rxjs';
import { BuildingDef, MapBuilding, WorldMapMessage } from '../../src/previewdef/worldmap/definitions';
import { feLocalize } from '../util/i18n';
import { vscode } from '../util/vscode';
import { FEWorldMap, Loader } from './loader';
import { ViewPoint } from './viewpoint';

export type BuildingEditMode = 'place' | 'erase';
export type BuildingSaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'failed';
export type BuildingLoadState = 'idle' | 'loading' | 'ready' | 'failed';

export interface BuildingEditorHooks {
    status(text: string, tone?: 'info' | 'warn'): void;
    refreshMap(): void;
    /** States shown by selection: selected states plus every state of the selected country. */
    scopeStateIds(): ReadonlySet<number>;
    isBusy(): boolean;
}

const MAX_UNDO = 200;
const SAVE_DELAY_MS = 450;
const SAVE_TIMEOUT_MS = 20000;
const ERASE_RADIUS_PX = 14;
const LAND_HEIGHT = 11;
const PORT_HEIGHT = 9.55;
/** Buildings without a model on the map. */
const HIDDEN_BUILDINGS = new Set(['infrastructure']);

function cloneBuildings(buildings: readonly MapBuilding[]): MapBuilding[] {
    return buildings.map(building => ({ ...building }));
}

/** Stable color for a building id, so a type always looks the same. */
function buildingColor(id: string): string {
    let hash = 7;
    for (let i = 0; i < id.length; i++) {
        hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    }
    return `hsl(${hash % 360}, 68%, 52%)`;
}

function buildingBadge(id: string): string {
    const words = id.split('_').filter(word => word.length > 0);
    if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }
    return id.slice(0, 2).toUpperCase();
}

/**
 * Places buildings in map/buildings.txt by clicking the map. Works with every
 * building in common/buildings, including ones the mod adds itself.
 */
export class BuildingEditor {
    public readonly active$ = new BehaviorSubject<boolean>(false);
    public readonly revision$ = new BehaviorSubject<number>(0);

    public mode: BuildingEditMode = 'place';
    public selectedId = '';
    /** Degrees, clockwise on the map in 45 degree steps. */
    public rotationDegrees = 0;
    /** Fixed height (Y); undefined picks one automatically. */
    public height: number | undefined;
    public filter = '';
    public defs: BuildingDef[] = [];
    public loadState: BuildingLoadState = 'idle';
    public loadError = '';
    public saveState: BuildingSaveState = 'idle';
    public saveError = '';
    public lastPlacement = '';
    /** Experimental: draw every building on the whole map. */
    public showAll = false;

    private placed: MapBuilding[] = [];
    private undoStack: MapBuilding[][] = [];
    private redoStack: MapBuilding[][] = [];
    private hoverX: number | undefined;
    private hoverY: number | undefined;
    private saveTimer: ReturnType<typeof setTimeout> | undefined;
    private saveTimeout: ReturnType<typeof setTimeout> | undefined;
    private latestRequestId: string | undefined;
    private requestSequence = 0;

    constructor(private loader: Loader, private viewPoint: ViewPoint, private hooks: BuildingEditorHooks) {
        window.addEventListener('message', event => this.onMessage(event.data as WorldMapMessage));
    }

    private get worldMap(): FEWorldMap {
        return this.loader.worldMap;
    }

    public get placedCount(): number {
        return this.placed.length;
    }

    public canUndo(): boolean {
        return this.undoStack.length > 0;
    }

    public canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    public getDef(id: string): BuildingDef | undefined {
        return this.defs.find(def => def.id === id);
    }

    /** Definitions that pass the search box. */
    public visibleDefs(): BuildingDef[] {
        const needle = this.filter.trim().toLowerCase();
        return this.defs.filter(def => needle === '' || def.id.toLowerCase().includes(needle));
    }

    public countOf(id: string): number {
        return this.placed.reduce((sum, building) => sum + (building.id === id ? 1 : 0), 0);
    }

    // ---------------------------------------------------------------- lifecycle

    public toggle(): boolean {
        return this.active$.value ? this.deactivate() : this.activate();
    }

    public activate(): boolean {
        if (this.active$.value) {
            return true;
        }
        if (this.loader.loading$.value || !this.worldMap || this.worldMap.provincesCount <= 0) {
            this.hooks.status(feLocalize('worldmap.building.notready', 'Wait for the map to finish loading first.'), 'warn');
            return false;
        }
        if (this.hooks.isBusy()) {
            this.hooks.status(feLocalize('worldmap.building.busy', 'Finish or cancel the current province edit first.'), 'warn');
            return false;
        }
        this.undoStack = [];
        this.redoStack = [];
        this.mode = 'place';
        this.saveState = 'idle';
        this.saveError = '';
        this.lastPlacement = '';
        this.loadState = 'loading';
        this.loadError = '';
        vscode.postMessage<WorldMapMessage>({ command: 'requestbuildings' });
        this.active$.next(true);
        this.changed();
        return true;
    }

    public deactivate(): boolean {
        if (!this.active$.value) {
            return true;
        }
        this.flushSave();
        this.hoverX = this.hoverY = undefined;
        this.active$.next(false);
        this.changed();
        return true;
    }

    private changed(): void {
        this.revision$.next(this.revision$.value + 1);
    }

    // ---------------------------------------------------------------- settings

    public setMode(mode: BuildingEditMode): void {
        this.mode = mode;
        this.changed();
    }

    public setSelected(id: string): void {
        this.selectedId = id;
        this.changed();
    }

    public setFilter(text: string): void {
        this.filter = text;
        const visible = this.visibleDefs();
        if (visible.length > 0 && !visible.some(def => def.id === this.selectedId)) {
            this.selectedId = visible[0].id;
        }
        this.changed();
    }

    public rotate(stepDegrees: number): void {
        this.rotationDegrees = (((this.rotationDegrees + stepDegrees) % 360) + 360) % 360;
        this.changed();
    }

    public setHeight(value: number | undefined): void {
        this.height = value !== undefined && Number.isFinite(value) ? value : undefined;
        this.changed();
    }

    public setShowAll(value: boolean): void {
        this.showAll = value;
        this.changed();
    }

    public setHover(x: number | undefined, y: number | undefined): void {
        if (this.hoverX === x && this.hoverY === y) {
            return;
        }
        this.hoverX = x;
        this.hoverY = y;
        this.changed();
    }

    // ---------------------------------------------------------------- placing

    /** Works out where a building of the given type would go for a click at x, y. */
    private plan(def: BuildingDef, x: number, y: number, provinceId: number | undefined):
        { entry: MapBuilding; owner: string } | { error: string } {
        const worldMap = this.worldMap;
        const province = provinceId === undefined ? undefined : worldMap.getProvinceById(provinceId);
        if (!province) {
            return { error: feLocalize('worldmap.building.noprovince', 'Click inside a province.') };
        }
        if (province.type !== 'land') {
            return { error: feLocalize('worldmap.building.notland', 'Buildings go on land provinces.') };
        }
        let ownerId = province.id;
        let ownerLabel = feLocalize('worldmap.building.owner.province', 'province {0}', province.id);
        if (!def.provinceBased) {
            const state = worldMap.getStateByProvinceId(province.id);
            if (!state) {
                return { error: feLocalize('worldmap.building.nostate', 'Province {0} belongs to no state.', province.id) };
            }
            ownerId = state.id;
            ownerLabel = feLocalize('worldmap.building.owner.state', 'state {0}', state.id);
        }

        let seaProvince = 0;
        let rotation = this.rotationDegrees * Math.PI / 180;
        if (def.isPort) {
            let best: { id: number; distance: number } | undefined;
            for (const edge of province.edges) {
                const neighbor = worldMap.getProvinceById(edge.to);
                if (!neighbor || neighbor.type !== 'sea' || edge.type === 'impassable') {
                    continue;
                }
                const distance = Math.hypot(neighbor.centerOfMass.x - x, neighbor.centerOfMass.y - y);
                if (!best || distance < best.distance) {
                    best = { id: neighbor.id, distance };
                }
            }
            if (!best) {
                return { error: feLocalize('worldmap.building.noport', 'Province {0} has no adjacent sea province.', province.id) };
            }
            seaProvince = best.id;
            const sea = worldMap.getProvinceById(best.id)!;
            rotation = Math.atan2(sea.centerOfMass.x - x, -(sea.centerOfMass.y - y));
        }

        let height = this.height;
        if (height === undefined) {
            height = def.isPort ? PORT_HEIGHT : this.neighborHeight(ownerId, def.provinceBased) ?? LAND_HEIGHT;
        }
        return {
            entry: {
                owner: ownerId,
                id: def.id,
                x: x + 0.5,
                y: height,
                z: worldMap.height - (y + 0.5),
                rotation,
                seaProvince,
            },
            owner: ownerLabel,
        };
    }

    /** Height of the buildings already in the same state, which follows the local terrain. */
    private neighborHeight(ownerId: number, provinceBased: boolean): number | undefined {
        const heights = this.placed
            .filter(building => building.owner === ownerId && building.seaProvince === 0 && !provinceBased)
            .map(building => building.y)
            .sort((a, b) => a - b);
        return heights.length > 0 ? heights[Math.floor(heights.length / 2)] : undefined;
    }

    public handleClick(x: number, y: number, provinceId: number | undefined, e: MouseEvent): void {
        if (this.loadState !== 'ready') {
            this.hooks.status(feLocalize('worldmap.building.notloaded', 'Building definitions are still loading.'), 'warn');
            return;
        }
        if (this.mode === 'erase' || e.shiftKey) {
            this.eraseAt(x, y);
            return;
        }
        const def = this.getDef(this.selectedId);
        if (!def) {
            this.hooks.status(feLocalize('worldmap.building.nochoice', 'Choose a building first.'), 'warn');
            return;
        }
        const result = this.plan(def, x, y, provinceId);
        if ('error' in result) {
            this.hooks.status(result.error, 'warn');
            return;
        }
        this.commit(() => this.placed.push(result.entry));
        this.lastPlacement = feLocalize('worldmap.building.placed', 'Placed {0} in {1}.', def.id, result.owner);
        this.hooks.status(this.lastPlacement);
    }

    private eraseAt(x: number, y: number): void {
        const width = this.worldMap.width;
        const height = this.worldMap.height;
        const scale = this.viewPoint.scale;
        const hoverProvince = this.worldMap.getProvinceByPosition(x, y);
        const owners = this.showAll ? undefined : this.visibleOwners(hoverProvince?.id);
        let bestIndex = -1;
        let bestDistance = ERASE_RADIUS_PX / Math.max(scale, 0.0001);
        this.placed.forEach((building, index) => {
            if (owners && !owners.has(building.owner)) {
                return;
            }
            const bx = building.x;
            const by = height - building.z;
            for (const offset of [-width, 0, width]) {
                const distance = Math.hypot(bx + offset - x, by - y);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestIndex = index;
                }
            }
        });
        if (bestIndex < 0) {
            this.hooks.status(feLocalize('worldmap.building.nothinghere', 'No building here. Click directly on a marker to erase it.'));
            return;
        }
        const removed = this.placed[bestIndex];
        this.commit(() => this.placed.splice(bestIndex, 1));
        this.lastPlacement = feLocalize('worldmap.building.erased', 'Erased {0}.', removed.id);
        this.hooks.status(this.lastPlacement);
    }

    public clearType(): void {
        const id = this.selectedId;
        if (!id || this.countOf(id) === 0) {
            return;
        }
        const count = this.countOf(id);
        if (!window.confirm(feLocalize('worldmap.building.cleartype.confirm', 'Remove all {0} placed {1} entries? This can be undone.', count, id))) {
            return;
        }
        this.commit(() => {
            this.placed = this.placed.filter(building => building.id !== id);
        });
        this.hooks.status(feLocalize('worldmap.building.cleartype.done', 'Removed {0} {1} entries.', count, id));
    }

    // ---------------------------------------------------------------- history

    private commit(mutate: () => void): void {
        this.undoStack.push(cloneBuildings(this.placed));
        if (this.undoStack.length > MAX_UNDO) {
            this.undoStack.shift();
        }
        this.redoStack = [];
        mutate();
        this.scheduleSave();
        this.changed();
    }

    public undo(): boolean {
        const previous = this.undoStack.pop();
        if (!previous) {
            return false;
        }
        this.redoStack.push(cloneBuildings(this.placed));
        this.placed = previous;
        this.scheduleSave();
        this.changed();
        return true;
    }

    public redo(): boolean {
        const next = this.redoStack.pop();
        if (!next) {
            return false;
        }
        this.undoStack.push(cloneBuildings(this.placed));
        this.placed = next;
        this.scheduleSave();
        this.changed();
        return true;
    }

    public handleKey(e: KeyboardEvent): boolean {
        const key = e.key.toLowerCase();
        if ((e.ctrlKey || e.metaKey) && !e.altKey) {
            if (key === 'z' && !e.shiftKey) {
                this.undo() || this.hooks.status(feLocalize('worldmap.building.nothingundo', 'No building edits to undo.'));
                return true;
            }
            if (key === 'y' || (key === 'z' && e.shiftKey)) {
                this.redo() || this.hooks.status(feLocalize('worldmap.building.nothingredo', 'No building edits to redo.'));
                return true;
            }
            return false;
        }
        if (e.altKey || e.metaKey) {
            return false;
        }
        switch (key) {
            case 'escape':
                this.deactivate();
                return true;
            case 'p':
                this.setMode('place');
                return true;
            case 'x':
                this.setMode('erase');
                return true;
            case '[':
                this.rotate(-45);
                return true;
            case ']':
                this.rotate(45);
                return true;
        }
        return false;
    }

    // ---------------------------------------------------------------- saving

    private scheduleSave(): void {
        this.saveState = 'dirty';
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }
        this.saveTimer = setTimeout(() => this.sendSave(), SAVE_DELAY_MS);
    }

    private flushSave(): void {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
            this.saveTimer = undefined;
            this.sendSave();
        }
    }

    public retrySave(): void {
        if (this.saveState === 'failed') {
            this.sendSave();
        }
    }

    private sendSave(): void {
        this.saveTimer = undefined;
        const requestId = `mapbuildings-${Date.now()}-${++this.requestSequence}`;
        this.latestRequestId = requestId;
        this.saveState = 'saving';
        vscode.postMessage<WorldMapMessage>({
            command: 'persistmapbuildings',
            requestId,
            buildings: cloneBuildings(this.placed),
        });
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        this.saveTimeout = setTimeout(() => {
            if (this.latestRequestId === requestId && this.saveState === 'saving') {
                this.saveState = 'failed';
                this.saveError = feLocalize('worldmap.building.savetimeout', 'Saving took too long.');
                this.changed();
            }
        }, SAVE_TIMEOUT_MS);
        this.changed();
    }

    private onMessage(message: WorldMapMessage): void {
        if (message?.command === 'buildings') {
            if (message.error) {
                this.loadState = 'failed';
                this.loadError = message.error;
            } else {
                this.defs = message.defs.filter(def => !HIDDEN_BUILDINGS.has(def.id));
                this.placed = cloneBuildings(message.placed);
                this.loadState = 'ready';
                if (!this.getDef(this.selectedId)) {
                    this.selectedId = this.defs[0]?.id ?? '';
                }
            }
            this.changed();
            return;
        }
        if (message?.command !== 'persistmapbuildingsresult' || message.requestId !== this.latestRequestId) {
            return;
        }
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = undefined;
        }
        if (message.success) {
            this.saveState = this.saveTimer ? 'dirty' : 'saved';
            this.saveError = '';
        } else {
            this.saveState = 'failed';
            this.saveError = message.error ?? feLocalize('worldmap.building.savefailed', 'Saving failed.');
            this.hooks.status(this.saveError, 'warn');
        }
        this.changed();
    }

    // ---------------------------------------------------------------- drawing

    private drawMarker(
        context: CanvasRenderingContext2D,
        sx: number, sy: number, radius: number,
        id: string, rotation: number, alpha: number, ring: string
    ): void {
        context.save();
        context.globalAlpha = alpha;
        context.translate(sx, sy);

        // Small facing pointer, drawn under the disc.
        context.save();
        context.rotate(rotation);
        context.beginPath();
        context.moveTo(0, -radius - 4);
        context.lineTo(-radius * 0.5, -radius + 1);
        context.lineTo(radius * 0.5, -radius + 1);
        context.closePath();
        context.fillStyle = 'rgba(20, 22, 28, 0.9)';
        context.fill();
        context.restore();

        context.beginPath();
        context.arc(0, 0, radius, 0, Math.PI * 2);
        context.fillStyle = buildingColor(id);
        context.fill();
        context.lineWidth = 1.5;
        context.strokeStyle = ring;
        context.stroke();

        if (radius >= 9) {
            context.fillStyle = '#fff';
            context.font = `700 ${Math.round(radius * 0.9)}px sans-serif`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(buildingBadge(id), 0, 0.5);
        }
        context.restore();
    }

    /** Owner ids (states and their provinces) whose buildings are drawn. */
    private visibleOwners(hoverProvinceId: number | undefined): Set<number> {
        const owners = new Set<number>();
        const stateIds = new Set(this.hooks.scopeStateIds());
        const hovered = hoverProvinceId === undefined ? undefined : this.worldMap.getStateByProvinceId(hoverProvinceId);
        if (hovered) {
            stateIds.add(hovered.id);
        }
        for (const stateId of stateIds) {
            owners.add(stateId);
            this.worldMap.getStateById(stateId)?.provinces.forEach(id => owners.add(id));
        }
        return owners;
    }

    public render(context: CanvasRenderingContext2D): void {
        const worldMap = this.worldMap;
        const viewPoint = this.viewPoint;
        const width = worldMap.width;
        const height = worldMap.height;
        const radius = Math.max(5, Math.min(11, 4 + viewPoint.scale * 2.5));
        const offsets = [-width, 0, width];
        const canvas = context.canvas;
        const hoverProvince = this.hoverX === undefined || this.hoverY === undefined
            ? undefined
            : worldMap.getProvinceByPosition(this.hoverX, this.hoverY);
        const owners = this.showAll ? undefined : this.visibleOwners(hoverProvince?.id);

        context.save();
        const inView = (building: MapBuilding) => {
            const sy = viewPoint.convertY(height - building.z);
            return sy >= -radius - 8 && sy <= canvas.height + radius + 8;
        };
        const visible = this.placed.filter(building =>
            (owners === undefined || owners.has(building.owner)) && inView(building));
        // Selected type last so it stays on top.
        visible.sort((a, b) => Number(a.id === this.selectedId) - Number(b.id === this.selectedId));
        const dots = viewPoint.scale < 0.6;
        for (const building of visible) {
            const sy = viewPoint.convertY(height - building.z);
            const selected = building.id === this.selectedId;
            for (const offset of offsets) {
                const sx = viewPoint.convertX(building.x + offset);
                if (sx < -radius - 8 || sx > canvas.width + radius + 8) {
                    continue;
                }
                if (dots) {
                    context.fillStyle = buildingColor(building.id);
                    context.fillRect(sx - 2, sy - 2, 4, 4);
                } else {
                    this.drawMarker(context, sx, sy, radius, building.id, building.rotation, 1,
                        selected ? '#ffffff' : 'rgba(20, 22, 28, 0.9)');
                }
            }
        }

        if (this.mode === 'place' && this.hoverX !== undefined && this.hoverY !== undefined && this.loadState === 'ready') {
            const def = this.getDef(this.selectedId);
            if (def) {
                const result = this.plan(def, this.hoverX, this.hoverY, hoverProvince?.id);
                const valid = !('error' in result);
                const sx = viewPoint.convertX(this.hoverX + 0.5);
                const sy = viewPoint.convertY(this.hoverY + 0.5);
                const rotation = valid ? result.entry.rotation : this.rotationDegrees * Math.PI / 180;
                this.drawMarker(context, sx, sy, radius + 1, def.id, rotation, 0.7, valid ? '#7cf29a' : '#ff6b6b');
                const label = valid ? `${def.id} → ${result.owner}` : result.error;
                context.font = '600 12px sans-serif';
                context.textAlign = 'left';
                context.textBaseline = 'middle';
                const textWidth = context.measureText(label).width;
                const lx = sx + radius + 10;
                const ly = sy - radius - 8;
                context.fillStyle = 'rgba(20, 22, 28, 0.88)';
                context.beginPath();
                context.roundRect(lx - 6, ly - 10, textWidth + 12, 20, 6);
                context.fill();
                context.fillStyle = valid ? '#d6ffe0' : '#ffd0d0';
                context.fillText(label, lx, ly);
            }
        } else if (this.mode === 'erase' && this.hoverX !== undefined && this.hoverY !== undefined) {
            context.beginPath();
            context.arc(viewPoint.convertX(this.hoverX + 0.5), viewPoint.convertY(this.hoverY + 0.5), ERASE_RADIUS_PX, 0, Math.PI * 2);
            context.setLineDash([4, 3]);
            context.lineWidth = 2;
            context.strokeStyle = '#ff6b6b';
            context.stroke();
        }
        context.restore();
    }
}
