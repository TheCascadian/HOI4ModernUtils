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

function mapId(id: number, replacements: Readonly<Record<number, number>>): number {
    return replacements[id] ?? id;
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
        const nextBody = body.replace(/\b\d+\b/g, value => {
            const oldId = Number.parseInt(value, 10);
            const nextId = mapId(oldId, replacements);
            changed += Number(nextId !== oldId);
            return String(nextId);
        });
        return whole.replace(body, nextBody);
    });
    return { text: output, changed };
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
        const next = source.replace(/\b(\d+)(\s*=\s*\{)/g, (whole, value: string, suffix: string) => {
            const oldId = Number.parseInt(value, 10);
            const nextId = mapId(oldId, replacements);
            if (nextId === oldId) {
                return whole;
            }
            changed++;
            return `${nextId}${suffix}`;
        });
        output = output.slice(0, block.start) + next + output.slice(block.end);
    }
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
        const nextId = mapId(oldId, provinceIds);
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
            const nextId = mapId(oldId, stateIds);
            if (nextId === oldId) {return whole;}
            changed++;
            return whole.replace(value, String(nextId));
        });
        output = output.slice(0, block.start) + next + output.slice(block.end);
    }
    const provinces = replaceNumberList(output, 'provinces', provinceIds);
    output = provinces.text;
    changed += provinces.changed;
    output = output.replace(/\bvictory_points\s*=\s*\{\s*(\d+)/g, (whole, value: string) => {
        const oldId = Number.parseInt(value, 10);
        const nextId = mapId(oldId, provinceIds);
        if (nextId === oldId) {return whole;}
        changed++;
        return whole.replace(value, String(nextId));
    });
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
        const nextId = mapId(oldId, stateIds);
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
    const output = text.split(/\r?\n/).map(line => {
        const match = line.match(/^(\s*)(\d+)(\s*;)/);
        if (!match) {return line;}
        const oldId = Number.parseInt(match[2], 10);
        const nextId = mapId(oldId, provinceIds);
        if (nextId === oldId) {return line;}
        changed++;
        return line.replace(/^(\s*)\d+(\s*;)/, `$1${nextId}$2`);
    }).join(text.includes('\r\n') ? '\r\n' : '\n');
    return { text: output, changed };
}
