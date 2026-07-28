let warningSink: (message: string) => void = message => console.warn(message);

export function setParserWarningSink(sink: (message: string) => void): void {
    warningSink = sink;
}
export function logParserWarning(message: string): void {
    warningSink(message);
}
