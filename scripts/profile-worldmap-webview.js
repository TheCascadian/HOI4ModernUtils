const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const installPathIndex = process.argv.indexOf('--install-path');
const installPath = installPathIndex >= 0
    ? process.argv[installPathIndex + 1]
    : process.env.HOI4_INSTALL_PATH;
const baselineIndex = process.argv.indexOf('--baseline');
const baselinePath = baselineIndex >= 0
    ? path.resolve(process.argv[baselineIndex + 1])
    : undefined;
const optimizationsIndex = process.argv.indexOf('--optimizations');
const optimizations = optimizationsIndex >= 0
    ? process.argv[optimizationsIndex + 1]
    : undefined;
const outputIndex = process.argv.indexOf('--output');
const outputPath = outputIndex >= 0
    ? path.resolve(process.argv[outputIndex + 1])
    : undefined;
const allowPixelChanges = process.argv.includes('--allow-pixel-changes');
const focused = process.argv.includes('--focused');

if (!installPath) {
    console.error('Missing HOI4 install path. Pass --install-path "<path>" or set HOI4_INSTALL_PATH.');
    process.exit(2);
}

const resolvedInstallPath = path.resolve(installPath);
const requiredFiles = [
    path.join(resolvedInstallPath, 'map', 'default.map'),
    path.join(resolvedInstallPath, 'map', 'provinces.bmp'),
    path.join(resolvedInstallPath, 'map', 'rivers.bmp'),
];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
if (missingFiles.length > 0) {
    console.error(`Invalid HOI4 install path. Missing:\n${missingFiles.join('\n')}`);
    process.exit(2);
}
if (baselinePath && !fs.existsSync(baselinePath)) {
    console.error(`World-map webview baseline does not exist: ${baselinePath}`);
    process.exit(2);
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(npmCommand, ['run', 'test-ui'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
        ...process.env,
        HOI4MU_WORLD_MAP_TEST: '1',
        HOI4_INSTALL_PATH: resolvedInstallPath,
        HOI4_WORLD_MAP_RUNTIME_BASELINE: baselinePath,
        HOI4_WORLD_MAP_RUNTIME_OPTIMIZATIONS: optimizations,
        HOI4_WORLD_MAP_RUNTIME_ALLOW_PIXEL_CHANGES: allowPixelChanges ? '1' : undefined,
        HOI4_WORLD_MAP_RUNTIME_OUTPUT: outputPath,
        HOI4_WORLD_MAP_RUNTIME_FOCUSED: focused ? '1' : undefined,
    },
    shell: process.platform === 'win32',
    stdio: 'inherit',
});

if (result.error) {
    console.error(result.error);
    process.exit(1);
}
process.exit(result.status ?? 1);
