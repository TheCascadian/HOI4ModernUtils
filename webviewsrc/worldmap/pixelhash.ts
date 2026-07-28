/**
 * Hash every RGBA pixel. Processing one packed word per pixel keeps the
 * fidelity gate fast without dropping green, blue, alpha, or spatial samples.
 */
export function hashRgbaBytes(data: ArrayLike<number>): string {
    let hash = 0x811c9dc5;
    for (let index = 0; index < data.length; index += 4) {
        const rgba =
            (data[index] ?? 0) |
            ((data[index + 1] ?? 0) << 8) |
            ((data[index + 2] ?? 0) << 16) |
            ((data[index + 3] ?? 0) << 24);
        hash ^= rgba;
        hash = Math.imul(hash, 0x01000193);
    }
    hash ^= data.length;
    hash = Math.imul(hash, 0x01000193);
    return (hash >>> 0).toString(16).padStart(8, '0');
}
