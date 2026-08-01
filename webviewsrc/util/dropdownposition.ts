export interface DropdownAnchorRect {
    left: number;
    top: number;
    bottom: number;
    width: number;
}

export interface DropdownMenuPlacement {
    left: number;
    top: number;
    width: number;
}

export function calculateDropdownMenuPlacement(
    anchor: DropdownAnchorRect,
    menuHeight: number,
    viewportWidth: number,
    viewportHeight: number,
    preferredWidth = anchor.width,
    padding = 4,
): DropdownMenuPlacement {
    const width = Math.max(anchor.width, preferredWidth);
    const left = Math.max(padding, Math.min(anchor.left, viewportWidth - width - padding));
    const fitsBelow = anchor.bottom + menuHeight <= viewportHeight - padding;
    const fitsAbove = anchor.top - menuHeight >= padding;
    const top = fitsBelow || !fitsAbove
        ? Math.max(padding, Math.min(anchor.bottom, viewportHeight - menuHeight - padding))
        : anchor.top - menuHeight;
    return { left, top, width };
}
