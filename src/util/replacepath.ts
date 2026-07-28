export interface ReplacePathUpdate {
    text: string;
    added: string[];
}

export function normalizeReplacePath(value: string): string {
    return value
        .trim()
        .replace(/\\/g, '/')
        .replace(/\/+/g, '/')
        .replace(/^\/|\/$/g, '')
        .toLowerCase();
}

/**
 * Add missing replace_path declarations without reformatting or reparsing the
 * rest of the mod descriptor.
 */
export function addReplacePathsToDescriptor(
    descriptorText: string,
    requestedPaths: readonly string[]
): ReplacePathUpdate {
    const existing = new Set<string>();
    const replacePathPattern = /^[\s\uFEFF]*replace_path\s*=\s*(?:"([^"]+)"|([^\s#]+))/gmi;
    let match: RegExpExecArray | null;
    while ((match = replacePathPattern.exec(descriptorText)) !== null) {
        existing.add(normalizeReplacePath(match[1] ?? match[2]));
    }

    const added: string[] = [];
    for (const requested of requestedPaths) {
        const normalized = normalizeReplacePath(requested);
        if (normalized && !existing.has(normalized)) {
            existing.add(normalized);
            added.push(normalized);
        }
    }

    if (added.length === 0) {
        return { text: descriptorText, added };
    }

    const eol = descriptorText.includes('\r\n') ? '\r\n' : '\n';
    const trailingWhitespace = descriptorText.match(/\s*$/)?.[0] ?? '';
    const body = descriptorText.substring(0, descriptorText.length - trailingWhitespace.length);
    const separator = body.length > 0 ? eol : '';
    const declarations = added.map(value => `replace_path = "${value}"`).join(eol);

    return {
        text: `${body}${separator}${declarations}${eol}`,
        added,
    };
}
