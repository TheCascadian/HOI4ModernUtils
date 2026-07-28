export class PaintDraftHistory {
    private readonly undoStack: Map<string, number>[] = [];
    private readonly redoStack: Map<string, number>[] = [];

    constructor(private readonly limit = 200) {}

    public record(pixels: ReadonlyMap<string, number>): void {
        this.undoStack.push(new Map(pixels));
        while (this.undoStack.length > this.limit) {
            this.undoStack.shift();
        }
        this.redoStack.length = 0;
    }

    public undo(current: ReadonlyMap<string, number>): Map<string, number> | undefined {
        const previous = this.undoStack.pop();
        if (!previous) {
            return undefined;
        }
        this.redoStack.push(new Map(current));
        return new Map(previous);
    }

    public redo(current: ReadonlyMap<string, number>): Map<string, number> | undefined {
        const next = this.redoStack.pop();
        if (!next) {
            return undefined;
        }
        this.undoStack.push(new Map(current));
        return new Map(next);
    }

    public clear(): void {
        this.undoStack.length = 0;
        this.redoStack.length = 0;
    }

    public get canUndo(): boolean {
        return this.undoStack.length > 0;
    }

    public get canRedo(): boolean {
        return this.redoStack.length > 0;
    }
}
