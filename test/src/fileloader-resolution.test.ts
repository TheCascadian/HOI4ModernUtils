import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

describe('effective mod file resolution', () => {
    const source = fs.readFileSync(
        path.join(process.cwd(), 'src/util/fileloader.ts'),
        'utf-8'
    );

    it('searches the selected descriptor mod root for files and folders before vanilla fallback', () => {
        const configuredRootLookups = source.match(
            /const configuredModPath = await getModPathFromDescriptor\(\);/g
        ) ?? [];
        assert.strictEqual(configuredRootLookups.length, 2);

        const fileResolverStart = source.indexOf(
            'export async function getFilePathFromModOrHOI4'
        );
        const folderResolverStart = source.indexOf(
            'export async function listFilesFromModOrHOI4'
        );
        const installFallbackStart = source.indexOf(
            "const installPath = vscode.Uri.parse(Hoi4FsScheme + ':/');",
            fileResolverStart
        );
        const folderInstallFallbackStart = source.indexOf(
            "const installPath = vscode.Uri.parse(Hoi4FsScheme + ':/');",
            folderResolverStart
        );

        assert.ok(source.indexOf('const configuredModPath', fileResolverStart) < installFallbackStart);
        assert.ok(source.indexOf('const configuredModPath', folderResolverStart) < folderInstallFallbackStart);
    });
});
