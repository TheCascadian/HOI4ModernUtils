import * as yaml from 'js-yaml';

export function parseLocalisationYaml(content: string, file?: string): any {
    content = preprocessYamlContent(content, file);

    // set "json: true" to allow duplicate keys
    try {
        return yaml.safeLoad(content, { schema: yaml.JSON_SCHEMA, json: true });
    } catch {
        return parseParadoxLocalisationLines(content);
    }
}

function parseParadoxLocalisationLines(content: string): Record<string, Record<string, string>> {
    const lines = content.split(/\r?\n/);
    const headerLine = lines.find(line => /^\s*l_[A-Za-z0-9_]+\s*:/.test(line));
    const headerMatch = headerLine?.match(/^\s*(l_[A-Za-z0-9_]+)\s*:/);
    if (!headerMatch) {
        throw new Error('Localisation file has no language header.');
    }

    const entries: Record<string, string> = {};
    for (const rawLine of lines) {
        if (/^\s*(?:#|$)/.test(rawLine) || rawLine === headerLine) {
            continue;
        }

        const match = rawLine.match(/^\s*([^:#][^:]*?):(?:\d+)?\s*(.*)$/);
        if (!match) {
            continue;
        }

        const key = match[1].trim();
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
            value = value.substring(1, value.length - 1)
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');
        }
        entries[key] = value;
    }

    return { [headerMatch[1]]: entries };
}

function preprocessYamlContent(fileContent: string, file?: string): string {
    const lines = fileContent.split(/(?:\r\n|\r|\n)/g);
    const processedLines: string[] = [];

    let headerAdded = false;

    // Can't the goddamn Paradox employees and modders just write standard localization yml files?
    for (const l of lines) {
        let line = l;
        if (line.match(/^\s*(#|$)/)) {
            // # comment or empty line
            processedLines.push('');
            continue;
        }

        line = line.trim();

        // Remove "0" in "loc_key:0 <value>" because it's not standard yaml
        line = line.replace(/^([^:]+):(\d+)(?=\s|"|$)/, '$1:');

        if (!headerAdded) {
            processedLines.push(line);
            headerAdded = true;
            continue;
        }

        // For all double quoted strings
        line = line.replace(/^([^:]+):\s*"((?:[^\\]|\\.)*)".*/, (_, p1, p2) => { 
            // Remove redundent prefix \ if it's not a escape character
            p2 = p2.replace(/\\([^0abt\tnvfre "\/\\N_LPxuU])/g, '$1');

            // Add missing `\` before `"` in string
            p2 = p2.replace(/(?<!\\)"/g, '\\"');

            // Drop content outside last `"`
            return `${p1}: "${p2}"`;
        });

        processedLines.push(' ' + line);
    }

    return processedLines.join('\n');
}
