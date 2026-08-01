export interface ProvinceIdCap {
    width: number;
    height: number;
    totalPixels: number;
    maxProvinceId: number;
}

/**
 * HOI4's province upper bound is derived from map area: at most one province
 * ID for every eight pixels in provinces.bmp.
 */
export function calculateProvinceIdCap(width: number, height: number): ProvinceIdCap {
    const normalizedWidth = Number.isFinite(width) ? Math.max(0, Math.floor(width)) : 0;
    const normalizedHeight = Number.isFinite(height) ? Math.max(0, Math.floor(height)) : 0;
    const totalPixels = normalizedWidth * normalizedHeight;
    return {
        width: normalizedWidth,
        height: normalizedHeight,
        totalPixels,
        maxProvinceId: Math.floor(totalPixels / 8),
    };
}
