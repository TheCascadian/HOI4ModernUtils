declare var previewedFileUri: string | undefined;
declare function acquireVsCodeApi(): VSCodeAPI;
declare var __worldMapKeybinds: {
    selectionUndo?: string;
    selectionRedo?: string;
    mapUndo?: string;
    mapRedo?: string;
    createStateFromSelection?: string;
    assignSelectionToState?: string;
    assignSelectionToStrategicRegion?: string;
} | undefined;

declare interface VSCodeAPI {
    setState<T>(state: T): void;
    getState<T>(): T | undefined;
    postMessage<T>(message: T): void;
}

declare namespace NodeJS {
    interface Require {
        context(directory: string, useSubdirectories?: boolean, regExp?: RegExp, mode?: string): NodeJS.Require;
    }
}
