export interface BrushBounds {
    size: number;
    startOffset: number;
    endOffset: number;
}

export function getBrushBounds(value: number): BrushBounds {
    const size = Math.max(1, Math.min(9, Math.floor(Number.isFinite(value) ? value : 1)));
    const startOffset = -Math.floor((size - 1) / 2);
    return {
        size,
        startOffset,
        endOffset: startOffset + size - 1,
    };
}
