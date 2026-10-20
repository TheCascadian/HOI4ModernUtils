/** Focus IDs are written bare into script, so whitespace, braces, `=`, `#` and quotes would corrupt the file. */
export function isValidFocusId(id: string): boolean {
    return /^[A-Za-z0-9_.\-']+$/.test(id);
}
