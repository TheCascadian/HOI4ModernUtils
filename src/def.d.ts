declare module 'vscode' {
    namespace workspace {
        export function getConfiguration(section: 'hoi4ModernUtils'): WorkspaceConfiguration & {
            readonly installPath: string;
            readonly loadDlcContents: boolean;
            readonly modFile: string;
            readonly featureFlags: string[];
            readonly enableSupplyArea: boolean;
            readonly previewLocalisation: 'Use Visual Studio Code Language' | 'Brazilian Portuguese' | 'English' | 'French' | 'German' | 'Japanese' | 'Korean' | 'Polish' | 'Russian' | 'Simplified Chinese' | 'Spanish';
            readonly stateBoundaryColor: string;
            readonly stateBoundaryWidth: number;
            readonly indexing: ('gfx' | 'sharedfocus' | 'localisation' | 'event' | 'gui')[];
            readonly worldMapConfirmNewProvinceCreation: boolean;
        };
    }
}

declare module 'vscode' {
    // Tab API (VS Code 1.67+); declared locally because @types/vscode targets 1.52.
    export class TabInputText {
        readonly uri: Uri;
    }
    export interface Tab {
        readonly input: unknown;
    }
    export interface TabGroup {
        readonly tabs: readonly Tab[];
    }
    export interface TabChangeEvent {
        readonly opened: readonly Tab[];
        readonly closed: readonly Tab[];
        readonly changed: readonly Tab[];
    }
    export interface TabGroups {
        readonly all: readonly TabGroup[];
        readonly onDidChangeTabs: Event<TabChangeEvent>;
    }
    namespace window {
        export const tabGroups: TabGroups;
    }
}

declare module '*.html' {
    const _default: string;
    export default _default;
}

declare module '*.css' {
    const _default: string;
    export default _default;
}

declare const VERSION: string;
declare const EXTENSION_ID: string;
declare const IS_WEB_EXT: boolean;

declare module 'tga' {
    class TGA {
        constructor(buffer: Buffer, opt?: unknown);
        static createTgaBuffer(width: number, height: number, pixels: [], dontFlipY: boolean): Buffer;
        static getHeader(buffer: Buffer): unknown;
        parse(): void;
        readHeader(): unknown;
        check(): boolean;
        addPixel(arr: number[], offset: number, idx: number): void;
        readPixels(): void;
        width: number;
        height: number;
        pixels: Uint8Array | undefined;
    }
    export = TGA;
}
