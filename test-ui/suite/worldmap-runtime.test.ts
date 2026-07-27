import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import {
    WorldMapRuntimeTestCase,
    WorldMapRuntimeTestReport,
    WorldMapRuntimeTestRequest,
    WorldMapRuntimeTestOptimization,
} from '../../src/previewdef/worldmap/definitions';

const runtimeTestCommand = 'hoi4modernutils.test.worldmap.renderCases';
const displayFlags = [
    'edge',
    'label',
    'supply',
    'river',
    'stateboundary',
    'oceanstateboundary',
    'fastrending',
    'adaptzooming',
];

suite('World-map real webview runtime', () => {
    test('renders every valid mode/color pair and every display toggle at minimum and maximum zoom', async function() {
        this.timeout(420000);
        if (process.env.HOI4MU_WORLD_MAP_TEST !== '1') {
            this.skip();
            return;
        }

        const installPath = process.env.HOI4_INSTALL_PATH;
        if (!installPath || !fs.existsSync(path.join(installPath, 'map', 'default.map'))) {
            this.skip();
            return;
        }

        const configuration = vscode.workspace.getConfiguration('hoi4ModernUtils');
        const previous = {
            installPath: configuration.inspect<string>('installPath')?.globalValue,
            enableSupplyArea: configuration.inspect<boolean>('enableSupplyArea')?.globalValue,
            loadDlcContents: configuration.inspect<boolean>('loadDlcContents')?.globalValue,
        };

        try {
            await configuration.update('installPath', installPath, vscode.ConfigurationTarget.Global);
            await configuration.update('enableSupplyArea', true, vscode.ConfigurationTarget.Global);
            await configuration.update('loadDlcContents', false, vscode.ConfigurationTarget.Global);

            const extension = vscode.extensions.getExtension('thecascadian.hoi4modernutils');
            assert.ok(extension, 'Development extension was not installed in the Extension Host.');
            await extension.activate();

            const pairs = parseValidPairs();
            assert.strictEqual(pairs.length, 52);
            const focused = process.env.HOI4_WORLD_MAP_RUNTIME_FOCUSED === '1';
            const displaySets = focused
                ? [
                    [],
                    ['edge'],
                    ['river'],
                    ['label'],
                    ['fastrending'],
                    [...displayFlags],
                ]
                : [
                    [],
                    ...displayFlags.map(flag => [flag]),
                    [...displayFlags],
                ];
            const viewports = focused
                ? [{ name: 'minimum', scale: 0.25, xRatio: 0, yRatio: 0 }]
                : [
                    { name: 'minimum', scale: 0.25, xRatio: 0, yRatio: 0 },
                    { name: 'maximum-wrap', scale: 16, xRatio: 0.999, yRatio: 0.5 },
                ];
            const cases: WorldMapRuntimeTestCase[] = [];
            for (const pair of pairs) {
                for (const display of displaySets) {
                    for (const viewport of viewports) {
                        cases.push({
                            id: `${pair.viewMode}/${pair.colorSet}/${display.join('+') || 'none'}/${viewport.name}`,
                            viewMode: pair.viewMode,
                            colorSet: pair.colorSet,
                            display,
                            viewport,
                        });
                    }
                }
            }

            const request: WorldMapRuntimeTestRequest = {
                cases,
                canvasWidth: 640,
                canvasHeight: 360,
                samples: 1,
                warmups: 0,
                capturePixelHash: true,
                timeoutMs: focused ? 300000 : 360000,
                optimizations: parseOptimizations(process.env.HOI4_WORLD_MAP_RUNTIME_OPTIMIZATIONS),
            };
            const report = await vscode.commands.executeCommand<WorldMapRuntimeTestReport>(
                runtimeTestCommand,
                request,
            );

            assert.ok(report, 'World-map runtime command returned no report.');
            assert.strictEqual(report.results.length, pairs.length * displaySets.length * viewports.length);
            assert.ok(report.environment.provinces > 0);
            assert.ok(report.environment.rivers > 0);
            assert.deepStrictEqual(report.runtimeErrors, []);
            assert.strictEqual(new Set(report.results.map(result => result.id)).size, report.results.length);

            for (const result of report.results) {
                assert.strictEqual(result.error, undefined, `${result.id}: ${result.error}`);
                assert.ok(Number.isFinite(result.durationMsMedian) && result.durationMsMedian >= 0, result.id);
                assert.ok(result.durationMsSamples.every(value => Number.isFinite(value) && value >= 0), result.id);
                assert.match(result.pixelHash ?? '', /^[0-9a-f]{8}$/, result.id);
                assert.match(result.riverCoordinateHash, /^[0-9a-f]{8}$/, result.id);
                assert.strictEqual(result.riverFullyOutsideViewport, 0, result.id);
            }

            const pairCounts = new Map<string, number>();
            for (const result of report.results) {
                const key = `${result.viewMode}/${result.colorSet}`;
                pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
            }
            assert.strictEqual(pairCounts.size, 52);
            assert.ok(Array.from(pairCounts.values()).every(
                count => count === displaySets.length * viewports.length,
            ));
            assert.ok(new Set(report.results.map(result => result.pixelHash)).size > 10);
            assert.ok(report.results.some(result => result.riverFillRects > 0));

            const durations = report.results.map(result => result.durationMsMedian);
            let baselineComparison: {
                cases: number;
                pixelHashMismatches: number;
                beforeMedianDurationMs: number;
                afterMedianDurationMs: number;
                medianMatchedDeltaMs: number;
                byDisplay: Record<string, ComparisonSummary>;
                byViewMode: Record<string, ComparisonSummary>;
            } | undefined;
            const baselinePath = process.env.HOI4_WORLD_MAP_RUNTIME_BASELINE;
            if (baselinePath) {
                const baselineFile = JSON.parse(fs.readFileSync(baselinePath, 'utf8')) as {
                    report: WorldMapRuntimeTestReport;
                };
                const baselineById = new Map(
                    baselineFile.report.results.map(result => [result.id, result]),
                );
                const matched = report.results.map(result => ({
                    before: baselineById.get(result.id),
                    after: result,
                }));
                assert.ok(matched.every(value => value.before !== undefined));
                const pixelHashMismatches = matched.filter(
                    value => value.before?.pixelHash !== value.after.pixelHash,
                ).length;
                baselineComparison = {
                    cases: matched.length,
                    pixelHashMismatches,
                    beforeMedianDurationMs: median(matched.map(value => value.before!.durationMsMedian)),
                    afterMedianDurationMs: median(matched.map(value => value.after.durationMsMedian)),
                    medianMatchedDeltaMs: median(matched.map(
                        value => value.after.durationMsMedian - value.before!.durationMsMedian,
                    )),
                    byDisplay: comparisonSummaryBy(
                        matched,
                        value => value.after.display.join('+') || 'none',
                    ),
                    byViewMode: comparisonSummaryBy(
                        matched,
                        value => value.after.viewMode,
                    ),
                };
                if (process.env.HOI4_WORLD_MAP_RUNTIME_ALLOW_PIXEL_CHANGES !== '1') {
                    assert.strictEqual(
                        pixelHashMismatches,
                        0,
                        `${pixelHashMismatches} real Canvas2D cases differ from the supplied baseline.`,
                    );
                }
            }
            const summary = {
                environment: report.environment,
                cases: report.results.length,
                medianDurationMs: median(durations),
                maxDurationMs: Math.max(...durations),
                riverFillRects: report.results.reduce((sum, result) => sum + result.riverFillRects, 0),
                riverDuplicateRects: report.results.reduce((sum, result) => sum + result.riverDuplicateRects, 0),
                uniquePixelHashes: new Set(report.results.map(result => result.pixelHash)).size,
                baselineComparison,
                byScale: durationSummaryBy(
                    report.results,
                    result => result.viewport.scale.toString(),
                ),
                byDisplay: durationSummaryBy(
                    report.results,
                    result => result.display.join('+') || 'none',
                ),
                byViewMode: durationSummaryBy(
                    report.results,
                    result => result.viewMode,
                ),
            };
            const profilePath = process.env.HOI4_WORLD_MAP_RUNTIME_OUTPUT
                ? path.resolve(process.env.HOI4_WORLD_MAP_RUNTIME_OUTPUT)
                : path.resolve(__dirname, '../../../profiles/worldmap-webview-runtime.json');
            fs.mkdirSync(path.dirname(profilePath), { recursive: true });
            fs.writeFileSync(profilePath, JSON.stringify({
                schemaVersion: 1,
                generatedAt: new Date().toISOString(),
                summary,
                report,
            }, null, 2));
            console.log('World-map real webview runtime report', JSON.stringify({
                outputPath: profilePath,
                ...summary,
            }));
        } finally {
            await configuration.update('installPath', previous.installPath, vscode.ConfigurationTarget.Global);
            await configuration.update('enableSupplyArea', previous.enableSupplyArea, vscode.ConfigurationTarget.Global);
            await configuration.update('loadDlcContents', previous.loadDlcContents, vscode.ConfigurationTarget.Global);
        }
    });
});

function parseValidPairs(): { viewMode: string; colorSet: string }[] {
    const htmlPath = path.resolve(__dirname, '../../../src/previewdef/worldmap/worldmapview.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    const viewModes = [...html.matchAll(
        /<option value="([^"]+)"(?: enablesupplyarea="true")?>%worldmap\.topbar\.viewmode/g,
    )].map(match => match[1]);
    const colorOptions = [...html.matchAll(
        /<option(?: viewmode="([^"]+)")? value="([^"]+)"(?: enablesupplyarea="true")?>%worldmap\.topbar\.colorset/g,
    )].map(match => ({
        modes: match[1]?.split(/\s+/),
        colorSet: match[2],
    }));

    return viewModes.flatMap(viewMode => colorOptions
        .filter(option => option.modes
            ? option.modes.includes(viewMode)
            : option.colorSet === 'warnings' && viewMode === 'warnings')
        .map(option => ({ viewMode, colorSet: option.colorSet })));
}

function median(values: number[]): number {
    const ordered = [...values].sort((a, b) => a - b);
    return ordered[Math.floor(ordered.length / 2)];
}

interface ComparisonSummary {
    cases: number;
    pixelHashMismatches: number;
    beforeMedianDurationMs: number;
    afterMedianDurationMs: number;
    medianMatchedDeltaMs: number;
}

function comparisonSummaryBy(
    matched: {
        before: WorldMapRuntimeTestReport['results'][number] | undefined;
        after: WorldMapRuntimeTestReport['results'][number];
    }[],
    getKey: (value: typeof matched[number]) => string,
): Record<string, ComparisonSummary> {
    const groups = groupBy(matched, getKey);
    return Object.fromEntries(Array.from(groups, ([key, values]) => [key, {
        cases: values.length,
        pixelHashMismatches: values.filter(
            value => value.before?.pixelHash !== value.after.pixelHash,
        ).length,
        beforeMedianDurationMs: median(values.map(value => value.before!.durationMsMedian)),
        afterMedianDurationMs: median(values.map(value => value.after.durationMsMedian)),
        medianMatchedDeltaMs: median(values.map(
            value => value.after.durationMsMedian - value.before!.durationMsMedian,
        )),
    }]));
}

function durationSummaryBy(
    results: WorldMapRuntimeTestReport['results'],
    getKey: (result: WorldMapRuntimeTestReport['results'][number]) => string,
) {
    const groups = groupBy(results, getKey);
    return Object.fromEntries(Array.from(groups, ([key, values]) => [key, {
        cases: values.length,
        medianDurationMs: median(values.map(value => value.durationMsMedian)),
        maxDurationMs: Math.max(...values.map(value => value.durationMsMedian)),
        riverFillRects: values.reduce((sum, value) => sum + value.riverFillRects, 0),
        riverDuplicateRects: values.reduce((sum, value) => sum + value.riverDuplicateRects, 0),
    }]));
}

function groupBy<T>(values: T[], getKey: (value: T) => string): Map<string, T[]> {
    const groups = new Map<string, T[]>();
    for (const value of values) {
        const key = getKey(value);
        const group = groups.get(key);
        if (group) {
            group.push(value);
        } else {
            groups.set(key, [value]);
        }
    }
    return groups;
}

function parseOptimizations(value: string | undefined): WorldMapRuntimeTestOptimization[] {
    if (!value) {
        return [];
    }
    return value.split(',').map(item => item.trim()).filter(
        (item): item is WorldMapRuntimeTestOptimization => item.length > 0,
    );
}
