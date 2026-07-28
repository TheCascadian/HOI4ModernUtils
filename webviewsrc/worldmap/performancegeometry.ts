export type PerformanceOverlayCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export function nearestPerformanceOverlayCorner(
    centerX: number,
    centerY: number,
    viewportWidth: number,
    viewportHeight: number,
): PerformanceOverlayCorner {
    const vertical = centerY < viewportHeight / 2 ? 'top' : 'bottom';
    const horizontal = centerX < viewportWidth / 2 ? 'left' : 'right';
    return `${vertical}-${horizontal}` as PerformanceOverlayCorner;
}
