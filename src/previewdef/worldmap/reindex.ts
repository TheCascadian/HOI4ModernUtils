export interface ReindexResult {
    text: string;
    changed: number;
}

export function createSequentialIdMap(ids: readonly number[]): Record<number, number> {
    return Object.fromEntries(
        Array.from(new Set(ids.filter(id => Number.isInteger(id) && id > 0)))
            .sort((a, b) => a - b)
            .map((id, index) => [id, index + 1])
    );
}

function mapId(id: number, replacements: Readonly<Record<number, number>>): number | undefined {
    return Object.prototype.hasOwnProperty.call(replacements, id)
        ? replacements[id]
        : undefined;
}

function requireMappedId(
    id: number,
    replacements: Readonly<Record<number, number>>,
    context: string
): number {
    const mapped = mapId(id, replacements);
    if (mapped === undefined) {
        throw new Error(`Cannot reindex unknown ${context} ID ${id}.`);
    }
    return mapped;
}

function findNamedBlocks(text: string, name: string): Array<{ start: number; end: number }> {
    const result: Array<{ start: number; end: number }> = [];
    const regex = new RegExp(`\\b${name}\\s*=\\s*\\{`, 'g');
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text))) {
        const open = text.indexOf('{', match.index);
        let depth = 0;
        for (let index = open; index < text.length; index++) {
            if (text[index] === '{') {depth++;}
            else if (text[index] === '}') {depth--;}
            if (depth === 0) {
                result.push({ start: match.index, end: index + 1 });
                regex.lastIndex = index + 1;
                break;
            }
        }
    }
    return result;
}

function replaceNumberList(
    text: string,
    name: string,
    replacements: Readonly<Record<number, number>>
): ReindexResult {
    let changed = 0;
    const regex = new RegExp(`\\b${name}\\s*=\\s*\\{([^}]*)\\}`, 'g');
    const output = text.replace(regex, (whole, body: string) => {
        const nextBody = body.split(/(\r?\n)/).map(segment => {
            if (/^\r?\n$/.test(segment)) {
                return segment;
            }
            const commentIndex = segment.indexOf('#');
            const code = commentIndex >= 0 ? segment.slice(0, commentIndex) : segment;
            const comment = commentIndex >= 0 ? segment.slice(commentIndex) : '';
            const mappedCode = code.replace(/\b\d+\b/g, value => {
                const oldId = Number.parseInt(value, 10);
                const nextId = mapId(oldId, replacements);
                if (nextId === undefined) {
                    changed++;
                    return '';
                }
                changed += Number(nextId !== oldId);
                return String(nextId);
            }).replace(/[ \t]{2,}/g, ' ');
            return mappedCode + comment;
        }).join('');
        return whole.replace(body, nextBody);
    });
    return { text: output, changed };
}

function matchingBraceEnd(text: string, open: number): number | undefined {
    let depth = 0;
    for (let index = open; index < text.length; index++) {
        if (text[index] === '{') {depth++;}
        else if (text[index] === '}') {depth--;}
        if (depth === 0) {
            return index + 1;
        }
    }
    return undefined;
}

function replaceNumericBlockKeys(
    text: string,
    blockName: string,
    replacements: Readonly<Record<number, number>>
): ReindexResult {
    let output = text;
    let changed = 0;
    for (const block of findNamedBlocks(text, blockName).reverse()) {
        const source = output.slice(block.start, block.end);
        let next = source;
        const assignments: Array<{ start: number; numberEnd: number; end: number; oldId: number }> = [];
        const assignmentRegex = /\b(\d+)\s*=\s*\{/g;
        let match: RegExpExecArray | null;
        while ((match = assignmentRegex.exec(source))) {
            const open = source.indexOf('{', match.index);
            const end = matchingBraceEnd(source, open);
            if (end === undefined) {
                throw new Error(`Cannot reindex malformed ${blockName} block.`);
            }
            assignments.push({
                start: match.index,
                numberEnd: match.index + match[1].length,
                end,
                oldId: Number.parseInt(match[1], 10),
            });
            assignmentRegex.lastIndex = end;
        }
        for (const assignment of assignments.reverse()) {
            const nextId = mapId(assignment.oldId, replacements);
            changed++;
            if (nextId === undefined) {
                next = next.slice(0, assignment.start) + next.slice(assignment.end);
            } else if (nextId !== assignment.oldId) {
                next = next.slice(0, assignment.start) + String(nextId) +
                    next.slice(assignment.numberEnd);
            } else {
                changed--;
            }
        }
        output = output.slice(0, block.start) + next + output.slice(block.end);
    }
    return { text: output, changed };
}

function replaceVictoryPointPairs(
    text: string,
    provinceIds: Readonly<Record<number, number>>
): ReindexResult {
    let changed = 0;
    const output = text.replace(/\bvictory_points\s*=\s*\{([^}]*)\}/g, (whole, body: string) => {
        const uncommented = body.replace(/#.*$/gm, ' ');
        const tokens = uncommented.match(/[+-]?\d+(?:\.\d+)?/g) ?? [];
        const residue = uncommented.replace(/[+-]?\d+(?:\.\d+)?/g, '').trim();
        if (residue || tokens.length % 2 !== 0) {
            throw new Error('Cannot reindex malformed victory_points pairs.');
        }

        const pairs: string[] = [];
        let localChanged = 0;
        for (let index = 0; index < tokens.length; index += 2) {
            const oldId = Number(tokens[index]);
            if (!Number.isInteger(oldId) || oldId <= 0) {
                throw new Error(`Cannot reindex invalid victory point province ID ${tokens[index]}.`);
            }
            const nextId = mapId(oldId, provinceIds);
            if (nextId === undefined) {
                localChanged++;
                continue;
            }
            localChanged += Number(nextId !== oldId);
            pairs.push(String(nextId), tokens[index + 1]);
        }
        if (localChanged === 0) {
            return whole;
        }
        changed += localChanged;
        return pairs.length > 0 ? `victory_points = { ${pairs.join(' ')} }` : '';
    });
    return { text: output, changed };
}

export function reindexDefinitions(
    text: string,
    provinceIds: Readonly<Record<number, number>>
): ReindexResult {
    let changed = 0;
    const lines = text.split(/\r?\n/).map(line => {
        const fields = line.split(';');
        const oldId = Number.parseInt(fields[0], 10);
        if (!Number.isInteger(oldId) || oldId <= 0 || fields.length < 8) {return line;}
        const nextId = requireMappedId(oldId, provinceIds, 'province definition');
        if (nextId !== oldId) {
            fields[0] = String(nextId);
            changed++;
        }
        return fields.join(';');
    });
    return { text: lines.join(text.includes('\r\n') ? '\r\n' : '\n'), changed };
}

export function reindexStateFile(
    text: string,
    provinceIds: Readonly<Record<number, number>>,
    stateIds: Readonly<Record<number, number>>
): ReindexResult {
    let changed = 0;
    let output = text;
    for (const block of findNamedBlocks(text, 'state').reverse()) {
        const source = output.slice(block.start, block.end);
        const next = source.replace(/\bid\s*=\s*(\d+)/, (whole, value: string) => {
            const oldId = Number.parseInt(value, 10);
            const nextId = requireMappedId(oldId, stateIds, 'state');
            if (nextId === oldId) {return whole;}
            changed++;
            return whole.replace(value, String(nextId));
        });
        output = output.slice(0, block.start) + next + output.slice(block.end);
    }
    const provinces = replaceNumberList(output, 'provinces', provinceIds);
    output = provinces.text;
    changed += provinces.changed;
    const victoryPoints = replaceVictoryPointPairs(output, provinceIds);
    output = victoryPoints.text;
    changed += victoryPoints.changed;
    const buildings = replaceNumericBlockKeys(output, 'buildings', provinceIds);
    output = buildings.text;
    changed += buildings.changed;
    return { text: output, changed };
}

export function reindexStrategicRegionFile(
    text: string,
    provinceIds: Readonly<Record<number, number>>
): ReindexResult {
    return replaceNumberList(text, 'provinces', provinceIds);
}

export function reindexSupplyAreaFile(
    text: string,
    stateIds: Readonly<Record<number, number>>
): ReindexResult {
    return replaceNumberList(text, 'states', stateIds);
}

export function reindexCountryHistoryFile(
    text: string,
    stateIds: Readonly<Record<number, number>>
): ReindexResult {
    let changed = 0;
    const output = text.replace(/\bcapital\s*=\s*(\d+)/g, (whole, value: string) => {
        const oldId = Number.parseInt(value, 10);
        const nextId = requireMappedId(oldId, stateIds, 'capital state');
        if (nextId === oldId) {return whole;}
        changed++;
        return whole.replace(value, String(nextId));
    });
    return { text: output, changed };
}

export function reindexMapBuildings(
    text: string,
    provinceIds: Readonly<Record<number, number>>
): ReindexResult {
    let changed = 0;
    const output = text.split(/\r?\n/).flatMap(line => {
        const match = line.match(/^(\s*)(\d+)(\s*;)/);
        if (!match) {return [line];}
        const oldId = Number.parseInt(match[2], 10);
        const nextId = mapId(oldId, provinceIds);
        if (nextId === undefined) {
            changed++;
            return [];
        }
        if (nextId === oldId) {return [line];}
        changed++;
        return [line.replace(/^(\s*)\d+(\s*;)/, `$1${nextId}$2`)];
    }).join(text.includes('\r\n') ? '\r\n' : '\n');
    return { text: output, changed };
}

/** Reindexes map/unitstacks.txt column 1 and drops rows for unknown provinces. */
export function reindexUnitStacks(
    text: string,
    provinceIds: Readonly<Record<number, number>>
): ReindexResult {
    let changed = 0;
    const lines = text.split(/\r?\n/).flatMap((line, index) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            return [line];
        }
        const fields = line.split(';');
        const provinceMatch = fields[0]?.match(/^(\s*)(\d+)(\s*)$/);
        if (!provinceMatch || fields.length < 2) {
            throw new Error(`Cannot reindex malformed unitstacks row ${index + 1}.`);
        }
        const oldId = Number.parseInt(provinceMatch[2], 10);
        const nextId = mapId(oldId, provinceIds);
        if (nextId === undefined) {
            changed++;
            return [];
        }
        if (nextId !== oldId) {
            changed++;
            fields[0] = `${provinceMatch[1]}${nextId}${provinceMatch[3]}`;
        }
        return [fields.join(';')];
    });
    return { text: lines.join(text.includes('\r\n') ? '\r\n' : '\n'), changed };
}
