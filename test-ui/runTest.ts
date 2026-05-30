import * as path from 'path';

import { runTests } from 'vscode-test';

async function main() {
    try {
        // The folder containing the Extension Manifest package.json
        // Passed to `--extensionDevelopmentPath`
        const extensionDevelopmentPath = path.resolve(__dirname, '../');

        // The path to test runner
        // Passed to --extensionTestsPath
        const extensionTestsPath = path.resolve(__dirname, './suite/index');

        // Use the locally installed VS Code instead of downloading
        const vscodeExecutablePath = path.resolve(
            process.env['VSCODE_EXECUTABLE_PATH'] ??
            'C:\\Users\\Don McCann\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe'
        );
        await runTests({ extensionDevelopmentPath, extensionTestsPath, vscodeExecutablePath });
    } catch (err) {
        console.error('Failed to run tests');
        process.exit(1);
    }
}

main();
