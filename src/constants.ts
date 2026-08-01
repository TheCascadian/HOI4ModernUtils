// This file contains constants that may be used in package.json

export const ConfigurationKey = 'hoi4ModernUtils';
export const Hoi4FsScheme = 'hoi4installpath';

export namespace ViewType {
    export const DDS = 'hoi4modernutils.dds';
    export const TGA = 'hoi4modernutils.tga';
}

export namespace ContextName {
    export const ShouldHideHoi4Preview = 'shouldHideHoi4Preview';
    export const ShouldShowHoi4Preview = 'shouldShowHoi4Preview';
    export const Hoi4PreviewType = 'hoi4PreviewType';
    export const Hoi4MUInDev = 'hoi4MUInDev';
    export const Hoi4MULoaded = 'hoi4MULoaded';
}

export namespace Commands {
    export const Preview = 'hoi4modernutils.preview';
    export const PreviewWorld = 'hoi4modernutils.previewworld';
    export const ScanAndLogErrors = 'hoi4modernutils.scanAndLogErrors';
    export const ScanReferences = 'hoi4modernutils.scanreferences';
    export const SelectModFile = 'hoi4modernutils.selectmodfile';
    export const SelectHoiFolder = 'hoi4modernutils.selecthoifolder';
}

export namespace WebviewType {
    export const Preview = 'hoi4modernutils.ftpreview';
    export const PreviewWorldMap = 'hoi4modernutils.worldmappreview';
}
