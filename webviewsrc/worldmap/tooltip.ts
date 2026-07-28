export interface TooltipPosition {
    x: number;
    y: number;
}

/**
 * Place the final-sized tooltip beside the cursor and keep the complete box
 * inside the canvas whenever the canvas is large enough to contain it.
 */
export function placeTooltip(
    cursorX: number,
    cursorY: number,
    boxWidth: number,
    boxHeight: number,
    canvasWidth: number,
    canvasHeight: number,
    gap = 10
): TooltipPosition {
    let x = cursorX + gap;
    let y = cursorY + gap;

    if (x + boxWidth > canvasWidth) {
        x = cursorX - gap - boxWidth;
    }
    if (y + boxHeight > canvasHeight) {
        y = cursorY - gap - boxHeight;
    }

    return {
        x: Math.max(0, Math.min(x, Math.max(0, canvasWidth - boxWidth))),
        y: Math.max(0, Math.min(y, Math.max(0, canvasHeight - boxHeight))),
    };
}

export function formatTooltipWarnings(
    warnings: readonly string[],
    compact: boolean,
    maximumVisible = 3,
    maximumLength = 96
): string {
    if (!compact) {
        return warnings.map(warning => `|r|${warning}`).join('\n');
    }

    const visible = warnings.slice(0, maximumVisible).map(warning => {
        const normalized = warning.replace(/\s+/g, ' ').trim();
        if (normalized.length <= maximumLength) {
            return `|r|${normalized}`;
        }

        const candidate = normalized.substring(0, Math.max(0, maximumLength - 3));
        const lastBreak = candidate.lastIndexOf(' ');
        const shortened = lastBreak >= Math.floor(maximumLength * 0.6)
            ? candidate.substring(0, lastBreak)
            : candidate;
        return `|r|${shortened.trimEnd()}...`;
    });

    const remaining = warnings.length - visible.length;
    if (remaining > 0) {
        visible.push(`|r|${remaining} more warning${remaining === 1 ? '' : 's'}`);
    }
    return visible.join('\n');
}
