/**
 * BMP file writer for HOI4 province maps.
 * Writes 24-bit BMP files that are compatible with the HOI4 engine.
 * Used for atomic province map updates with undo support.
 */

export function writeBmp(pixels: Uint8Array, width: number, height: number): Buffer {
    // Each row must be padded to a multiple of 4 bytes
    const rowSize = ((width * 3 + 3) >> 2) << 2; // round up to multiple of 4
    const pixelDataSize = rowSize * height;
    const fileHeaderSize = 14;
    const dibHeaderSize = 40;
    const dataOffset = fileHeaderSize + dibHeaderSize;
    const fileSize = dataOffset + pixelDataSize;

    const buffer = Buffer.alloc(fileSize);

    // BMP File Header (14 bytes)
    buffer.write('BM', 0, 'ascii');              // signature
    buffer.writeUInt32LE(fileSize, 2);           // file size
    buffer.writeUInt32LE(0, 6);                  // reserved
    buffer.writeUInt32LE(dataOffset, 10);         // data offset

    // DIB Header (BITMAPINFOHEADER, 40 bytes)
    buffer.writeUInt32LE(dibHeaderSize, 14);     // header size
    buffer.writeInt32LE(width, 18);              // width
    buffer.writeInt32LE(height, 22);             // height (positive = bottom-up)
    buffer.writeUInt16LE(1, 26);                 // planes
    buffer.writeUInt16LE(24, 28);                // bits per pixel
    buffer.writeUInt32LE(0, 30);                 // compression (BI_RGB)
    buffer.writeUInt32LE(pixelDataSize, 34);     // image size
    buffer.writeInt32LE(2835, 38);               // horizontal resolution (72 DPI)
    buffer.writeInt32LE(2835, 42);               // vertical resolution (72 DPI)
    buffer.writeUInt32LE(0, 46);                 // colors in palette
    buffer.writeUInt32LE(0, 50);                 // important colors

    // Pixel data (bottom-up: last row first)
    // pixels are in BGR order
    for (let y = 0; y < height; y++) {
        const srcRow = (height - 1 - y) * width * 3;
        const dstRow = dataOffset + y * rowSize;
        for (let x = 0; x < width; x++) {
            const srcIdx = srcRow + x * 3;
            const dstIdx = dstRow + x * 3;
            // pixels are already in BGR order (R,G,B from our internal format)
            buffer[dstIdx] = pixels[srcIdx + 2];     // B
            buffer[dstIdx + 1] = pixels[srcIdx + 1]; // G
            buffer[dstIdx + 2] = pixels[srcIdx];     // R
        }
        // Padding bytes are already zeroed by Buffer.alloc
    }

    return buffer;
}

/**
 * Convert a 2D array of packed RGB colors (0xRRGGBB) to raw BGR pixel data.
 * @param colors - Array of width*height packed color values
 * @param width - Image width
 * @param height - Image height
 * @returns Raw BGR pixel data (3 bytes per pixel, bottom-up row order)
 */
export function colorsToRawPixels(colors: number[], width: number, height: number): Uint8Array {
    const pixels = new Uint8Array(width * height * 3);
    for (let i = 0; i < width * height; i++) {
        const color = colors[i];
        const baseIdx = i * 3;
        pixels[baseIdx] = (color >> 16) & 0xFF;     // R
        pixels[baseIdx + 1] = (color >> 8) & 0xFF;   // G
        pixels[baseIdx + 2] = color & 0xFF;           // B
    }
    return pixels;
}

/**
 * Encode a complete province BMP file from a color array.
 * Colors are in 0xRRGGBB format, one per pixel, row-major order (top-left first).
 */
export function encodeProvinceBmp(colors: number[], width: number, height: number): Buffer {
    const rawPixels = colorsToRawPixels(colors, width, height);
    return writeBmp(rawPixels, width, height);
}
