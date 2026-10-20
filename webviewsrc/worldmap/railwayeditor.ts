import { BehaviorSubject } from 'rxjs';
import { Point, Railway, WorldMapMessage } from '../../src/previewdef/worldmap/definitions';
import { feLocalize } from '../util/i18n';
import { vscode } from '../util/vscode';
import { FEWorldMap, Loader } from './loader';
import { ViewPoint } from './viewpoint';

export type RailwayEditMode = 'select' | 'draw';
export type RailwayExtendFrom = 'end' | 'start';
export type RailwaySaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'failed';

export interface RailwayEditorHooks {
    status(text: string, tone?: 'info' | 'warn'): void;
    /** Redraws the map canvas, which also draws railways in the supply layer. */
    refreshMap(): void;
    /** Another tool owns the canvas (for example the paintbrush). */
    isBusy(): boolean;
}

interface Snapshot {
    railways: Railway[];
    selected: number;
}

export const RAILWAY_MIN_LEVEL = 1;
export const RAILWAY_MAX_LEVEL = 5;
const LEVEL_COLORS = ['#ffd166', '#f4a261', '#ef476f', '#c77dff', '#4cc9f0'];
const MAX_UNDO = 200;
const MAX_PATH_DEPTH = 80;
const SAVE_DELAY_MS = 450;
const SAVE_TIMEOUT_MS = 20000;
const PICK_RADIUS_PX = 10;
const NODE_RADIUS_PX = 9;

function cloneRailways(railways: readonly Railway[]): Railway[] {
    return railways.map(railway => ({ level: railway.level, provinces: railway.provinces.slice() }));
}

function distanceToSegment(px: number, py: number, a: Point, b: Point): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSquared = dx * dx + dy * dy;
    let t = lengthSquared === 0 ? 0 : ((px - a.x) * dx + (py - a.y) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
}

/**
 * Edits map/railways.txt on the map: pick, draw, extend, reroute, split,
 * reverse and delete railways. Every change is undoable and saved on its own.
 */
export class RailwayEditor {
    public readonly active$ = new BehaviorSubject<boolean>(false);
    /** Bumped on every change that affects what is drawn or shown in the panel. */
    public readonly revision$ = new BehaviorSubject<number>(0);

    public mode: RailwayEditMode = 'select';
    public extendFrom: RailwayExtendFrom = 'end';
    public autoConnect = true;
    public level = 1;
    public selected = -1;
    public selectedNode = -1;
    public saveState: RailwaySaveState = 'idle';
    public saveError = '';

    private railways: Railway[] = [];
    /** First click of a brand new railway; it needs a second province to exist. */
    private pendingStart: number | undefined;
    private undoStack: Snapshot[] = [];
    private redoStack: Snapshot[] = [];
    private saveTimer: ReturnType<typeof setTimeout> | undefined;
    private saveTimeout: ReturnType<typeof setTimeout> | undefined;
    private latestRequestId: string | undefined;
    private requestSequence = 0;
    private previewKey = '';
    private previewPath: number[] | undefined;

    constructor(private loader: Loader, private viewPoint: ViewPoint, private hooks: RailwayEditorHooks) {
        window.addEventListener('message', event => this.onMessage(event.data as WorldMapMessage));
    }

    private get worldMap(): FEWorldMap {
        return this.loader.worldMap;
    }

    public get railwayCount(): number {
        return this.railways.length;
    }

    public getSelected(): Railway | undefined {
        return this.railways[this.selected];
    }

    public getPendingStart(): number | undefined {
        return this.pendingStart;
    }

    public canUndo(): boolean {
        return this.undoStack.length > 0;
    }

    public canRedo(): boolean {
        return this.redoStack.length > 0;
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
            this.hooks.status(feLocalize('worldmap.railway.notready', 'Wait for the map to finish loading first.'), 'warn');
            return false;
        }
        if (this.hooks.isBusy()) {
            this.hooks.status(feLocalize('worldmap.railway.busy', 'Finish or cancel the current province edit first.'), 'warn');
            return false;
        }
        const railways: Railway[] = [];
        this.worldMap.forEachRailway(railway => {
            railways.push({ level: railway.level, provinces: railway.provinces.slice() });
        });
        this.railways = railways;
        this.undoStack = [];
        this.redoStack = [];
        this.selected = -1;
        this.selectedNode = -1;
        this.pendingStart = undefined;
        this.mode = 'select';
        this.saveState = 'idle';
        this.saveError = '';
        this.previewKey = '';
        this.active$.next(true);
        this.changed();
        return true;
    }

    public deactivate(): boolean {
        if (!this.active$.value) {
            return true;
        }
        this.flushSave();
        this.pendingStart = undefined;
        this.selected = -1;
        this.selectedNode = -1;
        this.active$.next(false);
        this.changed();
        return true;
    }

    private changed(): void {
        this.previewKey = '';
        this.revision$.next(this.revision$.value + 1);
    }

    // ---------------------------------------------------------------- queries

    public isLand(provinceId: number): boolean {
        return this.worldMap.getProvinceById(provinceId)?.type === 'land';
    }

    public areAdjacent(a: number, b: number): boolean {
        const worldMap = this.worldMap;
        const from = worldMap.getProvinceById(a);
        const to = worldMap.getProvinceById(b);
        return !!from && !!to &&
            (from.edges.some(edge => edge.to === b && edge.type !== 'impassable') ||
                to.edges.some(edge => edge.to === a && edge.type !== 'impassable'));
    }

    /** Indexes i where province i and i + 1 of the railway cannot be connected. */
    public invalidSegments(railway: Railway): number[] {
        const result: number[] = [];
        for (let i = 0; i + 1 < railway.provinces.length; i++) {
            if (!this.isLand(railway.provinces[i]) || !this.isLand(railway.provinces[i + 1]) ||
                !this.areAdjacent(railway.provinces[i], railway.provinces[i + 1])) {
                result.push(i);
            }
        }
        return result;
    }

    public countProblemRailways(): number {
        return this.railways.reduce((count, railway) => count + (this.invalidSegments(railway).length > 0 ? 1 : 0), 0);
    }

    /** Shortest land route between two provinces, both ends included. */
    public findPath(from: number, to: number): number[] | undefined {
        if (from === to) {
            return [from];
        }
        if (!this.isLand(from) || !this.isLand(to)) {
            return undefined;
        }
        const worldMap = this.worldMap;
        const previous = new Map<number, number>([[from, from]]);
        let frontier = [from];
        for (let depth = 0; depth < MAX_PATH_DEPTH && frontier.length > 0; depth++) {
            const next: number[] = [];
            for (const id of frontier) {
                const province = worldMap.getProvinceById(id);
                if (!province) {
                    continue;
                }
                for (const edge of province.edges) {
                    if (edge.type === 'impassable' || previous.has(edge.to) || !this.isLand(edge.to)) {
                        continue;
                    }
                    previous.set(edge.to, id);
                    if (edge.to === to) {
                        const path = [to];
                        let cursor = to;
                        while (cursor !== from) {
                            cursor = previous.get(cursor)!;
                            path.push(cursor);
                        }
                        return path.reverse();
                    }
                    next.push(edge.to);
                }
            }
            frontier = next;
        }
        return undefined;
    }

    /** The provinces from an anchor to the target (anchor first) according to the connect setting. */
    private route(anchor: number, target: number): number[] | undefined {
        if (anchor === target) {
            return [anchor];
        }
        if (!this.isLand(target)) {
            return undefined;
        }
        if (this.areAdjacent(anchor, target)) {
            return [anchor, target];
        }
        return this.autoConnect ? this.findPath(anchor, target) : undefined;
    }

    private getAnchor(): number | undefined {
        const railway = this.getSelected();
        if (railway) {
            return this.extendFrom === 'end' ? railway.provinces[railway.provinces.length - 1] : railway.provinces[0];
        }
        return this.pendingStart;
    }

    /** The route the next draw click would add; shown as a dashed preview. */
    public getPreview(hoverProvinceId: number | undefined): { anchor: number; path: number[] | undefined } | undefined {
        if (this.mode !== 'draw' || hoverProvinceId === undefined) {
            return undefined;
        }
        const anchor = this.getAnchor();
        if (anchor === undefined || anchor === hoverProvinceId) {
            return undefined;
        }
        const key = `${anchor}>${hoverProvinceId}|${this.autoConnect}|${this.revision$.value}`;
        if (key !== this.previewKey) {
            this.previewKey = key;
            this.previewPath = this.route(anchor, hoverProvinceId);
        }
        return { anchor, path: this.previewPath };
    }

    // ---------------------------------------------------------------- mutation

    private snapshot(): Snapshot {
        return { railways: cloneRailways(this.railways), selected: this.selected };
    }

    /** Runs a change as one undo step and schedules the save. */
    private mutate(change: () => void): void {
        const before = this.snapshot();
        change();
        this.undoStack.push(before);
        if (this.undoStack.length > MAX_UNDO) {
            this.undoStack.shift();
        }
        this.redoStack = [];
        this.afterEdit();
    }

    private afterEdit(): void {
        this.worldMap.setRailways(cloneRailways(this.railways));
        this.hooks.refreshMap();
        this.saveState = 'dirty';
        this.saveError = '';
        this.scheduleSave();
        this.changed();
    }

    public undo(): boolean {
        const snapshot = this.undoStack.pop();
        if (!snapshot) {
            return false;
        }
        this.redoStack.push(this.snapshot());
        this.restore(snapshot);
        return true;
    }

    public redo(): boolean {
        const snapshot = this.redoStack.pop();
        if (!snapshot) {
            return false;
        }
        this.undoStack.push(this.snapshot());
        this.restore(snapshot);
        return true;
    }

    private restore(snapshot: Snapshot): void {
        this.railways = cloneRailways(snapshot.railways);
        this.selected = snapshot.selected < this.railways.length ? snapshot.selected : -1;
        this.selectedNode = -1;
        this.pendingStart = undefined;
        this.afterEdit();
    }

    public setMode(mode: RailwayEditMode): void {
        if (this.mode === mode) {
            return;
        }
        this.mode = mode;
        this.pendingStart = undefined;
        this.selectedNode = -1;
        this.changed();
    }

    public setExtendFrom(value: RailwayExtendFrom): void {
        this.extendFrom = value;
        this.changed();
    }

    public setAutoConnect(value: boolean): void {
        this.autoConnect = value;
        this.changed();
    }

    public setLevel(level: number): void {
        level = Math.max(RAILWAY_MIN_LEVEL, Math.min(RAILWAY_MAX_LEVEL, Math.round(level)));
        this.level = level;
        const railway = this.getSelected();
        if (railway && railway.level !== level) {
            this.mutate(() => { railway.level = level; });
        } else {
            this.changed();
        }
    }

    public select(index: number, center = false): void {
        this.selected = index >= 0 && index < this.railways.length ? index : -1;
        this.selectedNode = -1;
        this.pendingStart = undefined;
        const railway = this.getSelected();
        if (railway) {
            this.level = railway.level;
            if (center) {
                this.centerOn(railway);
            }
        }
        this.changed();
    }

    private centerOn(railway: Railway): void {
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        for (const id of railway.provinces) {
            const point = this.worldMap.getProvinceById(id)?.centerOfMass;
            if (point) {
                minX = Math.min(minX, point.x);
                maxX = Math.max(maxX, point.x);
                minY = Math.min(minY, point.y);
                maxY = Math.max(maxY, point.y);
            }
        }
        if (minX <= maxX) {
            this.viewPoint.centerPoint({ x: (minX + maxX) / 2, y: (minY + maxY) / 2 });
        }
    }

    public selectRelative(delta: number): void {
        if (this.railways.length === 0) {
            return;
        }
        const next = this.selected < 0
            ? (delta > 0 ? 0 : this.railways.length - 1)
            : (this.selected + delta + this.railways.length) % this.railways.length;
        this.select(next, true);
    }

    public selectNextProblem(): void {
        const count = this.railways.length;
        for (let step = 1; step <= count; step++) {
            const index = ((this.selected < 0 ? -1 : this.selected) + step) % count;
            if (this.invalidSegments(this.railways[index]).length > 0) {
                this.select(index, true);
                return;
            }
        }
        this.hooks.status(feLocalize('worldmap.railway.noproblems', 'Every railway is connected through adjacent land provinces.'));
    }

    public deleteSelected(): void {
        const railway = this.getSelected();
        if (!railway) {
            return;
        }
        const index = this.selected;
        this.mutate(() => {
            this.railways.splice(index, 1);
            this.selected = -1;
            this.selectedNode = -1;
        });
        this.hooks.status(feLocalize('worldmap.railway.deleted', 'Railway deleted. Ctrl+Z restores it.'));
    }

    public reverseSelected(): void {
        const railway = this.getSelected();
        if (!railway) {
            return;
        }
        this.mutate(() => {
            railway.provinces.reverse();
            this.selectedNode = -1;
        });
    }

    public canSplit(): boolean {
        const railway = this.getSelected();
        return !!railway && this.selectedNode > 0 && this.selectedNode < railway.provinces.length - 1;
    }

    public splitSelected(): void {
        const railway = this.getSelected();
        if (!railway || !this.canSplit()) {
            this.hooks.status(feLocalize('worldmap.railway.splithint', 'Click a middle node of the selected railway first, then split.'), 'warn');
            return;
        }
        const node = this.selectedNode;
        this.mutate(() => {
            const tail: Railway = { level: railway.level, provinces: railway.provinces.slice(node) };
            railway.provinces = railway.provinces.slice(0, node + 1);
            this.railways.splice(this.selected + 1, 0, tail);
            this.selectedNode = -1;
        });
    }

    private removeNode(railwayIndex: number, node: number): void {
        const railway = this.railways[railwayIndex];
        if (!railway) {
            return;
        }
        if (railway.provinces.length <= 2) {
            this.mutate(() => {
                this.railways.splice(railwayIndex, 1);
                this.selected = -1;
                this.selectedNode = -1;
            });
            this.hooks.status(feLocalize('worldmap.railway.deleted', 'Railway deleted. Ctrl+Z restores it.'));
            return;
        }
        const left = railway.provinces[node - 1];
        const right = railway.provinces[node + 1];
        let bridge: number[] = [];
        if (left !== undefined && right !== undefined && !this.areAdjacent(left, right) && this.autoConnect) {
            const path = this.findPath(left, right);
            if (path) {
                bridge = path.slice(1, -1);
            }
        }
        if (bridge.length === 1 && bridge[0] === railway.provinces[node]) {
            this.hooks.status(feLocalize(
                'worldmap.railway.needednode',
                'That province is the only link between its neighbors. Turn off Auto-connect to leave a gap, or Alt+click another province to detour.'
            ), 'warn');
            return;
        }
        this.mutate(() => {
            railway.provinces.splice(node, 1, ...bridge);
            this.selectedNode = -1;
        });
    }

    // ---------------------------------------------------------------- input

    /** Index of the selected railway's node under the point, or -1. */
    private pickNode(mapX: number, mapY: number): number {
        const railway = this.getSelected();
        if (!railway) {
            return -1;
        }
        const radius = NODE_RADIUS_PX / this.viewPoint.scale;
        const width = this.worldMap.width;
        let best = -1;
        let bestDistance = radius;
        railway.provinces.forEach((id, index) => {
            const point = this.worldMap.getProvinceById(id)?.centerOfMass;
            if (!point) {
                return;
            }
            for (const offset of [-width, 0, width]) {
                const distance = Math.hypot(mapX + offset - point.x, mapY - point.y);
                if (distance <= bestDistance) {
                    best = index;
                    bestDistance = distance;
                }
            }
        });
        return best;
    }

    /** The railway whose line is closest to the point; repeated clicks cycle through overlapping ones. */
    private pickRailway(mapX: number, mapY: number): number {
        const worldMap = this.worldMap;
        const width = worldMap.width;
        const tolerance = PICK_RADIUS_PX / this.viewPoint.scale;
        const nearby: { index: number; distance: number }[] = [];
        this.railways.forEach((railway, index) => {
            let best = Infinity;
            let previous: Point | undefined;
            for (const id of railway.provinces) {
                const point = worldMap.getProvinceById(id)?.centerOfMass;
                if (point && previous) {
                    for (const offset of [-width, 0, width]) {
                        best = Math.min(best, distanceToSegment(mapX + offset, mapY, previous, point));
                    }
                }
                previous = point;
            }
            if (best <= tolerance) {
                nearby.push({ index, distance: best });
            }
        });
        if (nearby.length === 0) {
            return -1;
        }
        const closest = Math.min(...nearby.map(item => item.distance));
        const candidates = nearby
            .filter(item => item.distance <= closest + 2 / this.viewPoint.scale)
            .map(item => item.index);
        const position = candidates.indexOf(this.selected);
        return position >= 0 && position + 1 < candidates.length ? candidates[position + 1] : candidates[0];
    }

    public handleClick(mapX: number, mapY: number, provinceId: number | undefined, event: { shiftKey: boolean; altKey: boolean }): void {
        if (this.mode === 'draw') {
            this.drawClick(provinceId);
            return;
        }

        const node = this.pickNode(mapX, mapY);
        if (node >= 0) {
            if (event.shiftKey) {
                this.removeNode(this.selected, node);
            } else {
                this.selectedNode = this.selectedNode === node ? -1 : node;
                this.changed();
            }
            return;
        }
        if (event.altKey && provinceId !== undefined && this.getSelected()) {
            this.insertDetour(provinceId);
            return;
        }
        const picked = this.pickRailway(mapX, mapY);
        if (picked >= 0) {
            this.select(picked);
        } else {
            this.select(-1);
        }
    }

    private drawClick(provinceId: number | undefined): void {
        if (provinceId === undefined) {
            return;
        }
        if (!this.isLand(provinceId)) {
            this.hooks.status(feLocalize('worldmap.railway.landonly', 'Railways can only run through land provinces.'), 'warn');
            return;
        }

        const railway = this.getSelected();
        if (!railway) {
            if (this.pendingStart === undefined) {
                this.pendingStart = provinceId;
                this.changed();
                return;
            }
            if (this.pendingStart === provinceId) {
                this.pendingStart = undefined;
                this.changed();
                return;
            }
            const path = this.route(this.pendingStart, provinceId);
            if (!path) {
                this.reportNoRoute();
                return;
            }
            this.mutate(() => {
                this.railways.push({ level: this.level, provinces: path });
                this.selected = this.railways.length - 1;
                this.pendingStart = undefined;
            });
            return;
        }

        const atEnd = this.extendFrom === 'end';
        const anchor = atEnd ? railway.provinces[railway.provinces.length - 1] : railway.provinces[0];
        if (provinceId === anchor) {
            // Clicking the tip again steps it back, so a wrong click is one click to fix.
            this.removeNode(this.selected, atEnd ? railway.provinces.length - 1 : 0);
            return;
        }
        const path = this.route(anchor, provinceId);
        if (!path) {
            this.reportNoRoute();
            return;
        }
        const added = path.slice(1);
        this.mutate(() => {
            if (atEnd) {
                railway.provinces.push(...added);
            } else {
                railway.provinces.unshift(...added.reverse());
            }
        });
    }

    private reportNoRoute(): void {
        this.hooks.status(
            this.autoConnect
                ? feLocalize('worldmap.railway.noroute', 'No land route connects those provinces.')
                : feLocalize('worldmap.railway.notadjacent', 'Those provinces are not adjacent. Turn on Auto-connect to fill the gap.'),
            'warn'
        );
    }

    /** Alt+click: route the selected railway through another province, between its two nearest nodes. */
    private insertDetour(provinceId: number): void {
        const railway = this.getSelected();
        const target = this.worldMap.getProvinceById(provinceId);
        if (!railway || !target || !this.isLand(provinceId)) {
            this.hooks.status(feLocalize('worldmap.railway.landonly', 'Railways can only run through land provinces.'), 'warn');
            return;
        }
        if (railway.provinces.includes(provinceId)) {
            return;
        }
        let segment = -1;
        let bestDistance = Infinity;
        for (let i = 0; i + 1 < railway.provinces.length; i++) {
            const a = this.worldMap.getProvinceById(railway.provinces[i])?.centerOfMass;
            const b = this.worldMap.getProvinceById(railway.provinces[i + 1])?.centerOfMass;
            if (a && b) {
                const distance = distanceToSegment(target.centerOfMass.x, target.centerOfMass.y, a, b);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    segment = i;
                }
            }
        }
        if (segment < 0) {
            return;
        }
        const first = this.route(railway.provinces[segment], provinceId);
        const second = this.route(provinceId, railway.provinces[segment + 1]);
        if (!first || !second) {
            this.reportNoRoute();
            return;
        }
        this.mutate(() => {
            railway.provinces.splice(segment + 1, 0, ...first.slice(1), ...second.slice(1, -1));
        });
    }

    /** Returns true when the key was used. */
    public handleKey(e: KeyboardEvent): boolean {
        const key = e.key.toLowerCase();
        if ((e.ctrlKey || e.metaKey) && !e.altKey) {
            if (key === 'z' && !e.shiftKey) {
                this.undo() || this.hooks.status(feLocalize('worldmap.railway.nothingundo', 'No railway edits to undo.'));
                return true;
            }
            if (key === 'y' || (key === 'z' && e.shiftKey)) {
                this.redo() || this.hooks.status(feLocalize('worldmap.railway.nothingredo', 'No railway edits to redo.'));
                return true;
            }
            return false;
        }
        if (e.altKey || e.metaKey) {
            return false;
        }
        switch (key) {
            case 'escape':
                if (this.pendingStart !== undefined || this.selected >= 0) {
                    this.select(-1);
                } else {
                    this.deactivate();
                }
                return true;
            case 'enter':
                this.select(-1);
                return true;
            case 's':
                this.setMode('select');
                return true;
            case 'd':
                this.setMode('draw');
                return true;
            case 'r':
                this.reverseSelected();
                return true;
            case 'x':
                this.splitSelected();
                return true;
            case 'delete':
                this.deleteSelected();
                return true;
            case 'backspace': {
                const railway = this.getSelected();
                if (railway) {
                    this.removeNode(this.selected, this.extendFrom === 'end' ? railway.provinces.length - 1 : 0);
                } else if (this.pendingStart !== undefined) {
                    this.pendingStart = undefined;
                    this.changed();
                }
                return true;
            }
            case '[':
                this.selectRelative(-1);
                return true;
            case ']':
                this.selectRelative(1);
                return true;
            case 'tab':
                this.setExtendFrom(this.extendFrom === 'end' ? 'start' : 'end');
                return true;
            default:
                if (/^[1-5]$/.test(key)) {
                    this.setLevel(Number(key));
                    return true;
                }
                return false;
        }
    }

    // ---------------------------------------------------------------- saving

    private scheduleSave(): void {
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
        const requestId = `railways-${Date.now()}-${++this.requestSequence}`;
        this.latestRequestId = requestId;
        this.saveState = 'saving';
        vscode.postMessage<WorldMapMessage>({
            command: 'persistrailways',
            requestId,
            railways: cloneRailways(this.railways),
        } as WorldMapMessage);
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        this.saveTimeout = setTimeout(() => {
            if (this.latestRequestId === requestId && this.saveState === 'saving') {
                this.saveState = 'failed';
                this.saveError = feLocalize('worldmap.railway.savetimeout', 'Saving took too long.');
                this.changed();
            }
        }, SAVE_TIMEOUT_MS);
        this.changed();
    }

    private onMessage(message: WorldMapMessage): void {
        if (message?.command !== 'persistrailwaysresult' || message.requestId !== this.latestRequestId) {
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
            this.saveError = message.error ?? feLocalize('worldmap.railway.savefailed', 'Saving failed.');
            this.hooks.status(this.saveError, 'warn');
        }
        this.changed();
    }

    // ---------------------------------------------------------------- drawing

    public static levelColor(level: number): string {
        return LEVEL_COLORS[Math.max(0, Math.min(LEVEL_COLORS.length - 1, level - 1))];
    }

    public render(context: CanvasRenderingContext2D, hoverProvinceId: number | undefined): void {
        const worldMap = this.worldMap;
        const viewPoint = this.viewPoint;
        const width = worldMap.width;
        const centers = new Map<number, Point | undefined>();
        const centerOf = (id: number): Point | undefined => {
            if (!centers.has(id)) {
                centers.set(id, worldMap.getProvinceById(id)?.centerOfMass);
            }
            return centers.get(id);
        };
        const offsets = [-width, 0, width];

        const strokePath = (ids: readonly number[], offset: number) => {
            context.beginPath();
            let started = false;
            for (let i = 0; i < ids.length; i++) {
                const point = centerOf(ids[i]);
                if (!point) {
                    started = false;
                    continue;
                }
                const x = viewPoint.convertX(point.x + offset);
                const y = viewPoint.convertY(point.y);
                if (!started) {
                    context.moveTo(x, y);
                    started = true;
                } else {
                    context.lineTo(x, y);
                }
            }
            context.stroke();
        };

        context.save();
        context.lineJoin = 'round';
        context.lineCap = 'round';
        const baseWidth = (level: number) => Math.min(9, 2 + level * 0.9);

        // Outline pass first so crossing railways stay readable.
        context.strokeStyle = 'rgba(0, 0, 0, 0.75)';
        this.railways.forEach((railway, index) => {
            if (index === this.selected) {
                return;
            }
            context.lineWidth = baseWidth(railway.level) + 2;
            for (const offset of offsets) {
                strokePath(railway.provinces, offset);
            }
        });
        this.railways.forEach((railway, index) => {
            if (index === this.selected) {
                return;
            }
            context.strokeStyle = RailwayEditor.levelColor(railway.level);
            context.globalAlpha = this.selected >= 0 ? 0.55 : 0.9;
            context.lineWidth = baseWidth(railway.level);
            for (const offset of offsets) {
                strokePath(railway.provinces, offset);
            }
        });
        context.globalAlpha = 1;

        const selected = this.getSelected();
        if (selected) {
            const invalid = new Set(this.invalidSegments(selected));
            for (const offset of offsets) {
                context.strokeStyle = 'rgba(255, 255, 255, 0.95)';
                context.lineWidth = baseWidth(selected.level) + 5;
                strokePath(selected.provinces, offset);
                context.strokeStyle = RailwayEditor.levelColor(selected.level);
                context.lineWidth = baseWidth(selected.level) + 1;
                strokePath(selected.provinces, offset);

                if (invalid.size > 0) {
                    context.save();
                    context.setLineDash([6, 5]);
                    context.strokeStyle = '#ff2d2d';
                    context.lineWidth = baseWidth(selected.level) + 1;
                    for (const i of invalid) {
                        strokePath([selected.provinces[i], selected.provinces[i + 1]], offset);
                    }
                    context.restore();
                }

                selected.provinces.forEach((id, index) => {
                    const point = centerOf(id);
                    if (!point) {
                        return;
                    }
                    const x = viewPoint.convertX(point.x + offset);
                    const y = viewPoint.convertY(point.y);
                    const isTip = index === 0 || index === selected.provinces.length - 1;
                    const isActiveTip = this.mode === 'draw' &&
                        index === (this.extendFrom === 'end' ? selected.provinces.length - 1 : 0);
                    context.beginPath();
                    context.arc(x, y, isTip ? 7 : 5, 0, Math.PI * 2);
                    context.fillStyle = index === this.selectedNode ? '#ffe600' : (isActiveTip ? '#3dff7a' : '#ffffff');
                    context.fill();
                    context.lineWidth = 2;
                    context.strokeStyle = '#111111';
                    context.stroke();
                    if (viewPoint.scale >= 1.2) {
                        context.fillStyle = '#ffffff';
                        context.strokeStyle = '#000000';
                        context.lineWidth = 3;
                        context.font = '11px sans-serif';
                        context.strokeText(String(id), x + 9, y - 8);
                        context.fillText(String(id), x + 9, y - 8);
                    }
                });
            }
        }

        const pendingStart = this.pendingStart;
        if (pendingStart !== undefined) {
            const point = centerOf(pendingStart);
            if (point) {
                for (const offset of offsets) {
                    context.beginPath();
                    context.arc(viewPoint.convertX(point.x + offset), viewPoint.convertY(point.y), 8, 0, Math.PI * 2);
                    context.fillStyle = '#3dff7a';
                    context.fill();
                    context.lineWidth = 2;
                    context.strokeStyle = '#111111';
                    context.stroke();
                }
            }
        }

        const preview = this.getPreview(hoverProvinceId);
        if (preview) {
            context.setLineDash([7, 6]);
            context.lineWidth = 3;
            const target = hoverProvinceId !== undefined ? centerOf(hoverProvinceId) : undefined;
            for (const offset of offsets) {
                if (preview.path) {
                    context.strokeStyle = '#3dff7a';
                    strokePath(preview.path, offset);
                } else if (target) {
                    context.strokeStyle = '#ff2d2d';
                    const anchor = centerOf(preview.anchor);
                    if (anchor) {
                        context.beginPath();
                        context.moveTo(viewPoint.convertX(anchor.x + offset), viewPoint.convertY(anchor.y));
                        context.lineTo(viewPoint.convertX(target.x + offset), viewPoint.convertY(target.y));
                        context.stroke();
                    }
                }
            }
        }
        context.restore();
    }
}
