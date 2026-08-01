export interface ProvinceReferenceRepairResult {
    text: string;
    replacements: number;
    removals: number;
    warnings: string[];
}

export interface ProvinceBmpEditDefinition {
    id: number;
    color: number;
    terrain: string;
    type?: string;
}

export function validateNewProvinceMembership(
    existingProvinceIds: Iterable<number>,
    provinces: ReadonlyArray<ProvinceBmpEditDefinition>,
    states: ReadonlyArray<{ provinces: readonly number[] }> = [],
    strategicRegions: ReadonlyArray<{ provinces: readonly number[] }> = []
): void {
    const existingIds = new Set(existingProvinceIds);
    for (const province of provinces) {
        if (existingIds.has(province.id)) {
            continue;
        }
        if (!strategicRegions.some(region => region.provinces.includes(province.id))) {
            throw new Error(
                `New province ${province.id} must be assigned to a strategic region in the same transaction.`
            );
        }
        if (province.type === 'land' && !states.some(state => state.provinces.includes(province.id))) {
            throw new Error(
                `New land province ${province.id} must be assigned to a state in the same transaction.`
            );
        }
    }
}

/** Extracts unique BGR colors from the actual pixel array of a 24/32-bit BI_RGB BMP. */
export function extractProvinceBmpColors(
    bmpBytes: Uint8Array,
    expectedWidth?: number,
    expectedHeight?: number
): Set<number> {
    const bmp = Buffer.from(bmpBytes.buffer, bmpBytes.byteOffset, bmpBytes.byteLength);
    if (bmp.length < 54 || bmp[0] !== 0x42 || bmp[1] !== 0x4d) {
        throw new Error('Invalid provinces BMP header.');
    }
    const dataOffset = bmp.readUInt32LE(10);
    const dibHeaderSize = bmp.readUInt32LE(14);
    const width = bmp.readInt32LE(18);
    const height = bmp.readInt32LE(22);
    const planes = bmp.readUInt16LE(26);
    const bitsPerPixel = bmp.readUInt16LE(28);
    const compression = bmp.readUInt32LE(30);
    const absoluteWidth = Math.abs(width);
    const absoluteHeight = Math.abs(height);
    if (dibHeaderSize < 40 || width === 0 || height === 0 || planes !== 1 ||
        (bitsPerPixel !== 24 && bitsPerPixel !== 32) || compression !== 0) {
        throw new Error('Unsupported provinces BMP format; expected uncompressed 24-bit or 32-bit pixels.');
    }
    if ((expectedWidth !== undefined && absoluteWidth !== expectedWidth) ||
        (expectedHeight !== undefined && absoluteHeight !== expectedHeight)) {
        throw new Error(
            `Province BMP dimensions ${absoluteWidth}x${absoluteHeight} do not match ${expectedWidth}x${expectedHeight}.`
        );
    }

    const bytesPerPixel = bitsPerPixel / 8;
    const rowSize = Math.ceil(absoluteWidth * bytesPerPixel / 4) * 4;
    const requiredLength = dataOffset + rowSize * absoluteHeight;
    if (dataOffset < 14 + dibHeaderSize || requiredLength > bmp.length) {
        throw new Error('Province BMP pixel array is truncated or has an invalid offset.');
    }

    const colors = new Set<number>();
    for (let y = 0; y < absoluteHeight; y++) {
        const sourceRow = height > 0 ? absoluteHeight - 1 - y : y;
        const rowOffset = dataOffset + sourceRow * rowSize;
        for (let x = 0; x < absoluteWidth; x++) {
            const pixelOffset = rowOffset + x * bytesPerPixel;
            colors.add(
                (bmp[pixelOffset + 2] << 16) |
                (bmp[pixelOffset + 1] << 8) |
                bmp[pixelOffset]
            );
        }
    }
    return colors;
}

/**
 * Rejects destructive province edits that could paint pixels to a synthetic
 * recovery province or leave provinces.bmp without a matching definition.
 */
export function validateProvinceBmpEdit(
    provinces: ReadonlyArray<ProvinceBmpEditDefinition>,
    paintedPixels: ReadonlyArray<ReadonlyArray<number>>,
    targetProvinceId: number,
    deletedProvinceIds: ReadonlyArray<number> = [],
    targetProvinceIds: ReadonlyArray<number> = [targetProvinceId],
    finalRasterColors?: Iterable<number>
): void {
    if (!Number.isInteger(targetProvinceId) || targetProvinceId <= 0) {
        throw new Error(`Refusing to paint to invalid province ID ${targetProvinceId}.`);
    }

    const ids = new Set<number>();
    const colors = new Set<number>();
    const requestedTargetIds = new Set(targetProvinceIds);
    requestedTargetIds.add(targetProvinceId);
    const targetColors = new Set<number>();
    for (const province of provinces) {
        const color = province.color >>> 0;
        if (!Number.isInteger(province.id) || province.id <= 0 || color === 0) {
            throw new Error(`Refusing to persist invalid province ${province.id} with color ${color}.`);
        }
        if (!province.terrain) {
            throw new Error(`Province ${province.id} has no terrain.`);
        }
        if (ids.has(province.id)) {
            throw new Error(`Province ID ${province.id} occurs more than once.`);
        }
        if (colors.has(color)) {
            throw new Error(`Province color ${color} occurs more than once.`);
        }
        ids.add(province.id);
        colors.add(color);
        if (requestedTargetIds.has(province.id)) {
            targetColors.add(color);
        }
    }

    if (targetColors.size !== requestedTargetIds.size) {
        throw new Error('One or more target provinces have no retained definition.');
    }
    if (deletedProvinceIds.some(id => requestedTargetIds.has(id) || !Number.isInteger(id) || id <= 0)) {
        throw new Error('The target or an invalid province was included in the deletion set.');
    }

    for (const pixel of paintedPixels) {
        if (pixel.length < 3 || !Number.isInteger(pixel[0]) || !Number.isInteger(pixel[1]) ||
            !Number.isInteger(pixel[2]) || !targetColors.has(pixel[2] >>> 0)) {
            throw new Error('Province pixel edit does not use an allowed target province color.');
        }
    }

    if (finalRasterColors) {
        const rasterColors = new Set(Array.from(finalRasterColors, color => color >>> 0));
        for (const color of rasterColors) {
            if (!colors.has(color)) {
                throw new Error(
                    `Final provinces BMP contains color ${color} without a retained definition.`
                );
            }
        }
        for (const color of colors) {
            if (!rasterColors.has(color)) {
                throw new Error(
                    `Province definition color ${color} has no pixels in the final provinces BMP.`
                );
            }
        }
    }
}

function replacementFor(id: number, replacements: Readonly<Record<number, number>>): number {
    return replacements[id] ?? id;
}

function eolOf(text: string): string {
    return text.includes('\r\n') ? '\r\n' : '\n';
}

/**
 * Rewrites province references in map/adjacencies.csv while retaining comments,
 * delimiter choice, and the conventional -1 sentinel row. Rows collapsed into
 * self-adjacencies or duplicate logical adjacencies are removed.
 */
export function repairAdjacencies(
    source: string,
    replacements: Readonly<Record<number, number>>,
    validProvinceIds?: ReadonlySet<number>,
    validSourceProvinceIds?: ReadonlySet<number>
): ProvinceReferenceRepairResult {
    const eol = eolOf(source);
    const output: string[] = [];
    const seen = new Set<string>();
    let replacementCount = 0;
    let removals = 0;

    for (const line of source.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            output.push(line);
            continue;
        }

        const delimiter = line.includes(';') ? ';' : ',';
        const fields = line.split(delimiter);
        if (fields.length < 9) {
            output.push(line);
            continue;
        }

        const from = Number.parseInt(fields[0], 10);
        const to = Number.parseInt(fields[1], 10);
        const through = Number.parseInt(fields[3], 10);
        if (!Number.isInteger(from) || !Number.isInteger(to)) {
            output.push(line);
            continue;
        }

        // Preserve header and terminal sentinel rows verbatim.
        if (from === -1 || to === -1) {
            output.push(line);
            continue;
        }

        const nextFrom = replacementFor(from, replacements);
        const nextTo = replacementFor(to, replacements);
        const nextThrough = Number.isInteger(through) && through >= 0
            ? replacementFor(through, replacements)
            : through;
        replacementCount += Number(nextFrom !== from) + Number(nextTo !== to) + Number(nextThrough !== through);

        if (nextFrom === nextTo ||
            (validSourceProvinceIds && (!validSourceProvinceIds.has(from) ||
                !validSourceProvinceIds.has(to) ||
                (through >= 0 && !validSourceProvinceIds.has(through)))) ||
            (validProvinceIds && (!validProvinceIds.has(nextFrom) || !validProvinceIds.has(nextTo) ||
                (nextThrough >= 0 && !validProvinceIds.has(nextThrough))))) {
            removals++;
            continue;
        }

        fields[0] = String(nextFrom);
        fields[1] = String(nextTo);
        if (Number.isInteger(through)) {
            fields[3] = String(nextThrough);
        }

        const key = [
            Math.min(nextFrom, nextTo),
            Math.max(nextFrom, nextTo),
            fields[2],
            fields[3],
            fields[8],
        ].join('|');
        if (seen.has(key)) {
            removals++;
            continue;
        }
        seen.add(key);
        output.push(fields.join(delimiter));
    }

    return { text: output.join(eol), replacements: replacementCount, removals, warnings: [] };
}

/**
 * Rewrites map/railways.txt. Consecutive duplicates caused by a province merge
 * are collapsed and the declared province count is corrected.
 */
export function repairRailways(
    source: string,
    replacements: Readonly<Record<number, number>>,
    validProvinceIds?: ReadonlySet<number>,
    validSourceProvinceIds?: ReadonlySet<number>
): ProvinceReferenceRepairResult {
    const eol = eolOf(source);
    const output: string[] = [];
    const warnings: string[] = [];
    let replacementCount = 0;
    let removals = 0;

    source.split(/\r?\n/).forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            output.push(line);
            return;
        }

        const values = trimmed.split(/\s+/).map(value => Number.parseInt(value, 10));
        if (values.length < 3 || values.some(value => !Number.isInteger(value))) {
            output.push(line);
            return;
        }

        const level = values[0];
        const declaredCount = values[1];
        const ids = values.slice(2, 2 + Math.max(0, declaredCount));
        const repaired: number[] = [];
        for (const id of ids) {
            const next = replacementFor(id, replacements);
            replacementCount += Number(next !== id);
            if ((validSourceProvinceIds && !validSourceProvinceIds.has(id)) ||
                (validProvinceIds && !validProvinceIds.has(next))) {
                removals++;
                continue;
            }
            if (repaired[repaired.length - 1] === next) {
                removals++;
            } else {
                repaired.push(next);
            }
        }

        if (repaired.length < 2) {
            removals++;
            warnings.push(`Railway line ${index + 1} was removed because fewer than two distinct provinces remain.`);
            return;
        }

        output.push(`${level} ${repaired.length} ${repaired.join(' ')}`);
    });

    return { text: output.join(eol), replacements: replacementCount, removals, warnings };
}

/**
 * Rewrites map/supply_nodes.txt and removes duplicate nodes that collapse onto
 * the same province, retaining the highest level.
 */
export function repairSupplyNodes(
    source: string,
    replacements: Readonly<Record<number, number>>,
    validProvinceIds?: ReadonlySet<number>,
    validSourceProvinceIds?: ReadonlySet<number>
): ProvinceReferenceRepairResult {
    const eol = eolOf(source);
    const passthrough: string[] = [];
    const nodeOrder: number[] = [];
    const nodeLevels = new Map<number, number>();
    let replacementCount = 0;
    let removals = 0;

    for (const line of source.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            passthrough.push(line);
            continue;
        }

        const values = trimmed.split(/\s+/).map(value => Number.parseInt(value, 10));
        if (values.length < 2 || !Number.isInteger(values[0]) || !Number.isInteger(values[1])) {
            passthrough.push(line);
            continue;
        }

        const level = values[0];
        const province = replacementFor(values[1], replacements);
        replacementCount += Number(province !== values[1]);
        if ((validSourceProvinceIds && !validSourceProvinceIds.has(values[1])) ||
            (validProvinceIds && !validProvinceIds.has(province))) {
            removals++;
            continue;
        }
        if (!nodeLevels.has(province)) {
            nodeOrder.push(province);
            nodeLevels.set(province, level);
        } else {
            removals++;
            nodeLevels.set(province, Math.max(nodeLevels.get(province)!, level));
        }
    }

    const nodes = nodeOrder.map(province => `${nodeLevels.get(province)} ${province}`);
    return { text: [...passthrough, ...nodes].join(eol), replacements: replacementCount, removals, warnings: [] };
}
