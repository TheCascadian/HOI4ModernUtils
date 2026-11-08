import { Zone } from "./definitions";

/**
 * Splits the province raster into power-of-two blocks of a single color, grouped by color.
 * Shared by the host loader and the webview so cover zones never need to be sent over the wire.
 */
export function computeCoverZones(colorByPosition: Uint32Array, width: number, height: number): Map<number, Zone[]> {
    const zonesByColor = new Map<number, Zone[]>();
    const blockStack: Zone[] = [];
    const blockSize = 256;
    for (let x = 0; x < width; x += blockSize) {
        for (let y = 0; y < height; y += blockSize) {
            blockStack.push({ x, y, w: blockSize, h: blockSize });
        }
    }

    while (blockStack.length > 0) {
        const block = blockStack.pop()!;
        const t = block.y;
        const l = block.x;
        const b = block.y + block.h;
        const r = block.x + block.w;
        const color = colorByPosition[t * width + l];
        let sameColor = true;
        for (let y = t, yi = t * width; y < b; y++, yi += width) {
            for (let x = l, xi = yi + l; x < r; x++, xi++) {
                if (colorByPosition[xi] !== color) {
                    sameColor = false;
                    break;
                }
            }
            if (!sameColor) {
                break;
            }
        }

        if (sameColor) {
            let zones = zonesByColor.get(color);
            if (!zones) {
                zones = [];
                zonesByColor.set(color, zones);
            }
            zones.push(block);
        } else {
            const half = block.w >> 1;
            blockStack.push({ ...block, w: half, h: half });
            blockStack.push({ ...block, x: block.x + half, w: half, h: half });
            blockStack.push({ ...block, y: block.y + half, w: half, h: half });
            blockStack.push({ x: block.x + half, y: block.y + half, w: half, h: half });
        }
    }

    return zonesByColor;
}
