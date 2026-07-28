export type AreaOperation =
    'clear-railways' |
    'clear-buildings' |
    'one-population-per-state' |
    'clear-supply-hubs' |
    'clear-water-crossings' |
    'clear-resources' |
    'lowest-development' |
    'convert-to-ocean';

export interface TextTransformResult {
    text: string;
    changed: number;
}

export interface ProvinceTypeMergeItem {
    id: number;
    type: string;
}

export type OceanTileReadinessIssue =
    'invalid-id' |
    'missing-color' |
    'missing-pixels' |
    'not-sea' |
    'not-ocean-terrain' |
    'nonzero-continent' |
    'coastal-flag' |
    'state-membership' |
    'strategic-region-membership' |
    'railway-reference' |
    'supply-node-reference';

export interface OceanTileReadinessInput {
    id: number;
    color: number;
    mass: number;
    type: string;
    terrain: string;
    continent: number;
    coastal: boolean;
    stateIds: number[];
    strategicRegionIds: number[];
    railwayReferences: number;
    hasSupplyNode: boolean;
}

export function verifyOceanTileReadiness(
    tile: OceanTileReadinessInput
): { ready: boolean; issues: OceanTileReadinessIssue[] } {
    const issues: OceanTileReadinessIssue[] = [];
    if (!Number.isInteger(tile.id) || tile.id <= 0) {
        issues.push('invalid-id');
    }
    if (!Number.isInteger(tile.color) || tile.color <= 0) {
        issues.push('missing-color');
    }
    if (!Number.isFinite(tile.mass) || tile.mass <= 0) {
        issues.push('missing-pixels');
    }
    if (tile.type !== 'sea') {
        issues.push('not-sea');
    }
    if (tile.terrain.toLowerCase() !== 'ocean') {
        issues.push('not-ocean-terrain');
    }
    if (tile.continent !== 0) {
        issues.push('nonzero-continent');
    }
    if (tile.coastal) {
        issues.push('coastal-flag');
    }
    if (tile.stateIds.length > 0) {
        issues.push('state-membership');
    }
    if (new Set(tile.strategicRegionIds).size !== 1) {
        issues.push('strategic-region-membership');
    }
    if (tile.railwayReferences > 0) {
        issues.push('railway-reference');
    }
    if (tile.hasSupplyNode) {
        issues.push('supply-node-reference');
    }
    return { ready: issues.length === 0, issues };
}

/**
 * Builds a deterministic merge plan without ever crossing HOI4 province
 * types. In particular, lake provinces must not be painted into a sea
 * province merely because both are water.
 */
export function planProvinceMergesByType(
    provinces: ReadonlyArray<ProvinceTypeMergeItem>
): { survivorIds: number[]; replacements: Record<number, number> } {
    const groups = new Map<string, number[]>();
    for (const province of [...provinces].sort((a, b) => a.id - b.id)) {
        const ids = groups.get(province.type) ?? [];
        ids.push(province.id);
        groups.set(province.type, ids);
    }
    const survivorIds: number[] = [];
    const replacements: Record<number, number> = {};
    for (const ids of groups.values()) {
        const survivorId = ids[0];
        if (survivorId === undefined) {
            continue;
        }
        survivorIds.push(survivorId);
        for (const id of ids.slice(1)) {
            replacements[id] = survivorId;
        }
    }
    return { survivorIds, replacements };
}

/**
 * Splits a region's current province membership around an operation scope.
 * Only in-scope IDs are remapped. This keeps prior edits outside the current
 * continent untouched, even when a state or strategic region crosses the
 * continent boundary.
 */
export function partitionMappedMembership(
    provinceIds: Iterable<number>,
    scopedProvinceIds: ReadonlySet<number>,
    replacements: Readonly<Record<number, number>>
): { inside: number[]; outside: number[] } {
    const inside = new Set<number>();
    const outside = new Set<number>();
    for (const id of provinceIds) {
        if (scopedProvinceIds.has(id)) {
            inside.add(replacements[id] ?? id);
        } else {
            outside.add(id);
        }
    }
    return {
        inside: Array.from(inside).sort((a, b) => a - b),
        outside: Array.from(outside).sort((a, b) => a - b),
    };
}

export function replaceStateIdsInSupplyAreas(
    text: string,
    replacements: Readonly<Record<number, number>>
): TextTransformResult {
    let changed = 0;
    const targetIds = new Set(Object.values(replacements));
    const output = text.replace(/\bstates\s*=\s*\{([^}]*)\}/g, (whole, body: string) => {
        const values = body.trim().split(/\s+/).filter(Boolean);
        const numericValues = values.map(value => Number.parseInt(value, 10));
        const keepsMergedState = numericValues.some(id => targetIds.has(id));
        const mapped = values.flatMap(value => {
            const id = Number.parseInt(value, 10);
            const replacement = Number.isInteger(id) ? replacements[id] : undefined;
            if (replacement !== undefined && replacement !== id) {
                changed++;
                return keepsMergedState ? [String(replacement)] : [];
            }
            return [Number.isInteger(id) ? String(id) : value];
        });
        const unique = Array.from(new Set(mapped));
        if (unique.join(' ') === values.join(' ')) {
            return whole;
        }
        return `states = { ${unique.join(' ')} }`;
    });
    return { text: output, changed };
}

export interface PreservedStateFields {
    name: string;
    manpower: number;
    category: string;
    provinces: number[];
    impassable: boolean;
    owner?: string;
    controller?: string;
    cores: string[];
    victoryPoints: Record<number, number | undefined>;
    resources: Record<string, number | undefined>;
}

function namedBlockRange(text: string, name: string): { start: number; end: number } | undefined {
    const match = new RegExp(`\\b${name}\\s*=\\s*\\{`).exec(text);
    if (!match) {
        return undefined;
    }
    const open = text.indexOf('{', match.index);
    let depth = 0;
    for (let index = open; index < text.length; index++) {
        if (text[index] === '{') {
            depth++;
        }
        if (text[index] === '}') {
            depth--;
            if (depth === 0) {
                return { start: match.index, end: index + 1 };
            }
        }
    }
    return undefined;
}

/** Updates map-owned state fields while preserving buildings and unknown effects. */
export function patchStatePreservingUnknownContent(
    original: string,
    state: PreservedStateFields,
    eol: string
): string {
    let text = original;
    const replaceScalar = (name: string, value: string) => {
        const pattern = new RegExp(`\\b${name}\\s*=\\s*(?:"[^"]*"|[^\\s#}]+)`);
        text = pattern.test(text)
            ? text.replace(pattern, `${name} = ${value}`)
            : text.replace(/\{/, `{${eol}\t${name} = ${value}`);
    };
    replaceScalar('name', `"${state.name.replace(/"/g, '\\"')}"`);
    replaceScalar('manpower', String(state.manpower));
    replaceScalar('state_category', state.category);
    const provinces = [...state.provinces].sort((a, b) => a - b).join(' ');
    text = text.replace(/\bprovinces\s*=\s*\{[^}]*\}/, `provinces = { ${provinces} }`);

    text = text.replace(/^[\t ]*impassable\s*=\s*(?:yes|no)\s*(?:\r?\n)?/m, '');
    if (state.impassable) {
        text = text.replace(/\bprovinces\s*=\s*\{[^}]*\}/, match => `${match}${eol}\timpassable = yes`);
    }

    const resourceEntries = Object.entries(state.resources)
        .filter(([, value]) => value !== undefined)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, value]) => `\t\t${key} = ${value}`);
    const resources = resourceEntries.length > 0
        ? ['resources = {', ...resourceEntries, '\t}'].join(eol)
        : '';
    text = /\bresources\s*=\s*\{[^}]*\}/.test(text)
        ? text.replace(/\bresources\s*=\s*\{[^}]*\}/, resources)
        : resources
            ? text.replace(/\bhistory\s*=/, `\t${resources}${eol}\thistory =`)
            : text;

    const historyRange = namedBlockRange(text, 'history');
    if (!historyRange) {
        return text;
    }
    const lines = text.slice(historyRange.start, historyRange.end).split(/\r?\n/);
    const retained: string[] = [];
    let depth = 0;
    for (const line of lines) {
        const trimmed = line.trim();
        const directKnownEntry = depth === 1 &&
            /^(?:owner|controller|add_core_of)\s*=/.test(trimmed);
        const directVictoryPoint = depth === 1 && /^victory_points\s*=/.test(trimmed);
        if (!directKnownEntry && !directVictoryPoint) {
            retained.push(line);
        }
        for (const char of line) {
            if (char === '{') {
                depth++;
            }
            if (char === '}') {
                depth--;
            }
        }
    }
    const known: string[] = [];
    if (state.owner) {
        known.push(`\t\towner = ${state.owner}`);
    }
    if (state.controller) {
        known.push(`\t\tcontroller = ${state.controller}`);
    }
    known.push(...[...state.cores]
        .filter((value, index, values) => value && values.indexOf(value) === index)
        .map(core => `\t\tadd_core_of = ${core}`));
    known.push(...Object.entries(state.victoryPoints)
        .map(([provinceId, value]) => [Number.parseInt(provinceId, 10), value] as const)
        .filter(([, value]) => value !== undefined)
        .sort((a, b) => a[0] - b[0])
        .map(([provinceId, value]) => `\t\tvictory_points = { ${provinceId} ${value} }`));
    retained.splice(1, 0, ...known);
    return text.slice(0, historyRange.start) + retained.join(eol) + text.slice(historyRange.end);
}

/** Moves province membership and victory points without rewriting state data. */
export function patchStateMembershipPreservingContent(
    original: string,
    provinces: number[],
    victoryPoints: Record<number, number | undefined>,
    eol: string
): string {
    const provinceList = [...provinces].sort((a, b) => a - b).join(' ');
    let text = /\bprovinces\s*=\s*\{[^}]*\}/.test(original)
        ? original.replace(/\bprovinces\s*=\s*\{[^}]*\}/, `provinces = { ${provinceList} }`)
        : original.replace(/\{/, `{${eol}\tprovinces = { ${provinceList} }`);
    const historyRange = namedBlockRange(text, 'history');
    if (!historyRange) {
        return text;
    }
    const lines = text.slice(historyRange.start, historyRange.end).split(/\r?\n/);
    const retained: string[] = [];
    let depth = 0;
    for (const line of lines) {
        const directVictoryPoint = depth === 1 && /^victory_points\s*=/.test(line.trim());
        if (!directVictoryPoint) {
            retained.push(line);
        }
        for (const char of line) {
            if (char === '{') {
                depth++;
            }
            if (char === '}') {
                depth--;
            }
        }
    }
    const entries = Object.entries(victoryPoints)
        .map(([provinceId, value]) => [Number.parseInt(provinceId, 10), value] as const)
        .filter(([, value]) => value !== undefined)
        .sort((a, b) => a[0] - b[0])
        .map(([provinceId, value]) => `\t\tvictory_points = { ${provinceId} ${value} }`);
    retained.splice(1, 0, ...entries);
    return text.slice(0, historyRange.start) + retained.join(eol) + text.slice(historyRange.end);
}

export function removeAllCores(text: string): TextTransformResult {
    let changed = 0;
    const withoutCoreLines = text.replace(
        /^[ \t]*(?:add_core_of|remove_core_of)[ \t]*=[ \t]*[^\s#}]+[^\r\n]*(?:\r?\n|$)/gm,
        () => {
            changed++;
            return '';
        }
    );
    const output = withoutCoreLines.replace(
        /\b(?:add_core_of|remove_core_of)\s*=\s*[^\s#}]+/g,
        () => {
            changed++;
            return '';
        }
    );
    return { text: output, changed };
}

function eolOf(text: string): string {
    return text.includes('\r\n') ? '\r\n' : '\n';
}

function keepTrailingEol(source: string, lines: string[]): string {
    return lines.join(eolOf(source));
}

export function clearRailways(text: string, provinceIds: ReadonlySet<number>): TextTransformResult {
    let changed = 0;
    const lines = text.split(/\r?\n/).filter(line => {
        const values = line.trim().split(/\s+/).map(Number);
        const remove = values.length >= 3 && values.slice(2).some(id => provinceIds.has(id));
        if (remove) {changed++;}
        return !remove;
    });
    return { text: keepTrailingEol(text, lines), changed };
}

export function clearSupplyHubs(text: string, provinceIds: ReadonlySet<number>): TextTransformResult {
    let changed = 0;
    const lines = text.split(/\r?\n/).filter(line => {
        const values = line.trim().split(/\s+/).map(Number);
        const remove = values.length >= 2 && provinceIds.has(values[1]);
        if (remove) {changed++;}
        return !remove;
    });
    return { text: keepTrailingEol(text, lines), changed };
}

export function clearMapBuildings(text: string, provinceIds: ReadonlySet<number>): TextTransformResult {
    let changed = 0;
    const lines = text.split(/\r?\n/).filter(line => {
        const id = Number.parseInt(line.trim().split(/[;\s]/)[0], 10);
        const remove = Number.isInteger(id) && provinceIds.has(id);
        if (remove) {changed++;}
        return !remove;
    });
    return { text: keepTrailingEol(text, lines), changed };
}

export function clearWaterCrossings(text: string, provinceIds?: ReadonlySet<number>): TextTransformResult {
    let changed = 0;
    const lines = text.split(/\r?\n/).filter(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {return true;}
        const delimiter = line.includes(';') ? ';' : ',';
        const fields = line.split(delimiter);
        if (fields.length < 9) {return true;}
        const from = Number.parseInt(fields[0], 10);
        const to = Number.parseInt(fields[1], 10);
        const through = Number.parseInt(fields[3], 10);
        if (!Number.isInteger(from) || from < 0 || !Number.isInteger(to) || to < 0) {return true;}
        const type = fields[2].trim().toLowerCase();
        const rule = fields[8].trim().toLowerCase();
        const isWaterCrossing = type === 'sea' || type === 'canal' || rule.includes('canal') || rule.includes('strait');
        const inScope = !provinceIds || provinceIds.has(from) || provinceIds.has(to) ||
            (through >= 0 && provinceIds.has(through));
        if (isWaterCrossing && inScope) {
            changed++;
            return false;
        }
        return true;
    });
    return { text: keepTrailingEol(text, lines), changed };
}

export function partitionLandAndWaterProvinces(
    provinceIds: Iterable<number>,
    replacements: Readonly<Record<number, number>>,
    provinceTypes: Readonly<Record<number, string | undefined>>
): { land: number[]; water: number[] } {
    const land = new Set<number>();
    const water = new Set<number>();
    for (const id of provinceIds) {
        const mappedId = replacements[id] ?? id;
        const type = provinceTypes[mappedId] ?? provinceTypes[id];
        (type === 'land' ? land : water).add(mappedId);
    }
    return {
        land: Array.from(land).sort((a, b) => a - b),
        water: Array.from(water).sort((a, b) => a - b),
    };
}

export function convertDefinitionsToOcean(text: string, provinceIds: ReadonlySet<number>): TextTransformResult {
    let changed = 0;
    const lines = text.split(/\r?\n/).map(line => {
        const fields = line.split(';');
        const id = Number.parseInt(fields[0], 10);
        if (!provinceIds.has(id) || fields.length < 8) {return line;}
        fields[4] = 'sea';
        fields[5] = 'false';
        fields[6] = 'ocean';
        fields[7] = '0';
        changed++;
        return fields.join(';');
    });
    return { text: keepTrailingEol(text, lines), changed };
}

function findNamedBlocks(text: string, name: string): Array<{ start: number; end: number; bodyStart: number; bodyEnd: number }> {
    const result: Array<{ start: number; end: number; bodyStart: number; bodyEnd: number }> = [];
    const regex = new RegExp(`\\b${name}\\s*=\\s*\\{`, 'g');
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text))) {
        const open = text.indexOf('{', match.index);
        let depth = 0;
        for (let i = open; i < text.length; i++) {
            if (text[i] === '{') {depth++;}
            if (text[i] === '}') {depth--;}
            if (depth === 0) {
                result.push({ start: match.index, end: i + 1, bodyStart: open + 1, bodyEnd: i });
                regex.lastIndex = i + 1;
                break;
            }
        }
    }
    return result;
}

function stateId(block: string): number | undefined {
    const match = block.match(/\bid\s*=\s*(\d+)/);
    return match ? Number.parseInt(match[1], 10) : undefined;
}

export function transformSelectedStates(
    text: string,
    stateIds: ReadonlySet<number>,
    operation: 'clear-buildings' | 'clear-resources' | 'one-population-per-state' | 'lowest-development' | 'convert-to-ocean',
    lowestCategory = 'pastoral'
): TextTransformResult {
    let output = text;
    let changed = 0;
    const blocks = findNamedBlocks(text, 'state').reverse();
    for (const range of blocks) {
        const block = output.slice(range.start, range.end);
        if (!stateIds.has(stateId(block) ?? -1)) {continue;}
        let next = block;
        if (operation === 'one-population-per-state') {
            next = /\bmanpower\s*=\s*\d+/.test(next)
                ? next.replace(/\bmanpower\s*=\s*\d+/, 'manpower = 1')
                : next.replace(/\{/, '{\n\tmanpower = 1');
        } else if (operation === 'lowest-development') {
            next = /\bstate_category\s*=\s*[^\s#}]+/.test(next)
                ? next.replace(/\bstate_category\s*=\s*[^\s#}]+/, `state_category = ${lowestCategory}`)
                : next.replace(/\{/, `{\n\tstate_category = ${lowestCategory}`);
        } else if (operation === 'clear-buildings' || operation === 'clear-resources') {
            const blockName = operation === 'clear-buildings' ? 'buildings' : 'resources';
            for (const block of findNamedBlocks(next, blockName).reverse()) {
                next = next.slice(0, block.start) + next.slice(block.end);
            }
        } else {
            next = next.replace(/\bprovinces\s*=\s*\{[^}]*\}/, 'provinces = { }');
            for (const building of findNamedBlocks(next, 'buildings').reverse()) {
                next = next.slice(0, building.start) + next.slice(building.end);
            }
        }
        if (next !== block) {
            output = output.slice(0, range.start) + next + output.slice(range.end);
            changed++;
        }
    }
    return { text: output, changed };
}

export function removeProvincesFromRegionBlocks(
    text: string,
    provinceIds: ReadonlySet<number>,
    removeEmptyBlocks = false,
    blockName?: 'state' | 'strategic_region'
): TextTransformResult {
    if (removeEmptyBlocks && blockName) {
        let output = text;
        let changed = 0;
        for (const block of findNamedBlocks(text, blockName).reverse()) {
            const original = output.slice(block.start, block.end);
            const transformed = removeProvincesFromRegionBlocks(original, provinceIds);
            changed += transformed.changed;
            const remaining = transformed.text.match(/\bprovinces\s*=\s*\{([^}]*)\}/)?.[1].trim();
            output = output.slice(0, block.start) +
                (remaining ? transformed.text : '') +
                output.slice(block.end);
        }
        return { text: output, changed };
    }
    let changed = 0;
    const output = text.replace(/\bprovinces\s*=\s*\{([^}]*)\}/g, (whole, body: string) => {
        const values = body.trim().split(/\s+/).filter(Boolean);
        const kept = values.filter(value => !provinceIds.has(Number.parseInt(value, 10)));
        if (kept.length === values.length) {return whole;}
        changed += values.length - kept.length;
        return `provinces = { ${kept.join(' ')} }`;
    });
    return { text: output, changed };
}
