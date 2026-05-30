This file is a merged representation of a subset of the codebase, containing files not matching ignore patterns, combined into a single document by Repomix.
The content has been processed where empty lines have been removed.

# File Summary

## Purpose
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching these patterns are excluded: *, static/, node_modules/, out/, dist/, .vscode-test/, .vscode/, .github/, .git/, *.vsix, *.log, .eslintrc.json, .gitignore, .vscodeignore, CHANGELOG.md, LICENSE, README.md, package.json, package-lock.json, package.nls.json, tsconfig.json, webpack.config.js, repomix.config.json, test-ui/, test/, demo/, i18n/, resource/, icon.png, icon.xcf
- Empty lines have been removed from all files
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
scripts/common.js
scripts/dds.js
scripts/demap.js
scripts/findallvals.js
scripts/geni18n.js
scripts/genzhi18n.js
src/constants.ts
src/context.ts
src/ddsviewprovider.ts
src/def.d.ts
src/extension.ts
src/hoiformat/condition.ts
src/hoiformat/effect.ts
src/hoiformat/gui.ts
src/hoiformat/hoiparser.ts
src/hoiformat/schema.ts
src/hoiformat/scope.ts
src/hoiformat/spritetype.ts
src/hoiformat/tostring.ts
src/previewdef/event/contentbuilder.ts
src/previewdef/event/index.ts
src/previewdef/event/loader.ts
src/previewdef/event/schema.ts
src/previewdef/focustree/contentbuilder.ts
src/previewdef/focustree/index.ts
src/previewdef/focustree/loader.ts
src/previewdef/focustree/schema.ts
src/previewdef/gfx/contentbuilder.ts
src/previewdef/gfx/index.ts
src/previewdef/gui/contentbuilder.ts
src/previewdef/gui/index.ts
src/previewdef/gui/loader.ts
src/previewdef/mio/contentbuilder.ts
src/previewdef/mio/index.ts
src/previewdef/mio/loader.ts
src/previewdef/mio/schema.ts
src/previewdef/previewbase.ts
src/previewdef/previewmanager.ts
src/previewdef/technology/contentbuilder.ts
src/previewdef/technology/index.ts
src/previewdef/technology/loader.ts
src/previewdef/technology/schema.ts
src/previewdef/worldmap/definitions.ts
src/previewdef/worldmap/index.ts
src/previewdef/worldmap/loader/adjacencies.ts
src/previewdef/worldmap/loader/common.ts
src/previewdef/worldmap/loader/continents.ts
src/previewdef/worldmap/loader/countries.ts
src/previewdef/worldmap/loader/provincebmp.ts
src/previewdef/worldmap/loader/provincedefinitions.ts
src/previewdef/worldmap/loader/provincemap.ts
src/previewdef/worldmap/loader/railway.ts
src/previewdef/worldmap/loader/resource.ts
src/previewdef/worldmap/loader/river.ts
src/previewdef/worldmap/loader/states.ts
src/previewdef/worldmap/loader/strategicregion.ts
src/previewdef/worldmap/loader/supplyarea.ts
src/previewdef/worldmap/loader/terrain.ts
src/previewdef/worldmap/loader/worldmaploader.ts
src/previewdef/worldmap/worldmap.ts
src/previewdef/worldmap/worldmapcontainer.ts
src/previewdef/worldmap/worldmapview.css
src/previewdef/worldmap/worldmapview.html
src/util/cache.ts
src/util/common.ts
src/util/debug.ts
src/util/dependency.ts
src/util/featureflags.ts
src/util/fileloader.ts
src/util/gfxindex.ts
src/util/hoi4gui/button.ts
src/util/hoi4gui/common.ts
src/util/hoi4gui/containerwindow.ts
src/util/hoi4gui/gridbox.ts
src/util/hoi4gui/gridboxcommon.ts
src/util/hoi4gui/icon.ts
src/util/hoi4gui/instanttextbox.ts
src/util/hoi4gui/nodecommon.ts
src/util/hoifs.ts
src/util/html.ts
src/util/i18n.ts
src/util/image/bmp/bmpparser.ts
src/util/image/converter.ts
src/util/image/dds/dds.ts
src/util/image/dds/index.ts
src/util/image/dds/pixelformat.ts
src/util/image/dds/surface.ts
src/util/image/dds/typedef.ts
src/util/image/imagecache.ts
src/util/image/sprite.ts
src/util/loader/loader.ts
src/util/loader/yaml.ts
src/util/localisationIndex.ts
src/util/logger.ts
src/util/modfile.ts
src/util/nodecommon.ts
src/util/sharedFocusIndex.ts
src/util/styletable.ts
src/util/telemetry.ts
src/util/vsccommon.ts
src/util/yaml.ts
webviewsrc/dev.d.ts
webviewsrc/eventtree.ts
webviewsrc/focustree.ts
webviewsrc/gfx.ts
webviewsrc/guipreview.ts
webviewsrc/miopreview.ts
webviewsrc/techtree.ts
webviewsrc/util/checkbox.ts
webviewsrc/util/common.ts
webviewsrc/util/dropdown.ts
webviewsrc/util/event.ts
webviewsrc/util/i18n.ts
webviewsrc/util/telemetry.ts
webviewsrc/util/vscode.ts
webviewsrc/worldmap/definitions.ts
webviewsrc/worldmap/graphutils.ts
webviewsrc/worldmap/index.ts
webviewsrc/worldmap/loader.ts
webviewsrc/worldmap/renderer.ts
webviewsrc/worldmap/topbar.ts
webviewsrc/worldmap/viewpoint.ts
```

# Files

## File: scripts/common.js
```javascript
const path = require('path');
const fs = require("fs");
async function recursiveFindAll(input, result = []) {
    const files = await fs.promises.readdir(input);
    await Promise.all(files.map(async (file) => {
        const fullPath = path.join(input, file);
        const stat = await fs.promises.lstat(fullPath);
        if (stat.isDirectory()) {
            await recursiveFindAll(fullPath, result);
        } else {
            result.push(fullPath);
        }
    }));
    return result;
};
module.exports = {
    recursiveFindAll
};
```

## File: scripts/dds.js
```javascript
// npm run test-compile
// node --prof dds.js
const dds = require("../out/src/util/image/dds/dds");
const fs = require("fs");
const repeatCount = process.argv.length > 2 ? parseInt(process.argv[2]) : 100;
const startTime = process.hrtime();
for (let i = 0; i < repeatCount; i++) {
    const file = fs.readFileSync("E:/Games/steamlib/steamapps/common/Hearts of Iron IV/gfx/loadingscreens/load_1.dds");
    const ddsFile = dds.DDS.parse(file.buffer);
    const fullRGBA = ddsFile.images[0].getFullRgba();
    console.log(fullRGBA.length, fullRGBA[fullRGBA.length - 1]);
}
const endTime = process.hrtime(startTime);
console.log("Repeat count: %d, Average time: %dms", repeatCount, (endTime[0] * 1000 + endTime[1] / 1000000) / repeatCount);
```

## File: scripts/demap.js
```javascript
var myArgs = process.argv.slice(2)[0].split(':');
var fs = require('fs');
var sourceMap = require('source-map');
var smc = new sourceMap.SourceMapConsumer(fs.readFileSync("./prod/" + myArgs[0] + ".map","utf8"));
var position = myArgs[1].split(':');
console.log(smc.originalPositionFor({line: parseInt(myArgs[1]), column: parseInt(myArgs[2])}));
```

## File: scripts/findallvals.js
```javascript
const hoiparser = require("../out/src/hoiformat/hoiparser");
const common = require("../out/src/util/common");
const { recursiveFindAll } = require("./common");
const schemas = {};
function fillInSchema(node) {
    if (node.value === null) {
        return;
    }
    let nodeName = node.name;
    if (!nodeName) {
        nodeName = '_root';
    }
    nodeName = nodeName.toLowerCase();
    let schemaEntry = schemas[nodeName];
    if (!schemaEntry) {
        schemaEntry = schemas[nodeName] = [{}];
    }
    if (Array.isArray(node.value)) {
        node.value.forEach(n => {
            schemaEntry[0][n.name.toLowerCase()] = "obj";
            fillInSchema(n);
        });
        return;
    }
    let value = node.value;
    if (typeof node.value === 'object') {
        value = 's_' + node.value.name;
    }
    if (!schemaEntry.includes(value)) {
        schemaEntry.push(value);
    }
}
const result = (async function() {
    const files = (await recursiveFindAll('E:/Games/steamlib/steamapps/common/Hearts of Iron IV/'))
        .filter(file => file.match(/\.(txt|gfx|gui)$/))
        .filter(f => !f.includes('common\\countries') && !f.match(/Hearts of Iron IV\\[^\\]*\.txt$/));
    const results = await Promise.all(files.map(async (file) => {
        const content = await common.readFile(file);
        try {
            return hoiparser.parseHoi4File(content.toString(), 'In file ' + file + ':\n');
        } catch (e) {
            return { error: e };
        }
    }));
    const validResults = results.filter(r => !r.error);
    validResults.forEach(fillInSchema);
    for (const [name, schema] of Object.entries(schemas)) {
        if (Object.keys(schema[0]).length === 0) {
            if (schema.length > 1000) {
                delete schemas[name];
                for (const [_, schema] of Object.entries(schemas)) {
                    if (name in schema[0]) {
                        schema[0][name] = "var";
                    }
                }
            } else {
                for (const [_, schema] of Object.entries(schemas)) {
                    if (name in schema[0]) {
                        schema[0][name] = "enum";
                    }
                }
            }
        }
    }
    console.log(JSON.stringify(schemas, undefined, 2));
    // console.log(results.map(r => r.error).filter(r => r).map(r => r.message).join('\n'));
})();
console.log(result);
```

## File: src/context.ts
```typescript
import * as vscode from 'vscode';
interface ContextContainer {
    current: vscode.ExtensionContext | null;
    contextValue: Record<string, unknown>;
}
export function registerContextContainer(context: vscode.ExtensionContext): vscode.Disposable {
    contextContainer.current = context;
    return new vscode.Disposable(() => contextContainer.current = null);
}
export const contextContainer: ContextContainer = {
    current: null,
    contextValue: {},
};
export function setVscodeContext(key: string, value: unknown): void {
    contextContainer.contextValue[key] = value;
    vscode.commands.executeCommand('setContext', key, value);
}
```

## File: src/hoiformat/effect.ts
```typescript
import { ConditionComplexExpr, ConditionFolder, extractConditionFolder, simplifyCondition } from "./condition";
import { Node, NodeValue } from "./hoiparser";
import { Scope, tryMoveScope } from "./scope";
import { nodeToString } from "./tostring";
export type EffectComplexExpr = EffectItem | EffectByCondition | RandomListEffect | null;
export interface EffectItem {
    scopeName: string;
    nodeContent: string;
    node: Node;
}
export interface RandomListEffect {
    items: RandomListEffectItem[];
}
interface RandomListEffectItem {
    possibility: number;
    effect: EffectComplexExpr;
}
export interface EffectByCondition {
    condition: ConditionComplexExpr;
    items: EffectComplexExpr[];
}
export interface EffectValue {
    effect: EffectComplexExpr;
}
export function extractEffectValue(nodeValue: NodeValue, scope: Scope, excludedKeys: string[] | undefined = undefined): EffectValue {
    const effect = simplifyEffect(extractEffectByCondition(nodeValue, [scope], true, [], excludedKeys));
    return {
        effect,
    };
}
function extractEffectByCondition(
    nodeValue: NodeValue,
    scopeStack: Scope[],
    condition: ConditionComplexExpr = true,
    result: EffectComplexExpr[] = [],
    excludedKeys: string[] | undefined = undefined,
): EffectComplexExpr {
    if (!Array.isArray(nodeValue)) {
        return { condition: true, items: result };
    }
    const currentScope = scopeStack[scopeStack.length - 1];
    const items: EffectItem[] = [];
    let ifItem: ConditionFolder | undefined = undefined;
    for (const child of nodeValue) {
        let keepIfItem = false;
        let childName = child.name?.toLowerCase().trim();
        if (excludedKeys && childName && excludedKeys.includes(childName)) {
            continue;
        }
        if (childName === 'hidden_effect') {
            extractEffectByCondition(child.value, scopeStack, condition, result);
        } else if (childName === 'random_list') {
            if (Array.isArray(child.value)) {
                const randomListItems = child.value.map(n => {
                    const possibility = parseInt(n.name ?? '0');
                    const effect = extractEffectByCondition(n.value, scopeStack, true, [], ['modifier']);
                    return {
                        possibility,
                        effect,
                    };
                });
                result.push({ items: randomListItems });
            }
        } else if (childName === 'if') {
            if (Array.isArray(child.value)) {
                const limit = child.value.find(v => v.name === 'limit');
                if (limit) {
                    ifItem = handleIf(child, limit, scopeStack, condition, result);
                    keepIfItem = true;
                    const elseifs = child.value.filter(v => v.name === 'else_if');
                    for (const elseif of elseifs) {
                        handleElseIf(elseif, ifItem, scopeStack, result);
                        keepIfItem = false;
                    }
                    const els = child.value.find(v => v.name === 'else');
                    if (els) {
                        handleElse(els, ifItem, scopeStack, result);
                        keepIfItem = false;
                    }
                }
            }
        } else if (childName === 'else_if') {
            if (ifItem) {
                handleElseIf(child, ifItem, scopeStack, result);
                keepIfItem = true;
            }
        } else if (childName === 'else') {
            if (ifItem) {
                handleElse(child, ifItem, scopeStack, result);
                keepIfItem = false;
            }
        } else if (tryMoveScope(child, scopeStack, 'effect')) {
            extractEffectByCondition(child.value, scopeStack, condition, result);
            scopeStack.pop();
        } else {
            items.push({
                scopeName: currentScope.scopeName,
                nodeContent: nodeToString(child),
                node: child,
            });
        }
        if (!keepIfItem) {
            ifItem = undefined;
        }
    }
    if (items.length > 0) {
        const existing = result.filter((r): r is EffectByCondition => r !== null && 'condition' in r).find(r => r.condition === condition);
        if (existing) {
            existing.items.push(...items);
        } else {
            result.push({
                condition,
                items,
            });
        }
    }
    return { condition: true, items: result };
}
function handleIf(ifNode: Node, limit: Node, scopeStack: Scope[], baseCondition: ConditionComplexExpr, result: EffectComplexExpr[]): ConditionFolder {
    const condition: ConditionFolder = {
        type: 'and',
        items: [
            baseCondition,
            extractConditionFolder(limit.value, scopeStack, 'and'),
        ],
    };
    extractEffectByCondition(ifNode.value, scopeStack, simplifyCondition(condition), result, ['limit', 'else_if', 'else']);
    return condition;
}
function handleElseIf(elseIfNode: Node, ifItem: ConditionFolder, scopeStack: Scope[], result: EffectComplexExpr[]) {
    if (!Array.isArray(elseIfNode.value)) {
        return;
    }
    const elseiflimit = elseIfNode.value.find(v => v.name === 'limit');
    if (elseiflimit) {
        const lastItemItems = ifItem.items;
        const newItems: ConditionComplexExpr[] = [
            ...lastItemItems.slice(0, lastItemItems.length - 1),
            {
                ...(lastItemItems[lastItemItems.length - 1] as ConditionFolder),
                type: 'andnot',
            },
            extractConditionFolder(elseiflimit.value, scopeStack, 'and'),
        ];
        ifItem.items = newItems;
        extractEffectByCondition(elseIfNode.value, scopeStack, simplifyCondition(ifItem), result, ['limit', 'else_if', 'else']);
    }
}
function handleElse(elseNode: Node, ifItem: ConditionFolder, scopeStack: Scope[], result: EffectComplexExpr[]) {
    if (Array.isArray(elseNode.value)) {
        const lastItemItems = ifItem.items;
        const newItems: ConditionComplexExpr[] = [
            ...lastItemItems.slice(0, ifItem.items.length - 1),
            {
                ...(lastItemItems[ifItem.items.length - 1] as ConditionFolder),
                type: 'andnot',
            },
        ];
        ifItem.items = newItems;
        extractEffectByCondition(elseNode.value, scopeStack, simplifyCondition(ifItem), result, ['limit', 'else_if', 'else']);
    }
}
function simplifyEffect(effect: EffectComplexExpr): EffectComplexExpr {
    if (effect === null) {
        return null;
    }
    if ('condition' in effect) {
        const items = effect.items.map(i => simplifyEffect(i)).filter(i => i !== null);
        if (items.length === 0) {
            return null;
        }
        if (effect.condition === true) {
            if (items.length === 1) {
                return simplifyEffect(items[0]);
            }
        }
        return {
            ...effect,
            items,
        };
    } else if (!('nodeContent' in effect)) {
        let items = effect.items.filter(i => i.possibility > 0);
        if (items.length === 0) {
            return null;
        }
        if (items.length === 1) {
            return simplifyEffect(items[0].effect);
        }
        items = items.map(i => ({ ...i, effect: simplifyEffect(i.effect) }));
        return {
            ...effect,
            items,
        };
    } else {
        return effect;
    }
}
```

## File: src/hoiformat/tostring.ts
```typescript
import { Node, NodeValue } from './hoiparser';
export function nodeToString(node: Node): string {
    return [node.name, node.operator, node.valueAttachment?.name, nodeValueToString(node.value)].filter(v => !!v).join(' ');
}
function nodeValueToString(nodeValue: NodeValue): string | null {
    if (Array.isArray(nodeValue)) {
        return [ '{', ...nodeValue.map(v => nodeToString(v)), '}' ].join(' ');
    }
    if (nodeValue === null) {
        return null;
    }
    if (typeof nodeValue === 'object') {
        return nodeValue.name;
    }
    if (typeof nodeValue === 'string') {
        return '"' + nodeValue + '"';
    }
    return nodeValue.toString();
}
```

## File: src/previewdef/gfx/index.ts
```typescript
import * as vscode from 'vscode';
import { renderGfxFile } from './contentbuilder';
import { PreviewProviderDef } from '../previewmanager';
import { PreviewBase } from '../previewbase';
function canPreviewGfx(document: vscode.TextDocument) {
    const uri = document.uri;
    return uri.path.toLowerCase().endsWith('.gfx') ? 0 : undefined;
}
class GfxPreview extends PreviewBase {
    protected getContent(document: vscode.TextDocument): Promise<string> {
        return renderGfxFile(document.getText(), document.uri, this.panel.webview);
    }
}
export const gfxPreviewDef: PreviewProviderDef = {
    type: 'gfx',
    canPreview: canPreviewGfx,
    previewContructor: GfxPreview,
};
```

## File: src/previewdef/technology/index.ts
```typescript
import * as vscode from 'vscode';
import { renderTechnologyFile } from './contentbuilder';
import { matchPathEnd } from '../../util/nodecommon';
import { PreviewProviderDef } from '../previewmanager';
import { PreviewBase } from '../previewbase';
import { TechnologyTreeLoader } from './loader';
import { getRelativePathInWorkspace } from '../../util/vsccommon';
function canPreviewTechnology(document: vscode.TextDocument) {
    const uri = document.uri;
    if (matchPathEnd(uri.toString().toLowerCase(), ['common', 'technologies', '*']) && uri.path.toLowerCase().endsWith('.txt')) {
        return 0;
    }
    const text = document.getText();
    return /(technologies)\s*=\s*{/.exec(text)?.index;
}
class TechnologyTreePreview extends PreviewBase {
    private technologyTreeLoader: TechnologyTreeLoader;
    private content: string | undefined;
    constructor(uri: vscode.Uri, panel: vscode.WebviewPanel) {
        super(uri, panel);
        this.technologyTreeLoader = new TechnologyTreeLoader(getRelativePathInWorkspace(this.uri), () => Promise.resolve(this.content ?? ''));
        this.technologyTreeLoader.onLoadDone(r => this.updateDependencies(r.dependencies));
    }
    protected async getContent(document: vscode.TextDocument): Promise<string> {
        this.content = document.getText();
        const result = await renderTechnologyFile(this.technologyTreeLoader, document.uri, this.panel.webview);
        this.content = undefined;
        return result;
    }
}
export const technologyPreviewDef: PreviewProviderDef = {
    type: 'technology',
    canPreview: canPreviewTechnology,
    previewContructor: TechnologyTreePreview,
};
```

## File: src/previewdef/worldmap/index.ts
```typescript
import * as vscode from 'vscode';
import { matchPathEnd } from '../../util/nodecommon';
import { PreviewProviderDef } from '../previewmanager';
import { WorldMapContainer } from "./worldmapcontainer";
export const worldMap = new WorldMapContainer();
function canPreviewWorldmap(document: vscode.TextDocument) {
    const uri = document.uri;
    return matchPathEnd(uri.toString().toLowerCase(), ['map', 'default.map']) ? 0 : undefined;
}
function onPreviewWorldmap(document: vscode.TextDocument): Promise<void> {
    return worldMap.openPreview();
}
export const worldMapPreviewDef: PreviewProviderDef = {
    type: 'worldmap',
    canPreview: canPreviewWorldmap,
    onPreview: onPreviewWorldmap,
};
```

## File: src/previewdef/worldmap/loader/strategicregion.ts
```typescript
import { Enum, SchemaDef } from "../../../hoiformat/schema";
import { StrategicRegion, WorldMapWarning, Province, WorldMapWarningSource, State, Terrain, Region } from "../definitions";
import { DefaultMapLoader } from "./provincemap";
import { FolderLoader, FileLoader, LoadResult, mergeInLoadResult, sortItems, mergeRegion, LoadResultOD } from "./common";
import { readFileFromModOrHOI4AsJson } from "../../../util/fileloader";
import { error } from "../../../util/debug";
import { localize } from "../../../util/i18n";
import { StatesLoader } from "./states";
import { arrayToMap, UserError } from "../../../util/common";
import { Token } from "../../../hoiformat/hoiparser";
import { LoaderSession } from "../../../util/loader/loader";
import { flatMap } from "lodash";
interface StrategicRegionFile {
    strategic_region: StrategicRegionDefinition[];
}
interface StrategicRegionDefinition {
    id: number;
    name: string;
    provinces: Enum;
    naval_terrain: string;
    _token: Token;
}
const strategicRegionFileSchema: SchemaDef<StrategicRegionFile> = {
    strategic_region: {
        _innerType: {
            id: "number",
            name: "string",
            provinces: "enum",
            naval_terrain: "string",
        },
        _type: "array",
    },
};
type StrategicRegionsLoaderResult = { strategicRegions: StrategicRegion[], badStrategicRegionsCount: number };
export class StrategicRegionsLoader extends FolderLoader<StrategicRegionsLoaderResult, StrategicRegionNoRegion[]> {
    constructor(private defaultMapLoader: DefaultMapLoader, private statesLoader: StatesLoader) {
        super('map/strategicregions', StrategicRegionLoader);
    }
    public async shouldReloadImpl(session: LoaderSession): Promise<boolean> {
        return await super.shouldReloadImpl(session) || await this.defaultMapLoader.shouldReload(session) || await this.statesLoader.shouldReload(session);
    }
    protected async loadImpl(session: LoaderSession): Promise<LoadResult<StrategicRegionsLoaderResult>> {
        await this.fireOnProgressEvent(localize('worldmap.progress.loadingstrategicregions', 'Loading strategic regions...'));
        return super.loadImpl(session);
    }
    protected async mergeFiles(fileResults: LoadResult<StrategicRegionNoRegion[]>[], session: LoaderSession): Promise<LoadResult<StrategicRegionsLoaderResult>> {
        const provinceMap = await this.defaultMapLoader.load(session);
        const stateMap = await this.statesLoader.load(session);
        await this.fireOnProgressEvent(localize('worldmap.progress.mapprovincestostrategicregions', 'Mapping provinces to strategic regions...'));
        const warnings = mergeInLoadResult(fileResults, 'warnings');
        const strategicRegions = flatMap(fileResults, c => c.result);
        const { width, provinces, terrains } = provinceMap.result;
        validateStrategicRegions(strategicRegions, terrains, warnings);
        const { sortedStrategicRegions, badStrategicRegionId } = sortStrategicRegions(strategicRegions, warnings);
        const { states, badStatesCount } = stateMap.result;
        const badStrategicRegionsCount = badStrategicRegionId + 1;
        const filledStrategicRegions: StrategicRegion[] = new Array(sortedStrategicRegions.length);
        for (let i = badStrategicRegionsCount; i < sortedStrategicRegions.length; i++) {
            if (sortedStrategicRegions[i]) {
                filledStrategicRegions[i] = calculateBoundingBox(sortedStrategicRegions[i], provinces, width, warnings);
            }
        }
        validateProvincesInStrategicRegions(provinces, states, filledStrategicRegions, badStatesCount, badStrategicRegionsCount, warnings);
        return {
            result: {
                strategicRegions: filledStrategicRegions,
                badStrategicRegionsCount,
            },
            dependencies: [this.folder + '/*'],
            warnings,
        };
    }
    public toString() {
        return `[StrategicRegionsLoader]`;
    }
}
class StrategicRegionLoader extends FileLoader<StrategicRegionNoRegion[]> {
    protected async loadFromFile(): Promise<LoadResultOD<StrategicRegionNoRegion[]>> {
        const warnings: WorldMapWarning[] = [];
        return {
            result: await loadStrategicRegion(this.file, warnings),
            warnings,
        };
    }
    public toString() {
        return `[StrategicRegionLoader: ${this.file}]`;
    }
}
type StrategicRegionNoRegion = Omit<StrategicRegion, keyof Region>;
async function loadStrategicRegion(file: string, globalWarnings: WorldMapWarning[]): Promise<StrategicRegionNoRegion[]> {
    const result: StrategicRegionNoRegion[] = [];
    try {
        const data = await readFileFromModOrHOI4AsJson<StrategicRegionFile>(file, strategicRegionFileSchema);
        for (const strategicRegion of data.strategic_region) {
            const warnings: string[] = [];
            const id = strategicRegion.id ? strategicRegion.id : (warnings.push(localize('worldmap.warnings.strategicregionnoid', "A strategic region in \"{0}\" doesn't have id field.", file)), -1);
            const name = strategicRegion.name ? strategicRegion.name : (warnings.push(localize('worldmap.warnings.strategicregionnoname', "Strategic region {0} doesn't have name field.", id)), '');
            const provinces = strategicRegion.provinces._values.map(v => parseInt(v));
            const navalTerrain = strategicRegion.naval_terrain ?? null;
            if (provinces.length === 0) {
                warnings.push(localize('worldmap.warnings.strategicregionnoprovinces', "Strategic region {0} in \"{1}\" doesn't have provinces.", id, file));
            }
            globalWarnings.push(...warnings.map<WorldMapWarning>(warning => ({
                source: [{ type: 'strategicregion', id }],
                relatedFiles: [file],
                text: warning,
            })));
            result.push({
                id,
                name,
                provinces,
                navalTerrain,
                file,
                token: strategicRegion._token ?? null,
            });
        }
    } catch (e) {
        error(e);
    }
    return result;
}
function validateStrategicRegions(strategicRegions: StrategicRegionNoRegion[], terrains: Terrain[], warnings: WorldMapWarning[]): void {
    const terrainMap = arrayToMap(terrains, 'name');
    for (const strategicRegion of strategicRegions) {
        const terrain = strategicRegion.navalTerrain;
        if (terrain !== null) {
            const terrainObj = terrainMap[terrain];
            if (!terrainObj || !terrainObj.isNaval) {
                warnings.push({
                    source: [{
                        type: 'strategicregion',
                        id: strategicRegion.id,
                    }],
                    relatedFiles: [strategicRegion.file],
                    text: localize('worldmap.warnings.navalterrainnotdefined', 'Naval terrain "{0}" is not defined.', terrain),
                });
            }
        }
    }
}
function sortStrategicRegions(strategicRegions: StrategicRegionNoRegion[], warnings: WorldMapWarning[]): { sortedStrategicRegions: StrategicRegionNoRegion[], badStrategicRegionId: number } {
    const { sorted, badId } = sortItems(
        strategicRegions,
        10000,
        (maxId) => { throw new UserError(localize('worldmap.warnings.strategicregionidtoolarge', 'Max strategic region ID is too large: {0}.', maxId)); },
        (newStrategicRegion, existingStrategicRegion, badId) => warnings.push({
                source: [{ type: 'strategicregion', id: badId }],
                relatedFiles: [newStrategicRegion.file, existingStrategicRegion.file],
                text: localize('worldmap.warnings.strategicregionidconflict', "There're more than one strategic regions using ID {0}.", newStrategicRegion.id),
            }),
        (startId, endId) => warnings.push({
                source: [{ type: 'strategicregion', id: startId }],
                relatedFiles: [],
                text: localize('worldmap.warnings.strategicregionnotexist', "Strategic region with id {0} doesn't exist.", startId === endId ? startId : `${startId}-${endId}`),
            }),
    );
    return {
        sortedStrategicRegions: sorted,
        badStrategicRegionId: badId,
    };
}
function calculateBoundingBox(strategicRegionNoRegion: StrategicRegionNoRegion, provinces: (Province | undefined | null)[], width: number, warnings: WorldMapWarning[]): StrategicRegion {
    return mergeRegion(
        strategicRegionNoRegion,
        'provinces',
        provinces,
        width, 
        provinceId => warnings.push({
                source: [{ type: 'strategicregion', id: strategicRegionNoRegion.id }],
                relatedFiles: [strategicRegionNoRegion.file],
                text: localize('worldmap.warnings.provinceinstrategicregionnotexist', "Province {0} used in strategic region {1} doesn't exist.", provinceId, strategicRegionNoRegion.id),
            }),
        () => warnings.push({
                source: [{ type: 'strategicregion', id: strategicRegionNoRegion.id }],
                relatedFiles: [strategicRegionNoRegion.file],
                text: localize('worldmap.warnings.strategicregionnovalidprovinces', "Strategic region {0} doesn't have valid provinces.", strategicRegionNoRegion.id),
            }),
    );
}
function validateProvincesInStrategicRegions(
    provinces: (Province | undefined | null)[],
    states: (State | undefined | null)[],
    strategicRegions: (StrategicRegion | undefined | null)[],
    badStatesCount: number,
    badStrategicRegionsCount: number,
    warnings: WorldMapWarning[]
) {
    const provinceToStrategicRegion: Record<number, number> = {};
    for (let i = badStrategicRegionsCount; i < strategicRegions.length; i++) {
        const strategicRegion = strategicRegions[i];
        if (!strategicRegion) {
            continue;
        }
        strategicRegion.provinces.forEach(p => {
            const province = provinces[p];
            if (provinceToStrategicRegion[p] !== undefined) {
                if (!province) {
                    return;
                }
                warnings.push({
                    source: [
                        ...[strategicRegion.id, provinceToStrategicRegion[p]].map<WorldMapWarningSource>(id => ({ type: 'strategicregion', id })),
                        { type: 'province', id: p, color: province.color }
                    ],
                    relatedFiles: [strategicRegion.file, strategicRegions[provinceToStrategicRegion[p]]!.file],
                    text: localize('worldmap.warnings.provinceinmultiplestrategicregions', 'Province {0} exists in multiple strategic regions: {1}, {2}.', p, provinceToStrategicRegion[p], strategicRegion.id),
                });
            } else {
                provinceToStrategicRegion[p] = strategicRegion.id;
            }
        });
    }
    for (let i = 1; i < provinces.length; i++) {
        const province = provinces[i];
        if (!province) {
            continue;
        }
        if (!(i in provinceToStrategicRegion)) {
            warnings.push({
                source: [{ type: 'province', id: i, color: province.color }],
                relatedFiles: [],
                text: localize('worldmap.warnings.provincenostrategicregion', 'Province {0} is not in any strategic region.', i),
            });
        }
    }
    for (let i = badStatesCount; i < states.length; i++) {
        const state = states[i];
        if (!state) {
            continue;
        }
        const strategicRegionId = state.provinces
            .filter(p => provinces[p])
            .map<[number, number]>(p => [p, provinceToStrategicRegion[p]])
            .filter(p => p[1] !== undefined);
        const strategicRegionIdCount: Record<number, number> = {};
        strategicRegionId.forEach(([_, sr]) => strategicRegionIdCount[sr] = (strategicRegionIdCount[sr] ?? 0) + 1);
        const entries = Object.entries(strategicRegionIdCount);
        if (entries.length > 1) {
            entries.sort((a, b) => b[1] - a[1]);
            const mostStrategicRegionId = parseInt(entries[0][0]);
            const badProvinces = strategicRegionId.filter(([_, sr]) => sr !== mostStrategicRegionId).map(v => v[0]);
            warnings.push({
                source: [
                    ...badProvinces.map<WorldMapWarningSource>(id => ({ type: 'province', id, color: provinces[id]?.color ?? -1 })),
                    { type: 'state', id: i },
                ],
                relatedFiles: [state.file],
                text: localize('worldmap.warnings.stateinmultiplestrategicregions', 'In state {0}, province {1} are not belong to same strategic region as other provinces.', i, badProvinces.join(', ')),
            });
        }
    }
}
```

## File: src/previewdef/worldmap/loader/supplyarea.ts
```typescript
import { Enum, SchemaDef } from "../../../hoiformat/schema";
import { Token } from "../../../hoiformat/hoiparser";
import { FileLoader, FolderLoader, LoadResult, mergeInLoadResult, sortItems, mergeRegion, LoadResultOD } from "./common";
import { WorldMapWarning, SupplyArea, Region, ProgressReporter, State, WorldMapWarningSource, Province } from "../definitions";
import { readFileFromModOrHOI4AsJson } from "../../../util/fileloader";
import { localize } from "../../../util/i18n";
import { error } from "../../../util/debug";
import { DefaultMapLoader } from "./provincemap";
import { StatesLoader } from "./states";
import { LoaderSession } from "../../../util/loader/loader";
import { flatMap } from "lodash";
import { UserError } from '../../../util/common';
interface SupplyAreaFile {
    supply_area: SupplyAreaDefinition[];
}
interface SupplyAreaDefinition {
    id: number;
    name: string;
    value: number;
    states: Enum;
    _token: Token;
}
const supplyAreaFileSchema: SchemaDef<SupplyAreaFile> = {
    supply_area: {
        _innerType: {
            id: "number",
            name: "string",
            value: "number",
            states: "enum",
        },
        _type: "array",
    },
};
type SupplyAreasLoaderResult = { supplyAreas: SupplyArea[], badSupplyAreasCount: number };
export class SupplyAreasLoader extends FolderLoader<SupplyAreasLoaderResult, SupplyAreaNoRegion[]> {
    constructor(private defaultMapLoader: DefaultMapLoader, private statesLoader: StatesLoader) {
        super('map/supplyareas', SupplyAreaLoader);
    }
    public async shouldReloadImpl(session: LoaderSession): Promise<boolean> {
        return await super.shouldReloadImpl(session) || await this.defaultMapLoader.shouldReload(session) || await this.statesLoader.shouldReload(session);
    }
    protected async loadImpl(session: LoaderSession): Promise<LoadResult<SupplyAreasLoaderResult>> {
        await this.fireOnProgressEvent(localize('worldmap.progress.loadingsupplyareas', 'Loading supply areas...'));
        return super.loadImpl(session);
    }
    protected async mergeFiles(fileResults: LoadResult<SupplyAreaNoRegion[]>[], session: LoaderSession): Promise<LoadResult<SupplyAreasLoaderResult>> {
        const provinceMap = await this.defaultMapLoader.load(session);
        const stateMap = await this.statesLoader.load(session);
        await this.fireOnProgressEvent(localize('worldmap.progress.mapstatetosupplyarea', 'Mapping states to supply areas...'));
        const warnings = mergeInLoadResult(fileResults, 'warnings');
        const SupplyAreas = flatMap(fileResults, c => c.result);
        const { width, provinces } = provinceMap.result;
        const { sortedSupplyAreas, badSupplyAreaId } = sortSupplyAreas(SupplyAreas, warnings);
        const { states } = stateMap.result;
        const badSupplyAreasCount = badSupplyAreaId + 1;
        const filledSupplyAreas: SupplyArea[] = new Array(sortedSupplyAreas.length);
        for (let i = badSupplyAreasCount; i < sortedSupplyAreas.length; i++) {
            if (sortedSupplyAreas[i]) {
                filledSupplyAreas[i] = calculateBoundingBox(sortedSupplyAreas[i], states, width, warnings);
            }
        }
        validateStatesInSupplyAreas(states, filledSupplyAreas, provinces, badSupplyAreasCount, warnings);
        return {
            result: {
                supplyAreas: filledSupplyAreas,
                badSupplyAreasCount,
            },
            dependencies: [this.folder + '/*'],
            warnings,
        };
    }
    public toString() {
        return `[SupplyAreasLoader]`;
    }
}
class SupplyAreaLoader extends FileLoader<SupplyAreaNoRegion[]> {
    protected async loadFromFile(): Promise<LoadResultOD<SupplyAreaNoRegion[]>> {
        const warnings: WorldMapWarning[] = [];
        return {
            result: await loadSupplyArea(this.file, warnings),
            warnings,
        };
    }
    public toString() {
        return `[SupplyAreaLoader: ${this.file}]`;
    }
}
type SupplyAreaNoRegion = Omit<SupplyArea, keyof Region>;
async function loadSupplyArea(file: string, globalWarnings: WorldMapWarning[]): Promise<SupplyAreaNoRegion[]> {
    const result: SupplyAreaNoRegion[] = [];
    try {
        const data = await readFileFromModOrHOI4AsJson<SupplyAreaFile>(file, supplyAreaFileSchema);
        for (const supplyArea of data.supply_area) {
            const warnings: string[] = [];
            const id = supplyArea.id ? supplyArea.id : (warnings.push(localize('worldmap.warnings.supplyareanoid', "A supply area in \"{0}\" doesn't have id field.", file)), -1);
            const name = supplyArea.name ? supplyArea.name : (warnings.push(localize('worldmap.warnings.supplyareanoname', "Supply area {0} doesn't have name field.", id)), '');
            const value = supplyArea.value ?? 0;
            const states = supplyArea.states._values.map(v => parseInt(v));
            if (states.length === 0) {
                warnings.push(localize('worldmap.warnings.supplyareanostates', "Supply area {0} in \"{1}\" doesn't have states.", id, file));
            }
            globalWarnings.push(...warnings.map<WorldMapWarning>(warning => ({
                source: [{ type: 'supplyarea', id }],
                relatedFiles: [file],
                text: warning,
            })));
            result.push({
                id,
                name,
                states,
                value,
                file,
                token: supplyArea._token ?? null,
            });
        }
    } catch (e) {
        error(e);
    }
    return result;
}
function sortSupplyAreas(supplyAreas: SupplyAreaNoRegion[], warnings: WorldMapWarning[]): { sortedSupplyAreas: SupplyAreaNoRegion[], badSupplyAreaId: number } {
    const { sorted, badId } = sortItems(
        supplyAreas,
        10000,
        (maxId) => { throw new UserError(localize('worldmap.warnings.supplyareaidtoolarge', 'Max supply area ID is too large: {0}.', maxId)); },
        (newSupplyArea, existingSupplyArea, badId) => warnings.push({
                source: [{ type: 'supplyarea', id: badId }],
                relatedFiles: [newSupplyArea.file, existingSupplyArea.file],
                text: localize('worldmap.warnings.supplyareaidconflict', "There're more than one supply areas using ID {0}.", newSupplyArea.id),
            }),
        (startId, endId) => warnings.push({
                source: [{ type: 'supplyarea', id: startId }],
                relatedFiles: [],
                text: localize('worldmap.warnings.supplyareanotexist', "Supply area with id {0} doesn't exist.", startId === endId ? startId : `${startId}-${endId}`),
            }),
    );
    return {
        sortedSupplyAreas: sorted,
        badSupplyAreaId: badId,
    };
}
function calculateBoundingBox(supplyAreaNoRegion: SupplyAreaNoRegion, states: (State | undefined | null)[], width: number, warnings: WorldMapWarning[]): SupplyArea {
    return mergeRegion(
        supplyAreaNoRegion,
        'states',
        states,
        width, 
        stateId => warnings.push({
                source: [{ type: 'supplyarea', id: supplyAreaNoRegion.id }],
                relatedFiles: [supplyAreaNoRegion.file],
                text: localize('worldmap.warnings.stateinsupplyareanotexist', "State {0} used in supply area {1} doesn't exist.", stateId, supplyAreaNoRegion.id),
            }),
        () => warnings.push({
                source: [{ type: 'supplyarea', id: supplyAreaNoRegion.id }],
                relatedFiles: [supplyAreaNoRegion.file],
                text: localize('worldmap.warnings.supplyareanovalidstates', "Supply area {0} doesn't have valid states.", supplyAreaNoRegion.id),
            }),
    );
}
function validateStatesInSupplyAreas(
    states: (State | undefined | null)[],
    supplyAreas: (SupplyArea | undefined | null)[],
    provinces: (Province | undefined | null)[],
    badSupplyAreasCount: number,
    warnings: WorldMapWarning[]
) {
    const stateToSupplyArea: Record<number, number> = {};
    for (let i = badSupplyAreasCount; i < supplyAreas.length; i++) {
        const supplyArea = supplyAreas[i];
        if (!supplyArea) {
            continue;
        }
        const statesInSupplyArea = supplyArea.states.map(s => {
            const state = states[s];
            if (stateToSupplyArea[s] !== undefined) {
                if (!state) {
                    return undefined;
                }
                warnings.push({
                    source: [
                        ...[supplyArea.id, stateToSupplyArea[s]].map<WorldMapWarningSource>(id => ({ type: 'supplyarea', id })),
                        { type: 'state', id: s }
                    ],
                    relatedFiles: [supplyArea.file, supplyAreas[stateToSupplyArea[s]]!.file, state.file],
                    text: localize('worldmap.warnings.stateinmultiplesupplyareas', 'State {0} exists in multiple supply areas: {1}, {2}.', s, stateToSupplyArea[s], supplyArea.id),
                });
            } else {
                stateToSupplyArea[s] = supplyArea.id;
            }
            return state;
        }).filter((s): s is State => !!s);
        const badStates = checkStatesContiguous(statesInSupplyArea, provinces);
        if (badStates) {
            warnings.push({
                source: [{ type: 'supplyarea', id: i }],
                relatedFiles: [supplyArea.file],
                text: localize('worldmap.warnings.statesnotcontiguous', 'States in supply area {0} are not contiguous: {1}, {2}.', i, badStates[0], badStates[1]),
            });
        }
    }
    for (let i = 1; i < states.length; i++) {
        const state = states[i];
        if (!state) {
            continue;
        }
        if (!(i in stateToSupplyArea)) {
            warnings.push({
                source: [{ type: 'state', id: i }],
                relatedFiles: [state.file],
                text: localize('worldmap.warnings.statenosupplyarea', 'State {0} is not in any supply area.', i),
            });
        }
    }
}
function checkStatesContiguous(states: State[], provinces: (Province | undefined | null)[]): [number, number] | undefined {
    if (states.length === 0) {
        return undefined;
    }
    const accessedStates: Record<number, boolean> = {};
    const stack: State[] = [states[0]];
    accessedStates[stack[0].id] = true;
    while (stack.length) {
        const currentState = stack.pop()!;
        for (const state of states) {
            if (accessedStates[state.id]) {
                continue;
            }
            if (statesAreAdjacent(state, currentState, provinces)) {
                stack.push(state);
                accessedStates[state.id] = true;
            }
        }
    }
    const inAccessedState = states.find(state => !accessedStates[state.id]);
    return inAccessedState === undefined ? undefined : [inAccessedState.id, parseInt(Object.keys(accessedStates)[0])];
}
function statesAreAdjacent(stateA: State, stateB: State, provinces: (Province | undefined | null)[]): boolean {
    return stateA.provinces.some(p =>
        provinces[p]?.edges
            .some(e => e.type !== 'impassable' && stateB.provinces.some(p2 => provinces[p2] && e.to === p2)) ?? false
        );
}
```

## File: src/previewdef/worldmap/worldmapview.css
```css
body {
    margin: 0;
    padding: 0;
}
#main-canvas {
    height: 100vh;
    width: 100vw;
    position: fixed;
    top: 0;
    left: 0;
}
.toolbar-outer {
    height: 40px;
    z-index: 10;
    box-sizing: border-box;
}
label {
    margin-right: 5px;
}
select, input {
    min-width: 100px;
}
#searchbox {
    margin-right: 0px;
}
span.divider {
    margin-right: 10px;
}
.group {
    display: inline-block;
    margin-right: 10px;
}
.gourp.hidden {
    display: none;
}
#warnings-container {
    height: 100vh;
    width: 40vw;
    position: fixed;
    top: 0;
    left: 0;
    padding-top: 40px;
    background: var(--vscode-editor-background);
    box-sizing: border-box;
    display: none;
}
#warnings {
    height: 100%;
    width: 100%;
    font-family: 'Consolas', monospace;
    resize: none;
    background: var(--vscode-editor-background);
    padding: 10px;
    border-top: none;
    border-left: none;
    border-bottom: none;
    box-sizing: border-box;
}
#warnings:focus {
    outline: none;
}
```

## File: src/util/cache.ts
```typescript
export interface CacheOptions<V> {
    factory(key: string): V;
    expireWhenChange?(key: string, cachedValue: V): any;
    life: number;
    nonExpireLife?: number;
}
export interface PromiseCacheOptions<V> extends CacheOptions<Promise<V>> {
    expireWhenChange?(key: string, cachedValue: Promise<V>): Promise<any> | any;
}
interface CacheEntry<V> {
    value: V;
    expiryToken: any;
    lastAccess: number;
}
export class Cache<V> {
    protected _cache: Record<string, CacheEntry<V>> = {};
    private _intervalToken: NodeJS.Timeout | null = null;
    constructor(protected readonly options: CacheOptions<V>) {
        if (options.life > 0) {
            this._intervalToken = setInterval(() => this.tryClean(), options.life / 5);
        }
        if (!options.expireWhenChange) {
            options.expireWhenChange = () => undefined;
        }
        if (options.nonExpireLife === undefined) {
            options.nonExpireLife = 200;
        }
    }
    public get(key: string = ''): V {
        const cacheEntry = this._cache[key];
        const now = Date.now();
        let expireToken: any = undefined;
        if (cacheEntry &&
            (now - cacheEntry.lastAccess < this.options.nonExpireLife! ||
                (expireToken = this.options.expireWhenChange!(key, cacheEntry.value)) === cacheEntry.expiryToken
            )) {
            cacheEntry.lastAccess = now;
            return cacheEntry.value;
        }
        const value = this.options.factory(key);
        const newEntry = {
            lastAccess: now,
            expiryToken: expireToken ?? this.options.expireWhenChange!(key, value),
            value
        };
        this._cache[key] = newEntry;
        return newEntry.value;
    }
    public remove(key: string = ''): void {
        delete this._cache[key];
    }
    public clear(): void {
        this._cache = {};
    }
    public dispose(): void {
        this._cache = {};
        if (this._intervalToken) {
            clearTimeout(this._intervalToken);
        }
    }
    private tryClean(): void {
        const now = Date.now();
        for (const entry of Object.entries(this._cache)) {
            if (entry[1].lastAccess + this.options.life < now) {
                delete this._cache[entry[0]];
            }
        }
    }
}
export class PromiseCache<V> extends Cache<Promise<V>> {
    constructor(options: PromiseCacheOptions<V>) {
        super({
            ...options,
            factory: (key) => {
                return options.factory(key).then(
                    value => {
                        if (value === null || value === undefined) {
                            this.remove(key);
                        }
                        return value;
                    },
                    error => {
                        this.remove(key);
                        return Promise.reject<V>(error);
                    });
            }
        });
    }
    public async get(key: string = ''): Promise<V> {
        const cacheEntry = this._cache[key];
        const now = Date.now();
        let expireToken: any = undefined;
        if (cacheEntry &&
            (now - cacheEntry.lastAccess < this.options.nonExpireLife! ||
                await (expireToken = Promise.resolve(this.options.expireWhenChange!(key, cacheEntry.value))) === await cacheEntry.expiryToken)
            ) {
            cacheEntry.lastAccess = now;
            return await cacheEntry.value;
        }
        const value = this.options.factory(key);
        const newEntry = {
            lastAccess: now,
            expiryToken: expireToken ?? Promise.resolve(this.options.expireWhenChange!(key, value)),
            value
        };
        this._cache[key] = newEntry;
        return await newEntry.value;
    }
}
```

## File: src/util/image/converter.ts
```typescript
import { DDS } from "./dds";
import { PNG } from "pngjs";
import { UserError } from '../common';
const TGA = require('tga') as typeof import('tga');
export function ddsToPng(dds: DDS): PNG {
    const img = dds.images[0];
    const png = new PNG({ width: img.width, height: img.height });
    const imgbuffer = img.getFullRgba();
    png.data = Buffer.from(imgbuffer);
    return png;
}
export function tgaToPng(buffer: Buffer): PNG {
    const tga = new TGA(buffer);
    const png = new PNG({ width: tga.width, height: tga.height });
    if (!tga.pixels) {
        throw new UserError('Unspported tga format');
    }
    png.data = Buffer.from(tga.pixels);
    return png;
}
```

## File: src/util/image/dds/index.ts
```typescript
export * from './dds';
export * from './typedef';
```

## File: src/util/image/dds/typedef.ts
```typescript
export const DDS_MAGIC = 0x20534444;
export const HEADER_LENGTH_INT = 32;
export const HEADER_DXT10_LENGTH_INT = 5;
export const DDPF_ALPHA = 0x1;
export const DDPF_ALPHA_CHANNEL = 0x2;
export const DDPF_RGB = 0x40;
export const DDPF_RGBA = DDPF_ALPHA | DDPF_RGB;
export const DDPF_FOURCC = 0x4;
export const DDPF_YUV = 0x200;
export const DDPF_LUMINANCE = 0x20000;
export const DDSCAPS_MIPMAP = 0x400000;
export const DDSCAPS2_CUBEMAP = 0x200;
export const DDSCAPS2_CUBEMAP_POSITIVEX = 0x400;
export const DDSCAPS2_CUBEMAP_NEGATIVEX = 0x800;
export const DDSCAPS2_CUBEMAP_POSITIVEY = 0x1000;
export const DDSCAPS2_CUBEMAP_NEGATIVEY = 0x2000;
export const DDSCAPS2_CUBEMAP_POSITIVEZ = 0x4000;
export const DDSCAPS2_CUBEMAP_NEGATIVEZ = 0x8000;
export const DDSCAPS2_VOLUME = 0x200000;
export const FOURCC_DXT1 = fourCCToInt32('DXT1');
export const FOURCC_DXT2 = fourCCToInt32('DXT2');
export const FOURCC_DXT3 = fourCCToInt32('DXT3');
export const FOURCC_DXT4 = fourCCToInt32('DXT4');
export const FOURCC_DXT5 = fourCCToInt32('DXT5');
export const FOURCC_DX10 = fourCCToInt32('DX10');
export const DDS_RESOURCE_MISC_TEXTURECUBE = 0x4;
export interface DDSHeader {
    dwFlags: number;
    dwHeight: number;
    dwWidth: number;
    dwPitchOrLinearSize: number;
    dwDepth: number;
    dwMipMapCount: number;
    ddspf: DDSPixelFormat;
    dwCaps: number;
    dwCaps2: number;
}
export interface DDSPixelFormat {
    dwFlags: number;
    dwFourCC: number;
    dwRGBBitCount: number;
    dwRBitMask: number;
    dwGBitMask: number;
    dwBBitMask: number;
    dwABitMask: number;
}
export interface DDSHeaderDXT10 {
    dxgiFormat: DxgiFormat;
    resourceDimension: ResourceDimension;
    miscFlag: number;
    arraySize: number;
    miscFlags2: number;
}
export enum ResourceDimension {
    DDS_DIMENSION_TEXTURE1D = 2,
    DDS_DIMENSION_TEXTURE2D = 3,
    DDS_DIMENSION_TEXTURE3D = 4,
}
export enum DxgiFormat {
    DXGI_FORMAT_UNKNOWN                     = 0,
    DXGI_FORMAT_R32G32B32A32_TYPELESS       = 1,
    DXGI_FORMAT_R32G32B32A32_FLOAT          = 2,
    DXGI_FORMAT_R32G32B32A32_UINT           = 3,
    DXGI_FORMAT_R32G32B32A32_SINT           = 4,
    DXGI_FORMAT_R32G32B32_TYPELESS          = 5,
    DXGI_FORMAT_R32G32B32_FLOAT             = 6,
    DXGI_FORMAT_R32G32B32_UINT              = 7,
    DXGI_FORMAT_R32G32B32_SINT              = 8,
    DXGI_FORMAT_R16G16B16A16_TYPELESS       = 9,
    DXGI_FORMAT_R16G16B16A16_FLOAT          = 10,
    DXGI_FORMAT_R16G16B16A16_UNORM          = 11,
    DXGI_FORMAT_R16G16B16A16_UINT           = 12,
    DXGI_FORMAT_R16G16B16A16_SNORM          = 13,
    DXGI_FORMAT_R16G16B16A16_SINT           = 14,
    DXGI_FORMAT_R32G32_TYPELESS             = 15,
    DXGI_FORMAT_R32G32_FLOAT                = 16,
    DXGI_FORMAT_R32G32_UINT                 = 17,
    DXGI_FORMAT_R32G32_SINT                 = 18,
    DXGI_FORMAT_R32G8X24_TYPELESS           = 19,
    DXGI_FORMAT_D32_FLOAT_S8X24_UINT        = 20,
    DXGI_FORMAT_R32_FLOAT_X8X24_TYPELESS    = 21,
    DXGI_FORMAT_X32_TYPELESS_G8X24_UINT     = 22,
    DXGI_FORMAT_R10G10B10A2_TYPELESS        = 23,
    DXGI_FORMAT_R10G10B10A2_UNORM           = 24,
    DXGI_FORMAT_R10G10B10A2_UINT            = 25,
    DXGI_FORMAT_R11G11B10_FLOAT             = 26,
    DXGI_FORMAT_R8G8B8A8_TYPELESS           = 27,
    DXGI_FORMAT_R8G8B8A8_UNORM              = 28,
    DXGI_FORMAT_R8G8B8A8_UNORM_SRGB         = 29,
    DXGI_FORMAT_R8G8B8A8_UINT               = 30,
    DXGI_FORMAT_R8G8B8A8_SNORM              = 31,
    DXGI_FORMAT_R8G8B8A8_SINT               = 32,
    DXGI_FORMAT_R16G16_TYPELESS             = 33,
    DXGI_FORMAT_R16G16_FLOAT                = 34,
    DXGI_FORMAT_R16G16_UNORM                = 35,
    DXGI_FORMAT_R16G16_UINT                 = 36,
    DXGI_FORMAT_R16G16_SNORM                = 37,
    DXGI_FORMAT_R16G16_SINT                 = 38,
    DXGI_FORMAT_R32_TYPELESS                = 39,
    DXGI_FORMAT_D32_FLOAT                   = 40,
    DXGI_FORMAT_R32_FLOAT                   = 41,
    DXGI_FORMAT_R32_UINT                    = 42,
    DXGI_FORMAT_R32_SINT                    = 43,
    DXGI_FORMAT_R24G8_TYPELESS              = 44,
    DXGI_FORMAT_D24_UNORM_S8_UINT           = 45,
    DXGI_FORMAT_R24_UNORM_X8_TYPELESS       = 46,
    DXGI_FORMAT_X24_TYPELESS_G8_UINT        = 47,
    DXGI_FORMAT_R8G8_TYPELESS               = 48,
    DXGI_FORMAT_R8G8_UNORM                  = 49,
    DXGI_FORMAT_R8G8_UINT                   = 50,
    DXGI_FORMAT_R8G8_SNORM                  = 51,
    DXGI_FORMAT_R8G8_SINT                   = 52,
    DXGI_FORMAT_R16_TYPELESS                = 53,
    DXGI_FORMAT_R16_FLOAT                   = 54,
    DXGI_FORMAT_D16_UNORM                   = 55,
    DXGI_FORMAT_R16_UNORM                   = 56,
    DXGI_FORMAT_R16_UINT                    = 57,
    DXGI_FORMAT_R16_SNORM                   = 58,
    DXGI_FORMAT_R16_SINT                    = 59,
    DXGI_FORMAT_R8_TYPELESS                 = 60,
    DXGI_FORMAT_R8_UNORM                    = 61,
    DXGI_FORMAT_R8_UINT                     = 62,
    DXGI_FORMAT_R8_SNORM                    = 63,
    DXGI_FORMAT_R8_SINT                     = 64,
    DXGI_FORMAT_A8_UNORM                    = 65,
    DXGI_FORMAT_R1_UNORM                    = 66,
    DXGI_FORMAT_R9G9B9E5_SHAREDEXP          = 67,
    DXGI_FORMAT_R8G8_B8G8_UNORM             = 68,
    DXGI_FORMAT_G8R8_G8B8_UNORM             = 69,
    DXGI_FORMAT_BC1_TYPELESS                = 70,
    DXGI_FORMAT_BC1_UNORM                   = 71,
    DXGI_FORMAT_BC1_UNORM_SRGB              = 72,
    DXGI_FORMAT_BC2_TYPELESS                = 73,
    DXGI_FORMAT_BC2_UNORM                   = 74,
    DXGI_FORMAT_BC2_UNORM_SRGB              = 75,
    DXGI_FORMAT_BC3_TYPELESS                = 76,
    DXGI_FORMAT_BC3_UNORM                   = 77,
    DXGI_FORMAT_BC3_UNORM_SRGB              = 78,
    DXGI_FORMAT_BC4_TYPELESS                = 79,
    DXGI_FORMAT_BC4_UNORM                   = 80,
    DXGI_FORMAT_BC4_SNORM                   = 81,
    DXGI_FORMAT_BC5_TYPELESS                = 82,
    DXGI_FORMAT_BC5_UNORM                   = 83,
    DXGI_FORMAT_BC5_SNORM                   = 84,
    DXGI_FORMAT_B5G6R5_UNORM                = 85,
    DXGI_FORMAT_B5G5R5A1_UNORM              = 86,
    DXGI_FORMAT_B8G8R8A8_UNORM              = 87,
    DXGI_FORMAT_B8G8R8X8_UNORM              = 88,
    DXGI_FORMAT_R10G10B10_XR_BIAS_A2_UNORM  = 89,
    DXGI_FORMAT_B8G8R8A8_TYPELESS           = 90,
    DXGI_FORMAT_B8G8R8A8_UNORM_SRGB         = 91,
    DXGI_FORMAT_B8G8R8X8_TYPELESS           = 92,
    DXGI_FORMAT_B8G8R8X8_UNORM_SRGB         = 93,
    DXGI_FORMAT_BC6H_TYPELESS               = 94,
    DXGI_FORMAT_BC6H_UF16                   = 95,
    DXGI_FORMAT_BC6H_SF16                   = 96,
    DXGI_FORMAT_BC7_TYPELESS                = 97,
    DXGI_FORMAT_BC7_UNORM                   = 98,
    DXGI_FORMAT_BC7_UNORM_SRGB              = 99,
    DXGI_FORMAT_AYUV                        = 100,
    DXGI_FORMAT_Y410                        = 101,
    DXGI_FORMAT_Y416                        = 102,
    DXGI_FORMAT_NV12                        = 103,
    DXGI_FORMAT_P010                        = 104,
    DXGI_FORMAT_P016                        = 105,
    DXGI_FORMAT_420_OPAQUE                  = 106,
    DXGI_FORMAT_YUY2                        = 107,
    DXGI_FORMAT_Y210                        = 108,
    DXGI_FORMAT_Y216                        = 109,
    DXGI_FORMAT_NV11                        = 110,
    DXGI_FORMAT_AI44                        = 111,
    DXGI_FORMAT_IA44                        = 112,
    DXGI_FORMAT_P8                          = 113,
    DXGI_FORMAT_A8P8                        = 114,
    DXGI_FORMAT_B4G4R4A4_UNORM              = 115,
    DXGI_FORMAT_P208                        = 130,
    DXGI_FORMAT_V208                        = 131,
    DXGI_FORMAT_V408                        = 132,
    DXGI_FORMAT_FORCE_UINT                  = 0xffffffff,
};
function fourCCToInt32(value: string): number {
    return value.charCodeAt(0) +
        (value.charCodeAt(1) << 8) +
        (value.charCodeAt(2) << 16) +
        (value.charCodeAt(3) << 24);
}
```

## File: src/util/loader/yaml.ts
```typescript
import { ContentLoader, Dependency, LoaderSession, LoadResultOD } from "./loader";
import { parseYaml } from "../yaml";
export class YamlLoader extends ContentLoader<any> {
    constructor(file: string, contentProvider?: () => Promise<string>) {
        super(file, contentProvider);
        this.readDependency = false;
    }
    protected async postLoad(content: string | undefined, dependencies: Dependency[], error: any, session: LoaderSession): Promise<LoadResultOD<any>> {
        if (error || (content === undefined)) {
            throw error;
        }
        return {
            result: parseYaml(content),
        };
    }
    public toString() {
        return `[YamlLoader ${this.file}]`;
    }
}
```

## File: src/util/yaml.ts
```typescript
import * as yaml from 'js-yaml';
export function parseYaml(content: string): any {
    try {
        return yaml.safeLoad(content);
    } catch (e) {
        content = content.replace(/:\d+\s*"/g, ": \"").replace(/(?<=")((?:\\.|[^\\"\n\r])*?)"(?!\s*$)/gm, "$1\\\"");
    }
    return yaml.safeLoad(content);
}
```

## File: webviewsrc/gfx.ts
```typescript
import { setState, getState, tryRun } from "./util/common";
function filterChange(text: string) {
    text = text.toLowerCase();
    const elements = document.getElementsByClassName('spriteTypePreview');
    setState({ filter: text });
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i] as HTMLDivElement;
        element.style.display = (text.length === 0 || element.id.toLowerCase().includes(text)) ? 'inline-block' : 'none';
    }
}
window.addEventListener('load', tryRun(function() {
    const filter = getState().filter || '';
    const element = document.getElementById('filter') as HTMLInputElement;
    element.value = filter;
    filterChange(filter);
    const changeFunc = function(this: HTMLInputElement) {
        filterChange(this.value);
    };
    element.addEventListener('change', changeFunc);
    element.addEventListener('keypress', changeFunc);
    element.addEventListener('keyup', changeFunc);
    element.addEventListener('paste', changeFunc);
    element.addEventListener('cut', changeFunc);
}));
```

## File: webviewsrc/util/i18n.ts
```typescript
import { __table } from '../../i18n/en';
let table: Record<string, string> = {};
try {
    table = (window as any)['__i18ntable'];
    if (!table) {
        console.error('Table not filled.');
        table = {};
    }
} catch(e) {
    console.error(e);
}
export function feLocalize(key: keyof typeof __table | 'TODO', message: string, ...args: any[]): string {
    if (key in table) {
        message = table[key];
    }
    const regex = new RegExp('\\{(' + args.map((_, i) => i.toString()).join('|') + ')\\}', 'g');
    return message.replace(regex, (_, group1) => args[parseInt(group1)]?.toString());
}
```

## File: webviewsrc/util/vscode.ts
```typescript
export const vscode = acquireVsCodeApi();
```

## File: webviewsrc/worldmap/definitions.ts
```typescript
export * from '../../src/previewdef/worldmap/definitions';
```

## File: webviewsrc/worldmap/graphutils.ts
```typescript
import { Point, Zone } from "./definitions";
export function inBBox(point: Point, bbox: Zone): boolean {
    return point.x >= bbox.x && point.x < bbox.x + bbox.w && point.y >= bbox.y && point.y < bbox.y + bbox.h;
}
export function bboxCenter(bbox: Zone): Point {
    return {
        x: bbox.x + bbox.w / 2,
        y: bbox.y + bbox.h / 2,
    };
}
export function distanceSqr(a: Point, b: Point): number {
    return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
}
export function distanceHamming(a: Point, b: Point): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
```

## File: scripts/geni18n.js
```javascript
const { recursiveFindAll } = require("./common");
const fs = require("fs");
const readline = require('readline');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});
const strRegex = "('(?:\\\\\\\\|\\\\.|[^\\\\'])*'|\"(?:\\\\\\\\|\\\\.|[^\\\\\"])*\")";
function unescapeString(str) {
    const quote = str[0];
    return str.substr(1, str.length - 2)
        .replace(new RegExp("\\\\" + quote, "g"), quote)
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r')
        .replace(/\\\\/g, '\\')
        ;
}
async function findLocalizeInside(file, localize, type) {
    const content = (await fs.promises.readFile(file)).toString();
    const regex = type !== 'html' ? new RegExp("(?<!\\w)(" + localize + "\\s*\\()" + strRegex + "\\s*,\\s*" + strRegex + "\\s*[,)]", "g") :
        /(%)(.*?)(?:\|(.*?))?%/g;
    const result = [];
    let match;
    while (match = regex.exec(content)) {
        const keyIndex = match.index + match[1].length;
        if (type !== 'html') {
            result.push([unescapeString(match[2]), unescapeString(match[3]), file, keyIndex]);
        } else {
            result.push([match[2], match[3], file, keyIndex]);
        }
    }
    return result;
}
async function replaceInFile(file, matches) {
    matches.sort((a, b) => a[3] - b[3]);
    const content = (await fs.promises.readFile(file)).toString();
    let resultContent = "";
    let lastEnd = 0;
    matches.forEach(match => {
        resultContent += content.substring(lastEnd, match[3]);
        if (file.endsWith('.html')) {
            resultContent += match[0];
            lastEnd = match[3] + 4;
        } else {
            resultContent += "'";
            resultContent += match[0];
            resultContent += "'";
            lastEnd = match[3] + 6;
        }
    });
    resultContent += content.substr(lastEnd);
    await fs.promises.writeFile(file, resultContent);
}
async function generateEnLocalizationFile(file, resultStr) {
    const content = (await fs.promises.readFile(file)).toString('utf-8');
    const sotComment = '/* SOT Do not remove this comment */';
    const eotComment = ';/* EOT Do not remove this comment */';
    const sPos = content.indexOf(sotComment) + sotComment.length;
    const ePos = content.indexOf(eotComment);
    const str = content.substr(0, sPos) + resultStr + content.substr(ePos);
    await fs.promises.writeFile(file, str);
}
(async () => {
    const srcFiles = (await recursiveFindAll("./src")).filter(file => file.endsWith(".ts"));
    const localizedPairs = (await Promise.all(srcFiles.map(file => findLocalizeInside(file, 'localize')))).reduce((p, c) => p.concat(c), []);
    const srcHtmlFiles = (await recursiveFindAll("./src")).filter(file => file.endsWith(".html"));
    const localizedHtmlPairs = (await Promise.all(srcHtmlFiles.map(file => findLocalizeInside(file, 'localize', 'html')))).reduce((p, c) => p.concat(c), []);
    const webSrcFiles = (await recursiveFindAll("./webviewsrc")).filter(file => file.endsWith(".ts"));
    const webSrcLocalizedPairs = (await Promise.all(webSrcFiles.map(file => findLocalizeInside(file, 'feLocalize')))).reduce((p, c) => p.concat(c), []);
    const allPairs = [...localizedPairs, ...localizedHtmlPairs, ...webSrcLocalizedPairs];
    const groupedKeyValues = {};
    allPairs.forEach(pair => {
        const key = pair[0];
        const value = pair[1];
        let arr = groupedKeyValues[key];
        if (!arr) {
            arr = [];
            groupedKeyValues[key] = arr;
        }
        if (key === 'TODO') {
            arr.push(pair);
        } else {
            if (!arr.includes(value)) {
                arr.push(value);
            }
        }
    });
    const result = {};
    Object.entries(groupedKeyValues).forEach(entry => {
        if (entry[0] !== 'TODO') {
            if (entry[1].length > 1) {
                console.error(entry);
            }
            result[entry[0]] = entry[1][0];
        }
    });
    if (groupedKeyValues.TODO) {
        const resolvedTodoByFile = {};
        const valueToKey = {};
        for (let i = 0; i < groupedKeyValues.TODO.length; i++) {
            const value = groupedKeyValues.TODO[i];
            const key = value[1] in valueToKey ? valueToKey[value[1]] : await new Promise(resolve => {
                rl.question(value[1] + '> ', resolve);
            });
            if (key) {
                valueToKey[value[1]] = key;
                result[key] = value[1];
                const file = value[2];
                if (file in resolvedTodoByFile) {
                    resolvedTodoByFile[file].push([key, ...value.slice(1)]);
                } else {
                    resolvedTodoByFile[file] = [[key, ...value.slice(1)]];
                }
            }
        }
        await Promise.all(Object.entries(resolvedTodoByFile).map(pair => replaceInFile(pair[0], pair[1])));
    }
    const resultStr = JSON.stringify(result, Object.keys(result).sort(), 4);
    await generateEnLocalizationFile('./i18n/en.ts', resultStr);
    console.log(resultStr);
    rl.close();
})();
```

## File: src/hoiformat/schema.ts
```typescript
import { Node, Token, NodeValue, SymbolNode } from "./hoiparser";
//#region Common
export interface TokenObject {
    _token: Token | undefined;
}
export interface CustomMap<T> extends TokenObject {
    _map: Record<string, { _key: string, _value: T }>;
}
export interface Enum extends TokenObject {
    _values: string[];
}
export interface StringIgnoreCase<T extends string> extends TokenObject {
    _stringAsSymbolIgnoreCase: true;
    _name: T;
}
export interface NumberLike extends TokenObject {
    _value: number;
    _unit: NumberUnit | undefined;
}
export interface DetailValue<T> extends TokenObject {
    _attachment: string | undefined;
    _attachmentToken: Token | undefined;
    _operator: string | undefined;
    _operatorToken: Token | undefined;
    _startToken: Token | undefined;
    _endToken: Token | undefined;
    _value: T;
}
export interface Raw extends TokenObject {
    _raw: Node;
}
export type NumberUnit = '%' | '%%';
export type HOIPartial<T> =
    T extends Enum ? T :
    T extends undefined | string | number | StringIgnoreCase<string> | NumberLike | boolean | Raw ? T | undefined :
    T extends CustomMap<infer T1> ? CustomMap<HOIPartial<T1>> :
    T extends DetailValue<infer T1> ? DetailValue<HOIPartial<T1>> | undefined :
    T extends (infer T1)[] ? HOIPartial<HOIPartial<T1>>[] :
    { [K in keyof T]:
        T[K] extends Enum ? T[K] :
        T[K] extends CustomMap<infer T1> ? CustomMap<HOIPartial<T1>> :
        T[K] extends DetailValue<infer T1> ? DetailValue<HOIPartial<T1>> | undefined :
        T[K] extends (infer T1)[] ? HOIPartial<T1>[] :
        K extends ('_token' | '_index') ? T[K] | undefined :
        HOIPartial<T[K]> | undefined; };
export type SchemaDef<T> =
    T extends boolean ? 'boolean' :
    T extends StringIgnoreCase<string> ? 'stringignorecase' :
    T extends string ? 'string' :
    T extends number ? 'number' :
    T extends NumberLike ? 'numberlike' :
    T extends Enum ? 'enum' :
    T extends Raw ? 'raw' :
    T extends CustomMap<infer T1> ? { _innerType: SchemaDef<T1>; _type: 'map'; } :
    T extends DetailValue<infer T1> ? { _innerType: SchemaDef<T1>; _type: 'detailvalue'; } :
    T extends (infer B)[] ? { _innerType: SchemaDef<B>; _type: 'array'; } :
    { [K in Exclude<keyof T, '_token' | '_index'>]: SchemaDef<T[K]>; };
//#endregion
//#region Common Defs
export interface Position {
    x: NumberLike;
    y: NumberLike;
}
export const positionSchema: SchemaDef<Position> = {
    x: "numberlike",
    y: "numberlike",
};
//#endregion
export const variableRegex = /^(?:(?<prefix>\w+):)?(?<scope>(?:\w+\.)*)?(?<var>\w+)(?:@(?<target>(?:\w+\.)*\w+))?(?:\?(?<default>\d+))?$/;
export const variableRegexForScope = /^(?:(?<prefix>\w+):)(?<scope>(?:\w+\.)*)?(?<var>\w+)(?:@(?<target>(?:\w+\.)*\w+))?$/;
//#region Functions
export function forEachNodeValue(node: Node, callback: (n: Node, index: number) => void): void {
    if (!Array.isArray(node.value)) {
        return;
    }
    node.value.forEach(callback);
}
export function isSymbolNode(value: NodeValue): value is SymbolNode {
    return typeof value === 'object' && value !== null && 'name' in value;
}
function applyConstantsToNode(node: Node, constants: Record<string, NodeValue>): Node {
    if (isSymbolNode(node.value) && node.value.name.startsWith('@')) {
        return {
            ...node,
            value: constants[node.value.name],
        };
    }
    return node;
}
function convertString(node: Node): HOIPartial<string> {
    if (isSymbolNode(node.value)) {
        const variable = tryParseVariable(node.value.name, false);
        if (variable !== undefined) {
            return variable;
        }
        return node.value.name;
    }
    return typeof node.value === 'string' ? node.value : (
        typeof node.value === 'number' ? node.value.toString() : undefined
    );
}
function convertNumber(node: Node): HOIPartial<number> {
    if (isSymbolNode(node.value)) {
        return tryParseVariable(node.value.name, true);
    }
    return typeof node.value === 'number' ? node.value : undefined;
}
function convertNumberLike(node: Node): HOIPartial<NumberLike> {
    if (typeof node.value === 'number') {
        return {
            _value: node.value,
            _unit: undefined,
            _token: undefined,
        };
    } else if (isSymbolNode(node.value)) {
        return parseNumberLike(node.value.name);
    } else {
        return undefined;
    }
}
function convertStringIgnoreCase(node: Node): HOIPartial<StringIgnoreCase<string>> {
    return isSymbolNode(node.value) ? { _name: node.value.name.toLowerCase(), _stringAsSymbolIgnoreCase: true, _token: undefined } :
        typeof node.value === 'string' ? { _name: node.value.toLowerCase(), _stringAsSymbolIgnoreCase: true, _token: undefined } : undefined;
}
function convertBoolean(node: Node): HOIPartial<boolean> {
    return isSymbolNode(node.value) ? (node.value.name === 'yes' ? true : (node.value.name === 'no' ? false : undefined)) : undefined;
}
function convertEnum(node: Node): HOIPartial<Enum> {
    return Array.isArray(node.value) ?
        { _values: node.value.map(v => v.name).filter((v): v is string => v !== null), _token: undefined } :
        { _values: [], _token: undefined };
}
function convertMap<T>(node: Node, innerSchema: SchemaDef<T>, constants: Record<string, NodeValue> = {}): HOIPartial<CustomMap<T>> {
    const result: HOIPartial<CustomMap<T>> = { _map: {}, _token: undefined };
    const map = result._map;
    forEachNodeValue(node, child => {
        if (!child.name) {
            return;
        }
        const childName = child.name;
        if (childName.startsWith('@') && child.operator === '=') {
            constants[childName] = child.value;
            return;
        }
        map[childName] = {
            _value: convertNodeToJson(child, innerSchema, constants),
            _key: childName,
        };
    });
    return result;
}
function convertDetailValue<T>(node: Node, innerSchema: SchemaDef<T>, constants: Record<string, NodeValue> = {}): HOIPartial<DetailValue<T>> {
    return {
        _attachment: node.valueAttachment?.name,
        _attachmentToken: node.valueAttachmentToken ?? undefined,
        _operator: node.operator ?? undefined,
        _operatorToken: node.operatorToken ?? undefined,
        _startToken: node.valueStartToken ?? undefined,
        _endToken: node.valueEndToken ?? undefined,
        _token: node.nameToken ?? undefined,
        _value: convertNodeToJson(node, innerSchema, constants),
    };
}
function convertObject<T>(node: Node, schemaDef: SchemaDef<T>, constants: Record<string, NodeValue> = {}): HOIPartial<T> {
    const result: Record<string, any> = {};
    const schema = schemaDef as any;
    for (const childSchemaEntry of Object.entries(schema)) {
        if (typeof childSchemaEntry[1] === 'object') {
            const type = (childSchemaEntry[1] as any)._type;
            if (type === 'map') {
                result[childSchemaEntry[0]] = { _map: {}, _token: undefined };
            } else if (type === 'array') {
                result[childSchemaEntry[0]] = [];
            }
        } else if (childSchemaEntry[1] === 'enum') {
            result[childSchemaEntry[0]] = { _values: [], _token: undefined };
        }
    }
    forEachNodeValue(node, (child, index) => {
        if (!child.name) {
            return;
        }
        if (child.name.startsWith('@') && child.operator === '=') {
            constants[child.name] = child.value;
            return;
        }
        const childName = child.name.toLowerCase();
        const childSchemaDef = schema[childName];
        if (!childSchemaDef) {
            return;
        }
        let setChildValue = true;
        if (typeof childSchemaDef === 'object') {
            const type = childSchemaDef._type;
            if (type === 'map') {
                const mapData = (convertNodeToJson(child, childSchemaDef, constants) as any)._map;
                Object.assign(result[childName]._map, mapData);
            } else if (type === 'array') {
                const innerType = childSchemaDef._innerType;
                const convertedChild = convertNodeToJson(child, innerType, constants);
                if (typeof convertedChild === 'object') {
                    (convertedChild as any)._index = index;
                }
                result[childName].push(convertedChild);
            } else {
                setChildValue = false;
            }
        } else if (childSchemaDef === 'enum') {
            const enums = (convertNodeToJson(child, childSchemaDef, constants) as any)._values;
            result[childName]._values.push(...enums);
        } else {
            setChildValue = false;
        }
        if (!setChildValue) {
            result[childName] = convertNodeToJson(child, childSchemaDef, constants);
        }
    });
    return result as HOIPartial<T>;
}
function tryParseVariable(str: string, isNumber: true): number | undefined;
function tryParseVariable(str: string, isNumber: false): string | undefined;
function tryParseVariable(str: string, isNumber: boolean): number | string | undefined {
    const match = variableRegex.exec(str);
    if (!match) {
        return undefined;
    }
    if (isNumber) {
        if (match.groups?.default) {
            return parseFloat(match.groups.default);
        }
        return 0;
    } else {
        if (match.groups?.prefix) {
            return str;
        }
        return undefined;
    }
}
export function convertNodeToJson<T>(node: Node, schemaDef: SchemaDef<T>, constants: Record<string, NodeValue> = {}): HOIPartial<T> {
    const schema = schemaDef as any;
    let result: HOIPartial<T>;
    node = applyConstantsToNode(node, constants);
    if (typeof schema === 'string') {
        switch (schema) {
            case 'string':
                result = convertString(node) as HOIPartial<T>;
                break;
            case 'number':
                result = convertNumber(node) as HOIPartial<T>;
                break;
            case 'numberlike':
                result = convertNumberLike(node) as HOIPartial<T>;
                break;
            case 'stringignorecase':
                result = convertStringIgnoreCase(node) as HOIPartial<T>;
                break;
            case 'boolean':
                result = convertBoolean(node) as HOIPartial<T>;
                break;
            case 'enum':
                result = convertEnum(node) as HOIPartial<T>;
                break;
            case 'raw':
                result = { _raw: node } as HOIPartial<T>;
                break;
            default:
                throw new Error('Unknown schema ' + schema);
        }
    } else if (typeof schema === 'object') {
        const type = schema._type;
        if (type === 'map') {
            result = convertMap(node, schema._innerType, constants) as HOIPartial<T>;
        } else if (type === 'array') {
            throw new Error("Array can't be here.");
        } else if (type === 'detailvalue') {
            result = convertDetailValue(node, schema._innerType, constants) as HOIPartial<T>;
        } else {
            result = convertObject(node, schema, constants);
        }
    } else {
        throw new Error('Bad schema ' + schema);
    }
    if (typeof result === 'object') {
        (result as { _token: Token | undefined })._token = node.nameToken ?? undefined;
    }
    return result;
}
export function toNumberLike(value: number): NumberLike {
    return {
        _value: value,
        _unit: undefined,
        _token: undefined,
    };
}
export function parseNumberLike(value: string): NumberLike | undefined {
    const regex = /^(-?(?:\d+(?:\.\d*)?|\.\d+))(%%?)$/;
    const result = regex.exec(value);
    if (!result) {
        return undefined;
    }
    return {
        _value: parseFloat(result[1]),
        _unit: result[2] as NumberUnit,
        _token: undefined,
    };
}
export function toStringAsSymbolIgnoreCase<T extends string>(value: T): StringIgnoreCase<T> {
    return {
        _name: value,
        _stringAsSymbolIgnoreCase: true,
        _token: undefined,
    };
}
//#endregion
```

## File: src/hoiformat/spritetype.ts
```typescript
import { Node, Token } from "./hoiparser";
import { SchemaDef, convertNodeToJson, DetailValue } from "./schema";
import { NumberPosition } from "../util/common";
interface SpriteTypes {
    spritetype: SpriteTypeDef[];
    corneredtilespritetype: CorneredTileSpriteTypeDef[];
    frameanimatedspritetype: SpriteTypeDef[];
    textspritetype: SpriteTypeDef[];
}
interface SpriteTypeDef {
    name: DetailValue<string>;
    texturefile: string;
    noofframes: number;
    _token: Token | undefined;
}
interface CorneredTileSpriteTypeDef {
    name: DetailValue<string>;
    texturefile: string;
    noofframes: number;
    size: NumberPosition;
    bordersize: NumberPosition;
    tilingCenter: boolean;
    _token: Token | undefined;
}
export interface SpriteType {
    name: string;
    texturefile: string;
    noofframes: number;
    token: Token | undefined;
}
export interface CorneredTileSpriteType {
    name: string;
    texturefile: string;
    noofframes: number;
    size: NumberPosition;
    bordersize: NumberPosition;
    tilingCenter: boolean;
    token: Token | undefined;
}
interface SpriteFile {
    spritetypes: SpriteTypes[];
}
const corneredTileSpriteTypeSchema: SchemaDef<CorneredTileSpriteTypeDef> = {
    name: {
        _innerType: "string",
        _type: "detailvalue",
    },
    texturefile: "string",
    noofframes: "number",
    size: {
        x: "number",
        y: "number",
    },
    bordersize: {
        x: "number",
        y: "number",
    },
    tilingCenter: "boolean",
};
const spriteTypeSchema: SchemaDef<SpriteTypeDef> = {
    name: {
        _innerType: "string",
        _type: "detailvalue",
    },
    texturefile: "string",
    noofframes: "number",
};
const spriteTypesSchema: SchemaDef<SpriteTypes> = {
    spritetype: {
        _innerType: spriteTypeSchema,
        _type: "array",
    },
    corneredtilespritetype: {
        _innerType: corneredTileSpriteTypeSchema,
        _type: "array",
    },
    frameanimatedspritetype: {
        _innerType: spriteTypeSchema,
        _type: "array",
    },
    textspritetype: {
        _innerType: spriteTypeSchema,
        _type: "array",
    },
};
const spriteFileSchema: SchemaDef<SpriteFile> = {
    spritetypes: {
        _innerType: spriteTypesSchema,
        _type: "array",
    },
};
export function getSpriteTypes(node: Node): (SpriteType | CorneredTileSpriteType)[] {
    const file = convertNodeToJson<SpriteFile>(node, spriteFileSchema);
    const result: (SpriteType | CorneredTileSpriteType)[] = [];
    for (const spritetypes of file.spritetypes) {
        for (const sprite of spritetypes.spritetype.concat(spritetypes.frameanimatedspritetype).concat(spritetypes.textspritetype)) {
            const name = sprite.name?._value;
            const texturefile = sprite.texturefile;
            if (name && texturefile) {
                result.push({
                    name,
                    texturefile,
                    noofframes: sprite.noofframes ?? 1,
                    token: sprite.name!._startToken,
                });
            }
        }
        for (const sprite of spritetypes.corneredtilespritetype) {
            const name = sprite.name?._value;
            const texturefile = sprite.texturefile;
            if (name && texturefile) {
                result.push({
                    name,
                    texturefile,
                    noofframes: sprite.noofframes ?? 1,
                    size: {
                        x: sprite.size?.x ?? 100,
                        y: sprite.size?.y ?? 100,
                    },
                    bordersize: {
                        x: sprite.bordersize?.x ?? 0,
                        y: sprite.bordersize?.y ?? 0,
                    },
                    tilingCenter: sprite.tilingCenter ?? false,
                    token: sprite.name!._startToken,
                });
            }
        }
    }
    return result;
}
```

## File: src/previewdef/event/index.ts
```typescript
import * as vscode from 'vscode';
import { renderEventFile } from './contentbuilder';
import { matchPathEnd } from '../../util/nodecommon';
import { PreviewBase } from '../previewbase';
import { PreviewProviderDef } from '../previewmanager';
import { EventsLoader } from './loader';
import { getRelativePathInWorkspace } from '../../util/vsccommon';
import { eventTreePreview } from '../../util/featureflags';
import { ConfigurationKey } from '../../constants';
function canPreviewEvent(document: vscode.TextDocument) {
    if (!eventTreePreview) {
        return undefined;
    }
    const uri = document.uri;
    if (matchPathEnd(uri.toString().toLowerCase(), ['events', '*']) && uri.path.toLowerCase().endsWith('.txt')) {
        return 0;
    }
    const text = document.getText();
    return /(country_event|news_event|unit_leader_event|state_event|operative_leader_event)\s*=\s*{/.exec(text)?.index;
}
class EventPreview extends PreviewBase {
    private eventsLoader: EventsLoader;
    private content: string | undefined;
    private configurationHandler: vscode.Disposable;
    constructor(uri: vscode.Uri, panel: vscode.WebviewPanel) {
        super(uri, panel);
        this.eventsLoader = new EventsLoader(getRelativePathInWorkspace(this.uri), () => Promise.resolve(this.content ?? ''));
        this.eventsLoader.onLoadDone(r => this.updateDependencies(r.dependencies));
        this.configurationHandler = vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration(`${ConfigurationKey}.previewLocalisation`)) {
                this.reload();
            }
        });
    }
    protected async getContent(document: vscode.TextDocument): Promise<string> {
        this.content = document.getText();
        const result = await renderEventFile(this.eventsLoader, document.uri, this.panel.webview);
        this.content = undefined;
        return result;
    }
    public dispose(): void {
        super.dispose();
        this.configurationHandler.dispose();
    }
}
export const eventPreviewDef: PreviewProviderDef = {
    type: 'event',
    canPreview: canPreviewEvent,
    previewContructor: EventPreview,
};
```

## File: src/previewdef/event/schema.ts
```typescript
import { Node, Token } from "../../hoiformat/hoiparser";
import { Raw, SchemaDef, convertNodeToJson, HOIPartial, isSymbolNode, NumberLike } from "../../hoiformat/schema";
import { extractEffectValue, EffectItem, EffectComplexExpr } from "../../hoiformat/effect";
import { Scope, ScopeType } from "../../hoiformat/scope";
import { uniqBy } from "lodash";
export interface HOIEvents {
    eventItemsByNamespace: Record<string, HOIEvent[]>;
}
export type HOIEventType = 'country' | 'state' | 'unit_leader' | 'news' | 'operative_leader';
export interface HOIEvent {
    type: HOIEventType;
    id: string;
    title: string;
    namespace: string;
    picture?: string;
    immediate: HOIEventOption;
    options: HOIEventOption[];
    token: Token | undefined;
    major: boolean;
    hidden: boolean;
    isTriggeredOnly: boolean;
    meanTimeToHappenBase: number;
    fire_only_once: boolean;
    file: string;
}
export interface HOIEventOption {
    name?: string;
    childEvents: ChildEvent[];
    token: Token | undefined;
}
export interface ChildEvent {
    scopeName: string;
    eventName: string;
    days: number;
    hours: number;
    randomDays: number;
    randomHours: number;
}
interface EventFile {
    add_namespace: string[];
    country_event: EventDef[];
    news_event: EventDef[];
    state_event: EventDef[];
    unit_leader_event: EventDef[];
    operative_leader_event: EventDef[];
}
interface EventDef {
    id: string;
    title: string;
    picture: string;
    is_triggered_only: boolean;
    major: boolean;
    hidden: boolean;
    mean_time_to_happen: MeanTimeToHappen;
    fire_only_once: boolean;
    option: Raw[];
    immediate: Raw;
    _token: Token;
}
interface MeanTimeToHappen {
    base: number;
    factor: number;
    days: number;
    months: number;
    years: number;
}
interface EventOptionDef {
    name: string;
    trigger: Raw;
    ai_chance: string;
    original_recipient_only: boolean;
    _token: Token;
}
interface EventEffectDef {
    id: string;
    days: number;
    hours: number;
    random: number;
    random_hours: number;
    random_days: number;
}
const eventOptionDefSchema: SchemaDef<EventOptionDef> = {
    name: "string",
    trigger: "raw",
    ai_chance: "string",
    original_recipient_only: "boolean",
};
const eventDefSchema: SchemaDef<EventDef> = {
    id: "string",
    title: "string",
    picture: "string",
    is_triggered_only: "boolean",
    major: "boolean",
    hidden: "boolean",
    fire_only_once: "boolean",
    mean_time_to_happen: {
        base: "number",
        factor: "number",
        days: "number",
        months: "number",
        years: "number",
    },
    option: {
        _innerType: "raw",
        _type: "array",
    },
    immediate: "raw",
};
const eventFileSchema: SchemaDef<EventFile> = {
    add_namespace: {
        _innerType: "string",
        _type: "array",
    },
    country_event: {
        _innerType: eventDefSchema,
        _type: "array",
    },
    news_event: {
        _innerType: eventDefSchema,
        _type: "array",
    },
    unit_leader_event: {
        _innerType: eventDefSchema,
        _type: "array",
    },
    state_event: {
        _innerType: eventDefSchema,
        _type: "array",
    },
    operative_leader_event: {
        _innerType: eventDefSchema,
        _type: "array",
    },
};
const eventEffectDefSchema: SchemaDef<EventEffectDef> = {
    id: "string",
    days: "number",
    hours: "number",
    random: "number",
    random_hours: "number",
    random_days: "number",
};
export function getEvents(node: Node, filePath: string): HOIEvents {
    const eventFile = convertNodeToJson<EventFile>(node, eventFileSchema);
    const eventItemsByNamespace: Record<string, HOIEvent[]> = {};
    for (const namespace of eventFile.add_namespace) {
        if (namespace) {
            eventItemsByNamespace[namespace] = [];
        }
    }
    fillEvents(eventFile.country_event, 'country', filePath, eventItemsByNamespace);
    fillEvents(eventFile.news_event, 'news', filePath, eventItemsByNamespace);
    fillEvents(eventFile.state_event, 'state', filePath, eventItemsByNamespace);
    fillEvents(eventFile.unit_leader_event, 'unit_leader', filePath, eventItemsByNamespace);
    fillEvents(eventFile.operative_leader_event, 'operative_leader', filePath, eventItemsByNamespace);
    return {
        eventItemsByNamespace,
    };
}
function fillEvents(eventDefs: HOIPartial<EventDef>[], type: HOIEventType, filePath: string, eventItemsByNamespace: Record<string, HOIEvent[]>) {
    for (const eventDef of eventDefs) {
        const converted = convertEvent(eventDef, filePath, type);
        if (converted) {
            const listOfNamespace = eventItemsByNamespace[converted.namespace];
            if (listOfNamespace) {
                listOfNamespace.push(converted);
            }
        }
    }
}
function eventTypeToScopeType(eventType: HOIEventType): ScopeType {
    switch (eventType) {
        case 'country':
        case 'news':
            return 'country';
        case 'state':
            return 'state';
        case 'unit_leader':
            return 'leader';
        case 'operative_leader':
            return 'operative';
        default:
            return 'unknown';
    }
}
function convertEvent<T extends HOIEventType>(eventDef: HOIPartial<EventDef>, file: string, type: T): HOIEvent & { type: T } | undefined {
    if (!eventDef.id) {
        return undefined;
    }
    const id = eventDef.id;
    const title = eventDef.title ?? (id + '.t');
    const namespace = id.split('.')[0];
    const picture = eventDef.picture;
    const scopeType = eventTypeToScopeType(type);
    const scope: Scope = { scopeName: `{event_target}`, scopeType };
    const immediate = convertOption(eventDef.immediate, scope);
    const options = eventDef.option.map(o => convertOption(o, scope));
    const meanTimeToHappenBase = eventDef.mean_time_to_happen ?
        Math.floor(eventDef.mean_time_to_happen.factor ??
            eventDef.mean_time_to_happen.base ??
            eventDef.mean_time_to_happen.days ??
            (eventDef.mean_time_to_happen.months ? Math.floor(eventDef.mean_time_to_happen.months) * 30 : undefined) ??
            (eventDef.mean_time_to_happen.years ? Math.floor(eventDef.mean_time_to_happen.years) * 365 : undefined) ??
            1) :
        1;
    return {
        type,
        id,
        title,
        namespace,
        picture,
        file,
        immediate,
        options,
        token: eventDef._token,
        major: !!eventDef.major,
        hidden: !!eventDef.hidden,
        isTriggeredOnly: !!eventDef.is_triggered_only,
        meanTimeToHappenBase,
        fire_only_once: !!eventDef.fire_only_once,
    };
}
function convertOption(optionRaw: Raw | undefined, scope: Scope): HOIEventOption {
    if (optionRaw === undefined) {
        return { childEvents: [], token: undefined };
    }
    const optionDef = convertNodeToJson<EventOptionDef>(optionRaw._raw, eventOptionDefSchema);
    const name = optionDef.name;
    const effect = extractEffectValue(optionRaw._raw.value, scope);
    const childEventItems = findChildEventItems(effect.effect);
    const childEvents = childEventItems
        .map(effectItemToChildEvent)
        .filter((e): e is ChildEvent => e !== undefined);
    const uniqueChildEvents = uniqBy(childEvents, e => e.eventName + '@' + e.scopeName);
    return {
        name,
        childEvents: uniqueChildEvents,
        token: optionDef._token,
    };
}
const eventTypes = ['country_event', 'news_event', 'state_event', 'unit_leader_event', 'operative_leader_event'];
function findChildEventItems(effect: EffectComplexExpr, result: EffectItem[] = []): EffectItem[] {
    if (effect === null) {
        return result;
    }
    if ('nodeContent' in effect) {
        if (effect.node.name && eventTypes.includes(effect.node.name?.toLowerCase())) {
            result.push(effect);
        }
    } else if ('condition' in effect) {
        effect.items.forEach(item => findChildEventItems(item, result));
    } else {
        effect.items.forEach(item => findChildEventItems(item.effect, result));
    }
    return result;
}
function effectItemToChildEvent(item: EffectItem): ChildEvent | undefined {
    const eventEffectDef = getEventEffectDef(item.node);
    if (!eventEffectDef) {
        return undefined;
    }
    return {
        scopeName: item.scopeName,
        eventName: eventEffectDef.id,
        days: eventEffectDef.days,
        hours: eventEffectDef.hours,
        randomDays: eventEffectDef.random_days,
        randomHours: eventEffectDef.random_hours === 0 ? eventEffectDef.random : eventEffectDef.random_hours,
    };
}
function getEventEffectDef(node: Node): EventEffectDef | undefined {
    if (isSymbolNode(node.value)) {
        return { id: node.value.name, days: 0, hours: 0, random: 0, random_days: 0, random_hours: 0 };
    }
    if (typeof node.value === 'string') {
        return { id: node.value, days: 0, hours: 0, random: 0, random_days: 0, random_hours: 0 };
    }
    const callEventDef = convertNodeToJson<EventEffectDef>(node, eventEffectDefSchema);
    return callEventDef.id === undefined ? undefined : {
        id: callEventDef.id,
        days: callEventDef.days ?? 0,
        hours: callEventDef.hours ?? 0,
        random: callEventDef.random ?? 0,
        random_days: callEventDef.random_days ?? 0,
        random_hours: callEventDef.random_hours ?? 0,
    };
}
```

## File: src/previewdef/focustree/index.ts
```typescript
import * as vscode from 'vscode';
import { renderFocusTreeFile } from './contentbuilder';
import { matchPathEnd } from '../../util/nodecommon';
import { PreviewBase } from '../previewbase';
import { PreviewProviderDef } from '../previewmanager';
import { FocusTreeLoader } from './loader';
import { getRelativePathInWorkspace } from '../../util/vsccommon';
function canPreviewFocusTree(document: vscode.TextDocument) {
    const uri = document.uri;
    if (matchPathEnd(uri.toString().toLowerCase(), ['common', 'national_focus', '*']) && uri.path.toLowerCase().endsWith('.txt')) {
        return 0;
    }
    const text = document.getText();
    return /(focus_tree|shared_focus|joint_focus)\s*=\s*{/.exec(text)?.index;
}
class FocusTreePreview extends PreviewBase {
    private focusTreeLoader: FocusTreeLoader;
    private content: string | undefined;
    constructor(uri: vscode.Uri, panel: vscode.WebviewPanel) {
        super(uri, panel);
        this.focusTreeLoader = new FocusTreeLoader(getRelativePathInWorkspace(this.uri), () => Promise.resolve(this.content ?? ''));
        this.focusTreeLoader.onLoadDone(r => this.updateDependencies(r.dependencies));
    }
    protected async getContent(document: vscode.TextDocument): Promise<string> {
        this.content = document.getText();
        const result = await renderFocusTreeFile(this.focusTreeLoader, document.uri, this.panel.webview);
        this.content = undefined;
        return result;
    }
}
export const focusTreePreviewDef: PreviewProviderDef = {
    type: 'focustree',
    canPreview: canPreviewFocusTree,
    previewContructor: FocusTreePreview,
};
```

## File: src/previewdef/gfx/contentbuilder.ts
```typescript
import * as vscode from 'vscode';
import { parseHoi4File } from '../../hoiformat/hoiparser';
import { getSpriteTypes } from '../../hoiformat/spritetype';
import { getImageByPath } from '../../util/image/imagecache';
import { localize } from '../../util/i18n';
import { SpriteType } from '../../hoiformat/spritetype';
import { html, htmlEscape } from '../../util/html';
import { StyleTable } from '../../util/styletable';
import { forceError } from '../../util/common';
export async function renderGfxFile(fileContent: string, uri: vscode.Uri, webview: vscode.Webview): Promise<string> {
    const setPreviewFileUriScript = { content: `window.previewedFileUri = "${uri.toString()}";` };
    try {
        const spriteTypes = getSpriteTypes(parseHoi4File(fileContent, localize('infile', 'In file {0}:\n', uri.toString())));
        const styleTable = new StyleTable();
        const baseContent = await renderSpriteTypes(spriteTypes, styleTable);
        return html(
            webview,
            baseContent, 
            [
                setPreviewFileUriScript,
                'common.js',
                'gfx.js',
            ],
            [
                'common.css',
                styleTable,
            ],
        );
    } catch (e) {
        const baseContent = `${localize('error', 'Error')}: <br/>  <pre>${htmlEscape(forceError(e).toString())}</pre>`;
        return html(webview, baseContent, [ setPreviewFileUriScript ], []);
    }
}
async function renderSpriteTypes(spriteTypes: SpriteType[], styleTable: StyleTable): Promise<string> {
    const imageList = (await Promise.all(spriteTypes.map(st => renderSpriteType(st, styleTable)))).join('');
    const filter = `<div
    class="${styleTable.style('filterBar', () => `
        position: fixed;
        padding-top: 10px;
        padding-left: 20px;
        width: 100%;
        height: 30px;
        top: 0;
        left: 0;
        background: var(--vscode-editor-background);
        border-bottom: 1px solid var(--vscode-panel-border);
    `)}">
        <label for="filter" class="${styleTable.style('filterLabel', () => `margin-right:5px`)}">${localize('gfx.filter', 'Filter: ')}</label>
        <input
            id="filter"
            type="text"
        />
    </div>`;
    return `${filter}
    <div class="${styleTable.style('imageList', () => `margin-top: 40px`)}">
        ${imageList}
    </div>`;
}
async function renderSpriteType(spriteType: SpriteType, styleTable: StyleTable): Promise<string> {
    const image = await getImageByPath(spriteType.texturefile);
    return `<div
        id="${spriteType.name}"
        class="
            spriteTypePreview
            navigator
            ${styleTable.style('spriteTypePreview', () => `
                display: inline-block;
                text-align: center;
                margin: 10px;
                cursor: pointer;
            `)}
        "
        start="${spriteType.token?.start}"
        end="${spriteType.token?.end}"
        title="${spriteType.name}${image ? ` (${
            image.width / spriteType.noofframes}x${image.height}x${spriteType.noofframes})` : ''
            }\n${image ? image.path : localize('gfx.imagenotfound', 'Image not found')}">
        ${image ? `<img src="${image.uri}" />` :
            `<div 
            class="${styleTable.style('missingImageOuter', () => `
                height: 100px;
                width: 100px;
                background: grey;
                margin: auto;
                display: table;
            `)}">
                <div class="${styleTable.style('missingImageInner', () => `display:table-cell;vertical-align:middle;color:black;`)}">
                    MISSING
                </div>
            </div>`}
        <p class="
            ${styleTable.style('imageName-common', () => `
                min-width: 120px;
                overflow: hidden;
                text-overflow: ellipsis;
                margin-top: 0
            `)}
            ${styleTable.oneTimeStyle('imageName', () => `
                max-width: ${Math.max(image?.width || 100, 120)}px;
            `)}
        ">
            ${htmlEscape(spriteType.name)}
        </p>
    </div>`;
}
```

## File: src/previewdef/gui/index.ts
```typescript
import * as vscode from 'vscode';
import { PreviewProviderDef } from '../previewmanager';
import { PreviewBase } from '../previewbase';
import { GuiFileLoader } from './loader';
import { getRelativePathInWorkspace, getDocumentByUri } from '../../util/vsccommon';
import { renderGuiFile } from './contentbuilder';
function canPreviewGui(document: vscode.TextDocument) {
    const uri = document.uri;
    return uri.path.toLowerCase().endsWith('.gui') ? 0 : undefined;
}
class GuiPreview extends PreviewBase {
    private guiFileLoader: GuiFileLoader;
    private content: string | undefined;
    constructor(uri: vscode.Uri, panel: vscode.WebviewPanel) {
        super(uri, panel);
        this.guiFileLoader = new GuiFileLoader(getRelativePathInWorkspace(this.uri), () => Promise.resolve(this.content ?? ''));
        this.guiFileLoader.onLoadDone(r => this.updateDependencies(r.dependencies));
    }
    protected registerEvents(panel: vscode.WebviewPanel): void {
        super.registerEvents(panel);
        panel.webview.onDidReceiveMessage(async (msg) => {
            if (msg.command === 'editGuiPosition') {
                const document = getDocumentByUri(this.uri);
                if (document) {
                    await this.applyPositionEdit(document, msg.start, msg.end, msg.dx, msg.dy);
                }
            }
        });
    }
    protected async getContent(document: vscode.TextDocument): Promise<string> {
        this.content = document.getText();
        const result = await renderGuiFile(this.guiFileLoader, document.uri, this.panel.webview);
        this.content = undefined;
        return result;
    }
    private async applyPositionEdit(document: vscode.TextDocument, start: number, end: number, dx: number, dy: number) {
        const text = document.getText();
        // Extract ONLY the text of the specific node we dragged
        const nodeText = text.substring(start, end);
        // Regex to find "position = { x = 123 y = 456 }"
        const positionRegex = /position\s*=\s*\{\s*x\s*=\s*(-?\d+)\s*y\s*=\s*(-?\d+)\s*\}/;
        const match = positionRegex.exec(nodeText);
        const edit = new vscode.WorkspaceEdit();
        if (match) {
            const oldX = parseInt(match[1], 10);
            const oldY = parseInt(match[2], 10);
            const newX = oldX + dx;
            const newY = oldY + dy;
            const matchStartOffset = start + match.index;
            const matchEndOffset = matchStartOffset + match[0].length;
            const range = new vscode.Range(document.positionAt(matchStartOffset), document.positionAt(matchEndOffset));
            edit.replace(document.uri, range, `position = { x = ${newX} y = ${newY} }`);
        } else {
            // Fallback: If position block is missing entirely, insert it after the name property
            const insertOffset = start + nodeText.indexOf('{') + 1;
            const insertPos = document.positionAt(insertOffset);
            edit.insert(document.uri, insertPos, `\n\t\tposition = { x = ${dx} y = ${dy} }`);
        }
        await vscode.workspace.applyEdit(edit);
    }
}
export const guiPreviewDef: PreviewProviderDef = {
    type: 'gui',
    canPreview: canPreviewGui,
    previewContructor: GuiPreview,
};
```

## File: src/previewdef/gui/loader.ts
```typescript
import { chain, flatMap } from "lodash";
import { GuiFile, guiFileSchema } from "../../hoiformat/gui";
import { parseHoi4File } from "../../hoiformat/hoiparser";
import { convertNodeToJson, HOIPartial } from "../../hoiformat/schema";
import { localize } from "../../util/i18n";
import { ContentLoader, Dependency, LoaderSession, LoadResultOD, mergeInLoadResult } from "../../util/loader/loader";
export interface GuiFileLoaderResult {
    guiFiles: { file: string, data: HOIPartial<GuiFile> }[];
    gfxFiles: string[];
}
export class GuiFileLoader extends ContentLoader<GuiFileLoaderResult> {
    protected async postLoad(content: string | undefined, dependencies: Dependency[], error: any, session: LoaderSession): Promise<LoadResultOD<GuiFileLoaderResult>> {
        if (error || (content === undefined)) {
            throw error;
        }
        const gfxDependencies = [this.file.replace(/.gui$/, '.gfx'), ...dependencies.filter(d => d.type === 'gfx').map(d => d.path)];
        const guiDependencies = dependencies.filter(d => d.type === 'gui').map(d => d.path);
        const guiDepFiles = await this.loaderDependencies.loadMultiple(guiDependencies, session, GuiFileLoader);
        const guiFile = convertNodeToJson<GuiFile>(parseHoi4File(content, localize('infile', 'In file {0}:\n', this.file)), guiFileSchema);
        return {
            result: {
                gfxFiles: chain(gfxDependencies).concat(flatMap(guiDepFiles, r => r.result.gfxFiles)).uniq().value(),
                guiFiles: chain(guiDepFiles).flatMap(r => r.result.guiFiles).concat({ file: this.file, data: guiFile }).uniq().value(),
            },
            dependencies: chain([this.file]).concat(gfxDependencies, mergeInLoadResult(guiDepFiles, 'dependencies')).uniq().value(),
        };
    }
    public toString() {
        return `[GuiFileLoader ${this.file}]`;
    }
}
```

## File: src/previewdef/mio/index.ts
```typescript
import * as vscode from 'vscode';
import { PreviewProviderDef } from '../previewmanager';
import { PreviewBase } from '../previewbase';
import { getRelativePathInWorkspace } from '../../util/vsccommon';
import { matchPathEnd } from '../../util/nodecommon';
import { MioLoader } from './loader';
import { renderMioFile } from './contentbuilder';
function canPreviewMio(document: vscode.TextDocument) {
    const uri = document.uri;
    if (matchPathEnd(uri.toString().toLowerCase(), ['common', 'military_industrial_organization', 'organizations', '*']) && uri.path.toLowerCase().endsWith('.txt')) {
        return 0;
    }
    return undefined;
}
class MioPreview extends PreviewBase {
    private mioFileLoader: MioLoader;
    private content: string | undefined;
    constructor(uri: vscode.Uri, panel: vscode.WebviewPanel) {
        super(uri, panel);
        this.mioFileLoader = new MioLoader(getRelativePathInWorkspace(this.uri), () => Promise.resolve(this.content ?? ''));
        this.mioFileLoader.onLoadDone(r => this.updateDependencies(r.dependencies));
    }
    protected async getContent(document: vscode.TextDocument): Promise<string> {
        this.content = document.getText();
        const result = await renderMioFile(this.mioFileLoader, document.uri, this.panel.webview);
        this.content = undefined;
        return result;
    }
}
export const mioPreviewDef: PreviewProviderDef = {
    type: 'mio',
    canPreview: canPreviewMio,
    previewContructor: MioPreview,
};
```

## File: src/previewdef/mio/loader.ts
```typescript
import { ContentLoader, LoadResultOD, Dependency, LoaderSession, mergeInLoadResult } from "../../util/loader/loader";
import { parseHoi4File } from "../../hoiformat/hoiparser";
import { localize } from "../../util/i18n";
import { uniq, flatten, chain, flatMap } from "lodash";
import { Mio, getMiosFromFile } from "./schema";
import { getGfxContainerFiles } from "../../util/gfxindex";
export interface MioLoaderResult {
    mios: Mio[];
    gfxFiles: string[];
}
const mioGFX = 'interface/military_industrial_organization/industrial_organization_policies_and_traits_icons.gfx';
const ideaGFX = 'interface/ideas.gfx';
const genericMio = 'common/military_industrial_organization/organizations/00_generic_organization.txt';
export class MioLoader extends ContentLoader<MioLoaderResult> {
    protected async postLoad(content: string | undefined, dependencies: Dependency[], error: any, session: LoaderSession): Promise<LoadResultOD<MioLoaderResult>> {
        if (error || (content === undefined)) {
            throw error;
        }
        const originalMioDependencies = dependencies.filter(d => d.type === 'mio').map(d => d.path);
        const mioDependencies = this.file === genericMio ? originalMioDependencies : uniq([ ...originalMioDependencies, genericMio ]);
        const mioDepFiles = await this.loaderDependencies.loadMultiple(mioDependencies, session, MioLoader);
        const dependentMios = flatMap(mioDepFiles, m => m.result.mios);
        const mios = getMiosFromFile(parseHoi4File(content, localize('infile', 'In file {0}:\n', this.file)), dependentMios, this.file);
        const gfxDependencies = [
            ...dependencies.filter(d => d.type === 'gfx').map(d => d.path),
            ...flatten(mioDepFiles.map(f => f.result.gfxFiles)),
            ...await getGfxContainerFiles(chain(mios).flatMap(m => Object.values(m.traits)).flatMap(t => t.icon).value()),
        ];
        return {
            result: {
                mios,
                gfxFiles: uniq([...gfxDependencies, mioGFX, ideaGFX]),
            },
            dependencies: uniq([
                this.file,
                mioGFX,
                ideaGFX,
                ...gfxDependencies,
                ...mioDependencies,
                ...mergeInLoadResult(mioDepFiles, 'dependencies')
            ]),
        };
    }
    public toString() {
        return `[MioLoader ${this.file}]`;
    }
}
```

## File: src/previewdef/technology/schema.ts
```typescript
import { Node, Token } from "../../hoiformat/hoiparser";
import { HOIPartial, Position, CustomMap, Enum, SchemaDef, positionSchema, convertNodeToJson } from "../../hoiformat/schema";
import { arrayToMap } from "../../util/common";
export interface TechnologyFolder {
    name: string;
    x: number;
    y: number;
}
export interface Technology {
    id: string;
    folders: Record<string, TechnologyFolder>;
    leadsToTechs: string[];
    xor: string[];
    startYear: number;
    enableEquipments: boolean;
    subTechnologies: Technology[];
    token: Token | undefined;
}
export interface TechnologyTree {
    startTechnology: string;
    folder: string;
    technologies: Technology[];
}
type TechnologiesDef = CustomMap<TechnologyDef>;
interface TechnologyDef {
    enable_equipments: Enum;
    path: TechnologyPath[];
    folder: Folder[];
    start_year: number;
    xor: Enum;
    sub_technologies: Enum;
    _token: Token;
}
interface TechnologyPath {
    leads_to_tech: string;
}
interface Folder {
    name: string;
    position: Position;
}
interface TechnologyFile {
    technologies: TechnologiesDef;
}
const technologySchema: SchemaDef<TechnologyDef> = {
    enable_equipments: "enum",
    path: {
        _innerType: {
            leads_to_tech: "string",
        },
        _type: "array",
    },
    folder: {
        _innerType: {
            name: "string",
            position: positionSchema,
        },
        _type: "array",
    },
    start_year: "number",
    xor: "enum",
    sub_technologies: "enum",
};
const technologiesSchema: SchemaDef<TechnologiesDef> = {
    _innerType: technologySchema,
    _type: "map",
};
const technologyFileSchema: SchemaDef<TechnologyFile> = {
    technologies: technologiesSchema,
};
export function getTechnologyTrees(node: Node): TechnologyTree[] {
    const file = convertNodeToJson<TechnologyFile>(node, technologyFileSchema);
    const allTechnologies = getTechnologies(file.technologies._map);
    const result: TechnologyTree[] = [];
    const technologiesByFolder = getTechnologiesByFolder(allTechnologies);
    for (const [folder, techs] of Object.entries(technologiesByFolder)) {
        const trees = getTechnologiesByTree(techs);
        for (const [startTechnology, techs2] of Object.entries(trees)) {
            result.push({
                startTechnology: startTechnology,
                technologies: techs2,
                folder,
            });
        }
    }
    return result;
}
function getTechnologiesByFolder(allTechnologies: Record<string, Technology>): Record<string, Technology[]> {
    const groupedTechnologies: Record<string, Technology[]> = {};
    for (const tech of Object.values(allTechnologies)) {
        for (const folder in tech.folders) {
            if (folder !== undefined && !(folder in groupedTechnologies)) {
                groupedTechnologies[folder] = [];
            }
            groupedTechnologies[folder].push(tech);
        }
    }
    return groupedTechnologies;
}
function getTechnologiesByTree(technologiesInOneFolder: Technology[]): Record<string, Technology[]> {
    const techIdToTech: Record<string, Technology> = arrayToMap(technologiesInOneFolder, 'id');
    const trees: Record<string, Technology[]> = {};
    const treeRootMap: Record<string, string> = {};
    for (const technology of technologiesInOneFolder) {
        const treeRoot = treeRootMap[technology.id] ?? technology.id;
        const tree = trees[treeRoot] ?? [];
        tree.push(technology);
        for (const child of technology.leadsToTechs) {
            // the node is already in another tree
            if (treeRootMap[child] && treeRootMap[child] !== treeRoot) {
                continue;
            }
            if (!techIdToTech[child]) {
                continue;
            }
            treeRootMap[child] = treeRoot;
            tree.push(techIdToTech[child]);
            const childTree = trees[child];
            if (childTree) {
                for (const childTech of childTree) {
                    treeRootMap[childTech.id] = treeRoot;
                    tree.push(childTech);
                }
                delete trees[child];
            }
        }
        trees[treeRoot] = tree;
    }
    for (const rootTechId in trees) {
        trees[rootTechId].push(techIdToTech[rootTechId]);
    }
    return trees;
}
function getTechnologies(technologies: HOIPartial<TechnologiesDef>['_map']): Record<string, Technology> {
    const result: Record<string, Technology> = {};
    for (const { _key, _value } of Object.values(technologies)) {
        const id = _key;
        const technology = _value;
        const token = technology._token;
        const startYear = technology.start_year ?? 0;
        const leadsToTechs = technology.path.map(p => p.leads_to_tech).filter((p): p is string => p !== undefined);
        const xor = technology.xor._values;
        const enableEquipments = technology.enable_equipments._values.length > 0;
        const folders: Record<string, TechnologyFolder> = {};
        for (const folder of technology.folder) {
            const x = folder.position?.x?._value ?? 0;
            const y = folder.position?.y?._value ?? 0;
            const folderName = folder.name;
            if (folderName) {
                folders[folderName] = { name: folderName, x, y };
            }
        }
        result[id] = {
            id, token, startYear, leadsToTechs, xor, enableEquipments, folders,
            subTechnologies: [],
        };
    }
    for (const { _key, _value } of Object.values(technologies)) {
        const id = _key;
        const technology = _value;
        const techObject = result[id];
        for (const subTechnologyName of technology.sub_technologies._values) {
            const subTechnology = result[subTechnologyName];
            if (subTechnology) {
                techObject.subTechnologies.push(subTechnology);
            }
        }
    }
    return result;
}
```

## File: src/previewdef/worldmap/loader/adjacencies.ts
```typescript
import { readFileFromModOrHOI4 } from "../../../util/fileloader";
import { localize } from "../../../util/i18n";
import { Point, ProgressReporter, ProvinceEdgeAdjacency, WorldMapWarning } from "../definitions";
import { FileLoader, LoadResultOD } from "./common";
export class AdjacenciesLoader extends FileLoader<ProvinceEdgeAdjacency[]> {
    protected async loadFromFile(): Promise<LoadResultOD<ProvinceEdgeAdjacency[]>> {
        const warnings: WorldMapWarning[] = [];
        return {
            result: await loadAdjacencies(this.file, e => this.fireOnProgressEvent(e), warnings),
            warnings,
        };
    }
    public toString() {
        return `[AdjacenciesLoader: ${this.file}]`;
    }
}
async function loadAdjacencies(adjacenciesFile: string, progressReporter: ProgressReporter, warnings: WorldMapWarning[]): Promise<ProvinceEdgeAdjacency[]> {
    await progressReporter(localize('worldmap.progress.loadingadjacencies', 'Loading adjecencies...'));
    const [adjecenciesBuffer] = await readFileFromModOrHOI4(adjacenciesFile);
    const adjecencies = adjecenciesBuffer.toString().split(/(?:\r\n|\n|\r)/).map(line => line.split(/[,;]/)).filter((v, i) => i > 0 && v.length >= 9);
    return adjecencies.map(row => convertRowToAdjacencies(row, warnings)).filter((v): v is ProvinceEdgeAdjacency => !!v);
}
function convertRowToAdjacencies(adjacency: string[], warnings: WorldMapWarning[]): ProvinceEdgeAdjacency | undefined {
    const from = parseInt(adjacency[0]);
    const to = parseInt(adjacency[1]);
    const type = adjacency[2];
    const through = parseInt(adjacency[3]);
    const startX = parseInt(adjacency[4]);
    const startY = parseInt(adjacency[5]);
    const stopX = parseInt(adjacency[6]);
    const stopY = parseInt(adjacency[7]);
    const rule = adjacency[8];
    if (from === -1 || to === -1) {
        return undefined;
    }
    const start: Point | undefined = !isNaN(startX) && !isNaN(startY) && startX !== -1 && startY !== -1 ? { x: startX, y: startY } : undefined;
    const stop: Point | undefined = !isNaN(stopX) && !isNaN(stopY) && stopX !== -1 && stopY !== -1 ? { x: stopX, y: stopY } : undefined;
    return {
        from,
        to,
        type,
        through,
        start,
        stop,
        rule,
        row: adjacency,
    };
}
```

## File: src/previewdef/worldmap/loader/continents.ts
```typescript
import { Enum } from "../../../hoiformat/schema";
import { readFileFromModOrHOI4AsJson } from "../../../util/fileloader";
import { localize } from "../../../util/i18n";
import { ProgressReporter } from "../definitions";
import { FileLoader, LoadResultOD } from "./common";
export class ContinentsLoader extends FileLoader<string[]> {
    protected async loadFromFile(): Promise<LoadResultOD<string[]>> {
        return {
            result: await loadContinents(this.file, e => this.fireOnProgressEvent(e)),
            warnings: [],
        };
    }
    public toString() {
        return `[ContinentsLoader: ${this.file}]`;
    }
}
async function loadContinents(continentFile: string, progressReporter: ProgressReporter): Promise<string[]> {
    await progressReporter(localize('worldmap.progress.loadingcontinents', 'Loading continents...'));
    return ['', ...(await readFileFromModOrHOI4AsJson<{ continents: Enum }>(continentFile, { continents: 'enum' })).continents._values];
}
```

## File: src/previewdef/worldmap/loader/countries.ts
```typescript
import { CustomMap, DetailValue, Enum, SchemaDef, HOIPartial } from "../../../hoiformat/schema";
import { Country } from "../definitions";
import { readFileFromModOrHOI4AsJson } from "../../../util/fileloader";
import { error } from "../../../util/debug";
import { FolderLoader, FileLoader, Loader, LoadResult, LoadResultOD, mergeInLoadResult, convertColor } from "./common";
import { localize } from "../../../util/i18n";
import { LoaderSession } from "../../../util/loader/loader";
import { flatMap } from "lodash";
interface CountryTagsFile extends CustomMap<string> {
}
interface CountryFile {
    color: DetailValue<Enum>;
}
interface ColorsFile extends CustomMap<ColorForCountry> {
}
interface ColorForCountry {
    color: DetailValue<Enum>;
}
const countryTagsFileSchema: SchemaDef<CountryTagsFile> = {
    _innerType: "string",
    _type: "map",
};
const countryFileSchema: SchemaDef<CountryFile> = {
    color: {
        _innerType: "enum",
        _type: "detailvalue",
    },
};
const colorsFileSchema: SchemaDef<ColorsFile> = {
    _innerType: {
        color: {
            _innerType: "enum",
            _type: "detailvalue",
        },
    },
    _type: "map",
};
type Tag = { tag: string, file: string };
export class CountriesLoader extends Loader<Country[]> {
    private countryTagsLoader: CountryTagsLoader;
    private countryLoaders: Record<string, CountryLoader> = {};
    private colorsLoader: ColorsLoader;
    constructor() {
        super();
        this.countryTagsLoader = new CountryTagsLoader();
        this.colorsLoader = new ColorsLoader();
        this.countryTagsLoader.onProgress(e => this.onProgressEmitter.fire(e));
        this.colorsLoader.onProgress(e => this.onProgressEmitter.fire(e));
    }
    public async shouldReloadImpl(session: LoaderSession): Promise<boolean> {
        if (await this.countryTagsLoader.shouldReload(session) || await this.colorsLoader.shouldReload(session)) {
            return true;
        }
        return (await Promise.all(Object.values(this.countryLoaders).map(l => l.shouldReload(session)))).some(v => v);
    }
    protected async loadImpl(session: LoaderSession): Promise<LoadResult<Country[]>> {
        this.fireOnProgressEvent(localize('worldmap.progress.loadingcountries', 'Loading countries...'));
        const tagsResult = await this.countryTagsLoader.load(session);
        const countryTags = tagsResult.result;
        const countryResultPromises: Promise<LoadResult<Country | undefined>>[] = [];
        const newCountryLoaders: Record<string, CountryLoader> = {};
        for (const tag of countryTags) {
            let countryLoader = this.countryLoaders[tag.tag];
            if (!countryLoader) {
                countryLoader = new CountryLoader(tag.tag, 'common/' + tag.file);
                countryLoader.disableTelemetry = true;
                countryLoader.onProgress(e => this.onProgressEmitter.fire(e));
            }
            countryResultPromises.push(countryLoader.load(session));
            newCountryLoaders[tag.tag] = countryLoader;
        }
        this.countryLoaders = newCountryLoaders;
        const countriesResult = await Promise.all(countryResultPromises);
        const colorsFileResult = await this.colorsLoader.load(session);
        const countries = countriesResult.map(r => r.result).filter((c): c is Country => c !== undefined);
        applyColorFromColorTxt(countries, colorsFileResult.result);
        const allResults = [tagsResult, colorsFileResult, ...countriesResult];
        return {
            result: countries,
            dependencies: mergeInLoadResult(allResults, 'dependencies'),
            warnings: mergeInLoadResult(allResults, 'warnings'),
        };
    }
    protected extraMesurements(result: LoadResult<Country[]>) {
        return { ...super.extraMesurements(result), fileCount: Object.keys(this.countryLoaders).length };
    }
    public toString() {
        return '[CountriesLoader]';
    }
}
class CountryLoader extends FileLoader<Country | undefined> {
    constructor(private tag: string, file: string) {
        super(file);
    }
    protected async loadFromFile(): Promise<LoadResultOD<Country | undefined>> {
        return { result: await loadCountry(this.tag, this.file), warnings: [] };
    }
    public toString() {
        return `[CountryLoader: ${this.file}]`;
    }
}
class CountryTagsLoader extends FolderLoader<Tag[], Tag[]> {
    constructor() {
        super('common/country_tags', CountryTagLoader);
    }
    protected mergeFiles(fileResults: LoadResult<Tag[]>[]): Promise<LoadResult<Tag[]>> {
        return Promise.resolve<LoadResult<Tag[]>>({
            result: flatMap(fileResults, r => r.result),
            dependencies: [this.folder + '/*'],
            warnings: mergeInLoadResult(fileResults, 'warnings'),
        });
    }
    public toString() {
        return `[CountryTagsLoader]`;
    }
}
class CountryTagLoader extends FileLoader<Tag[]> {
    protected async loadFromFile(): Promise<LoadResultOD<Tag[]>> {
        return { result: await loadCountryTags(this.file), warnings: [] };
    }
    public toString() {
        return `[CountryTagLoader: ${this.file}]`;
    }
}
class ColorsLoader extends FileLoader<HOIPartial<ColorsFile>> {
    constructor() {
        super('common/countries/colors.txt');
    }
    protected async loadFromFile(): Promise<LoadResultOD<HOIPartial<ColorsFile>>> {
        try {
            return {
                result: await readFileFromModOrHOI4AsJson<ColorsFile>(this.file, colorsFileSchema),
                warnings: [],
            };
        } catch(e) {
            error(e);
            return {
                result: { _map: {}, _token: undefined },
                warnings: [],
            };
        }
    }
    public toString() {
        return `[Colors]`;
    }
}
async function loadCountryTags(countryTagsFile: string): Promise<Tag[]> {
    try {
        const data = await readFileFromModOrHOI4AsJson<CountryTagsFile>(countryTagsFile, countryTagsFileSchema);
        const result: { tag: string, file: string }[] = [];
        for (const tag of Object.values(data._map)) {
            if (!tag._value || tag._key === 'dynamic_tags') {
                continue;
            }
            result.push({
                tag: tag._key,
                file: tag._value,
            });
        }
        return result;
    } catch (e) {
        error(e);
        return [];
    }
}
async function loadCountry(tag: string, countryFile: string): Promise<Country | undefined> {
    try {
        const data = await readFileFromModOrHOI4AsJson<CountryFile>(countryFile, countryFileSchema);
        return {
            tag,
            color: convertColor(data.color),
        };
    } catch (e) {
        error(e);
        return undefined;
    }
}
async function applyColorFromColorTxt(countries: Country[], colorsFile: HOIPartial<ColorsFile>): Promise<void> {
    for (const country of countries) {
        const colorIncolors = colorsFile._map[country.tag];
        if (colorIncolors?._value.color) {
            country.color = convertColor(colorIncolors?._value.color);
        }
    }
}
```

## File: src/previewdef/worldmap/loader/provincebmp.ts
```typescript
import { UserError } from "../../../util/common";
import { readFileFromModOrHOI4 } from "../../../util/fileloader";
import { localize } from "../../../util/i18n";
import { BMP, parseBmp } from "../../../util/image/bmp/bmpparser";
import { Point, ProgressReporter, ProvinceBmp, ProvinceEdgeGraph, ProvinceGraph, Region, WorldMapWarning, Zone } from "../definitions";
import { FileLoader, LoadResult, LoadResultOD, mergeRegions, pointEqual } from "./common";
export class ProvinceBmpLoader extends FileLoader<ProvinceBmp> {
    protected async loadFromFile(): Promise<LoadResultOD<ProvinceBmp>> {
        const warnings: WorldMapWarning[] = [];
        return {
            result: await loadProvincesBmp(this.file, e => this.fireOnProgressEvent(e), warnings),
            warnings,
        };
    }
    protected extraMesurements(result: LoadResult<ProvinceBmp>) {
        return {
            ...super.extraMesurements(result),
            width: result.result.width,
            height: result.result.height,
            provinceCount: result.result.provinces.length
        };
    }
    public toString() {
        return `[ProvinceBmpLoader: ${this.file}]`;
    }
}
async function loadProvincesBmp(provincesFile: string, progressReporter: ProgressReporter, warnings: WorldMapWarning[]): Promise<ProvinceBmp> {
    await progressReporter(localize('worldmap.progress.loadingprovincebmp', 'Loading province bmp...',));
    const [provinceMapImageBuffer] = await readFileFromModOrHOI4(provincesFile);
    const provinceMapImage = parseBmp(provinceMapImageBuffer.buffer, provinceMapImageBuffer.byteOffset);
    await progressReporter(localize('worldmap.progress.calculatingregion', 'Calculating province region...'));
    const { colorByPosition, provinces: colorOnlyProvinces, colorToProvince } = getProvincesByPosition(provinceMapImage);
    const width = provinceMapImage.width;
    const height = provinceMapImage.height;
    const provincesWithZone = fillProvinceZones(colorOnlyProvinces, colorToProvince, colorByPosition, width, height, provincesFile, warnings);
    await progressReporter(localize('worldmap.progress.calculatingedge', 'Calculating province edges...'));
    const provinces = fillEdges(provincesWithZone, colorToProvince as Record<number, ColorContainer & ProvinceZoneDef>, colorByPosition, width, height);
    validateProvince(colorByPosition, width, height, provincesFile, warnings);
    return {
        width,
        height,
        colorByPosition,
        colorToProvince: colorToProvince as unknown as Record<number, ProvinceGraph>,
        provinces,
    };
}
type ColorContainer = { color: number, warnings: [] };
function getProvincesByPosition(provinceMapImage: BMP): { colorByPosition: number[], provinces: ColorContainer[], colorToProvince: Record<number, ColorContainer> } {
    if (provinceMapImage.width % 256 !== 0 || provinceMapImage.height % 256 !== 0) {
        throw new UserError(localize('worldmap.error.multiply256', 'Height and width of map image must be multiply of 256: {0}x{1}.',
            provinceMapImage.width, provinceMapImage.height));
    }
    const colorByPosition: number[] = new Array(provinceMapImage.width * provinceMapImage.height);
    const bitmapData = provinceMapImage.data;
    const provinces: ColorContainer[] = [];
    const colorToProvince: Record<number, ColorContainer> = {};
    for (let y = provinceMapImage.height - 1, sy = 0, dy = (provinceMapImage.height - 1) * provinceMapImage.width;
        y >= 0;
        y--, sy += provinceMapImage.bytesPerRow, dy -= provinceMapImage.width) {
        for (let x = 0, sx = sy, dx = dy; x < provinceMapImage.width; x++, sx += 3, dx++) {
            const color = (bitmapData[sx + 2] << 16) | (bitmapData[sx + 1] << 8) | bitmapData[sx];
            const province = colorToProvince[color];
            if (province === undefined) {
                const newProvince: ColorContainer = { color, warnings: [] };
                provinces.push(newProvince);
                colorToProvince[color] = newProvince;
                colorByPosition[dx] = color;
            } else {
                colorByPosition[dx] = province.color;
            }
        }
    }
    return {
        colorByPosition,
        colorToProvince,
        provinces,
    };
}
type ProvinceZoneDef = { coverZones: Zone[] } & Region;
function fillProvinceZones<T extends ColorContainer>(
    provincesWithoutCoverZones: (T & Partial<ProvinceZoneDef>)[],
    colorToProvince: Record<number, T & Partial<ProvinceZoneDef>>,
    colorByPosition: number[],
    width: number,
    height: number,
    file: string,
    warnings: WorldMapWarning[],
): (T & ProvinceZoneDef)[] {
    const blockStack: Zone[] = [];
    const blockSize = 256;
    for (let x = 0; x < width; x += blockSize) {
        for (let y = 0; y < height; y += blockSize) {
            blockStack.push({ x, y, w: blockSize, h: blockSize });
        }
    }
    for (const province of provincesWithoutCoverZones) {
        province.coverZones = [];
    }
    const provinces = provincesWithoutCoverZones as (T & Partial<ProvinceZoneDef> & { coverZones: Zone[] })[];
    while (blockStack.length > 0) {
        const block = blockStack.pop()!;
        const t = block.y;
        const l = block.x;
        const b = block.y + block.h;
        const r = block.x + block.w;
        const color = colorByPosition[t * width + l];
        let sameColor = true;
        for (let y = t, yi = t * width; y < b; y++, yi += width) {
            for (let x = l, xi = yi + l; x < r; x++, xi++) {
                if (colorByPosition[xi] !== color) {
                    sameColor = false;
                    break;
                }
            }
            if (!sameColor) {
                break;
            }
        }
        if (sameColor) {
            colorToProvince[color].coverZones!.push(block);
        } else {
            const blockSize = block.w >> 1;
            blockStack.push({ ...block, w: blockSize, h: blockSize });
            blockStack.push({ ...block, x: block.x + blockSize, w: blockSize, h: blockSize });
            blockStack.push({ ...block, y: block.y + blockSize, w: blockSize, h: blockSize });
            blockStack.push({ x: block.x + blockSize, y: block.y + blockSize, w: blockSize, h: blockSize });
        }
    }
    for (const provinceWithoutRegion of provinces) {
        const province = Object.assign(provinceWithoutRegion, mergeRegions(provinceWithoutRegion.coverZones, width));
        if (province.boundingBox.w > width / 2 || province.boundingBox.h > height / 2) {
            warnings.push({
                source: [{ type: 'province', color: province.color, id: -1 }],
                relatedFiles: [file],
                text: localize('worldmap.warnings.provincetoolarge', 'The province is too large: {0}x{1}.', province.boundingBox.w, province.boundingBox.h),
            });
        }
    }
    return provinces as (T & ProvinceZoneDef)[];
}
type EdgeDef = { edges: ProvinceEdgeGraph[] };
function fillEdges<T extends ColorContainer>(
    provincesWithoutEdges: (T & Partial<EdgeDef>)[],
    colorToProvinceWithoutEdges: Record<number, T & Partial<EdgeDef>>,
    colorByPosition: number[],
    width: number,
    height: number
): (T & EdgeDef)[] {
    const accessedPixels = new Array<boolean>(colorByPosition.length).fill(false);
    for (const province of provincesWithoutEdges) {
        province.edges = [];
    }
    const provinces = provincesWithoutEdges as (T & EdgeDef)[];
    const colorToProvince = colorToProvinceWithoutEdges as Record<number, T & EdgeDef>;
    for (let y = 0, yi = 0; y < height; y++, yi += width) {
        for (let x = 0, xi = yi; x < width; x++, xi++) {
            if (accessedPixels[xi]) {
                continue;
            }
            fillEdgesOfProvince(xi, colorToProvince, colorByPosition, accessedPixels, width, height);
        }
    }
    return provinces as (T & EdgeDef)[];
}
function fillEdgesOfProvince<T extends EdgeDef>(
    index: number,
    colorToProvince: Record<number, T>,
    colorByPosition: number[],
    accessedPixels: boolean[],
    width: number,
    height: number
): void {
    const color = colorByPosition[index];
    const edgePixels = findEdgePixels(index, accessedPixels, color, colorByPosition, width, height);
    const edgePixelsByAdjecentProvince: Record<number, [Point, Point][]> = {};
    edgePixels.forEach(([p, line]) => {
        let lines = edgePixelsByAdjecentProvince[p];
        if (lines === undefined) {
            edgePixelsByAdjecentProvince[p] = lines = [];
        }
        lines.push(line);
    });
    const province = colorToProvince[color]!;
    for (const [key, value] of Object.entries(edgePixelsByAdjecentProvince)) {
        const numKey = parseInt(key);
        const edgeSetIndex = province.edges.findIndex(e => e.toColor === numKey);
        const edgeSet: ProvinceEdgeGraph = edgeSetIndex !== -1 ? province.edges[edgeSetIndex] : { toColor: numKey, path: [] };
        const concatedEdges = concatEdges(value);
        edgeSet.path.push(...concatedEdges);
        if (edgeSetIndex === -1) {
            province.edges.push(edgeSet);
        }
    }
}
const indicesToOffset: [number, number][][] = [
    [[0, 1], [0, 0]],
    [[0, 0], [1, 0]],
    [[1, 0], [1, 1]],
    [[1, 1], [0, 1]],
];
function findEdgePixels(index: number, accessedPixels: boolean[], color: number, colorByPosition: number[], width: number, height: number) {
    const edgePixels: [number, [Point, Point]][] = [];
    const pixelStack: number[] = [ index ];
    const indices: number[] = new Array(4);
    while (pixelStack.length > 0) {
        const pixelIndex = pixelStack.pop()!;
        if (accessedPixels[pixelIndex]) {
            continue;
        }
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);
        indices[0] = x === 0 ? pixelIndex + width - 1 : pixelIndex - 1;
        indices[1] = pixelIndex - width;
        indices[2] = x === width - 1 ? pixelIndex - width + 1 : pixelIndex + 1;
        indices[3] = y === height - 1 ? -1 : pixelIndex + width;
        for (let i = 0; i < 4; i++) {
            const adjecentIndex = indices[i];
            if (adjecentIndex < 0) {
                edgePixels.push([-1, indicesToOffset[i].map(([xOff, yOff]) => ({ x: x + xOff, y: y + yOff })) as [Point, Point]]);
            } else {
                const adjecentColor = colorByPosition[adjecentIndex];
                if (color !== adjecentColor) {
                    edgePixels.push([adjecentColor, indicesToOffset[i].map(([xOff, yOff]) => ({ x: x + xOff, y: y + yOff })) as [Point, Point]]);
                } else {
                    pixelStack.push(adjecentIndex);
                }
            }
        }
        accessedPixels[pixelIndex] = true;
    }
    return edgePixels;
}
function concatEdges(edges: [Point, Point][]): Point[][] {
    const result: Point[][] = [];
    const accessedEdges = new Array<boolean>(edges.length).fill(false);
    for (let i = 0; i < edges.length; i++) {
        if (accessedEdges[i]) {
            continue;
        }
        const edge: Point[] = edges[i];
        accessedEdges[i] = true;
        let foundNew = true;
        while (foundNew) {
            foundNew = false;
            const headTail = edges.findIndex((e, i) => !accessedEdges[i] && pointEqual(edge[0], e[1]));
            if (headTail !== -1) {
                accessedEdges[headTail] = foundNew = true;
                edge.unshift(edges[headTail][0]);
            }
            const tailHead = edges.findIndex((e, i) => !accessedEdges[i] && pointEqual(edge[edge.length - 1], e[0]));
            if (tailHead !== -1) {
                accessedEdges[tailHead] = foundNew = true;
                edge.push(edges[tailHead][1]);
            }
        }
        const newEdge: Point[] = [];
        let lastPoint: Point = edge[0];
        for (const point of edge) {
            if (newEdge.length < 2) {
                newEdge.push(point);
            } else {
                if (point.x === lastPoint.x || point.y === lastPoint.y) {
                    newEdge[newEdge.length - 1] = point;
                } else {
                    lastPoint = newEdge[newEdge.length - 1];
                    newEdge.push(point);
                }
            }
        }
        result.push(newEdge);
    }
    return result;
}
function validateProvince(colorByPosition: number[], width: number, height: number, file: string, warnings: WorldMapWarning[]) {
    const i = new Array(4);
    for (let y = 1, y0 = width, index = width; y < height; y++, y0 += width) {
        for (let x = 0; x < width; x++, index++) {
            i[0] = index;
            i[1] = index + (x === width - 1 ? -width : 0) + 1;
            i[2] = i[0] - width;
            i[3] = i[1] - width;
            i.forEach((v, i0) => {
                i[i0] = colorByPosition[v];
            });
            if (i[0] !== i[1] && i[0] !== i[2] && i[0] !== i[3] && i[1] !== i[2] && i[1] !== i[3] && i[2] !== i[3]) {
                const colors = i.filter((v, i, a) => a.indexOf(v) === i);
                warnings.push({
                    source: colors.map(color => ({ color, id: -1, type: 'province' })),
                    relatedFiles: [file],
                    text: localize('worldmap.warnings.xcrossing', 'Map invalid X crossing at: ({0}, {1}).', x, y - 1),
                });
            }
        }
    }
}
```

## File: src/previewdef/worldmap/loader/provincedefinitions.ts
```typescript
import { readFileFromModOrHOI4 } from "../../../util/fileloader";
import { localize } from "../../../util/i18n";
import { ProgressReporter, ProvinceDefinition, WorldMapWarning } from "../definitions";
import { FileLoader, LoadResultOD } from "./common";
export class DefinitionsLoader extends FileLoader<ProvinceDefinition[]> {
    protected async loadFromFile(): Promise<LoadResultOD<ProvinceDefinition[]>> {
        const warnings: WorldMapWarning[] = [];
        return {
            result: await loadDefinitions(this.file, e => this.fireOnProgressEvent(e), warnings),
            warnings,
        };
    }
    public toString() {
        return `[DefinitionsLoader: ${this.file}]`;
    }
}
async function loadDefinitions(definitionsFile: string, progressReporter: ProgressReporter, warnings: WorldMapWarning[]): Promise<ProvinceDefinition[]> {
    await progressReporter(localize('worldmap.progress.loadingprovincedef', 'Loading province definitions...'));
    const [definitionsBuffer] = await readFileFromModOrHOI4(definitionsFile);
    const definition = definitionsBuffer.toString().split(/(?:\r\n|\n|\r)/).map(line => line.split(/[,;]/)).filter(v => v.length >= 8);
    return definition.map(row => convertRowToProvince(row, warnings));
}
function convertRowToProvince(row: string[], warnings: WorldMapWarning[]): ProvinceDefinition {
    const r = parseInt(row[1]);
    const g = parseInt(row[2]);
    const b = parseInt(row[3]);
    const type = row[4];
    const continent = parseInt(row[7]);
    return {
        id: parseInt(row[0]),
        color: (r << 16) | (g << 8) | b,
        type,
        coastal: row[5].trim().toLowerCase() === 'true',
        terrain: row[6],
        continent,
    };
}
```

## File: src/previewdef/worldmap/loader/resource.ts
```typescript
import { CustomMap, SchemaDef } from "../../../hoiformat/schema";
import { FileLoader, LoadResultOD, FolderLoader, mergeInLoadResult } from "./common";
import { MapLoaderExtra, Resource } from "../definitions";
import { readFileFromModOrHOI4AsJson } from "../../../util/fileloader";
import { LoadResult, LoaderSession } from '../../../util/loader/loader';
import { localize } from '../../../util/i18n';
import { getSpriteByGfxName } from "../../../util/image/imagecache";
interface ResourceFile {
    resources: CustomMap<ResourceDef>
}
interface ResourceDef {
    icon_frame: number;
}
const resourceFileSchema: SchemaDef<ResourceFile> = {
    resources: {
        _innerType: {
            icon_frame: "number",
        },
        _type: "map",
    },
};
const resourceGfxFile = 'interface/general_stuff.gfx';
export class ResourceDefinitionLoader extends FolderLoader<Resource[], Resource[]> {
    constructor() {
        super('common/resources', ResourceFileLoader);
    }
    protected mergeFiles(fileResults: LoadResult<Resource[], MapLoaderExtra>[], session: LoaderSession): Promise<LoadResult<Resource[], MapLoaderExtra>> {
        const results =  mergeInLoadResult(fileResults, 'result');
        const resourceMap: Record<string, Resource> = {};
        const warnings = mergeInLoadResult(fileResults, 'warnings');
        for (const resource of results) {
            if (resource.name in resourceMap) {
                warnings.push({
                    source: [],
                    text: localize('worldmap.warnings.resourcedefinedtwice', 'Resource {0} is defined in two files: {1}, {2}.',
                        resource.name, resource.file, resourceMap[resource.name].file),
                    relatedFiles: [resource.file, resourceMap[resource.name].file],
                });
            } else {
                resourceMap[resource.name] = resource;
            }
        }
        return Promise.resolve({
            result: Object.values(resourceMap),
            warnings,
            dependencies: [this.folder + '/*'],
        });
    }
    public toString() {
        return `[ResourceDefinitionLoader]`;
    }
}
export class ResourceFileLoader extends FileLoader<Resource[]> {
    protected async loadFromFile(): Promise<LoadResultOD<Resource[]>> {
        return {
            result: await loadResources(this.file),
            warnings: [],
            dependencies: [resourceGfxFile],
        };
    }
    public toString() {
        return `[ResourceFileLoader ${this.file}]`;
    }
}
async function loadResources(file: string): Promise<Resource[]> {
    const data = await readFileFromModOrHOI4AsJson<ResourceFile>(file, resourceFileSchema);
    const image = await getSpriteByGfxName('GFX_resources_strip', resourceGfxFile);
    return Object.values(data.resources._map).map<Resource>(v => {
        const name = v._key;
        const iconFrame = v._value.icon_frame ?? 0;
        const imageUri = image?.frames[iconFrame - 1]?.uri ?? image?.frames[0]?.uri ?? '';
        return { name, iconFrame, imageUri, file };
    });
}
```

## File: src/previewdef/worldmap/loader/states.ts
```typescript
import { State, Province, WorldMapWarning, WorldMapWarningSource, Region, StateCategory, Resource } from "../definitions";
import { Enum, SchemaDef, CustomMap, DetailValue } from "../../../hoiformat/schema";
import { readFileFromModOrHOI4AsJson } from "../../../util/fileloader";
import { error } from "../../../util/debug";
import { LoadResult, FolderLoader, FileLoader, mergeInLoadResult, sortItems, mergeRegion, convertColor, LoadResultOD } from "./common";
import { Token } from "../../../hoiformat/hoiparser";
import { arrayToMap, UserError } from "../../../util/common";
import { DefaultMapLoader } from "./provincemap";
import { localize } from "../../../util/i18n";
import { LoaderSession } from "../../../util/loader/loader";
import { flatMap } from "lodash";
import { ResourceDefinitionLoader } from "./resource";
interface StateFile {
    state: StateDefinition[];
}
interface StateDefinition {
    id: number;
    name: string;
    manpower: number;
    state_category: string;
    history: StateHistory;
    provinces: Enum;
    impassable: boolean;
    resources: CustomMap<number>;
    _token: Token;
}
interface StateHistory {
    owner: string;
    victory_points: Enum[];
    add_core_of: string[];
}
const stateFileSchema: SchemaDef<StateFile> = {
    state: {
        _innerType: {
            id: "number",
            name: "string",
            manpower: "number",
            state_category: "string",
            history: {
                owner: "string",
                victory_points: {
                    _innerType: "enum",
                    _type: "array",
                },
                add_core_of: {
                    _innerType: "string",
                    _type: "array",
                },
            },
            provinces: "enum",
            impassable: "boolean",
            resources: {
                _innerType: "number",
                _type: "map",
            },
        },
        _type: "array",
    },
};
interface StateCategoryFile {
    state_categories: CustomMap<StateCategoryDefinition>;
}
interface StateCategoryDefinition {
    color: DetailValue<Enum>;
}
const stateCategoryFileSchema: SchemaDef<StateCategoryFile> = {
    state_categories: {
        _innerType: {
            color: {
                _innerType: "enum",
                _type: "detailvalue",
            },
        },
        _type: "map",
    },
};
type StateNoBoundingBox = Omit<State, keyof Region>;
type StateLoaderResult = { states: State[], badStatesCount: number };
export class StatesLoader extends FolderLoader<StateLoaderResult, StateNoBoundingBox[]> {
    private categoriesLoader: StateCategoriesLoader;
    constructor(private defaultMapLoader: DefaultMapLoader, private resourcesLoader: ResourceDefinitionLoader) {
        super('history/states', StateLoader);
        this.categoriesLoader = new StateCategoriesLoader();
        this.categoriesLoader.onProgress(e => this.onProgressEmitter.fire(e));
    }
    public async shouldReloadImpl(session: LoaderSession): Promise<boolean> {
        return await super.shouldReloadImpl(session) || await this.defaultMapLoader.shouldReload(session)
            || await this.categoriesLoader.shouldReload(session) || await this.resourcesLoader.shouldReload(session);
    }
    protected async loadImpl(session: LoaderSession): Promise<LoadResult<StateLoaderResult>> {
        await this.fireOnProgressEvent(localize('worldmap.progress.loadingstates', 'Loading states...'));
        return super.loadImpl(session);
    }
    protected async mergeFiles(fileResults: LoadResult<StateNoBoundingBox[]>[], session: LoaderSession): Promise<LoadResult<StateLoaderResult>> {
        const provinceMap = await this.defaultMapLoader.load(session);
        const stateCategories = await this.categoriesLoader.load(session);
        const resources = arrayToMap((await this.resourcesLoader.load(session)).result, 'name');
        await this.fireOnProgressEvent(localize('worldmap.progress.mapprovincestostates', 'Mapping provinces to states...'));
        const warnings = mergeInLoadResult([stateCategories, ...fileResults], 'warnings');
        const { provinces, width, height } = provinceMap.result;
        const states = flatMap(fileResults, c => c.result);
        const { sortedStates, badStateId } = sortStates(states, warnings);
        const filledStates: State[] = new Array(sortedStates.length);
        for (let i = badStateId + 1; i < sortedStates.length; i++) {
            if (sortedStates[i]) {
                const state = calculateBoundingBox(sortedStates[i], provinces, width, height, warnings);
                filledStates[i] = state;
                if (!(state.category in stateCategories.result)) {
                    warnings.push({
                        source: [{ type: 'state', id: i }],
                        relatedFiles: [ state.file ],
                        text: localize('worldmap.warnings.statecategorynotexist', "State category of state {0} is not defined: {1}.", i, state.category),
                    });
                }
                for (const key in state.resources) {
                    if (state.resources[key] !== undefined && !(key in resources)) {
                        warnings.push({
                            source: [{ type: 'state', id: i }],
                            relatedFiles: [ state.file ],
                            text: localize('worldmap.warnings.resourcenotexist', "Resource {0} used in state {1} is not defined.", key, i),
                        });
                    }
                }
            }
        }
        const badStatesCount = badStateId + 1;
        validateProvinceInState(provinces, filledStates, badStatesCount, warnings);
        return {
            result: {
                states: filledStates,
                badStatesCount,
            },
            dependencies: [this.folder + '/*', ...stateCategories.dependencies],
            warnings,
        };
    }
    public toString() {
        return `[StatesLoader]`;
    }
}
class StateLoader extends FileLoader<StateNoBoundingBox[]> {
    protected async loadFromFile(): Promise<LoadResultOD<StateNoBoundingBox[]>> {
        const warnings: WorldMapWarning[] = [];
        return {
            result: await loadState(this.file, warnings),
            warnings,
        };
    }
    public toString() {
        return `[StateLoader: ${this.file}]`;
    }
}
class StateCategoriesLoader extends FolderLoader<Record<string, StateCategory>, StateCategory[]> {
    constructor() {
        super('common/state_category', StateCategoryLoader);
    }
    protected async loadImpl(session: LoaderSession): Promise<LoadResult<Record<string, StateCategory>>> {
        await this.fireOnProgressEvent(localize('worldmap.progress.loadstatecategories', 'Loading state categories...'));
        return super.loadImpl(session);
    }
    protected async mergeFiles(fileResults: LoadResult<StateCategory[]>[]): Promise<LoadResult<Record<string, StateCategory>>> {
        const warnings = mergeInLoadResult(fileResults, 'warnings');
        const categories: Record<string, StateCategory> = {};
        fileResults.forEach(result => result.result.forEach(category => {
            if (category.name in categories) {
                warnings.push({
                    source: [{ type: 'statecategory', name: category.name }],
                    relatedFiles: [category.file, categories[category.name].file],
                    text: localize('worldmap.warnings.statecategoryconflict', "There're multiple state categories have name \"{0}\".", category.name),
                });
            }
            categories[category.name] = category;
        }));
        return {
            result: categories,
            dependencies: [this.folder + '/*'],
            warnings,
        };
    }
    public toString() {
        return `[StateCategoriesLoader]`;
    }
}
class StateCategoryLoader extends FileLoader<StateCategory[]> {
    protected async loadFromFile(): Promise<LoadResultOD<StateCategory[]>> {
        const warnings: WorldMapWarning[] = [];
        return {
            result: await loadStateCategory(this.file, warnings),
            warnings,
        };
    }
    public toString() {
        return `[StateCategoryLoader: ${this.file}]`;
    }
}
async function loadState(stateFile: string, globalWarnings: WorldMapWarning[]): Promise<StateNoBoundingBox[]> {
    try {
        const data = await readFileFromModOrHOI4AsJson<StateFile>(stateFile, stateFileSchema);
        const result: StateNoBoundingBox[] = [];
        for (const state of data.state) {
            const warnings: string[] = [];
            const id = state.id ? state.id : (warnings.push(localize('worldmap.warnings.statenoid', "A state in {0} doesn't have id field.", stateFile)), -1);
            const name = state.name ? state.name : (warnings.push(localize('worldmap.warnings.statenoname', "The state doesn't have name field.")), '');
            const manpower = state.manpower ?? 0;
            const category = state.state_category ? state.state_category : (warnings.push(localize('worldmap.warnings.statenocategory', "The state doesn't have category field.")), '');
            const owner = state.history?.owner;
            const provinces = state.provinces._values.map(v => parseInt(v));
            const cores = state.history?.add_core_of.map(v => v).filter((v, i, a): v is string => v !== undefined && i === a.indexOf(v)) ?? [];
            const impassable = state.impassable ?? false;
            const victoryPointsArray = state.history?.victory_points.filter(v => v._values.length >= 2).map(v => v._values.slice(0, 2).map(v => parseInt(v)) as [number, number]) ?? [];
            const victoryPoints = arrayToMap(victoryPointsArray, "0", v => v[1]);
            const resources = arrayToMap(
                Object.values(state.resources._map), '_key', v => v._value);
            if (provinces.length === 0) {
                globalWarnings.push({
                    source: [{ type: 'state', id }],
                    relatedFiles: [stateFile],
                    text: localize('worldmap.warnings.statenoprovinces', "State {0} in \"{1}\" doesn't have provinces.", id, stateFile),
                });
            }
            for (const vpPair of victoryPointsArray) {
                if (!provinces.includes(vpPair[0])) {
                    warnings.push(localize('worldmap.warnings.provincenothere', 'Province {0} not included in this state. But victory points defined here.', vpPair[0]));
                }
            }
            globalWarnings.push(...warnings.map<WorldMapWarning>(warning => ({
                source: [{ type: 'state', id }],
                relatedFiles: [stateFile],
                text: warning,
            })));
            result.push({
                id, name, manpower, category, owner, provinces, cores, impassable, victoryPoints, resources,
                file: stateFile,
                token: state._token ?? null,
            });
        }
        return result;
    } catch (e) {
        error(e);
        return [];
    }
}
function sortStates(states: StateNoBoundingBox[], warnings: WorldMapWarning[]): { sortedStates: StateNoBoundingBox[], badStateId: number } {
    const { sorted, badId } = sortItems(
        states,
        10000,
        (maxId) => { throw new UserError(localize('worldmap.warnings.stateidtoolarge', 'Max state id is too large: {0}', maxId)); },
        (newState, existingState, badId) => warnings.push({
                source: [{ type: 'state', id: badId }],
                relatedFiles: [newState.file, existingState.file],
                text: localize('worldmap.warnings.stateidconflict', "There're more than one states using state id {0}.", newState.id),
            }),
        (startId, endId) => warnings.push({
                source: [{ type: 'state', id: startId }],
                relatedFiles: [],
                text: localize('worldmap.warnings.statenotexist', "State with id {0} doesn't exist.", startId === endId ? startId : `${startId}-${endId}`),
            }),
    );
    return {
        sortedStates: sorted,
        badStateId: badId,
    };
}
function calculateBoundingBox(noBoundingBoxState: StateNoBoundingBox, provinces: (Province | undefined | null)[], width: number, height: number, warnings: WorldMapWarning[]): State {
    const state = mergeRegion(
        noBoundingBoxState,
        'provinces',
        provinces,
        width, 
        provinceId => warnings.push({
                source: [{ type: 'state', id: noBoundingBoxState.id }],
                relatedFiles: [noBoundingBoxState.file],
                text: localize('worldmap.warnings.stateprovincenotexist', "Province {0} used in state {1} doesn't exist.", provinceId, noBoundingBoxState.id),
            }),
        () => warnings.push({
                source: [{ type: 'state', id: noBoundingBoxState.id }],
                relatedFiles: [noBoundingBoxState.file],
                text: localize('worldmap.warnings.statenovalidprovinces', "State {0} in doesn't have valid provinces.", noBoundingBoxState.id),
            })
    );
    if (state.boundingBox.w > width / 2 || state.boundingBox.h > height / 2) {
        warnings.push({
            source: [{ type: 'state', id: state.id }],
            relatedFiles: [state.file],
            text: localize('worldmap.warnings.statetoolarge', 'State {0} is too large: {1}x{2}.', state.id, state.boundingBox.w, state.boundingBox.h),
        });
    }
    return state;
}
function validateProvinceInState(provinces: (Province | undefined | null)[], states: (State | undefined | null)[], badStatesCount: number, warnings: WorldMapWarning[]) {
    const provinceToState: Record<number, number> = {};
    for (let i = badStatesCount; i < states.length; i++) {
        const state = states[i];
        if (!state) {
            continue;
        }
        state.provinces.forEach(p => {
            const province = provinces[p];
            if (provinceToState[p] !== undefined) {
                if (!province) {
                    return;
                }
                warnings.push({
                    source: [
                        ...[state.id, provinceToState[p]].map<WorldMapWarningSource>(id => ({ type: 'state', id })),
                        { type: 'province', id: p, color: province.color }
                    ],
                    relatedFiles: [state.file, states[provinceToState[p]]!.file],
                    text: localize('worldmap.warnings.provinceinmultistates', 'Province {0} exists in multiple states: {1}, {2}.', p, provinceToState[p], state.id),
                });
            } else {
                provinceToState[p] = state.id;
            }
            if (province?.type === 'sea') {
                warnings.push({
                    source: [
                        { type: 'state', id: state.id },
                        { type: 'province', id: p, color: province.color },
                    ],
                    relatedFiles: [state.file],
                    text: localize('worldmap.warnings.statehassea', "Sea province {0} shouldn't belong to a state.", p),
                });
            }
        });
    }
}
async function loadStateCategory(file: string, warning: WorldMapWarning[]): Promise<StateCategory[]> {
    try {
        const data = await readFileFromModOrHOI4AsJson<StateCategoryFile>(file, stateCategoryFileSchema);
        const result: StateCategory[] = [];
        for (const categories of Object.values(data.state_categories._map)) {
            const name = categories._key;
            const color = convertColor(categories._value.color);
            result.push({ name, color, file });
        }
        return result;
    } catch (e) {
        error(e);
        return [];
    }
}
```

## File: src/previewdef/worldmap/loader/terrain.ts
```typescript
import { CustomMap, DetailValue, Enum, SchemaDef } from "../../../hoiformat/schema";
import { FileLoader, convertColor, LoadResultOD, FolderLoader, mergeInLoadResult } from "./common";
import { MapLoaderExtra, Terrain } from "../definitions";
import { readFileFromModOrHOI4AsJson } from "../../../util/fileloader";
import { LoadResult, LoaderSession } from '../../../util/loader/loader';
import { localize } from '../../../util/i18n';
interface TerrainFile {
    categories: CustomMap<TerrainCategory>
}
interface TerrainCategory {
    color: DetailValue<Enum>;
    naval_terrain: boolean;
}
const terrainFileSchema: SchemaDef<TerrainFile> = {
    categories: {
        _innerType: {
            color: {
                _innerType: "enum",
                _type: "detailvalue",
            },
            naval_terrain: "boolean",
        },
        _type: "map",
    },
};
export class TerrainDefinitionLoader extends FolderLoader<Terrain[], Terrain[]> {
    constructor() {
        super('common/terrain', TerrainFileLoader);
    }
    protected mergeFiles(fileResults: LoadResult<Terrain[], MapLoaderExtra>[], session: LoaderSession): Promise<LoadResult<Terrain[], MapLoaderExtra>> {
        const results =  mergeInLoadResult(fileResults, 'result');
        const terrainMap: Record<string, Terrain> = {};
        const warnings = mergeInLoadResult(fileResults, 'warnings');
        for (const terrain of results) {
            if (terrain.name in terrainMap) {
                warnings.push({
                    source: [],
                    text: localize('worldmap.warnings.terraindefinedtwice', 'Terrain {0} is defined in two files: {1}, {2}.',
                        terrain.name, terrain.file, terrainMap[terrain.name].file),
                    relatedFiles: [terrain.file, terrainMap[terrain.name].file],
                });
            } else {
                terrainMap[terrain.name] = terrain;
            }
        }
        return Promise.resolve({
            result: Object.values(terrainMap),
            warnings,
            dependencies: [this.folder + '/*'],
        });
    }
    public toString() {
        return `[TerrainDefinitionLoader]`;
    }
}
export class TerrainFileLoader extends FileLoader<Terrain[]> {
    protected async loadFromFile(): Promise<LoadResultOD<Terrain[]>> {
        return {
            result: await loadTerrains(this.file),
            warnings: [],
        };
    }
    public toString() {
        return `[TerrainFileLoader ${this.file}]`;
    }
}
async function loadTerrains(file: string): Promise<Terrain[]> {
    const data = await readFileFromModOrHOI4AsJson<TerrainFile>(file, terrainFileSchema);
    return Object.values(data.categories._map).map<Terrain>(v => {
        const name = v._key;
        const color = convertColor(v._value.color);
        const isNaval = v._value.naval_terrain ?? false;
        return { name, color, isNaval, file };
    });
}
```

## File: src/previewdef/worldmap/worldmapcontainer.ts
```typescript
import * as vscode from 'vscode';
import { Commands, WebviewType } from '../../constants';
import { WorldMap } from './worldmap';
import { contextContainer } from '../../context';
import { localize } from '../../util/i18n';
import { sendEvent } from '../../util/telemetry';
export class WorldMapContainer implements vscode.WebviewPanelSerializer {
    private worldMap: WorldMap | undefined = undefined;
    public register(): vscode.Disposable {
        const disposables: vscode.Disposable[] = [];
        disposables.push(vscode.commands.registerCommand(Commands.PreviewWorld, this.openPreview, this));
        disposables.push(vscode.window.registerWebviewPanelSerializer(WebviewType.PreviewWorldMap, this));
        disposables.push(vscode.workspace.onDidCloseTextDocument(this.onCloseTextDocument, this));
        disposables.push(vscode.workspace.onDidChangeTextDocument(this.onChangeTextDocument, this));
        return vscode.Disposable.from(...disposables);
    }
    public openPreview(): Promise<void> {
        sendEvent('preview.show.worldmap');
        return this.openWorldMapView();
    }
    public deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any): Promise<void> {
        return this.openWorldMapView(webviewPanel);
    }
    private async openWorldMapView(panel?: vscode.WebviewPanel): Promise<void> {
        if (this.worldMap) {
            this.worldMap.panel?.reveal();
            panel?.dispose();
            return;
        }
        panel = panel ?? vscode.window.createWebviewPanel(
            WebviewType.PreviewWorldMap,
            localize('worldmap.preview.title', 'Preview World Map'),
            vscode.ViewColumn.Active,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );
        panel.onDidDispose(() => {
            if (this.worldMap?.panel === panel) {
                this.worldMap?.dispose();
                this.worldMap = undefined;
            }
        });
        if (contextContainer.current) {
            panel.iconPath = {
                light: vscode.Uri.joinPath(contextContainer.current.extensionUri, 'static/preview-right-light.svg'),
                dark: vscode.Uri.joinPath(contextContainer.current.extensionUri, 'static/preview-right-dark.svg'),
            };
        }
        this.worldMap = new WorldMap(panel);
        this.worldMap.initialize();
    }
    private onChangeTextDocument(e: vscode.TextDocumentChangeEvent): void {
        this.worldMap?.onDocumentChange(e.document.uri);
    }
    private onCloseTextDocument(document: vscode.TextDocument): void {
        this.worldMap?.onDocumentChange(document.uri);
    }
}
```

## File: src/util/hoi4gui/gridbox.ts
```typescript
import { GridBoxType } from '../../hoiformat/gui';
import { HOIPartial } from '../../hoiformat/schema';
import { ParentInfo } from './common';
import { renderGridBoxCommon, RenderGridBoxCommonOptions } from './gridboxcommon';
import { renderBackground, RenderNodeCommonOptions } from './nodecommon';
export * from './gridboxcommon';
type TypeMix = RenderGridBoxCommonOptions & RenderNodeCommonOptions;
export interface RenderGridBoxOptions extends TypeMix {
}
export async function renderGridBox(gridBox: HOIPartial<GridBoxType>, parentInfo: ParentInfo, options: RenderGridBoxOptions): Promise<string> {
    return await renderGridBoxCommon(gridBox, parentInfo, options, (bg, p) => renderBackground(bg, p, options));
}
```

## File: src/util/image/bmp/bmpparser.ts
```typescript
import { UserError } from '../../common';
export interface BMP {
    width: number;
    height: number;
    bitsPerPixel: number;
    bytesPerRow: number;
    data: Uint8Array;
}
export function parseBmp(buffer: ArrayBuffer, byteOffset: number): BMP {
    const uint8Buffer = new Uint8Array(buffer, byteOffset);
    if (uint8Buffer[0] !== 0x42 || uint8Buffer[1] !== 0x4D) {
        throw new UserError("Bmp not starts with 'BM'");
    }
    const bmpHeader = new DataView(buffer, 2 + byteOffset, 4 << 2);
    const dataOffset = byteOffset + bmpHeader.getUint32(2 << 2, true);
    const dibHeaderLength = bmpHeader.getUint32(3 << 2, true);
    const dibHeader = new DataView(buffer, 0xE + byteOffset, dibHeaderLength << 2);
    const width = dibHeader.getUint32(1 << 2, true);
    const height = dibHeader.getUint32(2 << 2, true);
    const bitsPerPixel = dibHeader.getUint16(7 << 1, true);
    const bytesPerRow = ((width * bitsPerPixel + 7 >> 3) + 3) & 0xFFFFFFFC;
    return {
        width,
        height,
        bitsPerPixel,
        bytesPerRow,
        data: new Uint8Array(buffer, dataOffset, bytesPerRow * height),
    };
}
```

## File: src/util/image/dds/pixelformat.ts
```typescript
import { DDSPixelFormat, DDSHeaderDXT10, DDPF_FOURCC, FOURCC_DX10, FOURCC_DXT1, FOURCC_DXT2, FOURCC_DXT3, FOURCC_DXT4, FOURCC_DXT5, DDPF_RGB, DDPF_ALPHA_CHANNEL, DDPF_LUMINANCE, DDPF_ALPHA, DDPF_YUV, DxgiFormat } from "./typedef";
import { UserError } from '../../common';
export const PIXEL_VALUE_TYPE_SIGNED = 0x1;
export const PIXEL_VALUE_TYPE_NORM = 0x2;
export const PIXEL_VALUE_TYPE_SRGB = 0x4;
export enum PixelValueType {
    typeless = 0,
    float = 0x10,
    uint = 0x20,
    unorm = 0x22,
    unorm_srgb = 0x26,
    sint = 0x21,
    snorm = 0x23,
    shardedexp = 0x30,
}
export enum CompressFormat {
    bc1 = 1,
    bc2,
    bc3,
    bc4,
    bc5,
    bc6h,
    bc7,
}
export const CHANNEL_FORMAT_ALPHA = 0x1;
export const CHANNEL_FORMAT_TYPE_MASK = 0xFE;
export enum ChannelFormat {
    rgb = 0,
    rgba = 1,
    yuv = 2,
    yuva = 3,
    l = 4,
    la = 5,
    a = 7,
    rg = 8,
    r = 10,
    g = 12,
    d = 14,
    ycbcr = 16,
    ycbcra = 18,
}
export interface PixelFormatBase {
    compressed: boolean;
    valueType: PixelValueType;
}
export interface CompressedPixelFormat extends PixelFormatBase {
    compressed: true;
    compressFormat: CompressFormat;
    alphaPremultiplied: boolean;
}
export interface RawPixelFormat extends PixelFormatBase {
    compressed: false;
    bitsPerPixel: number;
    channelCount: number;
    channelOrderInPixel: number[];
    channelStartInPixel: number[];
    channelLengthInPixel: number[];
    channelFormat: ChannelFormat;
}
export type PixelFormat = CompressedPixelFormat | RawPixelFormat;
export function convertPixelFormat(ddsPixelFormat: DDSPixelFormat, dxt10Header?: DDSHeaderDXT10): PixelFormat {
    if (ddsPixelFormat.dwFlags & DDPF_FOURCC) {
        if (ddsPixelFormat.dwFourCC === FOURCC_DX10) {
            if (!dxt10Header) {
                throw new UserError("dxt10Header should be provided when fourCC is DX10");
            }
            return convertDx10PixelFormat(dxt10Header);
        } else {
            return convertFourCCPixelFormat(ddsPixelFormat.dwFourCC);
        }
    }
    return convertNormalPixelFormat(ddsPixelFormat);
}
export function getImageSizeInBytes(pixelFormat: PixelFormat, width: number, height: number): number {
    if (pixelFormat.compressed) {
        return Math.max(1, (width + 3) >> 2) * Math.max(1, (height + 3) >> 2) * getBlockSize(pixelFormat.compressFormat);
    } else {
        const bytesInARow = (pixelFormat.bitsPerPixel * width + 7) >>> 3;
        return bytesInARow * height;
    }
}
export function getBlockSize(compressFormat: CompressFormat): number {
    return compressFormat === CompressFormat.bc1 || compressFormat === CompressFormat.bc4 ? 8 : 16;
}
export function pixelFormatToString(pixelFormat: PixelFormat): string {
    if (pixelFormat.compressed) {
        return `Compressed BC${pixelFormat.compressFormat} ${PixelValueType[pixelFormat.valueType]}`;
    } else {
        const channelNames = ChannelFormat[pixelFormat.channelFormat].toUpperCase();
        let name = '';
        for (let i = pixelFormat.channelCount - 1; i >= 0; i--) {
            const channelIndex = pixelFormat.channelOrderInPixel[i];
            name += channelNames[channelIndex] + pixelFormat.channelLengthInPixel[channelIndex];
        }
        return `Raw ${pixelFormat.bitsPerPixel}bits ${name} ${PixelValueType[pixelFormat.valueType]}`;
    }
}
function convertFourCCPixelFormat(fourCC: number): PixelFormat {
    let compressFormat: CompressFormat;
    let alphaPremultiplied: boolean = false;
    switch (fourCC) {
        case FOURCC_DXT1:
            compressFormat = CompressFormat.bc1;
            break;
        case FOURCC_DXT2:
        case FOURCC_DXT3:
            compressFormat = CompressFormat.bc2;
            alphaPremultiplied = fourCC === FOURCC_DXT2;
            break;
        case FOURCC_DXT4:
        case FOURCC_DXT5:
            alphaPremultiplied = fourCC === FOURCC_DXT4;
            compressFormat = CompressFormat.bc3;
            break;
        default: throw new UserError("fourCC value not supported: " + fourCC);
    }
    return {
        compressed: true,
        valueType: PixelValueType.uint,
        compressFormat,
        alphaPremultiplied,
    };
}
function convertDx10PixelFormat(dxt10Header: DDSHeaderDXT10): PixelFormat {
    const format = getDxgiFormatMap()[dxt10Header.dxgiFormat];
    if (format) {
        return format;
    }
    throw new UserError(`Not supported DXGI format ${DxgiFormat[dxt10Header.dxgiFormat]} (${dxt10Header.dxgiFormat})`);
}
function convertNormalPixelFormat(ddsPixelFormat: DDSPixelFormat) : PixelFormat {
    const pfflags = ddsPixelFormat.dwFlags;
    let channelFormat: ChannelFormat;
    const channelIdStartLength: [number, number, number][] = [];
    if (pfflags & DDPF_ALPHA_CHANNEL) {
        channelFormat = ChannelFormat.a;
        channelIdStartLength.push(getStartLengthByMask(0, ddsPixelFormat.dwABitMask));
    } else if (pfflags & DDPF_LUMINANCE) {
        channelFormat = ChannelFormat.l;
        channelIdStartLength.push(getStartLengthByMask(0, ddsPixelFormat.dwRBitMask));
        if (pfflags & DDPF_ALPHA) {
            channelIdStartLength.push(getStartLengthByMask(1, ddsPixelFormat.dwABitMask));
            channelFormat = ChannelFormat.la;
        }
    } else if (pfflags & DDPF_YUV) {
        channelFormat = ChannelFormat.yuv;
        channelIdStartLength.push(getStartLengthByMask(0, ddsPixelFormat.dwRBitMask));
        channelIdStartLength.push(getStartLengthByMask(1, ddsPixelFormat.dwGBitMask));
        channelIdStartLength.push(getStartLengthByMask(2, ddsPixelFormat.dwBBitMask));
        if (pfflags & DDPF_ALPHA) {
            channelIdStartLength.push(getStartLengthByMask(3, ddsPixelFormat.dwABitMask));
            channelFormat = ChannelFormat.yuva;
        }
    } else if (pfflags & DDPF_RGB) {
        channelFormat = ChannelFormat.rgb;
        channelIdStartLength.push(getStartLengthByMask(0, ddsPixelFormat.dwRBitMask));
        channelIdStartLength.push(getStartLengthByMask(1, ddsPixelFormat.dwGBitMask));
        channelIdStartLength.push(getStartLengthByMask(2, ddsPixelFormat.dwBBitMask));
        if (pfflags & DDPF_ALPHA) {
            channelIdStartLength.push(getStartLengthByMask(3, ddsPixelFormat.dwABitMask));
            channelFormat = ChannelFormat.rgba;
        }
    } else {
        throw new UserError("Unknown pixel format flags " + pfflags);
    }
    const bitsPerPixel = ddsPixelFormat.dwRGBBitCount;
    return rawPixelFormat(channelFormat, PixelValueType.uint, bitsPerPixel, channelIdStartLength.map(v => v[1]), channelIdStartLength.map(v => v[2]));
}
function getStartLengthByMask(id: number, mask: number): [number, number, number] {
    const start = tail0count(mask);
    if (all1Count((mask >>> start) + 1) > 1) {
        throw new UserError("Not valid mask: " + mask);
    }
    return [ id, start, all1Count(mask) ];
}
function tail0count(v: number): number {
    if (v === 0) {
        return 0;
    }
    let r = 0;
    while ((v & 1) === 0) {
        v >>>= 1;
        r++;
    }
    return r;
}
function all1Count(v: number): number {
    v = ((v & 0xAAAAAAAA) >>> 1) + (v & 0x55555555);
    v = ((v & 0xCCCCCCCC) >>> 2) + (v & 0x33333333);
    v = ((v & 0xF0F0F0F0) >>> 4) + (v & 0x0F0F0F0F);
    v = ((v & 0xFF00FF00) >>> 8) + (v & 0x00FF00FF);
    v = ((v & 0xFFFF0000) >>> 16) + (v & 0x0000FFFF);
    return v;
}
const formatToChannelCount: Record<ChannelFormat, number> = {
    [ChannelFormat.rgb]: 3,
    [ChannelFormat.rgba]: 4,
    [ChannelFormat.yuv]: 3,
    [ChannelFormat.yuva]: 4,
    [ChannelFormat.l]: 1,
    [ChannelFormat.la]: 2,
    [ChannelFormat.a]: 1,
    [ChannelFormat.rg]: 2,
    [ChannelFormat.r]: 1,
    [ChannelFormat.g]: 1,
    [ChannelFormat.d]: 1,
    [ChannelFormat.ycbcr]: 3,
    [ChannelFormat.ycbcra]: 4,
};
function rawPixelFormat(format: ChannelFormat, valueType: PixelValueType, bitsPerPixel: number, channelStartInPixel: number[], channelLengthInPixel: number[]): RawPixelFormat {
    const channelIdStartLength: [number, number, number][] = channelStartInPixel.map((v, i) => [i, v, channelLengthInPixel[i]]);
    channelIdStartLength.sort((a, b) => a[1] - b[1]);
    if (!channelIdStartLength.every((v, i, a) => i === a.length - 1 ? v[1] + v[2] <= bitsPerPixel : v[1] + v[2] === a[i + 1][1])) {
        throw new UserError("Masks not compact: " + channelIdStartLength.map(v => ((1 << v[1]) - 1) << v[0]));
    }
    return {
        compressed: false,
        channelFormat: format,
        channelCount: formatToChannelCount[format],
        bitsPerPixel,
        channelOrderInPixel: channelIdStartLength.map(v => v[0]),
        channelStartInPixel,
        channelLengthInPixel,
        valueType,
    };
}
function compressedPixelFormat(format: CompressFormat, valueType: PixelValueType): CompressedPixelFormat {
    return {
        compressed: true,
        compressFormat: format,
        valueType,
        alphaPremultiplied: false,
    };
}
let dxgiFormatMap: Partial<Record<DxgiFormat, PixelFormat>> | undefined = undefined;
function getDxgiFormatMap(): Partial<Record<DxgiFormat, PixelFormat>> {
    if (dxgiFormatMap) {
        return dxgiFormatMap;
    }
    dxgiFormatMap = {
        [DxgiFormat.DXGI_FORMAT_R32G32B32A32_TYPELESS]: rawPixelFormat(ChannelFormat.rgba, PixelValueType.typeless, 128, [0, 32, 64, 96], [32, 32, 32, 32]),
        [DxgiFormat.DXGI_FORMAT_R32G32B32A32_FLOAT]: rawPixelFormat(ChannelFormat.rgba, PixelValueType.float, 128, [0, 32, 64, 96], [32, 32, 32, 32]),
        [DxgiFormat.DXGI_FORMAT_R32G32B32A32_UINT]: rawPixelFormat(ChannelFormat.rgba, PixelValueType.uint, 128, [0, 32, 64, 96], [32, 32, 32, 32]),
        [DxgiFormat.DXGI_FORMAT_R32G32B32A32_SINT]: rawPixelFormat(ChannelFormat.rgba, PixelValueType.sint, 128, [0, 32, 64, 96], [32, 32, 32, 32]),
        [DxgiFormat.DXGI_FORMAT_R32G32B32_TYPELESS]: rawPixelFormat(ChannelFormat.rgb, PixelValueType.typeless, 96, [0, 32, 64], [32, 32, 32]),
        [DxgiFormat.DXGI_FORMAT_R32G32B32_FLOAT]: rawPixelFormat(ChannelFormat.rgb, PixelValueType.float, 96, [0, 32, 64], [32, 32, 32]),
        [DxgiFormat.DXGI_FORMAT_R32G32B32_UINT]: rawPixelFormat(ChannelFormat.rgb, PixelValueType.uint, 96, [0, 32, 64], [32, 32, 32]),
        [DxgiFormat.DXGI_FORMAT_R32G32B32_SINT]: rawPixelFormat(ChannelFormat.rgb, PixelValueType.sint, 96, [0, 32, 64], [32, 32, 32]),
        [DxgiFormat.DXGI_FORMAT_R16G16B16A16_TYPELESS]: rawPixelFormat(ChannelFormat.rgba, PixelValueType.typeless, 64, [0, 16, 32, 48], [16, 16, 16, 16]),
        [DxgiFormat.DXGI_FORMAT_R16G16B16A16_FLOAT]: rawPixelFormat(ChannelFormat.rgba, PixelValueType.float, 64, [0, 16, 32, 48], [16, 16, 16, 16]),
        [DxgiFormat.DXGI_FORMAT_R16G16B16A16_UNORM]: rawPixelFormat(ChannelFormat.rgba, PixelValueType.unorm, 64, [0, 16, 32, 48], [16, 16, 16, 16]),
        [DxgiFormat.DXGI_FORMAT_R16G16B16A16_UINT]: rawPixelFormat(ChannelFormat.rgba, PixelValueType.uint, 64, [0, 16, 32, 48], [16, 16, 16, 16]),
        [DxgiFormat.DXGI_FORMAT_R16G16B16A16_SNORM]: rawPixelFormat(ChannelFormat.rgba, PixelValueType.snorm, 64, [0, 16, 32, 48], [16, 16, 16, 16]),
        [DxgiFormat.DXGI_FORMAT_R16G16B16A16_SINT]: rawPixelFormat(ChannelFormat.rgba, PixelValueType.sint, 64, [0, 16, 32, 48], [16, 16, 16, 16]),
        [DxgiFormat.DXGI_FORMAT_R32G32_TYPELESS]: rawPixelFormat(ChannelFormat.rg, PixelValueType.typeless, 64, [0, 32], [32, 32]),
        [DxgiFormat.DXGI_FORMAT_R32G32_FLOAT]: rawPixelFormat(ChannelFormat.rg, PixelValueType.float, 64, [0, 32], [32, 32]),
        [DxgiFormat.DXGI_FORMAT_R32G32_UINT]: rawPixelFormat(ChannelFormat.rg, PixelValueType.uint, 64, [0, 32], [32, 32]),
        [DxgiFormat.DXGI_FORMAT_R32G32_SINT]: rawPixelFormat(ChannelFormat.rg, PixelValueType.sint, 64, [0, 32], [32, 32]),
        [DxgiFormat.DXGI_FORMAT_R32G8X24_TYPELESS]: rawPixelFormat(ChannelFormat.rg, PixelValueType.typeless, 64, [0, 32], [32, 8]),
    //    [DxgiFormat.DXGI_FORMAT_D32_FLOAT_S8X24_UINT]: rawPixelFormat(), // not supported because we can't mix two types yet
        [DxgiFormat.DXGI_FORMAT_R32_FLOAT_X8X24_TYPELESS]: rawPixelFormat(ChannelFormat.r, PixelValueType.float, 64, [0], [32]),
    //    [DxgiFormat.DXGI_FORMAT_X32_TYPELESS_G8X24_UINT]: rawPixelFormat(), // not supported because first component doesn't start at 0
        [DxgiFormat.DXGI_FORMAT_R10G10B10A2_TYPELESS]: rawPixelFormat(ChannelFormat.rgba, PixelValueType.typeless, 32, [0, 10, 20, 30], [10, 10, 10, 2]),
        [DxgiFormat.DXGI_FORMAT_R10G10B10A2_UNORM]: rawPixelFormat(ChannelFormat.rgba, PixelValueType.unorm, 32, [0, 10, 20, 30], [10, 10, 10, 2]),
        [DxgiFormat.DXGI_FORMAT_R10G10B10A2_UINT]: rawPixelFormat(ChannelFormat.rgba, PixelValueType.uint, 32, [0, 10, 20, 30], [10, 10, 10, 2]),
    //    [DxgiFormat.DXGI_FORMAT_R11G11B10_FLOAT]: rawPixelFormat(), // not supported because js can't read 10 or 11bits float
        [DxgiFormat.DXGI_FORMAT_R8G8B8A8_TYPELESS]: rawPixelFormat(ChannelFormat.rgba, PixelValueType.typeless, 32, [0, 8, 16, 24], [8, 8, 8, 8]),
        [DxgiFormat.DXGI_FORMAT_R8G8B8A8_UNORM]: rawPixelFormat(ChannelFormat.rgba, PixelValueType.unorm, 32, [0, 8, 16, 24], [8, 8, 8, 8]),
        [DxgiFormat.DXGI_FORMAT_R8G8B8A8_UNORM_SRGB]: rawPixelFormat(ChannelFormat.rgba, PixelValueType.unorm_srgb, 32, [0, 8, 16, 24], [8, 8, 8, 8]),
        [DxgiFormat.DXGI_FORMAT_R8G8B8A8_UINT]: rawPixelFormat(ChannelFormat.rgba, PixelValueType.uint, 32, [0, 8, 16, 24], [8, 8, 8, 8]),
        [DxgiFormat.DXGI_FORMAT_R8G8B8A8_SNORM]: rawPixelFormat(ChannelFormat.rgba, PixelValueType.snorm, 32, [0, 8, 16, 24], [8, 8, 8, 8]),
        [DxgiFormat.DXGI_FORMAT_R8G8B8A8_SINT]: rawPixelFormat(ChannelFormat.rgba, PixelValueType.sint, 32, [0, 8, 16, 24], [8, 8, 8, 8]),
        [DxgiFormat.DXGI_FORMAT_R16G16_TYPELESS]: rawPixelFormat(ChannelFormat.rg, PixelValueType.typeless, 32, [0, 16], [16, 16]),
        [DxgiFormat.DXGI_FORMAT_R16G16_FLOAT]: rawPixelFormat(ChannelFormat.rg, PixelValueType.float, 32, [0, 16], [16, 16]),
        [DxgiFormat.DXGI_FORMAT_R16G16_UNORM]: rawPixelFormat(ChannelFormat.rg, PixelValueType.unorm, 32, [0, 16], [16, 16]),
        [DxgiFormat.DXGI_FORMAT_R16G16_UINT]: rawPixelFormat(ChannelFormat.rg, PixelValueType.uint, 32, [0, 16], [16, 16]),
        [DxgiFormat.DXGI_FORMAT_R16G16_SNORM]: rawPixelFormat(ChannelFormat.rg, PixelValueType.snorm, 32, [0, 16], [16, 16]),
        [DxgiFormat.DXGI_FORMAT_R16G16_SINT]: rawPixelFormat(ChannelFormat.rg, PixelValueType.sint, 32, [0, 16], [16, 16]),
        [DxgiFormat.DXGI_FORMAT_R32_TYPELESS]: rawPixelFormat(ChannelFormat.r, PixelValueType.typeless, 32, [0], [32]),
        [DxgiFormat.DXGI_FORMAT_D32_FLOAT]: rawPixelFormat(ChannelFormat.d, PixelValueType.float, 32, [0], [32]),
        [DxgiFormat.DXGI_FORMAT_R32_FLOAT]: rawPixelFormat(ChannelFormat.r, PixelValueType.float, 32, [0], [32]),
        [DxgiFormat.DXGI_FORMAT_R32_UINT]: rawPixelFormat(ChannelFormat.r, PixelValueType.uint, 32, [0], [32]),
        [DxgiFormat.DXGI_FORMAT_R32_SINT]: rawPixelFormat(ChannelFormat.r, PixelValueType.sint, 32, [0], [32]),
        [DxgiFormat.DXGI_FORMAT_R24G8_TYPELESS]: rawPixelFormat(ChannelFormat.rg, PixelValueType.typeless, 32, [0, 24], [24, 8]),
    //    [DxgiFormat.DXGI_FORMAT_D24_UNORM_S8_UINT]: rawPixelFormat(), // not supported because we can't mix two types yet
        [DxgiFormat.DXGI_FORMAT_R24_UNORM_X8_TYPELESS]: rawPixelFormat(ChannelFormat.r, PixelValueType.unorm, 32, [0], [24]),
    //    [DxgiFormat.DXGI_FORMAT_X24_TYPELESS_G8_UINT]: rawPixelFormat(), // not supported because first component doesn't start at 0
        [DxgiFormat.DXGI_FORMAT_R8G8_TYPELESS]: rawPixelFormat(ChannelFormat.rg, PixelValueType.typeless, 16, [0, 8], [8, 8]),
        [DxgiFormat.DXGI_FORMAT_R8G8_UNORM]: rawPixelFormat(ChannelFormat.rg, PixelValueType.unorm, 16, [0, 8], [8, 8]),
        [DxgiFormat.DXGI_FORMAT_R8G8_UINT]: rawPixelFormat(ChannelFormat.rg, PixelValueType.uint, 16, [0, 8], [8, 8]),
        [DxgiFormat.DXGI_FORMAT_R8G8_SNORM]: rawPixelFormat(ChannelFormat.rg, PixelValueType.snorm, 16, [0, 8], [8, 8]),
        [DxgiFormat.DXGI_FORMAT_R8G8_SINT]: rawPixelFormat(ChannelFormat.rg, PixelValueType.sint, 16, [0, 8], [8, 8]),
        [DxgiFormat.DXGI_FORMAT_R16_TYPELESS]: rawPixelFormat(ChannelFormat.r, PixelValueType.typeless, 16, [0], [16]),
        [DxgiFormat.DXGI_FORMAT_R16_FLOAT]: rawPixelFormat(ChannelFormat.r, PixelValueType.float, 16, [0], [16]),
        [DxgiFormat.DXGI_FORMAT_D16_UNORM]: rawPixelFormat(ChannelFormat.d, PixelValueType.unorm, 16, [0], [16]),
        [DxgiFormat.DXGI_FORMAT_R16_UNORM]: rawPixelFormat(ChannelFormat.r, PixelValueType.unorm, 16, [0], [16]),
        [DxgiFormat.DXGI_FORMAT_R16_UINT]: rawPixelFormat(ChannelFormat.r, PixelValueType.uint, 16, [0], [16]),
        [DxgiFormat.DXGI_FORMAT_R16_SNORM]: rawPixelFormat(ChannelFormat.r, PixelValueType.snorm, 16, [0], [16]),
        [DxgiFormat.DXGI_FORMAT_R16_SINT]: rawPixelFormat(ChannelFormat.r, PixelValueType.sint, 16, [0], [16]),
        [DxgiFormat.DXGI_FORMAT_R8_TYPELESS]: rawPixelFormat(ChannelFormat.r, PixelValueType.typeless, 8, [0], [8]),
        [DxgiFormat.DXGI_FORMAT_R8_UNORM]: rawPixelFormat(ChannelFormat.r, PixelValueType.unorm, 8, [0], [8]),
        [DxgiFormat.DXGI_FORMAT_R8_UINT]: rawPixelFormat(ChannelFormat.r, PixelValueType.uint, 8, [0], [8]),
        [DxgiFormat.DXGI_FORMAT_R8_SNORM]: rawPixelFormat(ChannelFormat.r, PixelValueType.snorm, 8, [0], [8]),
        [DxgiFormat.DXGI_FORMAT_R8_SINT]: rawPixelFormat(ChannelFormat.r, PixelValueType.sint, 8, [0], [8]),
        [DxgiFormat.DXGI_FORMAT_A8_UNORM]: rawPixelFormat(ChannelFormat.a, PixelValueType.unorm, 8, [0], [8]),
        [DxgiFormat.DXGI_FORMAT_R1_UNORM]: rawPixelFormat(ChannelFormat.r, PixelValueType.typeless, 1, [0], [1]),
    //    [DxgiFormat.DXGI_FORMAT_R9G9B9E5_SHAREDEXP]: rawPixelFormat(),  // not supported because we don't have rgbe
    //    [DxgiFormat.DXGI_FORMAT_R8G8_B8G8_UNORM]: rawPixelFormat(),   // not support packed pixels
    //    [DxgiFormat.DXGI_FORMAT_G8R8_G8B8_UNORM]: rawPixelFormat(),   // not support packed pixels
        [DxgiFormat.DXGI_FORMAT_BC1_TYPELESS]: compressedPixelFormat(CompressFormat.bc1, PixelValueType.typeless),
        [DxgiFormat.DXGI_FORMAT_BC1_UNORM]: compressedPixelFormat(CompressFormat.bc1, PixelValueType.unorm),
        [DxgiFormat.DXGI_FORMAT_BC1_UNORM_SRGB]: compressedPixelFormat(CompressFormat.bc1, PixelValueType.unorm_srgb),
        [DxgiFormat.DXGI_FORMAT_BC2_TYPELESS]: compressedPixelFormat(CompressFormat.bc2, PixelValueType.typeless),
        [DxgiFormat.DXGI_FORMAT_BC2_UNORM]: compressedPixelFormat(CompressFormat.bc2, PixelValueType.unorm),
        [DxgiFormat.DXGI_FORMAT_BC2_UNORM_SRGB]: compressedPixelFormat(CompressFormat.bc2, PixelValueType.unorm_srgb),
        [DxgiFormat.DXGI_FORMAT_BC3_TYPELESS]: compressedPixelFormat(CompressFormat.bc3, PixelValueType.typeless),
        [DxgiFormat.DXGI_FORMAT_BC3_UNORM]: compressedPixelFormat(CompressFormat.bc3, PixelValueType.unorm),
        [DxgiFormat.DXGI_FORMAT_BC3_UNORM_SRGB]: compressedPixelFormat(CompressFormat.bc3, PixelValueType.unorm_srgb),
        [DxgiFormat.DXGI_FORMAT_BC4_TYPELESS]: compressedPixelFormat(CompressFormat.bc4, PixelValueType.typeless),
        [DxgiFormat.DXGI_FORMAT_BC4_UNORM]: compressedPixelFormat(CompressFormat.bc4, PixelValueType.unorm),
        [DxgiFormat.DXGI_FORMAT_BC4_SNORM]: compressedPixelFormat(CompressFormat.bc4, PixelValueType.snorm),
        [DxgiFormat.DXGI_FORMAT_BC5_TYPELESS]: compressedPixelFormat(CompressFormat.bc5, PixelValueType.typeless),
        [DxgiFormat.DXGI_FORMAT_BC5_UNORM]: compressedPixelFormat(CompressFormat.bc5, PixelValueType.unorm),
        [DxgiFormat.DXGI_FORMAT_BC5_SNORM]: compressedPixelFormat(CompressFormat.bc5, PixelValueType.snorm),
        [DxgiFormat.DXGI_FORMAT_B5G6R5_UNORM]: rawPixelFormat(ChannelFormat.rgb, PixelValueType.unorm, 16, [11, 5, 0], [5, 6, 5]),
        [DxgiFormat.DXGI_FORMAT_B5G5R5A1_UNORM]: rawPixelFormat(ChannelFormat.rgba, PixelValueType.unorm, 16, [10, 5, 0, 15], [5, 5, 5, 1]),
        [DxgiFormat.DXGI_FORMAT_B8G8R8A8_UNORM]: rawPixelFormat(ChannelFormat.rgba, PixelValueType.unorm, 32, [16, 8, 0, 24], [8, 8, 8, 8]),
        [DxgiFormat.DXGI_FORMAT_B8G8R8X8_UNORM]: rawPixelFormat(ChannelFormat.rgb, PixelValueType.unorm, 32, [16, 8, 0], [8, 8, 8]),
    //    [DxgiFormat.DXGI_FORMAT_R10G10B10_XR_BIAS_A2_UNORM]: rawPixelFormat(), // not supported because we can't mix two types yet
        [DxgiFormat.DXGI_FORMAT_B8G8R8A8_TYPELESS]: rawPixelFormat(ChannelFormat.rgba, PixelValueType.typeless, 32, [16, 8, 0, 24], [8, 8, 8, 8]),
        [DxgiFormat.DXGI_FORMAT_B8G8R8A8_UNORM_SRGB]: rawPixelFormat(ChannelFormat.rgba, PixelValueType.unorm, 32, [16, 8, 0, 24], [8, 8, 8, 8]),
        [DxgiFormat.DXGI_FORMAT_B8G8R8X8_TYPELESS]: rawPixelFormat(ChannelFormat.rgb, PixelValueType.typeless, 32, [16, 8, 0], [8, 8, 8]),
        [DxgiFormat.DXGI_FORMAT_B8G8R8X8_UNORM_SRGB]: rawPixelFormat(ChannelFormat.rgb, PixelValueType.unorm, 32, [16, 8, 0], [8, 8, 8]),
        [DxgiFormat.DXGI_FORMAT_BC6H_TYPELESS]: compressedPixelFormat(CompressFormat.bc6h, PixelValueType.typeless),
    //    [DxgiFormat.DXGI_FORMAT_BC6H_UF16]: compressedPixelFormat(),
    //    [DxgiFormat.DXGI_FORMAT_BC6H_SF16]: compressedPixelFormat(), 
        [DxgiFormat.DXGI_FORMAT_BC7_TYPELESS]: compressedPixelFormat(CompressFormat.bc7, PixelValueType.typeless),
        [DxgiFormat.DXGI_FORMAT_BC7_UNORM]: compressedPixelFormat(CompressFormat.bc6h, PixelValueType.unorm),
        [DxgiFormat.DXGI_FORMAT_BC7_UNORM_SRGB]: compressedPixelFormat(CompressFormat.bc6h, PixelValueType.unorm_srgb),
        [DxgiFormat.DXGI_FORMAT_AYUV]: rawPixelFormat(ChannelFormat.yuva, PixelValueType.typeless, 32, [16, 8, 0, 24], [8, 8, 8, 8]),
    //    [DxgiFormat.DXGI_FORMAT_Y410]: rawPixelFormat(),
    //    [DxgiFormat.DXGI_FORMAT_Y416]: rawPixelFormat(),
    //    [DxgiFormat.DXGI_FORMAT_NV12]: rawPixelFormat(),
    //    [DxgiFormat.DXGI_FORMAT_P010]: rawPixelFormat(),
    //    [DxgiFormat.DXGI_FORMAT_P016]: rawPixelFormat(),
    //    [DxgiFormat.DXGI_FORMAT_420_OPAQUE]: rawPixelFormat(),
    //    [DxgiFormat.DXGI_FORMAT_YUY2]: rawPixelFormat(),
    //    [DxgiFormat.DXGI_FORMAT_Y210]: rawPixelFormat(),
    //    [DxgiFormat.DXGI_FORMAT_Y216]: rawPixelFormat(),
    //    [DxgiFormat.DXGI_FORMAT_NV11]: rawPixelFormat(),
    //    [DxgiFormat.DXGI_FORMAT_AI44]: rawPixelFormat(),
    //    [DxgiFormat.DXGI_FORMAT_IA44]: rawPixelFormat(),
    //    [DxgiFormat.DXGI_FORMAT_P8]: rawPixelFormat(),
    //    [DxgiFormat.DXGI_FORMAT_A8P8]: rawPixelFormat(),
        [DxgiFormat.DXGI_FORMAT_B4G4R4A4_UNORM]: rawPixelFormat(ChannelFormat.rgba, PixelValueType.typeless, 16, [8, 4, 0, 12], [4, 4, 4, 4]),
    //    [DxgiFormat.DXGI_FORMAT_P208]: rawPixelFormat(),
    //    [DxgiFormat.DXGI_FORMAT_V208]: rawPixelFormat(),
    //    [DxgiFormat.DXGI_FORMAT_V408]: rawPixelFormat(),
    };
    return dxgiFormatMap;
}
```

## File: src/util/image/dds/surface.ts
```typescript
import { PixelFormat, RawPixelFormat, CompressedPixelFormat, getBlockSize, CompressFormat, PixelValueType, ChannelFormat, pixelFormatToString } from "./pixelformat";
import { UserError } from '../../common';
export class Surface {
    constructor(
        private readonly buffer: ArrayBuffer,
        private readonly offset: number,
        private readonly length: number,
        readonly name: string,
        readonly width: number,
        readonly height: number,
        readonly pixelFormat: PixelFormat,
    ) {
    }
    public getFullRgba(): Uint8Array {
        if (!this.pixelFormat.compressed) {
            return this.getFullRgbaFromRawPixels(this.pixelFormat);
        } else {
            return this.getFullRgbaFromCompressedPixels(this.pixelFormat);
        }
    }
    private getFullRgbaFromRawPixels(pixelFormat: RawPixelFormat): Uint8Array {
        const valueType = pixelFormat.valueType;
        if (valueType === PixelValueType.typeless) {
            throw new UserError("Can't get rgba from typeless pixel value");
        }
        if (valueType === PixelValueType.shardedexp) {
            throw new UserError("Pixel value type shardedexp are not supported to get rgba");
        }
        if (pixelFormat.channelLengthInPixel.some(l => l > 32)) {
            throw new UserError("Some channel length larger than 32");
        }
        if (valueType === PixelValueType.float) {
            if (pixelFormat.channelLengthInPixel.some(l => l !== 32) || pixelFormat.bitsPerPixel % 32 !== 0) {
                throw new UserError("Pixel value type float supports only 32 bits channel and bitsPerPixel should be multiply of 32");
            }
        }
        const channelFormat = pixelFormat.channelFormat;
        const resultPutter = resultPutters[channelFormat];
        if (resultPutter === undefined) {
            throw new UserError(`Channel format ${channelFormat} is not supported to get rgba`);
        }
        const normalizer = pixelNormalizers[valueType];
        if (normalizer === undefined) {
            throw new UserError(`Value type ${valueType} is not supported to get rgba`);
        }
        const length = this.length;
        const channelReader = getChannelReader(this.buffer, this.offset, length, pixelFormat);
        if (channelReader === undefined) {
            throw new UserError(`Unsupported pixel format to read: ${pixelFormatToString(pixelFormat)}`);
        }
        const readerState = channelReader.readerState;
        const reader = channelReader.reader;
        const channelCount = pixelFormat.channelCount;
        const result: Uint8Array = new Uint8Array(this.width * this.height * 4);
        const pixel: Float64Array = new Float64Array(channelCount);
        const rawPixel: Float64Array = new Float64Array(channelCount);
        const channelOrder = pixelFormat.channelOrderInPixel;
        const channelLength = pixelFormat.channelLengthInPixel;
        const channelLengthByOrder = channelOrder.map(channel => channelLength[channel]);
        const channelStartByOrder = channelOrder.map(channel => pixelFormat.channelStartInPixel[channel]);
        const channelValueRange = channelLength.map(l => l === 32 ? 4294967295 : ((1 << l) - 1) & 0xFFFFFFFF);
        // It makes sense only when bitPerPixel <= 32.
        const channelMaskByOrder = channelOrder.map(channel => ((1 << channelLength[channel]) - 1) << pixelFormat.channelStartInPixel[channel]);
        const bitsPerPixel = pixelFormat.bitsPerPixel;
        const bitsPerRow = bitsPerPixel * this.width;
        const pitch = (bitsPerRow + 7) >>> 3;
        let resultOffset = 0;
        for (let i = 0; i < length; i += pitch) {
            for (let pb = 0; pb < bitsPerRow; pb += bitsPerPixel, resultOffset += 4) {
                reader(readerState, i + (pb >> 3), pb & 3, channelStartByOrder, channelLengthByOrder, channelMaskByOrder, rawPixel);
                for (let j = 0; j < channelCount; j++) {
                    const channel = channelOrder[j];
                    const channelValue = rawPixel[j];
                    pixel[channel] = normalizer(channelValue, channelValueRange[channel]);
                }
                resultPutter(result, resultOffset, pixel);
            }
        }
        return result;
    }
    private getFullRgbaFromCompressedPixels(pixelFormat: CompressedPixelFormat): Uint8Array {
        const result = new Uint8Array(this.width * this.height * 4);
        const block = new Uint8Array(4 * 4 * 4);
        const length = this.length;
        const buffer = new Uint8Array(this.buffer, this.offset, length);
        const blockSize = getBlockSize(pixelFormat.compressFormat);
        const width = this.width;
        const height = this.height;
        const blocksPerLine = (width + 3) >> 2;
        for (let i = 0, k = 0; i < length; i += blockSize, k++) {
            switch (pixelFormat.compressFormat) {
                case CompressFormat.bc1:
                    decompressDXT1(buffer, i, block);
                    break;
                case CompressFormat.bc2:
                    decompressDXT3(buffer, i, block);
                    break;
                case CompressFormat.bc3:
                    decompressDXT5(buffer, i, block);
                    break;
                default:
                    throw new UserError("Compress format not implemented yet: bc" + pixelFormat.compressFormat);
            }
            const xBlock = k % blocksPerLine;
            const yBlock = Math.floor(k / blocksPerLine);
            for (let y = yBlock * 4, yi = 0; y < height && yi < 4; y++, yi++) {
                for (let x = xBlock * 4, xi = 0; x < width && xi < 4; x++, xi++) {
                    const index = (y * width + x) << 2;
                    const indexInBlock = (yi * 4 + xi) << 2;
                    for (let j = 0; j < 4; j++) {
                        result[index + j] = block[indexInBlock + j];
                        if (pixelFormat.alphaPremultiplied && j !== 3 && block[indexInBlock + 3] !== 0) {
                            result[index + j] /= (block[indexInBlock + 3] / 255);
                        }
                    }
                }
            }
        }
        return result;
    }
};
const colors: Uint8Array[] = new Array(8).fill([]).map(v => new Uint8Array(4));
function r5g6b5ToRgb(value: number, result: Uint8Array): void {
    result[0] = Math.floor(((value & 0xF800) >> 11) * 255 / 0x1F);
    result[1] = Math.floor(((value & 0x07E0) >> 5) * 255 / 0x3F);
    result[2] = Math.floor(((value & 0x001F)) * 255 / 0x1F);
    result[3] = 255;
}
function powerAverage(v1: Uint8Array, p1: number, v2: Uint8Array, p2: number, result: Uint8Array): void {
    for (let i = 0; i < v1.length; i++) {
        result[i] = Math.floor(v1[i] * p1 + v2[i] * p2);
    }
}
function decompressDXT1(buffer: Uint8Array, offset: number, block: Uint8Array, ignoreAlpha: boolean = false): void {
    const color0 = buffer[offset] | (buffer[offset + 1] << 8);
    const color1 = buffer[offset + 2] | (buffer[offset + 3] << 8);
    r5g6b5ToRgb(color0, colors[0]);
    r5g6b5ToRgb(color1, colors[1]);
    if (color0 > color1 || ignoreAlpha) {
        powerAverage(colors[0], 2 / 3, colors[1], 1 / 3, colors[2]);
        powerAverage(colors[0], 1 / 3, colors[1], 2 / 3, colors[3]);
    } else {
        powerAverage(colors[0], 1 / 2, colors[1], 1 / 2, colors[2]);
        colors[3].fill(0);
    }
    for (let i = 4, k = 0; i < 8; i++, k += 16) {
        let v = buffer[offset + i];
        for (let j = 0; j < 4; j++) {
            const color = colors[v & 0x3];
            v >>= 2;
            for (let l = 0; l < 4; l++) {
                block[k + j * 4 + l] = color[l];
            }
        }
    }
}
function decompressDXT3(buffer: Uint8Array, offset: number, block: Uint8Array): void {
    decompressDXT1(buffer, offset + 8, block, true);
    for (let i = 0, k = 0; i < 8; i++, k += 8) {
        let v = buffer[offset + i];
        for (let j = 0; j < 2; j++) {
            const alpha = (v & 0xF) * 255 / 0xF;
            v >>= 4;
            block[k + j * 4 + 3] = alpha;
        }
    }
}
const alphas = new Uint8Array(8);
function decompressDXT5(buffer: Uint8Array, offset: number, block: Uint8Array): void {
    decompressDXT1(buffer, offset + 8, block, true);
    alphas[0] = buffer[offset];
    alphas[1] = buffer[offset + 1];
    if (alphas[0] > alphas[1]) {
        alphas[2] = Math.floor((6 * alphas[0] + 1 * alphas[1]) / 7);
        alphas[3] = Math.floor((5 * alphas[0] + 2 * alphas[1]) / 7);
        alphas[4] = Math.floor((4 * alphas[0] + 3 * alphas[1]) / 7);
        alphas[5] = Math.floor((3 * alphas[0] + 4 * alphas[1]) / 7);
        alphas[6] = Math.floor((2 * alphas[0] + 5 * alphas[1]) / 7);
        alphas[7] = Math.floor((1 * alphas[0] + 6 * alphas[1]) / 7);
    } else {
        alphas[2] = Math.floor((4 * alphas[0] + 1 * alphas[1]) / 7);
        alphas[3] = Math.floor((3 * alphas[0] + 2 * alphas[1]) / 7);
        alphas[4] = Math.floor((2 * alphas[0] + 3 * alphas[1]) / 7);
        alphas[5] = Math.floor((1 * alphas[0] + 4 * alphas[1]) / 7);
        alphas[6] = 0;
        alphas[7] = 255;
    }
    let v = 0;
    let bits = 0;
    let j = 0;
    for (let i = 2; i < 8; i++) {
        v |= (buffer[offset + i] << bits);
        bits += 8;
        while (bits >= 3) {
            const alpha = alphas[v & 0x7];
            bits -= 3;
            v >>= 3;
            block[j + 3] = alpha;
            j += 4;
        }
    }
}
function readUnsignedBitsFromBuffer(buffer: Uint8Array, offset: number, bitOffset: number, bitsLength: number): number {
    let filled = 0;
    let rest = bitsLength;
    let result = 0;
    if (rest >= 8) {
        result |= buffer[offset] >> bitOffset;
        filled += (8 - bitOffset);
        rest -= (8 - bitOffset);
        bitOffset = 0;
        offset++;
    }
    while (rest >= 8) {
        result |= buffer[offset] << filled;
        filled += 8;
        rest -= 8;
        offset++;
    }
    if (rest > 0) {
        result |= ((buffer[offset] >> bitOffset) & ((1 << rest) - 1)) << filled;
        filled += (8 - bitOffset);
        rest -= (8 - bitOffset);
        offset++;
    }
    if (rest > 0) {
        result |= (buffer[offset] & ((1 << rest) - 1)) << filled;
    }
    if (bitsLength === 32 && result < 0) {
        result += 4294967296; // In js this make number a float64
    }
    return result;
}
type ResultPutter = (result: Uint8Array, offset: number, pixel: Float64Array) => void;
const resultPutters: Partial<Record<ChannelFormat, ResultPutter>> = {
    [ChannelFormat.rgb]: rgbResultPutter,
    [ChannelFormat.rgba]: rgbaResultPutter,
    [ChannelFormat.l]: luminanceResultPutter,
    [ChannelFormat.la]: luminanceAlphaResultPutter,
    [ChannelFormat.a]: alphaResultPutter,
    [ChannelFormat.d]: luminanceResultPutter,
    [ChannelFormat.r]: rResultPutter,
    [ChannelFormat.g]: gResultPutter,
    [ChannelFormat.rg]: rgResultPutter,
};
function rResultPutter(result: Uint8Array, offset: number, pixel: Float64Array): void {
    result[offset] = pixel[0] * 255;
    result[offset + 1] = 0;
    result[offset + 2] = 0;
    result[offset + 3] = 255;
}
function gResultPutter(result: Uint8Array, offset: number, pixel: Float64Array): void {
    result[offset] = 0;
    result[offset + 1] = pixel[0] * 255;
    result[offset + 2] = 0;
    result[offset + 3] = 255;
}
function rgResultPutter(result: Uint8Array, offset: number, pixel: Float64Array): void {
    result[offset] = pixel[0] * 255;
    result[offset + 1] = pixel[1] * 255;
    result[offset + 2] = 0;
    result[offset + 3] = 255;
}
function rgbResultPutter(result: Uint8Array, offset: number, pixel: Float64Array): void {
    result[offset] = pixel[0] * 255;
    result[offset + 1] = pixel[1] * 255;
    result[offset + 2] = pixel[2] * 255;
    result[offset + 3] = 255;
}
function rgbaResultPutter(result: Uint8Array, offset: number, pixel: Float64Array): void {
    result[offset] = pixel[0] * 255;
    result[offset + 1] = pixel[1] * 255;
    result[offset + 2] = pixel[2] * 255;
    result[offset + 3] = pixel[3] * 255;
}
function alphaResultPutter(result: Uint8Array, offset: number, pixel: Float64Array): void {
    result[offset] = result[offset + 1] = result[offset + 2] = 255;
    result[offset + 3] = pixel[0] * 255;
}
function luminanceResultPutter(result: Uint8Array, offset: number, pixel: Float64Array): void {
    result[offset] = result[offset + 1] = result[offset + 2] = pixel[0];
    result[offset + 3] = 255;
}
function luminanceAlphaResultPutter(result: Uint8Array, offset: number, pixel: Float64Array): void {
    result[offset] = result[offset + 1] = result[offset + 2] = pixel[0];
    result[offset + 3] = pixel[1];
}
type PixelNormalizer = (value: number, max: number) => number;
const pixelNormalizers: Partial<Record<PixelValueType, PixelNormalizer>> = {
    [PixelValueType.uint]: uintNormalizer,
    [PixelValueType.unorm]: uintNormalizer,
    [PixelValueType.unorm_srgb]: unormSrgbNormalizer,
    [PixelValueType.sint]: sintNormalizer,
    [PixelValueType.snorm]: sintNormalizer,
    [PixelValueType.float]: floatNormalizer,
};
function uintNormalizer(value: number, max: number): number {
    return value / max;
}
function sintNormalizer(value: number, max: number): number {
    const midValue = (max - 1) / 2;
    return value === midValue + 1 ? -1 :
        (value <= midValue ? value / midValue : -(max - value + 1) / midValue);
}
function floatNormalizer(value: number, max: number): number {
    return value;
}
function unormSrgbNormalizer(value: number, max: number): number {
    return Math.pow(value / max, 2.2);
}
// Don't use js clossure for better performance
interface ChannelReader {
    reader: (buffer: any, offset: number, bitOffset: number, channelStart: number[], channelLength: number[], channelMask: number[], rawPixel: Float64Array) => void;
    readerState: unknown;
}
function getChannelReader(inputBuffer: ArrayBuffer, inputBufferOffset: number, length: number, pixelFormat: RawPixelFormat): ChannelReader | undefined {
    if (pixelFormat.valueType === PixelValueType.float) {
        if (pixelFormat.channelLengthInPixel.every(p => p === 32) && pixelFormat.bitsPerPixel % 8 === 0) {
            return {
                reader: all32Reader,
                readerState: new Float32Array(inputBuffer, inputBufferOffset, length >> 2),
            };
        }
        return undefined;
    }
    if (pixelFormat.bitsPerPixel % 32 === 0) {
        if (pixelFormat.channelLengthInPixel.every(p => p === 32)) {
            return {
                reader: all32Reader,
                readerState: new Uint32Array(inputBuffer, inputBufferOffset, length >> 2),
            };
        }
    }
    if (pixelFormat.bitsPerPixel % 16 === 0) {
        if (pixelFormat.channelLengthInPixel.every(p => p === 16)) {
            return {
                reader: all16Reader,
                readerState: new Uint16Array(inputBuffer, inputBufferOffset, length >> 1),
            };
        }
    }
    if (pixelFormat.bitsPerPixel % 8 === 0) {
        if (pixelFormat.channelLengthInPixel.every(p => p === 8)) {
            return {
                reader: all8Reader,
                readerState: new Uint8Array(inputBuffer, inputBufferOffset, length),
            };
        }
    }
    if (pixelFormat.bitsPerPixel === 32) {
        return {
            reader: masked32Reader,
            readerState: new Uint32Array(inputBuffer, inputBufferOffset, length >> 2),
        };
    }
    if (pixelFormat.bitsPerPixel === 16) {
        return {
            reader: masked16Reader,
            readerState: new Uint16Array(inputBuffer, inputBufferOffset, length >> 1),
        };
    }
    if (pixelFormat.bitsPerPixel === 8) {
        return {
            reader: masked8Reader,
            readerState: new Uint8Array(inputBuffer, inputBufferOffset, length),
        };
    }
    return {
        reader: defaultUint8Reader,
        readerState: new Uint8Array(inputBuffer, inputBufferOffset, length),
    };
}
function defaultUint8Reader(
    buffer: Uint8Array,
    offset: number,
    bitOffset: number,
    channelStart: number[],
    channelLength: number[],
    channelMask: number[],
    rawPixel: Float64Array
): void {
    for (let i = 0; i < channelLength.length; i++) {
        const bitCount = channelLength[i];
        rawPixel[i] = readUnsignedBitsFromBuffer(buffer, offset, bitOffset, bitCount);
        offset += (bitOffset + bitCount) >> 3;
        bitOffset = (bitOffset + bitCount) & 7;
    }
}
function all8Reader(
    buffer: Uint8Array,
    offset: number,
    bitOffset: number,
    channelStart: number[],
    channelLength: number[],
    channelMask: number[],
    rawPixel: Float64Array
): void {
    for (let i = 0; i < channelLength.length; i++) {
        rawPixel[i] = buffer[offset + i];
    }
}
function all16Reader(
    buffer: Uint16Array,
    offset: number,
    bitOffset: number,
    channelStart: number[],
    channelLength: number[],
    channelMask: number[],
    rawPixel: Float64Array
): void {
    for (let i = 0; i < channelLength.length; i++) {
        rawPixel[i] = buffer[(offset >> 1) + i];
    }
}
function all32Reader(
    buffer: Float32Array | Uint32Array,
    offset: number,
    bitOffset: number,
    channelStart: number[],
    channelLength: number[],
    channelMask: number[],
    rawPixel: Float64Array
): void {
    for (let i = 0; i < channelLength.length; i++) {
        rawPixel[i] = buffer[(offset >> 2) + i];
    }
}
function masked8Reader(
    buffer: Uint8Array,
    offset: number,
    bitOffset: number,
    channelStart: number[],
    channelLength: number[],
    channelMask: number[],
    rawPixel: Float64Array
): void {
    const v = buffer[offset];
    for (let i = 0; i < channelLength.length; i++) {
        rawPixel[i] = (v & channelMask[i]) >>> channelStart[i];
    }
}
function masked16Reader(
    buffer: Uint16Array,
    offset: number,
    bitOffset: number,
    channelStart: number[],
    channelLength: number[],
    channelMask: number[],
    rawPixel: Float64Array
): void {
    const v = buffer[offset >> 1];
    for (let i = 0; i < channelLength.length; i++) {
        rawPixel[i] = (v & channelMask[i]) >>> channelStart[i];
    }
}
function masked32Reader(
    buffer: Uint32Array,
    offset: number,
    bitOffset: number,
    channelStart: number[],
    channelLength: number[],
    channelMask: number[],
    rawPixel: Float64Array
): void {
    const v = buffer[offset >> 2];
    for (let i = 0; i < channelLength.length; i++) {
        rawPixel[i] = (v & channelMask[i]) >>> channelStart[i];
    }
}
```

## File: src/util/image/sprite.ts
```typescript
import * as vscode from 'vscode';
import { PNG } from "pngjs";
import { NumberPosition } from "../common";
export class Image {
    private cachedUri: string | undefined = undefined;
    constructor(
        readonly pngBuffer: Buffer,
        readonly width: number,
        readonly height: number,
        readonly path: vscode.Uri) {
    }
    public get uri(): string {
        if (this.cachedUri) {
            return this.cachedUri;
        }
        return this.cachedUri = toDataUrl(this.pngBuffer);
    }
}
export class Sprite {
    private cachedFrames: Image[] | undefined = undefined;
    constructor(
        readonly id: string,
        readonly image: Image,
        readonly noOfFrames: number) {
    }
    public get frames(): Image[] {
        if (this.cachedFrames) {
            return this.cachedFrames;
        }
        if (this.noOfFrames === 1) {
            return this.cachedFrames = [ this.image ];
        }
        const png = pngRead(this.image.pngBuffer);
        const frameWidth = this.width;
        const framePng = new PNG({ width: frameWidth, height: png.height });
        const result: Image[] = [];
        const path = this.image.path;
        for (var i = 0; i < this.noOfFrames; i++) {
            png.bitblt(framePng, i * frameWidth, 0, frameWidth, png.height, 0, 0);
            result.push(new Image(PNG.sync.write(framePng), frameWidth, png.height, path));
        }
        return this.cachedFrames = result;
    }
    public get width(): number {
        return this.image.width / this.noOfFrames;
    }
    public get height(): number {
        return this.image.height;
    }
}
export class CorneredTileSprite extends Sprite {
    private cachedTiles: Record<number, Image[]> = {};
    constructor(
        id: string,
        image: Image,
        noOfFrames: number,
        readonly size: NumberPosition,
        readonly borderSize: NumberPosition) {
        super(id, image, noOfFrames);
    }
    public getTiles(frameId: number = 0): Image[] {
        if (frameId > this.noOfFrames) {
            frameId = 0;
        }
        const cached = this.cachedTiles[frameId];
        if (cached) {
            return cached;
        }
        // TODO Commented out code below: don't know whether "size" of corneredtilespritetype works
        const frame = this.frames[frameId];
        const sizeX = frame.width; // Math.max(this.size.x, frame.width);
        const sizeY = frame.height; // Math.max(this.size.y, frame.height);
        const framePng = pngRead(frame.pngBuffer);
        const backPng = framePng; // new PNG({ width: sizeX, height: sizeY });
        // scaleCopy(framePng, backPng);
        // framePng.bitblt(backPng, 0, 0, Math.min(sizeX, framePng.width), Math.min(sizeY, framePng.height), 0, 0);
        let borderX = this.borderSize.x;
        let borderY = this.borderSize.y;
        if (borderX * 2 >= sizeX) {
            borderX = Math.max(0, Math.floor(sizeX / 2 - 1));
        }
        if (borderY * 2 >= sizeY) {
            borderY = Math.max(0, Math.floor(sizeY / 2 - 1));
        }
        const path = this.image.path;
        const xPos = [0, borderX, sizeX - borderX, sizeX];
        const yPos = [0, borderY, sizeY - borderY, sizeY];
        const tiles: Image[] = [];
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
                tiles.push(extractImageFromPng(backPng, xPos[x], yPos[y], xPos[x + 1] - xPos[x], yPos[y + 1] - yPos[y], path));
            }
        }
        this.cachedTiles[frameId] = tiles;
        return tiles;
    }
}
function toDataUrl(buffer: Buffer): string {
    return 'data:image/png;base64,' + buffer.toString('base64');
}
function extractImageFromPng(png: PNG, x: number, y: number, w: number, h: number, path: vscode.Uri): Image {
    const resultPng = new PNG({ width: w, height: h });
    if (w > 0 && h > 0) {
        png.bitblt(resultPng, x, y, w, h, 0, 0);
    }
    return new Image(PNG.sync.write(resultPng), w, h, path);
}
function pngRead(buffer: Buffer): PNG {
    const result = PNG.sync.read(buffer);
    Object.setPrototypeOf(result, PNG.prototype);
    return result;
}
function scaleCopy(src: PNG, dst: PNG): void {
    const ws = src.width;
    const hs = src.height;
    const wd = dst.width;
    const hd = dst.height;
    const srcdata = src.data;
    const dstdata = dst.data;
    for (let y = 0; y < hd; y++) {
        for (let x = 0; x < wd; x++) {
            const dindex = (x + y * wd) << 2;
            const sindex = (Math.floor(x * ws / wd) + Math.floor(y * hs / hd) * ws) << 2;
            dstdata[dindex] = srcdata[sindex];
            dstdata[dindex + 1] = srcdata[sindex + 1];
            dstdata[dindex + 2] = srcdata[sindex + 2];
            dstdata[dindex + 3] = srcdata[sindex + 3];
        }
    }
}
```

## File: src/util/localisationIndex.ts
```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { debounceByInput } from './common';
import { localisationIndex } from './featureflags';
import { listFilesFromModOrHOI4, readFileFromModOrHOI4 } from './fileloader';
import { localize } from './i18n';
import { sendEvent } from './telemetry';
import { Logger } from "./logger";
import { YAMLException } from "js-yaml";
type LocalisationData = Record<string, Record<string, string>>;
const globalLocalisationIndex: LocalisationData = {};
let workspaceLocalisationIndex: LocalisationData = {};
// Mapping of language ISO codes to yml file language suffixes
const localeMapping: Record<string, string> = {
    'en': 'l_english',
    'pt-br': 'l_braz_por',
    'de': 'l_german',
    'fr': 'l_french',
    'es': 'l_spanish',
    'pl': 'l_polish',
    'ru': 'l_russian',
    'ja': 'l_japanese',
    'zh-cn': 'l_simp_chinese',
};
// Mapping of language profiles to language ISO codes
const localeISOMapping: Record<string, string> = {
    ['Brazilian Portuguese']: 'pt-br',
    English: 'en',
    French: 'fr',
    German: 'de',
    Japanese: 'ja',
    Polish: 'pl',
    Russian: 'ru',
    ['Simplified Chinese']: 'zh-cn',
    Spanish: 'es',
};
export function registerLocalisationIndex(): vscode.Disposable {
    const disposables: vscode.Disposable[] = [];
    if (localisationIndex) {
        const estimatedSize: [number] = [0];
        const task = Promise.all([
            buildGlobalLocalisationIndex(estimatedSize),
            buildWorkspaceLocalisationIndex(estimatedSize)
        ]);
        vscode.window.setStatusBarMessage('$(loading~spin) ' + localize('localisationIndex.building', 'Building Localisation index...'), task);
        task.then(() => {
            vscode.window.showInformationMessage(localize('localisationIndex.builddone', 'Building Localisation index done.'));
            sendEvent('localisationIndex', {size: estimatedSize[0].toString()});
        });
        disposables.push(vscode.workspace.onDidChangeWorkspaceFolders(onChangeWorkspaceFolders));
        disposables.push(vscode.workspace.onDidChangeTextDocument(onChangeTextDocument));
        disposables.push(vscode.workspace.onDidCloseTextDocument(onCloseTextDocument));
        disposables.push(vscode.workspace.onDidCreateFiles(onCreateFiles));
        disposables.push(vscode.workspace.onDidDeleteFiles(onDeleteFiles));
        disposables.push(vscode.workspace.onDidRenameFiles(onRenameFiles));
    }
    return vscode.Disposable.from(...disposables);
}
export async function getLocalisedTextQuick(localisationKey: string | undefined): Promise<string | undefined> {
    const previewLocalisation = vscode.workspace.getConfiguration('hoi4ModUtilities').previewLocalisation;
    if (previewLocalisation){
        return getLocalisedText(localisationKey, localeISOMapping[previewLocalisation]?? vscode.env.language);
    }
    return getLocalisedText(localisationKey, vscode.env.language);
}
export async function getLocalisedText(localisationKey: string | undefined, language: string): Promise<string | undefined> {
    if (!localisationKey) {
        return localisationKey;
    }
    if (!localisationIndex) {
        return localisationKey ?? '';
    }
    const langKey = localeMapping[language.toLowerCase()] || 'l_english'; // use mapping to get language suffix
    const defaultLangKey = 'l_english';
    let text = globalLocalisationIndex[langKey]?.[localisationKey] ||
        workspaceLocalisationIndex[langKey]?.[localisationKey];
    if (!text) {
        text = globalLocalisationIndex[defaultLangKey]?.[localisationKey] ||
            workspaceLocalisationIndex[defaultLangKey]?.[localisationKey];
    }
    return text ?? localisationKey;
}
async function buildGlobalLocalisationIndex(estimatedSize: [number]): Promise<void> {
    const options = {mod: false, hoi4: true, recursively: true};
    const localisationFiles = (await listFilesFromModOrHOI4('localisation', options)).filter(f => /.*_(l_english|l_braz_por|l_german|l_french|l_spanish|l_polish|l_russian|l_japanese|l_simp_chinese)\.yml$/i.test(f));
    await Promise.all(localisationFiles.map(f => fillLocalisationItems('localisation/' + f, globalLocalisationIndex, options, estimatedSize)));
}
async function buildWorkspaceLocalisationIndex(estimatedSize: [number]): Promise<void> {
    const options = {mod: true, hoi4: false, recursively: true};
    const localisationFiles = (await listFilesFromModOrHOI4('localisation', options)).filter(f => /.*_(l_english|l_braz_por|l_german|l_french|l_spanish|l_polish|l_russian|l_japanese|l_simp_chinese)\.yml$/i.test(f));
    await Promise.all(localisationFiles.map(f => fillLocalisationItems('localisation/' + f, workspaceLocalisationIndex, options, estimatedSize)));
}
async function fillLocalisationItems(localisationFile: string, localisationIndex: LocalisationData, options: {
    mod?: boolean,
    hoi4?: boolean
}, estimatedSize?: [number]): Promise<void> {
    const [fileBuffer, uri] = await readFileFromModOrHOI4(localisationFile, options);
    const processedContent = preprocessYamlContent(fileBuffer.toString());
    try {
        const localisations = parseLocalisationFile(processedContent);
        for (const langKey in localisations) {
            if (!localisationIndex[langKey]) {
                localisationIndex[langKey] = {};
            }
            Object.assign(localisationIndex[langKey], localisations[langKey]);
            if (estimatedSize) {
                estimatedSize[0] += Object.keys(localisations[langKey]).reduce((sum, key) => sum + key.length + localisations[langKey][key].length, 0);
            }
        }
    } catch (e) {
        console.log(localisationFile);
        console.log(processedContent);
        console.error(e);
        const baseMessage = options.hoi4
            ? localize('localisationIndex.vanilla','[Vanilla]')
            : localize('localisationIndex.mod','[mod]');
        const failureMessage = localize('localisationIndex.parseFailure','parsing failed! Please check if the file has issues!');
        if (e instanceof YAMLException) {
            Logger.error(`${baseMessage} ${localisationFile} ${failureMessage}\n${e.message}`);
        } else {
            Logger.error(`${baseMessage} ${localisationFile} ${failureMessage}`);
        }
    }
}
function preprocessYamlContent(fileContent: string): string {
    const lines = fileContent.split(/\r?\n/);
    // Filter out any lines that start with #, regardless of leading spaces
    const filteredLines = lines.filter(line =>
        !/^\s*#/.test(line)
    );
    const header = filteredLines.length > 0 ? filteredLines[0].replace(/^\s+/, '') : '';
    // Can't the goddamn Paradox employees and modders just write standard localization yml files?
    const processedLines = filteredLines.slice(1).map(line => {
        return ' ' + line
            .replace(/\n/g, 'YAMLParsingLFReplacement')
            .replace(
                /^\s*([^:]+):\s*\d*\s*"((?:[^"#\\]|\\.)*)".*?(?=#|$)/,
                (match, p1, p2) => {
                    // Replace unescaped quotes with escaped ones
                    const escapedContent = p2.replace(/(?<!\\)"/g, '\\"');
                    return `${p1}: "${escapedContent}"`;
                }
            )
            .replace(/:(\d+)(?=[^"]*")/, ':')
            .replace(/^\s+/, '');
    }).filter(line =>
        line.trim() !== ''
    );
    return [header, ...processedLines].join('\n');
}
function parseLocalisationFile(fileContent: string): Record<string, Record<string, string>> {
    const result: Record<string, Record<string, string>> = {};
    const parsed = yaml.load(fileContent, {schema: yaml.JSON_SCHEMA, json: true}) as Record<string, any>;
    for (const langKey in parsed) {
        if (langKey.startsWith('l_')) {
            result[langKey] = result[langKey] || {};
            const entries = parsed[langKey] as Record<string, string>;
            for (const key in entries) {
                result[langKey][key] = entries[key].replace(/YAMLParsingLFReplacement/g, '\n');
            }
        }
    }
    return result;
}
function onChangeWorkspaceFolders(_: vscode.WorkspaceFoldersChangeEvent) {
    workspaceLocalisationIndex = {};
    const estimatedSize: [number] = [0];
    const task = buildWorkspaceLocalisationIndex(estimatedSize);
    vscode.window.setStatusBarMessage('$(loading~spin) ' + localize('localisationIndex.workspace.building', 'Building workspace Localisation index...'), task);
    task.then(() => {
        vscode.window.showInformationMessage(localize('localisationIndex.workspace.builddone', 'Building workspace Localisation index done.'));
        sendEvent('localisationIndex.workspace', {size: estimatedSize[0].toString()});
    });
}
function onChangeTextDocument(e: vscode.TextDocumentChangeEvent) {
    const file = e.document.uri;
    if (file.path.endsWith('.yml')) {
        onChangeTextDocumentImpl(file);
    }
}
const onChangeTextDocumentImpl = debounceByInput(
    (file: vscode.Uri) => {
        removeWorkspaceLocalisationIndex(file);
        addWorkspaceLocalisationIndex(file);
    },
    file => file.toString(),
    1000,
    {trailing: true}
);
function onCloseTextDocument(document: vscode.TextDocument) {
    const file = document.uri;
    if (file.path.endsWith('.yml')) {
        removeWorkspaceLocalisationIndex(file);
        addWorkspaceLocalisationIndex(file);
    }
}
function onCreateFiles(e: vscode.FileCreateEvent) {
    for (const file of e.files) {
        if (file.path.endsWith('.yml')) {
            addWorkspaceLocalisationIndex(file);
        }
    }
}
function onDeleteFiles(e: vscode.FileDeleteEvent) {
    for (const file of e.files) {
        if (file.path.endsWith('.yml')) {
            removeWorkspaceLocalisationIndex(file);
        }
    }
}
function onRenameFiles(e: vscode.FileRenameEvent) {
    onDeleteFiles({files: e.files.map(f => f.oldUri)});
    onCreateFiles({files: e.files.map(f => f.newUri)});
}
function removeWorkspaceLocalisationIndex(file: vscode.Uri) {
    const wsFolder = vscode.workspace.getWorkspaceFolder(file);
    if (wsFolder) {
        const relative = path.relative(wsFolder.uri.path, file.path).replace(/\\+/g, '/');
        if (relative && relative.startsWith('localisation/')) {
            const langKey = getLangKeyFromPath(relative);
            delete workspaceLocalisationIndex[langKey];
        }
    }
}
function addWorkspaceLocalisationIndex(file: vscode.Uri) {
    const wsFolder = vscode.workspace.getWorkspaceFolder(file);
    if (wsFolder) {
        const relative = path.relative(wsFolder.uri.path, file.path).replace(/\\+/g, '/');
        if (relative && relative.startsWith('localisation/')) {
            fillLocalisationItems(relative, workspaceLocalisationIndex, {hoi4: false});
        }
    }
}
function getLangKeyFromPath(filePath: string): string {
    const match = filePath.match(/.*_(l_english|l_braz_por|l_german|l_french|l_spanish|l_polish|l_russian|l_japanese|l_simp_chinese)\.yml$/i);
    return match ? match[1] : 'l_english';
}
```

## File: src/util/logger.ts
```typescript
import * as vscode from 'vscode';
enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
}
export class Logger {
    private static outputChannel: vscode.OutputChannel;
    public static initialize() {
        if (!Logger.outputChannel) {
            Logger.outputChannel = vscode.window.createOutputChannel('HOI4 Modding');
        }
    }
    private static logMessage(level: LogLevel, message: string) {
        if (!Logger.outputChannel) {
            Logger.initialize();
        }
        const timestamp = new Date().toISOString();
        Logger.outputChannel.appendLine(`[${timestamp}] [${level}] ${message}`);
    }
    public static debug(message: string) {
        Logger.logMessage(LogLevel.DEBUG, message);
    }
    public static info(message: string) {
        Logger.logMessage(LogLevel.INFO, message);
    }
    public static warn(message: string) {
        Logger.logMessage(LogLevel.WARN, message);
    }
    public static error(message: string) {
        Logger.logMessage(LogLevel.ERROR, message);
    }
    public static show() {
        if (Logger.outputChannel) {
            Logger.outputChannel.show();
        }
    }
}
```

## File: src/util/modfile.ts
```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import { ConfigurationKey, Commands } from '../constants';
import { PromiseCache } from './cache';
import { localize } from './i18n';
import { basename, fileOrUriStringToUri, getConfiguration, uriToFilePathWhenPossible } from './vsccommon';
import { isFile, readDir } from './vsccommon';
export const modFileStatusContainer: { current: vscode.StatusBarItem | null } = {
    current: null,
};
export const workspaceModFilesCache = new PromiseCache({
    factory: getWorkspaceModFiles,
    life: 10 * 1000,
});
export function registerModFile(): vscode.Disposable {
    const disposables: vscode.Disposable[] = [];
    disposables.push(vscode.commands.registerCommand(Commands.SelectModFile, selectModFile));
    disposables.push(modFileStatusContainer.current = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 50));
    disposables.push(vscode.workspace.onDidChangeConfiguration(onChangeWorkspaceConfiguration));
    disposables.push(new vscode.Disposable(() => { modFileStatusContainer.current = null; }));
    // Initial status bar
    checkAndUpdateModFileStatus(fileOrUriStringToUri(getConfiguration().modFile));
    return vscode.Disposable.from(...disposables);
}
export function updateSelectedModFileStatus(modFile: vscode.Uri | undefined, error: boolean = false): void {
    if (modFileStatusContainer.current) {
        const modName = modFileStatusContainer.current;
        if (modFile) {
            const modFileName = basename(modFile, ".mod");
            modName.command = Commands.SelectModFile;
            modName.text = (error ? "$(error) " : "$(file-code) ") + modFileName;
            modName.tooltip = (error ? localize('modfile.errorreading', "Error reading this file: ") : '') + uriToFilePathWhenPossible(modFile);
            modName.show();
        } else {
            modName.command = Commands.SelectModFile;
            modName.text = "$(file-code) " + localize('modfile.nomodfile', '(No mod descriptor)');
            modName.tooltip = localize('modfile.clicktoselect', 'Click to select a mod file...');
            modName.show();
        }
    }
}
function onChangeWorkspaceConfiguration(e: vscode.ConfigurationChangeEvent): void {
    if (e.affectsConfiguration(`${ConfigurationKey}.modFile`)) {
        checkAndUpdateModFileStatus(fileOrUriStringToUri(getConfiguration().modFile));
    }
}
async function checkAndUpdateModFileStatus(modFile: vscode.Uri | undefined): Promise<void> {
    if (modFile === undefined) {
        updateSelectedModFileStatus(undefined);
        return;
    }
    const error = !(await isFile(modFile));
    updateSelectedModFileStatus(modFile, error);
    if (error) {
        vscode.window.showErrorMessage(localize('modfile.filenotexist', 'Mod file not exist: {0}', modFile));
    }
}
async function selectModFile(): Promise<void> {
    const conf = getConfiguration();
    const modFileInspect = conf.inspect<string>('modFile');
    const modsList: (vscode.QuickPickItem & { selectModFile?: true })[] = !modFileInspect?.globalValue ? [] : [{
        label: path.basename(modFileInspect.globalValue, '.mod'),
        description: localize('modfile.globalsetting', 'Global setting'),
        detail: modFileInspect.globalValue
    }];
    let selected = conf.modFile.trim();
    workspaceModFilesCache.clear();
    if (vscode.workspace.workspaceFolders) {
        for (const workspaceFolder of vscode.workspace.workspaceFolders) {
            const workspaceFolderPath = workspaceFolder.uri;
            const mods = await workspaceModFilesCache.get(workspaceFolderPath.toString());
            if (selected === '' && mods.length > 0) {
                selected = uriToFilePathWhenPossible(mods[0]);
            }
            modsList.push(...mods.map(mod => ({
                label: basename(mod, '.mod'),
                description: localize('modfile.infolder', 'In folder {0}', basename(workspaceFolderPath)),
                detail: uriToFilePathWhenPossible(mod),
            })));
        }
    }
    modsList.forEach(r => r.detail === selected ? r.picked = true : undefined);
    if (modsList.every(r => !r.picked) && selected !== '') {
        modsList.push({
            label: path.basename(selected, '.mod'),
            description: localize('modfile.workspacesetting', 'Workspace setting'),
            detail: selected,
            picked: true,
        });
    }
    modsList.sort((a, b) => a.picked ? -1 : b.picked ? 1 : 0);
    modsList.push({
        label: localize('modfile.select', 'Browse a .mod file...'),
        selectModFile: true,
    });
    const selectResult = await vscode.window.showQuickPick(modsList, { placeHolder: localize('modfile.selectworkingmod', 'Select working mod') });
    if (selectResult) {
        let modPath = selectResult.detail;
        if (selectResult.selectModFile) {
            const result = await vscode.window.showOpenDialog({ filters: { [localize('modfile.type', 'Mod file')]: ['mod'] } });
            if (result) {
                modPath = uriToFilePathWhenPossible(result[0]);
            } else {
                return;
            }
        }
        if (modPath === modFileInspect?.globalValue) {
            conf.update('modFile', undefined, vscode.ConfigurationTarget.Workspace);
        } else {
            conf.update('modFile', modPath, vscode.ConfigurationTarget.Workspace);
        }
        checkAndUpdateModFileStatus(modPath ? fileOrUriStringToUri(modPath): undefined);
    }
}
async function getWorkspaceModFiles(uriString: string): Promise<vscode.Uri[]> {
    const uri = vscode.Uri.parse(uriString);
    const items = await readDir(uri);
    return items.filter(i => i.endsWith('.mod')).map(i => vscode.Uri.joinPath(uri, i));
}
```

## File: src/util/sharedFocusIndex.ts
```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import { debounceByInput } from './common';
import { listFilesFromModOrHOI4, readFileFromModOrHOI4 } from './fileloader';
import { localize } from './i18n';
import { sendEvent } from './telemetry';
import { Logger } from "./logger";
import { getFocusTree } from "../previewdef/focustree/schema";
import { parseHoi4File } from "../hoiformat/hoiparser";
import { sharedFocusIndex } from "./featureflags";
interface FocusIndex {
    [file: string]: string[]; // Filename -> array of focus keys
}
const globalFocusIndex: FocusIndex = {};
let workspaceFocusIndex: FocusIndex = {};
export function registerSharedFocusIndex(): vscode.Disposable {
    const disposables: vscode.Disposable[] = [];
    if (sharedFocusIndex) {
        const estimatedSize: [number] = [0];
        const task = Promise.all([
            buildGlobalFocusIndex(estimatedSize),
            buildWorkspaceFocusIndex(estimatedSize)
        ]);
        vscode.window.setStatusBarMessage('$(loading~spin) ' + localize('sharedFocusIndex.building', 'Building Shared Focus index...'), task);
        task.then(() => {
            vscode.window.showInformationMessage(localize('sharedFocusIndex.builddone', 'Building Shared Focus index done.'));
            sendEvent('sharedFocusIndex', { size: estimatedSize[0].toString() });
        });
        disposables.push(vscode.workspace.onDidChangeWorkspaceFolders(onChangeWorkspaceFolders));
        disposables.push(vscode.workspace.onDidChangeTextDocument(onChangeTextDocument));
        disposables.push(vscode.workspace.onDidCloseTextDocument(onCloseTextDocument));
        disposables.push(vscode.workspace.onDidCreateFiles(onCreateFiles));
        disposables.push(vscode.workspace.onDidDeleteFiles(onDeleteFiles));
        disposables.push(vscode.workspace.onDidRenameFiles(onRenameFiles));
    }
    return vscode.Disposable.from(...disposables);
}
async function buildGlobalFocusIndex(estimatedSize: [number]): Promise<void> {
    const options = { mod: false, hoi4: true, recursively: true };
    const focusFiles = await listFilesFromModOrHOI4('common/national_focus', options);
    await Promise.all(focusFiles.map(f => fillFocusItems('common/national_focus/' + f, globalFocusIndex, options, estimatedSize)));
}
async function buildWorkspaceFocusIndex(estimatedSize: [number]): Promise<void> {
    const options = { mod: true, hoi4: false, recursively: true };
    const focusFiles = await listFilesFromModOrHOI4('common/national_focus', options);
    await Promise.all(focusFiles.map(f => fillFocusItems('common/national_focus/' + f, workspaceFocusIndex, options, estimatedSize)));
}
async function fillFocusItems(focusFile: string, focusIndex: FocusIndex, options: { mod?: boolean; hoi4?: boolean }, estimatedSize?: [number]): Promise<void> {
    const [fileBuffer, uri] = await readFileFromModOrHOI4(focusFile, options);
    const fileContent = fileBuffer.toString();
    try {
        const sharedFocusTrees: any[] = [];
        const focusTrees = getFocusTree(parseHoi4File(fileContent, localize('infile', 'In file {0}:\n', focusFile)), sharedFocusTrees, focusFile);
        // Only store focus trees where isSharedFocues is true
        focusTrees.forEach(tree => {
            if (tree.isSharedFocues) {
                const focusKeys = Object.keys(tree.focuses);
                focusIndex[focusFile] = focusKeys;
            }
        });
        if (estimatedSize) {
            estimatedSize[0] += fileBuffer.length;
        }
    } catch (e) {
        const baseMessage = options.hoi4
            ? localize('sharedFocusIndex.vanilla', '[Vanilla]')
            : localize('sharedFocusIndex.mod', '[Mod]');
        const failureMessage = localize('sharedFocusIndex.parseFailure', 'Parsing failed! Please check if the file has issues!');
        if (e instanceof Error) {
            Logger.error(`${baseMessage} ${focusFile} ${failureMessage}\n${e.stack}`);
        }
    }
}
// Function to find the file name containing the specified focus key
export function findFileByFocusKey(key: string): string | undefined {
    let result: string | undefined;
    // Search in globalFocusIndex first
    for (const file in globalFocusIndex) {
        if (globalFocusIndex[file].includes(key)) {
            result = file;
            break;
        }
    }
    // Always search in workspaceFocusIndex, and if found, override the result
    for (const file in workspaceFocusIndex) {
        if (workspaceFocusIndex[file].includes(key)) {
            result = file;
            break;
        }
    }
    return result;
}
function onChangeWorkspaceFolders(_: vscode.WorkspaceFoldersChangeEvent) {
    // Clear the workspace focus index
    workspaceFocusIndex = {};
    const estimatedSize: [number] = [0];
    const task = buildWorkspaceFocusIndex(estimatedSize);
    vscode.window.setStatusBarMessage('$(loading~spin) ' + localize('sharedFocusIndex.workspace.building', 'Building workspace Focus index...'), task);
    task.then(() => {
        vscode.window.showInformationMessage(localize('sharedFocusIndex.workspace.builddone', 'Building workspace Focus index done.'));
        sendEvent('sharedFocusIndex.workspace', { size: estimatedSize[0].toString() });
    });
}
function onChangeTextDocument(e: vscode.TextDocumentChangeEvent) {
    const file = e.document.uri;
    if (file.path.endsWith('.txt')) {
        onChangeTextDocumentImpl(file);
    }
}
const onChangeTextDocumentImpl = debounceByInput(
    (file: vscode.Uri) => {
        removeWorkspaceFocusIndex(file);
        addWorkspaceFocusIndex(file);
    },
    file => file.toString(),
    1000,
    { trailing: true }
);
function onCloseTextDocument(document: vscode.TextDocument) {
    const file = document.uri;
    if (file.path.endsWith('.txt')) {
        removeWorkspaceFocusIndex(file);
        addWorkspaceFocusIndex(file);
    }
}
function onCreateFiles(e: vscode.FileCreateEvent) {
    for (const file of e.files) {
        if (file.path.endsWith('.txt')) {
            addWorkspaceFocusIndex(file);
        }
    }
}
function onDeleteFiles(e: vscode.FileDeleteEvent) {
    for (const file of e.files) {
        if (file.path.endsWith('.txt')) {
            removeWorkspaceFocusIndex(file);
        }
    }
}
function onRenameFiles(e: vscode.FileRenameEvent) {
    onDeleteFiles({ files: e.files.map(f => f.oldUri) });
    onCreateFiles({ files: e.files.map(f => f.newUri) });
}
function removeWorkspaceFocusIndex(file: vscode.Uri) {
    const wsFolder = vscode.workspace.getWorkspaceFolder(file);
    if (wsFolder) {
        const relative = path.relative(wsFolder.uri.path, file.path).replace(/\\+/g, '/');
        if (relative && relative.startsWith('common/national_focus/')) {
            delete workspaceFocusIndex[relative];
        }
    }
}
function addWorkspaceFocusIndex(file: vscode.Uri) {
    const wsFolder = vscode.workspace.getWorkspaceFolder(file);
    if (wsFolder) {
        const relative = path.relative(wsFolder.uri.path, file.path).replace(/\\+/g, '/');
        if (relative && relative.startsWith('common/national_focus/')) {
            fillFocusItems(relative, workspaceFocusIndex, { hoi4: false });
        }
    }
}
```

## File: webviewsrc/dev.d.ts
```typescript
declare var previewedFileUri: string | undefined;
declare function acquireVsCodeApi(): VSCodeAPI;
declare interface VSCodeAPI {
    setState<T>(state: T): void;
    getState<T>(): T | undefined;
    postMessage<T>(message: T): void;
}
interface NodeRequire {
    context(directory: string, useSubdirectories?: boolean, regExp?: RegExp, mode?: string): NodeRequire;
}
```

## File: webviewsrc/eventtree.ts
```typescript
import { tryRun, enableZoom } from "./util/common";
window.addEventListener('load', tryRun(async function() {
    // Zoom
    const contentElement = document.getElementById('eventtreecontent') as HTMLDivElement;
    enableZoom(contentElement, 0, 0);
    showPictureWhenHover();
}));
function showPictureWhenHover() {
    const eventNodes = document.getElementsByClassName('event-picture-host') as HTMLCollectionOf<HTMLDivElement>;
    for (let i = 0; i < eventNodes.length; i++) {
        const eventNode = eventNodes.item(i);
        if (eventNode) {
            showPictureWhenHoverElement(eventNode);
        }
    }
}
function showPictureWhenHoverElement(eventNode: HTMLDivElement) {
    const pictureKey = eventNode.attributes.getNamedItem('picture-style-key')?.value;
    const pictureWidthStr = eventNode.attributes.getNamedItem('picture-width')?.value;
    if (!pictureKey || !pictureWidthStr) {
        return;
    }
    const pictureWidth = parseInt(pictureWidthStr);
    let hoverElement: HTMLDivElement | undefined = undefined;
    eventNode.addEventListener('mouseenter', () => {
        const position = eventNode.getBoundingClientRect();
        hoverElement = document.createElement('div');
        hoverElement.className = pictureKey;
        hoverElement.style.position = 'absolute';
        hoverElement.style.left = (position.left + window.scrollX - (pictureWidth - position.width) / 2) + 'px';
        hoverElement.style.top = (position.top + position.height + window.scrollY) + 'px';
        document.body.append(hoverElement);
    });
    eventNode.addEventListener('mouseleave', () => {
        hoverElement?.remove();
    });
}
```

## File: webviewsrc/guipreview.ts
```typescript
import { normalizeForStyle } from "../src/util/styletable";
import { Checkbox } from "./util/checkbox";
import { setState, getState, scrollToState, tryRun, subscribeRefreshButton } from "./util/common";
import { vscode } from "./util/vscode";
const existingCheckboxes: Checkbox[] = [];
let toggleVisibilityContentVisible = getState().toggleVisibilityContentVisible;
let isDragging = false;
let dragTarget: HTMLElement | null = null;
let startX = 0;
let startY = 0;
let currentDx = 0;
let currentDy = 0;
function folderChange(folder: string) {
    const elements = document.getElementsByClassName('containerwindow');
    setState({ folder: folder });
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i] as HTMLDivElement;
        element.style.display = element.id === folder ? 'block' : 'none';
    }
    setupContainerWindowToggles(folder);
}
function setupContainerWindowToggles(folder: string) {
    existingCheckboxes.forEach(checkbox => checkbox.dispose());
    existingCheckboxes.length = 0;
    const containerWindowVisibilities: Record<string, boolean> = getState().containerWindowVisibilities ?? {};
    const toggleVisibilityContentInner = document.getElementById('toggleVisibilityContentInner') as HTMLDivElement;
    const containerWindowName = folder.replace('containerwindow_', '');
    toggleVisibilityContentInner.innerHTML = (window as any).containerWindowToggles[containerWindowName]?.content ?? '';
    const checkboxes = document.getElementsByClassName('toggleContainerWindowCheckbox');
    const toggleVisibility = document.getElementById('toggleVisibility') as HTMLButtonElement;
    toggleVisibility.disabled = toggleVisibilityContentInner.innerHTML === '';
    if (toggleVisibility.disabled) {
        toggleVisibilityContentVisible = false;
        refreshToggleVisibilityContent();
        setState({ toggleVisibilityContentVisible });
    }
    const relatedContainerWindow: Record<string, HTMLElement | null> = {};
    for (let i = 0; i < checkboxes.length; i++) {
        const input = checkboxes.item(i) as HTMLInputElement;
        let selector = '.containerwindow_' + normalizeForStyle(containerWindowName) + ' ';
        for (let j = 0; j <= i; j++) {
            const anotherInput = checkboxes.item(j) as HTMLInputElement;
            if (input.id.startsWith(anotherInput.id)) {
                selector = selector + '.childcontainerwindow_' + normalizeForStyle(anotherInput.attributes.getNamedItem('containerWindowName')?.value ?? '') + ' ';
            }
        }
        relatedContainerWindow[input.id] = document.querySelector(selector);
    }
    for (let i = 0; i < checkboxes.length; i++) {
        const input = checkboxes.item(i) as HTMLInputElement;
        input.checked = !(input.id in containerWindowVisibilities) || containerWindowVisibilities[input.id];
        const containerWindow = relatedContainerWindow[input.id];
        if (containerWindow) {
            containerWindow.style.display = input.checked ? 'block' : 'none';
        }
        const checkbox = new Checkbox(input, input.attributes.getNamedItem('containerWindowName')?.value ?? '');
        existingCheckboxes.push(checkbox);
        input.addEventListener('change', () => {
            containerWindowVisibilities[input.id] = input.checked;
            if (input.checked) {
                for (let i = 0; i < checkboxes.length; i++) {
                    const anotherInput = checkboxes.item(i) as HTMLInputElement;
                    if (anotherInput !== input && (anotherInput.id.startsWith(input.id) || input.id.startsWith(anotherInput.id))) {
                        anotherInput.checked = true;
                        containerWindowVisibilities[anotherInput.id] = true;
                    }
                }
            } else {
                for (let i = 0; i < checkboxes.length; i++) {
                    const anotherInput = checkboxes.item(i) as HTMLInputElement;
                    if (anotherInput !== input && anotherInput.id.startsWith(input.id)) {
                        anotherInput.checked = false;
                        containerWindowVisibilities[anotherInput.id] = false;
                    }
                }
            }
            setState({ containerWindowVisibilities });
            for (let i = 0; i < checkboxes.length; i++) {
                const input = checkboxes.item(i) as HTMLInputElement;
                const containerWindow = relatedContainerWindow[input.id];
                if (containerWindow) {
                    containerWindow.style.display = input.checked ? 'block' : 'none';
                }
            }
        });
    }
}
function refreshToggleVisibilityContent() {
    const mainContent = document.getElementById('mainContent') as HTMLDivElement;
    const toggleVisibilityContent = document.getElementById('toggleVisibilityContent') as HTMLDivElement;
    toggleVisibilityContent.style.display = toggleVisibilityContentVisible ? 'block' : 'none';
    mainContent.style.marginTop = toggleVisibilityContentVisible ? '240px' : '40px';
}
window.addEventListener('load', tryRun(function() {
    const folderSelector = document.getElementById('folderSelector') as HTMLSelectElement;
    const folder = getState().folder || folderSelector.value;
    folderSelector.value = folder;
    folderChange(folder);
    folderSelector.addEventListener('change', function() {
        setState({ containerWindowVisibilities: {} });
        folderChange(this.value);
    });
    refreshToggleVisibilityContent();
    const toggleVisibility = document.getElementById('toggleVisibility') as HTMLButtonElement;
    toggleVisibility.addEventListener('click', () => {
        toggleVisibilityContentVisible = !toggleVisibilityContentVisible;
        refreshToggleVisibilityContent();
        setState({ toggleVisibilityContentVisible });
    });
    scrollToState();
    subscribeRefreshButton();
    // --- NEW: DRAG AND DROP LOGIC ---
    const mainContent = document.getElementById('mainContent') as HTMLDivElement;
    mainContent?.addEventListener('mousedown', (e) => {
        // Require Shift key to drag (so we don't interfere with standard clicking or panning)
        if (!e.shiftKey) return;
        const target = (e.target as HTMLElement).closest('.navigator') as HTMLElement;
        if (!target) return;
        isDragging = true;
        dragTarget = target;
        startX = e.clientX;
        startY = e.clientY;
        currentDx = 0;
        currentDy = 0;
        e.preventDefault();
        e.stopPropagation();
    });
    window.addEventListener('mousemove', (e) => {
        if (!isDragging || !dragTarget) return;
        // Calculate delta based on current zoom scale
        const scale = getState().scale || 1;
        currentDx = (e.clientX - startX) / scale;
        currentDy = (e.clientY - startY) / scale;
        // Apply visual offset temporarily using CSS transform
        dragTarget.style.transform = `translate(${currentDx}px, ${currentDy}px)`;
    });
    window.addEventListener('mouseup', (e) => {
        if (!isDragging || !dragTarget) return;
        // Remove temporary visual transform
        dragTarget.style.transform = '';
        // If we actually moved the element, send the edit to the backend
        if (Math.abs(currentDx) > 1 || Math.abs(currentDy) > 1) {
            const startByte = dragTarget.getAttribute('start');
            const endByte = dragTarget.getAttribute('end');
            if (startByte && endByte) {
                vscode.postMessage({
                    command: 'editGuiPosition',
                    start: parseInt(startByte),
                    end: parseInt(endByte),
                    dx: Math.round(currentDx),
                    dy: Math.round(currentDy)
                });
            }
        }
        isDragging = false;
        dragTarget = null;
    });
}));
```

## File: webviewsrc/miopreview.ts
```typescript
import { getState, setState, arrayToMap, subscribeNavigators, scrollToState, tryRun, enableZoom } from "./util/common";
import { DivDropdown } from "./util/dropdown";
import { minBy } from "lodash";
import { renderGridBoxCommon, GridBoxItem, GridBoxConnection } from "../src/util/hoi4gui/gridboxcommon";
import { StyleTable, normalizeForStyle } from "../src/util/styletable";
import { applyCondition, ConditionItem } from "../src/hoiformat/condition";
import { NumberPosition } from "../src/util/common";
import { GridBoxType } from "../src/hoiformat/gui";
import { toNumberLike } from "../src/hoiformat/schema";
import { feLocalize } from './util/i18n';
import { Mio, MioTrait } from "../src/previewdef/mio/schema";
const mios: Mio[] = (window as any).mios;
let selectedExprs: ConditionItem[] = getState().selectedExprs ?? [];
let selectedMioIndex: number = Math.min(mios.length - 1, getState().selectedMioIndex ?? 0);
let conditions: DivDropdown | undefined = undefined;
async function buildContent() {
    const miopreviewplaceholder = document.getElementById('miopreviewplaceholder') as HTMLDivElement;
    const styleTable = new StyleTable();
    const mio = mios[selectedMioIndex];
    const renderedTrait: Record<string, string> = (window as any).renderedTrait[mio.id];
    const traits = Object.values(mio.traits);
    const allowBranchOptionsValue: Record<string, boolean> = {};
    const exprs = selectedExprs;
    Object.values(mio.traits).forEach(trait => {
        if (trait.hasVisible) {
            allowBranchOptionsValue[trait.id] = applyCondition(trait.visible, exprs);
        }
    });
    const gridbox: GridBoxType = (window as any).gridBox;
    const traitPosition: Record<string, NumberPosition> = {};
    calculateTraitVisible(mio, allowBranchOptionsValue);
    const traitGrixBoxItems = traits.map(trait => traitToGridItem(trait, mio, allowBranchOptionsValue, traitPosition)).filter((v): v is GridBoxItem => !!v);
    const minX = minBy(Object.values(traitPosition), 'x')?.x ?? 0;
    const leftPadding = gridbox.position.x._value - Math.min(minX * (window as any).xGridSize, 0);
    const traitPreviewContent = await renderGridBoxCommon({ ...gridbox, position: {...gridbox.position, x: toNumberLike(leftPadding)} }, {
        size: { width: 0, height: 0 },
        orientation: 'upper_left'
    }, {
        styleTable,
        items: arrayToMap(traitGrixBoxItems, 'id'),
        onRenderItem: item => Promise.resolve(
            renderedTrait[item.id].replace('{{position}}', item.gridX + ', ' + item.gridY)),
        cornerPosition: 0.5,
    });
    miopreviewplaceholder.innerHTML = traitPreviewContent + styleTable.toStyleElement((window as any).styleNonce);
    subscribeNavigators();
}
function calculateTraitVisible(mio: Mio, allowBranchOptionsValue: Record<string, boolean>) {
    const traits = mio.traits;
    let changed = true;
    while (changed) {
        changed = false;
        for (const key in traits) {
            const trait = traits[key];
            if (trait.anyParent.length === 0 && trait.allParents.length === 0 && !trait.parent) {
                continue;
            }
            if (trait.id in allowBranchOptionsValue) {
                continue;
            }
            if (trait.parent) {
                if (trait.parent.traits.length - trait.parent.traits.filter(p => allowBranchOptionsValue[p] === false).length < trait.parent.numNeeded) {
                    allowBranchOptionsValue[trait.id] = false;
                    changed = true;
                    break;
                }
                if (trait.parent.traits.filter(p => allowBranchOptionsValue[p] === true).length >= trait.parent.numNeeded) {
                    allowBranchOptionsValue[trait.id] = true;
                    changed = true;
                    continue;
                }
            }
            if (trait.allParents.some(p => allowBranchOptionsValue[p] === false)) {
                allowBranchOptionsValue[trait.id] = false;
                changed = true;
                break;
            }
            if (trait.anyParent.some(p => allowBranchOptionsValue[p] === true)) {
                allowBranchOptionsValue[trait.id] = true;
                changed = true;
                continue;
            }
        }
    }
}
function updateSelectedMio(clearCondition: boolean) {
    const mio = mios[selectedMioIndex];
    const conditionExprs = mio.conditionExprs;
    const conditionContainerElement = document.getElementById('condition-container') as HTMLDivElement | null;
    if (conditionContainerElement) {
        conditionContainerElement.style.display = conditionExprs.length > 0 ? 'block' : 'none';
    }
    if (conditions) {
        conditions.select.innerHTML = `<span class="value"></span>
            ${conditionExprs.map(option =>
                `<div class="option" value='${option.scopeName}!|${option.nodeContent}'>${option.scopeName ? `[${option.scopeName}]` : ''}${option.nodeContent}</div>`
            ).join('')}`;
        conditions.selectedValues$.next(clearCondition ? [] : selectedExprs.map(e => `${e.scopeName}!|${e.nodeContent}`));
    }
    const warnings = document.getElementById('warnings') as HTMLTextAreaElement | null;
    if (warnings) {
        warnings.value = mio.warnings.length === 0 ? feLocalize('worldmap.warnings.nowarnings', 'No warnings.') :
            mio.warnings.map(w => `[${w.source}] ${w.text}`).join('\n');
    }
}
function getTraitPosition(
    trait: MioTrait | undefined,
    positionByFocusId: Record<string, NumberPosition>,
    mio: Mio,
    traitStack: MioTrait[] = []
): NumberPosition {
    if (trait === undefined) {
        return { x: 0, y: 0 };
    }
    const cached = positionByFocusId[trait.id];
    if (cached) {
        return cached;
    }
    if (traitStack.includes(trait)) {
        return { x: 0, y: 0 };
    }
    let position: NumberPosition = { x: trait.x, y: trait.y };
    if (trait.relativePositionId !== undefined) {
        traitStack.push(trait);
        const relativeFocusPosition = getTraitPosition(mio.traits[trait.relativePositionId], positionByFocusId, mio, traitStack);
        traitStack.pop();
        position.x += relativeFocusPosition.x;
        position.y += relativeFocusPosition.y;
    }
    positionByFocusId[trait.id] = position;
    return position;
}
function traitToGridItem(
    trait: MioTrait,
    mio: Mio,
    allowBranchOptionsValue: Record<string, boolean>,
    positionByTraitId: Record<string, NumberPosition>,
): GridBoxItem | undefined {
    if (allowBranchOptionsValue[trait.id] === false) {
        return undefined;
    }
    const connections: GridBoxConnection[] = [];
    for (const parent of trait.anyParent) {
        connections.push({
            target: parent,
            targetType: 'parent',
            style: '1px dashed #88aaff',
        });
    }
    for (const parent of trait.allParents) {
        connections.push({
            target: parent,
            targetType: 'parent',
            style: '1px solid #88aaff',
        });
    }
    if (trait.parent) {
        const style = trait.parent.traits.length === trait.parent.numNeeded ? '1px solid #88aaff' : '1px dashed #88aaff';
        for (const parent of trait.parent.traits) {
            connections.push({
                target: parent,
                targetType: 'parent',
                style: style,
            });
        }
    }
    trait.exclusive.forEach(e => {
        connections.push({
            target: e,
            targetType: 'related',
            style: "1px solid red",
        });
    });
    const position = getTraitPosition(trait, positionByTraitId, mio, []);
    return {
        id: trait.id,
        htmlId: 'trait_' + trait.id,
        classNames: 'trait',
        gridX: position.x,
        gridY: position.y,
        connections,
    };
}
window.addEventListener('load', tryRun(async function() {
    // Mio selection
    const mioSelect = document.getElementById('mios') as HTMLSelectElement | null;
    if (mioSelect) {
        mioSelect.value = selectedMioIndex.toString();
        mioSelect.addEventListener('change', () => {
            selectedMioIndex = parseInt(mioSelect.value);
            setState({ selectedMioIndex });
            updateSelectedMio(true);
        });
    }
    // Conditions
    const conditionsElement = document.getElementById('conditions') as HTMLDivElement | null;
    if (conditionsElement) {
        conditions = new DivDropdown(conditionsElement, true);
        conditions.selectedValues$.next(selectedExprs.map(e => `${e.scopeName}!|${e.nodeContent}`));
        conditions.selectedValues$.subscribe(async (selection) => {
            selectedExprs = selection.map<ConditionItem>(selection => {
                const index = selection.indexOf('!|');
                if (index === -1) {
                    return {
                        scopeName: '',
                        nodeContent: selection,
                    };
                } else {
                    return {
                        scopeName: selection.substring(0, index),
                        nodeContent: selection.substring(index + 2),
                    };
                }
            });
            setState({ selectedExprs });
            await buildContent();
        });
    }
    // Zoom
    const contentElement = document.getElementById('miopreviewcontent') as HTMLDivElement;
    enableZoom(contentElement, 0, 40);
    // Toggle warnings
    const showWarnings = document.getElementById('show-warnings') as HTMLButtonElement;
    if (showWarnings) {
        const warnings = document.getElementById('warnings-container') as HTMLDivElement;
        showWarnings.addEventListener('click', () => {
            const visible = warnings.style.display === 'block';
            document.body.style.overflow = visible ? '' : 'hidden';
            warnings.style.display = visible ? 'none' : 'block';
        });
    }
    updateSelectedMio(false);
    await buildContent();
    scrollToState();
}));
```

## File: webviewsrc/techtree.ts
```typescript
import { setState, getState, scrollToState, tryRun, subscribeRefreshButton } from "./util/common";
function folderChange(folder: string) {
    const elements = document.getElementsByClassName('techfolder');
    setState({ folder: folder });
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i] as HTMLDivElement;
        element.style.display = element.id === folder ? 'block' : 'none';
    }
}
window.addEventListener('load', tryRun(function() {
    const element = document.getElementById('folderSelector') as HTMLSelectElement;
    const folder = getState().folder || element.value;
    element.value = folder;
    folderChange(folder);
    scrollToState();
    subscribeRefreshButton();
    element.addEventListener('change', function() {
        folderChange(this.value);
    });
}));
```

## File: webviewsrc/util/event.ts
```typescript
import { BehaviorSubject, fromEvent, Subscription } from 'rxjs';
export type Disposable = { dispose(): void };
export function toDisposable(...subscription: Subscription[]): Disposable {
    return {
        dispose: () => subscription.forEach(s => s.unsubscribe())
    };
}
export class Subscriber implements Disposable {
    private rxjsSubscriptions: Subscription[] = [];
    private subscriptions: Disposable[] = [];
    addSubscription(subscription: Subscription | Disposable): void {
        if ('dispose' in subscription) {
            this.subscriptions.push(subscription);
        } else {
            this.rxjsSubscriptions.push(subscription);
        }
    }
    dispose(): void {
        this.subscriptions.forEach(s => s.dispose());
        toDisposable(...this.rxjsSubscriptions).dispose();
    }
}
export function toBehaviorSubject<T extends string>(element: HTMLSelectElement | HTMLInputElement, initialValue?: T): BehaviorSubject<T> {
    if (initialValue !== undefined) {
        element.value = initialValue;
    }
    const disposables: Subscription[] = [];
    const observable = new BehaviorSubject<T>(element.value as T);
    let changing = false;
    disposables.push(observable.subscribe({
        next: v => {
            if (changing) {
                return;
            }
            changing = true;
            element.value = v;
            changing = false;
        },
        complete: () => {
            disposables.forEach(d => d.unsubscribe());
        }
    }));
    disposables.push(fromEvent(element, 'change').subscribe(() => {
        if (changing) {
            return;
        }
        changing = true;
        observable.next(element.value as T);
        changing = false;
    }));
    return observable;
}
```

## File: webviewsrc/util/telemetry.ts
```typescript
import TelemetryReporter from "@vscode/extension-telemetry";
import { vscode } from "./vscode";
import { TelemetryMessage } from "../../src/util/telemetry";
export const sendEvent: TelemetryReporter['sendTelemetryEvent'] = (...args) => {
    const telemetryMessage: TelemetryMessage = {
        command: 'telemetry',
        telemetryType: 'event',
        args,
    };
    vscode.postMessage(telemetryMessage);
};
export const sendError: TelemetryReporter['sendTelemetryErrorEvent'] = (...args) => {
    const telemetryMessage: TelemetryMessage = {
        command: 'telemetry',
        telemetryType: 'error',
        args,
    };
    vscode.postMessage(telemetryMessage);
};
export const sendException: TelemetryReporter['sendTelemetryException'] = (error, ...args) => {
    const telemetryMessage: TelemetryMessage = {
        command: 'telemetry',
        telemetryType: 'exception',
        args: [ serializeError(error), ...args ],
    };
    vscode.postMessage(telemetryMessage);
};
function serializeError(error: Error): Error {
    return {
        name: error.name,
        message: error.message,
        stack: error.stack,
    };
}
```

## File: src/previewdef/mio/contentbuilder.ts
```typescript
import * as vscode from 'vscode';
import { getSpriteByGfxName, Image, getImageByPath } from '../../util/image/imagecache';
import { localize, i18nTableAsScript } from '../../util/i18n';
import { forceError, randomString } from '../../util/common';
import { HOIPartial, toNumberLike, toStringAsSymbolIgnoreCase } from '../../hoiformat/schema';
import { html, htmlEscape } from '../../util/html';
import { GridBoxType } from '../../hoiformat/gui';
import { MioLoader } from './loader';
import { LoaderSession } from '../../util/loader/loader';
import { debug } from '../../util/debug';
import { StyleTable, normalizeForStyle } from '../../util/styletable';
import { Mio, MioTrait, TraitEffect } from './schema';
import { getLocalisedTextQuick } from "../../util/localisationIndex";
import { localisationIndex } from "../../util/featureflags";
const defaultTraitIcon = 'gfx/interface/goals/goal_unknown.dds';
const traitEffectIconMap: Record<TraitEffect, string> = {
    equiment: 'GFX_design_team_icon',
    production: 'GFX_industrial_manufacturer_icon',
    organization: 'GFX_organization_modifier_icon',
};
export async function renderMioFile(loader: MioLoader, uri: vscode.Uri, webview: vscode.Webview): Promise<string> {
    const setPreviewFileUriScript = { content: `window.previewedFileUri = "${uri.toString()}";` };
    try {
        const session = new LoaderSession(false);
        const loadResult = await loader.load(session);
        const loadedLoaders = Array.from((session as any).loadedLoader).map<string>(v => (v as any).toString());
        debug('Loader session mio', loadedLoaders);
        const mios = loadResult.result.mios;
        if (mios.length === 0) {
            const baseContent = localize('miopreview.nomio', 'No military industrial organization defined.');
            return html(webview, baseContent, [ setPreviewFileUriScript ], []);
        }
        mios.sort((a, b) => a.id.localeCompare(b.id));
        const styleTable = new StyleTable();
        const jsCodes: string[] = [];
        const styleNonce = randomString(32);
        const baseContent = await renderMios(mios, styleTable, loadResult.result.gfxFiles, jsCodes, styleNonce, loader.file);
        jsCodes.push(i18nTableAsScript());
        return html(
            webview,
            baseContent,
            [
                setPreviewFileUriScript,
                ...jsCodes.map(c => ({ content: c })),
                'common.js',
                'miopreview.js',
            ],
            [
                'codicon.css',
                'common.css',
                styleTable,
                { nonce: styleNonce },
            ],
        );
    } catch (e) {
        const baseContent = `${localize('error', 'Error')}: <br/>  <pre>${htmlEscape(forceError(e).toString())}</pre>`;
        return html(webview, baseContent, [ setPreviewFileUriScript ], []);
    }
}
const leftPadding = 50;
const topPadding = 50;
const xGridSize = 87;
const yGridSize = 117;
async function renderMios(mios: Mio[], styleTable: StyleTable, gfxFiles: string[], jsCodes: string[], styleNonce: string, file: string): Promise<string> {
    const gridBox: HOIPartial<GridBoxType> = {
        position: { x: toNumberLike(leftPadding), y: toNumberLike(topPadding) },
        format: toStringAsSymbolIgnoreCase('up'),
        size: { width: toNumberLike(xGridSize), height: undefined },
        slotsize: { width: toNumberLike(xGridSize), height: toNumberLike(yGridSize) },
    } as HOIPartial<GridBoxType>;
    const renderedTrait: Record<string, Record<string, string>> = {};
    for (const mio of mios) {
        const renderedTraitForMio: Record<string, string> = {};
        renderedTrait[mio.id] = renderedTraitForMio;
        await Promise.all(Object.values(mio.traits).map(async (trait) =>
            renderedTraitForMio[trait.id] = (await renderTrait(trait, styleTable, gfxFiles, file)).replace(/\s\s+/g, ' ')));
    }
    jsCodes.push('window.mios = ' + JSON.stringify(mios));
    jsCodes.push('window.renderedTrait = ' + JSON.stringify(renderedTrait));
    jsCodes.push('window.gridBox = ' + JSON.stringify(gridBox));
    jsCodes.push('window.styleNonce = ' + JSON.stringify(styleNonce));
    jsCodes.push('window.xGridSize = ' + xGridSize);
    return (
        `<div id="dragger" class="${styleTable.oneTimeStyle('dragger', () => `
            width: 100vw;
            height: 100vh;
            position: fixed;
            left:0;
            top:0;
        `)}"></div>` +
        `<div id="miopreviewcontent" class="${styleTable.oneTimeStyle('miopreviewcontent', () => `top:40px;left:-20px;position:relative`)}">
            <div id="miopreviewplaceholder"></div>
        </div>` +
        renderWarningContainer(styleTable) +
        await renderToolBar(mios, styleTable)
    );
}
function renderWarningContainer(styleTable: StyleTable) {
    styleTable.style('warnings', () => 'outline: none;', ':focus');
    return `
    <div id="warnings-container" class="${styleTable.style('warnings-container', () => `
        height: 100vh;
        width: 100vw;
        position: fixed;
        top: 0;
        left: 0;
        padding-top: 40px;
        background: var(--vscode-editor-background);
        box-sizing: border-box;
        display: none;
    `)}">
        <textarea id="warnings" readonly wrap="off" class="${styleTable.style('warnings', () => `
            height: 100%;
            width: 100%;
            font-family: 'Consolas', monospace;
            resize: none;
            background: var(--vscode-editor-background);
            padding: 10px;
            border-top: none;
            border-left: none;
            border-bottom: none;
            box-sizing: border-box;
        `)}"></textarea>
    </div>`;
}
async function renderToolBar(mios: Mio[], styleTable: StyleTable): Promise<string> {
    const mioSelect = mios.length <= 1 ? '' : `
        <label for="mios" class="${styleTable.style('miosLabel', () => `margin-right:5px`)}">${localize('miopreview.mio', 'Military Industrial Organization: ')}</label>
        <div class="select-container ${styleTable.style('marginRight10', () => `margin-right:10px`)}">
            <select id="mios" class="select multiple-select" tabindex="0" role="combobox">
                ${await Promise.all(mios.map(async (mio, i) => {
                    const localizedText = localisationIndex ? `(${mio.id}) ${await getLocalisedTextQuick(mio.id)}` : mio.id;
                    return `<option value="${i}">${localizedText}</option>`;
                })).then(options => options.join(''))}
            </select>
        </div>`;
    const conditions = `
        <div id="condition-container">
            <label for="conditions" class="${styleTable.style('conditionsLabel', () => `margin-right:5px`)}">${localize('miopreview.conditions', 'Conditions: ')}</label>
            <div class="select-container ${styleTable.style('marginRight10', () => `margin-right:10px`)}">
                <div id="conditions" class="select multiple-select" tabindex="0" role="combobox" class="${styleTable.style('conditionsLabel', () => `max-width:400px`)}">
                    <span class="value"></span>
                </div>
            </div>
        </div>`;
    const warningsButton = mios.every(mio => mio.warnings.length === 0) ? '' : `
        <button id="show-warnings" title="${localize('miopreview.warnings', 'Toggle warnings')}">
            <i class="codicon codicon-warning"></i>
        </button>`;
    return `<div class="toolbar-outer ${styleTable.style('toolbar-height', () => `box-sizing: border-box; height: 40px;`)}">
        <div class="toolbar">
            ${mioSelect}
            ${conditions}
            ${warningsButton}
        </div>
    </div>`;
}
async function renderTrait(trait: MioTrait, styleTable: StyleTable, gfxFiles: string[], file: string): Promise<string> {
    const traitIcon = trait.icon;
    if (traitIcon) {
        const iconObject = traitIcon ? await getTraitIcon(traitIcon, gfxFiles) : null;
        styleTable.style('trait-icon-' + normalizeForStyle(traitIcon ?? '-empty'), () => 
            `${iconObject ? `background-image: url(${iconObject.uri});` : 'background: grey;'}
            background-size: ${iconObject ? iconObject.width: 0}px;`
        );
    }
    styleTable.style('trait-icon-' + normalizeForStyle('-empty'), () => 'background: grey;');
    styleTable.raw(`.${styleTable.name('trait-common')}:hover .${styleTable.name('trait-span')}`, `display:inline-block;`);
    styleTable.raw(`.${styleTable.name('trait-common')}:hover .${styleTable.name('trait-span-display')}`, `margin-top: -12px;`);
    const traitBg = await getSpriteByGfxName(trait.specialTraitBackground ? 'GFX_country_spefific_org_trait_button' : 'GFX_industrial_org_trait_button', gfxFiles);
    return `<div
    class="
        ${styleTable.style(trait.specialTraitBackground ? 'trait-bg-special' : 'trait-bg-normal',
            () => traitBg ? `background-image: url(${(traitBg.frames[2] ?? traitBg.image).uri});` : '')}
        ${styleTable.style('trait-background', () => `
            background-position-x: center;
            background-position-y: center;
            background-repeat: no-repeat;
            width: 100%;
            height: 100%;
            text-align: center;
            cursor: pointer;
        `)}"
    >
        <div
        class="
            navigator
            ${styleTable.name('trait-icon-' + normalizeForStyle(traitIcon ?? '-empty'))}
            ${styleTable.style('trait-common', () => `
                background-position-x: center;
                background-position-y: calc(50% - 8px);
                background-repeat: no-repeat;
                width: 100%;
                height: 100%;
                text-align: center;
                cursor: pointer;
            `)}
        "
        start="${trait.token?.start}"
        end="${trait.token?.end}"
        ${file === trait.file ? '' : `file="${trait.file}"`}
        title="${trait.id}${localisationIndex ? `\n${await getLocalisedTextQuick(trait.name)}` : ''}\n({{position}})">
            <div class="
                ${styleTable.style('effect-host', () => `
                    text-align: center;
                    position: absolute;
                    width: 100%;
                    top: 73px;
                `)}
            ">
                ${(await Promise.all(trait.effects.map(async (effect) => `
                <span class="
                    ${await styleTable.style('effect-icon-' + effect, async () => {
                        const icon = await getTraitIcon(traitEffectIconMap[effect], gfxFiles);
                        return icon ? `background-image: url(${icon.uri}); width: ${icon.width}px; height: ${icon.height}px;` : '';
                    })}
                    ${styleTable.style('effect-icon', () => `
                        display: inline-block;
                    `)}
                ">
                &nbsp;
                </span>
                `))).join('')}
            </div>
            <span
            class="${styleTable.style('trait-span', () => `
                margin: 10px -400px;
                margin-top: 95px;
                text-align: center;
                display: none;
                position: relative;
                z-index: 5;
            `)}">
            ${trait.id}
            </span>
            <br/>
            <span
            class="${styleTable.style('trait-span-display', () => `
                margin: 10px -400px;
                margin-top: 84px;
                text-align: center;
                display: inline-block;
                position: relative;
                z-index: 5;
            `)}">
            ${localisationIndex ? `${await getLocalisedTextQuick(trait.name)}` : ''}
            </span>
        </div>
    </div>`;
}
export async function getTraitIcon(name: string, gfxFiles: string[]): Promise<Image | undefined> {
    const sprite = await getSpriteByGfxName(name, gfxFiles);
    if (sprite !== undefined) {
        return sprite.image;
    }
    return await getImageByPath(defaultTraitIcon);
}
```

## File: src/previewdef/technology/loader.ts
```typescript
import { TechnologyTree, getTechnologyTrees } from "./schema";
import { HOIPartial } from "../../hoiformat/schema";
import { GuiFile } from "../../hoiformat/gui";
import { ContentLoader, Dependency, LoadResultOD, LoaderSession, mergeInLoadResult } from "../../util/loader/loader";
import { parseHoi4File } from "../../hoiformat/hoiparser";
import { localize } from "../../util/i18n";
import { flatMap, chain } from "lodash";
import { GuiFileLoader } from "../gui/loader";
export interface TechnologyTreeLoaderResult {
    technologyTrees: TechnologyTree[];
    guiFiles: { file: string, data: HOIPartial<GuiFile> }[];
    gfxFiles: string[];
}
const technologyUIGfxFiles = ['interface/countrytechtreeview.gfx', 'interface/countrytechnologyview.gfx'];
const technologiesGFX = 'interface/technologies.gfx';
const relatedGfxFiles = [...technologyUIGfxFiles, technologiesGFX];
const guiFilePath = ['interface/countrytechtreeview.gui', 'interface/countrydoctrinetreeview.gui'];
export class TechnologyTreeLoader extends ContentLoader<TechnologyTreeLoaderResult> {
    protected async postLoad(content: string | undefined, dependencies: Dependency[], error: any, session: LoaderSession): Promise<LoadResultOD<TechnologyTreeLoaderResult>> {
        if (error || (content === undefined)) {
            throw error;
        }
        const gfxDependencies = [...relatedGfxFiles, ...dependencies.filter(d => d.type === 'gfx').map(d => d.path)];
        const technologyTrees = getTechnologyTrees(parseHoi4File(content, localize('infile', 'In file {0}:\n', this.file)));
        const guiDependencies = [...guiFilePath, ...dependencies.filter(d => d.type === 'gui').map(d => d.path)];
        const guiDepFiles = await this.loaderDependencies.loadMultiple(guiDependencies, session, GuiFileLoader);
        return {
            result: {
                technologyTrees,
                gfxFiles: chain(gfxDependencies).concat(flatMap(guiDepFiles, r => r.result.gfxFiles)).uniq().value(),
                guiFiles: chain(guiDepFiles).flatMap(r => r.result.guiFiles).uniq().value(),
            },
            dependencies: chain([this.file]).concat(gfxDependencies, guiDependencies, mergeInLoadResult(guiDepFiles, 'dependencies')).uniq().value(),
        };
    }
    public toString() {
        return `[TechnologyTreeLoader ${this.file}]`;
    }
}
```

## File: src/previewdef/worldmap/loader/common.ts
```typescript
import { Zone, Point, Region, MapLoaderExtra } from "../definitions";
import { DetailValue, Enum } from '../../../hoiformat/schema';
import { clipNumber, hsvToRgb } from '../../../util/common';
import { Loader as CommonLoader, FileLoader as CommonFileLoader, FolderLoader as CommonFolderLoader, mergeInLoadResult as commonMergeInLoadResult, LoadResult as CommonLoadResult, LoadResultOD as CommonLoadResultOD } from '../../../util/loader/loader';
import { maxBy } from "lodash";
export abstract class Loader<T> extends CommonLoader<T, MapLoaderExtra> {}
export abstract class FileLoader<T> extends CommonFileLoader<T, MapLoaderExtra> {}
export abstract class FolderLoader<T, F> extends CommonFolderLoader<T, F, MapLoaderExtra, MapLoaderExtra> {}
export const mergeInLoadResult = commonMergeInLoadResult;
export type LoadResult<T> = CommonLoadResult<T, MapLoaderExtra>;
export type LoadResultOD<T> = CommonLoadResultOD<T, MapLoaderExtra>;
export function pointEqual(a: Point, b: Point): boolean {
    return a.x === b.x && a.y === b.y;
}
export function convertColor(color: DetailValue<Enum> | undefined): number {
    if (!color) {
        return 0;
    }
    const vec = color._value._values.map(e => parseFloat(e));
    if (vec.length < 3) {
        return 0;
    }
    if (!color._attachment || color._attachment.toLowerCase() === 'rgb') {
        let [ r, g, b ] = vec;
        r = clipNumber(r, 0, 255);
        g = clipNumber(g, 0, 255);
        b = clipNumber(b, 0, 255);
        return (r << 16) | (g << 8) | b;
    }
    if (color._attachment.toLowerCase() === 'hsv') {
        const { r, g, b } = hsvToRgb(vec[0], vec[1], vec[2]);
        return (r << 16) | (g << 8) | b;
    }
    return 0;
}
export function sortItems<T extends { id: number }>(
    items: T[],
    validMaxId: number,
    onMaxIdTooLarge: (maxId: number) => void,
    onConflict: (newItem: T, existingItem: T, badId: number) => void,
    onNotExist: (startId: number, endId: number) => void,
    reassignMinusOneId: boolean = true,
    badId: number = -1,
): { sorted: T[], badId: number } {
    const maxId = maxBy(items, 'id')?.id ?? 0;
    if (maxId > validMaxId) {
        onMaxIdTooLarge(maxId);
    }
    const result: T[] = new Array(maxId + 1);
    items.forEach(p => {
        if (reassignMinusOneId && p.id === -1) {
            p.id = badId--;
        }
        if (result[p.id]) {
            const conflictItem = result[p.id];
            onConflict(p, conflictItem, badId);
            conflictItem.id = badId--;
            result[conflictItem.id] = conflictItem;
        }
        result[p.id] = p;
    });
    let lastNotExistStateId: number | undefined = undefined;
    for (let i = 1; i <= maxId; i++) {
        if (result[i]) {
            if (lastNotExistStateId !== undefined) {
                onNotExist(lastNotExistStateId, i - 1);
                lastNotExistStateId = undefined;
            }
        } else {
            if (lastNotExistStateId === undefined) {
                lastNotExistStateId = i;
            }
        }
    };
    return {
        sorted: result,
        badId,
    };
}
export function mergeRegion<K extends string, T extends { [k in K]: number[] }>(
    input: T,
    subRegionIdType: K,
    subRegions: (Region | undefined | null)[],
    width: number,
    onRegionNotExist: (regionId: number) => void,
    onNoRegion: () => void
): T & Region {
    const regionsInInput = input[subRegionIdType]
        .map(r => {
            const region = subRegions[r];
            if (!region) {
                onRegionNotExist(r);
            }
            return region;
        })
        .filter((r): r is Region => !!r);
    let result: T & Region;
    if (regionsInInput.length > 0) {
        result = Object.assign(input, mergeRegions(regionsInInput, width));
    } else {
        result = Object.assign(input, { boundingBox: { x: 0, y: 0, w: 0, h: 0 }, centerOfMass: { x: 0, y: 0 }, mass: 0 });
        if (input[subRegionIdType].length > 0) {
            onNoRegion();
        }
    }
    return result;
}
export function mergeRegions(regions: (Zone | Region)[], width: number): Region {
    const oneFourthWidth = 0.25 * width;
    const halfWidth = 0.5 * width;
    const threeFourthWidth = 0.75 * width;
    const nearBorder = regions.map(r => 'mass' in r ? r.boundingBox : r).every(z => z.w + z.x < oneFourthWidth || z.x > threeFourthWidth);
    let massX = 0;
    let massY = 0;
    let mass = 0;
    let minX = 1e10;
    let minY = 1e10;
    let maxX = -1e10;
    let maxY = -1e10;
    for (const region of regions) {
        let regionBondingBox: Zone;
        if ('mass' in region) {
            massX += (region.centerOfMass.x + (nearBorder && region.centerOfMass.x > halfWidth ? -width : 0)) * region.mass;
            massY += region.centerOfMass.y * region.mass;
            mass += region.mass;
            regionBondingBox = region.boundingBox;
        } else {
            const regionMass = region.h * region.w;
            massX += ((region.x + region.w / 2) + (nearBorder && region.x + region.w / 2 > halfWidth ? -width : 0)) * regionMass;
            massY += (region.y + region.h / 2) * regionMass;
            mass += regionMass;
            regionBondingBox = region;
        }
        minX = Math.min(minX, regionBondingBox.x + (nearBorder && regionBondingBox.x > halfWidth ? -width : 0));
        minY = Math.min(minY, regionBondingBox.y);
        maxX = Math.max(maxX, regionBondingBox.x + regionBondingBox.w + (nearBorder && regionBondingBox.x > halfWidth ? -width : 0));
        maxY = Math.max(maxY, regionBondingBox.y + regionBondingBox.h);
    }
    let x = massX / mass;
    if (x < 0) {
        x += width;
    }
    if (minX < 0) {
        minX += width;
        maxX += width;
    }
    return {
        boundingBox: { x: minX, y: minY, w: maxX - minX, h: maxY - minY },
        centerOfMass: { x, y: massY / mass },
        mass,
    };
}
export function addPointToZone(zone: Zone, point: Point): void {
    if (point.x < zone.x) {
        zone.w += zone.x - point.x;
        zone.x = point.x;
    } else if (point.x >= zone.x + zone.w) {
        zone.w = point.x - zone.x + 1;
    }
    if (point.y < zone.y) {
        zone.h += zone.y - point.y;
        zone.y = point.y;
    } else if (point.y >= zone.y + zone.h) {
        zone.h = point.y - zone.y + 1;
    }
}
```

## File: src/previewdef/worldmap/loader/railway.ts
```typescript
import { readFileFromModOrHOI4 } from "../../../util/fileloader";
import { localize } from "../../../util/i18n";
import { LoaderSession } from "../../../util/loader/loader";
import { Province, Railway, SupplyNode, WorldMapWarning } from "../definitions";
import { FileLoader, LoadResult, LoadResultOD } from "./common";
import { DefaultMapLoader } from "./provincemap";
type RailwayLoaderResult = { railways: Railway[]; };
export class RailwayLoader extends FileLoader<RailwayLoaderResult> {
    constructor(private defaultMapLoader: DefaultMapLoader) {
        super("map/railways.txt");
    }
    public async shouldReloadImpl(session: LoaderSession): Promise<boolean> {
        return await super.shouldReloadImpl(session) || await this.defaultMapLoader.shouldReload(session);
    }
    protected async loadImpl(session: LoaderSession): Promise<LoadResult<RailwayLoaderResult>> {
        await this.fireOnProgressEvent(localize('worldmap.progress.loadingrailways', 'Loading railways...'));
        return super.loadImpl(session);
    }
    protected async loadFromFile(session: LoaderSession): Promise<LoadResultOD<RailwayLoaderResult>> {
        const provinceMap = await this.defaultMapLoader.load(session);
        const warnings: WorldMapWarning[] = [];
        return {
            result: {
                railways: await loadRailway(provinceMap.result.provinces, this.file, warnings)
            },
            warnings,
        };
    }
    public toString() {
        return `[RailwayLoader: ${this.file}]`;
    }
}
async function loadRailway(provinces: (Province | null | undefined)[], file: string, warnings: WorldMapWarning[]): Promise<Railway[]> {
    const [railwaysBuffer] = await readFileFromModOrHOI4(file);
    const railwaysRaw = railwaysBuffer.toString().split(/(?:\r\n|\n|\r)/).map(line => line.trimLeft().split(/\s+/).map(v => parseInt(v))).filter(v => v.length >= 3);
    const railways = railwaysRaw.map((line, index) => {
        if (line[1] + 2 > line.length) {
            warnings.push({
                source: [{ type: 'railway', id: index }],
                relatedFiles: [file],
                text: localize('worldmap.warnings.railwaylinecountnotenough', 'Not enough provinces in railway: {0}', line),
            });
        }
        return {
            level: line[0],
            provinces: line.slice(2, Math.min(line[1] + 2, line.length)),
        };
    });
    validateRailways(provinces, file, railways, warnings);
    return railways;
}
function validateRailways(provinces: (Province | null | undefined)[], file: string, railways: Railway[], warnings: WorldMapWarning[]): void {
    railways.forEach(railway => {
        railway.provinces.forEach((provinceId, index) => {
            const province = provinces[provinceId];
            if (!province) {
                warnings.push({
                    source: [{ type: 'railway', id: index }, { type: 'province', id: provinceId, color: 0 }],
                    text: localize('worldmap.warnings.provincenotexist', 'Province with id {0} doesn\'t exist.', provinceId),
                    relatedFiles: [file],
                });
            } else if (index > 0) {
                const lastProvinceId = railway.provinces[index - 1];
                const hasEdge = province.edges.filter(e => e.to === lastProvinceId && e.type !== 'impassable').length > 0;
                if (!hasEdge) {
                    warnings.push({
                        source: [{ type: 'railway', id: index }, { type: 'province', id: provinceId, color: 0 }, { type: 'province', id: lastProvinceId, color: 0 }],
                        text: localize('worldmap.warnings.provincenotadjacent', 'Province {0}, {1} are not adjacent.', provinceId, lastProvinceId),
                        relatedFiles: [file],
                    });
                }
            }
        });
    });
}
type SupplyNodeLoaderResult = { supplyNodes: SupplyNode[]; };
export class SupplyNodeLoader extends FileLoader<SupplyNodeLoaderResult> {
    constructor(private defaultMapLoader: DefaultMapLoader) {
        super("map/supply_nodes.txt");
    }
    public async shouldReloadImpl(session: LoaderSession): Promise<boolean> {
        return await super.shouldReloadImpl(session) || await this.defaultMapLoader.shouldReload(session);
    }
    protected async loadImpl(session: LoaderSession): Promise<LoadResult<SupplyNodeLoaderResult>> {
        await this.fireOnProgressEvent(localize('worldmap.progress.loadingsupplynodes', 'Loading supply nodes...'));
        return super.loadImpl(session);
    }
    protected async loadFromFile(session: LoaderSession): Promise<LoadResultOD<SupplyNodeLoaderResult>> {
        const provinceMap = await this.defaultMapLoader.load(session);
        const warnings: WorldMapWarning[] = [];
        return {
            result: {
                supplyNodes: await loadSupplyNodes(provinceMap.result.provinces, this.file, warnings)
            },
            warnings,
        };
    }
    public toString() {
        return `[SupplyNodeLoader: ${this.file}]`;
    }
}
async function loadSupplyNodes(provinces: (Province | null | undefined)[], file: string, warnings: WorldMapWarning[]): Promise<SupplyNode[]> {
    const [supplyNodesBuffer] = await readFileFromModOrHOI4(file);
    const supplyNodesRaw = supplyNodesBuffer.toString().split(/(?:\r\n|\n|\r)/).map(line => line.split(/\s+/).map(v => parseInt(v))).filter(v => v.length >= 2);
    const supplyNodes = supplyNodesRaw.map((line, index) => {
        const provinceId = line[1];
        if (!provinces[provinceId]) {
            warnings.push({
                source: [{ type: 'supplynode', id: index }, { type: 'province', id: provinceId, color: 0 }],
                text: localize('worldmap.warnings.provincenotexist', 'Province with id {0} doesn\'t exist.', provinceId),
                relatedFiles: [file],
            });
        }
        return {
            level: line[0],
            province: provinceId,
        };
    });
    return supplyNodes;
}
```

## File: src/previewdef/worldmap/loader/river.ts
```typescript
import { readFileFromModOrHOI4 } from "../../../util/fileloader";
import { localize } from "../../../util/i18n";
import { BMP, parseBmp } from "../../../util/image/bmp/bmpparser";
import { ProgressReporter, River, RiverBmp, WorldMapWarning, Zone } from "../definitions";
import { FileLoader, LoadResult, LoadResultOD, addPointToZone } from "./common";
export class RiverLoader extends FileLoader<RiverBmp> {
    protected async loadFromFile(): Promise<LoadResultOD<RiverBmp>> {
        const warnings: WorldMapWarning[] = [];
        return {
            result: await loadRivers(this.file, e => this.fireOnProgressEvent(e), warnings),
            warnings,
        };
    }
    protected extraMesurements(result: LoadResult<RiverBmp>) {
        return {
            ...super.extraMesurements(result),
            riverCount: result.result.rivers.length,
        };
    }
    public toString() {
        return `[RiverLoader: ${this.file}]`;
    }
}
async function loadRivers(file: string, progressReporter: ProgressReporter, warnings: WorldMapWarning[]): Promise<RiverBmp> {
    progressReporter(localize('worldmap.progress.loadingrivers', 'Loading rivers...'));
    const [riversImageBuffer] = await readFileFromModOrHOI4(file);
    const riversImage = parseBmp(riversImageBuffer.buffer, riversImageBuffer.byteOffset);
    const result: RiverBmp = {
        width: riversImage.width,
        height: riversImage.height,
        rivers: [],
    };
    if (riversImage.bitsPerPixel !== 8) {
        warnings.push({
            relatedFiles: [file],
            text: localize('worldmap.warning.riverimagebpp', 'The rivers image should be 8 bits per pixel, but it is {0}.', riversImage.bitsPerPixel),
            source: [{ type: 'river', name: '', index: -1 }]
        });
        return result;
    }
    const rivers = findRiverPointsList(riversImage);
    result.rivers = rivers;
    validateRivers(file, rivers, warnings);
    return result;
}
function findRiverPointsList(riversImage: BMP): River[] {
    const result: River[] = [];
    for (let y = riversImage.height - 1, sy = 0, dy = (riversImage.height - 1) * riversImage.width;
        y >= 0;
        y--, sy += riversImage.bytesPerRow, dy -= riversImage.width) {
        for (let x = 0, sx = sy, dx = dy; x < riversImage.width; x++, sx++, dx++) {
            const color = riversImage.data[sx];
            if (color > 11) {
                continue;
            }
            result.push(findRiverPoints(x, y, riversImage));
        }
    }
    return result;
}
function findRiverPoints(startX: number, startY: number, riversImage: BMP): River {
    const colors: Record<number, number> = {};
    const ends: number[] = [];
    const boundingBox: Zone = { x: startX, y: startY, w: 1, h: 1 };
    const stack: { x: number; y: number; }[] = [];
    stack.push({ x: startX, y: startY });
    let firstPoint = true;
    while (stack.length > 0) {
        const point = stack.pop()!;
        const { x, y } = point;
        const si = (riversImage.height - 1 - y) * riversImage.bytesPerRow + x;
        const di = y * riversImage.width + x;
        colors[di] = riversImage.data[si];
        riversImage.data[si] = 255;
        let adjecents = 0;
        if (x > 0 && riversImage.data[si - 1] <= 11) {
            stack.push({ x: x - 1, y });
            adjecents++;
        }
        if (x < riversImage.width - 1 && riversImage.data[si + 1] <= 11) {
            stack.push({ x: x + 1, y });
            adjecents++;
        }
        if (y > 0 && riversImage.data[si + riversImage.bytesPerRow] <= 11) {
            stack.push({ x, y: y - 1 });
            adjecents++;
        }
        if (y < riversImage.height - 1 && riversImage.data[si - riversImage.bytesPerRow] <= 11) {
            stack.push({ x, y: y + 1 });
            adjecents++;
        }
        if (adjecents === 0 || (adjecents === 1 && firstPoint)) {
            ends.push(di);
        }
        addPointToZone(boundingBox, point);
        firstPoint = false;
    }
    const convertedColors: Record<number, number> = {};
    for (const key in colors) {
        const value = colors[key];
        const di = parseInt(key, 10);
        const x = di % riversImage.width;
        const y = Math.floor(di / riversImage.width);
        convertedColors[(y - boundingBox.y) * boundingBox.w + (x - boundingBox.x)] = value;
    }
    const convertedEnds: number[] = [];
    for (const end of ends) {
        const x = end % riversImage.width;
        const y = Math.floor(end / riversImage.width);
        convertedEnds.push((y - boundingBox.y) * boundingBox.w + (x - boundingBox.x));
    }
    return {
        colors: convertedColors,
        ends: convertedEnds,
        boundingBox,
    };
}
function validateRivers(file: string, rivers: River[], warnings: WorldMapWarning[]) {
    for (let i = 0; i < rivers.length; i++) {
        validateRiver(file, i, rivers[i], warnings);
    }
}
function validateRiver(file: string, index: number, river: River, warning: WorldMapWarning[]) {
    if (river.ends.length === 0) {
        warning.push({
            relatedFiles: [file],
            text: localize('worldmap.warning.rivernoends', 'River has no end points.'),
            source: [{ type: 'river', name: riverToString(river), index: index }]
        });
    }
    const sources = river.ends.filter(end => river.colors[end] === 0);
    if (sources.length === 0) {
        warning.push({
            relatedFiles: [file],
            text: localize('worldmap.warning.rivernosource', 'River has no source. Its end points are: {0}.', river.ends.map(e => riverToString(river, e)).join(', ')),
            source: [{ type: 'river', name: riverToString(river, river.ends[0]), index: index }]
        });
    }
    if (sources.length > 1) {
        warning.push({
            relatedFiles: [file],
            text: localize('worldmap.warning.rivermultiplesource', 'River has multiple sources: {0}.', sources.map(s => riverToString(river, s)).join(', ')),
            source: [{ type: 'river', name: riverToString(river, sources[0]), index: index }]
        });
    }
    if (sources.length > 0) {
        const nonSourceEnds = river.ends.filter(end => river.colors[end] !== 0);
        for (const end of nonSourceEnds) {
            validateJoiningRiver(file, index, river, end, warning);
        }
    }
}
function validateJoiningRiver(file: string, index: number, river: River, end: number, warning: WorldMapWarning[]) {
    if (river.colors[end] === undefined || river.colors[end] <= 2 || river.colors[end] > 11) {
        return;
    }
    let current = end;
    const searched: Record<number, boolean> = {};
    const candidates = [];
    while (true) {
        candidates.length = 0;
        if (current % river.boundingBox.w > 0) {
            candidates.push(current - 1);
        }
        if (current % river.boundingBox.w < river.boundingBox.w - 1) {
            candidates.push(current + 1);
        }
        if (current >= river.boundingBox.w) {
            candidates.push(current - river.boundingBox.w);
        }
        if (current < river.boundingBox.w * (river.boundingBox.h - 1)) {
            candidates.push(current + river.boundingBox.w);
        }
        searched[current] = true;
        let next = -1;
        let adjecentToMark = false;
        for (const candidate of candidates) {
            if (searched[candidate]) {
                continue;
            }
            const candidateColor = river.colors[candidate];
            if (candidateColor === undefined) {
                continue;
            }
            if (candidateColor <= 2) {
                adjecentToMark = true;
                continue;
            }
            if (next === -1) {
                next = candidate;
            } else {
                warning.push({
                    relatedFiles: [file],
                    text: localize('worldmap.warning.rivernoflowinorout', 'River doesn\'t have flow-in or flow-out mark at {0}.', riverToString(river, current)),
                    source: [{ type: 'river', name: riverToString(river, end), index: index }]
                });
                return;
            }
        }
        if (next === -1) {
            if (!adjecentToMark) {
                warning.push({
                    relatedFiles: [file],
                    text: localize('worldmap.warning.rivermayloop', 'River may contain a loop at {0} ~ {1}.', riverToString(river, end), riverToString(river, current)),
                    source: [{ type: 'river', name: riverToString(river, end), index: index }]
                });
            }
            return;
        }
        current = next;
    }
}
function riverToString(river: River, point?: number) {
    if (point === undefined) {
        point = parseInt(Object.keys(river.colors)[0], 10);
    }
    const x = point % river.boundingBox.w + river.boundingBox.x;
    const y = Math.floor(point / river.boundingBox.w) + river.boundingBox.y;
    return `(${x}, ${y})`;
}
```

## File: src/util/common.ts
```typescript
import { debounce, DebounceSettings } from 'lodash';
export interface NumberSize {
    width: number;
    height: number;
}
export interface NumberPosition {
    x: number;
    y: number;
}
export interface Warning<T> {
    text: string;
    source: T;
}
export function arrayToMap<T, K extends keyof T>(items: T[], key: K):
    T[K] extends string ? Record<string, T> : T[K] extends number ? Record<number, T> : never;
export function arrayToMap<T, K extends keyof T, V>(items: T[], key: K, valueSelector: (value: T) => V):
    T[K] extends string ? Record<string, V> : T[K] extends number ? Record<number, V> : never;
export function arrayToMap<T, K extends keyof T, V = T>(items: T[], key: K, valueSelector?: (value: T) => V):
    T[K] extends string ? Record<string, V | T> : T[K] extends number ? Record<number, V | T> : never {
    const result: Record<string | number, V | T> = {};
    for (const item of items) {
        const id = item[key];
        if (typeof id !== 'string' && typeof id !== 'number') {
            throw new Error('key of arrayToMap must be a string or number type');
        }
        result[id] = valueSelector ? valueSelector(item) : item;
    }
    return result as any;
}
export function hsvToRgb(h: number, s: number, v: number): Record<'r'|'g'|'b', number> {
    var r: number, g: number, b: number, i: number, f: number, p: number, q: number, t: number;
    h = clipNumber(h, 0, 1);
    s = clipNumber(s, 0, 1);
    v = clipNumber(v, 0, 1);
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r! * 255),
        g: Math.round(g! * 255),
        b: Math.round(b! * 255)
    };
}
export function slice<T>(array: T[] | undefined, start: number, end: number): T[] {
    if (!array) {
        return [];
    }
    if (start >= 0) {
        return array.slice(start, end);
    } else {
        if (end <= start) {
            return [];
        }
        const result = new Array<T>(end - start);
        for (let i = start, j = 0; i < end; i++, j++) {
            result[j] = array[i];
        }
        return result;
    }
}
export function debounceByInput<TI extends any[], TO>(func: (...input: TI) => TO, keySelector: (...input: TI) => string, wait?: number, debounceSettings?: DebounceSettings): (...input: TI) => TO {
    const cachedMethods: Record<string, (input: TI) => TO> = {};
    function result(...input: TI): TO {
        const key = keySelector(...input);
        const method = cachedMethods[key];
        if (method) {
            return method(input);
        }
        const newMethod = debounce((input2) => {
            delete cachedMethods[key];
            return func(...input2);
        }, wait, debounceSettings);
        cachedMethods[key] = newMethod;
        return newMethod(input);
    }
    return result;
}
export function randomString(length: number, charset: string | undefined = undefined): string {
    var result = '';
    var characters = charset ?? 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (let i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
export function clipNumber(value: number, min: number, max: number): number {
    if (value < min) { return min; }
    if (value > max) { return max; }
    return value;
}
export class UserError extends Error {
    constructor (message: string) {
      super(message);
      this.name = 'UserError';
    }
}
export function forceError(e: unknown): Error {
    if (e instanceof Error || e instanceof UserError) {
        return e;
    }
    if (typeof e === 'string') {
        return new Error(e.toString());
    }
    return new Error();
}
```

## File: src/util/gfxindex.ts
```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import { parseHoi4File } from '../hoiformat/hoiparser';
import { getSpriteTypes } from '../hoiformat/spritetype';
import { debounceByInput, forceError, UserError } from './common';
import { error } from './debug';
import { gfxIndex } from './featureflags';
import { listFilesFromModOrHOI4, readFileFromModOrHOI4 } from './fileloader';
import { localize } from './i18n';
import { uniq } from 'lodash';
import { sendEvent } from './telemetry';
interface GfxIndexItem {
    file: string;
}
const globalGfxIndex: Record<string, GfxIndexItem | undefined> = {};
let workspaceGfxIndex: Record<string, GfxIndexItem | undefined> = {};
export function registerGfxIndex(): vscode.Disposable {
    const disposables: vscode.Disposable[] = [];
    if (gfxIndex) {
        const estimatedSize: [number] = [0];
        const task = Promise.all([ buildGlobalGfxIndex(estimatedSize), buildWorkspaceGfxIndex(estimatedSize) ]);
        vscode.window.setStatusBarMessage('$(loading~spin) ' + localize('gfxindex.building', 'Building GFX index...'), task);
        task.then(() => {
            vscode.window.showInformationMessage(localize('gfxindex.builddone', 'Building GFX index done.'));
            sendEvent('gfxIndex', { size: estimatedSize[0].toString() });
        });
        disposables.push(vscode.workspace.onDidChangeWorkspaceFolders(onChangeWorkspaceFolders));
        disposables.push(vscode.workspace.onDidChangeTextDocument(onChangeTextDocument));
        disposables.push(vscode.workspace.onDidCloseTextDocument(onCloseTextDocument));
        disposables.push(vscode.workspace.onDidCreateFiles(onCreateFiles));
        disposables.push(vscode.workspace.onDidDeleteFiles(onDeleteFiles));
        disposables.push(vscode.workspace.onDidRenameFiles(onRenameFiles));
    }
    return vscode.Disposable.from(...disposables);
}
export async function getGfxContainerFile(gfxName: string | undefined): Promise<string | undefined> {
    if (!gfxIndex || !gfxName) {
        return undefined;
    }
    return (globalGfxIndex[gfxName] ?? workspaceGfxIndex[gfxName])?.file;
}
export async function getGfxContainerFiles(gfxNames: (string | undefined)[]): Promise<string[]> {
    return uniq((await Promise.all(gfxNames.map(getGfxContainerFile))).filter((v): v is string => v !== undefined));
}
async function buildGlobalGfxIndex(estimatedSize: [number]): Promise<void> {
    const options = { mod: false, recursively: true };
    const gfxFiles = (await listFilesFromModOrHOI4('interface', options)).filter(f => f.toLocaleLowerCase().endsWith('.gfx'));
    await Promise.all(gfxFiles.map(f => fillGfxItems('interface/' + f, globalGfxIndex, options, estimatedSize)));
}
async function buildWorkspaceGfxIndex(estimatedSize: [number]): Promise<void> {
    const options = { hoi4: false, recursively: true };
    const gfxFiles = (await listFilesFromModOrHOI4('interface', options)).filter(f => f.toLocaleLowerCase().endsWith('.gfx'));
    await Promise.all(gfxFiles.map(f => fillGfxItems('interface/' + f, workspaceGfxIndex, options, estimatedSize)));
}
async function fillGfxItems(gfxFile: string, gfxIndex: Record<string, GfxIndexItem | undefined>, options: { mod?: boolean, hoi4?: boolean }, estimatedSize?: [number]): Promise<void> {
    try {
        if (estimatedSize) {
            estimatedSize[0] += gfxFile.length;
        }
        const [fileBuffer, uri] = await readFileFromModOrHOI4(gfxFile, options);
        const spriteTypes = getSpriteTypes(parseHoi4File(fileBuffer.toString(), localize('infile', 'In file {0}:\n', uri.toString())));
        for (const spriteType of spriteTypes) {
            gfxIndex[spriteType.name] = { file: gfxFile };
            if (estimatedSize) {
                estimatedSize[0] += spriteType.name.length + 8;
            }
        }
    } catch(e) {
        error(new UserError(forceError(e).toString()));
    }
}
function onChangeWorkspaceFolders(_: vscode.WorkspaceFoldersChangeEvent) {
    workspaceGfxIndex = {};
    const estimatedSize: [number] = [0];
    const task = buildWorkspaceGfxIndex(estimatedSize);
    vscode.window.setStatusBarMessage('$(loading~spin) ' + localize('gfxindex.workspace.building', 'Building workspace GFX index...'), task);
    task.then(() => {
        vscode.window.showInformationMessage(localize('gfxindex.workspace.builddone', 'Building workspace GFX index done.'));
        sendEvent('gfxIndex.workspace', { size: estimatedSize[0].toString() });
    });
}
function onChangeTextDocument(e: vscode.TextDocumentChangeEvent) {
    const file = e.document.uri;
    if (file.path.endsWith('.gfx')) {
        onChangeTextDocumentImpl(file);
    }
}
const onChangeTextDocumentImpl = debounceByInput(
    (file: vscode.Uri) => {
        removeWorkspaceGfxIndex(file);
        addWorkspaceGfxIndex(file);
    },
    file => file.toString(),
    1000,
    { trailing: true }
);
function onCloseTextDocument(document: vscode.TextDocument) {
    const file = document.uri;
    if (file.path.endsWith('.gfx')) {
        removeWorkspaceGfxIndex(file);
        addWorkspaceGfxIndex(file);
    }
}
function onCreateFiles(e: vscode.FileCreateEvent) {
    for (const file of e.files) {
        if (file.path.endsWith('.gfx')) {
            addWorkspaceGfxIndex(file);
        }
    }
}
function onDeleteFiles(e: vscode.FileDeleteEvent) {
    for (const file of e.files) {
        if (file.path.endsWith('.gfx')) {
            removeWorkspaceGfxIndex(file);
        }
    }
}
function onRenameFiles(e: vscode.FileRenameEvent) {
    onDeleteFiles({ files: e.files.map(f => f.oldUri) });
    onCreateFiles({ files: e.files.map(f => f.newUri) });
}
function removeWorkspaceGfxIndex(file: vscode.Uri) {
    const wsFolder = vscode.workspace.getWorkspaceFolder(file);
    if (wsFolder) {
        const relative = path.relative(wsFolder.uri.path, file.path).replace(/\\+/g, '/');
        if (relative && relative.startsWith('interface/')) {
            for (const key in workspaceGfxIndex) {
                if (workspaceGfxIndex[key]?.file === relative) {
                    delete workspaceGfxIndex[key];
                }
            }
        }
    }
}
function addWorkspaceGfxIndex(file: vscode.Uri) {
    const wsFolder = vscode.workspace.getWorkspaceFolder(file);
    if (wsFolder) {
        const relative = path.relative(wsFolder.uri.path, file.path).replace(/\\+/g, '/');
        if (relative && relative.startsWith('interface/')) {
            fillGfxItems(relative, workspaceGfxIndex, { hoi4: false });
        }
    }
}
```

## File: src/util/hoi4gui/button.ts
```typescript
import { HOIPartial, toNumberLike, toStringAsSymbolIgnoreCase } from "../../hoiformat/schema";
import { ParentInfo, calculateBBox } from "./common";
import { ButtonType } from "../../hoiformat/gui";
import { RenderNodeCommonOptions, renderSprite } from './nodecommon';
import { renderInstantTextBox } from "./instanttextbox";
export interface RenderButtonOptions extends RenderNodeCommonOptions {
}
export async function renderButton(button: HOIPartial<ButtonType>, parentInfo: ParentInfo, options: RenderButtonOptions): Promise<string> {
    const spriteType = button.spritetype ?? button.quadtexturesprite;
    const image = options.getSprite && spriteType ? await options.getSprite(spriteType, 'icon', button.name) : undefined;
    if (image === undefined) {
        return '';
    }
    let [x, y] = calculateBBox(button, parentInfo);
    if (button.centerposition) {
        x -= image.width / 2;
        y -= image.height / 2;
    }
    const scale = button.scale ?? 1;
    return `<div
    start="${button._token?.start}"
    end="${button._token?.end}"
    class="
        ${options.enableNavigator ? 'navigator navigator-highlight' : ''}
        ${options.styleTable.style('positionAbsolute', () => `position: absolute;`)}
        ${options.styleTable.oneTimeStyle('button', () => `
            left: ${x}px;
            top: ${y}px;
            width: ${image.width * scale}px;
            height: ${image.height * scale}px;
        `)}
    ">
        ${renderSprite({x: 0, y: 0}, image, image, button.frame ?? 0, scale, options)} 
        ${await renderInstantTextBox({
            ...button,
            position: { x: toNumberLike(0), y: toNumberLike(0) },
            bordersize: { x: toNumberLike(0), y: toNumberLike(0) },
            maxheight: toNumberLike(image.height * scale),
            maxwidth: toNumberLike(image.width * scale),
            font: button.buttonfont,
            text: button.buttontext ?? button.text,
            format: toStringAsSymbolIgnoreCase('center'),
            vertical_alignment: 'center',
            orientation: toStringAsSymbolIgnoreCase('upper_left')
        }, parentInfo, { ...options, enableNavigator: undefined })}
    </div>`;
}
```

## File: src/util/hoi4gui/containerwindow.ts
```typescript
import { HOIPartial } from "../../hoiformat/schema";
import { calculateBBox, normalizeMargin, ParentInfo, removeHtmlOptions } from "./common";
import { renderIcon } from "./icon";
import { renderInstantTextBox } from "./instanttextbox";
import { renderGridBox } from "./gridbox";
import { ButtonType, ContainerWindowType, GridBoxType, IconType, InstantTextBoxType } from "../../hoiformat/gui";
import { renderBackground, RenderNodeCommonOptions } from './nodecommon';
import { renderButton } from "./button";
export interface RenderChildTypeMap {
    containerwindow: HOIPartial<ContainerWindowType>;
    gridbox: HOIPartial<GridBoxType>;
    icon: HOIPartial<IconType>;
    instanttextbox: HOIPartial<InstantTextBoxType>;
    button: HOIPartial<ButtonType>;
}
export interface RenderContainerWindowOptions extends RenderNodeCommonOptions {
    noSize?: boolean;
    ignorePosition?: boolean;
    onRenderChild?<T extends keyof RenderChildTypeMap>(type: T, child: RenderChildTypeMap[T], parentInfo: ParentInfo): Promise<string | undefined>;
}
export async function renderContainerWindow(containerWindow: HOIPartial<ContainerWindowType>, parentInfo: ParentInfo, options: RenderContainerWindowOptions): Promise<string> {
    const [x, y, width, height, orientation] = calculateBBox(containerWindow, parentInfo);
    const size = { width, height };
    const margin = normalizeMargin(containerWindow.margin, size);
    const myInfo: ParentInfo = {
        size: {
            width: size.width - margin[1] - margin[3],
            height: size.height - margin[0] - margin[2],
        },
        orientation,
    };
    const background = await renderBackground(containerWindow.background, {size, orientation}, options);
    const children = await renderContainerWindowChildren(containerWindow, myInfo, { ...options, ignorePosition: undefined });
    return `<div
    ${options.id ? `id="${options.id}"` : ''}
    start="${containerWindow._token?.start}"
    end="${containerWindow._token?.end}"
    class="
        ${options?.classNames ? options.classNames : ''}
        ${options.styleTable.style('positionAbsolute', () => `position: absolute;`)}
        ${options.styleTable.style('borderBox', () => `box-sizing: border-box;`)}
        ${options.styleTable.oneTimeStyle('containerwindow', () => `
            left: ${options.ignorePosition ? 0 : x}px;
            top: ${options.ignorePosition ? 0 : y}px;
            width: ${options.noSize ? 0 : width}px;
            height: ${options.noSize ? 0 : height}px;
        `)}
        ${options.enableNavigator ? 'navigator navigator-highlight' : ''}
    ">
        ${background}
        <div class="
            ${options.styleTable.style('positionAbsolute', () => `position: absolute;`)}
            ${options.styleTable.oneTimeStyle('containerwindowChildren', () => `
                left: ${margin[3]}px;
                top: ${margin[0]}px;
            `)}
        ">
            ${children}
        </div>
    </div>`;
}
export async function renderContainerWindowChildren(containerWindow: HOIPartial<ContainerWindowType>, myInfo: ParentInfo, options: RenderContainerWindowOptions): Promise<string> {
    const containerWindowChildren = [...containerWindow.containerwindowtype, ...containerWindow.windowtype]
        .map(c => onRenderChildOrDefault(options.onRenderChild, 'containerwindow', c, myInfo, c1 => renderContainerWindow(c1, myInfo, removeHtmlOptions(options))));
    const gridboxChildren = containerWindow.gridboxtype
        .map(c => onRenderChildOrDefault(options.onRenderChild, 'gridbox', c, myInfo, c1 => renderGridBox(c1, myInfo, removeHtmlOptions({ ...options, items: {} }))));
    const iconChildren = containerWindow.icontype
        .map(c => onRenderChildOrDefault(options.onRenderChild, 'icon', c, myInfo, c1 => renderIcon(c1, myInfo, removeHtmlOptions(options))));
    const instantTextBoxChildren = [...containerWindow.instanttextboxtype, ...containerWindow.textboxtype]
        .map(c => onRenderChildOrDefault(options.onRenderChild, 'instanttextbox', c, myInfo, c1 => renderInstantTextBox(c1, myInfo, removeHtmlOptions(options))));
    const buttonChildren = [...containerWindow.buttontype, ...containerWindow.checkboxtype, ...containerWindow.guibuttontype]
        .map(c => onRenderChildOrDefault(options.onRenderChild, 'button', c, myInfo, c1 => renderButton(c1, myInfo, removeHtmlOptions(options))));
    const result = (await Promise.all([
        ...containerWindowChildren,
        ...gridboxChildren,
        ...iconChildren,
        ...instantTextBoxChildren,
        ...buttonChildren,
    ]));
    result.sort((a, b) => a[0] - b[0]);
    return result.map(v => v[1]).join('');
}
export async function onRenderChildOrDefault<T extends keyof RenderChildTypeMap>(
    onRenderChild: RenderContainerWindowOptions['onRenderChild'],
    type: T,
    child: RenderChildTypeMap[T],
    parentInfo: ParentInfo,
    defaultRenderer: (c: RenderChildTypeMap[T]) => Promise<string>): Promise<[number, string]>
{
    let result: string | undefined = undefined;
    if (onRenderChild) {
        result = await onRenderChild(type, child, parentInfo);
    }
    return [
        child._index || 0,
        result !== undefined ? result : await defaultRenderer(child),
    ];
}
```

## File: src/util/hoi4gui/icon.ts
```typescript
import { HOIPartial } from "../../hoiformat/schema";
import { ParentInfo, calculateBBox } from "./common";
import { IconType } from "../../hoiformat/gui";
import { RenderNodeCommonOptions, renderSprite } from './nodecommon';
export interface RenderIconOptions extends RenderNodeCommonOptions {
}
export async function renderIcon(icon: HOIPartial<IconType>, parentInfo: ParentInfo, options: RenderIconOptions): Promise<string> {
    const spriteType = icon.spritetype ?? icon.quadtexturesprite;
    const image = options.getSprite && spriteType ? await options.getSprite(spriteType, 'icon', icon.name) : undefined;
    if (image === undefined) {
        return '';
    }
    let [x, y] = calculateBBox(icon, parentInfo);
    if (icon.centerposition) {
        x -= image.width / 2;
        y -= image.height / 2;
    }
    const scale = icon.scale ?? 1;
    return `<div
    start="${icon._token?.start}"
    end="${icon._token?.end}"
    class="
        ${options.enableNavigator ? 'navigator navigator-highlight' : ''}
        ${options.styleTable.style('positionAbsolute', () => `position: absolute;`)}
        ${options.styleTable.oneTimeStyle('icon', () => `
            left: ${x}px;
            top: ${y}px;
            width: ${image.width * scale}px;
            height: ${image.height * scale}px;
        `)}
    ">
        ${renderSprite({x: 0, y: 0}, image, image, icon.frame ?? 0, scale, options)}
    </div>`;
}
```

## File: src/util/hoi4gui/instanttextbox.ts
```typescript
import { HOIPartial } from "../../hoiformat/schema";
import { ParentInfo, calculateBBox, RenderCommonOptions, normalizeNumberLike } from "./common";
import { htmlEscape } from "../html";
import { InstantTextBoxType } from "../../hoiformat/gui";
import { getLocalisedTextQuick } from "../localisationIndex";
import { localisationIndex } from "../featureflags";
export interface RenderInstantTextBoxOptions extends RenderCommonOptions {
}
export async function renderInstantTextBox(textbox: HOIPartial<InstantTextBoxType>, parentInfo: ParentInfo, options: RenderInstantTextBoxOptions): Promise<string> {
    const [x, y, width, height] = calculateBBox({ ...textbox, size: { width: textbox.maxwidth, height: textbox.maxheight } }, parentInfo);
    const borderX = normalizeNumberLike(textbox.bordersize?.x, width);
    const borderY = normalizeNumberLike(textbox.bordersize?.y, height);
    const format = textbox.format?._name.replace('centre', 'center');
    const font = textbox.font ?? '';
    const fontMatch = /\d+/.exec(font.replace('hoi4', ''));
    const fontSize = Math.ceil(parseInt(fontMatch?.find(() => true) ?? '16') * 0.7);
    return `<div
    ${options.id ? `id="${options.id}"` : ''}
    start="${textbox._token?.start}"
    end="${textbox._token?.end}"
    class="
        ${options?.classNames ? options.classNames : ''}
        ${options.styleTable.style('positionAbsolute', () => `position: absolute;`)}
        ${options.styleTable.style('borderBox', () => `box-sizing: border-box;`)}
        ${options.styleTable.oneTimeStyle('instanttextbox', () => `
            left: ${x}px;
            top: ${y}px;
            width: ${width}px;
            height: ${height}px;
            font-size: ${fontSize}px;
            text-align: ${format};
            padding: ${borderY}px ${borderX}px;
            ${textbox.vertical_alignment === 'center' ? `vertical-align: middle; line-height: ${height}px;` : ''}
        `)}
        ${options.styleTable.style('instanttextbox-common', () => `
            color: white;
            text-shadow: 0 0 3px black, 0px 0px 5px black;
        `)}
        ${options.enableNavigator ? 'navigator navigator-highlight' : ''}
    ">
        ${htmlEscape(localisationIndex ? (await getLocalisedTextQuick(textbox.text) ?? ' ') : (textbox.text ?? ''))}
    </div>`;
}
```

## File: src/util/html.ts
```typescript
import * as vscode from 'vscode';
import { contextContainer } from '../context';
import { StyleTable } from './styletable';
import { randomString } from './common';
export interface DynamicScript {
    content: string;
}
export interface NonceOnly {
    nonce: string;
}
export function html(webview: vscode.Webview, body: string, scripts: (string | DynamicScript)[], styles?: (string | StyleTable | DynamicScript | NonceOnly)[]): string {
    const preparedScripts = scripts.map<[string, string]>(script => {
        if (typeof script === 'string') {
            const uri = contextContainer.current ?
                webview.asWebviewUri(vscode.Uri.joinPath(contextContainer.current.extensionUri, 'static/' + script)) :
                "";
            return [
                `<script src="${uri}"></script>`,
                '',
            ];
        } else {
            const nonce = randomString(32);
            return [
                `<script nonce="${nonce}">${script.content}</script>`,
                `'nonce-${nonce}'`,
            ];
        }
    });
    const preparedStyles = styles === undefined ? [['', `'unsafe-inline'`] as [string, string]] :
        styles.map<[string, string]>(style => {
            const nonce = randomString(32);
            if (style instanceof StyleTable) {
                return [
                    style.toStyleElement(nonce),
                    `'nonce-${nonce}'`
                ];
            } else if (typeof style === 'object') {
                if ('nonce' in style) {
                    return [
                        '',
                        `'nonce-${style.nonce}'`,
                    ];
                } else {
                    return [
                        `<style nonce="${nonce}">${style.content}</style>`,
                        `'nonce-${nonce}'`,
                    ];
                }
            } else {
                const uri = contextContainer.current ?
                    webview.asWebviewUri(vscode.Uri.joinPath(contextContainer.current.extensionUri, 'static/' + style)) :
                    "";
                return [
                    `<link rel="stylesheet" href="${uri}"/>`,
                    ''
                ];
            }
        });
    return `
<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="
            default-src 'none';
            style-src ${preparedStyles.map(v => v[1]).join(' ')} ${webview.cspSource};
            script-src ${preparedScripts.map(v => v[1]).filter(v => v.length > 0).join(' ')} ${webview.cspSource};
            img-src data: ${webview.cspSource};
            font-src ${webview.cspSource};
        ">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${preparedScripts.map(v => v[0]).join('')}
        ${preparedStyles.map(v => v[0]).join('')}
    </head>
    <body>${body.replace(/\s\s+/g, ' ')}</body>
</html>
`;
}
export function htmlEscape(unsafe: string): string {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;")
         .replace(/\n/g, "&#13;")
         .replace(/ /g, "&nbsp;");
}
```

## File: src/util/image/dds/dds.ts
```typescript
import { DDSHeader, HEADER_LENGTH_INT, DDS_MAGIC, DDPF_FOURCC, DDSCAPS2_CUBEMAP, DDSCAPS2_VOLUME, DDSCAPS_MIPMAP, DDSCAPS2_CUBEMAP_POSITIVEX, DDSCAPS2_CUBEMAP_NEGATIVEX, DDSCAPS2_CUBEMAP_POSITIVEY, DDSCAPS2_CUBEMAP_NEGATIVEY, DDSCAPS2_CUBEMAP_POSITIVEZ, DDSCAPS2_CUBEMAP_NEGATIVEZ, DDSHeaderDXT10, FOURCC_DX10, HEADER_DXT10_LENGTH_INT, DDS_RESOURCE_MISC_TEXTURECUBE, ResourceDimension } from './typedef';
import { Surface } from './surface';
import { convertPixelFormat, PixelFormat, getImageSizeInBytes } from './pixelformat';
import { UserError } from '../../common';
export class DDS {
    private constructor(
        readonly header: DDSHeader,
        readonly headerDxt10: DDSHeaderDXT10 | undefined,
        readonly images: Surface[],
        readonly type: 'texture' | 'cubemap' | 'volume',
        readonly arraySize: number,
        readonly mipmapCount: number,
    ) {
    }
    public static parse(buffer: ArrayBuffer, byteOffset: number): DDS {
        const headerArray = new Int32Array(buffer, byteOffset, HEADER_LENGTH_INT);
        if (headerArray[0] !== DDS_MAGIC) {
            throw new UserError('Invalid magic number in DDS header');
        }
        const header = extractHeader(headerArray);
        if (header.ddspf.dwFlags === DDPF_FOURCC && header.ddspf.dwFourCC === FOURCC_DX10) {
            const dxt10HeaderArray = new Int32Array(buffer, byteOffset + HEADER_LENGTH_INT * 4, HEADER_DXT10_LENGTH_INT);
            const dxt10Header = extractDxt10Header(dxt10HeaderArray);
            return DDS.parseDxt10(buffer, byteOffset, header, dxt10Header);
        } else {
            return DDS.parseStandard(buffer, byteOffset, header);
        }
    }
    private static parseStandard(buffer: ArrayBuffer, byteOffset: number, header: DDSHeader): DDS {
        const pixelFormat = convertPixelFormat(header.ddspf);
        const cubeMap = !!(header.dwCaps2 & DDSCAPS2_CUBEMAP);
        const volume = !!(header.dwCaps2 & DDSCAPS2_VOLUME);
        if (cubeMap && volume) {
            throw new UserError('Cannot set DDSCAPS2_CUBEMAP and DDSCAPS2_VOLUME at same time');
        }
        const mipmapCount = (header.dwCaps & DDSCAPS_MIPMAP) ? header.dwMipMapCount - 1 : 0;
        const offset = byteOffset + HEADER_LENGTH_INT * 4;
        let images: Surface[];
        if (cubeMap) {
            const cubeMaps: string[] = [];
            if (header.dwCaps2 & DDSCAPS2_CUBEMAP_POSITIVEX) { cubeMaps.push("X+"); }
            if (header.dwCaps2 & DDSCAPS2_CUBEMAP_NEGATIVEX) { cubeMaps.push("X-"); }
            if (header.dwCaps2 & DDSCAPS2_CUBEMAP_POSITIVEY) { cubeMaps.push("Y+"); }
            if (header.dwCaps2 & DDSCAPS2_CUBEMAP_NEGATIVEY) { cubeMaps.push("Y-"); }
            if (header.dwCaps2 & DDSCAPS2_CUBEMAP_POSITIVEZ) { cubeMaps.push("Z+"); }
            if (header.dwCaps2 & DDSCAPS2_CUBEMAP_NEGATIVEZ) { cubeMaps.push("Z-"); }
            [images] = parseCubeMap(buffer, offset, pixelFormat, header.dwWidth, header.dwHeight, cubeMaps, mipmapCount);
        } else if (volume) {
            [images] = parseVolumeTexture(buffer, offset, pixelFormat, header.dwWidth, header.dwHeight, header.dwDepth, mipmapCount);
        } else {
            [images] = parseTexture(buffer, offset, pixelFormat, header.dwWidth, header.dwHeight, mipmapCount);
        }
        return new DDS(header, undefined, images, cubeMap ? 'cubemap' : volume ? 'volume' : 'texture', 1, mipmapCount);
    }
    private static parseDxt10(buffer: ArrayBuffer, byteOffset: number, header: DDSHeader, dxt10Header: DDSHeaderDXT10): DDS {
        const pixelFormat = convertPixelFormat(header.ddspf, dxt10Header);
        const cubeMap = !!(dxt10Header.miscFlag & DDS_RESOURCE_MISC_TEXTURECUBE);
        const volume = dxt10Header.resourceDimension === ResourceDimension.DDS_DIMENSION_TEXTURE3D;
        if (cubeMap && volume) {
            throw new UserError('Cannot set DDS_RESOURCE_MISC_TEXTURECUBE and use DDS_DIMENSION_TEXTURE3D at same time');
        }
        const mipmapCount = (header.dwCaps & DDSCAPS_MIPMAP) ? header.dwMipMapCount - 1 : 0;
        let offset = byteOffset + (HEADER_LENGTH_INT + HEADER_DXT10_LENGTH_INT) * 4;
        const allImages: Surface[] = [];
        const cubeMaps: string[] = ["X+", "X-", "Y+", "Y-", "Z+", "Z-"];
        const arraySize = dxt10Header.arraySize;
        const height = dxt10Header.resourceDimension === ResourceDimension.DDS_DIMENSION_TEXTURE1D ? 1 : header.dwHeight;
        for (let i = 0; i < arraySize; i++) {
            let images: Surface[];
            if (cubeMap) {
                [images, offset] = parseCubeMap(buffer, offset, pixelFormat, header.dwWidth, height, cubeMaps, mipmapCount);
            } else if (volume) {
                [images, offset] = parseVolumeTexture(buffer, offset, pixelFormat, header.dwWidth, height, header.dwDepth, mipmapCount);
            } else {
                [images, offset] = parseTexture(buffer, offset, pixelFormat, header.dwWidth, height, mipmapCount);
            }
            allImages.push(...images);
        }
        return new DDS(header, dxt10Header, allImages, cubeMap ? 'cubemap' : volume ? 'volume' : 'texture', arraySize, mipmapCount);
    }
}
function extractHeader(headerArray: Int32Array): DDSHeader {
    return {
        dwFlags: headerArray[2],
        dwHeight: headerArray[3],
        dwWidth: headerArray[4],
        dwPitchOrLinearSize: headerArray[5],
        dwDepth: headerArray[6],
        dwMipMapCount: headerArray[7],
        ddspf: {
            dwFlags: headerArray[20],
            dwFourCC: headerArray[21],
            dwRGBBitCount: headerArray[22],
            dwRBitMask: headerArray[23],
            dwGBitMask: headerArray[24],
            dwBBitMask: headerArray[25],
            dwABitMask: headerArray[26],
        },
        dwCaps: headerArray[27],
        dwCaps2: headerArray[28],
    };
}
function extractDxt10Header(dxt10HeaderArray: Int32Array): DDSHeaderDXT10 {
    return {
        dxgiFormat: dxt10HeaderArray[0],
        resourceDimension: dxt10HeaderArray[1],
        miscFlag: dxt10HeaderArray[2],
        arraySize: dxt10HeaderArray[3],
        miscFlags2: dxt10HeaderArray[4],
    };
}
function parseTexture(buffer: ArrayBuffer, offset: number, pixelFormat: PixelFormat, width: number, height: number, mipmapCount: number): [Surface[], number] {
    const result: Surface[] = [];
    offset = pushSurface(result, buffer, offset, width, height, pixelFormat, "Main image");
    for (let i = 0; i < mipmapCount; i++) {
        width = Math.max(1, Math.floor(width / 2));
        height = Math.max(1, Math.floor(height / 2));
        offset = pushSurface(result, buffer, offset, width, height, pixelFormat,`Mipmap #${i + 1}`);
    }
    return [result, offset];
}
function parseCubeMap(buffer: ArrayBuffer, offset: number, pixelFormat: PixelFormat, width: number, height: number, cubeMaps: string[], mipmapCount: number): [Surface[], number] {
    const result: Surface[] = [];
    for (const cubeMap of cubeMaps) {
        offset = pushSurface(result, buffer, offset, width, height, pixelFormat, cubeMap);
        for (let i = 0; i < mipmapCount; i++) {
            width = Math.max(1, Math.floor(width / 2));
            height = Math.max(1, Math.floor(height / 2));
            offset = pushSurface(result, buffer, offset, width, height, pixelFormat, `Mipmap of ${cubeMap} #${i + 1}`);
        }
    }
    return [result, offset];
}
function parseVolumeTexture(buffer: ArrayBuffer, offset: number, pixelFormat: PixelFormat, width: number, height: number, depth: number, mipmapCount: number): [Surface[], number] {
    const result: Surface[] = [];
    for (let i = 0; i < depth; i++) {
        offset = pushSurface(result, buffer, offset, width, height, pixelFormat, `Main image depth #${i + 1}`);
    }
    for (let i = 0; i < mipmapCount; i++) {
        width = Math.max(1, Math.floor(width / 2));
        height = Math.max(1, Math.floor(height / 2));
        depth = Math.max(1, Math.floor(depth / 2));
        for (let j = 0; j < depth; j++) {
            offset = pushSurface(result, buffer, offset, width, height, pixelFormat, `Mipmap of #${i + 1} depth #${i + 1}`);
        }
    }
    return [result, offset];
}
function pushSurface(surfaces: Surface[], buffer: ArrayBuffer, offset: number, width: number, height: number, pixelFormat: PixelFormat, name: string): number {
    const length = getImageSizeInBytes(pixelFormat, width, height);
    const end = offset + length;
    if (end > buffer.byteLength) {
        throw new UserError(`Image ${name} (start ${offset}, end ${end}) exceeds buffer size ${buffer.byteLength}`);
    }
    surfaces.push(new Surface(buffer, offset, length, name, width, height, pixelFormat));
    return end;
}
```

## File: src/util/loader/loader.ts
```typescript
import * as vscode from 'vscode';
import * as path from 'path';;
import { hoiFileExpiryToken, listFilesFromModOrHOI4, readFileFromModOrHOI4 } from '../fileloader';
import { error } from '../debug';
import { UserError } from '../common';
import { Dependency, getDependenciesFromText } from '../dependency';
import { sendEvent } from '../telemetry';
export { Dependency } from '../dependency';
export class LoaderSession {
    private loadedLoader: Set<Loader<unknown, unknown>> = new Set();
    private shouldLoaderReload: Map<Loader<unknown, unknown>, boolean | 'checking'> = new Map();
    private cachedLoader: Record<string, Loader<unknown, unknown>> = {};
    public loadingLoader: Loader<unknown, unknown>[] = [];
    constructor(public force: boolean, private cancelled?: () => boolean) {
    }
    public isLoaded(loader: Loader<unknown, unknown>): boolean {
        return this.loadedLoader.has(loader);
    }
    public setLoaded(loader: Loader<unknown, unknown>) {
        this.loadedLoader.add(loader);
    }
    public checkingShouldReload(loader: Loader<unknown, unknown>) {
        this.shouldLoaderReload.set(loader, 'checking');
    }
    public setShouldReload(loader: Loader<unknown, unknown>) {
        this.shouldLoaderReload.set(loader, true);
    }
    public clearShouldReload(loader: Loader<unknown, unknown>) {
        this.shouldLoaderReload.delete(loader);
    }
    public shouldReload(loader: Loader<unknown, unknown>): boolean | 'checking' {
        return this.shouldLoaderReload.get(loader) ?? false;
    }
    public createOrGetCachedLoader<R extends Loader<unknown, unknown>>(file: string, loaderType: { new (file: string): R }): R {
        const cachedLoader = this.cachedLoader[file];
        if (cachedLoader instanceof loaderType) {
            return cachedLoader;
        } else {
            const loader = this.cachedLoader[file] = new loaderType(file);
            return loader;
        }
    }
    public forChild(): LoaderSession {
        const clone = { ...this };
        clone.loadingLoader = [ ...this.loadingLoader ];
        Object.setPrototypeOf(clone, Object.getPrototypeOf(this));
        return clone;
    }
    public throwIfCancelled(): void {
        if (this.cancelled?.call(this)) {
            throw new UserError('Load session cancelled.');
        }
    }
}
export type LoadResult<T, E={}> = { result: T, dependencies: string[] } & E;
export type LoadResultOD<T, E={}> = Omit<LoadResult<T, E>, 'dependencies'> & Partial<Pick<LoadResult<T, E>, 'dependencies'>> & E;
export abstract class Loader<T, E = {}> {
    private cachedValue: LoadResult<T, E> | undefined;
    protected onProgressEmitter = new vscode.EventEmitter<string>();
    public onProgress = this.onProgressEmitter.event;
    protected onLoadDoneEmitter = new vscode.EventEmitter<LoadResult<T, E>>();
    public onLoadDone = this.onLoadDoneEmitter.event;
    private loadingPromise: Promise<LoadResult<T, E>> | undefined = undefined;
    public disableTelemetry = false;
    constructor() {
    }
    async load(session: LoaderSession): Promise<LoadResult<T, E>> {
        session = session.forChild();
        // Load each loader at most one time in one session
        if (this.cachedValue === undefined || (!session.isLoaded(this) && (session.force || await this.shouldReload(session)))) {
            const loadStartTime = Date.now();
            session.loadingLoader.push(this);
            try {
                this.beforeLoadImpl(session);
                if (this.loadingPromise === undefined) {
                    this.cachedValue = await (this.loadingPromise = this.loadImpl(session));
                } else {
                    this.cachedValue = await this.loadingPromise;
                }
                session.setLoaded(this);
            } finally {
                this.loadingPromise = undefined;
                if (session.loadingLoader.pop() !== this) {
                    throw new Error('loadingLoader corrupted.');
                }
            }
            const timeElapsed = Date.now() - loadStartTime;
            if (timeElapsed > 500 && !this.disableTelemetry) {
                sendEvent('loader.loaddone',
                    { loaderType: this.constructor.name },
                    { timeElapsed, ...this.extraMesurements(this.cachedValue) });
            }
        }
        this.onLoadDoneEmitter.fire(this.cachedValue);
        return this.cachedValue;
    };
    public async shouldReload(session: LoaderSession): Promise<boolean> {
        // Always return same value for shouldReload in one session
        const cachedShouldReload = session.shouldReload(this);
        if (cachedShouldReload === 'checking') {
            return false;
        }
        if (cachedShouldReload) {
            return true;
        }
        session.checkingShouldReload(this);
        const result = await this.shouldReloadImpl(session);
        if (result) {
            session.setShouldReload(this);
        } else {
            session.clearShouldReload(this);
        }
        return result;
    };
    protected shouldReloadImpl(session: LoaderSession): Promise<boolean> {
        return Promise.resolve(true);
    }
    protected beforeLoadImpl(session: LoaderSession): void {
    }
    protected async fireOnProgressEvent(progress: string): Promise<void> {
        this.onProgressEmitter.fire(progress);
        await new Promise(resolve => setTimeout(resolve, 0));
    }
    protected extraMesurements(result: LoadResult<T, E>): Record<string, number> {
        return {};
    };
    protected abstract loadImpl(session: LoaderSession): Promise<LoadResult<T, E>>;
}
export abstract class FileLoader<T, E={}> extends Loader<T, E> {
    private expiryToken: string = '';
    constructor(public file: string) {
        super();
    }
    public async shouldReloadImpl(session: LoaderSession): Promise<boolean> {
        return await hoiFileExpiryToken(this.file) !== this.expiryToken;
    }
    protected beforeLoadImpl(session: LoaderSession): void {
        checkLoaderSessionLoadingFile(session, this.file);
    }
    protected async loadImpl(session: LoaderSession): Promise<LoadResult<T, E>> {
        this.expiryToken = await hoiFileExpiryToken(this.file);
        const result = await this.loadFromFile(session);
        return {
            ...result,
            dependencies: result.dependencies ? result.dependencies : [this.file],
        };
    }
    protected abstract loadFromFile(session: LoaderSession): Promise<LoadResultOD<T, E>>;
}
export abstract class FolderLoader<T, TFile, E={}, EFile={}> extends Loader<T, E> {
    private fileCount: number = 0;
    private subLoaders: Record<string, FileLoader<TFile, EFile>> = {};
    constructor(
        public folder: string,
        private subLoaderConstructor: { new (file: string): FileLoader<TFile, EFile> },
    ) {
        super();
    }
    public async shouldReloadImpl(session: LoaderSession): Promise<boolean> {
        const files = await listFilesFromModOrHOI4(this.folder);
        if (this.fileCount !== files.length || files.some(f => !(f in this.subLoaders))) {
            return true;
        }
        return (await Promise.all(Object.values(this.subLoaders).map(l => l.shouldReload(session)))).some(v => v);
    }
    protected async loadImpl(session: LoaderSession): Promise<LoadResult<T, E>> {
        const files = await listFilesFromModOrHOI4(this.folder);
        this.fileCount = files.length;
        const subLoaders = this.subLoaders;
        const newSubLoaders: Record<string, FileLoader<TFile, EFile>> = {};
        const fileResultPromises: Promise<LoadResult<TFile, EFile>>[] = [];
        for (const file of files) {
            let subLoader = subLoaders[file];
            if (!subLoader) {
                subLoader = new this.subLoaderConstructor(path.join(this.folder, file));
                subLoader.disableTelemetry = true;
                subLoader.onProgress(e => this.onProgressEmitter.fire(e));
            }
            fileResultPromises.push(subLoader.load(session));
            newSubLoaders[file] = subLoader;
        }
        this.subLoaders = newSubLoaders;
        return this.mergeFiles(await Promise.all(fileResultPromises), session);
    }
    protected extraMesurements(result: LoadResult<T, E>) {
        return { ...super.extraMesurements(result), fileCount: this.fileCount };
    }
    protected abstract mergeFiles(fileResults: LoadResult<TFile, EFile>[], session: LoaderSession): Promise<LoadResult<T, E>>;
}
export abstract class ContentLoader<T, E={}> extends Loader<T, E> {
    private expiryToken: string = '';
    protected loaderDependencies = new LoaderDependencies();
    protected readDependency = true;
    constructor(public file: string, private contentProvider?: () => Promise<string>) {
        super();
    }
    public async shouldReloadImpl(session: LoaderSession): Promise<boolean> {
        if (this.contentProvider === undefined) {
            return await hoiFileExpiryToken(this.file) !== this.expiryToken || this.loaderDependencies.shouldReload(session);
        } else {
            return true;
        }
    }
    protected beforeLoadImpl(session: LoaderSession): void {
        checkLoaderSessionLoadingFile(session, this.file);
    }
    protected async loadImpl(session: LoaderSession): Promise<LoadResult<T, E>> {
        const dependencies: string[] = [this.file];
        if (this.contentProvider === undefined) {
            this.expiryToken = await hoiFileExpiryToken(this.file);
        }
        let content: string | undefined = undefined;
        let errorValue: any = undefined;
        try {
            content = this.contentProvider === undefined ?
                (await readFileFromModOrHOI4(this.file))[0].toString('utf-8').replace(/^\uFEFF/, '') :
                await this.contentProvider();
        } catch(e) {
            error(e);
            errorValue = e;
        }
        const dependenciesFromText = this.readDependency && content ? getDependenciesFromText(content) : [];
        const result = await this.postLoad(content, dependenciesFromText, errorValue, session);
        this.loaderDependencies.flip();
        return {
            ...result,
            dependencies: result.dependencies ? result.dependencies : dependencies,
        };
    }
    protected abstract postLoad(content: string | undefined, dependencies: Dependency[], error: any, session: LoaderSession): Promise<LoadResultOD<T, E>>;
}
type PromiseValue<P> = P extends Promise<infer K> ? K : P;
class LoaderDependencies {
    public current: Record<string, Loader<unknown, unknown>> = {};
    private newValues: Record<string, Loader<unknown, unknown>> = {};
    public async shouldReload(session: LoaderSession): Promise<boolean> {
        // Don't use Promise.all because it will cause infinite loop when there are circular dependencies.
        for (const loader of Object.values(this.current)) {
            if (await loader.shouldReload(session)) {
                return true;
            }
        }
        return false;
    }
    public getOrCreate<R extends Loader<unknown, unknown>>(key: string, factory: (key: string) => R, type: { new (...args: any[]): R }): R {
        const loader = this.current[key];
        if (loader && loader instanceof type) {
            this.newValues[key] = loader;
            return loader;
        } else {
            const newLoader = factory(key);
            this.newValues[key] = newLoader;
            return newLoader;
        }
    }
    public async loadMultiple<R extends Loader<unknown, unknown>>(dependencies: string[], session: LoaderSession, type: { new (...args: any[]): R }) {
        type Result = PromiseValue<ReturnType<R['load']>>;
        const loadDep = async (dep: string) => {
            try {
                const eventsDepLoader = this.getOrCreate(dep, k => session.createOrGetCachedLoader(k, type), type);
                return (await eventsDepLoader.load(session)) as PromiseValue<ReturnType<R['load']>>;
            } catch (e) {
                error(e);
                return undefined;
            }
        };
        // Don't use parallel loading because A -> B -> C will cause dead lock.
        //                                    |--> C -> B
        // return (await Promise.all(dependencies.map(loadDep))).filter((v): v is Result => !!v);
        const result: Result[] = [];
        for (const dependency of dependencies) {
            const value = await loadDep(dependency);
            if (value !== undefined) {
                result.push(value);
            }
        }
        return result;
    }
    public flip() {
        this.current = this.newValues;
        this.newValues = {};
    }
}
export function mergeInLoadResult<K extends string, T extends { [k in K]: any[] }>(loadResults: T[], key: K): T[K] {
    return loadResults.reduce<T[K]>((p, c) => (p as any).concat(c[key]), [] as unknown as T[K]);
}
function checkLoaderSessionLoadingFile(session: LoaderSession, file: string) {
    const length = session.loadingLoader.length - 1;
    for (let i = 0; i < length; i++) {
        const loader = session.loadingLoader[i];
        if ('file' in loader && (loader as any).file === file) {
            throw new UserError('Circular dependency when loading file. Loading loaders: ' + session.loadingLoader);
        }
    }
}
```

## File: src/util/nodecommon.ts
```typescript
import * as path from 'path';
export function matchPathEnd(pathname: string, segments: string[]): boolean {
    pathname = pathname.replace(/\/|\\/g, path.sep);
    for (let i = segments.length - 1; i >= 0; i--) {
        const name = path.basename(pathname);
        pathname = path.dirname(pathname);
        if (segments[i] === '*') {
            continue;
        }
        if (segments[i].toLowerCase() !== name.toLowerCase()) {
            return false;
        }
    }
    return true;
}
export function isSamePath(a: string, b: string): boolean {
    return path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();
}
```

## File: webviewsrc/util/checkbox.ts
```typescript
import { fromEvent } from 'rxjs';
import { Subscriber } from "./event";
const checkboxes: Checkbox[] = [];
export function enableCheckboxes() {
    checkboxes.forEach(s => s.dispose());
    checkboxes.length = 0;
    const inputs = document.querySelectorAll('input[type=checkbox]');
    for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i] as HTMLInputElement;
        checkboxes.push(new Checkbox(input));
    }
}
export class Checkbox extends Subscriber {
    constructor(readonly input: HTMLInputElement, private text?: string) {
        super();
        this.init();
    }
    private init() {
        const id = this.input.id;
        let text = this.text ?? '';
        if (id) {
            const label = document.querySelector('label[for=' + JSON.stringify(id) + ']') as HTMLLabelElement;
            if (label) {
                label.classList.add('hidden');
                label.tabIndex = -1;
                text = label.textContent ?? '';
            }
        }
        const checkboxContainerOut = document.createElement('div');
        checkboxContainerOut.classList.add('checkbox-container-out');
        const checkboxContainer = document.createElement('div');
        checkboxContainer.classList.add('checkbox-container');
        checkboxContainerOut.appendChild(checkboxContainer);
        checkboxContainer.tabIndex = 0;
        checkboxContainer.setAttribute('role', 'checkbox');
        checkboxContainer.setAttribute('aria-checked', this.input.checked.toString());
        const checkbox = document.createElement('div');
        checkbox.classList.add('checkbox');
        checkbox.classList.add('codicon');
        checkbox.classList.add('codicon-check');
        checkboxContainer.appendChild(checkbox);
        const label = document.createElement('div');
        label.append(text);
        checkboxContainer.append(label);
        this.input.classList.add('hidden');
        this.input.tabIndex = -1;
        this.input.after(checkboxContainerOut);
        this.addSubscription({
            dispose: () => {
                checkboxContainerOut.remove();
            }
        });
        this.addEventHandlersForCheckBox(checkboxContainer, checkbox);
    }
    private addEventHandlersForCheckBox(checkboxContainer: HTMLDivElement, checkbox: HTMLDivElement) {
        const toggleValue = () => {
            this.input.checked = !this.input.checked;
            checkboxContainer.setAttribute('aria-checked', this.input.checked.toString());
            this.input.dispatchEvent(new Event('change'));
        };
        this.addSubscription(fromEvent<MouseEvent>(checkboxContainer, 'click').subscribe((e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleValue();
        }));
        this.addSubscription(fromEvent<KeyboardEvent>(checkboxContainer, 'keydown').subscribe((e) => {
            if (e.code === 'Enter' || e.code === 'Space') {
                e.preventDefault();
                toggleValue();
            }
        }));
    }
}
```

## File: webviewsrc/util/dropdown.ts
```typescript
import { Disposable, Subscriber, toDisposable } from "./event";
import { feLocalize } from "./i18n";
import { Checkbox } from "./checkbox";
import { BehaviorSubject, fromEvent, Observable, Subject, Subscription } from 'rxjs';
const dropdowns: Dropdown[] = [];
export const numDropDownOpened$ = new BehaviorSubject<number>(0);
export function enableDropdowns() {
    dropdowns.forEach(s => s.dispose());
    dropdowns.length = 0;
    const selects = document.querySelectorAll('.select-container > select');
    for (let i = 0; i < selects.length; i++) {
        const select = selects[i] as HTMLSelectElement;
        dropdowns.push(new Dropdown(select));
    }
}
class Dropdown extends Subscriber {
    private closeDropdown: (() => void) | undefined = undefined;
    constructor(readonly select: HTMLSelectElement) {
        super();
        this.init();
    }
    private init() {
        this.addSubscription(fromEvent<MouseEvent>(this.select, 'mousedown').subscribe(e => {
            e.preventDefault();
            this.select.focus();
            if (this.closeDropdown) {
                this.closeDropdown();
            } else {
                this.showSelectionsForDropdown();
            }
        }));
        this.addSubscription(fromEvent<KeyboardEvent>(this.select, 'keydown').subscribe(e => {
            if (e.code === 'Enter') {
                e.preventDefault();
                if (this.closeDropdown) {
                    this.closeDropdown();
                } else {
                    this.showSelectionsForDropdown();
                }
            }
        }));
    }
    private showSelectionsForDropdown() {
        this.select.classList.add('dropdown-opened');
        const options = this.select.querySelectorAll('option');
        const optionForDropdownMenu: Option[] = [];
        options.forEach(option => {
            if (!option.hidden) {
                optionForDropdownMenu.push({
                    text: option.textContent ?? '',
                    value: option.value,
                    selected: option.value === this.select.value,
                });
            }
        });
        const dropdownMenu = new DropdownMenu(optionForDropdownMenu);
        const dropdownMenuSubscriptions: Disposable[] = [ dropdownMenu ];
        dropdownMenuSubscriptions.push(toDisposable(dropdownMenu.options$.subscribe(options => {
            const selectedOption = options.find(o => o.selected);
            if (selectedOption) {
                this.select.value = selectedOption.value;
                this.select.dispatchEvent(new Event('change'));
            }
            this.closeDropdown?.apply(this);
            setTimeout(() => this.select.focus(), 0);
        })));
        dropdownMenuSubscriptions.push(toDisposable(dropdownMenu.close$.subscribe(isKey => {
            if (isKey) {
                this.select.focus();
            }
            this.closeDropdown?.apply(this);
        })));
        numDropDownOpened$.next(numDropDownOpened$.value + 1);
        this.closeDropdown = () => {
            this.select.classList.remove('dropdown-opened');
            dropdownMenu.hide();
            dropdownMenuSubscriptions.forEach(d => d.dispose());
            numDropDownOpened$.next(numDropDownOpened$.value - 1);
            this.closeDropdown = undefined;
        };
        dropdownMenu.show(this.select);
    }
}
export class DivDropdown extends Subscriber {
    private closeDropdown: (() => void) | undefined = undefined;
    public selectedValues$ = new BehaviorSubject<readonly string[]>([]);
    constructor(readonly select: HTMLDivElement, private multiSelection: boolean = false) {
        super();
        this.init();
        this.addSubscription(this.selectedValues$.subscribe((value) => {
            const options = this.getOptions(value);
            this.updateSelectedValue(options);
        }));
    }
    public selectAll() {
        const options = this.getOptions();
        const values: string[] = [];
        options.forEach(option => {
            option.selected = true;
            values.push(option.value);
        });
        this.selectedValues$.next(values);
    }
    private init() {
        this.addSubscription(fromEvent<MouseEvent>(this.select, 'mousedown').subscribe(e => {
            e.preventDefault();
            this.select.focus();
            if (this.closeDropdown) {
                this.closeDropdown();
            } else {
                this.showSelectionsForDropdown();
            }
        }));
        this.addSubscription(fromEvent<KeyboardEvent>(this.select, 'keydown').subscribe(e => {
            if (e.code === 'Enter') {
                e.preventDefault();
                if (this.closeDropdown) {
                    this.closeDropdown();
                } else {
                    this.showSelectionsForDropdown();
                }
            }
        }));
        const options = this.getOptions();
        this.updateSelectedValue(options);
    }
    private showSelectionsForDropdown() {
        this.select.classList.add('dropdown-opened');
        const dropdownMenu = new DropdownMenu(this.getOptions(), this.multiSelection);
        const dropdownMenuSubscriptions: Disposable[] = [ dropdownMenu ];
        dropdownMenuSubscriptions.push(toDisposable(dropdownMenu.options$.subscribe(options => {
            this.updateSelectedValue(options);
            this.selectedValues$.next(options.filter(o => o.selected).map(o => o.value));
            if (!this.multiSelection) {
                this.closeDropdown?.apply(this);
                setTimeout(() => this.select.focus(), 0);
            }
        })));
        dropdownMenuSubscriptions.push(toDisposable(dropdownMenu.close$.subscribe(isKey => {
            if (isKey) {
                this.select.focus();
            }
            this.closeDropdown?.apply(this);
        })));
        numDropDownOpened$.next(numDropDownOpened$.value + 1);
        this.closeDropdown = () => {
            this.select.classList.remove('dropdown-opened');
            dropdownMenu.hide();
            dropdownMenuSubscriptions.forEach(d => d.dispose());
            numDropDownOpened$.next(numDropDownOpened$.value - 1);
            this.closeDropdown = undefined;
        };
        dropdownMenu.show(this.select);
    }
    private getOptions(selectedValues?: readonly string[]): Option[] {
        if (selectedValues === undefined) {
            selectedValues = this.selectedValues$.value;
        }
        const options = this.select.querySelectorAll('.option');
        const optionForDropdownMenu: Option[] = [];
        options.forEach(option => {
            if (!option.hasAttribute('hidden')) {
                const value = option.getAttribute('value');
                optionForDropdownMenu.push({
                    text: option.textContent ?? '',
                    value: value ?? '',
                    selected: value !== null ? selectedValues!.includes(value) : false,
                });
            }
        });
        return optionForDropdownMenu;
    }
    private updateSelectedValue(options: Option[]) {
        const selectedOptions = options.filter(o => o.selected);
        const valueSpan = this.select.querySelector('span.value') as HTMLSpanElement;
        valueSpan.textContent = selectedOptions.length === 0 ? feLocalize('combobox.noselection', '(No selection)') :
            selectedOptions.length === options.length ? feLocalize('combobox.all', '(All)') :
            selectedOptions.length > 1 ? feLocalize('combobox.multiple', '{0} (+{1})', selectedOptions[0].text, selectedOptions.length - 1) :
            selectedOptions[0].text;
    }
}
type Option = { text: string, value: string, selected: boolean };
class DropdownMenu extends Subscriber {
    private writableOptions$: Subject<Option[]>;
    public options$: Observable<Option[]>;
    private writableClose$: Subject<boolean>;
    public close$: Observable<boolean>;
    private list: HTMLUListElement;
    private items: HTMLLIElement[] = [];
    private subscriptionWhenOpen: Subscription[] = [];
    constructor(private options: Option[], private multiSelection: boolean = false) {
        super();
        this.list = this.createList();
        this.writableOptions$ = new Subject();
        this.options$ = this.writableOptions$;
        this.writableClose$ = new Subject();
        this.close$ = this.writableClose$;
        this.addSubscription({
            dispose: () => {
                this.list.remove();
            }
        });
    }
    public show(host: Element) {
        this.hide();
        const bbox = host.getBoundingClientRect();
        this.list.style.left = bbox.left + 'px';
        this.list.style.top = bbox.bottom + 'px';
        this.list.style.width = bbox.width + 'px';
        this.registerEventHandlerWhenOpen(host);
        document.body.appendChild(this.list);
        const selectedOptionIndex = this.multiSelection ? 0 : Math.max(0, this.options.findIndex(o => o.selected));
        if (this.items.length > 0) {
            this.items[selectedOptionIndex].focus();
        }
    }
    public hide() {
        this.list.parentElement?.removeChild(this.list);
        this.subscriptionWhenOpen.forEach(s => s.unsubscribe());
    }
    private createList(): HTMLUListElement {
        const options = this.options;
        const list = document.createElement('ul');
        list.classList.add('select-dropdown');
        const items = this.items;
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            const item = this.createDropdownItem(option, i, items);
            list.appendChild(item);
        }
        return list;
    }
    private createDropdownItem(option: Option, index: number, items: HTMLLIElement[]): HTMLLIElement {
        const item = document.createElement('li');
        item.setAttribute('role', 'option');
        item.tabIndex = -1;
        if (this.multiSelection) {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = option.selected;
            item.appendChild(checkbox);
            const checkboxItem = new Checkbox(checkbox, option.text);
            this.addSubscription(checkboxItem);
            fromEvent(checkbox, 'change').subscribe(() => {
                option.selected = checkbox.checked;
                this.writableOptions$.next(this.options);
            });
            fromEvent<MouseEvent>(item, 'click').subscribe((e) => {
                if (e.target === item) {
                    checkbox.click();
                }
            });
            fromEvent<KeyboardEvent>(item, 'keydown').subscribe((e) => {
                if (e.target === item && (e.code === 'Enter' || e.code === 'Space')) {
                    e.preventDefault();
                    checkbox.click();
                }
            });
        } else {
            item.textContent = option.text;
            const updateValue = () => {
                this.options.forEach(o => o.selected = false);
                option.selected = true;
                this.writableOptions$.next(this.options);
            };
            fromEvent(item, 'click').subscribe(updateValue);
            fromEvent<KeyboardEvent>(item, 'keydown').subscribe((e) => {
                if (e.code === 'Enter') {
                    e.preventDefault();
                    updateValue();
                }
            });
        }
        fromEvent(item, 'mouseenter').subscribe(() => {
            item.focus();
        });
        fromEvent<KeyboardEvent>(item, 'keydown').subscribe((e) => {
            if (e.code === 'ArrowDown' && index < items.length - 1) {
                e.preventDefault();
                items[index + 1].focus();
            } else if (e.code === 'ArrowUp' && index > 0) {
                e.preventDefault();
                items[index - 1].focus();
            }
        });
        items.push(item);
        return item;
    }
    private registerEventHandlerWhenOpen(host: Element) {
        const closeDropdown = (escapeKey: boolean = false) => {
            this.writableClose$.next(escapeKey);
            this.hide();
        };
        this.subscriptionWhenOpen.push(fromEvent(window, 'blur').subscribe(() => {
            closeDropdown();
        }));
        this.subscriptionWhenOpen.push(fromEvent<MouseEvent>(window, 'focusin').subscribe((e) => {
            if (!(this.list.contains(e.target as any) || host.contains(e.target as any))) {
                closeDropdown();
            }
        }));
        this.subscriptionWhenOpen.push(fromEvent<MouseEvent>(window, 'mousedown').subscribe((e) => {
            if (!(this.list.contains(e.target as any) || host.contains(e.target as any))) {
                closeDropdown();
            }
        }));
        this.subscriptionWhenOpen.push(fromEvent<KeyboardEvent>(window, 'keydown').subscribe((e) => {
            if (e.code === 'Escape') {
                closeDropdown(true);
            }
        }));
    }
}
```

## File: webviewsrc/worldmap/viewpoint.ts
```typescript
import { Subscriber } from "../util/event";
import { FEWorldMap } from "./loader";
import { Zone, Point } from "./definitions";
import { bboxCenter } from "./graphutils";
import { BehaviorSubject, fromEvent, Observable } from 'rxjs';
type ViewPointObj = { x: number; y: number; scale: number; };
export class ViewPoint extends Subscriber {
    public x: number;
    public y: number;
    public scale: number;
    public observable$: Observable<ViewPointObj>;
    constructor(
        private canvas: HTMLCanvasElement,
        private loader: { worldMap: FEWorldMap | undefined },
        private topBarHeight: number,
        viewPointObj: ViewPointObj,
    ) {
        super();
        this.x = viewPointObj.x;
        this.y = viewPointObj.y;
        this.scale = viewPointObj.scale;
        this.observable$ = new BehaviorSubject<ViewPointObj>(viewPointObj);
        this.enableDragger();
    }
    public convertX(x: number) {
        return Math.round((x - this.x) * this.scale);
    }
    public convertY(y: number) {
        return Math.round((y - this.y) * this.scale);
    }
    public convertBackX(x: number) {
        return Math.floor(x / this.scale + this.x);
    }
    public convertBackY(y: number) {
        return Math.floor(y / this.scale + this.y);
    }
    public bboxInView(bbox: Zone, xoffset: number) {
        const r = this.x + this.canvas.width / this.scale;
        const b = this.y + this.canvas.height / this.scale;
        const br = bbox.x + bbox.w;
        const bb = bbox.y + bbox.h;
        return r > bbox.x + xoffset && br + xoffset > this.x && b > bbox.y && bb > this.y;
    }
    public lineInView(start: Point, end: Point, xoffset: number) {
        const r = this.x + this.canvas.width / this.scale;
        const b = this.y + this.canvas.height / this.scale;
        if (start.x > end.x) {
            const t = start;
            start = end;
            end = t;
        }
        if (start.x >= r || end.x <= this.x) {
            return false;
        }
        const k = (end.y - start.y) / (end.x - start.x);
        const y1 = k * (this.x - start.x - xoffset) + start.y;
        const y2 = k * (r - start.x - xoffset) + start.y;
        return (y1 > this.y && y1 < b) || (y2 > this.y && y2 < b) ||
            (y1 < b && y2 > this.y) || (y1 > this.y && y2 < b);
    }
    public centerZone(zone: Zone) {
        const expectedScale = Math.min(this.canvas.width / zone.w / 2, this.canvas.height / zone.h / 2);
        if (expectedScale < 1) {
            this.scale = Math.pow(2, Math.max(-2, Math.round(Math.log2(expectedScale))));
        } else {
            this.scale = Math.round(Math.min(12, expectedScale));
        }
        this.centerPoint(bboxCenter(zone));
    }
    public centerPoint(point: Point) {
        this.x = point.x - this.canvas.width / 2 / this.scale;
        this.y = point.y - this.canvas.height / 2 / this.scale;
        this.alignViewPointXY();
        this.updateObservable();
    }
    public toJson() {
        return {
            x: this.x,
            y: this.y,
            scale: this.scale,
        };
    }
    private enableDragger() {
        let mdx = -1;
        let mdy = -1;
        let pressed = false;
        let vpx = -1;
        let vpy = -1;
        this.addSubscription(fromEvent<MouseEvent>(this.canvas, 'mousedown').subscribe((e) => {
            if (!this.loader.worldMap || !(e.buttons & 2)) {
                return;
            }
            mdx = e.pageX;
            mdy = e.pageY;
            vpx = this.x;
            vpy = this.y;
            pressed = true;
        }));
        this.addSubscription(fromEvent<MouseEvent>(document.body, 'mousemove').subscribe((e) => {
            if (!this.loader.worldMap) {
                pressed = false;
            }
            if (pressed) {
                this.x = vpx - (e.pageX - mdx) / this.scale;
                this.y = vpy - (e.pageY - mdy) / this.scale;
                this.alignViewPointXY();
                this.updateObservable();
            }
        }));
        this.addSubscription(fromEvent<MouseEvent>(document.body, 'mouseup').subscribe(() => {
            pressed = false;
        }));
        this.addSubscription(fromEvent<MouseEvent>(document.body, 'mouseenter').subscribe((e) => {
            if (pressed && (e.buttons & 2) !== 2) {
                pressed = false;
            }
        }));
        this.addSubscription(fromEvent<WheelEvent>(this.canvas, 'wheel').subscribe((e) => {
            this.x += e.pageX / this.scale;
            this.y += e.pageY / this.scale;
            if (e.deltaY > 0) {
                if (this.scale <= 1) {
                    if (this.scale > 0.25) {
                        this.scale /= 2;
                    }
                } else {
                    this.scale = Math.max(1, this.scale - 1);
                }
            } else if (e.deltaY < 0) {
                if (this.scale < 1) {
                    this.scale *= 2;
                } else {
                    this.scale = Math.min(16, Math.floor(this.scale + 1));
                }
            }
            this.x -= e.pageX / this.scale;
            this.y -= e.pageY / this.scale;
            this.alignViewPointXY();
            this.updateObservable();
        }));
    }
    private alignViewPointXY() {
        if (!this.loader.worldMap) {
            return;
        }
        if (this.loader.worldMap.width === 0) {
            this.x = 0;
        } else {
            while (this.x < 0) {
                this.x += this.loader.worldMap.width;
            }
            while (this.x > this.loader.worldMap.width) {
                this.x -= this.loader.worldMap.width;
            }
        }
        const minY = -this.topBarHeight / this.scale;
        const maxY = this.loader.worldMap.height - this.canvas.height / this.scale;
        if (maxY < minY || this.y < minY) {
            this.y = minY;
        } else if (this.y > maxY) {
            this.y = maxY;
        }
    }
    private updateObservable() {
        (this.observable$ as BehaviorSubject<ViewPointObj>).next(this.toJson());
    }
}
```

## File: src/constants.ts
```typescript
// This file contains constants that may be used in package.json
export const ConfigurationKey = 'hoi4ModUtilities';
export const Hoi4FsSchema = 'hoi4installpath';
export namespace ViewType {
    export const DDS = 'hoi4modutilities.dds';
    export const TGA = 'hoi4modutilities.tga';
}
export namespace ContextName {
    export const ShouldHideHoi4Preview = 'shouldHideHoi4Preview';
    export const ShouldShowHoi4Preview = 'shouldShowHoi4Preview';
    export const Hoi4PreviewType = 'hoi4PreviewType';
    export const Hoi4MUInDev = 'hoi4MUInDev';
    export const Hoi4MULoaded = 'hoi4MULoaded';
}
export namespace Commands {
    export const Preview = 'hoi4modutilities.preview';
    export const PreviewWorld = 'hoi4modutilities.previewworld';
    export const ScanReferences = 'hoi4modutilities.scanreferences';
    export const SelectModFile = 'hoi4modutilities.selectmodfile';
    export const SelectHoiFolder = 'hoi4modutilities.selecthoifolder';
}
export namespace WebviewType {
    export const Preview = 'hoi4ftpreview';
    export const PreviewWorldMap = 'hoi4worldmappreview';
}
```

## File: src/def.d.ts
```typescript
declare module 'vscode' {
    namespace workspace {
        export function getConfiguration(section: 'hoi4ModUtilities'): WorkspaceConfiguration & {
            readonly installPath: string;
            readonly loadDlcContents: boolean;
            readonly modFile: string;
            readonly featureFlags: string[];
            readonly enableSupplyArea: boolean;
            readonly previewLocalisation: 'Brazilian Portuguese' | 'English' | 'French' | 'German' | 'Japanese' | 'Polish' | 'Russian' | 'Simplified Chinese' | 'Spanish';
        };
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
```

## File: src/hoiformat/gui.ts
```typescript
import { Token } from "./hoiparser";
import { NumberLike, SchemaDef, positionSchema, Position, StringIgnoreCase } from "./schema";
export interface Size {
    width: NumberLike;
    height: NumberLike;
    x: NumberLike;
    y: NumberLike;
}
export interface ComplexSize extends Size {
    min: Size;
}
export interface Margin {
    top: NumberLike;
    left: NumberLike;
    right: NumberLike;
    bottom: NumberLike;
}
export type Format = StringIgnoreCase<'left' | 'right' | 'up' | 'down' | 'center'>;
export type Orientation = StringIgnoreCase<
    'upper_left' | 'upper_right' | 'lower_left' | 'lower_right' |
    'center_up' | 'center_down' | 'center_left' | 'center_right' | 'center'
>;
export interface Background {
    name: string;
    spritetype: string;
    quadtexturesprite: string;
    position: Position;
}
export interface GuiTypes {
    containerwindowtype: ContainerWindowType[];
    windowtype: ContainerWindowType[];
}
export interface ContainerWindowType {
    name: string;
    orientation: Orientation;
    origo: Orientation;
    position: Position;
    size: ComplexSize;
    margin: Margin;
    background: Background;
    containerwindowtype: ContainerWindowType[];
    windowtype: ContainerWindowType[];
    gridboxtype: GridBoxType[];
    icontype: IconType[];
    instanttextboxtype: InstantTextBoxType[];
    textboxtype: InstantTextBoxType[];
    buttontype: ButtonType[];
    checkboxtype: ButtonType[];
    guibuttontype: ButtonType[];
    _index: number;
    _token: Token;
}
export interface GridBoxType {
    name: string;
    orientation: Orientation;
    position: Position;
    size: Size;
    background: Background;
    slotsize: Size;
    format: Format;
    _index: number;
    _token: Token;
}
export interface IconType {
    name: string;
    orientation: Orientation;
    position: Position;
    centerposition: boolean;
    spritetype: string;
    quadtexturesprite: string;
    frame: number;
    scale: number;
    _index: number;
    _token: Token;
}
export interface InstantTextBoxType {
    name: string;
    orientation: Orientation;
    position: Position;
    bordersize: Position;
    maxwidth: NumberLike;
    maxheight: NumberLike;
    font: string;
    text: string;
    format: Format;
    vertical_alignment: string;
    _index: number;
    _token: Token;
}
export interface ButtonType {
    name: string;
    orientation: Orientation;
    position: Position;
    spritetype: string;
    quadtexturesprite: string;
    frame: number;
    text: string;
    buttontext: string;
    buttonfont: string;
    scale: number;
    centerposition: boolean;
    _index: number;
    _token: Token;
}
export interface GuiFile {
    guitypes: GuiTypes[];
}
const sizeSchema: SchemaDef<Size> = {
    width: "numberlike",
    height: "numberlike",
    x: "numberlike",
    y: "numberlike",
};
const marginSchema: SchemaDef<Margin> = {
    top: "numberlike",
    left: "numberlike",
    right: "numberlike",
    bottom: "numberlike",
};
const complexSizeSchema: SchemaDef<ComplexSize> = {
    ...sizeSchema,
    min: sizeSchema,
};
const backgroundSchema: SchemaDef<Background> = {
    name: "string",
    spritetype: "string",
    quadtexturesprite: "string",
    position: positionSchema,
};
const gridBoxTypeSchema: SchemaDef<GridBoxType> = {
    name: "string",
    orientation: "stringignorecase",
    position: positionSchema,
    size: sizeSchema,
    slotsize: sizeSchema,
    background: backgroundSchema,
    format: "stringignorecase",
};
const iconTypeSchema: SchemaDef<IconType> = {
    name: "string",
    orientation: "stringignorecase",
    position: positionSchema,
    centerposition: 'boolean',
    spritetype: "string",
    quadtexturesprite: "string",
    frame: "number",
    scale: "number",
};
const instantTextBoxTypeSchema: SchemaDef<InstantTextBoxType> = {
    name: "string",
    orientation: "stringignorecase",
    position: positionSchema,
    bordersize: positionSchema,
    maxwidth: "numberlike",
    maxheight: "numberlike",
    format: "stringignorecase",
    font: "string",
    text: "string",
    vertical_alignment: "string",
};
const buttonTypeSchema: SchemaDef<ButtonType> = {
    name: "string",
    spritetype: "string",
    quadtexturesprite: "string",
    position: positionSchema,
    orientation: "stringignorecase",
    frame: "number",
    text: "string",
    buttontext: "string",
    buttonfont: "string",
    scale: "number",
    centerposition: 'boolean',
};
const containerWindowTypeSchema: SchemaDef<ContainerWindowType> = {
    name: "string",
    orientation: "stringignorecase",
    origo: "stringignorecase",
    position: positionSchema,
    size: complexSizeSchema,
    margin: marginSchema,
    background: backgroundSchema,
    containerwindowtype: {
        _innerType: undefined as any,
        _type: "array",
    },
    windowtype: {
        _innerType: undefined as any,
        _type: "array",
    },
    gridboxtype: {
        _innerType: gridBoxTypeSchema,
        _type: "array",
    },
    icontype: {
        _innerType: iconTypeSchema,
        _type: "array",
    },
    instanttextboxtype: {
        _innerType: instantTextBoxTypeSchema,
        _type: "array",
    },
    textboxtype: {
        _innerType: instantTextBoxTypeSchema,
        _type: "array",
    },
    buttontype: {
        _innerType: buttonTypeSchema,
        _type: "array",
    },
    checkboxtype: {
        _innerType: buttonTypeSchema,
        _type: "array",
    },
    guibuttontype: {
        _innerType: buttonTypeSchema,
        _type: "array",
    },
};
containerWindowTypeSchema.containerwindowtype._innerType = containerWindowTypeSchema;
containerWindowTypeSchema.windowtype._innerType = containerWindowTypeSchema;
const guiTypesSchema: SchemaDef<GuiTypes> = {
    containerwindowtype: {
        _innerType: containerWindowTypeSchema,
        _type: "array",
    },
    windowtype: {
        _innerType: containerWindowTypeSchema,
        _type: "array",
    },
};
export const guiFileSchema: SchemaDef<GuiFile> = {
    guitypes: {
        _innerType: guiTypesSchema,
        _type: "array",
    },
};
```

## File: src/hoiformat/hoiparser.ts
```typescript
import { UserError } from '../util/common';
export type NodeValue = string | number | Node[] | SymbolNode | null;
export interface Node {
    name: string | null;
    operator: string | null;
    value: NodeValue;
    valueAttachment: SymbolNode | null;
    valueAttachmentToken: Token | null;
    nameToken: Token | null;
    operatorToken: Token | null;
    valueStartToken: Token | null;
    valueEndToken: Token | null;
}
export interface SymbolNode {
    name: string;
}
interface Tokenizer<T extends string> {
    peek: () => Token<T>;
    next: () => Token<T>;
    throw: (message: string, prev?: boolean) => never;
}
export interface Token<T extends string = string> {
    value: string;
    start: number;
    end: number;
    type: T;
}
function tokenizer<T extends string>(input: string, tokenRegexStrings: Record<T, [string, number]>, errorMessagePrefix: string = ''): Tokenizer<T> {
    const types = Object.keys(tokenRegexStrings);
    const typeEntries = Object.entries<[string, number]>(tokenRegexStrings);
    typeEntries.sort((a, b) => a[1][1] - b[1][1]);
    const regex = new RegExp(
        '\\s*(?<result>' +
            typeEntries.map(([n, [s]]) => `(?<${n}>${s})`).join('|')
            + ')',
        'y');
    let prevPos = 0;
    let pos = 0;
    let token: Token<T> | null = null;
    let groups: RegExpExecArray | null = null;
    let sum = 0;
    const lineLengthSums = input.split('\n').map(v => v.length).map(v => sum = (sum+ v + 1));
    function nextGroups() {
        prevPos = pos;
        do {
            groups = regex.exec(input);
            if (groups === null) {
                throwError("Invalid token");
            }
            const result = groups.groups!['result'];
            // input = input.substr(groups[0].length);
            pos += groups[0].length;
            const localGroups = groups;
            const type = types.find(t => localGroups.groups![t] !== undefined);
            token = {
                value: result,
                start: pos - result.length,
                end: pos,
                type: type as T,
            };
        } while (token.type === 'comment');
    }
    function peek(): Token<T> {
        if (groups !== null) {
            return token!;
        }
        nextGroups();
        return token!;
    }
    function throwError(message: string, prev: boolean = false): never {
        const calculatePos = prev ? prevPos : pos;
        const line = lineLengthSums.findIndex(v => v > calculatePos);
        const column = line > 0 ? calculatePos - lineLengthSums[line - 1] : calculatePos;
        const posString = line === -1 ?
            ` at (${lineLengthSums.length}, ${lineLengthSums.length > 1 ? lineLengthSums[lineLengthSums.length - 1] - lineLengthSums[lineLengthSums.length - 2] + 1 : lineLengthSums[lineLengthSums.length - 1] + 1})` :
            ` at (${line + 1}, ${column + 1})`;
        throw new UserError(errorMessagePrefix + message + `${posString}: ` + (input + "(EOF)").substring(calculatePos, Math.min(calculatePos + 30, input.length + 5)));
    }
    return {
        peek,
        next: () => {
            const result = peek();
            groups = null;
            return result;
        },
        throw: throwError,
    };
}
type HOITokenType = 'comment' | 'symbol' | 'operator' | 'string' | 'number' | 'unitnumber' | 'eof';
const tokenRegexStrings: Record<HOITokenType, [string, number]> = {
    comment: ['#.*(?:[\\r\\n]|$)', 0],
    symbol: ['(?:\\d+\\.)?[a-zA-Z_@\\[\\]][\\w:\\._@\\[\\]\\-\\?\\^\\/\\u00A0-\\u024F|]*', 40],
    operator: ['[={}<>;,]|>=|<=|!=', 10],
    string: ['"(?:\\\\"|\\\\\\\\|[^"])*"', 10],
    number: ['-?\\d*\\.\\d+|-?\\d+|0x\\d+', 50],
    unitnumber: ['(?:-?\\d*\\.\\d+|-?\\d+)(?:%%?)', 49],
    eof: ['$', 1000],
};
export function parseHoi4File(input: string, errorMessagePrefix: string = ''): Node {
    const tokens = tokenizer(input, tokenRegexStrings, errorMessagePrefix);
    const value = parseBlockContent(tokens);
    if (tokens.peek().type !== 'eof') {
        tokens.throw("File content can't be completely parsed");
    }
    return {
        name: null,
        nameToken: null,
        operator: null,
        operatorToken: null,
        value,
        valueStartToken: null,
        valueEndToken: null,
        valueAttachment: null,
        valueAttachmentToken: null,
    };
}
function parseNode(tokens: Tokenizer<HOITokenType>): Node {
    const name = tokens.next();
    if (name.type !== 'string' && name.type !== 'symbol' && name.type !== 'number') {
        tokens.throw("Expect name to be symbol, string or number", true);
    }
    let nextToken = tokens.peek();
    if (nextToken.type !== 'operator' || nextToken.value.match(/^[,;}]$/)) {
        while (nextToken.value.match(/^[,;]$/)) {
            tokens.next();
            nextToken = tokens.peek();
        }
        let nameValue = name.value;
        if (name.type === 'string') {
            nameValue = nameValue.substr(1, nameValue.length - 2).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }
        return {
            name: name.value,
            nameToken: name,
            operator: null,
            operatorToken: null,
            value: null,
            valueStartToken: null,
            valueEndToken: null,
            valueAttachment: null,
            valueAttachmentToken: null,
        };
    }
    let operator: Token<HOITokenType>;
    if (nextToken.value === '{') {
        operator = {
            ...nextToken,
            value: '=',
        };
    } else {
        operator = tokens.next();
    }
    let valueAttachment: SymbolNode | null = null;
    let valueAttachmentToken: Token | null = null;
    let [value, valueStartToken, valueEndToken] = parseNodeValue(tokens);
    if (value !== null && typeof value === 'object' && 'name' in value) {
        const nextToken = tokens.peek();
        if (nextToken.value === '{') {
            valueAttachment = value;
            valueAttachmentToken = valueStartToken;
            [value, valueStartToken, valueEndToken] = parseNodeValue(tokens);
        }
    }
    let tailComma = tokens.peek();
    while (tailComma.value.match(/^[,;]$/)) {
        tokens.next();
        tailComma = tokens.peek();
    }
    return {
        name: name.value,
        nameToken: name,
        operator: operator.value,
        operatorToken: operator,
        value,
        valueStartToken,
        valueEndToken,
        valueAttachment,
        valueAttachmentToken,
    };
}
function parseNodeValue(tokens: Tokenizer<HOITokenType>): [ NodeValue, Token<HOITokenType>, Token<HOITokenType> ] {
    const nextToken = tokens.next();
    switch (nextToken.type) {
        case 'string':
            return [
                nextToken.value.substr(1, nextToken.end - nextToken.start - 2).replace(/\\"/g, '"').replace(/\\\\/g, '\\'),
                nextToken,
                nextToken,
            ];
        case 'number':
            const nextTokenValue = nextToken.value;
            return [
                nextTokenValue.startsWith('0x') ? parseInt(nextTokenValue.substr(2), 16) : parseFloat(nextTokenValue),
                nextToken,
                nextToken,
            ];
        case 'symbol':
        case 'unitnumber':
            return [
                { name: nextToken.value },
                nextToken,
                nextToken,
            ];
        case 'operator':
            if (nextToken.value === '{') {
                const result = parseBlockContent(tokens);
                const right = tokens.next();
                if (right.value !== '}') {
                    tokens.throw("Expect a '}'", true);
                }
                return [
                    result,
                    nextToken,
                    right,
                ];
            }
            break;
    }
    tokens.throw("Expect string, number, symbol, or {", true);
}
function parseBlockContent(tokens: Tokenizer<HOITokenType>): Node[] {
    const nodes: Node[] = [];
    while (true) {
        const nextToken = tokens.peek();
        if (nextToken.type === 'eof' || nextToken.value === "}") {
            break;
        }
        nodes.push(parseNode(tokens));
    }
    return nodes;
}
```

## File: src/hoiformat/scope.ts
```typescript
import { arrayToMap } from "../util/common";
import { Node } from "./hoiparser";
import { variableRegexForScope } from "./schema";
export type ScopeType = 'country' | 'state' | 'leader' | 'operative' | 'division' | 'character' | 'mio' | 'purchaseContract' | 'unknown';
export interface Scope {
    scopeName: string;
    scopeType: ScopeType;
}
export interface ScopeDef {
    name: string;
    from: ScopeType | '*';
    to: ScopeType;
    condition: boolean;
    effect: boolean;
}
export const countryScope: Scope = { scopeName: '', scopeType: 'country' };
export function tryMoveScope(node: Node, scopeStack: Scope[], type: 'condition' | 'effect'): boolean {
    if (!node.name) {
        return false;
    }
    if (typeof node.value !== 'object' || !Array.isArray(node.value)) {
        return false;
    }
    let nodeName = node.name.trim();
    if (nodeName.match(/^[A-Z][A-Z0-9]{2}$/)) {
        scopeStack.push({
            scopeName: nodeName,
            scopeType: 'country',
        });
        return true;
    }
    if (nodeName.match(/^[A-Z][A-Z0-9]{2}_/)) {
        scopeStack.push({
            scopeName: nodeName,
            scopeType: 'character',
        });
        return true;
    }
    if (nodeName.match(/^mio:/)) {
        scopeStack.push({
            scopeName: nodeName.substring(4),
            scopeType: 'mio',
        });
        return true;
    }
    if (nodeName.match(/^[0-9]+$/)) {
        scopeStack.push({
            scopeName: nodeName,
            scopeType: 'state',
        });
        return true;
    }
    const originalNodeName = nodeName;
    nodeName = nodeName.toLowerCase();
    const currentScope = scopeStack[scopeStack.length - 1];
    if (nodeName === 'this') {
        scopeStack.push(currentScope);
        return true;
    }
    if (nodeName === 'root') {
        scopeStack.push(scopeStack[0]);
        return true;
    }
    if (nodeName.match(/^prev(?:\.prev)*$/)) {
        const count = nodeName.split('.').length;
        const scope = scopeStack[Math.max(0, scopeStack.length - 1 - count)];
        scopeStack.push(scope);
        return true;
    }
    if (nodeName.match(/^from$/) && currentScope?.scopeType === 'mio') {
        scopeStack.push({
            scopeName: originalNodeName,
            scopeType: 'country',
        });
        return true;
    }
    if (nodeName.match(/^from(?:\.from)*$/)) {
        scopeStack.push({
            scopeName: originalNodeName,
            scopeType: 'unknown',
        });
        return true;
    }
    const variableMatch = variableRegexForScope.exec(node.name.trim());
    if (variableMatch) {
        let global = false;
        const prefix = variableMatch.groups?.prefix.toLowerCase();
        if (prefix === 'global_event_target' || prefix === 'event_target') {
            global = true;
        } else if (prefix === 'var') {
            const scope = variableMatch.groups?.scope;
            if (scope) {
                const scopeLowerCase = scope.toLowerCase();
                global = !!(scope.match(/^(?:[A-Z][A-Z0-9]{2}|\d+)(?:$|\.)/) ||
                    scopeLowerCase.match(/^(?:global)(?:$|\.)/));
            }
        }
        scopeStack.push({
            scopeName: global ? '{' + nodeName + '}' : currentScope.scopeName + '.{' + nodeName + '}',
            scopeType: 'unknown',
        });
        return true;
    }
    const scopeDef = scopeDefs[nodeName];
    if (scopeDef && ((type === 'condition' && scopeDef.condition) || (type === 'effect' && scopeDef.effect))) {
        if (scopeDef.from === '*') {
            scopeStack.push({
                scopeName: scopeDef.name,
                scopeType: scopeDef.to,
            });
            return true;
        } else if (scopeDef.from === currentScope.scopeType || currentScope.scopeType === 'unknown') {
            scopeStack.push({
                scopeName: currentScope.scopeName + '.' + scopeDef.name,
                scopeType: scopeDef.to,
            });
            return true;
        }
    }
    return false;
}
function scopeDef(name: string, condition: boolean, effect: boolean, from: ScopeType | '*', to: ScopeType): ScopeDef {
    return { name, condition, effect, from, to };
}
export const scopeDefs = arrayToMap([
    scopeDef("all_unit_leader", true, false, 'country', 'leader'),
    scopeDef("any_unit_leader", true, false, 'country', 'leader'),
    scopeDef("all_army_leader", true, false, 'country', 'leader'),
    scopeDef("any_army_leader", true, false, 'country', 'leader'),
    scopeDef("all_navy_leader", true, false, 'country', 'leader'),
    scopeDef("any_navy_leader", true, false, 'country', 'leader'),
    scopeDef("random_unit_leader", false, true, 'country', 'leader'),
    scopeDef("every_unit_leader", false, true, 'country', 'leader'),
    scopeDef("random_army_leader", false, true, 'country', 'leader'),
    scopeDef("every_army_leader", false, true, 'country', 'leader'),
    scopeDef("random_navy_leader", false, true, 'country', 'leader'),
    scopeDef("every_navy_leader", false, true, 'country', 'leader'),
    scopeDef("global_every_army_leader", false, true, '*', 'leader'),
    scopeDef("overlord", true, true, 'country', 'country'),
    scopeDef("faction_leader", true, true, 'country', 'country'),
    // scoepDef("TAG"),
    scopeDef("any_country", true, false, '*', 'country'),
    scopeDef("any_country_with_original_tag", true, false, '*', 'country'),
    scopeDef("any_neighbor_country", true, false, 'country', 'country'),
    scopeDef("any_home_area_neighbor_country", true, false, 'country', 'country'),
    scopeDef("any_guaranteed_country", true, false, 'country', 'country'),
    scopeDef("any_allied_country", true, false, 'country', 'country'),
    scopeDef("any_other_country", true, false, 'country', 'country'),
    scopeDef("any_enemy_country", true, false, 'country', 'country'),
    scopeDef("any_occupied_country", true, false, 'country', 'country'),
    scopeDef("all_neighbor_country", true, false, 'country', 'country'),
    scopeDef("all_country", true, false, '*', 'country'),
    scopeDef("all_country_with_original_tag", true, false, '*', 'country'),
    scopeDef("all_allied_country", true, false, 'country', 'country'),
    scopeDef("all_guaranteed_country", true, false, 'country', 'country'),
    scopeDef("all_enemy_country", true, false, 'country', 'country'),
    scopeDef("all_occupied_country", true, false, 'country', 'country'),
    // scopeDef("state_id"),
    scopeDef("any_state", true, false, '*', 'state'),
    scopeDef("any_controlled_state", true, false, 'country', 'state'),
    scopeDef("any_owned_state", true, false, 'country', 'state'),
    scopeDef("any_neighbor_state", true, false, 'state', 'state'),
    scopeDef("all_state", true, false, '*', 'state'),
    scopeDef("all_controlled_state", true, false, 'country', 'state'),
    scopeDef("all_owned_state", true, false, 'country', 'state'),
    scopeDef("all_neighbor_state", true, false, 'state', 'state'),
    scopeDef("any_country_with_core", true, false, 'state', 'country'),
    scopeDef("any_country_division", true, false, 'country', 'division'),
    scopeDef("any_state_division", true, false, 'state', 'division'),
    scopeDef("all_subject_countries", true, false, 'country', 'country'),
    scopeDef("any_subject_country", true, false, 'country', 'country'),
    scopeDef("all_core_state", true, false, 'country', 'state'),
    scopeDef("any_core_state", true, false, 'country', 'state'),
    scopeDef("all_character", true, false, 'country', 'character'),
    scopeDef("any_character", true, false, 'country', 'character'),
    scopeDef("every_country", false, true, '*', 'country'),
    scopeDef("every_country_with_original_tag", false, true, '*', 'country'),
    scopeDef("every_other_country", false, true, 'country', 'country'),
    scopeDef("every_neighbor_country", false, true, 'country', 'country'),
    scopeDef("every_enemy_country", false, true, 'country', 'country'),
    scopeDef("every_occupied_country", false, true, 'country', 'country'),
    scopeDef("random_country", false, true, '*', 'country'),
    scopeDef("random_country_with_original_tag", false, true, '*', 'country'),
    scopeDef("random_neighbor_country", false, true, 'country', 'country'),
    scopeDef("random_enemy_country", false, true, 'country', 'country'),
    scopeDef("random_occupied_country", false, true, 'country', 'country'),
    scopeDef("random_state", false, true, '*', 'state'),
    scopeDef("random_owned_state", false, true, 'country', 'state'),
    scopeDef("random_controlled_state", false, true, 'country', 'state'),
    scopeDef("random_owned_controlled_state", false, true, 'country', 'state'),
    scopeDef("random_neighbor_state", false, true, 'state', 'state'),
    scopeDef("every_state", false, true, '*', 'state'),
    scopeDef("every_controlled_state", false, true, 'country', 'state'),
    scopeDef("every_owned_state", false, true, 'country', 'state'),
    scopeDef("every_neighbor_state", false, true, 'state', 'state'),
    scopeDef("capital_scope", true, true, 'country', 'state'),
    scopeDef("owner", false, true, 'state', 'country'),
    scopeDef("controller", false, true, 'state', 'country'),
    scopeDef("all_operative_leader", true, false, 'country', 'operative'),
    scopeDef("any_operative_leader", true, false, 'country', 'operative'),
    scopeDef("every_operative", false, true, 'country', 'operative'),
    scopeDef("random_operative", false, true, 'country', 'operative'),
    scopeDef("every_country_division", false, true, 'country', 'division'),
    scopeDef("random_country_division", false, true, 'country', 'division'),
    scopeDef("every_state_division", false, true, 'state', 'division'),
    scopeDef("random_state_division", false, true, 'state', 'division'),
    scopeDef("every_possible_country", false, true, '*', 'country'),
    scopeDef("every_subject_country", false, true, 'country', 'country'),
    scopeDef("random_subject_country", false, true, 'country', 'country'),
    scopeDef("every_core_state", false, true, 'country', 'state'),
    scopeDef("random_core_state", false, true, 'country', 'state'),
    scopeDef("every_character", false, true, 'country', 'character'),
    scopeDef("random_character", false, true, 'country', 'character'),
    scopeDef("all_military_industrial_organization", true, false, 'country', 'mio'),
    scopeDef("any_military_industrial_organization", true, false, 'country', 'mio'),
    scopeDef("every_military_industrial_organization", false, true, 'country', 'mio'),
    scopeDef("random_military_industrial_organization", false, true, 'country', 'mio'),
    scopeDef("all_military_purchase_contract", true, false, 'country', 'purchaseContract'),
    scopeDef("any_military_purchase_contract", true, false, 'country', 'purchaseContract'),
    scopeDef("every_military_purchase_contract", false, true, 'country', 'purchaseContract'),
    scopeDef("random_military_purchase_contract", false, true, 'country', 'purchaseContract'),
], 'name');
```

## File: src/previewdef/event/contentbuilder.ts
```typescript
import * as vscode from 'vscode';
import { EventsLoader, EventsLoaderResult } from './loader';
import { LoaderSession } from '../../util/loader/loader';
import { debug } from '../../util/debug';
import { html, htmlEscape } from '../../util/html';
import { localize } from '../../util/i18n';
import { StyleTable, normalizeForStyle } from '../../util/styletable';
import { HOIEvent, HOIEventType } from './schema';
import { flatten, repeat, max } from 'lodash';
import { arrayToMap, forceError } from '../../util/common';
import { HOIPartial, toNumberLike, toStringAsSymbolIgnoreCase } from '../../hoiformat/schema';
import { GridBoxType } from '../../hoiformat/gui';
import { renderGridBox, GridBoxItem, GridBoxConnection } from '../../util/hoi4gui/gridbox';
import { Token } from '../../hoiformat/hoiparser';
import { getSpriteByGfxName } from '../../util/image/imagecache';
import { getLocalisedTextQuick } from "../../util/localisationIndex";
import { localisationIndex } from "../../util/featureflags";
export async function renderEventFile(loader: EventsLoader, uri: vscode.Uri, webview: vscode.Webview): Promise<string> {
    const setPreviewFileUriScript = { content: `window.previewedFileUri = "${uri.toString()}";` };
    try {
        const session = new LoaderSession(false);
        const loadResult = await loader.load(session);
        const loadedLoaders = Array.from((session as any).loadedLoader).map<string>(v => (v as any).toString());
        debug('Loader session event tree', loadedLoaders);
        const styleTable = new StyleTable();
        const baseContent = await renderEvents(loadResult.result, styleTable);
        return html(
            webview,
            baseContent,
            [
                setPreviewFileUriScript,
                'common.js',
                'eventtree.js',
            ],
            [
                'codicon.css',
                styleTable
            ],
        );
    } catch (e) {
        const baseContent = `${localize('error', 'Error')}: <br/>  <pre>${htmlEscape(forceError(e).toString())}</pre>`;
        return html(webview, baseContent, [ setPreviewFileUriScript ], []);
    }
}
const leftPaddingBase = 50;
const topPaddingBase = 50;
const xGridSize = 180;
const yGridSize = 150;
async function renderEvents(eventsLoaderResult: EventsLoaderResult, styleTable: StyleTable): Promise<string> {
    const leftPadding = leftPaddingBase;
    const topPadding = topPaddingBase;
    const gridBox: HOIPartial<GridBoxType> = {
        position: { x: toNumberLike(leftPadding), y: toNumberLike(topPadding) },
        format: toStringAsSymbolIgnoreCase('up'),
        size: { width: toNumberLike(xGridSize), height: undefined },
        slotsize: { width: toNumberLike(xGridSize), height: toNumberLike(yGridSize) },
    } as HOIPartial<GridBoxType>;
    const eventIdToEvent = arrayToMap(flatten(Object.values(eventsLoaderResult.events.eventItemsByNamespace)), 'id');
    const graph = eventsToGraph(eventIdToEvent, eventsLoaderResult.mainNamespaces);
    const idToContentMap: Record<string, string> = {};
    const gridBoxItems = await graphToGridBoxItems(graph, idToContentMap, eventsLoaderResult, styleTable);
    const renderedGridBox = await renderGridBox(gridBox, {
        size: { width: 0, height: 0 },
        orientation: 'upper_left'
    }, {
        styleTable,
        items: arrayToMap(gridBoxItems, 'id'),
        onRenderItem: async (item) => idToContentMap[item.id],
        cornerPosition: 0.5,
    });
    return `
        <div id="dragger" class="${styleTable.oneTimeStyle('dragger', () => `
            width: 100vw;
            height: 100vh;
            position: fixed;
            left:0;
            top:0;
        `)}"></div>
        <div id="eventtreecontent" class="${styleTable.oneTimeStyle('eventtreecontent', () => `
            left: -20px;
            position: relative;
        `)}">
            ${renderedGridBox}
        </div>
    `;
}
interface EventNode {
    event: HOIEvent;
    loop: boolean;
    children: (EventEdge | OptionNode)[];
    relatedNamespace: string[];
    token: Token | undefined;
}
interface OptionNode {
    optionName: string;
    children: EventEdge[];
    file: string;
    token: Token | undefined;
}
interface EventEdge {
    toScope: string;
    toNode: EventNode | string;
    days: number;
    hours: number;
    randomDays: number;
    randomHours: number;
}
function eventsToGraph(eventIdToEvent: Record<string, HOIEvent>, mainNamespaces: string[]): EventNode[] {
    const eventIdToNode: Record<string, EventNode> = {};
    const eventHasParent: Record<string, boolean> = {};
    const eventStack: HOIEvent[] = [];
    for (const event of Object.values(eventIdToEvent)) {
        eventToNode(event, eventIdToEvent, eventStack, eventIdToNode, eventHasParent);
    }
    const result: EventNode[] = [];
    for (const event of Object.values(eventIdToEvent)) {
        if (!eventHasParent[event.id]) {
            const eventNode = eventIdToNode[event.id];
            if (eventNode.relatedNamespace.some(n => mainNamespaces.includes(n))) {
                result.push(eventNode);
            }
        }
    }
    return result;
}
function eventToNode(
    event: HOIEvent,
    eventIdToEvent: Record<string, HOIEvent>,
    eventStack: HOIEvent[],
    eventIdToNode: Record<string, EventNode>,
    eventHasParent: Record<string, boolean>
): EventNode {
    const cachedNode = eventIdToNode[event.id];
    if (cachedNode) {
        return cachedNode;
    }
    eventStack.push(event);
    const eventNode: EventNode = {
        event,
        children: [],
        relatedNamespace: [event.namespace],
        token: event.token,
        loop: false,
    };
    eventIdToNode[event.id] = eventNode;
    for (const option of [event.immediate, ...event.options]) {
        const isImmediate = !option.name;
        const optionNode: OptionNode = {
            optionName: option.name ?? ':immediate',
            children: [],
            file: event.file,
            token: option.token,
        };
        if (!isImmediate) {
            eventNode.children.push(optionNode);
        }
        for (const childEvent of option.childEvents) {
            const childEventItem = eventIdToEvent[childEvent.eventName];
            eventHasParent[childEvent.eventName] = true;
            let toNode: EventNode | string;
            if (!childEventItem) {
                toNode = childEvent.eventName;
            } else if (eventStack.includes(childEventItem)) {
                toNode = eventToNode(childEventItem, eventIdToEvent, eventStack, eventIdToNode, eventHasParent);
                toNode = {
                    ...toNode,
                    children: [],
                    loop: true,
                };
            } else {
                toNode = eventToNode(childEventItem, eventIdToEvent, eventStack, eventIdToNode, eventHasParent);
                toNode.relatedNamespace.forEach(n => {
                    if (!eventNode.relatedNamespace.includes(n)) {
                        eventNode.relatedNamespace.push(n);
                    }
                });
            }
            const eventEdge: EventEdge = {
                toNode,
                toScope: childEvent.scopeName,
                days: childEvent.days,
                hours: childEvent.hours,
                randomDays: childEvent.randomDays,
                randomHours: childEvent.randomHours,
            };
            if (isImmediate) {
                eventNode.children.push(eventEdge);
            } else {
                optionNode.children.push(eventEdge);
            }
        }
    }
    eventStack.pop();
    return eventNode;
}
interface GridBoxTree {
    id: string;
    items: GridBoxItem[];
    starts: number[];
    ends: number[];
}
async function graphToGridBoxItems(
    graph: EventNode[],
    idToContentMap: Record<string, string>,
    eventsLoaderResult: EventsLoaderResult,
    styleTable: StyleTable
): Promise<GridBoxItem[]> {
    const resultTree: GridBoxTree = {
        id: '',
        items: [],
        starts: [],
        ends: [],
    };
    const idContainer = { id: 0 };
    for (const eventNode of graph) {
        const scopeContext: ScopeContext = {
            fromStack: [],
            currentScopeName: 'EVENT_TARGET',
        };
        const tree = await eventNodeToGridBoxItems(eventNode, undefined, idToContentMap, scopeContext, eventsLoaderResult, styleTable, idContainer);
        idToContentMap[tree.id] = await makeEventNode(scopeContext.currentScopeName, eventNode, undefined, eventsLoaderResult, styleTable);
        appendChildToTree(resultTree, tree);
    }
    return resultTree.items;
}
async function eventNodeToGridBoxItems(
    node: EventNode | OptionNode | string,
    edge: EventEdge | undefined,
    idToContentMap: Record<string, string>,
    scopeContext: ScopeContext,
    eventsLoaderResult: EventsLoaderResult,
    styleTable: StyleTable,
    idContainer: { id: number },
): Promise<GridBoxTree> {
    const result: GridBoxTree = {
        id: '',
        items: [],
        starts: [],
        ends: [],
    };
    const childIds: string[] = [];
    if (typeof node === 'object') {
        for (const child of node.children) {
            let tree: GridBoxTree;
            if ('toNode' in child) {
                const toNode = child.toNode;
                const nextScopeContext = nextScope(scopeContext, child.toScope);
                tree = await eventNodeToGridBoxItems(toNode, child, idToContentMap, nextScopeContext, eventsLoaderResult, styleTable, idContainer);
            } else {
                tree = await eventNodeToGridBoxItems(child, undefined, idToContentMap, scopeContext, eventsLoaderResult, styleTable, idContainer);
            }
            childIds.push(tree.id);
            appendChildToTree(result, tree, 1, true);
        }
    }
    const isOption = typeof node === 'object' && !('event' in node);
    const id = (typeof node === 'object' ? ('event' in node ? node.event.id : node.optionName) : node) + ':' + (idContainer.id++);
    if (isOption) {
        idToContentMap[id] = await makeOptionNode(node as OptionNode, eventsLoaderResult, styleTable);
    } else {
        idToContentMap[id] = await makeEventNode(scopeContext.currentScopeName,
            typeof node === 'object' ? node as EventNode : node, edge, eventsLoaderResult, styleTable);
    }
    const x = result.starts.length < 2 ? 0 : Math.floor((result.ends[1] + result.starts[1] - 1) / 2);
    result.id = id;
    result.items.push({
        id,
        gridX: x,
        gridY: 0,
        connections: childIds.map<GridBoxConnection>(id => ({
            target: id,
            targetType: 'child',
            style: '1px solid #88aaff'
        })),
    });
    if (result.starts.length === 0) {
        result.starts.push(0);
        result.ends.push(1);
    } else {
        if (result.starts[0] === result.ends[0]) {
            result.starts[0] = x;
            result.ends[0] = x + 1;
        } else {
            result.starts[0] = Math.min(x, result.starts[0] ?? 0);
            result.ends[0] = Math.max(x + 1, result.ends[0] ?? 0);
        }
    }
    return result;
}
interface ScopeContext {
    fromStack: string[];
    currentScopeName: string;
}
function nextScope(scopeContext: ScopeContext, toScope: string): ScopeContext {
    let currentScopeName: string;
    if (toScope.match(/^from(?:\.from)*$/)) {
        const fromCount = toScope.split('.').length;
        const fromIndex = scopeContext.fromStack.length - fromCount;
        if (fromIndex < 0) {
            currentScopeName = (scopeContext.fromStack.length > 0 ? scopeContext.fromStack[0] : scopeContext.currentScopeName) +
                repeat('.FROM', -fromIndex);
        } else {
            currentScopeName = scopeContext.fromStack[fromIndex];
        }
    } else {
        currentScopeName = toScope.replace(/\{event_target\}/g, scopeContext.currentScopeName);
    }
    return {
        fromStack: [ ...scopeContext.fromStack, scopeContext.currentScopeName ],
        currentScopeName,
    };
}
const typeToIcon: Record<HOIEventType, string> = {
    state: 'location',
    country: 'globe',
    unit_leader: 'account',
    news: 'note',
    operative_leader: 'device-camera',
};
const flagIcons: string[] = [
    'eye-closed',
    'sync-ignored',
    'broadcast',
    'refresh',
];
async function makeEventNode(scope: string, eventNode: EventNode | string, edge: EventEdge | undefined, eventsLoaderResult: EventsLoaderResult, styleTable: StyleTable): Promise<string> {
    if (typeof eventNode === 'object') {
        const { localizationDict, gfxFiles } = eventsLoaderResult;
        const event = eventNode.event;
        const eventId = event.id;
        const title = `${event.type}_event\n${localize('eventtree.eventid', 'Event ID: ')}${eventId}\n` +
            (event.major ? localize('eventtree.major', 'Major') + '\n' : '') +
            (event.hidden ? localize('eventtree.hidden', 'Hidden') + '\n' : '') +
            (event.fire_only_once ? localize('eventtree.fireonlyonce', 'Fire only once') + '\n' : '') +
            (event.isTriggeredOnly ? localize('eventtree.istriggeredonly', 'Is triggered only') :
                `${localize('eventtree.mtthbase', 'Mean time to happen (base): ')}${event.meanTimeToHappenBase} ${localize('days', 'day(s)')}`) + '\n' +
            (edge !== undefined && (edge.days > 0 || edge.hours > 0 || edge.randomDays > 0 || edge.randomHours > 0) ? 
                localize('eventtree.delay', 'Delay: ') + (edge.days > 0 || edge.hours > 0 ?
                    `${edge.randomDays > 0 ? `${edge.days}-${edge.days + edge.randomDays}` : edge.days} ${localize('days', 'day(s)')}` :
                    `${edge.randomHours > 0 ? `${edge.hours}-${edge.hours + edge.randomHours}` : edge.hours} ${localize('hours', 'hour(s)')}`) + '\n' :
                '') +
            `${localize('eventtree.scope', 'Scope: ')}${scope}\n${localize('eventtree.title', 'Title: ')}${localisationIndex ? await getLocalisedTextQuick(event.title) : event.title}`;
        const flags = [event.hidden, event.fire_only_once, event.major, eventNode.loop];
        const content = `<p class="
                ${styleTable.style('paragraph', () => 'margin: 5px 0; text-overflow: ellipsis; overflow: hidden;')}
                ${styleTable.style('white-space-nowrap', () => 'white-space: nowrap;')}
            ">
                ${makeIcon(typeToIcon[event.type], styleTable)}
                ${eventId}
                ${flags.includes(true) ? '<br/>' + flags.map((v, i) => v ? makeIcon(flagIcons[i], styleTable) : '').join(' ') : ''}
                ${!event.isTriggeredOnly ?
                    `<br/>${makeIcon('history', styleTable)} ${event.meanTimeToHappenBase} ${localize('days', 'day(s)')}` :
                    ''}
                <br/>
                ${makeIcon('symbol-namespace', styleTable)} ${scope}
                ${edge !== undefined && (edge.days > 0 || edge.hours > 0 || edge.randomDays > 0 || edge.randomHours > 0) ?
                    `<br/>${makeIcon('watch', styleTable)} ${edge.days > 0 || edge.hours > 0 ?
                        `${edge.randomDays > 0 ? `${edge.days}-${edge.days + edge.randomDays}` : edge.days} ${localize('days', 'day(s)')}` :
                        `${edge.randomHours > 0 ? `${edge.hours}-${edge.hours + edge.randomHours}` : edge.hours} ${localize('hours', 'hour(s)')}`}`
                    : ''}
            </p>
            <p class="${styleTable.style('paragraph', () => 'margin: 5px 0; text-overflow: ellipsis; overflow: hidden;')}">
                ${localisationIndex? await getLocalisedTextQuick(event.title) : event.title}
            </p>`;
        const extraAttributes = [];
        const extraClasses = [
            styleTable.style('event-item', () => 'background: rgba(255, 80, 80, 0.5);'),
            styleTable.style('cursor-pointer', () => 'cursor: pointer;'),
        ];
        if (event.token) { 
            extraAttributes.push(`
                start="${event.token.start}"
                end="${event.token.end}"
                ${event.file ? `file="${event.file}"` : ''}
            `);
            extraClasses.push('navigator');
        }
        const picture = event.picture ? await getSpriteByGfxName(event.picture, gfxFiles) : undefined;
        if (picture) {
            const pictureStyle = styleTable.style('event-picture-' + normalizeForStyle(event.picture ?? '-empty'), () => `
                background-image: url(${picture.image.uri});
                background-size: ${picture.image.width}px;
                width: ${picture.image.width}px;
                height: ${picture.image.height}px;
            `);
            extraAttributes.push(`
                picture-style-key="${pictureStyle}"
                picture-width="${picture.image.width}"
            `);
            extraClasses.push('event-picture-host');
        }
        return makeNode(
            content,
            title,
            styleTable,
            extraClasses.join(' '),
            extraAttributes.join(' '));
    } else {
        const eventId = eventNode;
        const title = `${localize('eventtree.eventid', 'Event ID: ')}${eventId}\n${localize('eventtree.scope', 'Scope: ')}${scope}`;
        let contentText = '';
        if (localisationIndex) {
            let localizedTitle = await getLocalisedTextQuick(eventId);
            if (localizedTitle !== eventId && localizedTitle != null) {
                contentText += `<br/>${localizedTitle}`;
            } else {
                localizedTitle = await getLocalisedTextQuick(`${eventId}.t`);
                if (localizedTitle !== `${eventId}.t` && localizedTitle != null) {
                    contentText += `<br/>${localizedTitle}`;
                }
            }
        }
        const content = `<p class="
                ${styleTable.style('paragraph', () => 'margin: 5px 0; text-overflow: ellipsis; overflow: hidden;')}
                ${styleTable.style('white-space-nowrap', () => 'white-space: nowrap;')}
            ">
                ${makeIcon('question', styleTable)}
                ${eventId}
                <br/>
                ${makeIcon('symbol-namespace', styleTable)} ${scope}
                ${contentText}
            </p>`;
        return makeNode(content, title, styleTable, styleTable.style('event-item', () => 'background: rgba(255, 80, 80, 0.5);'));
    }
}
function makeIcon(type: string, styleTable: StyleTable): string {
    return `<i class="codicon codicon-${type} ${styleTable.style('bottom', () => 'vertical-align: bottom;')}"></i>`;
}
async function makeOptionNode(option: OptionNode, eventsLoaderResult: EventsLoaderResult, styleTable: StyleTable): Promise<string> {
    let content = option.optionName;
    let title = option.optionName;
    if (localisationIndex){
        const optionName = await getLocalisedTextQuick(option.optionName);
        content = `${option.optionName} <br/> ${optionName}`;
        title = `${option.optionName} \n ${optionName}`;
    }
    const extraAttributes = option.token ? `
        start="${option.token.start}"
        end="${option.token.end}"
        ${option.file ? `file="${option.file}"` : ''}
        ` : '';
    return makeNode(
        content,
        title,
        styleTable,
        styleTable.style('event-option', () => 'background: rgba(80, 80, 255, 0.5); cursor: pointer;')
            + (option.token ? ' navigator' : ''),
        extraAttributes);
}
function makeNode(content: string, title: string, styleTable: StyleTable, extraClasses: string, extraAttributes?: string) {
    return `<div class=${styleTable.style('event-node-outer', () => `
        height: 100%;
        width: 100%;
        position: relative;
    `)}>
        <div
            class="${styleTable.style('event-node', () => `
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                width: calc(100% - 10px);
                text-align: center;
                padding: 10px 5px;
                margin: 0 5px;
                overflow: hidden;
                box-sizing: border-box;
                text-overflow: ellipsis;`)}
                ${extraClasses}"
            title='${htmlEscape(title.trim())}'
            ${extraAttributes ?? ''}
        >
            ${content}
        </div>
    </div>`;
}
function appendChildToTree(target: GridBoxTree, nextChild: GridBoxTree, yOffset: number = 0, canBeLessThanZero: boolean = false): void {
    const minXOffset = target.starts.length === 0 ? -(max(nextChild.starts) ?? 0) : -Infinity;
    const xOffset = Math.max(minXOffset, max(nextChild.starts.map((s, i) => {
        if (!canBeLessThanZero) {
            const e = target.ends[i + yOffset] ?? 0;
            return e - s;
        } else {
            if (target.ends[i + yOffset] === target.starts[i + yOffset]) {
                return -Infinity;
            } else {
                return target.ends[i + yOffset] - s;
            }
        }
    })) ?? 0);
    target.items.push(...nextChild.items.map(v => ({
        ...v,
        gridX: v.gridX + xOffset,
        gridY: v.gridY + yOffset,
    })));
    nextChild.ends.forEach((e, i) => {
        if (target.starts[i + yOffset] === target.ends[i + yOffset]) {
            target.starts[i + yOffset] = (nextChild.starts[i] ?? 0) + xOffset;
        } else {
            target.starts[i + yOffset] = target.starts[i + yOffset] ?? 0;
        }
        target.ends[i + yOffset] = e + xOffset;
    });
}
```

## File: src/previewdef/event/loader.ts
```typescript
import { HOIEvents, getEvents } from "./schema";
import { ContentLoader, Dependency, LoadResultOD, LoaderSession, mergeInLoadResult } from "../../util/loader/loader";
import { parseHoi4File } from "../../hoiformat/hoiparser";
import { localize } from "../../util/i18n";
import { uniq, flatten } from "lodash";
import { YamlLoader } from "../../util/loader/yaml";
import { getGfxContainerFiles } from "../../util/gfxindex";
import { getLanguageIdInYml } from "../../util/vsccommon";
export interface EventsLoaderResult {
    events: HOIEvents;
    mainNamespaces: string[];
    gfxFiles: string[];
    localizationDict: Record<string, string>;
}
const eventsGFX = 'interface/eventpictures.gfx';
export class EventsLoader extends ContentLoader<EventsLoaderResult> {
    private languageKey: string = '';
    public async shouldReloadImpl(session: LoaderSession): Promise<boolean> {
        return await super.shouldReloadImpl(session) || this.languageKey !== getLanguageIdInYml();
    }
    protected async postLoad(content: string | undefined, dependencies: Dependency[], error: any, session: LoaderSession): Promise<LoadResultOD<EventsLoaderResult>> {
        if (error || (content === undefined)) {
            throw error;
        }
        this.languageKey = getLanguageIdInYml();
        const eventsDependencies = dependencies.filter(d => d.type === 'event').map(d => d.path);
        const eventsDepFiles = await this.loaderDependencies.loadMultiple(eventsDependencies, session, EventsLoader);
        const events = getEvents(parseHoi4File(content, localize('infile', 'In file {0}:\n', this.file)), this.file);
        const mergedEvents = mergeEvents(events, ...eventsDepFiles.map(f => f.result.events));
        const localizationDependencies = dependencies.filter(d => d.type.match(/^locali[sz]ation$/) && d.path.endsWith('.yml')).map(d => d.path);
        const localizationDepFiles = await this.loaderDependencies.loadMultiple(localizationDependencies, session, YamlLoader);
        const localizationDict = makeLocalizationDict(mergeInLoadResult(localizationDepFiles, 'result'), this.languageKey);
        Object.assign(localizationDict, ...eventsDepFiles.map(f => f.result.localizationDict));
        const gfxDependencies = [
            ...dependencies.filter(d => d.type === 'gfx').map(d => d.path),
            ...flatten(eventsDepFiles.map(f => f.result.gfxFiles)),
            ...await getGfxContainerFiles(flatten(Object.values(events.eventItemsByNamespace)).map(e => e.picture)),
        ];
        return {
            result: {
                events: mergedEvents,
                mainNamespaces: Object.keys(events.eventItemsByNamespace),
                gfxFiles: uniq([...gfxDependencies, eventsGFX]),
                localizationDict,
            },
            dependencies: uniq([
                this.file,
                ...eventsDependencies,
                ...mergeInLoadResult(eventsDepFiles, 'dependencies'),
                ...localizationDependencies,
                ...flatten(eventsDepFiles.map(f => f.dependencies)),
            ])
        };
    }
    public toString() {
        return `[EventsLoader ${this.file}]`;
    }
}
function mergeEvents(...events: HOIEvents[]): HOIEvents {
    return {
        eventItemsByNamespace: events.map(e => e.eventItemsByNamespace).reduce((p, c) => Object.assign(p, c), {}),
    };
}
function makeLocalizationDict(dicts: any[], language: string): Record<string, string> {
    const result: Record<string, string> = {};
    for (const dict of dicts) {
        if (dict[language] && typeof dict[language] === 'object' && !Array.isArray(dict[language])) {
            Object.assign(result, dict[language]);
        }
    }
    return result;
}
```

## File: src/previewdef/gui/contentbuilder.ts
```typescript
import { chain } from 'lodash';
import * as vscode from 'vscode';
import { ContainerWindowType } from '../../hoiformat/gui';
import { HOIPartial, NumberLike, toStringAsSymbolIgnoreCase } from '../../hoiformat/schema';
import { arrayToMap, forceError } from '../../util/common';
import { debug } from '../../util/debug';
import { getHeight, getWidth } from '../../util/hoi4gui/common';
import { RenderContainerWindowOptions, renderContainerWindow } from '../../util/hoi4gui/containerwindow';
import { RenderNodeCommonOptions } from '../../util/hoi4gui/nodecommon';
import { html, htmlEscape } from '../../util/html';
import { localize } from '../../util/i18n';
import { getSpriteByGfxName } from '../../util/image/imagecache';
import { LoaderSession } from '../../util/loader/loader';
import { StyleTable, normalizeForStyle } from '../../util/styletable';
import { GuiFileLoader, GuiFileLoaderResult } from "./loader";
export async function renderGuiFile(loader: GuiFileLoader, uri: vscode.Uri, webview: vscode.Webview): Promise<string> {
    const setPreviewFileUriScript = { content: `window.previewedFileUri = "${uri.toString()}";` };
    try {
        const session = new LoaderSession(false);
        const loadResult = await loader.load(session);
        const loadedLoaders = Array.from((session as any).loadedLoader).map<string>(v => (v as any).toString());
        debug('Loader session gui', loadedLoaders);
        const guiFiles = loadResult.result.guiFiles;
        const containerWindows = chain(guiFiles).flatMap(g => g.data.guitypes).flatMap(gt => [...gt.containerwindowtype, ...gt.windowtype]).value();
        if (containerWindows.length === 0) {
            const baseContent = localize('guipreview.nocontainerwindows', 'No containerwindowtype in gui file.');
            return html(webview, baseContent, [ setPreviewFileUriScript ], []);
        }
        const styleTable = new StyleTable();
        const baseContent = await renderGuiContainerWindows(containerWindows, styleTable, loadResult.result);
        return html(
            webview,
            baseContent,
            [
                setPreviewFileUriScript,
                { content: 'window.containerWindowToggles = ' + JSON.stringify(makeToggleContainerWindowCheckboxes(containerWindows, styleTable)) + ';' },
                'common.js',
                'guipreview.js',
            ],
            [
                'common.css',
                'codicon.css',
                styleTable,
            ],
        );
    } catch (e) {
        const baseContent = `${localize('error', 'Error')}: <br/>  <pre>${htmlEscape(forceError(e).toString())}</pre>`;
        return html(webview, baseContent, [ setPreviewFileUriScript ], []);
    }
}
async function renderGuiContainerWindows(containerWindows: HOIPartial<ContainerWindowType>[], styleTable: StyleTable, loadResult: GuiFileLoaderResult): Promise<string> {
    const gfxFiles = loadResult.gfxFiles;
    const renderedWindows = (await Promise.all(containerWindows.map(cw => renderSingleContainerWindow(cw, styleTable, gfxFiles)))).join('');
    return `
    ${renderTopBar(containerWindows.map(cw => cw.name).filter((name): name is string => name !== undefined), styleTable)}
    <div
    id="dragger"
    class="${styleTable.oneTimeStyle('dragger', () => `
        width: 100vw;
        height: 100vh;
        position: fixed;
        left:0;
        top:0;
        background: var(--vscode-editor-background);
    `)}">
    </div>
    <div
    id="mainContent"
    class="${styleTable.oneTimeStyle('mainContent', () => `
        position: absolute;
        left: 0;
        top: 0;
        margin-top: 40px;
    `)}">
        ${renderedWindows}
    </div>`;
}
function renderTopBar(folders: string[], styleTable: StyleTable): string {
    return `<div
    class="${styleTable.oneTimeStyle('folderSelectorBar', () => `
        position: fixed;
        padding-top: 9px;
        padding-left: 20px;
        width: 100%;
        height: 30px;
        top: 0;
        left: 0;
        background: var(--vscode-editor-background);
        border-bottom: 1px solid var(--vscode-panel-border);
        z-index: 10;
    `)}">
        <label for="folderSelector" class="${styleTable.oneTimeStyle('folderSelectorLabel', () => `margin-right:5px`)}">
            ${localize('guipreview.containerWindow', 'Container Window: ')}
        </label>
        <div class="select-container">
            <select
                id="folderSelector"
                type="text"
                class="${styleTable.oneTimeStyle('folderSelector', () => `min-width:200px`)}"
            >
                ${folders.map(folder => `<option value="containerwindow_${folder}">${folder}</option>`)}
            </select>
        </div>
        <button id="refresh" title="${localize('common.topbar.refresh.title', 'Refresh')}">
            <i class="codicon codicon-refresh"></i>
        </button>
        <button id="toggleVisibility" title="${localize('guipreview.topbar.toggleVisibility.title', 'Show or Hide Container Windows')}">
            <i class="codicon codicon-eye"></i>
        </button>
    </div>
    <div
    id="toggleVisibilityContent"
    class="${styleTable.oneTimeStyle('toggleVisibilityContent', () => `
        position: fixed;
        margin-top: 10px;
        width: 100%;
        height: 200px;
        top: 30px;
        left: 0;
        background: var(--vscode-editor-background);
        border-bottom: 1px solid var(--vscode-panel-border);
        z-index: 10;
        overflow: auto;
        display: none;
    `)}">
        <div id="toggleVisibilityContentInner" class="${styleTable.oneTimeStyle('toggleVisibilityContentInner', () => `
            padding-left: 20px;
        `)}">
        </div>
    </div>`;
}
async function renderSingleContainerWindow(
    containerWindow: HOIPartial<ContainerWindowType>,
    styleTable: StyleTable,
    gfxFiles: string[],
): Promise<string> {
    let children: string;
    const commonOptions: RenderNodeCommonOptions = {
        getSprite: defaultGetSprite(gfxFiles),
        styleTable,
    };
    const size = { width: 1920, height: 1080 };
    const width = getWidth(containerWindow.size);
    const height = getHeight(containerWindow.size);
    if (!width?._unit && width?._value !== undefined) {
        size.width = width._value;
    }
    if (!height?._unit && height?._value !== undefined) {
        size.height = height._value;
    }
    const position = containerWindow.position ? { ...containerWindow.position } : { x: undefined, y: undefined };
    if (position.x?._value !== undefined && position.x?._value < 0) {
        position.x = { ...position.x, _value: 0 };
    }
    if (position.y?._value !== undefined && position.y?._value < 0) {
        position.y = { ...position.y, _value: 0 };
    }
    const onRenderChild: RenderContainerWindowOptions['onRenderChild'] = async (type, child, parentInfo) => {
        if (type === 'containerwindow') {
            const childContainerWindow = child as HOIPartial<ContainerWindowType>;
            return await renderContainerWindow(childContainerWindow, parentInfo, {
                ...commonOptions,
                classNames: 'childcontainerwindow_' + normalizeForStyle(childContainerWindow.name ?? ''),
                enableNavigator: true,
                onRenderChild,
            });
        }
    };
    children = await renderContainerWindow(
        {
            ...containerWindow,
            position: position,
            orientation: toStringAsSymbolIgnoreCase('upper_left'),
            origo: toStringAsSymbolIgnoreCase('upper_left'),
        },
        {
            size,
            orientation: 'upper_left',
        },
        {
            ...commonOptions,
            ignorePosition: false,
            enableNavigator: true,
            onRenderChild,
        },
    );
    return `<div
        id="containerwindow_${containerWindow.name}"
        class="
            containerwindow
            containerwindow_${normalizeForStyle(containerWindow.name ?? '')}
            ${styleTable.style('displayNone', () => `display:none;`)}"
    >
        ${children}
    </div>`;
}
function makeToggleContainerWindowCheckboxes(containerWindows: HOIPartial<ContainerWindowType>[], styleTable: StyleTable) {
    return arrayToMap(containerWindows.map(cw => {
        return { name: cw.name ?? '', content: makeToggleContainerWindowCheckboxesRecursively(cw, styleTable, '', 0) };
    }), 'name');
}
function makeToggleContainerWindowCheckboxesRecursively(containerWindow: HOIPartial<ContainerWindowType>, styleTable: StyleTable, prefix: string, level: number): string {
    const childWindows = [...containerWindow.containerwindowtype, ...containerWindow.windowtype];
    childWindows.sort((a, b) => (a._index ?? 0) - (b._index ?? 0));
    return childWindows.map(cw => {
        const normalizedName = normalizeForStyle(cw.name ?? '');
        return `<div class="${styleTable.oneTimeStyle('level-' + level, () => 'padding-left: ' + (level * 20) + 'px;')}">
            <input
                type="checkbox"
                id="toggleContainerWindow_${prefix}${normalizedName}"
                containerWindowName="${cw.name}"
                checked="checked"
                class="toggleContainerWindowCheckbox"
            />
        </div>` + makeToggleContainerWindowCheckboxesRecursively(cw, styleTable, prefix + normalizedName + '_', level + 1);
    }).join('');
}
function defaultGetSprite(gfxFiles: string[]) {
    return (sprite: string) => {
        return getSpriteByGfxName(sprite, gfxFiles);
    };
}
```

## File: src/previewdef/mio/schema.ts
```typescript
import { ConditionComplexExpr, ConditionItem, extractConditionValue, extractConditionValues } from "../../hoiformat/condition";
import { Node, Token } from "../../hoiformat/hoiparser";
import { CustomMap, Enum, HOIPartial, Raw, SchemaDef, convertNodeToJson } from "../../hoiformat/schema";
import { Warning, randomString } from "../../util/common";
import { localize } from "../../util/i18n";
export interface Mio {
    id: string;
    traits: Record<string, MioTrait>;
    conditionExprs: ConditionItem[];
    warnings: MioWarning[];
}
export interface MioWarning extends Warning<string> {
    navigations?: { file: string, start: number, end: number }[];
}
export type TraitEffect = 'equiment' | 'production' | 'organization';
export interface MioTrait {
    id: string;
    name: string;
    icon: string | undefined;
    anyParent: string[];
    allParents: string[];
    exclusive: string[];
    parent: {
        traits: string[];
        numNeeded: number;
    } | undefined;
    x: number;
    y: number;
    relativePositionId: string | undefined;
    visible: ConditionComplexExpr;
    hasVisible: boolean;
    specialTraitBackground: boolean;
    effects: TraitEffect[];
    token: Token | undefined;
    file: string;
}
interface MioDef {
    include: string;
    trait: MioTraitDef[];
    add_trait: MioTraitDef[];
    override_trait: MioTraitDef[];
    remove_trait: Enum;
}
interface MioTraitDef {
    token: string;
    name: string;
    icon: string;
    any_parent: Enum;
    all_parents: Enum;
    parent: {
        traits: Enum;
        num_parents_needed: number;
    };
    mutually_exclusive: Enum;
    position: {
        x: number;
        y: number;
    };
    relative_position_id: string;
    special_trait_background: boolean;
    visible: Raw;
    equipment_bonus: Raw;
    production_bonus: Raw;
    organization_modifier: Raw;
    _token: Token;
}
type MioFile = CustomMap<MioDef>;
const mioTraitSchema: SchemaDef<MioTraitDef> = {
    token: "string",
    name: "string",
    icon: "string",
    any_parent: "enum",
    all_parents: "enum",
    parent: {
        traits: "enum",
        num_parents_needed: "number",
    },
    mutually_exclusive: "enum",
    position: {
        x: "number",
        y: "number",
    },
    relative_position_id: "string",
    visible: "raw",
    special_trait_background: "boolean",
    equipment_bonus: "raw",
    production_bonus: "raw",
    organization_modifier: "raw",
};
const mioSchema: SchemaDef<MioDef> = {
    include: "string",
    trait: {
        _innerType: mioTraitSchema,
        _type: "array",
    },
    add_trait: {
        _innerType: mioTraitSchema,
        _type: "array",
    },
    override_trait: {
        _innerType: mioTraitSchema,
        _type: "array",
    },
    remove_trait: "enum",
};
const mioFileSchema: SchemaDef<MioFile> = {
    _innerType: mioSchema,
    _type: "map",
};
export function getMiosFromFile(node: Node, dependentMios: Mio[], filePath: string): Mio[] {
    const file = convertNodeToJson<MioFile>(node, mioFileSchema);
    const dependencies: Mio[] = [...dependentMios];
    const result: Mio[] = [];
    for (const key in file._map) {
        const mio = getMio(file._map[key], dependencies, filePath);
        dependencies.push(mio);
        if (!file._map[key]._value.include) {
            result.push(mio);
        }
    }
    // Run twice in case dependent mio is in current file.
    for (const key in file._map) {
        if (file._map[key]._value.include) {
            const mio = getMio(file._map[key], dependencies, filePath);
            result.push(mio);
        }
    }
    return result;
}
function getMio(mioDefItem: { _key: string, _value: HOIPartial<MioDef> }, dependentMios: Mio[], filePath: string): Mio {
    const id = mioDefItem._key;
    const mioDef = mioDefItem._value;
    const baseMio = mioDef.include ? dependentMios.find(m => m.id === mioDef.include) : undefined;
    const traits = baseMio?.traits ? {...baseMio.traits} : {};
    const conditionExprs = baseMio?.conditionExprs ? [...baseMio.conditionExprs] : [];
    const warnings: MioWarning[] = [];
    if (mioDef.include && mioDef.trait.length > 0) {
        warnings.push({
            source: id,
            text: localize('miopreview.warnings.traitAndIncludeCheck1', 'Military industrial organization {0} has include property. It should use add_trait, remove_trait or override_trait instead of trait.', id),
        });
    }
    if (!mioDef.include && (mioDef.add_trait.length > 0 || mioDef.override_trait.length > 0 || mioDef.remove_trait._values.length > 0)) {
        warnings.push({
            source: id,
            text: localize('miopreview.warnings.traitAndIncludeCheck2', 'Military industrial organization {0} doesn\'t have include property. It should use trait instead of add_trait, remove_trait or override_trait.', id),
        });
    }
    for (const traitDef of [...mioDef.trait, ...mioDef.add_trait]) {
        const trait = getTrait(traitDef, filePath, warnings, conditionExprs);
        if (traits[trait.id]) {
            warnings.push({
                source: id,
                text: localize('miopreview.warnings.traitConflict', 'There\'re more than one trait with ID {0} in military industrial organization {1} in files: {2}, {3}.', trait.id, id, traits[trait.id].file, filePath),
            });
        }
        traits[trait.id] = trait;
    }
    for (const traitDef of mioDef.override_trait) {
        overrideTrait(traitDef, traits, filePath, warnings, conditionExprs);
    }
    for (const traitId of mioDef.remove_trait._values) {
        if (traitId && traits[traitId]) {
            traits[traitId] = {
                ...traits[traitId],
                hasVisible: true,
                visible: false,
            };
        }
    }
    validateRelativePositionId(traits, warnings);
    return {
        id,
        traits,
        conditionExprs,
        warnings,
    };
}
function validateRelativePositionId(traits: Record<string, MioTrait>, warnings: MioWarning[]) {
    const relativePositionId: Record<string, MioTrait | undefined> = {};
    const relativePositionIdChain: string[] = [];
    const circularReported: Record<string, boolean> = {};
    for (const trait of Object.values(traits)) {
        if (trait.relativePositionId === undefined) {
            continue;
        }
        if (!(trait.relativePositionId in traits)) {
            warnings.push({
                text: localize('miopreview.warnings.relativepositionidnotexist', 'Relative position ID of trait {0} not exist: {1}.', trait.id, trait.relativePositionId),
                source: trait.id,
            });
            continue;
        }
        relativePositionIdChain.length = 0;
        relativePositionId[trait.id] = traits[trait.relativePositionId];
        let currentTrait: MioTrait | undefined = trait;
        while (currentTrait) {
            if (circularReported[currentTrait.id]) {
                break;
            }
            relativePositionIdChain.push(currentTrait.id);
            const nextFocus: MioTrait | undefined = relativePositionId[currentTrait.id];
            if (nextFocus && relativePositionIdChain.includes(nextFocus.id)) {
                relativePositionIdChain.forEach(r => circularReported[r] = true);
                relativePositionIdChain.push(nextFocus.id);
                warnings.push({
                    text: localize('miopreview.warnings.relativepositioncircularref', "There're circular reference in relative position ID of these traits: {0}.", relativePositionIdChain.join(' -> ')),
                    source: trait.id,
                });
                break;
            }
            currentTrait = nextFocus;
        }
    }
}
function getTrait(traitDef: HOIPartial<MioTraitDef>, filePath: string, warnings: MioWarning[], conditionExprs: ConditionItem[]): MioTrait {
    const id = traitDef.token ?? `[missing_token_${randomString(8)}]`;
    if (!traitDef.token) {
        warnings.push({
            text: localize('miopreview.warnings.traitnoid', "A trait defined in this file don't have token property: {0}.", filePath),
            source: id,
        });
    }
    const x = traitDef.position?.x ?? 0;
    const y = traitDef.position?.y ?? 0;
    const name = traitDef.name ?? '';
    const parent = traitDef.parent && traitDef.parent.traits._values.length > 0 ? {
        traits: traitDef.parent.traits._values,
        numNeeded: traitDef.parent.num_parents_needed ?? 1,
    } : undefined;
    const visible = traitDef.visible ? extractConditionValue(traitDef.visible._raw.value, { scopeName: '', scopeType: 'mio' }, conditionExprs).condition : true;
    const effects: TraitEffect[] = [];
    if (traitDef.equipment_bonus?._raw.value) {
        effects.push('equiment');
    }
    if (traitDef.production_bonus?._raw.value) {
        effects.push('production');
    }
    if (traitDef.organization_modifier?._raw.value) {
        effects.push('organization');
    }
    return {
        id,
        name,
        icon: traitDef.icon,
        x,
        y,
        anyParent: traitDef.any_parent._values,
        allParents: traitDef.all_parents._values,
        parent,
        exclusive: traitDef.mutually_exclusive._values,
        relativePositionId: traitDef.relative_position_id,
        visible,
        hasVisible: traitDef.visible !== undefined,
        specialTraitBackground: traitDef.special_trait_background ?? false,
        effects,
        token: traitDef._token,
        file: filePath,
    };
}
function overrideTrait(traitDef: HOIPartial<MioTraitDef>, traits: Record<string, MioTrait>, filePath: string, warnings: MioWarning[], conditionExprs: ConditionItem[]) {
    const id = traitDef.token;
    if (!id) {
        warnings.push({
            text: localize('miopreview.warnings.overridetraitnoid', "An override_trait defined in this file don't have token property: {0}.", filePath),
            source: `unknown`,
        });
        return;
    }
    const trait = traits[id];
    if (!trait) {
        warnings.push({
            text: localize('miopreview.warnings.overridetraitidnotexist', "An override_trait referenced a trait that doesn't exist: {0}.", id),
            source: id,
        });
        return;
    }
    trait.name = traitDef.name ?? trait.name;
    trait.icon = traitDef.icon ?? trait.icon;
    trait.x = traitDef.position?.x ?? trait.x;
    trait.y = traitDef.position?.y ?? trait.y;
    trait.anyParent = traitDef.any_parent._values.length > 0 ? traitDef.any_parent._values : trait.anyParent;
    trait.allParents = traitDef.all_parents._values.length > 0 ? traitDef.all_parents._values : trait.allParents;
    trait.parent = traitDef.parent && traitDef.parent.traits._values.length > 0 ? {
        traits: traitDef.parent.traits._values,
        numNeeded: traitDef.parent.num_parents_needed ?? 1,
    } : trait.parent;
    trait.exclusive = traitDef.mutually_exclusive._values.length > 0 ? traitDef.mutually_exclusive._values : trait.exclusive;
    trait.relativePositionId = traitDef.relative_position_id ?? trait.relativePositionId;
    trait.specialTraitBackground = traitDef.special_trait_background ?? trait.specialTraitBackground;
    trait.visible = traitDef.visible ?
        extractConditionValue(traitDef.visible._raw.value, { scopeName: '', scopeType: 'mio' }, conditionExprs).condition :
        trait.visible;
    trait.hasVisible = traitDef.visible !== undefined || trait.hasVisible;
    if (traitDef._token) {
        trait.token = traitDef._token;
        trait.file = filePath;
    }
}
```

## File: src/util/debug.ts
```typescript
import { sendException } from "./telemetry";
import { forceError, UserError } from "./common";
import { YAMLException } from 'js-yaml';
export function debug(message: any, ...args: any[]): void {
    if (process.env.NODE_ENV !== 'production') {
        console.log(message, ...args);
    }
}
export function error(error: unknown): void {
    console.error(error);
    let realError = forceError(error);
    if (!(error instanceof UserError) && !(error instanceof YAMLException)) {
        sendException(realError, { callerStack: new Error().stack ?? '' });
    }
}
```

## File: src/util/dependency.ts
```typescript
import * as vscode from "vscode";
import { Commands, ContextName } from "../constants";
import { sendEvent } from "./telemetry";
import { localize } from "./i18n";
import { contextContainer } from "../context";
import { error } from "./debug";
import { getHoiOpenedFileOriginalUri, listFilesFromModOrHOI4, readFileFromModOrHOI4 } from "./fileloader";
import { parseHoi4File } from "../hoiformat/hoiparser";
import { getEvents, HOIEvents, HOIEvent } from "../previewdef/event/schema";
import { getLanguageIdInYml, getRelativePathInWorkspace, isSameUri } from "./vsccommon";
import { flatMap, flatten } from "lodash";
import { parseYaml } from "./yaml";
export type Dependency = { type: string, path: string };
export function getDependenciesFromText(text: string): Dependency[] {
    const dependencies: Dependency[] = [];
    const regex = /^\s*#!(?<type>.*?):(?<path>.*\.(?<ext>.*?))$/gm;
    let match = regex.exec(text);
    while (match) {
        const type = match.groups?.type;
        const ext = match.groups?.ext!;
        if (type && (type === ext || ext === 'txt' || ext === 'yml')) {   
            const path = match.groups?.path!;
            const pathValue = path.trim().replace(/\/\/+|\\+/g, '/');
            dependencies.push({ type, path: pathValue });
        }
        match = regex.exec(text);
    }
    return dependencies;
}
export function registerScanReferencesCommand(): vscode.Disposable {
    return vscode.commands.registerCommand(Commands.ScanReferences, scanReferences);
}
async function scanReferences(): Promise<void> {
    sendEvent('scanReferences');
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage(localize('scanref.noeditor', 'No opened editor.'));
        return;
    }
    try {
        if (contextContainer.contextValue[ContextName.Hoi4PreviewType] === 'event') {
            await scanReferencesForEvents(editor);
            vscode.window.showInformationMessage(localize('scanref.done', 'Scan reference done.'));
        } else {
            vscode.window.showErrorMessage(localize('scanref.unsupportedtype', 'Unsupported file type to scan references.'));
        }
    } catch (e) {
        error(e);
    }
}
async function scanReferencesForEvents(editor: vscode.TextEditor) {
    const eventFiles = await listFilesFromModOrHOI4('events');
    const document = editor.document;
    const events = (await Promise.all(eventFiles.map(async (file) => {
        try {
            const filePath = 'events/' + file;
            const [buffer, realPath] = await readFileFromModOrHOI4(filePath);
            const realPathUri = getHoiOpenedFileOriginalUri(realPath);
            if (isSameUri(document.uri, realPathUri)) {
                return undefined;
            }
            return getEvents(parseHoi4File(buffer.toString()), filePath);
        } catch (e) {
            return undefined;
        }
    }))).filter((e): e is HOIEvents => e !== undefined);
    if (document.isClosed) {
        return;
    }
    const eventItems = flatMap(events, e => flatten(Object.values(e.eventItemsByNamespace)));
    const includedEventFiles: string[] = [];
    const relativePath = getRelativePathInWorkspace(document.uri);
    const content = document.getText();
    const mainEvents = flatten(Object.values(getEvents(parseHoi4File(content), relativePath).eventItemsByNamespace));
    const searchingEvents: HOIEvent[] = [...mainEvents];
    const searched: Record<string, boolean> = {};
    const searchedEvents: HOIEvent[] = [];
    const childrenById: Record<string, string[]> = {};
    [...eventItems, ...mainEvents].forEach(event => {
        childrenById[event.id] = flatMap([event.immediate, ...event.options], o => o.childEvents).map(ce => ce.eventName);
    });
    while (searchingEvents.length > 0) {
        const event = searchingEvents.pop()!;
        const children = childrenById[event.id];
        eventItems.forEach(ei => {
            if (searched[ei.id]) {
                return;
            }
            if (children.includes(ei.id)) {
                searchingEvents.push(ei);
                if (!includedEventFiles.includes(ei.file)) {
                    includedEventFiles.push(ei.file);
                }
            }
            const eiChildren = childrenById[ei.id];
            if (eiChildren.includes(event.id)) {
                searchingEvents.push(ei);
                if (!includedEventFiles.includes(ei.file)) {
                    includedEventFiles.push(ei.file);
                }
            }
        });
        searched[event.id] = true;
        searchedEvents.push(event);
    }
    if (document.isClosed) {
        return;
    }
    const existingDependency = getDependenciesFromText(document.getText());
    const existingEventDependency = existingDependency.filter(d => d.type === 'event').map(d => d.path.replace(/\\+/g, '/'));
    existingEventDependency.push(relativePath);
    const moreEventDependencyContent = includedEventFiles.filter(f => !existingEventDependency.includes(f)).map(f => `#!event:${f}\n`).join('');
    const localizationFiles = await listFilesFromModOrHOI4('localisation');
    const language = getLanguageIdInYml();
    const localizations = (await Promise.all(localizationFiles.map(async (file) => {
        try {
            const filePath = 'localisation/' + file;
            const [buffer, realPath] = await readFileFromModOrHOI4(filePath);
            const realPathUri = getHoiOpenedFileOriginalUri(realPath);
            if (isSameUri(document.uri, realPathUri)) {
                return undefined;
            }
            return { file: filePath, result: parseYaml(buffer.toString()) };
        } catch (e) {
            return undefined;
        }
    }))).filter((e): e is { file: string, result: Record<string, Record<string, string>> } =>
        e !== undefined && e.result !== undefined && typeof e.result[language] === 'object' && !Array.isArray(e.result[language])
    );
    const existingLocalizationDependency = existingDependency.filter(d => d.type.match(/^locali[zs]ation$/)).map(d => d.path.replace(/\\+/g, '/'));
    const moreLocalizationDependencyContent = localizations.filter(lf => {
        if (existingLocalizationDependency.includes(lf.file)) {
            return false;
        }
        for (const event of searchedEvents) {
            if ([event.title, ...event.options.map(o => o.name)].some(n => n && n in lf.result[language])) {
                return true;
            }
        }
        return false;
    }).map(lf => `#!localisation:${lf.file}\n`).join('');
    if (document.isClosed) {
        return;
    }
    await editor.edit(eb => {
        eb.insert(new vscode.Position(0, 0), moreEventDependencyContent + moreLocalizationDependencyContent);
    });
}
```

## File: src/util/featureflags.ts
```typescript
import { getConfiguration } from "./vsccommon";
const featureFlags = getConfiguration().featureFlags;
export const useConditionInFocus = !featureFlags.includes('!useConditionInFocus');
export const eventTreePreview = !featureFlags.includes('!eventTreePreview');
export const sharedFocusIndex = !featureFlags.includes('!sharedFocusIndex');
export const gfxIndex = featureFlags.includes('gfxIndex');
export const localisationIndex = featureFlags.includes('localisationIndex');
```

## File: src/util/hoi4gui/common.ts
```typescript
import { NumberLike, Position, HOIPartial } from "../../hoiformat/schema";
import { NumberSize } from "../common";
import { StyleTable } from '../styletable';
import { Orientation, ComplexSize, Size, Margin } from "../../hoiformat/gui";
export interface ParentInfo {
    size: NumberSize;
    orientation: Orientation['_name'];
}
export interface RenderCommonOptions {
    id?: string;
    classNames?: string;
    styleTable: StyleTable;
    enableNavigator?: boolean;
}
export function normalizeNumberLike(value: NumberLike, parentValue: number, subtractValue?: number): number;
export function normalizeNumberLike(value: undefined, parentValue: number, subtractValue?: number): undefined;
export function normalizeNumberLike(value: NumberLike | undefined, parentValue: number, subtractValue?: number): number | undefined;
export function normalizeNumberLike(value: NumberLike | undefined, parentValue: number, subtractValue: number = 0): number | undefined {
    if (!value) {
        return undefined;
    }
    switch (value._unit) {
        case '%': return value._value / 100.0 * parentValue;
        case '%%': return value._value / 100.0 * parentValue - subtractValue;
        default: return value._value;
    }
}
const offsetMap: Record<Orientation['_name'], { x: number, y: number }> = {
    'upper_left': { x: 0, y: 0 },
    'upper_right': { x: 1, y: 0 },
    'lower_left': { x: 0, y: 1 },
    'lower_right': { x: 1, y: 1 },
    'center_up': { x: 0.5, y: 0 },
    'center_down': { x: 0.5, y: 1 },
    'center_left': { x: 0, y: 0.5 },
    'center_right': { x: 1, y: 0.5 },
    'center': { x: 0.5, y: 0.5 },
};
export function calculateStartLength(pos: NumberLike | undefined, size: NumberLike | undefined, parentSize: number, orientationFactor: number, origoFactor: number, scale: number): [number, number] {
    let posValue = normalizeNumberLike(pos, parentSize) ?? 0;
    let length = (normalizeNumberLike(size, parentSize) ?? 0) * scale;
    if (size?._unit === '%%') {
        length = length - posValue;
    }
    if (length < 0) {
        length = length + parentSize;
    }
    const start = posValue + parentSize * orientationFactor - length * origoFactor;
    if (size?._unit === '%%' || (size?._value ?? 0) < 0) {
        let end = normalizeNumberLike(size, parentSize) ?? 0;
        if (end < 0) {
            end = end + parentSize;
        }
        length = Math.max(0, end - start);
    }
    return [start, length];
}
export function calculateBBox(
    {orientation, origo, position, size, scale}: {
        orientation?: Orientation,
        origo?: Orientation,
        position?: Partial<Position>,
        size?: HOIPartial<ComplexSize> | Partial<Size & {min: undefined}>,
        scale?: number,
    },
    parentInfo: ParentInfo
): [number, number, number, number, Orientation['_name']] {
    const myOrientation = orientation?._name ?? 'upper_left';
    const parentSize = parentInfo.size;
    const orientationFactor = offsetMap[myOrientation] ?? offsetMap['upper_left'];
    const origoFactor = offsetMap[origo?._name ?? 'upper_left'] ?? offsetMap['upper_left'];
    let [x, width] = calculateStartLength(position?.x, getWidth(size), parentSize.width, orientationFactor.x, origoFactor.x, scale ?? 1);
    let [y, height] = calculateStartLength(position?.y, getHeight(size), parentSize.height, orientationFactor.y, origoFactor.y, scale ?? 1);
    const minWidth = normalizeNumberLike(getWidth(size?.min), parentSize.width, x) ?? width;
    const minHeight = normalizeNumberLike(getHeight(size?.min), parentSize.height, y) ?? height;
    width = Math.max(minWidth, width);
    height = Math.max(minHeight, height);
    return [x, y, width, height, myOrientation];
}
export function normalizeMargin(margin: Partial<Margin> | undefined, size: NumberSize): [number, number, number, number] {
    return [
        normalizeNumberLike(margin?.top, size.height) ?? 0,
        normalizeNumberLike(margin?.right, size.width) ?? 0,
        normalizeNumberLike(margin?.bottom, size.height) ?? 0,
        normalizeNumberLike(margin?.left, size.width) ?? 0,
    ];
}
export function removeHtmlOptions<T>(options: T): { [K in Exclude<keyof T, 'id' | 'classNames'>]: T[K] } {
    const result = {...options} as any;
    delete result['id'];
    delete result['classNames'];
    return result;
}
export function getWidth(size?: Partial<Size>): NumberLike | undefined {
    return size?.width ?? size?.x;
}
export function getHeight(size?: Partial<Size>): NumberLike | undefined {
    return size?.height ?? size?.y;
}
```

## File: src/util/hoi4gui/gridboxcommon.ts
```typescript
import { HOIPartial } from "../../hoiformat/schema";
import { ParentInfo, calculateBBox, normalizeNumberLike, RenderCommonOptions, getWidth, getHeight } from "./common";
import { NumberSize, NumberPosition } from "../common";
import { StyleTable } from '../styletable';
import { GridBoxType, Format, Background } from "../../hoiformat/gui";
import { map, flatMap } from "lodash";
export type GridBoxConnectionType = 'child' | 'parent' | 'related';
export interface GridBoxConnection {
    target: string;
    targetType: GridBoxConnectionType;
    style?: string;
    classNames?: string;
}
export interface GridBoxItem {
    id: string;
    gridX: number;
    gridY: number;
    connections: GridBoxConnection[];
    isJoint?: boolean;
    htmlId?: string;
    classNames?: string;
}
export interface GridBoxConnectionItemDirection {
    in: Record<string, true>;
    out: Record<string, true>;
}
export interface GridBoxConnectionItem {
    x: number;
    y: number;
    up?: GridBoxConnectionItemDirection;
    down?: GridBoxConnectionItemDirection;
    left?: GridBoxConnectionItemDirection;
    right?: GridBoxConnectionItemDirection;
}
export interface RenderGridBoxCommonOptions extends RenderCommonOptions {
    items: Record<string, GridBoxItem>;
    onRenderItem?(item: GridBoxItem, parentInfo: ParentInfo): Promise<string>;
    onRenderLineBox?(item: GridBoxConnectionItem, parentInfo: ParentInfo): Promise<string>;
    lineRenderMode?: 'line' | 'control';
    cornerPosition?: number;
}
const offsetMap: Record<Format['_name'], { x: number, y: number }> = {
    left: { x: 0, y: 0.5 },
    up: { x: 0.5, y: 0 },
    right: { x: 1, y: 0.5 },
    down: { x: 0.5, y: 1 },
    center: { x: 0.5, y: 0.5 },
};
function getLeftUpPosition(gridX: number, gridY: number, format: Format['_name'], slotSize: NumberSize, gridSize: NumberSize): NumberPosition {
    if (format === 'down') {
        gridY *= -1;
    } else if (format === 'left') {
        const t = gridX;
        gridX = gridY;
        gridY = t;
    } else if (format === 'right') {
        const t = gridX;
        gridX = -gridY;
        gridY = t;
    }
    const offset = offsetMap[format] ?? { x: 0, y: 0 };
    return {
        x: gridX * slotSize.width + offset.x * gridSize.width - offset.x * slotSize.width,
        y: gridY * slotSize.height + offset.y * gridSize.height - offset.y * slotSize.height,
    };
}
function getCenterPosition(gridX: number, gridY: number, format: Format['_name'], slotSize: NumberSize, gridSize: NumberSize): NumberPosition {
    const position = getLeftUpPosition(gridX, gridY, format, slotSize, gridSize);
    position.x += slotSize.width / 2;
    position.y += slotSize.height / 2;
    return position;
}
export async function renderGridBoxCommon(
    gridBox: HOIPartial<GridBoxType>,
    parentInfo: ParentInfo,
    options: RenderGridBoxCommonOptions,
    onRenderBackground?: (background: HOIPartial<Background> | undefined, parentInfo: ParentInfo) => Promise<string>
): Promise<string> {
    const [x, y, width, height, orientation] = calculateBBox(gridBox, parentInfo);
    const format = gridBox.format?._name ?? 'up';
    const size = { width, height };
    const xSlotSize = normalizeNumberLike(getWidth(gridBox.slotsize), 0) ?? 50;
    const ySlotSize = normalizeNumberLike(getHeight(gridBox.slotsize), 0) ?? 50;
    const slotSize = { width: xSlotSize, height: ySlotSize };
    const childrenParentInfo: ParentInfo = { size: slotSize, orientation };
    const cornerPosition = options.cornerPosition ?? 1;
    const background = onRenderBackground ? await onRenderBackground(gridBox.background, { size, orientation }) : '';
    const renderedItems = await Promise.all(Object.values(options.items).map(async (item) => {
        const children = options.onRenderItem ? await options.onRenderItem(item, childrenParentInfo) : '';
        const position = getLeftUpPosition(item.gridX, item.gridY, format, slotSize, size);
        return `<div
            ${item.htmlId ? `id="${item.htmlId}"` : ''}
            class="
                ${item.classNames ? item.classNames : ''}
                ${options.styleTable.style('positionAbsolute', () => `position: absolute;`)}
                ${options.styleTable.oneTimeStyle('gridbox-item', () => `
                    left: ${position.x}px;
                    top: ${position.y}px;
                    width: ${xSlotSize}px;
                    height: ${ySlotSize}px;
                `)}
            ">
                ${children}
            </div>`;
    }));
    const renderedConnections = options.lineRenderMode !== 'control' ?
        renderLineConnections(options.items, format, slotSize, size, options.styleTable, cornerPosition) :
        await renderControlConnections(options.items, format, slotSize, size, options.onRenderLineBox, options.styleTable, childrenParentInfo);
    return `<div
    ${options.id ? `id="${options.id}"` : ''}
    start="${gridBox._token?.start}"
    end="${gridBox._token?.end}"
    class="
        ${options?.classNames ? options.classNames : ''}
        ${options.styleTable.style('positionAbsolute', () => `position: absolute;`)}
        ${options.styleTable.oneTimeStyle('gridbox', () => `
            left: ${x}px;
            top: ${y}px;
            width: ${width}px;
            height: ${height}px;
        `)}
        ${options.enableNavigator ? 'navigator navigator-highlight' : ''}
    ">
        ${background}
        ${renderedConnections}
        ${renderedItems.join('')}
    </div>`;
}
export function renderLineConnections(items: Record<string, GridBoxItem>, format: Format['_name'], slotSize: NumberSize, size: NumberSize, styleTable: StyleTable, cornerPosition: number): string {
    return Object.values(items).map(item => 
        item.connections.map(conn => {
            const target = items[conn.target];
            if (!target) {
                return '';
            }
            const itemPosition = getCenterPosition(item.gridX, item.gridY, format, slotSize, size);
            const targetPosition = getCenterPosition(target.gridX, target.gridY, format, slotSize, size);
            return renderGridBoxConnection(itemPosition, targetPosition, conn.style ?? '', conn.targetType, format, slotSize, conn.classNames, styleTable, cornerPosition);
        }).join('')
    ).join('');
}
export function renderGridBoxConnection(a: NumberPosition, b: NumberPosition, style: string, type: GridBoxConnectionType, format: Format['_name'], gridSize: NumberSize, classNames: string | undefined, styleTable: StyleTable, cornerPosition: number = 1.5): string {
    if (a.y === b.y) {
        return `<div
            class="
                ${classNames ? classNames : ''}
                ${styleTable.style('positionAbsolute', () => `position: absolute;`)}
                ${styleTable.oneTimeStyle('gridbox-connection', () => `
                    left: ${Math.min(a.x, b.x)}px;
                    top: ${a.y}px;
                    width: ${Math.abs(a.x - b.x)}px;
                    height: ${1}px;
                    border-top: ${style};
                `)}
                ${styleTable.style('pointerEventsNone', () => `pointer-events: none;`)}
            "></div>`;
    }
    if (a.x === b.x) {
        return `<div
            class="
                ${classNames ? classNames : ''}
                ${styleTable.style('positionAbsolute', () => `position: absolute;`)}
                ${styleTable.oneTimeStyle('gridbox-connection', () => `
                    left: ${a.x}px;
                    top: ${Math.min(a.y, b.y)}px;
                    width: ${1}px;
                    height: ${Math.abs(a.y - b.y)}px;
                    border-left: ${style};
                `)}
                ${styleTable.style('pointerEventsNone', () => `pointer-events: none;`)}
            "></div>`;
    }
    if (type === 'parent') {
        const c = a;
        a = b;
        b = c;
        type = 'child';
    }
    if (format === 'left' || format === 'right') {
        const bx = b.x - a.x;
        const by = b.y - a.y;
        const cornerWidth = gridSize.width * cornerPosition;
        if (Math.abs(bx) < cornerWidth) {
            return `<div
                class="
                    ${classNames ? classNames : ''}
                    ${styleTable.style('positionAbsolute', () => `position: absolute;`)}
                    ${styleTable.oneTimeStyle('gridbox-connection', () => `
                        left: ${Math.min(a.x, b.x)}px;
                        top: ${Math.min(a.y, b.y)}px;
                        width: ${Math.abs(bx)}px;
                        height: ${Math.abs(by)}px;
                        ${bx < 0 ? 'border-left' : 'border-right'}: ${style};
                        ${by < 0 ? 'border-bottom' : 'border-top'}: ${style};
                    `)}
                    ${styleTable.style('pointerEventsNone', () => `pointer-events: none;`)}
                "></div>`;
        } else {
            return `<div
                class="
                    ${classNames ? classNames : ''}
                    ${styleTable.style('positionAbsolute', () => `position: absolute;`)}
                    ${styleTable.oneTimeStyle('gridbox-connection', () => `
                        left: ${Math.min(a.x, a.x + cornerWidth * Math.sign(bx))}px;
                        top: ${Math.min(a.y, b.y)}px;
                        width: ${cornerWidth}px;
                        height: ${Math.abs(by)}px;
                        ${bx < 0 ? 'border-left' : 'border-right'}: ${style};
                        ${by < 0 ? 'border-bottom' : 'border-top'}: ${style};
                    `)}
                    ${styleTable.style('pointerEventsNone', () => `pointer-events: none;`)}
                "></div>
                <div
                class="
                    ${classNames ? classNames : ''}
                    ${styleTable.style('positionAbsolute', () => `position: absolute;`)}
                    ${styleTable.oneTimeStyle('gridbox-connection', () => `
                        left: ${Math.min(b.x, a.x + cornerWidth * Math.sign(bx))}px;
                        top: ${Math.min(a.y, b.y)}px;
                        width: ${Math.abs(bx) - cornerWidth}px;
                        height: ${Math.abs(by)}px;
                        ${by > 0 ? 'border-bottom' : 'border-top'}: ${style};
                    `)}
                    ${styleTable.style('pointerEventsNone', () => `pointer-events: none;`)}
                "></div>`;
        }
    } else {
        const bx = b.x - a.x;
        const by = b.y - a.y;
        const cornerHeight = gridSize.height * cornerPosition;
        if (Math.abs(by) < cornerHeight) {
            return `<div
                class="
                    ${classNames ? classNames : ''}
                    ${styleTable.style('positionAbsolute', () => `position: absolute;`)}
                    ${styleTable.oneTimeStyle('gridbox-connection', () => `
                        left: ${Math.min(a.x, b.x)}px;
                        top: ${Math.min(a.y, b.y)}px;
                        width: ${Math.abs(bx)}px;
                        height: ${Math.abs(by)}px;
                        ${bx > 0 ? 'border-left' : 'border-right'}: ${style};
                        ${by > 0 ? 'border-bottom' : 'border-top'}: ${style};
                    `)}
                    ${styleTable.style('pointerEventsNone', () => `pointer-events: none;`)}
                "></div>`;
        } else {
            return `<div
                class="
                    ${classNames ? classNames : ''}
                    ${styleTable.style('positionAbsolute', () => `position: absolute;`)}
                    ${styleTable.oneTimeStyle('gridbox-connection', () => `
                        left: ${Math.min(a.x, b.x)}px;
                        top: ${Math.min(a.y, a.y + cornerHeight * Math.sign(by))}px;
                        width: ${Math.abs(bx)}px;
                        height: ${cornerHeight}px;
                        ${bx > 0 ? 'border-left' : 'border-right'}: ${style};
                        ${by > 0 ? 'border-bottom' : 'border-top'}: ${style};
                    `)}
                    ${styleTable.style('pointerEventsNone', () => `pointer-events: none;`)}
                "></div>
                <div
                class="
                    ${classNames ? classNames : ''}
                    ${styleTable.style('positionAbsolute', () => `position: absolute;`)}
                    ${styleTable.oneTimeStyle('gridbox-connection', () => `
                        left: ${Math.min(a.x, b.x)}px;
                        top: ${Math.min(b.y, a.y + cornerHeight * Math.sign(by))}px;
                        width: ${Math.abs(bx)}px;
                        height: ${Math.abs(by) - cornerHeight}px;
                        ${bx > 0 ? 'border-right' : 'border-left'}: ${style};
                    `)}
                    ${styleTable.style('pointerEventsNone', () => `pointer-events: none;`)}
                "></div>`;
        }
    }
}
type ControlMatrix = Record<number, Record<number, GridBoxConnectionItem>>;
async function renderControlConnections(
    items: Record<string, GridBoxItem>,
    format: Format['_name'],
    slotSize: NumberSize,
    size: NumberSize,
    onRenderLineBox: RenderGridBoxCommonOptions['onRenderLineBox'],
    styleTable: StyleTable,
    childrenParentInfo: ParentInfo
): Promise<string> {
    const controlMatrix: ControlMatrix = {};
    const xSlotSize = slotSize.width;
    const ySlotSize = slotSize.height;
    for (const item of Object.values(items)) {
        for (const conn of item.connections) {
            const target = items[conn.target];
            if (target !== undefined) {
                if (conn.targetType !== 'parent') {
                    drawLineOnControlMatrix(item, target, controlMatrix, format);
                } else {
                    drawLineOnControlMatrix(target, item, controlMatrix, format);
                }
            }
        }
    }
    return (await Promise.all(
        flatMap(controlMatrix, m => 
            map(m, async (item) => {
                const children = onRenderLineBox ? await onRenderLineBox(item, childrenParentInfo) : '';
                const position = getLeftUpPosition(item.x, item.y, format, slotSize, size);
                return `<div
                    class="
                        ${styleTable.style('positionAbsolute', () => `position: absolute;`)}
                        ${styleTable.oneTimeStyle('gridbox-connection', () => `
                            left: ${position.x}px;
                            top: ${position.y}px;
                            width: ${xSlotSize}px;
                            height: ${ySlotSize}px;
                        `)}
                        ${styleTable.style('pointerEventsNone', () => `pointer-events: none;`)}
                    ">
                        ${children}
                    </div>`;
            })
        )
    )).join('');
}
function drawLineOnControlMatrix(s: GridBoxItem, t: GridBoxItem, controlMatrix: ControlMatrix, format: Format['_name']): void {
    if (s.gridY === t.gridY) {
        hLineOnControlMatrix(s.gridY, s.gridX, t.gridX, s.id, t.id, controlMatrix, format);
        return;
    }
    if (s.gridX === t.gridX) {
        vLineOnControlMatrix(s.gridX, s.gridY, t.gridY, s.id, t.id, controlMatrix, format);
        return;
    }
    const sign = Math.sign(t.gridY - s.gridY);
    if (s.isJoint) {
        hLineOnControlMatrix(s.gridY, s.gridX, t.gridX, s.id, t.id, controlMatrix, format);
        vLineOnControlMatrix(t.gridX, s.gridY, t.gridY, s.id, t.id, controlMatrix, format);
    } else {
        vLineOnControlMatrix(s.gridX, s.gridY, s.gridY + sign, s.id, t.id, controlMatrix, format);
        hLineOnControlMatrix(s.gridY + sign, s.gridX, t.gridX, s.id, t.id, controlMatrix, format);
        if (t.gridY !== s.gridY + sign) {
            vLineOnControlMatrix(t.gridX, s.gridY + sign, t.gridY, s.id, t.id, controlMatrix, format);
        }
    }
}
function hLineOnControlMatrix(y: number, start: number, end: number, sId: string, eId: string, controlMatrix: ControlMatrix, format: Format['_name'], containStart: boolean = true, containEnd: boolean = true): void {
    if (start === end) {
        return;
    }
    start = Math.round(start);
    end = Math.round(end);
    const step = Math.sign(end - start);
    const inDirection = step > 0 ? 'left' : 'right';
    const outDirection = step < 0 ? 'left' : 'right';
    if (containStart) {
        drawSemiLineOnControlMatrix(controlMatrix, start, y, format, outDirection, undefined, eId);
    }
    for (let i = start + step; i !== end; i += step) {
        drawSemiLineOnControlMatrix(controlMatrix, i, y, format, inDirection, sId, undefined);
        drawSemiLineOnControlMatrix(controlMatrix, i, y, format, outDirection, undefined, eId);
    }
    if (containEnd) {
        drawSemiLineOnControlMatrix(controlMatrix, end, y, format, inDirection, sId, undefined);
    }
}
function vLineOnControlMatrix(x: number, start: number, end: number, sId: string, eId: string, controlMatrix: ControlMatrix, format: Format['_name'], containStart: boolean = true, containEnd: boolean = true): void {
    if (start === end) {
        return;
    }
    start = Math.round(start);
    end = Math.round(end);
    const step = Math.sign(end - start);
    const inDirection = step > 0 ? 'up' : 'down';
    const outDirection = step < 0 ? 'up' : 'down';
    if (containStart) {
        drawSemiLineOnControlMatrix(controlMatrix, x, start, format, outDirection, undefined, eId);
    }
    for (let i = start + step; i !== end; i += step) {
        drawSemiLineOnControlMatrix(controlMatrix, x, i, format, inDirection, sId, undefined);
        drawSemiLineOnControlMatrix(controlMatrix, x, i, format, outDirection, undefined, eId);
    }
    if (containEnd) {
        drawSemiLineOnControlMatrix(controlMatrix, x, end, format, inDirection, sId, undefined);
    }
}
function drawSemiLineOnControlMatrix(controlMatrix: ControlMatrix, x: number, y: number, format: Format['_name'], direction: Exclude<Format['_name'], 'center'>, inId: string | undefined, outId: string | undefined): void {
    if (format === 'down') {
        direction = direction === 'up' ? 'down' : direction === 'down' ? 'up' : direction;
    } else if (format === 'left') {
        direction = direction === 'up' ? 'left' : direction === 'down' ? 'right' : direction === 'left' ? 'up' : 'down';
    } else if (format === 'right') {
        direction = direction === 'up' ? 'right' : direction === 'down' ? 'left' : direction === 'left' ? 'up' : 'down';
    }
    let xSet = controlMatrix[x];
    if (xSet === undefined) {
        controlMatrix[x] = xSet = {};
    }
    let item = xSet[y];
    if (item === undefined) {
        xSet[y] = item = { x, y };
    }
    let directionFolder = item[direction];
    if (directionFolder === undefined) {
        item[direction] = directionFolder = { in: {}, out: {} };
    }
    if (inId) {
        directionFolder.in[inId] = true;
    }
    if (outId) {
        directionFolder.out[outId] = true;
    }
}
```

## File: src/util/hoi4gui/nodecommon.ts
```typescript
import { Background } from '../../hoiformat/gui';
import { HOIPartial, parseNumberLike } from '../../hoiformat/schema';
import { NumberPosition, NumberSize } from '../common';
import { CorneredTileSprite, Sprite } from '../image/sprite';
import { calculateBBox, ParentInfo, RenderCommonOptions } from './common';
export interface RenderNodeCommonOptions extends RenderCommonOptions {
    getSprite?(sprite: string, callerType: 'bg' | 'icon', callerName: string | undefined): Promise<Sprite | undefined>;
}
export function renderSprite(position: NumberPosition, size: NumberSize, sprite: Sprite, frame: number, scale: number, options: RenderCommonOptions): string {
    if (sprite instanceof CorneredTileSprite) {
        return renderCorneredTileSprite(position, size, sprite, frame, options);
    }
    // Use first frame if frame is not found
    if (!sprite.frames[frame] && frame > 0) {
        frame = 0;
    }
    return `<div
    ${options?.id ? `id="${options.id}"` : ''}
    class="
        ${options?.classNames ? options.classNames : ''}
        ${options.styleTable.style('positionAbsolute', () => `position: absolute;`)}
        ${options.styleTable.oneTimeStyle('sprite', () => `
            left: ${position.x}px;
            top: ${position.y}px;
            width: ${sprite.width * scale}px;
            height: ${sprite.height * scale}px;
        `)}
        ${options.styleTable.style(`sprite-img-${sprite.id}-${frame}`, () => `
            background-image: url(${sprite.frames[frame]?.uri});
            background-size: ${sprite.width * scale}px ${sprite.height * scale}px;
        `)}
    "></div>`;
}
export function renderCorneredTileSprite(position: NumberPosition, size: NumberSize, sprite: CorneredTileSprite, frame: number, options: RenderCommonOptions): string {
    const sizeX = size.width;
    const sizeY = size.height;
    let borderX = sprite.borderSize.x;
    let borderY = sprite.borderSize.y;
    const xPos = borderX * 2 > sizeX ? [0, sizeX / 2, sizeX / 2, sizeX] : [0, borderX, sizeX - borderX, sizeX];
    const yPos = borderY * 2 > sizeY ? [0, sizeY / 2, sizeY / 2, sizeY] : [0, borderY, sizeY - borderY, sizeY];
    const divs: string[] = [];
    const tiles = sprite.getTiles(frame);
    for (let y = 0; y < 3; y++) {
        const height = yPos[y + 1] - yPos[y];
        if (height <= 0) {
            continue;
        }
        const top = yPos[y];
        for (let x = 0; x < 3; x++) {
            const width = xPos[x + 1] - xPos[x];
            if (width <= 0 || height <= 0) {
                continue;
            }
            const left = xPos[x];
            const tileIndex = y * 3 + x;
            const tile = tiles[tileIndex];
            divs.push(`<div
            class="
                ${options.styleTable.style('positionAbsolute', () => `position: absolute;`)}
                ${options.styleTable.oneTimeStyle('corneredtilesprite-tile', () => `
                    left: ${left}px;
                    top: ${top}px;
                    width: ${width}px;
                    height: ${height}px;
                `)}
                ${options.styleTable.style(`corneredtilesprite-img-${sprite.id}-${frame}-${x}-${y}`, () => `
                    background: url(${tile.uri});
                    background-size: ${tile.width}px ${tile.height}px;
                    background-repeat: repeat;
                    background-position: ${x === 2 ? 'right' : 'left'} ${y === 2 ? 'bottom' : 'top'};
                `)}
            "></div>
            `);
        }
    }
    return `<div
    ${options?.id ? `id="${options.id}"` : ''}
    class="
        ${options?.classNames ? options.classNames : ''}
        ${options.styleTable.style('positionAbsolute', () => `position: absolute;`)}
        ${options.styleTable.oneTimeStyle('corneredtilesprite', () => `
            left: ${position.x}px;
            top: ${position.y}px;
            width: ${size.width}px;
            height: ${size.height}px;
        `)}
    ">
        ${divs.join('')}
    </div>`;
}
export async function renderBackground(background: HOIPartial<Background> | undefined, parentInfo: ParentInfo, commonOptions: RenderNodeCommonOptions): Promise<string> {
    if (background === undefined) {
        return '';
    }
    const backgroundSpriteName = background?.spritetype ?? background?.quadtexturesprite;
    const backgroundSprite = backgroundSpriteName && commonOptions.getSprite ? await commonOptions.getSprite(backgroundSpriteName, 'bg', background?.name) : undefined;
    if (backgroundSprite === undefined) {
        return '';
    }
    const [x, y, width, height] = calculateBBox({
        position: background.position,
        size: { width: parseNumberLike('100%%'), height: parseNumberLike('100%%') }
    }, parentInfo);
    return renderSprite({ x, y }, { width, height }, backgroundSprite, 0, 1, commonOptions);
}
```

## File: src/util/i18n.ts
```typescript
import { error } from "./debug";
import { __table } from '../../i18n/en';
let table: Record<string, string> = {};
export function loadI18n(locale?: string) {
    const config = JSON.parse(process.env.VSCODE_NLS_CONFIG || '{}') as { locale: string; };
    locale = locale ?? config.locale ?? 'en';
    const splitLocale = locale.split('-');
    table = tryLoadTable(locale) ??
        (splitLocale.length > 1 ? tryLoadTable(splitLocale[0]) : undefined) ??
        {};
}
function tryLoadTable(locale: string): Record<string, string> | undefined {
    try {
        const requireContext = require.context('../../i18n', false, /\/(?!template)[\w-]*\.ts$/);
        return requireContext('./' + locale + '.ts').default;
    } catch(e) {
        error(e);
    }
    return undefined;
}
export function localize(key: keyof typeof __table | 'TODO', message: string, ...args: any[]): string {
    if (key in table) {
        message = table[key];
    }
    const regex = new RegExp('\\{(' + args.map((_, i) => i.toString()).join('|') + ')\\}', 'g');
    return message.replace(regex, (_, group1) => args[parseInt(group1)]?.toString());
}
export function localizeText(text: string): string {
    return text.replace(/%(.*?)(?:\|(.*?))?%/g, (substr, key, message) => {
        if (substr === '%%') {
            return '%';
        }
        if (!key) {
            return substr;
        }
        if (!message) {
            message = key;
        }
        return localize(key, message);
    });
}
export function i18nTableAsScript(): string {
    return 'window.__i18ntable = ' + JSON.stringify(table) + ';';
}
```

## File: src/util/image/imagecache.ts
```typescript
import * as vscode from 'vscode';
import { PNG } from 'pngjs';
import { parseHoi4File } from '../../hoiformat/hoiparser';
import { getSpriteTypes } from '../../hoiformat/spritetype';
import { readFileFromModOrHOI4, hoiFileExpiryToken, expiryToken } from '../fileloader';
import { PromiseCache } from '../cache';
import { ddsToPng, tgaToPng } from './converter';
import { SpriteType, CorneredTileSpriteType } from '../../hoiformat/spritetype';
import { Sprite, Image, CorneredTileSprite } from './sprite';
import { localize } from '../i18n';
import { error } from '../debug';
import { DDS } from './dds';
import { UserError } from '../common';
import { getGfxContainerFile } from '../gfxindex';
export { Sprite, Image };
const imageCache = new PromiseCache({
    expireWhenChange: hoiFileExpiryToken,
    factory: getImage,
    life: 10 * 60 * 1000
});
const spriteCache = new PromiseCache({
    expireWhenChange: spriteCacheExpiryToken,
    factory: getSpriteByKey,
    life: 10 * 60 * 1000
});
const gfxMapCache = new PromiseCache({
    expireWhenChange: hoiFileExpiryToken,
    factory: loadGfxMap,
    life: 10 * 60 * 1000
});
export function getImageByPath(relativePath: string): Promise<Image | undefined> {
    return imageCache.get(relativePath);
}
export async function getSpriteByGfxName(name: string, gfxFilePath: string | string[]): Promise<Sprite | undefined> {
    const pathFromIndex = await getGfxContainerFile(name);
    if (pathFromIndex) {
        return await spriteCache.get(pathFromIndex + '?' + name);
    } else if (Array.isArray(gfxFilePath)) {
        for (const path of gfxFilePath) {
            const result = await spriteCache.get(path + '?' + name);
            if (result !== undefined) {
                return result;
            }
        }
    } else {
        return await spriteCache.get(gfxFilePath + '?' + name);
    }
    return undefined;
}
async function spriteCacheExpiryToken(key: string, spritePromise: Promise<Sprite | undefined>): Promise<string> {
    const [gfxFilePath] = key.split('?');
    const gfxToken = await hoiFileExpiryToken(gfxFilePath);
    const sprite = await spritePromise;
    if (sprite) {
        return `${gfxToken}:${expiryToken(sprite.image.path)}`;
    }
    return gfxToken;
}
function getSpriteByKey(key: string): Promise<Sprite | undefined> {
    const [gfxFilePath, name] = key.split('?');
    return getSpriteByGfxNameImpl(name, gfxFilePath);
}
async function getSpriteByGfxNameImpl(name: string, gfxFilePath: string): Promise<Sprite | undefined> {
    const gfxMap = await gfxMapCache.get(gfxFilePath);
    const sprite = gfxMap[name];
    if (sprite === undefined) {
        return undefined;
    }
    const image = await imageCache.get(sprite.texturefile);
    if (image === undefined) {
        return undefined;
    }
    if ('bordersize' in sprite) {
        return new CorneredTileSprite(name, image, sprite.noofframes, sprite.size, sprite.bordersize);
    }
    return new Sprite(name, image, sprite.noofframes);
}
async function getImage(relativePath: string): Promise<Image | undefined> {
    let readFileResult: [Buffer, vscode.Uri] | undefined = undefined;
    try {
        readFileResult = await readFileFromModOrHOI4(relativePath);
    } catch(e) {
        if (!(e instanceof UserError)) {
            error("Failed to get image " + relativePath);
        }
        error(e);
        if (relativePath.length <= 4 || relativePath.endsWith('.dds')) {
            return undefined;
        }
        // in case .png or .tga not exist but .dds exist
        relativePath = relativePath.substr(0, relativePath.length - 4) + '.dds';
    }
    try {
        const [buffer, realPath] = readFileResult ?? await readFileFromModOrHOI4(relativePath);
        let png: PNG;
        let pngBuffer: Buffer;
        relativePath = relativePath.toLowerCase();
        if (relativePath.endsWith('.dds')) {
            const dds = DDS.parse(buffer.buffer, buffer.byteOffset);
            png = ddsToPng(dds);
            pngBuffer = PNG.sync.write(png);
        } else if (relativePath.endsWith('.tga')) {
            png = tgaToPng(buffer);
            pngBuffer = PNG.sync.write(png);
        } else if (relativePath.endsWith('.png')) {
            pngBuffer = buffer;
            png = PNG.sync.read(buffer);
        } else {
            throw new UserError('Unsupported image type: ' + relativePath);
        }
        return new Image(pngBuffer, png.width, png.height, realPath);
    } catch (e) {
        if (!(e instanceof UserError)) {
            error("Failed to get image " + relativePath);
        }
        error(e);
        return undefined;
    }
}
async function loadGfxMap(path: string): Promise<Record<string, (SpriteType | CorneredTileSpriteType)>> {
    const gfxMap: Record<string, SpriteType> = {};
    try {
        const [buffer, realPath] = await readFileFromModOrHOI4(path);
        const gfx = buffer.toString('utf-8');
        const node = parseHoi4File(gfx, localize('infile', 'In file {0}:\n', realPath));
        const spriteTypes = getSpriteTypes(node);
        spriteTypes.forEach(st => gfxMap[st.name] = st);
    } catch (e) {
        error(e);
    }
    return gfxMap;
}
```

## File: src/util/telemetry.ts
```typescript
import TelemetryReporter from '@vscode/extension-telemetry';
interface TelemetryReporterInterface {
    sendTelemetryEvent(eventName: string, properties?: {
        [key: string]: string;
    }, measurements?: {
        [key: string]: number;
    }): void;
    sendTelemetryErrorEvent(eventName: string, properties?: {
        [key: string]: string;
    }, measurements?: {
        [key: string]: number;
    }, errorProps?: string[]): void;
    sendTelemetryException(error: Error, properties?: {
        [key: string]: string;
    }, measurements?: {
        [key: string]: number;
    }): void;
    dispose(): Promise<any>;
}
let telemetryReporter: TelemetryReporterInterface | undefined = undefined;
export interface TelemetryMessage {
    command: 'telemetry';
    telemetryType: 'event' | 'error' | 'exception';
    args: any[];
}
export function registerTelemetryReporter() {
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
        telemetryReporter = new TelemetryReporter(EXTENSION_ID, VERSION, '41a5f5b6-f4f0-4707-96ba-c895a2dabf17');
    } else {
        telemetryReporter = new DevTelemetryReporter();
    }
    return {
        dispose: () => {
            telemetryReporter?.dispose();
            telemetryReporter = undefined;
        }
    };
}
export const sendEvent: TelemetryReporter['sendTelemetryEvent'] = (eventName, properties, mesurements) => {
    telemetryReporter?.sendTelemetryEvent(eventName, properties, mesurements);
};
export const sendError: TelemetryReporter['sendTelemetryErrorEvent'] = (eventName, properties, mesurements) => {
    telemetryReporter?.sendTelemetryErrorEvent(eventName, properties, mesurements);
};
export const sendException: TelemetryReporter['sendTelemetryException'] = (error, properties, mesurements) => {
    telemetryReporter?.sendTelemetryException(error, properties, mesurements);
};
export function sendByMessage(message: TelemetryMessage) {
    switch (message.telemetryType) {
        case 'event':
            sendEvent(...(message.args as Parameters<typeof sendEvent>));
            break;
        case 'error':
            sendError(...(message.args as Parameters<typeof sendError>));
            break;
        case 'exception':
            const args = [...message.args];
            const error = new Error();
            error.message = args[0].message;
            error.name = args[0].name;
            error.stack = args[0].stack;
            args[0] = error;
            sendException(...(args as Parameters<typeof sendException>));
            break;
    }
}
class DevTelemetryReporter implements TelemetryReporterInterface {
    sendTelemetryEvent(eventName: string, properties?: { [key: string]: string; } | undefined, measurements?: { [key: string]: number; } | undefined): void {
        console.log('TelemetryEvent', eventName, JSON.stringify(properties), JSON.stringify(measurements));
    }
    sendTelemetryErrorEvent(eventName: string, properties?: { [key: string]: string; } | undefined, measurements?: { [key: string]: number; } | undefined, errorProps?: string[] | undefined): void {
        console.error('TelemetryErrorEvent', eventName, JSON.stringify(properties), JSON.stringify(measurements), JSON.stringify(errorProps));
    }
    sendTelemetryException(error: Error, properties?: { [key: string]: string; } | undefined, measurements?: { [key: string]: number; } | undefined): void {
        console.error('TelemetryException', error, JSON.stringify(properties), JSON.stringify(measurements));
    }
    async dispose(): Promise<any> {
    }
}
```

## File: scripts/genzhi18n.js
```javascript
function generate(name) {
    const en = require('../out/i18n/en').default;
    const zhCn = require('../out/i18n/' + name).default;
    const fs = require("fs");
    const result = { ...en, ...zhCn };
    fs.writeFileSync('./i18n/' + name + '.ts',
        `import { __table } from './en';\r\n/*eslint sort-keys: "warn"*/\r\nconst table: Partial<typeof __table> = ` +
        JSON.stringify(result, Object.keys(result).sort(), 4) +
        `;\r\n\r\nexport default table;\r\n`
        );
}
generate('zh-cn');
generate('ko');
generate('ru');
generate('template');
```

## File: src/hoiformat/condition.ts
```typescript
import { Node, NodeValue } from "./hoiparser";
import { nodeToString } from "./tostring";
import { Scope, tryMoveScope } from "./scope";
import { isEqual } from "lodash";
export type ConditionFolderType = 'and' | 'or' | 'ornot' | 'andnot';
export type ConditionComplexExpr = ConditionFolder | ConditionAmountFolder | ConditionItem | boolean;
export interface ConditionItem {
    scopeName: string;
    nodeContent: string;
}
export interface ConditionFolder {
    type: ConditionFolderType;
    items: ConditionComplexExpr[];
}
export interface ConditionAmountFolder {
    type: 'count';
    amount: number;
    items: ConditionComplexExpr[];
}
export interface ConditionValue {
    condition: ConditionComplexExpr;
    exprs: ConditionItem[];
}
export function extractConditionValue(nodeValue: NodeValue, scope: Scope, exprs: ConditionItem[] = []): ConditionValue {
    const condition = simplifyCondition(extractConditionFolder(nodeValue, [scope]));
    exprs = extractConditionalExprs(condition, exprs);
    return {
        condition,
        exprs,
    };
}
export function extractConditionValues(nodeValue: NodeValue[], scope: Scope, exprs: ConditionItem[] = []): ConditionValue {
    const condition = simplifyCondition({ type: 'and', items: nodeValue.map(nv => extractConditionFolder(nv, [scope])) });
    exprs = extractConditionalExprs(condition, exprs);
    return {
        condition,
        exprs,
    };
}
export function extractConditionFolder(
    nodeValue: NodeValue,
    scopeStack: Scope[],
    type: ConditionFolderType | 'count' = 'and',
    excludedKeys: string[] | undefined = undefined,
    amount: number = 0
): ConditionFolder | ConditionAmountFolder {
    if (!Array.isArray(nodeValue)) {
        return type === 'count' ? { type, amount, items: [] } : { type, items: [] };
    }
    const items: ConditionComplexExpr[] = [];
    const currentScope = scopeStack[scopeStack.length - 1];
    let ifItem: ConditionFolder | undefined = undefined;
    let ifItemHasElse = false;
    for (const child of nodeValue) {
        let keepIfItem = false;
        let childName = child.name?.toLowerCase().trim();
        if (excludedKeys && childName && excludedKeys.includes(childName)) {
            continue;
        }
        if (childName === 'and' || childName === 'hidden_trigger') {
            items.push(extractConditionFolder(child.value, scopeStack));
        } else if (childName === 'custom_trigger_tooltip') {
            items.push(extractConditionFolder(child.value, scopeStack, 'and', ['tooltip']));
        } else if (childName === 'or') {
            items.push(extractConditionFolder(child.value, scopeStack, 'or'));
        } else if (childName === 'not') {
            items.push(extractConditionFolder(child.value, scopeStack, 'ornot'));
        } else if (childName === 'if') {
            if (Array.isArray(child.value)) {
                const limit = child.value.find(v => v.name === 'limit');
                if (limit) {
                    ifItem = handleIf(child, limit, scopeStack);
                    keepIfItem = true;
                    ifItemHasElse = false;
                    const elseifs = child.value.filter(v => v.name === 'else_if');
                    for (const elseif of elseifs) {
                        handleElseIf(elseif, ifItem, scopeStack);
                        keepIfItem = false;
                    }
                    const els = child.value.find(v => v.name === 'else');
                    if (els) {
                        handleElse(els, ifItem, scopeStack);
                        keepIfItem = false;
                        ifItemHasElse = true;
                    }
                }
            }
        } else if (childName === 'else_if') {
            if (ifItem) {
                handleElseIf(child, ifItem, scopeStack);
                keepIfItem = true;
            }
        } else if (childName === 'else') {
            if (ifItem) {
                handleElse(child, ifItem, scopeStack);
                keepIfItem = false;
                ifItemHasElse = true;
            }
        } else if (childName === 'always') {
            if (typeof child.value === 'object' && child.value && 'name' in child.value) {
                items.push(child.value.name.toLowerCase() === 'yes');
            } else if (typeof child.value === 'string') {
                items.push(child.value.toLowerCase() === 'yes');
            }
        } else if (childName === 'count_triggers') {
            if (Array.isArray(child.value)) {
                const amount = child.value.find(v => v.name === 'amount');
                if (amount && typeof amount.value === 'number') {
                    items.push(extractConditionFolder(child.value, scopeStack, 'count', ['amount'], amount.value));
                }
            }
        } else if (tryMoveScope(child, scopeStack, 'condition')) {
            items.push(extractConditionFolder(child.value, scopeStack));
            scopeStack.pop();
        } else {
            items.push({
                scopeName: currentScope.scopeName,
                nodeContent: nodeToString(child),
            });
        }
        if (!keepIfItem) {
            if (ifItem) {
                if (!ifItemHasElse) {
                    handleElse(null, ifItem, []);
                }
                items.push(ifItem);
            }
            ifItem = undefined;
        }
    }
    if (ifItem) {
        if (!ifItemHasElse) {
            handleElse(null, ifItem, []);
        }
        items.push(ifItem);
    }
    if (type === 'count') {
        return { type, amount, items };
    }
    return { type, items };
}
export function applyCondition(condition: ConditionComplexExpr, trueExprs: ConditionItem[]): boolean {
    if (typeof condition === 'boolean') {
        return condition;
    }
    if (!('items' in condition)) {
        return trueExprs.some(e => isEqual(condition, e));
    }
    if (condition.type === 'count') {
        return condition.items.filter(item => applyCondition(item, trueExprs)).length >= condition.amount;
    }
    let ifSubConditionIs: boolean;
    let resultIs: boolean;
    let otherwise: boolean;
    switch (condition.type) {
        case 'and':   ifSubConditionIs = false; resultIs = false; otherwise = true; break;
        case 'or':    ifSubConditionIs = true;  resultIs = true;  otherwise = false; break;
        case 'andnot':ifSubConditionIs = false; resultIs = true;  otherwise = false; break;
        case 'ornot': ifSubConditionIs = true;  resultIs = false; otherwise = true; break;
    }
    for (const item of condition.items) {
        if (ifSubConditionIs === applyCondition(item, trueExprs)) {
            return resultIs;
        }
    }
    return otherwise;
}
function handleIf(ifNode: Node, limit: Node, scopeStack: Scope[]): ConditionFolder {
    return {
        type: 'or',
        items: [{
            type: 'and',
            items: [
                extractConditionFolder(limit.value, scopeStack, 'and'),
                extractConditionFolder(ifNode.value, scopeStack, 'and', ['limit', 'else_if', 'else']),
            ],
        }],
    };
}
function handleElseIf(elseIfNode: Node, ifItem: ConditionFolder, scopeStack: Scope[]) {
    if (!Array.isArray(elseIfNode.value)) {
        return;
    }
    const elseiflimit = elseIfNode.value.find(v => v.name === 'limit');
    if (elseiflimit) {
        const lastItemItems = (ifItem.items[ifItem.items.length - 1] as ConditionFolder).items;
        const newItem: ConditionComplexExpr[] = [
            ...lastItemItems.slice(0, lastItemItems.length - 2),
            {
                ...(lastItemItems[lastItemItems.length - 2] as ConditionFolder),
                type: 'andnot',
            },
            extractConditionFolder(elseiflimit.value, scopeStack, 'and'),
            extractConditionFolder(elseIfNode.value, scopeStack, 'and', ['limit', 'else_if', 'else']),
        ];
        ifItem.items.push({
            type: 'and',
            items: newItem,
        });
    }
}
function handleElse(elseNode: Node | null, ifItem: ConditionFolder, scopeStack: Scope[]) {
    if (elseNode === null || Array.isArray(elseNode.value)) {
        const lastItemItems = (ifItem.items[ifItem.items.length - 1] as ConditionFolder).items;
        const newItem: ConditionComplexExpr[] = [
            ...lastItemItems.slice(0, lastItemItems.length - 2),
            {
                ...(lastItemItems[lastItemItems.length - 2] as ConditionFolder),
                type: 'andnot',
            }
        ];
        if (elseNode !== null) {
            newItem.push(extractConditionFolder(elseNode.value, scopeStack, 'and', ['limit', 'else_if', 'else']));
        }
        ifItem.items.push({
            type: 'and',
            items: newItem,
        });
    }
}
export function simplifyCondition(condition: ConditionComplexExpr): ConditionComplexExpr {
    if (typeof condition === 'boolean' || !('items' in condition)) {
        return condition;
    }
    const simplifiedItems: ConditionFolder['items'] = [];
    let amount = condition.type === 'count' ? condition.amount : 0;
    for (const item of condition.items) {
        const simplified = simplifyCondition(item);
        if (typeof simplified === 'boolean') {
            if (simplified) {
                if (condition.type === 'or') {
                    return true;
                } else if (condition.type === 'ornot') {
                    return false;
                } else if (condition.type === 'count') {
                    amount--;
                }
            } else {
                if (condition.type === 'and') {
                    return false;
                } else if (condition.type === 'andnot') {
                    return true;
                }
            }
        } else {
            simplifiedItems.push(simplified);
        }
    }
    if (simplifiedItems.length === 0) {
        return condition.type === 'and' || condition.type === 'ornot';
    }
    if (condition.type === 'count') {
        if (amount <= 0) {
            return true;
        } else if (amount > simplifiedItems.length) {
            return false;
        } else if (amount === simplifiedItems.length) {
            return simplifyCondition({ type: 'and', items: simplifiedItems });
        }
    }
    if (simplifiedItems.length === 1) {
        if (condition.type === 'and' || condition.type === 'or') {
            return simplifyCondition(simplifiedItems[0]);
        }
        if (condition.type === 'andnot') {
            return simplifyCondition({ type: 'ornot', items: simplifiedItems });
        }
        if (condition.type === 'ornot') {
            const child = simplifiedItems[0];
            if (typeof child === 'object' && 'items' in child && (child.type === 'andnot' || child.type === 'ornot')) {
                return simplifyCondition({ type: child.type === 'andnot' ? 'and' : 'or', items: child.items });
            }
        }
    }
    if (condition.type === 'count') {
        return {
            ...condition,
            amount,
            items: simplifiedItems,
        };
    }
    return {
        ...condition,
        items: simplifiedItems,
    };
}
export function extractConditionalExprs(condition: ConditionComplexExpr, result: ConditionItem[] = []): ConditionItem[] {
    if (typeof condition === 'boolean') {
        return result;
    }
    if (!('items' in condition)) {
        if (result.every(e => !isEqual(e, condition))) {
            result.push(condition);
        }
        return result;
    }
    for (const item of condition.items) {
        extractConditionalExprs(item, result);
    }
    return result;
}
export function conditionToString(condition: ConditionComplexExpr): string {
    if (typeof condition === 'boolean') {
        return condition.toString();
    }
    if (!('items' in condition)) {
        return (condition.scopeName !== '' ? '[' + condition.scopeName + ']' : '') + condition.nodeContent;
    }
    return condition.type + '(' + condition.items.map(conditionToString).join(', ') + ')' + (condition.type === 'count' ? ' == ' + condition.amount : '');
}
```

## File: src/previewdef/focustree/loader.ts
```typescript
import { ContentLoader, LoadResultOD, Dependency, LoaderSession, mergeInLoadResult } from "../../util/loader/loader";
import { convertFocusFileNodeToJson, FocusTree, getFocusTreeWithFocusFile } from "./schema";
import { parseHoi4File } from "../../hoiformat/hoiparser";
import { localize } from "../../util/i18n";
import { uniq, flatten, chain } from "lodash";
import { getGfxContainerFiles } from "../../util/gfxindex";
import { sharedFocusIndex } from "../../util/featureflags";
import { findFileByFocusKey } from "../../util/sharedFocusIndex";
export interface FocusTreeLoaderResult {
    focusTrees: FocusTree[];
    gfxFiles: string[];
}
const focusesGFX = 'interface/goals.gfx';
export class FocusTreeLoader extends ContentLoader<FocusTreeLoaderResult> {
    protected async postLoad(content: string | undefined, dependencies: Dependency[], error: any, session: LoaderSession): Promise<LoadResultOD<FocusTreeLoaderResult>> {
        if (error || (content === undefined)) {
            throw error;
        }
        const constants = {};
        const file = convertFocusFileNodeToJson(parseHoi4File(content, localize('infile', 'In file {0}:\n', this.file)), constants);
        if (sharedFocusIndex) {
            for (const focusTree of file.focus_tree) {
                for (const sharedFocus of focusTree.shared_focus) {
                    if (!sharedFocus) {
                        continue;
                    }
                    const filePath = findFileByFocusKey(sharedFocus);
                    if (filePath) {
                        if (dependencies.findIndex((item) => item.path === filePath) === -1) {
                            dependencies.push({type: 'focus', path: filePath});
                        }
                    }
                }
            }
        }
        const focusTreeDependencies = dependencies.filter(d => d.type === 'focus').map(d => d.path);
        const focusTreeDepFiles = await this.loaderDependencies.loadMultiple(focusTreeDependencies, session, FocusTreeLoader);
        const sharedFocusTrees = chain(focusTreeDepFiles)
            .flatMap(f => f.result.focusTrees)
            .filter(ft => ft.isSharedFocues)
            .value();
        const focusTrees = getFocusTreeWithFocusFile(file, sharedFocusTrees, this.file, constants);
        const gfxDependencies = [
            ...dependencies.filter(d => d.type === 'gfx').map(d => d.path),
            ...flatten(focusTreeDepFiles.map(f => f.result.gfxFiles)),
            ...await getGfxContainerFiles(chain(focusTrees).flatMap(ft => Object.values(ft.focuses)).flatMap(f => f.icon).map(i => i.icon).value()),
        ];
        return {
            result: {
                focusTrees,
                gfxFiles: uniq([...gfxDependencies, focusesGFX]),
            },
            dependencies: uniq([
                this.file,
                focusesGFX,
                ...gfxDependencies,
                ...focusTreeDependencies,
                ...mergeInLoadResult(focusTreeDepFiles, 'dependencies')
            ]),
        };
    }
    public toString() {
        return `[FocusTreeLoader ${this.file}]`;
    }
}
```

## File: src/util/hoifs.ts
```typescript
import { trimStart } from 'lodash';
import * as vscode from 'vscode';
import { Commands, ConfigurationKey, Hoi4FsSchema } from '../constants';
import { UserError } from './common';
import { clearDlcZipCache } from './fileloader';
import { sendEvent } from './telemetry';
import { getConfiguration, isFileScheme } from './vsccommon';
const installPathContainer: { current: vscode.Uri | null } = {
    current: null,
};
export function registerHoiFs(): vscode.Disposable {
    const disposables: vscode.Disposable[] = [];
    disposables.push(vscode.commands.registerCommand(Commands.SelectHoiFolder, selectHoiFolder));
    disposables.push(vscode.workspace.registerFileSystemProvider(Hoi4FsSchema, new Hoi4UtilsFsProvider(), { isReadonly: true }));
    if (!IS_WEB_EXT) {
        disposables.push(vscode.workspace.onDidChangeConfiguration(onChangeWorkspaceConfiguration));
    }
    return vscode.Disposable.from(...disposables);
}
async function selectHoiFolder(): Promise<void> {
    sendEvent('selectHoiFolder');
    const dialogOptions: vscode.OpenDialogOptions = { canSelectFolders: true, canSelectFiles: false, canSelectMany: false };
    // TODO proposed API
    // dialogOptions.allowUIResources = true;
    const result = await vscode.window.showOpenDialog(dialogOptions);
    if (!result) {
        return;
    }
    const uri = result[0];
    installPathContainer.current = uri;
    clearDlcZipCache();
    if (!IS_WEB_EXT && isFileScheme(uri)) {
        const conf = getConfiguration();
        conf.update('installPath', uri.fsPath, vscode.ConfigurationTarget.Global);
    }
}
function onChangeWorkspaceConfiguration(e: vscode.ConfigurationChangeEvent): void {
    if (e.affectsConfiguration(`${ConfigurationKey}.installPath`)) {
        installPathContainer.current = null;
        clearDlcZipCache();
    }
}
class Hoi4UtilsFsProvider implements vscode.FileSystemProvider {
    private onDidChangeFileEventEmitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this.onDidChangeFileEventEmitter.event;
    watch(uri: vscode.Uri, options: { recursive: boolean; excludes: string[]; }): vscode.Disposable {
        // TODO empty implementation
        return { dispose: () => {} };
    }
    stat(uri: vscode.Uri): vscode.FileStat | Thenable<vscode.FileStat> {
        return vscode.workspace.fs.stat(vscode.Uri.joinPath(this.getInstallPath(), trimStart(uri.path, '/')));
    }
    readDirectory(uri: vscode.Uri): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]> {
        return vscode.workspace.fs.readDirectory(vscode.Uri.joinPath(this.getInstallPath(), trimStart(uri.path, '/')));
    }
    createDirectory(uri: vscode.Uri): void | Thenable<void> {
        return vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(this.getInstallPath(), trimStart(uri.path, '/')));
    }
    readFile(uri: vscode.Uri): Uint8Array | Thenable<Uint8Array> {
        return vscode.workspace.fs.readFile(vscode.Uri.joinPath(this.getInstallPath(), trimStart(uri.path, '/')));
    }
    writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean; }): void | Thenable<void> {
        return vscode.workspace.fs.writeFile(vscode.Uri.joinPath(this.getInstallPath(), trimStart(uri.path, '/')), content);
    }
    delete(uri: vscode.Uri, options: { recursive: boolean; }): void | Thenable<void> {
        return vscode.workspace.fs.delete(vscode.Uri.joinPath(this.getInstallPath(), trimStart(uri.path, '/')), options);
    }
    rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean; }): void | Thenable<void> {
        return vscode.workspace.fs.rename(
            vscode.Uri.joinPath(this.getInstallPath(), trimStart(oldUri.path, '/')),
            vscode.Uri.joinPath(this.getInstallPath(), trimStart(newUri.path, '/')),
            options);
    }
    copy(source: vscode.Uri, destination: vscode.Uri, options: { overwrite: boolean; }): void | Thenable<void> {
        return vscode.workspace.fs.copy(
            vscode.Uri.joinPath(this.getInstallPath(), trimStart(source.path, '/')),
            vscode.Uri.joinPath(this.getInstallPath(), trimStart(destination.path, '/')),
            options);
    }
    private getInstallPath(): vscode.Uri {
        if (installPathContainer.current !== null) {
            return installPathContainer.current;
        }
        const installPath = getConfiguration().installPath;
        if (installPath === '') {
            throw new UserError("Install path of Heart of Iron IV is not set.");
        }
        return installPathContainer.current = vscode.Uri.file(installPath);
    }
}
```

## File: src/util/styletable.ts
```typescript
export class StyleTable {
    private readonly records: Record<string, string> = {};
    private readonly rawRecords: Record<string, string> = {};
    private id: number = 0;
    public style(name: string, callback: () => string, fakeClass?: string): string
    public style(name: string, callback: () => Promise<string>, fakeClass?: string): Promise<string>
    public style(name: string, callback: (() => string) | (() => Promise<string>), pseudoClass: string = ''): string | Promise<string> {
        name = this.name(name);
        const key = name + pseudoClass;
        const result = this.records[key];
        if (result !== undefined) {
            return name;
        }
        const callbackResult = callback();
        if (typeof callbackResult === 'string') {
            this.records[key] = callbackResult;
            return name;
        } else {
            return callbackResult.then<string>(v => {
                this.records[key] = v;
                return name;
            });
        }
    }
    public oneTimeStyle(name: string, callback: () => string, fakeClass?: string): string
    public oneTimeStyle(name: string, callback: () => Promise<string>, fakeClass?: string): Promise<string>
    public oneTimeStyle(name: string, callback: (() => string) | (() => Promise<string>), fakeClass: string = ''): string | Promise<string> {
        const sid = this.id++;
        return this.style(name + '-' + sid, callback as any, fakeClass);
    }
    public toStyleElement(nonce: string): string {
        return `<style nonce="${nonce}">
            ${Object.entries(this.records).map(([k, v]) => `.${k} { ${v.replace(/^\s+/gm, '')} }\n`).join('')}
            ${Object.entries(this.rawRecords).map(([k, v]) => `${k} { ${v.replace(/^\s+/gm, '')} }\n`).join('')}
            </style>`;
    }
    public name(name: string) {
        return 'st-' + name;
    }
    public raw(selector: string, content: string) {
        this.rawRecords[selector] = content;
    }
}
export function normalizeForStyle(name: string): string {
    return name.replace(/[^\w_]/g, r => '_' + r.charCodeAt(0));
}
```

## File: src/util/vsccommon.ts
```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import { localize } from './i18n';
import { UserError } from './common';
import { isSamePath } from './nodecommon';
import { ConfigurationKey } from '../constants';
export function getConfiguration() {
    return vscode.workspace.getConfiguration(ConfigurationKey);
}
export function getDocumentByUri(uri: vscode.Uri): vscode.TextDocument | undefined {
    return vscode.workspace.textDocuments.find(document => document.uri.toString() === uri.toString());
}
export function getRelativePathInWorkspace(uri: vscode.Uri): string {
    const folder = vscode.workspace.getWorkspaceFolder(uri);
    if (folder) {
        return path.relative(folder.uri.path, uri.path).replace(/\\/g, '/');
    } else {
        ensureFileScheme(uri);
        return uri.fsPath;
    }
}
export function isFileScheme(uri: vscode.Uri) {
    return uri.scheme === 'file';
}
export function ensureFileScheme(uri: vscode.Uri) {
    if (!isFileScheme(uri)) {
        throw new UserError(localize('filenotondisk', 'File is not on disk: {0}.', uri.toString()));
    }
}
export function isSameUri(uriA: vscode.Uri, uriB: vscode.Uri) {
    return (isFileScheme(uriA) && isFileScheme(uriB) && isSamePath(uriA.fsPath, uriB.fsPath)) || uriA.toString() === uriB.toString();
}
export async function getLastModifiedAsync(path: vscode.Uri): Promise<number> {
    return (await vscode.workspace.fs.stat(path)).mtime;
}
export async function readDir(dir: vscode.Uri): Promise<string[]> {
    return (await vscode.workspace.fs.readDirectory(dir)).map(f => f[0]);
}
export async function readDirFiles(dir: vscode.Uri): Promise<string[]> {
    return (await vscode.workspace.fs.readDirectory(dir)).filter(f => f[1] === vscode.FileType.File).map(f => f[0]);
}
export async function readDirFilesRecursively(dir: vscode.Uri): Promise<string[]> {
    const result: string[] = [];
    await readDirFilesRecursivelyImpl(dir, '', result);
    return result;
}
async function readDirFilesRecursivelyImpl(dir: vscode.Uri, prefix: string, result: string[]): Promise<void> {
    const items = await vscode.workspace.fs.readDirectory(dir);
    for (const [name, type] of items) {
        if (type === vscode.FileType.File) {
            result.push(prefix + name);
        } else if (type === vscode.FileType.Directory) {
            await readDirFilesRecursivelyImpl(vscode.Uri.joinPath(dir, name), prefix + name + '/', result);
        }
    }
}
export async function readFile(path: vscode.Uri): Promise<Buffer> {
    return Buffer.from(await vscode.workspace.fs.readFile(path));
}
export async function writeFile(path: vscode.Uri, buffer: Buffer): Promise<void> {
    return await vscode.workspace.fs.writeFile(path, buffer);
}
export async function mkdirs(path: vscode.Uri): Promise<void> {
    await vscode.workspace.fs.createDirectory(path);
}
export async function isFile(path: vscode.Uri): Promise<boolean> {
    try {
        return (await vscode.workspace.fs.stat(path)).type === vscode.FileType.File;
    } catch (e) {
        return false;
    }
}
export async function isDirectory(path: vscode.Uri): Promise<boolean> {
    try {
        return (await vscode.workspace.fs.stat(path)).type === vscode.FileType.Directory;
    } catch (e) {
        return false;
    }
}
export function dirUri(uri: vscode.Uri): vscode.Uri {
    const updatedPath = path.dirname(uri.path);
    return uri.with({ path: updatedPath });
}
export function basename(uri: vscode.Uri, ext?: string): string {
    return path.basename(uri.path, ext);
}
export function fileOrUriStringToUri(path: string): vscode.Uri | undefined {
    if (path.trim() === '') {
        return undefined;
    }
    try {
        if (path.indexOf(':') > 2) { // try to avoid prefix like "D:\"
            return vscode.Uri.parse(path);
        } else {
            return vscode.Uri.file(path);
        }
    } catch (e) {
        return undefined;
    }
}
export function uriToFilePathWhenPossible(uri: vscode.Uri): string {
    if (isFileScheme(uri)) {
        return uri.fsPath;
    }
    return uri.toString();
}
const languageYmlDict = {
    ['Brazilian Portuguese']: 'l_braz_por',
    English: 'l_english',
    French: 'l_french',
    German: 'l_german',
    Japanese: 'l_japanese',
    Polish: 'l_polish',
    Russian: 'l_russian',
    ['Simplified Chinese']: 'l_simp_chinese',
    Spanish: 'l_spanish',
};
export function getLanguageIdInYml(): string {
    return languageYmlDict[vscode.workspace.getConfiguration('hoi4ModUtilities').previewLocalisation ?? 'English'] ?? languageYmlDict['English'];
}
```

## File: webviewsrc/util/common.ts
```typescript
import { enableDropdowns, numDropDownOpened$ } from './dropdown';
import { enableCheckboxes } from './checkbox';
import { vscode } from './vscode';
import { sendException } from './telemetry';
import { forceError } from '../../src/util/common';
export { arrayToMap } from '../../src/util/common';
export function setState(obj: Record<string, any>): void {
    const state = getState();
    Object.assign(state, obj);
    vscode.setState(state);
}
export function getState(): Record<string, any> {
    return vscode.getState() || {};
}
export function scrollToState() {
    const state = getState();
    const xOffset = state.xOffset || 0;
    const yOffset = state.yOffset || 0;
    window.scroll(xOffset, yOffset);
}
export function copyArray<T>(src: T[], dst: T[], offsetSrc: number, offsetDst: number, length: number): void {
    for (let i = offsetSrc, j = offsetDst, k = 0; k < length; i++, j++, k++) {
        dst[j] = src[i];
    }
}
export function subscribeNavigators() {
    const navigators = document.getElementsByClassName("navigator");
    for (let i = 0; i < navigators.length; i++) {
        const navigator = navigators[i] as HTMLDivElement;
        navigator.addEventListener('click', function(e) {
            e.stopPropagation();
            const startStr = this.attributes.getNamedItem('start')?.value;
            const endStr = this.attributes.getNamedItem('end')?.value;
            const file = this.attributes.getNamedItem('file')?.value;
            const start = !startStr || startStr === 'undefined' ? undefined : parseInt(startStr);
            const end = !endStr ? undefined : parseInt(endStr);
            navigateText(start, end, file);
        });
    }
}
export function tryRun<T extends (...args: any[]) => any>(func: T): (...args: Parameters<T>) => ReturnType<T> | undefined {
    return function(this: any, ...args) {
        try {
            const result = func.apply(this, args);
            if (result instanceof Promise) {
                return result.catch(e => {
                    console.error(e);
                    sendException(forceError(e));
                }) as ReturnType<T>;
            }
            return result;
        } catch (e) {
            console.error(e);
            sendException(forceError(e));
        }
        return undefined;
    };
}
let shouldDisableZoom = false;
export function enableZoom(contentElement: HTMLDivElement, xOffset: number, yOffset: number): void {
    let scale = getState().scale || 1;
    contentElement.style.transform = `scale(${scale})`;
    contentElement.style.transformOrigin = '0 0';
    window.addEventListener('wheel', function(e) {
        if (shouldDisableZoom) {
            return;
        }
        e.preventDefault();
        const oldScale = scale;
        if (e.deltaY > 0) {
            scale = Math.max(0.2, scale - 0.2);
        } else if (e.deltaY < 0) {
            scale = Math.min(1, scale + 0.2);
        }
        const oldScrollX = window.scrollX;
        const oldScrollY = window.scrollY;
        contentElement.style.transform = `scale(${scale})`;
        setState({ scale });
        const nextScrollX = (e.pageX - xOffset) * scale / oldScale + xOffset - (e.pageX - oldScrollX);
        const nextScrollY = (e.pageY - yOffset) * scale / oldScale + yOffset - (e.pageY - oldScrollY);
        window.scrollTo(nextScrollX, nextScrollY);
    },
    {
        passive: false
    });
}
function navigateText(start: number | undefined, end: number | undefined, file: string | undefined): void {
    vscode.postMessage({
        command: 'navigate',
        start,
        end,
        file,
    });
};
export function subscribeRefreshButton() {
    const button = document.getElementById('refresh') as HTMLButtonElement;
    button?.addEventListener('click', function() {
        vscode.postMessage({ command: 'reload' });
        button.disabled = true;
    });
}
if (window.previewedFileUri) {
    setState({ uri: window.previewedFileUri });
}
window.addEventListener('load', function() {
    // Disable selection
    document.body.style.userSelect = 'none';
    // Save scroll position
    (function() {
        scrollToState();
        window.addEventListener('scroll', function() {
            const state = getState();
            state.xOffset = window.pageXOffset;
            state.yOffset = window.pageYOffset;
            vscode.setState(state);
        });
    })();
    // Drag to scroll
    (function() {
        // Dragger should be like this: <div id="dragger" style="width:100vw;height:100vh;position:fixed;left:0;top:0;"></div>
        const dragger = document.getElementById("dragger");
        if (!dragger) {
            return;
        }
        dragger.addEventListener('contextmenu', event => event.preventDefault());
        let mdx = -1;
        let mdy = -1;
        let pressed = false;
        dragger.addEventListener('mousedown', function(e) {
            mdx = e.pageX;
            mdy = e.pageY;
            pressed = true;
        });
        document.body.addEventListener('mousemove', function(e) {
            if (pressed) {
                window.scroll(window.pageXOffset - e.pageX + mdx, window.pageYOffset - e.pageY + mdy);
            }
        });
        document.body.addEventListener('mouseup', function() {
            pressed = false;
        });
        document.body.addEventListener('mouseenter', function(e) {
            if (pressed && (e.buttons & 1) !== 1) {
                pressed = false;
            }
        });
    })();
    subscribeNavigators();
    enableDropdowns();
    enableCheckboxes();
    numDropDownOpened$.subscribe(num => {
        shouldDisableZoom = num > 0;
    });
});
```

## File: src/previewdef/worldmap/loader/worldmaploader.ts
```typescript
import { WorldMapData, ProgressReporter, ProvinceMap } from "../definitions";
import { CountriesLoader } from "./countries";
import { Loader, LoadResult, mergeInLoadResult } from "./common";
import { StatesLoader } from "./states";
import { DefaultMapLoader } from "./provincemap";
import { debug } from "../../../util/debug";
import { StrategicRegionsLoader } from "./strategicregion";
import { SupplyAreasLoader } from "./supplyarea";
import { LoaderSession } from "../../../util/loader/loader";
import { getConfiguration } from "../../../util/vsccommon";
import { RailwayLoader, SupplyNodeLoader } from "./railway";
import { ResourceDefinitionLoader } from "./resource";
export class WorldMapLoader extends Loader<WorldMapData> {
    private defaultMapLoader: DefaultMapLoader;
    private statesLoader: StatesLoader;
    private countriesLoader: CountriesLoader;
    private strategicRegionsLoader: StrategicRegionsLoader;
    private supplyAreasLoader: SupplyAreasLoader;
    private railwayLoader: RailwayLoader;
    private supplyNodeLoader: SupplyNodeLoader;
    private resourcesLoader: ResourceDefinitionLoader;
    private shouldReloadValue: boolean = false;
    constructor() {
        super();
        this.defaultMapLoader = new DefaultMapLoader();
        this.defaultMapLoader.onProgress(e => this.onProgressEmitter.fire(e));
        this.resourcesLoader = new ResourceDefinitionLoader();
        this.resourcesLoader.onProgress(e => this.onProgressEmitter.fire(e));
        this.statesLoader = new StatesLoader(this.defaultMapLoader, this.resourcesLoader);
        this.statesLoader.onProgress(e => this.onProgressEmitter.fire(e));
        this.countriesLoader = new CountriesLoader();
        this.countriesLoader.onProgress(e => this.onProgressEmitter.fire(e));
        this.strategicRegionsLoader = new StrategicRegionsLoader(this.defaultMapLoader, this.statesLoader);
        this.strategicRegionsLoader.onProgress(e => this.onProgressEmitter.fire(e));
        this.supplyAreasLoader = new SupplyAreasLoader(this.defaultMapLoader, this.statesLoader);
        this.supplyAreasLoader.onProgress(e => this.onProgressEmitter.fire(e));
        this.railwayLoader = new RailwayLoader(this.defaultMapLoader);
        this.railwayLoader.onProgress(e => this.onProgressEmitter.fire(e));
        this.supplyNodeLoader = new SupplyNodeLoader(this.defaultMapLoader);
        this.supplyNodeLoader.onProgress(e => this.onProgressEmitter.fire(e));
    }
    public async shouldReloadImpl(): Promise<boolean> {
        return this.shouldReloadValue;
    }
    public async loadImpl(session: LoaderSession): Promise<LoadResult<WorldMapData>> {
        this.shouldReloadValue = false;
        const provinceMap = await this.defaultMapLoader.load(session);
        session.throwIfCancelled();
        const stateMap = await this.statesLoader.load(session);
        session.throwIfCancelled();
        const countries = await this.countriesLoader.load(session);
        session.throwIfCancelled();
        const strategicRegions = await this.strategicRegionsLoader.load(session);
        session.throwIfCancelled();
        const enableSupplyArea = getConfiguration().enableSupplyArea;
        const supplyAreas = enableSupplyArea ?
            await this.supplyAreasLoader.load(session) :
            { warnings: [], result: { supplyAreas: [], badSupplyAreasCount: 0 }, dependencies: [] };
        session.throwIfCancelled();
        const railways = enableSupplyArea ?
            { warnings: [], result: { railways: [] }, dependencies: [] } :
            await this.railwayLoader.load(session);
        session.throwIfCancelled();
        const supplyNodes = enableSupplyArea ?
            { warnings: [], result: { supplyNodes: [] }, dependencies: [] } :
            await this.supplyNodeLoader.load(session);
        session.throwIfCancelled();
        const resources = await this.resourcesLoader.load(session);
        session.throwIfCancelled();
        const loadedLoaders = Array.from((session as any).loadedLoader).map<string>(v => (v as any).toString());
        debug('Loader session', loadedLoaders);
        const subLoaderResults = [ provinceMap, stateMap, countries, strategicRegions, supplyAreas, railways, supplyNodes, resources ];
        const warnings = mergeInLoadResult(subLoaderResults, 'warnings');
        const worldMap: WorldMapData = {
            ...provinceMap.result,
            ...stateMap.result,
            ...strategicRegions.result,
            ...supplyAreas.result,
            ...railways.result,
            ...supplyNodes.result,
            resources: resources.result,
            provincesCount: provinceMap.result.provinces.length,
            statesCount: stateMap.result.states.length,
            countriesCount: countries.result.length,
            strategicRegionsCount: strategicRegions.result.strategicRegions.length,
            supplyAreasCount: supplyAreas.result.supplyAreas.length,
            countries: countries.result,
            railwaysCount: railways.result.railways.length,
            supplyNodesCount: supplyNodes.result.supplyNodes.length,
            warnings,
        };
        delete (worldMap as unknown as Partial<ProvinceMap>)['colorByPosition'];
        const dependencies = mergeInLoadResult(subLoaderResults, 'dependencies');
        debug('World map dependencies', dependencies);
        return {
            result: worldMap,
            dependencies,
            warnings,
        };
    }
    public getWorldMap(force?: boolean): Promise<WorldMapData> {
        const session = new LoaderSession(force ?? false);
        return this.load(session).then(r => r.result);
    }
    public shallowForceReload(): void {
        this.shouldReloadValue = true;
    }
    protected extraMesurements(result: LoadResult<WorldMapData>) {
        return {
            ...super.extraMesurements(result),
            width: result.result.width,
            height: result.result.height,
            provincesCount: result.result.provincesCount,
            statesCount: result.result.statesCount,
            countriesCount: result.result.countriesCount,
            strategicRegionsCount: result.result.strategicRegionsCount,
            supplyAreasCount: result.result.supplyAreasCount,
        };
    }
    public toString() {
        return `[WorldMapLoader]`;
    }
}
```

## File: webviewsrc/worldmap/loader.ts
```typescript
import { WorldMapMessage, Province, WorldMapData, RequestMapItemMessage, State, Country, Point } from "./definitions";
import { copyArray } from "../util/common";
import { inBBox } from "./graphutils";
import { Subscriber } from "../util/event";
import { WorldMapWarning, Terrain, StrategicRegion, SupplyArea, Railway, SupplyNode, Resource, River } from "../../src/previewdef/worldmap/definitions";
import { vscode } from "../util/vscode";
import { BehaviorSubject, fromEvent, Observable, ObservedValueOf, Subject } from 'rxjs';
interface ExtraMapData {
    provincesCount: number;
    statesCount: number;
    countriesCount: number;
    railwaysCount: number;
    supplyNodesCount: number;
}
interface FEWorldMapClassExtra {
    getProvinceById(provinceId: number | undefined): Province | undefined;
    getStateById(stateId: number | undefined): State | undefined;
    getStrategicRegionById(strategicRegionId: number | undefined): StrategicRegion | undefined;
    getSupplyAreaById(supplyAreaId: number | undefined): SupplyArea | undefined;
    getStateByProvinceId(provinceId: number): State | undefined;
    getProvinceToStateMap(): Record<number, number | undefined>;
    getStrategicRegionByProvinceId(provinceId: number): StrategicRegion | undefined;
    getProvinceToStrategicRegionMap(): Record<number, number | undefined>;
    getSupplyAreaByStateId(stateId: number): SupplyArea | undefined;
    getStateToSupplyAreaMap(): Record<number, number | undefined>;
    getRailwayLevelByProvinceId(provinceId: number): number | undefined;
    getSupplyNodeByProvinceId(provinceId: number): SupplyNode | undefined;
    getProvinceByPosition(x: number, y: number): Province | undefined;
    getProvinceWarnings(province?: Province, state?: State, strategicRegion?: StrategicRegion, supplyArea?: SupplyArea): string[];
    getStateWarnings(state: State, supplyArea?: SupplyArea): string[];
    getStrategicRegionWarnings(strategicRegion: StrategicRegion): string[];
    getSupplyAreaWarnings(supplyArea: SupplyArea): string[];
    getRiverWarnings(riverIndex: number): string[];
    forEachProvince(callback: (province: Province) => boolean | void): void;
    forEachState(callback: (state: State) => boolean | void): void;
    forEachStrategicRegion(callback: (strategicRegion: StrategicRegion) => boolean | void): void;
    forEachSupplyArea(callback: (supplyArea: SupplyArea) => boolean | void): void;
    forEachRailway(callback: (railway: Railway) => boolean | void): void;
    forEachSupplyNode(callback: (supplyNode: SupplyNode) => boolean | void): void;
}
export type FEWorldMap = Omit<WorldMapData, 'states' | 'provinces' | 'strategicRegions' | 'supplyAreas' | 'railways' | 'supplyNodes'>
    & ExtraMapData & FEWorldMapClassExtra;
export class Loader extends Subscriber {
    public worldMap: FEWorldMapClass;
    public loading$ = new BehaviorSubject<boolean>(false);
    public progress: number = 0;
    public progressText: string = '';
    private writableWorldMap$ = new Subject<FEWorldMap>();
    public worldMap$: Observable<FEWorldMap> = this.writableWorldMap$;
    private writableProgress$ = new BehaviorSubject({ progress: 0, progressText: '' });
    public progress$: Observable<ObservedValueOf<Loader['writableProgress$']>> = this.writableProgress$;
    private loadingProvinceMap: WorldMapData & { provincesCount: number; statesCount: number; countriesCount: number; } | undefined;
    private loadingQueue: WorldMapMessage[] = [];
    private loadingQueueStartLength = 0;
    constructor() {
        super();
        this.worldMap = new FEWorldMapClass();
        this.load();
        this.worldMap$.subscribe(wm => (window as any)['worldMap'] = wm);
    }
    public refresh() {
        this.worldMap = new FEWorldMapClass();
        this.writableWorldMap$.next(this.worldMap);
        vscode.postMessage({ command: 'loaded', force: true } as WorldMapMessage);
        this.loading$.next(true);
    }
    private load() {
        this.addSubscription(fromEvent<MessageEvent>(window, 'message').subscribe(event => {
            const message = event.data as WorldMapMessage;
            switch (message.command) {
                case 'provincemapsummary':
                    this.loadingProvinceMap = { ...message.data };
                    this.loadingProvinceMap.provinces = new Array(this.loadingProvinceMap.provincesCount);
                    this.loadingProvinceMap.states = new Array(this.loadingProvinceMap.statesCount);
                    this.loadingProvinceMap.countries = new Array(this.loadingProvinceMap.countriesCount);
                    this.loadingProvinceMap.strategicRegions = new Array(this.loadingProvinceMap.strategicRegionsCount);
                    console.log(message.data);
                    this.startLoading();
                    break;
                case 'provinces':
                    this.receiveData(this.loadingProvinceMap?.provinces, message.start, message.end, message.data);
                    this.loadNext();
                    break;
                case 'states':
                    this.receiveData(this.loadingProvinceMap?.states, message.start, message.end, message.data);
                    this.loadNext();
                    break;
                case 'countries':
                    this.receiveData(this.loadingProvinceMap?.countries, message.start, message.end, message.data);
                    this.loadNext();
                    break;
                case 'strategicregions':
                    this.receiveData(this.loadingProvinceMap?.strategicRegions, message.start, message.end, message.data);
                    this.loadNext();
                    break;
                case 'supplyareas':
                    this.receiveData(this.loadingProvinceMap?.supplyAreas, message.start, message.end, message.data);
                    this.loadNext();
                    break;
                case 'railways':
                    this.receiveData(this.loadingProvinceMap?.railways, message.start, message.end, message.data);
                    this.loadNext();
                    break;
                case 'supplynodes':
                    this.receiveData(this.loadingProvinceMap?.supplyNodes, message.start, message.end, message.data);
                    this.loadNext();
                    break;
                case 'warnings':
                    if (this.loadingProvinceMap) {
                        this.loadingProvinceMap.warnings = JSON.parse(message.data);
                        this.loadNext();
                    }
                    break;
                case 'continents':
                    if (this.loadingProvinceMap) {
                        this.loadingProvinceMap.continents = JSON.parse(message.data);
                        this.loadNext();
                    }
                    break;
                case 'terrains':
                    if (this.loadingProvinceMap) {
                        this.loadingProvinceMap.terrains = JSON.parse(message.data);
                        this.loadNext();
                    }
                    break;
                case 'resources':
                    if (this.loadingProvinceMap) {
                        this.loadingProvinceMap.resources = JSON.parse(message.data);
                        this.loadNext();
                    }
                    break;
                case 'progress':
                    this.progressText = message.data;
                    this.writableProgress$.next({ progressText: this.progressText, progress: this.progress });
                    break;
                case 'error':
                    this.progressText = message.data;
                    this.writableProgress$.next({ progressText: this.progressText, progress: this.progress });
                    this.loading$.next(false);
                    break;
            }
        }));
        vscode.postMessage({ command: 'loaded', force: false } as WorldMapMessage);
        this.loading$.next(true);
    }
    private startLoading() {
        if (!this.loadingProvinceMap) {
            return;
        }
        this.loadingQueue.length = 0;
        this.queueLoadingRequest('requestcountries', this.loadingProvinceMap.countriesCount, 300);
        this.queueLoadingRequest('requeststrategicregions', this.loadingProvinceMap.strategicRegionsCount, 300);
        this.queueLoadingRequest('requeststrategicregions', -this.loadingProvinceMap.badStrategicRegionsCount, 300, this.loadingProvinceMap.badStrategicRegionsCount);
        this.queueLoadingRequest('requestsupplyareas', this.loadingProvinceMap.supplyAreasCount, 300);
        this.queueLoadingRequest('requestsupplyareas', -this.loadingProvinceMap.badSupplyAreasCount, 300, this.loadingProvinceMap.badSupplyAreasCount);
        this.queueLoadingRequest('requeststates', this.loadingProvinceMap.statesCount, 300);
        this.queueLoadingRequest('requeststates', -this.loadingProvinceMap.badStatesCount, 300, this.loadingProvinceMap.badStatesCount);
        this.queueLoadingRequest('requestprovinces', this.loadingProvinceMap.provincesCount, 300);
        this.queueLoadingRequest('requestprovinces', -this.loadingProvinceMap.badProvincesCount, 300, this.loadingProvinceMap.badProvincesCount);
        this.queueLoadingRequest('requestrailways', this.loadingProvinceMap.railwaysCount, 1000);
        this.queueLoadingRequest('requestsupplynodes', this.loadingProvinceMap.supplyNodesCount, 2000);
        this.loadingQueueStartLength = this.loadingQueue.length;
        this.progressText = '';
        this.loadNext();
    }
    private queueLoadingRequest<C extends RequestMapItemMessage['command']>(command: C, count: number, step: number, offset: number = 0) {
        for (let i = offset, j = 0; j < count; i += step, j += step) {
            this.loadingQueue.push({
                command,
                start: i,
                end: Math.min(i + step, offset + count),
            });
        }
    }
    private loadNext(updateMap: boolean = true) {
        this.progress = 1 - this.loadingQueue.length / this.loadingQueueStartLength;
        if (updateMap) {
            this.worldMap = new FEWorldMapClass(this.loadingProvinceMap!);
            this.writableWorldMap$.next(this.worldMap);
        }
        if (this.loadingQueue.length === 0) {
            this.loading$.next(false);
        } else {
            vscode.postMessage(this.loadingQueue.shift());
        }
        this.writableProgress$.next({ progressText: this.progressText, progress: this.progress });
    }
    private receiveData<T>(arr: T[] | undefined, start: number, end: number, data: string): void {
        if (arr) {
            copyArray(JSON.parse(data), arr, 0, start, end - start);
        }
    }
}
class FEWorldMapClass implements FEWorldMap {
    width!: number;
    height!: number;
    countries!: Country[];
    warnings!: WorldMapWarning[];
    provincesCount!: number;
    statesCount!: number;
    countriesCount!: number;
    strategicRegionsCount!: number;
    supplyAreasCount!: number;
    railwaysCount!: number;
    supplyNodesCount!: number;
    badProvincesCount!: number;
    badStatesCount!: number;
    badStrategicRegionsCount!: number;
    badSupplyAreasCount!: number;
    continents!: string[];
    terrains!: Terrain[];
    resources!: Resource[];
    rivers!: River[];
    private provinces!: (Province | null | undefined)[];
    private states!: (State | null | undefined)[];
    private strategicRegions!: (StrategicRegion | null | undefined)[];
    private supplyAreas!: (SupplyArea | null | undefined)[];
    private railways!: (Railway | null | undefined)[];
    private supplyNodes!: (SupplyNode | null | undefined)[];
    constructor(worldMap?: WorldMapData & ExtraMapData) {
        Object.assign(this, worldMap ?? ({
            width: 0, height: 0,
            provinces: [], states: [], countries: [], warnings: [], continents: [], strategicRegions: [], supplyAreas: [], terrains: [],
            railways: [], supplyNodes: [], resources: [], rivers: [],
            provincesCount: 0, statesCount: 0, countriesCount: 0, strategicRegionsCount: 0, supplyAreasCount: 0,
            badProvincesCount: 0, badStatesCount: 0, badStrategicRegionsCount: 0, badSupplyAreasCount: 0,
            railwaysCount: 0, supplyNodesCount: 0,
        } as WorldMapData & ExtraMapData));
    }
    public getProvinceById = (provinceId: number | undefined): Province | undefined => {
        return provinceId ? this.provinces[provinceId] ?? undefined : undefined;
    };
    public getStateById = (stateId: number | undefined): State | undefined => {
        return stateId ? this.states[stateId] ?? undefined : undefined;
    };
    public getStrategicRegionById = (strategicRegionId: number | undefined): StrategicRegion | undefined => {
        return strategicRegionId ? this.strategicRegions[strategicRegionId] ?? undefined : undefined;
    };
    public getSupplyAreaById = (supplyAreaId: number | undefined): SupplyArea | undefined => {
        return supplyAreaId ? this.supplyAreas[supplyAreaId] ?? undefined : undefined;
    };
    public getStateByProvinceId(provinceId: number): State | undefined {
        let resultState: State | undefined = undefined;
        this.forEachState(state => {
            if (state.provinces.includes(provinceId)) {
                resultState = state;
                return true;
            }
        });
        return resultState;
    }
    public getStrategicRegionByProvinceId(provinceId: number): StrategicRegion | undefined {
        let resultStrategicRegion: StrategicRegion | undefined = undefined;
        this.forEachStrategicRegion(strategicRegion => {
            if (strategicRegion.provinces.includes(provinceId)) {
                resultStrategicRegion = strategicRegion;
                return true;
            }
        });
        return resultStrategicRegion;
    }
    public getSupplyAreaByStateId(stateId: number): SupplyArea | undefined {
        let resultSupplyArea: SupplyArea | undefined = undefined;
        this.forEachSupplyArea(supplyArea => {
            if (supplyArea.states.includes(stateId)) {
                resultSupplyArea = supplyArea;
                return true;
            }
        });
        return resultSupplyArea;
    }
    public getRailwayLevelByProvinceId(provinceId: number): number | undefined {
        let resultRailwayLevel = -1;
        this.forEachRailway(railway => {
            if (railway.provinces.includes(provinceId)) {
                resultRailwayLevel = Math.max(resultRailwayLevel, railway.level);
            }
        });
        return resultRailwayLevel === -1 ? undefined : resultRailwayLevel;
    }
    public getSupplyNodeByProvinceId(provinceId: number): SupplyNode | undefined {
        let resultSupplyNode: SupplyNode | undefined = undefined;
        this.forEachSupplyNode(supplyNode => {
            if (supplyNode.province === provinceId) {
                resultSupplyNode = supplyNode;
                return true;
            }
        });
        return resultSupplyNode;
    }
    public getProvinceByPosition(x: number, y: number): Province | undefined {
        const point: Point = { x, y };
        let resultProvince: Province | undefined = undefined;
        this.forEachProvince(province => {
            if (inBBox(point, province.boundingBox) && province.coverZones.some(z => inBBox(point, z))) {
                resultProvince = province;
                return true;
            }
        });
        return resultProvince;
    }
    public getProvinceToStateMap(): Record<number, number | undefined> {
        const result: Record<number, number | undefined> = {};
        this.forEachState(state =>
            state.provinces.forEach(p => {
                result[p] = state.id;
            })
        );
        return result;
    }
    public getProvinceToStrategicRegionMap(): Record<number, number | undefined> {
        const result: Record<number, number | undefined> = {};
        this.forEachStrategicRegion(strategicRegion =>
            strategicRegion.provinces.forEach(p => {
                result[p] = strategicRegion.id;
            })
        );
        return result;
    }
    public getStateToSupplyAreaMap(): Record<number, number | undefined> {
        const result: Record<number, number | undefined> = {};
        this.forEachSupplyArea(supplyArea =>
            supplyArea.states.forEach(s => {
                result[s] = supplyArea.id;
            })
        );
        return result;
    }
    public forEachProvince(callback: (province: Province) => boolean | void) {
        const count = this.provincesCount;
        for (let i = this.badProvincesCount; i < count; i++) {
            const province = this.provinces[i];
            if (province && callback(province)) {
                break;
            }
        }
    }
    public forEachState(callback: (state: State) => boolean | void) {
        const count = this.statesCount;
        for (let i = this.badStatesCount; i < count; i++) {
            const state = this.states[i];
            if (state && callback(state)) {
                break;
            }
        }
    }
    public forEachStrategicRegion(callback: (strategicRegion: StrategicRegion) => boolean | void): void {
        const count = this.strategicRegionsCount;
        for (let i = this.badStrategicRegionsCount; i < count; i++) {
            const strategicRegion = this.strategicRegions[i];
            if (strategicRegion && callback(strategicRegion)) {
                break;
            }
        }
    }
    public forEachSupplyArea(callback: (supplyArea: SupplyArea) => boolean | void): void {
        const count = this.supplyAreasCount;
        for (let i = this.badSupplyAreasCount; i < count; i++) {
            const supplyArea = this.supplyAreas[i];
            if (supplyArea && callback(supplyArea)) {
                break;
            }
        }
    }
    public forEachRailway(callback: (railway: Railway) => boolean | void): void {
        const count = this.railwaysCount;
        for (let i = 0; i < count; i++) {
            const railway = this.railways[i];
            if (railway && callback(railway)) {
                break;
            }
        }
    }
    public forEachSupplyNode(callback: (supplyNode: SupplyNode) => boolean | void): void {
        const count = this.supplyNodesCount;
        for (let i = 0; i < count; i++) {
            const supplyNode = this.supplyNodes[i];
            if (supplyNode && callback(supplyNode)) {
                break;
            }
        }
    }
    public getProvinceWarnings(province?: Province, state?: State, strategicRegion?: StrategicRegion, supplyArea?: SupplyArea): string[] {
        return this.warnings
            .filter(v => v.source.some(s =>
                (province && s.type === 'province' && (s.id === province.id || s.color === province.color)) || 
                (state && s.type === 'state' && s.id === state.id) ||
                (strategicRegion && s.type === 'strategicregion' && s.id === strategicRegion.id) ||
                (supplyArea && s.type === 'supplyarea' && s.id === supplyArea.id)
                ))
            .map(v => v.text);
    }
    public getStateWarnings(state: State, supplyArea?: SupplyArea): string[] {
        return this.warnings
            .filter(v => v.source.some(s =>
                (s.type === 'state' && s.id === state.id) ||
                (supplyArea && s.type === 'supplyarea' && s.id === supplyArea.id)
                ))
            .map(v => v.text);
    }
    public getStrategicRegionWarnings(strategicRegion: StrategicRegion): string[] {
        return this.warnings.filter(v => v.source.some(s => s.type === 'strategicregion' && s.id === strategicRegion.id)).map(v => v.text);
    }
    public getSupplyAreaWarnings(supplyArea: SupplyArea): string[] {
        return this.warnings.filter(v => v.source.some(s => s.type === 'supplyarea' && s.id === supplyArea.id)).map(v => v.text);
    }
    public getRiverWarnings(riverIndex: number): string[] {
        return this.warnings.filter(v => v.source.some(s => s.type === 'river' && s.index === riverIndex)).map(v => v.text);
    }
}
```

## File: webviewsrc/worldmap/topbar.ts
```typescript
import { Subscriber, toBehaviorSubject } from "../util/event";
import { Loader, FEWorldMap } from "./loader";
import { ViewPoint } from "./viewpoint";
import { vscode } from "../util/vscode";
import { WorldMapMessage, WorldMapWarning } from "../../src/previewdef/worldmap/definitions";
import { feLocalize } from "../util/i18n";
import { DivDropdown } from "../util/dropdown";
import { BehaviorSubject, combineLatest, fromEvent } from 'rxjs';
import { Renderer } from './renderer';
import { sendEvent } from '../util/telemetry';
export type ViewMode = 'province' | 'state' | 'strategicregion' | 'supplyarea' | 'warnings';
export type ColorSet = 'provinceid' | 'provincetype' | 'terrain' | 'country' | 'stateid' | 'manpower' |
    'victorypoint' | 'continent' | 'warnings' | 'strategicregionid' | 'supplyareaid' | 'supplyvalue' | 'resources';
export const topBarHeight = 40;
export class TopBar extends Subscriber {
    public viewMode$: BehaviorSubject<ViewMode>;
    public colorSet$: BehaviorSubject<ColorSet>;
    public hoverProvinceId$: BehaviorSubject<number | undefined>;
    public selectedProvinceId$: BehaviorSubject<number | undefined>;
    public hoverStateId$: BehaviorSubject<number | undefined>;
    public selectedStateId$: BehaviorSubject<number | undefined>;
    public hoverStrategicRegionId$: BehaviorSubject<number | undefined>;
    public selectedStrategicRegionId$: BehaviorSubject<number | undefined>;
    public hoverSupplyAreaId$: BehaviorSubject<number | undefined>;
    public selectedSupplyAreaId$: BehaviorSubject<number | undefined>;
    public warningFilter: DivDropdown;
    public display: DivDropdown;
    public warningsVisible: boolean = false;
    private searchBox: HTMLInputElement;
    constructor(canvas: HTMLCanvasElement, private viewPoint: ViewPoint, private loader: Loader, state: any) {
        super();
        this.addSubscription(this.warningFilter = new DivDropdown(document.getElementById('warningfilter') as HTMLDivElement, true));
        this.addSubscription(this.display = new DivDropdown(document.getElementById('display') as HTMLDivElement, true));
        this.viewMode$ = toBehaviorSubject(document.getElementById('viewmode') as HTMLSelectElement, state.viewMode ?? 'province');
        this.colorSet$ = toBehaviorSubject(document.getElementById('colorset') as HTMLSelectElement, state.colorSet ?? 'provinceid');
        this.hoverProvinceId$ = new BehaviorSubject<number | undefined>(undefined);
        this.selectedProvinceId$ = new BehaviorSubject<number | undefined>(state.selectedProvinceId ?? undefined);
        this.hoverStateId$ = new BehaviorSubject<number | undefined>(undefined);
        this.selectedStateId$ = new BehaviorSubject<number | undefined>(state.selectedStateId ?? undefined);
        this.hoverStrategicRegionId$ = new BehaviorSubject<number | undefined>(undefined);
        this.selectedStrategicRegionId$ = new BehaviorSubject<number | undefined>(state.selectedStrategicRegionId ?? undefined);
        this.hoverSupplyAreaId$ = new BehaviorSubject<number | undefined>(undefined);
        this.selectedSupplyAreaId$ = new BehaviorSubject<number | undefined>(state.selectedSupplyAreaId ?? undefined);
        if (state.warningFilter) {
            this.warningFilter.selectedValues$.next(state.warningFilter);
        } else {
            this.warningFilter.selectAll();
        }
        if (state.display) {
            this.display.selectedValues$.next(state.display);
        } else {
            this.display.selectAll();
        }
        this.searchBox = document.getElementById("searchbox") as HTMLInputElement;
        this.loadControls();
        this.registerEventListeners(canvas);
    }
    private onViewModeChange() {
        document.querySelectorAll('#colorset > option[viewmode]').forEach(v => {
            (v as HTMLOptionElement).hidden = true;
        });
        let colorSetHidden = true;
        document.querySelectorAll('#colorset > option[viewmode~="' + this.viewMode$.value + '"]').forEach(v => {
            (v as HTMLOptionElement).hidden = false;
            if ((v as HTMLOptionElement).value === this.colorSet$.value) {
                colorSetHidden = false;
            }
        });
        document.querySelectorAll('#colorset > option:not([viewmode])').forEach(v => {
            if ((v as HTMLOptionElement).value === this.colorSet$.value) {
                colorSetHidden = false;
            }
        });
        document.querySelectorAll('button[viewmode]').forEach(v => {
            (v as HTMLButtonElement).style.display = 'none';
        });
        document.querySelectorAll('button[viewmode~="' + this.viewMode$.value + '"]').forEach(v => {
            (v as HTMLButtonElement).style.display = 'inline-block';
        });
        document.querySelectorAll('.group[viewmode]').forEach(v => {
            (v as HTMLDivElement).style.display = 'none';
        });
        document.querySelectorAll('.group[viewmode~="' + this.viewMode$.value + '"]').forEach(v => {
            (v as HTMLDivElement).style.display = 'inline-block';
        });
        if (colorSetHidden) {
            const newColorset = (document.querySelector('#colorset > option:not(*[hidden])') as HTMLOptionElement)?.value;
            this.colorSet$.next(newColorset as any);
        }
        this.setSearchBoxPlaceHolder();
    }
    private loadControls() {
        this.loadWarningButton();
        this.loadSearchBox();
        this.loadRefreshButton();
        this.loadOpenButton();
        this.loadExportButton();
    }
    private loadWarningButton() {
        const warningsContainer = document.getElementById('warnings-container')!;
        const showWarnings = document.getElementById('show-warnings')!;
        this.addSubscription(fromEvent(showWarnings, 'click').subscribe(() => {
            this.warningsVisible = !this.warningsVisible;
            if (this.warningsVisible) {
                sendEvent('worldmap.openwarnings');
                warningsContainer.style.display = 'block';
            } else {
                warningsContainer.style.display = 'none';
            }
        }));
    }
    private loadSearchBox() {
        const searchBox = this.searchBox;
        const search = document.getElementById("search")!;
        this.addSubscription(fromEvent<KeyboardEvent>(searchBox, 'keypress').subscribe((e) => {
            if (e.code === 'Enter') {
                sendEvent('worldmap.search', { keypress: 'true' });
                this.search(searchBox.value);
            }
        }));
        this.addSubscription(fromEvent(search, 'click').subscribe(() => {
            sendEvent('worldmap.search', { keypress: 'false' });
            this.search(searchBox.value);
        }));
    }
    private loadRefreshButton() {
        const refresh = document.getElementById("refresh") as HTMLButtonElement;
        this.addSubscription(fromEvent(refresh, 'click').subscribe(() => {
            if (!refresh.disabled) {
                sendEvent('worldmap.refresh');
                this.loader.refresh();
            }
        }));
        this.addSubscription(this.loader.loading$.subscribe(v => {
            refresh.disabled = v;
        }));
    }
    private openMapItem(useHoverValue = false) {
        sendEvent('worldmap.open.' + this.viewMode$.value + (useHoverValue ? '.dblclick' : ''));
        if (this.viewMode$.value === 'state') {
            const selected = useHoverValue ? this.hoverStateId$.value : this.selectedStateId$.value;
            if (selected) {
                const state = this.loader.worldMap.getStateById(selected);
                if (state) {
                    vscode.postMessage<WorldMapMessage>({ command: 'openfile', type: 'state', file: state.file, start: state.token?.start, end: state.token?.end });
                }
            }
        } else if (this.viewMode$.value === 'strategicregion') {
            const selected = useHoverValue ? this.hoverStrategicRegionId$.value : this.selectedStrategicRegionId$.value;
            if (selected) {
                const strategicRegion = this.loader.worldMap.getStrategicRegionById(selected);
                if (strategicRegion) {
                    vscode.postMessage<WorldMapMessage>({ command: 'openfile', type: 'strategicregion', file: strategicRegion.file,
                        start: strategicRegion.token?.start, end: strategicRegion.token?.end });
                }
            }
        } else if (this.viewMode$.value === 'supplyarea') {
            const selected = useHoverValue ? this.hoverSupplyAreaId$.value : this.selectedSupplyAreaId$.value;
            if (selected) {
                const supplyArea = this.loader.worldMap.getSupplyAreaById(selected);
                if (supplyArea) {
                    vscode.postMessage<WorldMapMessage>({ command: 'openfile', type: 'supplyarea', file: supplyArea.file,
                        start: supplyArea.token?.start, end: supplyArea.token?.end });
                }
            }
        }
    }
    private loadOpenButton() {
        const open = document.getElementById("open") as HTMLButtonElement;
        this.addSubscription(fromEvent(open, 'click').subscribe((e) => {
            e.stopPropagation();
            this.openMapItem();
        }));
        this.addSubscription(combineLatest([this.viewMode$, this.selectedStateId$, this.selectedStrategicRegionId$, this.selectedSupplyAreaId$]).subscribe(
            ([viewMode, selectedStateId, selectedStrategicRegionId, selectedSupplyAreaId]) => {
                open.disabled = !((viewMode === 'state' && selectedStateId !== undefined) ||
                    (viewMode === 'strategicregion' && selectedStrategicRegionId !== undefined) ||
                    (viewMode === 'supplyarea' && selectedSupplyAreaId !== undefined));
            }
        ));
    }
    private loadExportButton() {
        const exportButton = document.getElementById("export") as HTMLButtonElement;
        exportButton.disabled = true;
        this.addSubscription(this.loader.worldMap$.subscribe(wm => {
            exportButton.disabled = !wm;
        }));
        this.addSubscription(fromEvent(exportButton, 'click').subscribe(e => {
            e.stopPropagation();
            vscode.postMessage({ command: 'requestexportmap' });
        }));
        this.addSubscription(fromEvent<MessageEvent>(window, 'message').subscribe(event => {
            const message = event.data as WorldMapMessage;
            if (message.command !== 'requestexportmap') {
                return;
            }
            const worldMap = this.loader.worldMap;
            if (!worldMap) {
                return;
            }
            sendEvent('worldmap.export');
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, worldMap.width);
            canvas.height = Math.max(1, worldMap.height);
            const viewPoint = new ViewPoint(canvas, this.loader, 0, { x: 0, y: 0, scale: 1 });
            Renderer.renderMapImpl(canvas, this, viewPoint, worldMap, { preciseEdge: true, overwriteRenderPrecision: 1 });
            vscode.postMessage({ command: 'exportmap', dataUrl: canvas.toDataURL() });
        }));
    }
    private registerEventListeners(canvas: HTMLCanvasElement) {
        this.addSubscription(fromEvent<MouseEvent>(canvas, 'mousemove').subscribe((e) => {
            if (!this.loader.worldMap) {
                this.hoverProvinceId$.next(undefined);
                this.hoverStateId$.next(undefined);
                this.hoverStrategicRegionId$.next(undefined);
                this.hoverSupplyAreaId$.next(undefined);
                return;
            }
            const worldMap = this.loader.worldMap;
            let x = this.viewPoint.convertBackX(e.pageX);
            let y = this.viewPoint.convertBackY(e.pageY);
            if (x < 0) {
                x += worldMap.width;
            }
            while (x >= worldMap.width && worldMap.width > 0) {
                x -= worldMap.width;
            }
            this.hoverProvinceId$.next(worldMap.getProvinceByPosition(x, y)?.id);
            this.hoverStateId$.next(this.hoverProvinceId$.value === undefined ? undefined : worldMap.getStateByProvinceId(this.hoverProvinceId$.value)?.id);
            this.hoverStrategicRegionId$.next(this.hoverProvinceId$.value === undefined ? undefined : worldMap.getStrategicRegionByProvinceId(this.hoverProvinceId$.value)?.id);
            this.hoverSupplyAreaId$.next(this.hoverStateId$.value === undefined ? undefined : worldMap.getSupplyAreaByStateId(this.hoverStateId$.value)?.id);
        }));
        this.addSubscription(fromEvent(canvas, 'mouseleave').subscribe(() => {
            this.hoverProvinceId$.next(undefined);
            this.hoverStateId$.next(undefined);
            this.hoverStrategicRegionId$.next(undefined);
            this.hoverSupplyAreaId$.next(undefined);
        }));
        this.addSubscription(fromEvent(canvas, 'click').subscribe(() => {
            switch (this.viewMode$.value) {
                case 'province':
                    this.selectedProvinceId$.next(this.selectedProvinceId$.value === this.hoverProvinceId$.value ? undefined : this.hoverProvinceId$.value);
                    break;
                case 'state':
                    this.selectedStateId$.next(this.selectedStateId$.value === this.hoverStateId$.value ? undefined : this.hoverStateId$.value);
                    break;
                case 'strategicregion':
                    this.selectedStrategicRegionId$.next(this.selectedStrategicRegionId$.value === this.hoverStrategicRegionId$.value ? undefined : this.hoverStrategicRegionId$.value);
                    break;
                case 'supplyarea':
                    this.selectedSupplyAreaId$.next(this.selectedSupplyAreaId$.value === this.hoverSupplyAreaId$.value ? undefined : this.hoverSupplyAreaId$.value);
                    break;
            }
        }));
        this.addSubscription(fromEvent(canvas, 'dblclick').subscribe(e => {
            e.stopPropagation();
            this.openMapItem(true);
        }));
        this.addSubscription(this.viewMode$.subscribe(() => this.onViewModeChange()));
        this.addSubscription(this.loader.worldMap$.subscribe(wm => {
            const warnings = document.getElementById('warnings') as HTMLTextAreaElement;
            if (wm.warnings.length === 0) {
                warnings.value = feLocalize('worldmap.warnings.nowarnings', 'No warnings.');
            } else {
                warnings.value = feLocalize('worldmap.warnings', 'World map warnings: \n\n{0}', wm.warnings.map(warningToString).join('\n'));
            }
            this.setSearchBoxPlaceHolder(wm);
        }));
    }
    private search(text: string) {
        const number = parseInt(text);
        if (isNaN(number)) {
            return;
        }
        const viewMode = this.viewMode$.value;
        const [getRegionById, selectedId] =
            viewMode === 'province' ? [this.loader.worldMap.getProvinceById, this.selectedProvinceId$] :
            viewMode === 'state' ? [this.loader.worldMap.getStateById, this.selectedStateId$] :
            viewMode === 'strategicregion' ? [this.loader.worldMap.getStrategicRegionById, this.selectedStrategicRegionId$] :
            viewMode === 'supplyarea' ? [this.loader.worldMap.getSupplyAreaById, this.selectedSupplyAreaId$] :
            [() => undefined, undefined];
        const region = getRegionById(number);
        if (region) {
            selectedId?.next(number);
            this.viewPoint.centerZone(region.boundingBox);
        }
    }
    private setSearchBoxPlaceHolder(worldMap?: FEWorldMap) {
        if (!worldMap) {
            worldMap = this.loader.worldMap;
        }
        let placeholder = '';
        switch (this.viewMode$.value) {
            case 'province':
                placeholder = worldMap.provincesCount > 1 ? `1-${worldMap.provincesCount - 1}` : '';
                break;
            case 'state':
                placeholder = worldMap.statesCount > 1 ? `1-${worldMap.statesCount - 1}` : '';
                break;
            case 'strategicregion':
                placeholder = worldMap.strategicRegionsCount > 1 ? `1-${worldMap.strategicRegionsCount - 1}` : '';
                break;
            case 'supplyarea':
                placeholder = worldMap.supplyAreasCount > 1 ? `1-${worldMap.supplyAreasCount - 1}` : '';
                break;
            default:
                break;
        }
        if (placeholder) {
            this.searchBox.placeholder = feLocalize('worldmap.topbar.search.placeholder', 'Range: {0}', placeholder);
        } else {
            this.searchBox.placeholder = '';
        }
    }
}
function warningToString(warning: WorldMapWarning): string {
    return `[${warning.source.map(s => `${s.type[0].toUpperCase()}${s.type.substr(1)} ${'id' in s ? s.id : s.name}`).join(', ')}] ${warning.text}`;
}
```

## File: src/ddsviewprovider.ts
```typescript
import * as vscode from 'vscode';
import { ddsToPng, tgaToPng } from './util/image/converter';
import { PNG } from 'pngjs';
import { localize } from './util/i18n';
import { DDS } from './util/image/dds';
import { html, htmlEscape } from './util/html';
import { StyleTable } from './util/styletable';
import { sendEvent } from './util/telemetry';
import { forceError } from './util/common';
import { readFile } from './util/vsccommon';
abstract class CommonViewProvider implements vscode.CustomReadonlyEditorProvider {
    public async openCustomDocument(uri: vscode.Uri) {
        // Don't try opening it as text
        return { uri, dispose: () => { } };
    }
    public async resolveCustomEditor(document: vscode.CustomDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): Promise<void> {
        try {
            this.onOpen();
            const buffer = await Promise.race([
                readFile(document.uri),
                new Promise<null>(resolve => token.onCancellationRequested(_ => resolve(null))),
            ]);
            if (buffer === null) {
                return;
            }
            const png = this.getPng(Buffer.from(buffer));
            const pngBuffer = PNG.sync.write(png);
            const styleTable = new StyleTable();
            webviewPanel.webview.html = html(
                webviewPanel.webview,
                `<div class="${styleTable.oneTimeStyle('imagePreview', () => `width:${png.width}px;height:${png.height}px;`)}">
                    <img src="data:image/png;base64,${pngBuffer.toString('base64')}"/>
                </div>`,
                [],
                [styleTable]
            );
        } catch (e) {
            webviewPanel.webview.html = `${localize('error', 'Error')}: <br/>  <pre>${htmlEscape(forceError(e).toString())}</pre>`;
        }
    }
    protected abstract onOpen(): void;
    protected abstract getPng(buffer: Buffer): PNG;
}
export class DDSViewProvider extends CommonViewProvider {
    protected onOpen(): void {
        sendEvent('preview.dds');
    }
    protected getPng(buffer: Buffer): PNG {
        const dds = DDS.parse(buffer.buffer, buffer.byteOffset);
        return ddsToPng(dds);
    }
}
export class TGAViewProvider extends CommonViewProvider {
    protected onOpen(): void {
        sendEvent('preview.tga');
    }
    protected getPng(buffer: Buffer): PNG {
        return tgaToPng(buffer);
    }
}
```

## File: src/previewdef/previewbase.ts
```typescript
import * as vscode from 'vscode';
import { localize } from '../util/i18n';
import { error, debug } from '../util/debug';
import { dirUri, getDocumentByUri } from '../util/vsccommon';
import { isEqual } from 'lodash';
import { getFilePathFromMod, getHoiOpenedFileOriginalUri, readFileFromModOrHOI4 } from '../util/fileloader';
import { mkdirs, writeFile } from '../util/vsccommon';
import { sendByMessage } from '../util/telemetry';
import { forceError } from '../util/common';
export abstract class PreviewBase {
    private cachedDependencies: string[] | undefined = undefined;
    private dependencyChangedEmitter = new vscode.EventEmitter<string[]>();
    public onDependencyChanged = this.dependencyChangedEmitter.event;
    private disposeEmitter = new vscode.EventEmitter<undefined>();
    public onDispose = this.disposeEmitter.event;
    private disposed = false;
    constructor(
        readonly uri: vscode.Uri,
        readonly panel: vscode.WebviewPanel,
    ) {
        this.registerEvents(panel);
    }
    public async onDocumentChange(document: vscode.TextDocument): Promise<void> {
        try {
            this.panel.webview.html = await this.getContent(document);
        } catch(e) {
            error(e);
        }
    }
    public dispose(): void {
        this.dependencyChangedEmitter.dispose();
        this.disposed = true;
        this.disposeEmitter.fire(undefined);
        this.disposeEmitter.dispose();
    }
    public get isDisposed(): boolean {
        return this.disposed;
    }
    public async initializePanelContent(document: vscode.TextDocument): Promise<void> {
        this.panel.webview.html = localize('loading', 'Loading...');
        await this.onDocumentChange(document);
    }
    protected registerEvents(panel: vscode.WebviewPanel): void {
        panel.webview.onDidReceiveMessage((msg) => {
            switch (msg.command) {
                case 'navigate':
                    if (msg.start !== undefined) {
                        if (msg.file === undefined) {
                            const document = getDocumentByUri(this.uri);
                            if (document === undefined) {
                                return;
                            }
                            vscode.window.showTextDocument(this.uri, {
                                selection: new vscode.Range(document.positionAt(msg.start), document.positionAt(msg.end)),
                                viewColumn: vscode.ViewColumn.One
                            });
                        } else {
                            this.openOrCopyFile(msg.file, msg.start, msg.end);
                        }
                    }
                    break;
                case 'telemetry':
                    sendByMessage(msg);
                    break;
                case 'reload':
                    this.reload();
                    break;
            }
        });
        panel.onDidDispose(() => {
            this.dispose();
        });
    }
    protected updateDependencies(dependencies: string[]): void {
        if (this.cachedDependencies === undefined || !isEqual(this.cachedDependencies, dependencies)) {
            this.dependencyChangedEmitter.fire(dependencies);
            debug("dependencies: ", this.uri.toString(), JSON.stringify(dependencies));
        }
        this.cachedDependencies = dependencies;
    }
    protected async openOrCopyFile(file: string, start: number | undefined, end: number | undefined): Promise<void> {
        const filePathInMod = await getFilePathFromMod(file);
        if (filePathInMod !== undefined) {
            const filePathInModWithoutOpened = getHoiOpenedFileOriginalUri(filePathInMod);
            const document = getDocumentByUri(filePathInModWithoutOpened) ?? await vscode.workspace.openTextDocument(filePathInModWithoutOpened);
            await vscode.window.showTextDocument(document, {
                selection: start !== undefined && end !== undefined ? new vscode.Range(document.positionAt(start), document.positionAt(end)) : undefined,
                viewColumn: vscode.ViewColumn.One,
            });
            return;
        }
        if (!vscode.workspace.workspaceFolders?.length) {
            await vscode.window.showErrorMessage(localize('preview.mustopenafolder', 'Must open a folder before opening "{0}".', file));
            return;
        }
        let targetFolderUri = vscode.workspace.workspaceFolders[0].uri;
        if (vscode.workspace.workspaceFolders.length >= 1) {
            const folder = await vscode.window.showWorkspaceFolderPick({ placeHolder: localize('preview.selectafolder', 'Select a folder to copy "{0}"', file) });
            if (!folder) {
                return;
            }
            targetFolderUri = folder.uri;
        }
        try {
            const targetFolder = targetFolderUri;
            const [buffer] = await readFileFromModOrHOI4(file);
            const targetPath = vscode.Uri.joinPath(targetFolder, file);
            await mkdirs(dirUri(targetPath));
            await writeFile(targetPath, buffer);
            const document = await vscode.workspace.openTextDocument(targetPath);
            await vscode.window.showTextDocument(document, {
                selection: start !== undefined && end !== undefined ? new vscode.Range(document.positionAt(start), document.positionAt(end)) : undefined,
                viewColumn: vscode.ViewColumn.One,
            });
        } catch (e) {
            await vscode.window.showErrorMessage(localize('preview.failedtoopen', 'Failed to open file "{0}": {1}.', file, forceError(e).toString()));
        }
    }
    protected reload() {        
        const document = getDocumentByUri(this.uri);
        if (document === undefined) {
            return;
        }
        this.onDocumentChange(document);
    }
    protected abstract getContent(document: vscode.TextDocument): Promise<string>;
}
```

## File: src/previewdef/previewmanager.ts
```typescript
import * as vscode from 'vscode';
import { focusTreePreviewDef } from './focustree';
import { localize } from '../util/i18n';
import { gfxPreviewDef } from './gfx';
import { Commands, WebviewType, ContextName } from '../constants';
import { technologyPreviewDef } from './technology';
import { matchPathEnd } from '../util/nodecommon';
import { arrayToMap, debounceByInput } from '../util/common';
import { debug, error } from '../util/debug';
import { PreviewBase } from './previewbase';
import { contextContainer, setVscodeContext } from '../context';
import { basename, getDocumentByUri } from '../util/vsccommon';
import { worldMapPreviewDef } from './worldmap';
import { eventPreviewDef } from './event';
import { chain } from 'lodash';
import { sendEvent } from '../util/telemetry';
import { guiPreviewDef } from './gui';
import { mioPreviewDef } from './mio';
export type PreviewProviderDef = PreviewProviderDefNormal | PreviewProviderDefAlternative;
interface PreviewProviderDefNormal {
    type: string;
    canPreview(document: vscode.TextDocument): number | undefined;
    previewContructor: new (uri: vscode.Uri, panel: vscode.WebviewPanel) => PreviewBase;
}
interface PreviewProviderDefAlternative {
    type: string;
    canPreview(document: vscode.TextDocument): number | undefined;
    onPreview(document: vscode.TextDocument): Promise<void>;
}
export class PreviewManager implements vscode.WebviewPanelSerializer {
    private _previews: Record<string, PreviewBase> = {};
    private _previewProviders: PreviewProviderDef[] = [
        focusTreePreviewDef,
        gfxPreviewDef,
        technologyPreviewDef,
        worldMapPreviewDef,
        eventPreviewDef,
        guiPreviewDef,
        mioPreviewDef,
    ];
    private _previewProvidersMap: Record<string, PreviewProviderDef> = arrayToMap(this._previewProviders, 'type');
    private _updateSubscriptions: Map<string[], PreviewBase[]> = new Map();
    public register(): vscode.Disposable {
        const disposables: vscode.Disposable[] = [];
        disposables.push(vscode.commands.registerCommand(Commands.Preview, this.showPreview, this));
        disposables.push(vscode.workspace.onDidCloseTextDocument(this.onCloseTextDocument, this));
        disposables.push(vscode.workspace.onDidChangeTextDocument(this.onChangeTextDocument, this));
        disposables.push(vscode.window.onDidChangeActiveTextEditor(this.updateHoi4PreviewContextValue, this));
        disposables.push(vscode.window.registerWebviewPanelSerializer(WebviewType.Preview, this));
        // Trigger context value setting
        this.updateHoi4PreviewContextValue(vscode.window.activeTextEditor);
        return vscode.Disposable.from(...disposables);
    }
    public async deserializeWebviewPanel(panel: vscode.WebviewPanel, state: any): Promise<void> {
        const uriStr = state?.uri as string | undefined;
        if (!uriStr) {
            panel.dispose();
            debug(`dispose panel ??? because uri not exist`);
            return;
        }
        try {
            const uri = vscode.Uri.parse(uriStr, true);
            await vscode.workspace.openTextDocument(uri);
            await this.showPreviewImpl(uri, panel);
        } catch (e) {
            error(e);
            panel.dispose();
            debug(`dispose panel ${uriStr} because reopen error`);
        }
    }
    private showPreview(uri?: vscode.Uri): Promise<void> {
        return this.showPreviewImpl(uri);
    }
    private onCloseTextDocument(document: vscode.TextDocument): void {
        if (!vscode.window.visibleTextEditors.some(e => e.document.uri.toString() === document.uri.toString())) {
            const key = document.uri.toString();
            this._previews[key]?.panel.dispose();
            debug(`dispose panel ${key} because text document closed`);
        }
        this.updatePreviewItemsInSubscription(document.uri);
    }
    private onChangeTextDocument(e: vscode.TextDocumentChangeEvent): void {
        const document = e.document;
        const key = document.uri.toString();
        const preview = this._previews[key];
        if (preview !== undefined) {
            this.updatePreviewItem(preview, document);
        }
        this.updatePreviewItemsInSubscription(document.uri);
    }
    private updateHoi4PreviewContextValue(textEditor: vscode.TextEditor | undefined): void {
        let shouldShowPreviewButton = false;
        let hoi4PreviewType = '';
        if (textEditor) {
            const provider = this.findPreviewProvider(textEditor.document);
            if (provider) {
                shouldShowPreviewButton = true;
                hoi4PreviewType = provider.type;
            }
        }
        setVscodeContext(ContextName.ShouldShowHoi4Preview, shouldShowPreviewButton);
        setVscodeContext(ContextName.ShouldHideHoi4Preview, !shouldShowPreviewButton);
        setVscodeContext(ContextName.Hoi4PreviewType, hoi4PreviewType);
    }
    private async showPreviewImpl(requestUri?: vscode.Uri, panel?: vscode.WebviewPanel): Promise<void> {
        let document: vscode.TextDocument | undefined;
        if (requestUri === undefined) {
            document = vscode.window.activeTextEditor?.document;
        } else {
            document = getDocumentByUri(requestUri);
        }
        if (document === undefined) {
            if (requestUri === undefined) {
                vscode.window.showErrorMessage(localize('preview.noactivedoc', "No active document."));
            } else {
                vscode.window.showErrorMessage(localize('preview.cantfinddoc', "Can't find opened document {0}.", requestUri?.toString()));
            }
            panel?.dispose();
            debug(`dispose panel ${requestUri} because document not opened`);
            return;
        }
        const uri = document.uri;
        const key = uri.toString();
        if (key in this._previews) {
            this._previews[key].panel.reveal();
            panel?.dispose();
            debug(`dispose panel ${uri} because preview already open`);
            return;
        }
        const previewProvider = this.findPreviewProvider(document);
        if (!previewProvider) {
            vscode.window.showInformationMessage(
                localize('preview.cantpreviewfile', "Can't preview this file.\nValid types: {0}.", Object.keys(this._previewProvidersMap).join(', ')));
            panel?.dispose();
            debug(`dispose panel ${uri} because no preview provider`);
            this.updateHoi4PreviewContextValue(undefined);
            return;
        }
        if ('onPreview' in previewProvider) {
            return previewProvider.onPreview(document);
        }
        if (!panel) {
            sendEvent('preview.show.' + previewProvider.type);
        }
        const filename = basename(uri);
        panel = panel ?? vscode.window.createWebviewPanel(
            WebviewType.Preview,
            localize('preview.viewtitle', "HOI4: {0}", filename),
            vscode.ViewColumn.Beside,
            {
                enableScripts: true
            }
        );
        if (contextContainer.current) {
            panel.iconPath = {
                light: vscode.Uri.joinPath(contextContainer.current.extensionUri, 'static/preview-right-light.svg'),
                dark: vscode.Uri.joinPath(contextContainer.current.extensionUri, 'static/preview-right-dark.svg'),
            };
        }
        const previewItem = new previewProvider.previewContructor(uri, panel);
        this._previews[key] = previewItem;
        previewItem.onDispose(() => {
            const preview = this._previews[key];
            if (preview) {
                this.removePreviewFromSubscription(preview);
                delete this._previews[key];
            }
        });
        previewItem.onDependencyChanged((newDep) => {
            this.removePreviewFromSubscription(previewItem);
            this.addPreviewToSubscription(previewItem, newDep);
        });
        previewItem.initializePanelContent(document);
    }
    private findPreviewProvider(document: vscode.TextDocument): PreviewProviderDef | undefined {
        return chain(this._previewProviders)
            .map(p => ({ provider: p, priority: p.canPreview(document) }))
            .filter((value): value is ({ provider: PreviewProviderDef; priority: number }) => value.priority !== undefined)
            .minBy(value => value.priority)
            .value()?.provider;
    }
    private addPreviewToSubscription(previewItem: PreviewBase, dependency: string[]): void {
        const matchStrings = Object.values(dependency)
            .map(d => d.split('/').filter(v => v));
        for (const matchString of matchStrings) {
            const subscriptions = this._updateSubscriptions.get(matchString);
            if (subscriptions) {
                subscriptions.push(previewItem);
            } else {
                this._updateSubscriptions.set(matchString, [ previewItem ]);
            }
        }
    }
    private removePreviewFromSubscription(previewItem: PreviewBase): void {
        for (const [matchString, subscriptions] of this._updateSubscriptions.entries()) {
            if (subscriptions.includes(previewItem)) {
                const newSubscriptions = subscriptions.filter(v => v !== previewItem);
                if (newSubscriptions.length === 0) {
                    this._updateSubscriptions.delete(matchString);
                } else {
                    this._updateSubscriptions.set(matchString, newSubscriptions);
                }
            }
        }
    }
    private getPreviewItemsNeedsUpdate(uri: string): PreviewBase[] {
        const result: PreviewBase[] = [];
        for (const [ matchString, previewItems ] of this._updateSubscriptions.entries()) {
            if (matchPathEnd(uri, matchString)) {
                result.push(...previewItems);
            }
        }
        return result;
    }
    private updatePreviewItemsInSubscription = debounceByInput(
        (uri: vscode.Uri): void => {
            for (const otherPreview of this.getPreviewItemsNeedsUpdate(uri.toString())) {
                if (uri.toString() === otherPreview.uri.toString()) {
                    continue;
                }
                const otherDocument = getDocumentByUri(otherPreview.uri);
                if (otherDocument) {
                    otherPreview.onDocumentChange(otherDocument);
                }
            }
        },
        uri => uri.toString(),
        1000,
        { trailing: true });
    private updatePreviewItem = debounceByInput(
        (previewItem: PreviewBase, document: vscode.TextDocument) => {
            if (!previewItem.isDisposed) {
                previewItem.onDocumentChange(document);
            }
        },
        (preview) => preview.uri.toString(),
        1000,
        { trailing: true });
}
export const previewManager = new PreviewManager();
```

## File: src/previewdef/technology/contentbuilder.ts
```typescript
import * as vscode from 'vscode';
import { localize } from '../../util/i18n';
import { Technology, TechnologyTree, TechnologyFolder } from './schema';
import { getSpriteByGfxName, Sprite } from '../../util/image/imagecache';
import { arrayToMap, forceError, UserError } from '../../util/common';
import { HOIPartial } from '../../hoiformat/schema';
import { renderContainerWindow, renderContainerWindowChildren } from '../../util/hoi4gui/containerwindow';
import { ParentInfo, RenderCommonOptions } from '../../util/hoi4gui/common';
import { renderGridBox, GridBoxItem, GridBoxConnection, GridBoxConnectionItem } from '../../util/hoi4gui/gridbox';
import { renderInstantTextBox } from '../../util/hoi4gui/instanttextbox';
import { renderIcon } from '../../util/hoi4gui/icon';
import { html, htmlEscape } from '../../util/html';
import { ContainerWindowType, GridBoxType, IconType, InstantTextBoxType, Format } from '../../hoiformat/gui';
import { TechnologyTreeLoader, TechnologyTreeLoaderResult } from './loader';
import { LoaderSession } from '../../util/loader/loader';
import { debug } from '../../util/debug';
import { flatMap, sumBy, min, flatten, chain, uniq } from 'lodash';
import { StyleTable } from '../../util/styletable';
import { RenderNodeCommonOptions } from '../../util/hoi4gui/nodecommon';
import { getLocalisedTextQuick } from "../../util/localisationIndex";
import { localisationIndex } from "../../util/featureflags";
const techTreeViewName = 'countrytechtreeview';
const doctrineTreeViewName = 'countrydoctrineview';
export async function renderTechnologyFile(loader: TechnologyTreeLoader, uri: vscode.Uri, webview: vscode.Webview): Promise<string> {
    const setPreviewFileUriScript = { content: `window.previewedFileUri = "${uri.toString()}";` };
    try {
        const session = new LoaderSession(false);
        const loadResult = await loader.load(session);
        const loadedLoaders = Array.from((session as any).loadedLoader).map<string>(v => (v as any).toString());
        debug('Loader session tech tree', loadedLoaders);
        const technologyTrees = loadResult.result.technologyTrees;
        const folders = uniq(technologyTrees.map(tt => tt.folder));
        if (folders.length === 0) {
            const baseContent = localize('techtree.notechtree', 'No technology tree.');
            return html(webview, baseContent, [ setPreviewFileUriScript ], []);
        }
        const styleTable = new StyleTable();
        const baseContent = await renderTechnologyFolders(technologyTrees, folders, styleTable, loadResult.result);
        return html(
            webview,
            baseContent,
            [
                setPreviewFileUriScript,
                'common.js',
                'techtree.js',
            ],
            [
                'common.css',
                'codicon.css',
                styleTable,
            ],
        );
    } catch (e) {
        const baseContent = `${localize('error', 'Error')}: <br/>  <pre>${htmlEscape(forceError(e).toString())}</pre>`;
        return html(webview, baseContent, [ setPreviewFileUriScript ], []);
    }
}
async function renderTechnologyFolders(technologyTrees: TechnologyTree[], folders: string[], styleTable: StyleTable, loadResult: TechnologyTreeLoaderResult): Promise<string> {
    const guiFiles = loadResult.guiFiles.map(f => f.file);
    const guiTypes = flatMap(loadResult.guiFiles, f => f.data.guitypes);
    const containerWindowTypes = flatMap(guiTypes, t => t.containerwindowtype);
    const techTreeViews = containerWindowTypes.filter(c => c.name?.toLowerCase() === techTreeViewName || c.name?.toLowerCase() === doctrineTreeViewName);
    if (techTreeViews.length === 0) {
        throw new UserError(localize('techtree.cantfindviewin', "Can't find {0} in {1}.", techTreeViewName + "," + doctrineTreeViewName, guiFiles));
    }
    const gfxFiles = loadResult.gfxFiles;
    const techFolders = (await Promise.all(folders.map(folder => renderTechnologyFolder(technologyTrees, folder, techTreeViews, containerWindowTypes, styleTable, guiFiles, gfxFiles)))).join('');
    return `
    ${await renderFolderSelector(folders, styleTable)}
    <div
    id="dragger"
    class="${styleTable.oneTimeStyle('dragger', () => `
        width: 100vw;
        height: 100vh;
        position: fixed;
        left:0;
        top:0;
        background:#101010;
    `)}">
    </div>
    <div
    class="${styleTable.oneTimeStyle('mainContent', () => `
        position: absolute;
        left: 0;
        top: 0;
        pointer-events: none;
        margin-top: 40px;
    `)}">
        ${techFolders}
    </div>`;
}
async function renderFolderSelector(folders: string[], styleTable: StyleTable): Promise<string> {
    const folderOptions = await Promise.all(
        folders.map(async (folder) => {
            const localizedText = localisationIndex ? `${await getLocalisedTextQuick(folder)} (${folder})` : folder;
            return `<option value="techfolder_${folder}">${localizedText}</option>`;
        })
    );
    return `<div
    class="${styleTable.oneTimeStyle('folderSelectorBar', () => `
        position: fixed;
        padding-top: 10px;
        padding-left: 20px;
        width: 100%;
        height: 30px;
        top: 0;
        left: 0;
        background: var(--vscode-editor-background);
        border-bottom: 1px solid var(--vscode-panel-border);
        z-index: 10;
    `)}">
        <label for="folderSelector" class="${styleTable.oneTimeStyle('folderSelectorLabel', () => `margin-right:5px`)}">
            ${localize('techtree.techfolder', 'Technology folder: ')}
        </label>
        <div class="select-container">
            <select
                id="folderSelector"
                type="text"
                class="${styleTable.oneTimeStyle('folderSelector', () => `min-width:200px`)}"
            >
                ${folderOptions.join('')}
            </select>
        </div>
    </div>`;
}
async function renderTechnologyFolder(
    technologyTrees: TechnologyTree[],
    folder: string,
    techTreeViews: HOIPartial<ContainerWindowType>[],
    allContainerWindowTypes: HOIPartial<ContainerWindowType>[],
    styleTable: StyleTable,
    guiFiles: string[],
    gfxFiles: string[],
): Promise<string> {
    const folderTreeView = flatMap(techTreeViews, tv => tv.containerwindowtype).find(c => c.name === folder);
    let children: string;
    if (!folderTreeView) {
        children = `<div>${localize('techtree.cantfindtechfolderin', "Can't find technology folder {0} in {1}.", folder, guiFiles)}</div>`;
    } else {
        const folderItem = allContainerWindowTypes.find(c => c.name === `techtree_${folder}_item`);
        const folderSmallItem = allContainerWindowTypes.find(c => c.name === `techtree_${folder}_small_item`) || folderItem;
        const lineItem = allContainerWindowTypes.find(c => c.name === 'techtree_line_item');
        const xorItem = allContainerWindowTypes.find(c => c.name === 'techtree_xor_item');
        const commonOptions: RenderNodeCommonOptions = {
            getSprite: defaultGetSprite(gfxFiles),
            styleTable,
        };
        children = await renderContainerWindowChildren(
            folderTreeView,
            {
                size: { width: 1920, height: 1080 },
                orientation: 'upper_left',
            },
            {
                ...commonOptions,
                onRenderChild: async (type, child, parentInfo) => {
                    if (type === 'gridbox') {
                        const tree = technologyTrees.find(t => t.startTechnology + '_tree' === child.name);
                        if (tree) {
                            const gridboxType = child as HOIPartial<GridBoxType>;
                            return await renderTechnologyTreeGridBox(tree, gridboxType, folder, folderItem, folderSmallItem, lineItem, xorItem, parentInfo, commonOptions, guiFiles, gfxFiles);
                        }
                    }
                    return undefined;
                },
            }
        );
    }
    return `<div
        id="techfolder_${folder}"
        class="techfolder ${styleTable.style('displayNone', () => `display:none;`)}"
    >
        ${children}
    </div>`;
}
async function renderTechnologyTreeGridBox(
    tree: TechnologyTree,
    gridboxType: HOIPartial<GridBoxType>,
    folder: string,
    folderItem: HOIPartial<ContainerWindowType> | undefined,
    folderSmallItem: HOIPartial<ContainerWindowType> | undefined,
    lineItem: HOIPartial<ContainerWindowType> | undefined,
    xorItem: HOIPartial<ContainerWindowType> | undefined,
    parentInfo: ParentInfo,
    commonOptions: RenderCommonOptions,
    guiFiles: string[],
    gfxFiles: string[],
): Promise<string> {
    const xorJointKey = "#xorJoint#";
    const treeMap = arrayToMap(tree.technologies, 'id');
    const technologiesInFolder = tree.technologies.filter(t => folder in t.folders);
    const technologyXorJoints = technologiesInFolder
        .map<[Technology, Technology[][] | undefined]>(tech => [tech, findXorGroups(treeMap, tech, folder)])
        .filter((t): t is [Technology, Technology[][]] => t[1] !== undefined && t[1].length > 0)
        .map<[Technology, Technology[], Technology[][]]>(([t, tgs]) => [t, tgs[0], tgs.slice(1)]);
    const technologyXorJointsMap: Record<string, [Technology[], Technology[][]]> = {};
    technologyXorJoints.forEach(([t, tl, tgs]) => technologyXorJointsMap[t.id] = [tl, tgs]);
    const technologyItemsArray = technologiesInFolder.map<GridBoxItem>(t => {
        const jointsItem = technologyXorJointsMap[t.id];
        const connections: GridBoxConnection[] = [];
        let leadsToTechs: Technology[];
        if (jointsItem) {
            const [base, joints] = jointsItem;
            leadsToTechs = base;
            connections.push(...joints.map<GridBoxConnection>((_, i) => ({ target: xorJointKey + t.id + i, style: "1px solid #88aaff", targetType: "child" })));
        } else {
            leadsToTechs = t.leadsToTechs.map(t => treeMap[t]).filter(t => t !== undefined);
        }
        connections.push(...leadsToTechs.map<GridBoxConnection>(c => {
            if (c.leadsToTechs.includes(t.id)) {
                return { target: c.id, style: "1px dashed #88aaff", targetType: "related" };
            }
            return { target: c.id, style: "1px solid #88aaff", targetType: "child" };
        }));
        return {
            id: t.id,
            gridX: t.folders[folder].x,
            gridY: t.folders[folder].y,
            connections,
        };
    });
    const technologyXorJointsItemsArray = flatMap(technologyXorJoints, ([t, _, tgs]) =>
        tgs.map<GridBoxItem>((tl, i) => ({
            id: xorJointKey + t.id + i,
            gridX: Math.round(sumBy(tl, t => t.folders[folder].x) / tl.length),
            gridY: (min(tl.map(t1 => t1.folders[folder].y)) ?? 0) - 1,
            isJoint: true,
            connections: tl.map<GridBoxConnection>(c => {
                return { target: c.id, style: "1px solid red", targetType: "child" };
            }),
        }))
    );
    return await renderGridBox(gridboxType, parentInfo, {
        ...commonOptions,
        items: arrayToMap([...technologyItemsArray, ...technologyXorJointsItemsArray], 'id'),
        lineRenderMode: lineItem ? 'control' : 'line',
        onRenderItem: async (item, parent) => {
            if (item.id.startsWith(xorJointKey)) {
                if (xorItem === undefined) {
                    return '';
                }
                return await renderXorItem(xorItem, gridboxType.format?._name ?? 'up', parent, commonOptions);
            } else {
                const technology = treeMap[item.id];
                const technologyItem = technology.enableEquipments ? folderItem : folderSmallItem;
                return await renderTechnology(technologyItem, technology, technology.folders[folder], parent, commonOptions, guiFiles, gfxFiles);
            }
        },
        onRenderLineBox: async (item, parent) => {
            if (!lineItem) {
                return '';
            }
            return await renderLineItem(lineItem, item, parent, commonOptions);
        },
    });
}
function findXorGroups(treeMap: Record<string, Technology>, technology: Technology, folder: string): Technology[][] | undefined {
    const techChildren = technology.leadsToTechs
        .map(techName => treeMap[techName])
        .filter(tech => tech && folder in technology.folders);
    const xorGroupMap: Record<string, Technology[]> = {};
    for (const xorChild of techChildren) {
        const xorTechs = xorChild.xor
            .map(techName => treeMap[techName])
            .filter(tech => tech && folder in technology.folders && tech !== xorChild && tech.xor.includes(xorChild.id));
        if (xorTechs.length === 0) {
            continue;
        }
        const groups = xorTechs.map(tech => xorGroupMap[tech.id]).filter((v, i, a) => v !== undefined && i === a.indexOf(v));
        const bigGroup = flatten(groups).concat([ xorChild ]);
        bigGroup.forEach(tech => xorGroupMap[tech.id] = bigGroup);
    }
    const xorGroups = Object.values(xorGroupMap).filter((v, i, a) => i === a.indexOf(v));
    if (xorGroups.length === 0) {
        return undefined;
    }
    const nonXors = techChildren.filter(tech => !xorGroups.some(group => group.includes(tech)));
    return [nonXors, ...xorGroups];
}
async function renderXorItem(xorItem: HOIPartial<ContainerWindowType>, format: Format['_name'], parentInfo: ParentInfo, commonOptions: RenderCommonOptions): Promise<string> {
    const upDownDirection = format === 'left' || format === 'right';
    return await renderContainerWindow(xorItem, parentInfo, {
        ...commonOptions,
        onRenderChild: async (type, child, parent) => {
            if (type === 'icon') {
                const icon = child as HOIPartial<IconType>;
                const childName = child.name?.toLowerCase();
                if (childName === 'first') {
                    return await renderIcon({...icon, spritetype: upDownDirection ? 'GFX_techtree_xor_up' : 'GFX_techtree_xor_left' },
                        parent, commonOptions);
                }
                if (childName === 'second') {
                    return await renderIcon({ ...icon, spritetype: upDownDirection ? 'GFX_techtree_xor_down' : 'GFX_techtree_xor_right' },
                        parent, commonOptions);
                }
            }
            return undefined;
        },
    });
}
async function renderTechnology(
    item: HOIPartial<ContainerWindowType> | undefined,
    technology: Technology,
    folder: TechnologyFolder,
    parentInfo: ParentInfo,
    commonOptions: RenderCommonOptions,
    guiFiles: string[],
    gfxFiles: string[],
): Promise<string> {
    if (!item) {
        return `<div>${localize('techtree.cantfindtechitemin', "Can't find containerwindowtype \"{0}\" in {1}", `techtree_${folder.name}_item`, guiFiles)}</div>`;
    }
    const subSlotRegex = /^sub_technology_slot_(\d)$/;
    const containerWindow = await renderContainerWindow(item, parentInfo, {
        ...commonOptions,
        noSize: true,
        getSprite: (sprite, callerType, callerName) => getTechnologySprite(sprite, technology, folder.name, callerType, callerName, gfxFiles),
        onRenderChild: async (type, child, parentInfo) => {
            if (type === 'icon' && child.name === 'bonus_icon') {
                return '';
            }
            if (type === 'instanttextbox') {
                const text = child as HOIPartial<InstantTextBoxType>;
                const childname = child.name?.toLowerCase();
                if (childname === 'bonus') {
                    return '';
                } else if (childname === 'name') {
                    return await renderInstantTextBox({ ...text, text: technology.id }, parentInfo, commonOptions);
                }
            }
            if (type === 'containerwindow' && child.name) {
                const subSlot = subSlotRegex.exec(child.name.toLowerCase());
                if (subSlot) {
                    const slotId = parseInt(subSlot[1]);
                    return await renderSubTechnology(child as HOIPartial<ContainerWindowType>, folder, technology.subTechnologies[slotId], parentInfo, commonOptions, gfxFiles);
                }
            }
            return undefined;
        }
    });
    return `<div
        start="${technology.token?.start}"
        end="${technology.token?.end}"
        title="${technology.id}${localisationIndex ? `\n${await getLocalisedTextQuick(technology.id)}` : ''}\n(${folder.x}, ${folder.y})"
        class="
            navigator 
            ${commonOptions.styleTable.style('navigator', () => `
                position: absolute;
                left: 0;
                top: 0;
                width: 0;
                height: 0;
                cursor: pointer;
                pointer-events: auto;
            `)}
        ">
            ${containerWindow}
        </div>`;
}
async function getTechnologySprite(sprite: string, technology: Technology, folder: string, callerType: 'bg' | 'icon', callerName: string | undefined, gfxFiles: string[]): Promise<Sprite | undefined> {
    let imageTryList: string[] = [sprite];
    if (sprite === 'GFX_technology_unavailable_item_bg' && callerType === 'bg') {
        imageTryList = technology.enableEquipments ? [
            `GFX_technology_${folder}_available_item_bg`,
            `GFX_technology_available_item_bg`,
        ] : [
            `GFX_technology_${folder}_small_available_item_bg`,
            `GFX_technology_small_available_item_bg`,
            `GFX_technology_${folder}_available_item_bg`,
            `GFX_technology_available_item_bg`,
        ];
    } else if (sprite === 'GFX_technology_medium' && callerType === 'icon') {
        return await getTechnologyIcon(`GFX_${technology.id}_medium`, gfxFiles, 'GFX_technology_medium');
    }
    return await getSpriteFromTryList(imageTryList, gfxFiles);
}
async function renderSubTechnology(
    containerWindow: HOIPartial<ContainerWindowType>,
    folder: TechnologyFolder,
    subTechnology: Technology | undefined,
    parentInfo: ParentInfo,
    commonOptions: RenderCommonOptions,
    gfxFiles: string[],
): Promise<string> {
    if (subTechnology === undefined) {
        return '';
    }
    const containerWindowResult = await renderContainerWindow(containerWindow, parentInfo, {
        ...commonOptions,
        getSprite: (sprite, callerType, callerName) => {
            let imageTryList = [sprite];
            if (callerType === 'bg' && callerName === containerWindow.background?.name) {
                imageTryList = [
                    `GFX_subtechnology_${folder}_available_item_bg`,
                    `GFX_subtechnology_available_item_bg`,
                ];
            } else if (callerType === 'icon' && callerName?.toLowerCase() === 'picture') {
                return getTechnologyIcon(sprite, gfxFiles);
            }
            return getSpriteFromTryList(imageTryList, gfxFiles);
        }
    });
    return `<div
        start="${subTechnology.token?.start}"
        end="${subTechnology.token?.end}"
        title="${subTechnology.id}${localisationIndex ? `\n${await getLocalisedTextQuick(subTechnology.id)}` : ''}\n(${folder.x}, ${folder.y})"
        class="
            navigator
            ${commonOptions.styleTable.style('navigator', () => `
                position: absolute;
                left: 0;
                top: 0;
                width: 0;
                height: p;
                cursor: pointer;
                pointer-events: auto;
            `)}
        ">
            ${containerWindowResult}
        </div>`;
}
const centerNameTable = [
    undefined, undefined, undefined, 'bottom_left',
    undefined, undefined, 'top_left', 'right',
    undefined, 'bottom_right', undefined, 'up',
    'top_right', 'left', 'down', 'all',
];
async function renderLineItem(
    lineItem: HOIPartial<ContainerWindowType>,
    item: GridBoxConnectionItem,
    parentInfo: ParentInfo,
    commonOptions: RenderCommonOptions,
): Promise<string> {
    const centerNameCode = (item.up ? 1 : 0) | (item.right ? 2 : 0) | (item.down ? 4 : 0) | (item.left ? 8 : 0);
    const centerName: string | undefined = centerNameTable[centerNameCode];
    const directionalItems = [ item.up, item.down, item.right, item.left ];
    const inSet = chain(directionalItems).compact().flatMap(c => Object.keys(c.in)).uniq().value();
    const outSet = chain(directionalItems).compact().flatMap(c => Object.keys(c.out)).uniq().value();
    let sameInOut = false;
    if (inSet.length === outSet.length) {
        sameInOut = true;
        for (const inItem of inSet) {
            if (!outSet.includes(inItem)) {
                sameInOut = false;
                break;
            }
        }
    }
    const containerWindow = await renderContainerWindow(lineItem, parentInfo, {
        ...commonOptions,
        noSize: true,
        onRenderChild: async (type, child, parent) => {
            if (type === 'icon') {
                const icon = child as HOIPartial<IconType>;
                const childName = child.name?.toLowerCase();
                if (childName === 'left' || childName === 'right' || childName === 'up' || childName === 'down') {
                    if (item[childName]) {
                        return await renderIcon({
                            ...icon,
                            spritetype: `GFX_techtree_line_${childName}_${sameInOut ? 'dot_' : ''}states`,
                            frame: 2,
                        }, parent, commonOptions);
                    } else {
                        return '';
                    }
                } else if (childName === 'center') {
                    if (centerName && !sameInOut) {
                        return await renderIcon({
                            ...icon,
                            spritetype: `GFX_techline_center_${centerName}_states`, frame: 2
                        }, parent, commonOptions);
                    } else {
                        return '';
                    }
                }
            }
            return undefined;
        },
    });
    return containerWindow;
}
async function getSpriteFromTryList(tryList: string[], gfxFiles: string[]): Promise<Sprite | undefined> {
    let background: Sprite | undefined = undefined;
    for (const imageName of tryList) {
        background = await getSpriteByGfxName(imageName, gfxFiles);
        if (background !== undefined) {
            break;
        }
    }
    return background;
}
async function getTechnologyIcon(name: string, gfxFiles: string[], defaultIcon?: string): Promise<Sprite | undefined> {
    const result = await getSpriteByGfxName(name, gfxFiles);
    if (result !== undefined || !defaultIcon) {
        return result;
    }
    return await getSpriteByGfxName(defaultIcon, gfxFiles);
}
function defaultGetSprite(gfxFiles: string[]) {
    return (sprite: string) => {
        return getSpriteByGfxName(sprite, gfxFiles);
    };
}
```

## File: src/previewdef/worldmap/definitions.ts
```typescript
import { Token } from "../../hoiformat/hoiparser";
import { Warning } from "../../util/common";
export interface WorldMapData {
    width: number;
    height: number;
    provinces: (Province | undefined | null)[]; // count of provinces
    states: (State | undefined | null)[];
    countries: Country[];
    strategicRegions: (StrategicRegion | undefined | null)[];
    supplyAreas: (SupplyArea | undefined | null)[];
    railways: (Railway | undefined | null)[];
    supplyNodes: (SupplyNode | undefined | null)[];
    provincesCount: number;
    statesCount: number;
    countriesCount: number;
    strategicRegionsCount: number;
    supplyAreasCount: number;
    railwaysCount: number;
    supplyNodesCount: number;
    badProvincesCount: number; // will be * -1
    badStatesCount: number; // will be * -1;
    badStrategicRegionsCount: number;
    badSupplyAreasCount: number;
    continents: string[];
    terrains: Terrain[];
    resources: Resource[];
    rivers: River[];
    warnings: WorldMapWarning[];
}
export interface ProvinceBmp {
    width: number;
    height: number;
    colorByPosition: number[]; // width * height
    colorToProvince: Record<number, ProvinceGraph>;
    provinces: ProvinceGraph[];
}
export interface ProvinceMap {
    width: number;
    height: number;
    colorByPosition: number[]; // width * height
    provinces: (Province | undefined | null)[]; // count of provinces
    badProvincesCount: number;
    continents: string[];
    terrains: Terrain[];
    rivers: River[];
}
export interface ProvinceGraph extends Region {
    color: number;
    coverZones: Zone[];
    edges: ProvinceEdgeGraph[];
}
export interface ProvinceDefinition {
    id: number;
    color: number;
    type: string;
    coastal: boolean;
    terrain: string;
    continent: number;
}
export type Province = Omit<ProvinceGraph & ProvinceDefinition, 'edges'> & {
    edges: ProvinceEdge[];
};
export interface ProvinceEdgeGraph {
    toColor: number;
    path: Point[][];
}
export interface ProvinceEdgeAdjacency {
    from: number;
    to: number;
    through?: number;
    type: 'impassable' | string;
    start?: Point;
    stop?: Point;
    rule?: string;
    row: string[];
}
export type ProvinceEdge = Omit<ProvinceEdgeGraph & ProvinceEdgeAdjacency, 'from' | 'row' | 'toColor'>;
export interface State extends Region, TokenInFile {
    id: number;
    name: string;
    manpower: number;
    category: string;
    owner: string | undefined;
    provinces: number[];
    cores: string[];
    impassable: boolean;
    victoryPoints: Record<number, number | undefined>;
    resources: Record<string, number | undefined>;
}
export interface Railway {
    provinces: number[];
    level: number;
}
export interface SupplyNode {
    province: number;
    level: number;
}
export interface WorldMapWarning extends Warning<WorldMapWarningSource[]> {
    relatedFiles: string[];
}
export type WorldMapWarningSource = WarningSourceProvince | WarningSourceIdOnly | WarningSourceName | WarningRiver;
interface WarningSourceBase {
    type: string;
}
interface WarningSourceProvince extends WarningSourceBase {
    type: 'province';
    id: number | null;
    color: number;
}
interface WarningSourceIdOnly extends WarningSourceBase {
    type: 'state' | 'strategicregion' | 'supplyarea' | 'railway' | 'supplynode';
    id: number;
}
interface WarningSourceName extends WarningSourceBase {
    type: 'statecategory';
    name: string;
}
interface WarningRiver extends WarningSourceBase {
    type: 'river';
    name: string;
    index: number;
}
export interface Country {
    tag: string;
    color: number;
}
export interface Terrain {
    name: string;
    color: number;
    isNaval: boolean;
    file: string;
}
export interface Resource {
    name: string;
    iconFrame: number;
    imageUri: string;
    file: string;
}
export interface StrategicRegion extends Region, TokenInFile {
    id: number;
    name: string;
    provinces: number[];
    navalTerrain: string | null;
}
export interface SupplyArea extends Region, TokenInFile {
    id: number;
    name: string;
    value: number;
    states: number[];
}
export interface StateCategory {
    name: string;
    color: number;
    file: string;
}
export interface RiverBmp {
    width: number;
    height: number;
    rivers: River[];
}
export interface River {
    colors: Record<number, number>;
    ends: number[];
    boundingBox: Zone;
}
export interface Point {
    x: number;
    y: number;
}
export interface Zone {
    x: number;
    y: number;
    w: number;
    h: number;
}
export interface Region {
    boundingBox: Zone;
    centerOfMass: Point;
    mass: number;
}
export interface TokenInFile {
    file: string;
    token: Token | null;
}
export type WorldMapMessage = LoadedMessage | RequestMapItemMessage | MapItemMessage | ErrorMessage | ProgressMessage | ProvinceMapSummaryMessage | OpenFileMessage | ExportMapMessage;
export interface LoadedMessage {
    command: 'loaded';
    force: boolean;
}
export interface RequestMapItemMessage {
    command: 'requestprovinces' | 'requeststates' | 'requestcountries' | 'requeststrategicregions' | 'requestsupplyareas' | 'requestrailways' | 'requestsupplynodes';
    start: number;
    end: number;
}
export interface MapItemMessage {
    command: 'provinces' | 'states' | 'countries' | 'warnings' | 'continents' | 'terrains' | 'strategicregions' | 'supplyareas' | 'railways' | 'supplynodes' | 'resources';
    data: string;
    start: number;
    end: number;
}
export interface ErrorMessage {
    command: 'error';
    data: string;
}
export interface ProgressMessage {
    command: 'progress';
    data: string;
}
export interface ProvinceMapSummaryMessage {
    command: 'provincemapsummary';
    data: WorldMapData;
}
export interface OpenFileMessage {
    command: 'openfile';
    type: 'state' | 'strategicregion' | 'supplyarea';
    file: string;
    start: number | undefined;
    end: number | undefined;
}
export interface ExportMapMessage {
    command: 'exportmap' | 'requestexportmap';
    dataUrl?: string;
}
export type ProgressReporter = (progress: string) => Promise<void>;
export type MapLoaderExtra = { warnings: WorldMapWarning[] };
```

## File: src/previewdef/worldmap/worldmap.ts
```typescript
import * as vscode from 'vscode';
import worldmapview from './worldmapview.html';
import worldmapviewstyles from './worldmapview.css';
import { localize, localizeText, i18nTableAsScript } from '../../util/i18n';
import { html } from '../../util/html';
import { error, debug } from '../../util/debug';
import { WorldMapMessage, ProgressReporter, WorldMapData, MapItemMessage, RequestMapItemMessage } from './definitions';
import { matchPathEnd } from '../../util/nodecommon';
import { writeFile, mkdirs, getDocumentByUri, dirUri } from '../../util/vsccommon';
import { slice, debounceByInput, forceError } from '../../util/common';
import { getFilePathFromMod, getHoiOpenedFileOriginalUri, readFileFromModOrHOI4 } from '../../util/fileloader';
import { WorldMapLoader } from './loader/worldmaploader';
import { isEqual } from 'lodash';
import { LoaderSession } from '../../util/loader/loader';
import { TelemetryMessage, sendByMessage } from '../../util/telemetry';
import { getConfiguration } from '../../util/vsccommon';
export class WorldMap {
    public panel: vscode.WebviewPanel | undefined;
    private worldMapLoader: WorldMapLoader;
    private worldMapDependencies: string[] | undefined;
    private cachedWorldMap: WorldMapData | undefined;
    private lastRequestedExportUri: vscode.Uri | undefined;
    constructor(panel: vscode.WebviewPanel) {
        this.panel = panel;
        this.worldMapLoader = new WorldMapLoader();
        this.worldMapLoader.onProgress(this.progressReporter);
    }
    public initialize(): void {
        if (!this.panel) {
            return;
        }
        const webview = this.panel.webview;
        webview.html = this.renderWorldMap(webview);
        webview.onDidReceiveMessage((msg) => this.onMessage(msg));
    }
    public onDocumentChange = debounceByInput(
        (uri: vscode.Uri) => {
            if (!this.worldMapDependencies) {
                return;
            }
            if (this.worldMapDependencies.some(d => matchPathEnd(uri.toString(), d.split('/')))) {
                this.sendProvinceMapSummaryToWebview(false);
            }
        },
        uri => uri.toString(),
        1000,
        { trailing: true });
    public dispose() {
        this.panel = undefined;
    }
    private renderWorldMap(webview: vscode.Webview): string {
        return html(
            webview,
            localizeText(worldmapview),
            [
                { content: i18nTableAsScript() },
                { content: 'window.__enableSupplyArea = ' + getConfiguration().enableSupplyArea + ';' },
                'common.js',
                'worldmap.js'
            ],
            ['common.css', 'codicon.css', { content: worldmapviewstyles }]
        );
    }
    private async onMessage(msg: WorldMapMessage | TelemetryMessage): Promise<void> {
        try {
            debug('worldmap message ' + JSON.stringify(msg));
            switch (msg.command) {
                case 'loaded':
                    await this.sendProvinceMapSummaryToWebview(msg.force);
                    break;
                case 'requestprovinces':
                    await this.sendMapData('provinces', msg, (await this.worldMapLoader.getWorldMap()).provinces);
                    break;
                case 'requeststates':
                    await this.sendMapData('states', msg, (await this.worldMapLoader.getWorldMap()).states);
                    break;
                case 'requestcountries':
                    await this.sendMapData('countries', msg, (await this.worldMapLoader.getWorldMap()).countries);
                    break;
                case 'requeststrategicregions':
                    await this.sendMapData('strategicregions', msg, (await this.worldMapLoader.getWorldMap()).strategicRegions);
                    break;
                case 'requestsupplyareas':
                    await this.sendMapData('supplyareas', msg, (await this.worldMapLoader.getWorldMap()).supplyAreas);
                    break;
                case 'requestrailways':
                    await this.sendMapData('railways', msg, (await this.worldMapLoader.getWorldMap()).railways);
                    break;
                case 'requestsupplynodes':
                    await this.sendMapData('supplynodes', msg, (await this.worldMapLoader.getWorldMap()).supplyNodes);
                    break;
                case 'openfile':
                    await this.openFile(msg.file, msg.type, msg.start, msg.end);
                    break;
                case 'telemetry':
                    await sendByMessage(msg);
                    break;
                case 'requestexportmap':
                    await this.requestExportMap();
                    break;
                case 'exportmap':
                    await this.exportMap(msg.dataUrl);
                    break;
            }
        } catch (e) {
            error(e);
        }
    }
    private sendMapData(command: MapItemMessage['command'], msg: RequestMapItemMessage, value: unknown[]) {
        return this.postMessageToWebview({
            command: command,
            data: JSON.stringify(slice(value, msg.start, msg.end)),
            start: msg.start,
            end: msg.end,
        } as WorldMapMessage);
    }
    private progressReporter: ProgressReporter = async (progress: string) => {
        debug('Progress:', progress);
        await this.postMessageToWebview({
            command: 'progress',
            data: progress,
        } as WorldMapMessage);
    };
    private async sendProvinceMapSummaryToWebview(force: boolean) {
        try {
            this.worldMapLoader.shallowForceReload();
            const oldCachedWorldMap = this.cachedWorldMap;
            const loaderSession = new LoaderSession(force, () => this.panel === undefined);
            const { result: worldMap, dependencies } = await this.worldMapLoader.load(loaderSession);
            this.worldMapDependencies = dependencies;
            this.cachedWorldMap = worldMap;
            if (!force && oldCachedWorldMap && await this.sendDifferences(oldCachedWorldMap, worldMap)) {
                return;
            }
            const summary: WorldMapData = {
                ...worldMap,
                provinces: [],
                states: [],
                countries: [],
                strategicRegions: [],
                supplyAreas: [],
            };
            await this.postMessageToWebview({
                command: 'provincemapsummary',
                data: summary,
            } as WorldMapMessage);
        } catch (e) {
            error(e);
            await this.postMessageToWebview({
                command: 'error',
                data: localize('worldmap.failedtoload', 'Failed to load world map: {0}.', forceError(e).toString()),
            } as WorldMapMessage);
        }
    }
    private async openFile(file: string, type: 'state' | 'strategicregion' | 'supplyarea', start: number | undefined, end: number | undefined): Promise<void> {
        // TODO duplicate with previewbase.ts
        const filePathInMod = await getFilePathFromMod(file);
        if (filePathInMod !== undefined) {
            const filePathInModWithoutOpened = getHoiOpenedFileOriginalUri(filePathInMod);
            const document = getDocumentByUri(filePathInModWithoutOpened) ?? await vscode.workspace.openTextDocument(filePathInModWithoutOpened);
            await vscode.window.showTextDocument(document, {
                selection: start !== undefined && end !== undefined ? new vscode.Range(document.positionAt(start), document.positionAt(end)) : undefined,
            });
            return;
        }
        const typeName = localize('worldmap.openfiletype.' + type as any, type);
        if (!vscode.workspace.workspaceFolders?.length) {
            await vscode.window.showErrorMessage(localize('worldmap.mustopenafolder', 'Must open a folder before opening {0} file.', typeName));
            return;
        }
        let targetFolderUri = vscode.workspace.workspaceFolders[0].uri;
        if (vscode.workspace.workspaceFolders.length >= 1) {
            const folder = await vscode.window.showWorkspaceFolderPick({ placeHolder: localize('worldmap.selectafolder', 'Select a folder to copy {0} file', typeName) });
            if (!folder) {
                return;
            }
            targetFolderUri = folder.uri;
        }
        try {
            const [buffer] = await readFileFromModOrHOI4(file);
            const targetPath = vscode.Uri.joinPath(targetFolderUri, file);
            await mkdirs(dirUri(targetPath));
            await writeFile(targetPath, buffer);
            const document = await vscode.workspace.openTextDocument(targetPath);
            await vscode.window.showTextDocument(document, {
                selection: start !== undefined && end !== undefined ? new vscode.Range(document.positionAt(start), document.positionAt(end)) : undefined,
            });
        } catch (e) {
            await vscode.window.showErrorMessage(localize('worldmap.failedtoopenstate', 'Failed to open {0} file: {1}.', typeName, forceError(e).toString()));
        }
    }
    private async sendDifferences(cachedWorldMap: WorldMapData, worldMap: WorldMapData): Promise<boolean> {
        await this.progressReporter(localize('worldmap.progress.comparing', 'Comparing changes...'));
        const changeMessages: WorldMapMessage[] = [];
        if ((['width', 'height', 'provincesCount', 'statesCount', 'countriesCount', 'strategicRegionsCount', 'supplyAreasCount',
            'railwaysCount', 'supplyNodesCount',
            'badProvincesCount', 'badStatesCount', 'badStrategicRegionsCount', 'badSupplyAreasCount'] as (keyof WorldMapData)[])
            .some(k => !isEqual(cachedWorldMap[k], worldMap[k]))) {
            return false;
        }
        if (!isEqual(cachedWorldMap.warnings, worldMap.warnings)) {
            changeMessages.push({ command: 'warnings', data: JSON.stringify(worldMap.warnings), start: 0, end: 0 });
        }
        if (!isEqual(cachedWorldMap.continents, worldMap.continents)) {
            changeMessages.push({ command: 'continents', data: JSON.stringify(worldMap.continents), start: 0, end: 0 });
        }
        if (!isEqual(cachedWorldMap.terrains, worldMap.terrains)) {
            changeMessages.push({ command: 'terrains', data: JSON.stringify(worldMap.terrains), start: 0, end: 0 });
        }
        if (!isEqual(cachedWorldMap.resources, worldMap.resources)) {
            changeMessages.push({ command: 'resources', data: JSON.stringify(worldMap.resources), start: 0, end: 0 });
        }
        if (!this.fillMessageForItem(changeMessages, worldMap.provinces, cachedWorldMap.provinces, 'provinces', worldMap.badProvincesCount, worldMap.provincesCount)) {
            return false;
        }
        if (!this.fillMessageForItem(changeMessages, worldMap.states, cachedWorldMap.states, 'states', worldMap.badStatesCount, worldMap.statesCount)) {
            return false;
        }
        if (!this.fillMessageForItem(changeMessages, worldMap.countries, cachedWorldMap.countries, 'countries', 0, worldMap.countriesCount)) {
            return false;
        }
        if (!this.fillMessageForItem(changeMessages, worldMap.strategicRegions, cachedWorldMap.strategicRegions, 'strategicregions', worldMap.badStrategicRegionsCount, worldMap.strategicRegionsCount)) {
            return false;
        }
        if (!this.fillMessageForItem(changeMessages, worldMap.supplyAreas, cachedWorldMap.supplyAreas, 'supplyareas', worldMap.badSupplyAreasCount, worldMap.supplyAreasCount)) {
            return false;
        }
        if (!this.fillMessageForItem(changeMessages, worldMap.railways, cachedWorldMap.railways, 'railways', 0, worldMap.railwaysCount)) {
            return false;
        }
        if (!this.fillMessageForItem(changeMessages, worldMap.supplyNodes, cachedWorldMap.supplyNodes, 'supplynodes', 0, worldMap.supplyNodesCount)) {
            return false;
        }
        await this.progressReporter(localize('worldmap.progress.applying', 'Applying changes...'));
        for (const message of changeMessages) {
            await this.postMessageToWebview(message);
        }
        await this.progressReporter('');
        return true;
    }
    private fillMessageForItem(
        changeMessages: WorldMapMessage[],
        list: unknown[],
        cachedList: unknown[],
        command: MapItemMessage['command'],
        listStart: number,
        listEnd: number,
    ): boolean {
        const changeMessagesCountLimit = 30;
        const messageCountLimit = 300;
        let lastDifferenceStart: number | undefined = undefined;
        for (let i = listStart; i <= listEnd; i++) {
            if (i === listEnd || isEqual(list[i], cachedList[i])) {
                if (lastDifferenceStart !== undefined) {
                    changeMessages.push({
                        command,
                        data: JSON.stringify(slice(list, lastDifferenceStart, i)),
                        start: lastDifferenceStart,
                        end: i,
                    });
                    if (changeMessages.length > changeMessagesCountLimit) {
                        return false;
                    }
                    lastDifferenceStart = undefined;
                }
            } else {
                if (lastDifferenceStart === undefined) {
                    lastDifferenceStart = i;
                } else if (i - lastDifferenceStart >= messageCountLimit) {
                    changeMessages.push({
                        command,
                        data: JSON.stringify(slice(list, lastDifferenceStart, i)),
                        start: lastDifferenceStart,
                        end: i,
                    });
                    if (changeMessages.length > changeMessagesCountLimit) {
                        return false;
                    }
                    lastDifferenceStart = i;
                }
            }
        }
        return true;
    }
    private async postMessageToWebview(message: WorldMapMessage) {
        if (!this.panel) {
            return false;
        }
        return await this.panel.webview.postMessage(message);
    }
    private async requestExportMap() {
        const uri = await vscode.window.showSaveDialog({ filters: { [localize('pngfile', 'PNG file')]: ['png'] } });
        this.lastRequestedExportUri = uri;
        if (!uri) {
            return;
        }
        await this.postMessageToWebview({ command: 'requestexportmap' });
    }
    private async exportMap(dataUrl?: string) {
        const uri = this.lastRequestedExportUri;
        if (!uri) {
            return;
        }
        const prefix = 'data:image/png;base64,';
        if (!dataUrl || !dataUrl.startsWith(prefix)) {
            vscode.window.showErrorMessage(localize('worldmap.export.error.imgformat', 'Can\'t export world map: Image is not in correct format.'));
            return;
        }
        try {
            const base64 = dataUrl.substring(prefix.length);
            const buffer = Buffer.from(base64, 'base64');
            await writeFile(uri, buffer);
            vscode.window.showInformationMessage(localize('worldmap.export.success', 'Successfully exported world map.'));
        } catch (e) {
            error(e);
            vscode.window.showErrorMessage(localize('worldmap.export.error', 'Can\'t export world map: {0}.', e));
        }
    }
}
```

## File: src/util/fileloader.ts
```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import { PromiseCache } from './cache';
import { isSamePath } from './nodecommon';
import { getLastModifiedAsync, readDirFiles, isFile, isDirectory, readFile, readDir, isSameUri, fileOrUriStringToUri, ensureFileScheme, readDirFilesRecursively } from './vsccommon';
import { parseHoi4File } from '../hoiformat/hoiparser';
import { localize } from './i18n';
import { convertNodeToJson, SchemaDef, HOIPartial } from '../hoiformat/schema';
import { error } from './debug';
import { updateSelectedModFileStatus, workspaceModFilesCache } from './modfile';
import { getConfiguration, getDocumentByUri } from './vsccommon';
import { UserError } from './common';
import type * as AdmZip from 'adm-zip';
import { Hoi4FsSchema } from '../constants';
import { trimStart } from 'lodash';
const dlcZipPathsCache = new PromiseCache({
    factory: getDlcZipPaths,
    life: 10 * 60 * 1000,
});
const dlcPathsCache = new PromiseCache({
    factory: getDlcPaths,
    life: 10 * 60 * 1000,
});
let dlcZipCache: PromiseCache<AdmZip> | null = null;
if (!IS_WEB_EXT) {
    // adm-zip requires fs, which doesn't work on web.
    function getDlcZip(dlcZipPath: string): Promise<AdmZip> {
        const uri = vscode.Uri.parse(dlcZipPath);
        if (uri.scheme === Hoi4FsSchema) {
            dlcZipPath = path.join(getConfiguration().installPath, trimStart(uri.path, '/'));
        } else {
            ensureFileScheme(uri);
            dlcZipPath = uri.fsPath;
        }
        const AdmZip = require('adm-zip');
        return Promise.resolve(new AdmZip(dlcZipPath));
    }
    dlcZipCache = new PromiseCache({
        factory: getDlcZip,
        expireWhenChange: key => getLastModifiedAsync(vscode.Uri.parse(key)),
        life: 15 * 1000,
    });
}
export async function clearDlcZipCache() {
    dlcPathsCache.clear();
    dlcZipPathsCache.clear();
    dlcZipCache?.clear();
}
export function getFilePathFromMod(relativePath: string): Promise<vscode.Uri | undefined> {
    return getFilePathFromModOrHOI4(relativePath, { hoi4: false });
}
export async function getFilePathFromModOrHOI4(relativePath: string, options?: { mod?: boolean, hoi4?: boolean }): Promise<vscode.Uri | undefined> {
    relativePath = relativePath.replace(/\/\/+|\\+/g, '/');
    let absolutePath: vscode.Uri | undefined = undefined;
    if (options?.mod !== false) {
        // Find in opened workspace folders
        if (vscode.workspace.workspaceFolders) {
            for (const folder of vscode.workspace.workspaceFolders) {
                const findPath = vscode.Uri.joinPath(folder.uri, relativePath);
                if (await isFile(findPath)) {
                    absolutePath = findPath;
                    break;
                }
            }
            if (absolutePath !== undefined) {
                // Opened document
                const document = vscode.workspace.textDocuments.find(d => isSameUri(d.uri, absolutePath!));
                if (document) {
                    return document.uri.with({ fragment: ':opened' });
                }
            }
        }
        if (absolutePath !== undefined) {
            return absolutePath;
        }
        const replacePaths = await getReplacePaths();
        if (replacePaths) {
            const relativePathDir = path.dirname(relativePath);
            for (const replacePath of replacePaths) {
                if (isSamePath(relativePathDir, replacePath)) {
                    return absolutePath;
                }
            }
        }
    }
    if (options?.hoi4 === false) {
        return absolutePath;
    }
    // Find in HOI4 install path
    const installPath = vscode.Uri.parse(Hoi4FsSchema + ':/');
    if (!absolutePath) {
        const findPath = vscode.Uri.joinPath(installPath, relativePath);
        if (await isFile(findPath)) {
            absolutePath = findPath;
        }
    }
    // Find in HOI4 DLCs
    const conf = getConfiguration();
    if (!absolutePath && conf.loadDlcContents) {
        const dlcs = await dlcZipPathsCache.get(installPath.toString());
        if (dlcs !== null && dlcZipCache !== null) {
            for (const dlc of dlcs) {
                const dlcZip = await dlcZipCache.get(dlc.toString());
                const entry = dlcZip.getEntry(relativePath);
                if (entry !== null) {
                    return dlc.with({ fragment: relativePath });
                }
            }
        }
        const dlcFolders = await dlcPathsCache.get(installPath.toString());
        if (dlcFolders !== null) {
            for (const dlc of dlcFolders) {
                const findPath = vscode.Uri.joinPath(dlc, relativePath);
                if (await isFile(findPath)) {
                    return findPath;
                }
            }
        }
    }
    return absolutePath;
}
export function isHoiFileOpened(path: vscode.Uri): boolean {
    return path.fragment === ':opened';
}
export function getHoiOpenedFileOriginalUri(path: vscode.Uri): vscode.Uri {
    return path.with({ fragment: '' });
}
export function isHoiFileFromDlc(path: vscode.Uri): boolean {
    return path.fragment !== '' && path.path.endsWith('.zip');
}
export function getHoiDlcFileOriginalUri(path: vscode.Uri): { uri: vscode.Uri, entryPath: string } {
    return { uri: path.with({ fragment: '' }), entryPath: path.fragment };
}
export async function hoiFileExpiryToken(relativePath: string): Promise<string> {
    return await expiryToken(await getFilePathFromModOrHOI4(relativePath));;
}
export async function expiryToken(realPath: vscode.Uri | undefined): Promise<string> {
    if (!realPath) {
        return '';
    }
    if (isHoiFileOpened(realPath)) {
        return realPath.toString() + '@' + Date.now();
    } else if (isHoiFileFromDlc(realPath)) {
        return realPath.with({ fragment: '' }).toString() + '@' + await getLastModifiedAsync(realPath);
    }
    return realPath.toString() + '@' + await getLastModifiedAsync(realPath);
}
export async function readFileFromPath(realPath: vscode.Uri, relativePath?: string): Promise<[Buffer, vscode.Uri]> {
    if (isHoiFileOpened(realPath)) {
        const realPathWithoutOpenMark = getHoiOpenedFileOriginalUri(realPath);
        const document = getDocumentByUri(realPathWithoutOpenMark);
        if (document) {
            return [Buffer.from(document.getText()), realPath];
        }
        realPath = realPathWithoutOpenMark;
    } else if (realPath.fragment !== '' && realPath.path.endsWith('.zip')) {
        if (dlcZipCache !== null) {
            const { uri: dlc, entryPath: filePath } = getHoiDlcFileOriginalUri(realPath);
            const dlcZip = await dlcZipCache.get(dlc.toString());
            const entry = dlcZip.getEntry(filePath);
            if (entry !== null) {
                return [await new Promise<Buffer>(resolve => entry.getDataAsync(resolve)), realPath];
            }
        }
        throw new UserError("Can't find file " + relativePath);
    }
    return [ await readFile(realPath), realPath ];
}
export async function readFileFromModOrHOI4(relativePath: string, options?: { mod?: boolean, hoi4?: boolean }): Promise<[Buffer, vscode.Uri]> {
    const realPath = await getFilePathFromModOrHOI4(relativePath, options);
    if (!realPath) {
        throw new UserError("Can't find file " + relativePath);
    }
    return await readFileFromPath(realPath, relativePath);
}
export async function readFileFromModOrHOI4AsJson<T>(relativePath: string, schema: SchemaDef<T>): Promise<HOIPartial<T>> {
    const [buffer, realPath] = await readFileFromModOrHOI4(relativePath);
    const nodes = parseHoi4File(buffer.toString(), localize('infile', 'In file {0}:\n', realPath));
    return convertNodeToJson<T>(nodes, schema);
}
export async function listFilesFromModOrHOI4(relativePath: string, options?: { mod?: boolean, hoi4?: boolean, recursively?: boolean }): Promise<string[]> {
    const readFunction = options?.recursively ? readDirFilesRecursively : readDirFiles;
    relativePath = relativePath.replace(/\/\/+|\\+/g, '/');
    const result: string[] = [];
    if (options?.mod !== false) {
        // Find in opened workspace folders
        if (vscode.workspace.workspaceFolders) {
            for (const folder of vscode.workspace.workspaceFolders) {
                const findPath = vscode.Uri.joinPath(folder.uri, relativePath);
                if (await isDirectory(findPath)) {
                    try {
                        result.push(...await readFunction(findPath));
                    } catch(e) {}
                }
            }
        }
        const replacePaths = await getReplacePaths();
        if (replacePaths) {
            for (const replacePath of replacePaths) {
                if (isSamePath(relativePath, replacePath)) {
                    return result.filter((v, i, a) => i === a.indexOf(v));
                }
            }
        }
    }
    if (options?.hoi4 === false) {
        return result;
    }
    // Find in HOI4 install path
    const conf = getConfiguration();
    const installPath = vscode.Uri.parse(Hoi4FsSchema + ':/');
    {
        const findPath = vscode.Uri.joinPath(installPath, relativePath);
        if (await isDirectory(findPath)) {
            try {
                result.push(...await readFunction(findPath));
            } catch(e) {}
        }
    }
    // Find in HOI4 DLCs
    if (conf.loadDlcContents) {
        const dlcs = await dlcZipPathsCache.get(installPath.toString());
        if (dlcs !== null && dlcZipCache !== null) {
            for (const dlc of dlcs) {
                const dlcZip = await dlcZipCache.get(dlc.toString());
                const folderEntry = dlcZip.getEntry(relativePath);
                if (folderEntry && folderEntry.isDirectory) {
                    for (const entry of dlcZip.getEntries()) {
                        if (isSamePath(path.dirname(entry.entryName.replace(/^[\\/]/, '')), relativePath) && !entry.isDirectory) {
                            result.push(path.basename(entry.name));
                        }
                    }
                }
            }
        }
        const dlcFolders = await dlcPathsCache.get(installPath.toString());
        if (dlcFolders !== null) {
            for (const dlc of dlcFolders) {
                const findPath = vscode.Uri.joinPath(dlc, relativePath);
                if (await isDirectory(findPath)) {
                    try {
                        result.push(...await readFunction(findPath));
                    } catch(e) {}
                }
            }
        }
    }
    return result.filter((v, i, a) => i === a.indexOf(v));
}
async function getDlcZipPaths(installPath: string): Promise<vscode.Uri[] | null> {
    const dlcPath = vscode.Uri.joinPath(vscode.Uri.parse(installPath), 'dlc');
    if (!await isDirectory(dlcPath)) {
        return null;
    }
    const dlcFolders = await readDir(dlcPath);
    const paths = await Promise.all(dlcFolders.map(async (dlcFolder) => {
        const dlcZipFolder = vscode.Uri.joinPath(dlcPath, dlcFolder);
        if (await isDirectory(dlcZipFolder)) {
            const files =  await readDir(dlcZipFolder);
            const zipFile = files.find(file => file.endsWith('.zip'));
            if (zipFile) {
                return vscode.Uri.joinPath(dlcZipFolder, zipFile);
            }
        }
        return null;
    }));
    return paths.filter((path): path is vscode.Uri => path !== null);
}
async function getDlcPaths(installPath: string): Promise<vscode.Uri[] | null> {
    const dlcPath = vscode.Uri.joinPath(vscode.Uri.parse(installPath), 'dlc');
    if (!await isDirectory(dlcPath)) {
        return null;
    }
    const dlcFolders = await readDir(dlcPath);
    const paths = await Promise.all(dlcFolders.map(async (dlcFolder) => {
        const dlcZipFolder = vscode.Uri.joinPath(dlcPath, dlcFolder);
        if (await isDirectory(dlcZipFolder) && dlcFolder.startsWith("dlc")) {
            return dlcZipFolder;
        }
        return null;
    }));
    return paths.filter((path): path is vscode.Uri => path !== null);
}
const replacePathsCache = new PromiseCache({
    factory: getReplacePathsFromModFile,
    expireWhenChange: key => getLastModifiedAsync(vscode.Uri.parse(key)),
    life: 60 * 1000,
});
interface ModFile {
    replace_path: string[];
}
const modFileSchema: SchemaDef<ModFile> = {
    replace_path: {
        _innerType: "string",
        _type: "array",
    },
};
async function getReplacePaths(): Promise<string[] | undefined> {
    const conf = getConfiguration();
    let modFile = fileOrUriStringToUri(conf.modFile);
    if (conf.modFile === "") {
        if (vscode.workspace.workspaceFolders) {
            for (const workspaceFolder of vscode.workspace.workspaceFolders) {
                const workspaceFolderPath = workspaceFolder.uri;
                const mods = await workspaceModFilesCache.get(workspaceFolderPath.toString());
                if (mods.length > 0) {
                    modFile = mods[0];
                    break;
                }
            }
        }
    }
    try {
        if (modFile && await isFile(modFile)) {
            const result = await replacePathsCache.get(modFile.toString());
            updateSelectedModFileStatus(modFile);
            return result;
        }
    } catch (e) {
        error(e);
    }
    updateSelectedModFileStatus(modFile, true);
    return undefined;
}
async function getReplacePathsFromModFile(absolutePath: string): Promise<string[]> {
    const content = (await readFile(vscode.Uri.parse(absolutePath))).toString();
    const node = parseHoi4File(content, localize('infile', 'In file {0}:\n', absolutePath));
    const modFile = convertNodeToJson<ModFile>(node, modFileSchema);
    return modFile.replace_path.filter((v): v is string => typeof v === 'string');
}
```

## File: webviewsrc/worldmap/index.ts
```typescript
import { Loader } from './loader';
import { ViewPoint } from './viewpoint';
import { topBarHeight, TopBar } from './topbar';
import { getState, setState } from '../util/common';
import { Renderer } from './renderer';
import { fromEvent } from 'rxjs';
fromEvent(window, 'load').subscribe(function() {
    hideBySupplyAreaFlag((window as any)['__enableSupplyArea']);
    const state = getState();
    const loader = new Loader();
    const mainCanvas = document.getElementById('main-canvas') as HTMLCanvasElement;
    const viewPoint = new ViewPoint(mainCanvas, loader, topBarHeight, state.viewPoint || { x: 0, y: -topBarHeight, scale: 1 });
    const topBar = new TopBar(mainCanvas, viewPoint, loader, state);
    const renderer = new Renderer(mainCanvas, viewPoint, loader, topBar);
    fromEvent(mainCanvas, 'contextmenu').subscribe(event => event.preventDefault());
    viewPoint.observable$.subscribe(setStateForKey('viewPoint'));
    topBar.viewMode$.subscribe(setStateForKey('viewMode'));
    topBar.colorSet$.subscribe(setStateForKey('colorSet'));
    topBar.selectedProvinceId$.subscribe(setStateForKey('selectedProvinceId'));
    topBar.selectedStateId$.subscribe(setStateForKey('selectedStateId'));
    topBar.selectedStrategicRegionId$.subscribe(setStateForKey('selectedStrategicRegionId'));
    topBar.selectedSupplyAreaId$.subscribe(setStateForKey('selectedSupplyAreaId'));
    topBar.warningFilter.selectedValues$.subscribe(setStateForKey('warningFilter'));
    topBar.display.selectedValues$.subscribe(setStateForKey('display'));
});
function setStateForKey<T>(key: string): (newValue: T) => void {
    return newValue => {
        setState({ [key]: newValue });
    };
}
function hideBySupplyAreaFlag(enableSupplyArea: boolean) {
    const viewModes = document.getElementById('viewmode')!.getElementsByTagName('option');
    for (let i = 0; i < viewModes.length; i++) {
        const viewMode = viewModes[i];
        const attribute = viewMode.getAttribute('enablesupplyarea');
        if (attribute && attribute !== enableSupplyArea.toString()) {
            viewMode.remove();
        }
    }
    const colorSets = document.getElementById('colorset')!.getElementsByTagName('option');
    for (let i = 0; i < colorSets.length; i++) {
        const colorSet = colorSets[i];
        const attribute = colorSet.getAttribute('enablesupplyarea');
        if (attribute && attribute !== enableSupplyArea.toString()) {
            colorSet.remove();
        }
    }
    const displayOptions = document.getElementById('display')!.getElementsByTagName('div');
    for (let i = 0; i < displayOptions.length; i++) {
        const displayOption = displayOptions[i];
        const attribute = displayOption.getAttribute('enablesupplyarea');
        if (attribute && attribute !== enableSupplyArea.toString()) {
            displayOption.remove();
        }
    }
    const warningFilterOptions = document.getElementById('warningfilter')!.getElementsByTagName('div');
    for (let i = 0; i < warningFilterOptions.length; i++) {
        const warningFilterOption = warningFilterOptions[i];
        const attribute = warningFilterOption.getAttribute('enablesupplyarea');
        if (attribute && attribute !== enableSupplyArea.toString()) {
            warningFilterOption.remove();
        }
    }
}
```

## File: src/previewdef/focustree/contentbuilder.ts
```typescript
import * as vscode from 'vscode';
import { FocusTree, Focus } from './schema';
import { getSpriteByGfxName, Image, getImageByPath } from '../../util/image/imagecache';
import { localize, i18nTableAsScript } from '../../util/i18n';
import { forceError, randomString } from '../../util/common';
import { HOIPartial, toNumberLike, toStringAsSymbolIgnoreCase } from '../../hoiformat/schema';
import { html, htmlEscape } from '../../util/html';
import { GridBoxType } from '../../hoiformat/gui';
import { FocusTreeLoader } from './loader';
import { LoaderSession } from '../../util/loader/loader';
import { debug } from '../../util/debug';
import { StyleTable, normalizeForStyle } from '../../util/styletable';
import { useConditionInFocus } from '../../util/featureflags';
import { flatMap } from 'lodash';
import { getLocalisedTextQuick } from "../../util/localisationIndex";
import { localisationIndex } from "../../util/featureflags";
const defaultFocusIcon = 'gfx/interface/goals/goal_unknown.dds';
export async function renderFocusTreeFile(loader: FocusTreeLoader, uri: vscode.Uri, webview: vscode.Webview): Promise<string> {
    const setPreviewFileUriScript = { content: `window.previewedFileUri = "${uri.toString()}";` };
    try {
        const session = new LoaderSession(false);
        const loadResult = await loader.load(session);
        const loadedLoaders = Array.from((session as any).loadedLoader).map<string>(v => (v as any).toString());
        debug('Loader session focus tree', loadedLoaders);
        const focustrees = loadResult.result.focusTrees;
        if (focustrees.length === 0) {
            const baseContent = localize('focustree.nofocustree', 'No focus tree.');
            return html(webview, baseContent, [ setPreviewFileUriScript ], []);
        }
        const styleTable = new StyleTable();
        const jsCodes: string[] = [];
        const styleNonce = randomString(32);
        const baseContent = await renderFocusTrees(focustrees, styleTable, loadResult.result.gfxFiles, jsCodes, styleNonce, loader.file);
        jsCodes.push(i18nTableAsScript());
        return html(
            webview,
            baseContent,
            [
                setPreviewFileUriScript,
                ...jsCodes.map(c => ({ content: c })),
                'common.js',
                'focustree.js',
            ],
            [
                'codicon.css',
                'common.css',
                styleTable,
                { nonce: styleNonce },
            ],
        );
    } catch (e) {
        const baseContent = `${localize('error', 'Error')}: <br/>  <pre>${htmlEscape(forceError(e).toString())}</pre>`;
        return html(webview, baseContent, [ setPreviewFileUriScript ], []);
    }
}
const leftPaddingBase = 50;
const topPaddingBase = 50;
const xGridSize = 96;
const yGridSize = 130;
async function renderFocusTrees(focusTrees: FocusTree[], styleTable: StyleTable, gfxFiles: string[], jsCodes: string[], styleNonce: string, file: string): Promise<string> {
    const leftPadding = leftPaddingBase;
    const topPadding = topPaddingBase;
    const gridBox: HOIPartial<GridBoxType> = {
        position: { x: toNumberLike(leftPadding), y: toNumberLike(topPadding) },
        format: toStringAsSymbolIgnoreCase('up'),
        size: { width: toNumberLike(xGridSize), height: undefined },
        slotsize: { width: toNumberLike(xGridSize), height: toNumberLike(yGridSize) },
    } as HOIPartial<GridBoxType>;
    const renderedFocus: Record<string, string> = {};
    await Promise.all(flatMap(focusTrees, tree => Object.values(tree.focuses)).map(async (focus) =>
        renderedFocus[focus.id] = (await renderFocus(focus, styleTable, gfxFiles, file)).replace(/\s\s+/g, ' ')));
    jsCodes.push('window.focusTrees = ' + JSON.stringify(focusTrees));
    jsCodes.push('window.renderedFocus = ' + JSON.stringify(renderedFocus));
    jsCodes.push('window.gridBox = ' + JSON.stringify(gridBox));
    jsCodes.push('window.styleNonce = ' + JSON.stringify(styleNonce));
    jsCodes.push('window.useConditionInFocus = ' + useConditionInFocus);
    jsCodes.push('window.xGridSize = ' + xGridSize);
    const continuousFocusContent =
        `<div id="continuousFocuses" class="${styleTable.oneTimeStyle('continuousFocuses', () => `
            position: absolute;
            width: 770px;
            height: 380px;
            margin: 20px;
            background: rgba(128, 128, 128, 0.2);
            text-align: center;
            pointer-events: none;
        `)}">Continuous focuses</div>`;
    return (
        `<div id="dragger" class="${styleTable.oneTimeStyle('dragger', () => `
            width: 100vw;
            height: 100vh;
            position: fixed;
            left:0;
            top:0;
        `)}"></div>` +
        `<div id="focustreecontent" class="${styleTable.oneTimeStyle('focustreecontent', () => `top:40px;left:-20px;position:relative`)}">
            <div id="focustreeplaceholder"></div>
            ${continuousFocusContent}
        </div>` +
        renderWarningContainer(styleTable) +
        renderToolBar(focusTrees, styleTable)
    );
}
function renderWarningContainer(styleTable: StyleTable) {
    styleTable.style('warnings', () => 'outline: none;', ':focus');
    return `
    <div id="warnings-container" class="${styleTable.style('warnings-container', () => `
        height: 100vh;
        width: 100vw;
        position: fixed;
        top: 0;
        left: 0;
        padding-top: 40px;
        background: var(--vscode-editor-background);
        box-sizing: border-box;
        display: none;
    `)}">
        <textarea id="warnings" readonly wrap="off" class="${styleTable.style('warnings', () => `
            height: 100%;
            width: 100%;
            font-family: 'Consolas', monospace;
            resize: none;
            background: var(--vscode-editor-background);
            padding: 10px;
            border-top: none;
            border-left: none;
            border-bottom: none;
            box-sizing: border-box;
        `)}"></textarea>
    </div>`;
}
function renderToolBar(focusTrees: FocusTree[], styleTable: StyleTable): string {
    const focuses = focusTrees.length <= 1 ? '' : `
        <label for="focuses" class="${styleTable.style('focusesLabel', () => `margin-right:5px`)}">${localize('focustree.focustree', 'Focus tree: ')}</label>
        <div class="select-container ${styleTable.style('marginRight10', () => `margin-right:10px`)}">
            <select id="focuses" class="select multiple-select" tabindex="0" role="combobox">
                ${focusTrees.map((focus, i) => `<option value="${i}">${focus.id}</option>`).join('')}
            </select>
        </div>`;
    const searchbox = `    
        <label for="searchbox" class="${styleTable.style('searchboxLabel', () => `margin-right:5px`)}">${localize('focustree.search', 'Search: ')}</label>
        <input
            class="${styleTable.style('searchbox', () => `margin-right:10px`)}"
            id="searchbox"
            type="text"
        />`;
    const allowbranch = `
        <div id="allowbranch-container">
            <label for="allowbranch" class="${styleTable.style('allowbranchLabel', () => `margin-right:5px`)}">${localize('focustree.allowbranch', 'Allow branch: ')}</label>
            <div class="select-container ${styleTable.style('marginRight10', () => `margin-right:10px`)}">
                <div id="allowbranch" class="select multiple-select" tabindex="0" role="combobox">
                    <span class="value"></span>
                </div>
            </div>
        </div>`;
    const conditions = `
        <div id="condition-container">
            <label for="conditions" class="${styleTable.style('conditionsLabel', () => `margin-right:5px`)}">${localize('focustree.conditions', 'Conditions: ')}</label>
            <div class="select-container ${styleTable.style('marginRight10', () => `margin-right:10px`)}">
                <div id="conditions" class="select multiple-select" tabindex="0" role="combobox" class="${styleTable.style('conditionsLabel', () => `max-width:400px`)}">
                    <span class="value"></span>
                </div>
            </div>
        </div>`;
    const warningsButton = focusTrees.every(ft => ft.warnings.length === 0) ? '' : `
        <button id="show-warnings" title="${localize('focustree.warnings', 'Toggle warnings')}">
            <i class="codicon codicon-warning"></i>
        </button>`;
    return `<div class="toolbar-outer ${styleTable.style('toolbar-height', () => `box-sizing: border-box; height: 40px;`)}">
        <div class="toolbar">
            ${focuses}
            ${searchbox}
            ${useConditionInFocus ? conditions : allowbranch}
            ${warningsButton}
        </div>
    </div>`;
}
async function renderFocus(focus: Focus, styleTable: StyleTable, gfxFiles: string[], file: string): Promise<string> {
    for (const focusIcon of focus.icon) {
        const iconName = focusIcon.icon;
        const iconObject = iconName ? await getFocusIcon(iconName, gfxFiles) : null;
        styleTable.style('focus-icon-' + normalizeForStyle(iconName ?? '-empty'), () => 
            `${iconObject ? `background-image: url(${iconObject.uri});` : 'background: grey;'}
            background-size: ${iconObject ? iconObject.width: 0}px;`
        );
    }
    styleTable.style('focus-icon-' + normalizeForStyle('-empty'), () => 'background: grey;');
    let textContent = focus.id;
    if (localisationIndex){
        let localizedText = await getLocalisedTextQuick(focus.id);
        if (localizedText === focus.id || !localizedText){
            if (focus.text){
                localizedText = await getLocalisedTextQuick(focus.text);
                if (localizedText !== focus.text && localizedText != null){
                    textContent += `<br/>${localizedText}`;
                }
            }
        }else {
            textContent += `<br/>${localizedText}`;
        }
    }
    return `<div
    class="
        navigator
        {{iconClass}}
        ${styleTable.style('focus-common', () => `
            background-position-x: center;
            background-position-y: calc(50% - 18px);
            background-repeat: no-repeat;
            width: 100%;
            height: 100%;
            text-align: center;
            cursor: pointer;
        `)}
    "
    start="${focus.token?.start}"
    end="${focus.token?.end}"
    ${file === focus.file ? '' : `file="${focus.file}"`}
    title="${focus.id}\n({{position}})">
        <div class="focus-checkbox ${styleTable.style('focus-checkbox', () => `position: absolute; top: 1px;`)}">
            <input id="checkbox-${normalizeForStyle(focus.id)}" type="checkbox"/>
        </div>
        <span
        class="${styleTable.style('focus-span', () => `
            margin: 10px -400px;
            margin-top: 85px;
            text-align: center;
            display: inline-block;
        `)}">
        ${textContent}
        </span>
    </div>`;
}
export async function getFocusIcon(name: string, gfxFiles: string[]): Promise<Image | undefined> {
    const sprite = await getSpriteByGfxName(name, gfxFiles);
    if (sprite !== undefined) {
        return sprite.image;
    }
    return await getImageByPath(defaultFocusIcon);
}
```

## File: src/previewdef/focustree/schema.ts
```typescript
import { Node, Token } from "../../hoiformat/hoiparser";
import { HOIPartial, SchemaDef, Position, convertNodeToJson, positionSchema, Raw } from "../../hoiformat/schema";
import { normalizeNumberLike } from "../../util/hoi4gui/common";
import { flatten, chain } from 'lodash';
import { ConditionItem, ConditionComplexExpr, extractConditionValues, extractConditionValue, extractConditionalExprs } from "../../hoiformat/condition";
import { countryScope } from "../../hoiformat/scope";
import { useConditionInFocus } from "../../util/featureflags";
import { randomString, Warning } from "../../util/common";
import { localize } from "../../util/i18n";
export interface FocusTree {
    id: string;
    focuses: Record<string, Focus>;
    allowBranchOptions: string[];
    conditionExprs: ConditionItem[];
    isSharedFocues: boolean;
    continuousFocusPositionX?: number;
    continuousFocusPositionY?: number;
    warnings: FocusWarning[];
}
interface FocusIconWithCondition {
    icon: string | undefined;
    condition: ConditionComplexExpr;
}
export interface Focus {
    x: number;
    y: number;
    id: string;
    icon: FocusIconWithCondition[];
    prerequisite: string[][];
    exclusive: string[];
    hasAllowBranch: boolean;
    inAllowBranch: string[];
    allowBranch: ConditionComplexExpr | undefined;
    relativePositionId: string | undefined;
    offset: Offset[];
    token: Token | undefined;
    file: string;
    text?: string;
}
export interface FocusWarning extends Warning<string> {
    navigations?: { file: string, start: number, end: number }[];
}
interface Offset {
    x: number;
    y: number;
    trigger: ConditionComplexExpr | undefined;
}
interface FocusTreeDef {
    id: string;
    shared_focus: string[];
    focus: FocusDef[];
    continuous_focus_position: Position;
}
interface FocusDef {
    id: string;
    icon: Raw[];
    x: number;
    y: number;
    prerequisite: FocusOrORList[];
    mutually_exclusive: FocusOrORList[];
    relative_position_id: string;
    allow_branch: Raw[]; /* FIXME not symbol node */
    offset: OffsetDef[];
    _token: Token;
    text?: string;
}
interface FocusIconDef {
    trigger: Raw;
    value: string;
}
interface OffsetDef {
    x: number;
    y: number;
    trigger: Raw[];
}
interface FocusOrORList {
    focus: string[];
    OR: string[];
}
interface FocusFile {
    focus_tree: FocusTreeDef[];
    shared_focus: FocusDef[];
    joint_focus: FocusDef[];
}
const focusOrORListSchema: SchemaDef<FocusOrORList> = {
    focus: {
        _innerType: "string",
        _type: 'array',
    },
    OR: {
        _innerType: "string",
        _type: 'array',
    },
};
const focusSchema: SchemaDef<FocusDef> = {
    id: "string",
    icon: {
        _innerType: 'raw',
        _type: 'array',
    },
    x: "number",
    y: "number",
    prerequisite: {
        _innerType: focusOrORListSchema,
        _type: 'array',
    },
    mutually_exclusive: {
        _innerType: focusOrORListSchema,
        _type: 'array',
    },
    relative_position_id: "string",
    allow_branch: {
        _innerType: 'raw',
        _type: 'array',
    },
    offset: {
        _innerType: {
            x: "number",
            y: "number",
            trigger: {
                _innerType: 'raw',
                _type: 'array',
            },
        },
        _type: 'array',
    },
    text: "string",
};
const focusTreeSchema: SchemaDef<FocusTreeDef> = {
    id: "string",
    shared_focus: {
        _innerType: "string",
        _type: "array",
    },
    focus: {
        _innerType: focusSchema,
        _type: 'array',
    },
    continuous_focus_position: positionSchema,
};
const focusFileSchema: SchemaDef<FocusFile> = {
    focus_tree: {
        _innerType: focusTreeSchema,
        _type: "array",
    },
    shared_focus: {
        _innerType: focusSchema,
        _type: "array",
    },
    joint_focus: {
        _innerType: focusSchema,
        _type: "array",
    },
};
const focusIconSchema: SchemaDef<FocusIconDef> = {
    trigger: "raw",
    value: "string",
};
export function convertFocusFileNodeToJson(node: Node, constants: {}): HOIPartial<FocusFile> {
    return convertNodeToJson<FocusFile>(node, focusFileSchema, constants);
}
export function getFocusTreeWithFocusFile(file: HOIPartial<FocusFile>, sharedFocusTrees: FocusTree[], filePath: string, constants: {} ): FocusTree[] {
    const focusTrees: FocusTree[] = [];
    if (file.shared_focus.length > 0) {
        const conditionExprs: ConditionItem[] = [];
        const warnings: FocusWarning[] = [];
        const focuses = getFocuses([...file.shared_focus, ...file.joint_focus], conditionExprs, filePath, warnings, constants);
        const sharedFocusTree = {
            id: localize('focustree.sharedfocuses', '<Shared focuses>'),
            focuses,
            allowBranchOptions: getAllowBranchOptions(focuses),
            conditionExprs,
            isSharedFocues: true,
            warnings,
        };
        focusTrees.push(sharedFocusTree);
        sharedFocusTrees = [sharedFocusTree, ...sharedFocusTrees];
    }
    for (const focusTree of file.focus_tree) {
        const conditionExprs: ConditionItem[] = [];
        const warnings: FocusWarning[] = [];
        const focuses = getFocuses(focusTree.focus, conditionExprs, filePath, warnings, constants);
        if (useConditionInFocus) {
            for (const sharedFocus of focusTree.shared_focus) {
                if (!sharedFocus) {
                    continue;
                }
                addSharedFocus(focuses, filePath, sharedFocusTrees, sharedFocus, conditionExprs, warnings);
            }
        }
        validateRelativePositionId(focuses, warnings);
        focusTrees.push({
            id: focusTree.id ?? localize('focustree.ananymous', '<Anonymous focus tree>'),
            focuses,
            allowBranchOptions: getAllowBranchOptions(focuses),
            continuousFocusPositionX: normalizeNumberLike(focusTree.continuous_focus_position?.x, 0) ?? 50,
            continuousFocusPositionY: normalizeNumberLike(focusTree.continuous_focus_position?.y, 0) ?? 1000,
            conditionExprs,
            isSharedFocues: false,
            warnings,
        });
    }
    return focusTrees;
}
export function getFocusTree(node: Node, sharedFocusTrees: FocusTree[], filePath: string): FocusTree[] {
    const constants = {};
    const file = convertFocusFileNodeToJson(node, constants);
    return getFocusTreeWithFocusFile(file, sharedFocusTrees, filePath, constants);
}
function getFocuses(hoiFocuses: HOIPartial<FocusDef>[], conditionExprs: ConditionItem[], filePath: string, warnings: FocusWarning[], constants: {}): Record<string, Focus> {
    const focuses: Record<string, Focus> = {};
    for (const hoiFocus of hoiFocuses) {
        const focus = getFocus(hoiFocus, conditionExprs, filePath, warnings, constants);
        if (focus !== null) {
            if (focus.id in focuses) {
                const otherFocus = focuses[focus.id];
                warnings.push({
                    text: localize('focustree.warnings.focusidconflict', "There're more than one focuses with ID {0} in file: {1}.", focus.id, filePath),
                    source: focus.id,
                    navigations: [
                        {
                            file: filePath,
                            start: focus.token?.start ?? 0,
                            end: focus.token?.end ?? 0,
                        },
                        {
                            file: filePath,
                            start: otherFocus.token?.start ?? 0,
                            end: otherFocus.token?.end ?? 0,
                        },
                    ]
                });
            }
            focuses[focus.id] = focus;
        }
    }
    let hasChangedInAllowBranch = true;
    while (hasChangedInAllowBranch) {
        hasChangedInAllowBranch = false;
        for (const key in focuses) {
            const focus = focuses[key];
            const allPrerequisites = flatten(focus.prerequisite).filter(p => p in focuses);
            if (allPrerequisites.length === 0) {
                continue;
            }
            chain(allPrerequisites)
                .flatMap(p  => focuses[p].inAllowBranch)
                .forEach(ab => {
                    if (!focus.inAllowBranch.includes(ab)) {
                        focus.inAllowBranch.push(ab);
                        hasChangedInAllowBranch = true;
                    }
                })
                .value();
        }
    }
    return focuses;
}
function getFocus(hoiFocus: HOIPartial<FocusDef>, conditionExprs: ConditionItem[], filePath: string, warnings: FocusWarning[], constants: {}): Focus | null {
    const id = hoiFocus.id ?? `[missing_id_${randomString(8)}]`;
    if (!hoiFocus.id) {
        warnings.push({
            text: localize('focustree.warnings.focusnoid', "A focus defined in this file don't have ID: {0}.", filePath),
            source: id,
        });
    }
    const x = hoiFocus.x ?? 0;
    const y = hoiFocus.y ?? 0;
    const relativePositionId = hoiFocus.relative_position_id;
    const exclusive = chain(hoiFocus.mutually_exclusive)
        .flatMap(f => f.focus.concat(f.OR))
        .filter((s): s is string => s !== undefined)
        .value();
    const prerequisite = hoiFocus.prerequisite
        .map(p => p.focus.concat(p.OR).filter((s): s is string => s !== undefined));
    const icon = parseFocusIcon(hoiFocus.icon.filter((v): v is Raw => v !== undefined).map(v => v._raw), constants, conditionExprs);
    const hasAllowBranch = hoiFocus.allow_branch.length > 0;
    const allowBranchCondition = extractConditionValues(hoiFocus.allow_branch.filter((v): v is Raw => v !== undefined).map(v => v._raw.value), countryScope, conditionExprs).condition;
    const offset: Offset[] = hoiFocus.offset.map(o => ({
        x: o.x ?? 0,
        y: o.y ?? 0,
        trigger: o.trigger ? extractConditionValues(o.trigger.filter((v): v is Raw => v !== undefined).map(v => v._raw.value), countryScope, conditionExprs).condition : false,
    }));
    const text = hoiFocus.text;
    return {
        id,
        icon,
        x,
        y,
        relativePositionId,
        prerequisite,
        exclusive,
        hasAllowBranch,
        inAllowBranch: hasAllowBranch ? [id] : [],
        allowBranch: allowBranchCondition,
        offset,
        token: hoiFocus._token,
        file: filePath,
        text,
    };
}
function addSharedFocus(focuses: Record<string, Focus>, filePath: string, sharedFocusTrees: FocusTree[], sharedFocusId: string, conditionExprs: ConditionItem[], warnings: FocusWarning[]) {
    const sharedFocusTree = sharedFocusTrees.find(sft => sharedFocusId in sft.focuses);
    if (!sharedFocusTree) {
        return;
    }
    const sharedFocuses = sharedFocusTree.focuses;
    focuses[sharedFocusId] = sharedFocuses[sharedFocusId];
    updateConditionExprsByFocus(sharedFocuses[sharedFocusId], conditionExprs);
    let hasChanged = true;
    while (hasChanged) {
        hasChanged = false;
        for (const key in sharedFocuses) {
            if (key in focuses) {
                continue;
            }
            const focus = sharedFocuses[key];
            const allPrerequisites = flatten(focus.prerequisite).filter(p => p in sharedFocuses);
            if (allPrerequisites.length === 0) {
                continue;
            }
            if (allPrerequisites.every(p => p in focuses)) {
                if (focus.id in focuses) {
                    const otherFocus = focuses[focus.id];
                    warnings.push({
                        text: localize('focustree.warnings.focusidconflict2', "There're more than one focuses with ID {0} in files: {1}, {2}.", focus.id, filePath, focus.file),
                        source: focus.id,
                        navigations: [
                            {
                                file: focus.file,
                                start: focus.token?.start ?? 0,
                                end: focus.token?.end ?? 0,
                            },
                            {
                                file: filePath,
                                start: otherFocus.token?.start ?? 0,
                                end: otherFocus.token?.end ?? 0,
                            },
                        ]
                    });
                }
                focuses[key] = focus;
                updateConditionExprsByFocus(focus, conditionExprs);
                hasChanged = true;
            }
        }
    }
    for (const warning of sharedFocusTree.warnings) {
        if (warning.source in focuses) {
            warnings.push(warning);
        }
    }
}
function updateConditionExprsByFocus(focus: Focus, conditionExprs: ConditionItem[]) {
    if (focus.allowBranch) {
        extractConditionalExprs(focus.allowBranch, conditionExprs);
    }
    for (const offset of focus.offset) {
        if (offset.trigger) {
            extractConditionalExprs(offset.trigger, conditionExprs);
        }
    }
    for (const icon of focus.icon) {
        extractConditionalExprs(icon.condition, conditionExprs);
    }
}
function getAllowBranchOptions(focuses: Record<string, Focus>): string[] {
    return chain(focuses)
        .filter(f => f.hasAllowBranch && f.allowBranch !== true)
        .map(f => f.id)
        .uniq()
        .value();
}
function validateRelativePositionId(focuses: Record<string, Focus>, warnings: FocusWarning[]) {
    const relativePositionId: Record<string, Focus | undefined> = {};
    const relativePositionIdChain: string[] = [];
    const circularReported: Record<string, boolean> = {};
    for (const focus of Object.values(focuses)) {
        if (focus.relativePositionId === undefined) {
            continue;
        }
        if (!(focus.relativePositionId in focuses)) {
            warnings.push({
                text: localize('focustree.warnings.relativepositionidnotexist', 'Relative position ID of focus {0} not exist: {1}.', focus.id, focus.relativePositionId),
                source: focus.id,
            });
            continue;
        }
        relativePositionIdChain.length = 0;
        relativePositionId[focus.id] = focuses[focus.relativePositionId];
        let currentFocus: Focus | undefined = focus;
        while (currentFocus) {
            if (circularReported[currentFocus.id]) {
                break;
            }
            relativePositionIdChain.push(currentFocus.id);
            const nextFocus: Focus | undefined = relativePositionId[currentFocus.id];
            if (nextFocus && relativePositionIdChain.includes(nextFocus.id)) {
                relativePositionIdChain.forEach(r => circularReported[r] = true);
                relativePositionIdChain.push(nextFocus.id);
                warnings.push({
                    text: localize('focustree.warnings.relativepositioncircularref', "There're circular reference in relative position ID of these focuses: {0}.", relativePositionIdChain.join(' -> ')),
                    source: focus.id,
                });
                break;
            }
            currentFocus = nextFocus;
        }
    }
}
function parseFocusIcon(nodes: Node[], constants: {}, conditionExprs: ConditionItem[]): FocusIconWithCondition[] {
    return nodes.map(n => parseSingleFocusIcon(n, constants, conditionExprs)).filter((v): v is FocusIconWithCondition => v !== undefined);
}
function parseSingleFocusIcon(node: Node, constants: {}, conditionExprs: ConditionItem[]): FocusIconWithCondition {
    const stringResult = convertNodeToJson<string>(node, 'string', constants);
    if (stringResult) {
        return { icon: stringResult, condition: true };
    }
    const iconWithCondition = convertNodeToJson<FocusIconDef>(node, focusIconSchema, constants);
    return {
        icon: iconWithCondition.value,
        condition: iconWithCondition.trigger ? extractConditionValue(iconWithCondition.trigger._raw.value, countryScope, conditionExprs).condition : true,
    };
}
```

## File: src/previewdef/worldmap/loader/provincemap.ts
```typescript
import { ProvinceMap, Province, ProvinceEdge, WorldMapWarning, ProvinceDefinition, ProvinceBmp, ProvinceEdgeAdjacency, ProgressReporter, Terrain } from "../definitions";
import { FileLoader, mergeInLoadResult, LoadResult, sortItems } from "./common";
import { SchemaDef } from "../../../hoiformat/schema";
import { readFileFromModOrHOI4AsJson } from "../../../util/fileloader";
import { TerrainDefinitionLoader } from "./terrain";
import { arrayToMap, UserError } from "../../../util/common";
import { localize } from "../../../util/i18n";
import { LoaderSession } from "../../../util/loader/loader";
import { DefinitionsLoader } from "./provincedefinitions";
import { AdjacenciesLoader } from "./adjacencies";
import { ContinentsLoader } from "./continents";
import { ProvinceBmpLoader } from "./provincebmp";
import { RiverLoader } from "./river";
interface DefaultMap {
    definitions: string;
    provinces: string;
    adjacencies: string;
    continent: string;
    rivers: string;
}
const defaultMapSchema: SchemaDef<DefaultMap> = {
    definitions: 'string',
    provinces: 'string',
    adjacencies: 'string',
    continent: 'string',
    rivers: 'string',
};
export class DefaultMapLoader extends FileLoader<ProvinceMap> {
    private definitionsLoader: DefinitionsLoader | undefined;
    private provinceBmpLoader: ProvinceBmpLoader | undefined;
    private adjacenciesLoader: AdjacenciesLoader | undefined;
    private continentsLoader: ContinentsLoader | undefined;
    private terrainDefinitionLoader: TerrainDefinitionLoader;
    private riverLoader: RiverLoader | undefined;
    constructor() {
        super('map/default.map');
        this.terrainDefinitionLoader = new TerrainDefinitionLoader();
        this.terrainDefinitionLoader.onProgress(e => this.onProgressEmitter.fire(e));
    }
    public async shouldReloadImpl(session: LoaderSession): Promise<boolean> {
        if (await super.shouldReloadImpl(session)) {
            return true;
        }
        return (await Promise.all([
            this.definitionsLoader,
            this.provinceBmpLoader,
            this.adjacenciesLoader,
            this.continentsLoader,
            this.terrainDefinitionLoader,
            this.riverLoader,
        ].map(v => v?.shouldReload(session) ?? Promise.resolve(false)))).some(v => v);
    }
    protected async loadFromFile(session: LoaderSession): Promise<LoadResult<ProvinceMap>> {
        const defaultMap = await loadDefaultMap(e => this.fireOnProgressEvent(e));
        session.throwIfCancelled();
        const provinceDefinitions = await (this.definitionsLoader = this.checkAndCreateLoader(this.definitionsLoader, 'map/' + defaultMap.definitions, DefinitionsLoader)).load(session);
        session.throwIfCancelled();
        const provinceBmp = await (this.provinceBmpLoader = this.checkAndCreateLoader(this.provinceBmpLoader, 'map/' + defaultMap.provinces, ProvinceBmpLoader)).load(session);
        session.throwIfCancelled();
        const adjacencies = await (this.adjacenciesLoader = this.checkAndCreateLoader(this.adjacenciesLoader, 'map/' + defaultMap.adjacencies, AdjacenciesLoader)).load(session);
        session.throwIfCancelled();
        const continents = await (this.continentsLoader = this.checkAndCreateLoader(this.continentsLoader, 'map/' + defaultMap.continent, ContinentsLoader)).load(session);
        session.throwIfCancelled();
        const terrains = await this.terrainDefinitionLoader.load(session);
        session.throwIfCancelled();
        const rivers = await (this.riverLoader = this.checkAndCreateLoader(this.riverLoader, 'map/' + defaultMap.rivers, RiverLoader)).load(session);
        session.throwIfCancelled();
        const subLoaderResults = [ provinceDefinitions, provinceBmp, adjacencies, continents, terrains, rivers ];
        const warnings = mergeInLoadResult(subLoaderResults, 'warnings');
        await this.fireOnProgressEvent(localize('worldmap.progress.mergeandvalidateprovince', 'Merging and validating provinces...'));
        const { provinces, badProvinceId: badProvinceIdForMerge } =
            mergeProvinceDefinitions(provinceDefinitions.result, provinceBmp.result, ['map/' + defaultMap.definitions, 'map/' + defaultMap.provinces], warnings);
        validateProvinceContinents(provinces, continents.result, ['map/' + defaultMap.definitions, 'map/' + defaultMap.continent], warnings);
        validateProvinceTerrains(provinces, terrains.result, ['map/' + defaultMap.definitions], warnings);
        fillAdjacencyEdges(provinces, adjacencies.result, provinceBmp.result.height, ['map/' + defaultMap.provinces, 'map/' + defaultMap.definitions], warnings);
        const { sortedProvinces, badProvinceId } = sortProvinces(provinces, badProvinceIdForMerge, ['map/' + defaultMap.definitions], warnings);
        if (rivers.result.width !== provinceBmp.result.width || rivers.result.height !== provinceBmp.result.height) {
            warnings.push({
                relatedFiles: [this.provinceBmpLoader.file, this.riverLoader.file],
                text: localize('worldmap.warning.riversizenotmatch',
                    'Size of the rivers image ({0}x{1}) doesn\'t match size of province map image ({2}x{3}).',
                    rivers.result.width, rivers.result.height, provinceBmp.result.width, provinceBmp.result.height),
                source: [{ type: 'river', name: '', index: -1 }]
            });
        }
        return {
            result: {
                width: provinceBmp.result.width,
                height: provinceBmp.result.height,
                colorByPosition: provinceBmp.result.colorByPosition, // width * height
                provinces: sortedProvinces, // count of provinces
                badProvincesCount: badProvinceId + 1,
                continents: continents.result,
                terrains: terrains.result,
                rivers: rivers.result.rivers,
            },
            dependencies: mergeInLoadResult(subLoaderResults, 'dependencies'),
            warnings,
        };
    }
    private checkAndCreateLoader<T extends FileLoader<any>>(
        loader: T | undefined,
        file: string,
        constructor: { new(file: string): T }
    ): T {
        if (loader && loader.file === file) {
            return loader;
        }
        loader = new constructor(file);
        loader.onProgress(e => this.onProgressEmitter.fire(e));
        return loader;
    }
    protected extraMesurements(result: LoadResult<ProvinceMap>) {
        return {
            ...super.extraMesurements(result),
            width: result.result.width,
            height: result.result.height,
            provinceCount: result.result.provinces.length
        };
    }
    public toString() {
        return `[DefaultMapLoader]`;
    }
}
async function loadDefaultMap(progressReporter: ProgressReporter): Promise<DefaultMap> {
    await progressReporter(localize('worldmap.progress.loadingdefaultmap', 'Loading default.map...'));
    const defaultMap = await readFileFromModOrHOI4AsJson<DefaultMap>('map/default.map', defaultMapSchema);
    (['definitions', 'provinces', 'adjacencies', 'continent'] as (keyof DefaultMap)[]).forEach(field => {
        if (!defaultMap[field]) {
            throw new UserError(localize('worldmap.error.fieldnotindefaultmap', 'Field "{0}" is not found in default.map.', field));
        }
    });
    return defaultMap as DefaultMap;
}
function sortProvinces(provinces: Province[], badProvinceId: number, relatedFiles: string[], warnings: WorldMapWarning[]): { sortedProvinces: (Province | undefined)[], badProvinceId: number } {
    const { sorted, badId } = sortItems(
        provinces,
        200000,
        (maxId) => { throw new UserError(localize('worldmap.error.provinceidtoolarge', 'Max province id is too large: {0}.', maxId)); },
        (newProvince, existingProvince, badId) => warnings.push({
                source: [{ type: 'province', id: badId, color: existingProvince.color }],
                relatedFiles,
                text: localize('worldmap.warnings.provinceidconflict', "There're more than one rows for province id {0}. Set id to {1}.", newProvince.id, badProvinceId),
            }),
        (startId, endId) => warnings.push({
                source: [{ type: 'province', id: startId, color: -1 }],
                relatedFiles: [],
                text: localize('worldmap.warnings.provincenotexist', "Province with id {0} doesn't exist.", startId === endId ? startId : `${startId}-${endId}`),
            }),
        false,
        badProvinceId,
    );
    return {
        sortedProvinces: sorted,
        badProvinceId: badId,
    };
}
function mergeProvinceDefinitions(
    provinceDefinitions: ProvinceDefinition[],
    { provinces, colorToProvince }: ProvinceBmp,
    relatedFiles: string[],
    warnings: WorldMapWarning[]
): { provinces: Province[], badProvinceId: number } {
    const result: Province[] = [];
    const colorToProvinceId: Record<number, number> = {};
    for (const provinceDef of provinceDefinitions) {
        if (colorToProvinceId[provinceDef.color] !== undefined) {
            warnings.push({
                source: [provinceDef.id, colorToProvinceId[provinceDef.color]].map(id => ({ type: 'province', id, color: provinceDef.color })),
                relatedFiles: relatedFiles.slice(0, 1),
                text: localize('worldmap.warnings.provincecolorconflict', 'Province {0} has conflict color with province {1}.', provinceDef.id, colorToProvinceId[provinceDef.color]),
            });
        }
        colorToProvinceId[provinceDef.color] = provinceDef.id;
        const provinceInMap = colorToProvince[provinceDef.color];
        if (provinceInMap) {
            result.push({
                ...provinceDef,
                ...provinceInMap,
                edges: [],
            });
        } else {
            if (provinceDef.id !== 0) {
                warnings.push({
                    source: [{ type: 'province', id: provinceDef.id, color: provinceDef.color }],
                    relatedFiles: relatedFiles,
                    text: localize('worldmap.warnings.provincenotexistonmap', "Province {0} doesn't exist on map.", provinceDef.id),
                });
            }
            result.push({ ...provinceDef, boundingBox: { x: 0, y: 0, w: 0, h: 0 }, mass: 0, centerOfMass: { x: 0, y: 0 }, coverZones: [], edges: [] });
        }
    }
    let badId = -1;
    for (const provinceInMap of provinces) {
        const color = provinceInMap.color;
        if (colorToProvinceId[color]) {
            continue;
        }
        const useBadId = badId--;
        warnings.push({
            source: [{ type: 'province', id: useBadId, color }],
            relatedFiles,
            text: localize('worldmap.warnings.provincenotexistindef', "Province with color ({0}, {1}, {2}) in provinces bmp ({3}, {4}) doesn't exist in definitions.",
                (color >> 16) & 0xFF, (color >> 8) & 0xFF, color & 0xFF, provinceInMap.coverZones[0].x, provinceInMap.coverZones[0].y),
        });
        colorToProvinceId[color] = useBadId;
        result.push({
            ...provinceInMap,
            edges: [], id: useBadId, continent: 0, type: 'sea', coastal: false, terrain: ''
        });
    }
    for (const province of result) {
        const provinceInMap = colorToProvince[province.color];
        if (provinceInMap) {
            province.edges = provinceInMap.edges.map(e => ({...e, to: colorToProvinceId[e.toColor] ?? -1, type: ''}));
        }
    }
    for (const warning of warnings) {
        for (const source of warning.source) {
            if (source.type === 'province' && source.id === -1) {
                const provinceId = colorToProvinceId[source.color];
                if (provinceId !== undefined) {
                    source.id = provinceId;
                }
            }
        }
    }
    return { provinces: result, badProvinceId: badId };
}
function validateProvinceContinents(provinces: Province[], continents: string[], relatedFiles: string[], warnings: WorldMapWarning[]) {
    for (const province of provinces) {
        const continent = province.continent;
        if (continent >= continents.length || continent < 0) {
            warnings.push({
                source: [{
                    type: 'province',
                    id: province.id,
                    color: province.color,
                }],
                relatedFiles,
                text: localize('worldmap.warnings.continentnotdefined', 'Continent {0} is not defined.', continent),
            });
        }
        if (province.type === 'land' && (continent === 0 || isNaN(continent)) && province.id !== 0) {
            warnings.push({
                source: [{
                    type: 'province',
                    id: province.id,
                    color: province.color,
                }],
                relatedFiles,
                text: localize('worldmap.warnings.provincenocontinent', 'Land province {0} must belong to a continent.', province.id),
            });
        }
    }
}
function validateProvinceTerrains(provinces: Province[], terrains: Terrain[], relatedFiles: string[], warnings: WorldMapWarning[]) {
    const terrainMap = arrayToMap(terrains, 'name');
    for (const province of provinces) {
        const terrain = province.terrain;
        const terrainObj = terrainMap[terrain];
        if (!terrainObj) {
            warnings.push({
                source: [{
                    type: 'province',
                    id: province.id,
                    color: province.color,
                }],
                relatedFiles,
                text: localize('worldmap.warnings.terrainnotdefined', 'Terrain "{0}" is not defined.', terrain),
            });
        }
    }
}
function fillAdjacencyEdges(provinces: (Province | undefined)[], adjacencies: ProvinceEdgeAdjacency[], height: number, relatedFiles: string[], warnings: WorldMapWarning[]) {
    for (const { row, from, to, through, start: saveStart, stop: saveStop, rule, type } of adjacencies) {
        if (!provinces[from] || !provinces[to]) {
            warnings.push({
                source: [{ type: 'province', id: from, color: -1 }],
                relatedFiles,
                text: localize('worldmap.warnings.adjacencynotexist', 'Adjacency not from or to an existing province: {0}, {1}', row[0], row[1]),
            });
            continue;
        }
        const resultThrough = through !== undefined && !isNaN(through) && through !== -1 ? through : undefined;
        if (resultThrough && !provinces[resultThrough]) {
            warnings.push({
                source: [{ type: 'province', id: resultThrough, color: -1 }],
                relatedFiles,
                text: localize('worldmap.warnings.adjacencythroughnotexist', 'Adjacency not through an existing province: {0}', row[3]),
            });
            continue;
        }
        const start = saveStart ? { ...saveStart, y: height - saveStart.y } : undefined;
        const stop = saveStop ? { ...saveStop, y: height - saveStop.y } : undefined;
        const existingEdgeInFrom = provinces[from]!.edges.find(e => e.to === to);
        if (existingEdgeInFrom) {
            Object.assign<ProvinceEdge, Partial<ProvinceEdge>>(existingEdgeInFrom, { through: resultThrough, start, stop, rule, type });
        } else {
            provinces[from]!.edges.push({ to, through: resultThrough, start, stop, rule, type, path: [] });
        }
        const existingEdgeInTo = provinces[to]!.edges.find(e => e.to === from);
        if (existingEdgeInTo) {
            Object.assign<ProvinceEdge, Partial<ProvinceEdge>>(existingEdgeInTo, { through: resultThrough, start, stop, rule, type });
        } else {
            provinces[to]!.edges.push({ to: from, through: resultThrough, start: stop, stop: start, rule, type, path: [] });
        }
    }
}
```

## File: src/previewdef/worldmap/worldmapview.html
```html
<!--Inside <body>-->
    <div class="toolbar-outer">
        <div id="topbar" class="toolbar">
            <div class="group">
                <label for="viewmode">%worldmap.topbar.viewmode|View mode: %</label>
                <div class="select-container">
                    <select id="viewmode">
                        <option value="province">%worldmap.topbar.viewmode.province|Province%</option>
                        <option value="state">%worldmap.topbar.viewmode.state|State%</option>
                        <option value="strategicregion">%worldmap.topbar.viewmode.strategicregion|Strategic Region%</option>
                        <option value="supplyarea" enablesupplyarea="true">%worldmap.topbar.viewmode.supplyarea|Supply Area%</option>
                        <option value="warnings">%worldmap.topbar.viewmode.warnings|Warnings%</option>
                    </select>
                </div>
            </div>
            <div class="group">
                <label for="colorset">%worldmap.topbar.colorset|Color set: %</label>
                <div class="select-container">
                    <select id="colorset">
                        <option viewmode="province" value="provinceid">%worldmap.topbar.colorset.provinceid|Province ID%</option>
                        <option viewmode="province state" value="stateid">%worldmap.topbar.colorset.stateid|State ID%</option>
                        <option viewmode="province state supplyarea" value="supplyareaid" enablesupplyarea="true">%worldmap.topbar.colorset.supplyareaid|Supply Area ID%</option>
                        <option viewmode="province state strategicregion" value="strategicregionid">%worldmap.topbar.colorset.strategicregionid|Strategic Region ID%</option>
                        <option viewmode="province state strategicregion supplyarea" value="country">%worldmap.topbar.colorset.country|Country%</option>
                        <option viewmode="province state strategicregion supplyarea" value="provincetype">%worldmap.topbar.colorset.provincetype|Province Type%</option>
                        <option viewmode="province state strategicregion supplyarea" value="terrain">%worldmap.topbar.colorset.terrain|Terrain%</option>
                        <option viewmode="province state strategicregion supplyarea" value="continent">%worldmap.topbar.colorset.continent|Continent%</option>
                        <option viewmode="province state strategicregion supplyarea" value="manpower">%worldmap.topbar.colorset.manpower|Manpower%</option>
                        <option viewmode="province state strategicregion supplyarea" value="victorypoint">%worldmap.topbar.colorset.vicotrypoint|Victory Points%</option>
                        <option viewmode="province state strategicregion supplyarea" value="resources">%worldmap.topbar.colorset.resources|Resources%</option>
                        <option viewmode="province state strategicregion supplyarea" value="supplyvalue" enablesupplyarea="true">%worldmap.topbar.colorset.supplyvalue|Supply Value%</option>
                        <option value="warnings">%worldmap.topbar.colorset.warnings|Warnings%</option>
                    </select>
                </div>
            </div>
            <div class="group">
                <label for="warningfilter">%worldmap.topbar.display|Display: %</label>
                <div class="select-container">
                    <div id="display" class="select multiple-select" tabindex="0" role="combobox">
                        <span class="value"></span>
                        <div class="option" value="edge">%worldmap.topbar.display.border|Show border%</div>
                        <div class="option" value="label">%worldmap.topbar.display.label|Show label%</div>
                        <div class="option" value="tooltip">%worldmap.topbar.display.tooltip|Show tooltip%</div>
                        <div class="option" value="supply" enablesupplyarea="false">%worldmap.topbar.display.supply|Show Supply%</div>
                        <div class="option" value="river">%worldmap.topbar.display.river|Show River%</div>
                        <div class="option" value="mousehighlight">%worldmap.topbar.display.mousehighlight|Mouse highlight%</div>
                        <div class="option" value="fastrending">%worldmap.topbar.display.fastrendering|Fast rendering%</div>
                        <div class="option" value="adaptzooming">%worldmap.topbar.display.adaptzooming|Adapt zooming%</div>
                    </div>
                </div>
            </div>
            <div class="group" viewmode="province state strategicregion supplyarea supply">
                <label for="searchbox">%worldmap.topbar.search|Search: %</label>
                <input id="searchbox" type="text"/>
                <button id="search" title="%worldmap.topbar.search.title|Search%">
                    <i class="codicon codicon-search"></i>
                </button>
            </div>
            <div class="group" viewmode="warnings">
                <label for="warningfilter">%worldmap.topbar.warningfilter|Warning filter: %</label>
                <div class="select-container">
                    <div id="warningfilter" class="select multiple-select" tabindex="0" role="combobox">
                        <span class="value"></span>
                        <div class="option" value="province">%worldmap.topbar.viewmode.province|Province%</div>
                        <div class="option" value="state">%worldmap.topbar.viewmode.state|State%</div>
                        <div class="option" value="strategicregion">%worldmap.topbar.viewmode.strategicregion|Strategic Region%</div>
                        <div class="option" value="supplyarea" enablesupplyarea="true">%worldmap.topbar.viewmode.supplyarea|Supply Area%</div>
                        <div class="option" value="river">%worldmap.topbar.warningfilter.river|River%</div>
                    </div>
                </div>
            </div>
            <div class="group">
                <button id="refresh" title="%worldmap.topbar.refresh.title|Refresh%">
                    <i class="codicon codicon-refresh"></i>
                </button>
                <button id="export" title="%worldmap.export.title|Export as image%">
                    <i class="codicon codicon-export"></i>
                </button>
            </div>
            <div class="group">
                <button id="show-warnings" title="%worldmap.topbar.warnings.title|Toggle warnings%">
                    <i class="codicon codicon-warning"></i>
                </button>
            </div>
            <div class="group" viewmode="state strategicregion supplyarea">
                <button id="open" title="%worldmap.topbar.open.title|Open in workspace%">
                    <i class="codicon codicon-link-external"></i>
                </button>
            </div>
        </div>
    </div>
    <canvas id="main-canvas"></canvas>
    <div id="warnings-container">
        <textarea id="warnings" readonly wrap="off"></textarea>
    </div>
<!--Inside </body>-->
```

## File: src/extension.ts
```typescript
import * as vscode from 'vscode';
import { previewManager } from './previewdef/previewmanager';
import { registerContextContainer, setVscodeContext } from './context';
import { DDSViewProvider, TGAViewProvider } from './ddsviewprovider';
import { registerModFile } from './util/modfile';
import { worldMap } from './previewdef/worldmap';
import { ViewType, ContextName } from './constants';
import { registerTelemetryReporter, sendEvent } from './util/telemetry';
import { registerScanReferencesCommand } from './util/dependency';
import { registerHoiFs } from './util/hoifs';
import { loadI18n } from './util/i18n';
import { registerGfxIndex } from './util/gfxindex';
import { Logger } from "./util/logger";
import { registerLocalisationIndex } from "./util/localisationIndex";
import { registerSharedFocusIndex } from "./util/sharedFocusIndex";
export function activate(context: vscode.ExtensionContext) {
    let locale = (context as any).extension?.packageJSON.locale;
    if (locale === "%hoi4modutilities.locale%") {
        locale = 'en';
    }
    Logger.initialize();
    Logger.show();
    loadI18n(locale);
    // Must register this first because other component may use it.
    context.subscriptions.push(registerContextContainer(context));
    context.subscriptions.push(registerTelemetryReporter());
    sendEvent('extension.activate', { locale, isWeb: IS_WEB_EXT.toString() });
    context.subscriptions.push(previewManager.register());
    context.subscriptions.push(registerModFile());
    context.subscriptions.push(worldMap.register());
    context.subscriptions.push(registerScanReferencesCommand());
    context.subscriptions.push(registerHoiFs());
    context.subscriptions.push(vscode.window.registerCustomEditorProvider(ViewType.DDS, new DDSViewProvider()));
    context.subscriptions.push(vscode.window.registerCustomEditorProvider(ViewType.TGA, new TGAViewProvider()));
    context.subscriptions.push(registerSharedFocusIndex());
    context.subscriptions.push(registerGfxIndex());
    context.subscriptions.push(registerLocalisationIndex());
    if (process.env.NODE_ENV !== 'production') {
        vscode.commands.registerCommand('hoi4modutilities.test', () => {
            const debugModule = require('./util/debug.shouldignore');
            debugModule.testCommand();
        });
        setVscodeContext(ContextName.Hoi4MUInDev, true);
    }
    setVscodeContext(ContextName.Hoi4MULoaded, true);
}
export function deactivate() {}
```

## File: webviewsrc/focustree.ts
```typescript
import { getState, setState, arrayToMap, subscribeNavigators, scrollToState, tryRun, enableZoom } from "./util/common";
import { DivDropdown } from "./util/dropdown";
import { difference, minBy } from "lodash";
import { renderGridBoxCommon, GridBoxItem, GridBoxConnection } from "../src/util/hoi4gui/gridboxcommon";
import { StyleTable, normalizeForStyle } from "../src/util/styletable";
import { FocusTree, Focus } from "../src/previewdef/focustree/schema";
import { applyCondition, ConditionItem } from "../src/hoiformat/condition";
import { NumberPosition } from "../src/util/common";
import { GridBoxType } from "../src/hoiformat/gui";
import { toNumberLike } from "../src/hoiformat/schema";
import { feLocalize } from './util/i18n';
import { Checkbox } from "./util/checkbox";
function showBranch(visibility: boolean, optionClass: string) {
    const elements = document.getElementsByClassName(optionClass);
    const hiddenBranches = getState().hiddenBranches || {};
    if (visibility) {
        delete hiddenBranches[optionClass];
    } else {
        hiddenBranches[optionClass] = true;
    }
    setState({ hiddenBranches: hiddenBranches });
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i] as HTMLDivElement;
        element.style.display = element.className.split(' ').some(b => hiddenBranches[b]) ? "none" : "block";
    }
};
function search(searchContent: string, navigate: boolean = true) {
    const focuses = document.getElementsByClassName('focus');
    const searchedFocus: HTMLDivElement[] = [];
    let navigated = false;
    for (let i = 0; i < focuses.length; i++) {
        const focus = focuses[i] as HTMLDivElement;
        if (searchContent && focus.id.toLowerCase().replace(/^focus_/, '').includes(searchContent)) {
            focus.style.outline = '1px solid #E33';
            focus.style.background = 'rgba(255, 0, 0, 0.5)';
            if (navigate && !navigated) {
                focus.scrollIntoView({ block: "center", inline: "center" });
                navigated = true;
            }
            searchedFocus.push(focus);
        } else {
            focus.style.outlineWidth = '0';
            focus.style.background = 'transparent';
        }
    }
    return searchedFocus;
}
const useConditionInFocus: boolean = (window as any).useConditionInFocus;
const focusTrees: FocusTree[] = (window as any).focusTrees;
let selectedExprs: ConditionItem[] = getState().selectedExprs ?? [];
let selectedFocusTreeIndex: number = Math.min(focusTrees.length - 1, getState().selectedFocusTreeIndex ?? 0);
let allowBranches: DivDropdown | undefined = undefined;
let conditions: DivDropdown | undefined = undefined;
let checkedFocuses: Record<string, Checkbox> = {};
async function buildContent() {
    const focusCheckState = getState().checkedFocuses ?? {};
    const checkedFocusesExprs = Object.keys(focusCheckState)
        .filter(fid => focusCheckState[fid])
        .map(fid => ({ scopeName: '', nodeContent: 'has_completed_focus = ' + fid }));
    clearCheckedFocuses();
    const focustreeplaceholder = document.getElementById('focustreeplaceholder') as HTMLDivElement;
    const styleTable = new StyleTable();
    const renderedFocus: Record<string, string> = (window as any).renderedFocus;
    const focusTree = focusTrees[selectedFocusTreeIndex];
    const focuses = Object.values(focusTree.focuses);
    const allowBranchOptionsValue: Record<string, boolean> = {};
    const exprs = [{ scopeName: '', nodeContent: 'has_focus_tree = ' + focusTree.id }, ...checkedFocusesExprs, ...selectedExprs];
    focusTree.allowBranchOptions.forEach(option => {
        const focus = focusTree.focuses[option];
        allowBranchOptionsValue[option] = !focus || focus.allowBranch === undefined || applyCondition(focus.allowBranch, exprs);
    });
    const gridbox: GridBoxType = (window as any).gridBox;
    const focusPosition: Record<string, NumberPosition> = {};
    calculateFocusAllowed(focusTree, allowBranchOptionsValue);
    const focusGrixBoxItems = focuses.map(focus => focusToGridItem(focus, focusTree, allowBranchOptionsValue, focusPosition, exprs)).filter((v): v is GridBoxItem => !!v);
    const minX = minBy(Object.values(focusPosition), 'x')?.x ?? 0;
    const leftPadding = gridbox.position.x._value - Math.min(minX * (window as any).xGridSize, 0);
    const focusTreeContent = await renderGridBoxCommon({ ...gridbox, position: {...gridbox.position, x: toNumberLike(leftPadding)} }, {
        size: { width: 0, height: 0 },
        orientation: 'upper_left'
    }, {
        styleTable,
        items: arrayToMap(focusGrixBoxItems, 'id'),
        onRenderItem: item => Promise.resolve(
            renderedFocus[item.id]
                .replace('{{position}}', item.gridX + ', ' + item.gridY)
                .replace('{{iconClass}}', getFocusIcon(focusTree.focuses[item.id], exprs, styleTable))
            ),
        cornerPosition: 0.5,
    });
    focustreeplaceholder.innerHTML = focusTreeContent + styleTable.toStyleElement((window as any).styleNonce);
    subscribeNavigators();
    setupCheckedFocuses(focuses, focusTree);
}
function calculateFocusAllowed(focusTree: FocusTree, allowBranchOptionsValue: Record<string, boolean>) {
    const focuses = focusTree.focuses;
    let changed = true;
    while (changed) {
        changed = false;
        for (const key in focuses) {
            const focus = focuses[key];
            if (focus.prerequisite.length === 0) {
                continue;
            }
            if (focus.id in allowBranchOptionsValue) {
                continue;
            }
            let allow = true;
            for (const andPrerequests of focus.prerequisite) {
                if (andPrerequests.length === 0) {
                    continue;
                }
                allow = allow && andPrerequests.some(p => allowBranchOptionsValue[p] === true);
                const deny = andPrerequests.every(p => allowBranchOptionsValue[p] === false);
                if (deny) {
                    allowBranchOptionsValue[focus.id] = false;
                    changed = true;
                    break;
                }
            }
            if (allow) {
                allowBranchOptionsValue[focus.id] = true;
                changed = true;
            }
        }
    }
}
function updateSelectedFocusTree(clearCondition: boolean) {
    const focusTree = focusTrees[selectedFocusTreeIndex];
    const continuousFocuses = document.getElementById('continuousFocuses') as HTMLDivElement;
    if (focusTree.continuousFocusPositionX !== undefined && focusTree.continuousFocusPositionY !== undefined) {
        continuousFocuses.style.left = (focusTree.continuousFocusPositionX - 59) + 'px';
        continuousFocuses.style.top = (focusTree.continuousFocusPositionY + 7) + 'px';
        continuousFocuses.style.display = 'block';
    } else {
        continuousFocuses.style.display = 'none';
    }
    if (useConditionInFocus) {
        const conditionExprs = focusTree.conditionExprs.filter(e => e.scopeName !== '' ||
            (!e.nodeContent.startsWith('has_focus_tree = ') && !e.nodeContent.startsWith('has_completed_focus = ')));
        const conditionContainerElement = document.getElementById('condition-container') as HTMLDivElement | null;
        if (conditionContainerElement) {
            conditionContainerElement.style.display = conditionExprs.length > 0 ? 'block' : 'none';
        }
        if (conditions) {
            conditions.select.innerHTML = `<span class="value"></span>
                ${conditionExprs.map(option =>
                    `<div class="option" value='${option.scopeName}!|${option.nodeContent}'>${option.scopeName ? `[${option.scopeName}]` : ''}${option.nodeContent}</div>`
                ).join('')}`;
            conditions.selectedValues$.next(clearCondition ? [] : selectedExprs.map(e => `${e.scopeName}!|${e.nodeContent}`));
        }
    } else {
        const allowBranchesContainerElement = document.getElementById('allowbranch-container') as HTMLDivElement | null;
        if (allowBranchesContainerElement) {
            allowBranchesContainerElement.style.display = focusTree.allowBranchOptions.length > 0 ? 'block' : 'none';
        }
        if (allowBranches) {
            allowBranches.select.innerHTML = `<span class="value"></span>
                ${focusTree.allowBranchOptions.map(option => `<div class="option" value="inbranch_${option}">${option}</div>`).join('')}`;
            allowBranches.selectAll();
        }
    }
    const warnings = document.getElementById('warnings') as HTMLTextAreaElement | null;
    if (warnings) {
        warnings.value = focusTree.warnings.length === 0 ? feLocalize('worldmap.warnings.nowarnings', 'No warnings.') :
            focusTree.warnings.map(w => `[${w.source}] ${w.text}`).join('\n');
    }
}
function getFocusPosition(
    focus: Focus | undefined,
    positionByFocusId: Record<string, NumberPosition>,
    focusTree: FocusTree,
    focusStack: Focus[] = [],
    exprs: ConditionItem[],
): NumberPosition {
    if (focus === undefined) {
        return { x: 0, y: 0 };
    }
    const cached = positionByFocusId[focus.id];
    if (cached) {
        return cached;
    }
    if (focusStack.includes(focus)) {
        return { x: 0, y: 0 };
    }
    let position: NumberPosition = { x: focus.x, y: focus.y };
    if (focus.relativePositionId !== undefined) {
        focusStack.push(focus);
        const relativeFocusPosition = getFocusPosition(focusTree.focuses[focus.relativePositionId], positionByFocusId, focusTree, focusStack, exprs);
        focusStack.pop();
        position.x += relativeFocusPosition.x;
        position.y += relativeFocusPosition.y;
    }
    for (const offset of focus.offset) {
        if (offset.trigger !== undefined && applyCondition(offset.trigger, exprs)) {
            position.x += offset.x;
            position.y += offset.y;
        }
    }
    positionByFocusId[focus.id] = position;
    return position;
}
function getFocusIcon(focus: Focus, exprs: ConditionItem[], styleTable: StyleTable): string {
    for (const icon of focus.icon) {
        if (applyCondition(icon.condition, exprs)) {
            const iconName = icon.icon;
            return styleTable.name('focus-icon-' + normalizeForStyle(iconName ?? '-empty'));
        }
    }
    return styleTable.name('focus-icon-' + normalizeForStyle('-empty'));
}
function focusToGridItem(
    focus: Focus,
    focustree: FocusTree,
    allowBranchOptionsValue: Record<string, boolean>,
    positionByFocusId: Record<string, NumberPosition>,
    exprs: ConditionItem[],
): GridBoxItem | undefined {
    if (useConditionInFocus) {
        if (allowBranchOptionsValue[focus.id] === false) {
            return undefined;
        }
    }
    const classNames = focus.inAllowBranch.map(v => 'inbranch_' + v).join(' ');
    const connections: GridBoxConnection[] = [];
    for (const prerequisites of focus.prerequisite) {
        let style: string;
        if (prerequisites.length > 1) {
            style = "1px dashed #88aaff";
        } else {
            style = "1px solid #88aaff";
        }
        prerequisites.forEach(p => {
            const fp = focustree.focuses[p];
            const classNames2 = fp?.inAllowBranch.map(v => 'inbranch_' + v).join(' ') ?? '';
            connections.push({
                target: p,
                targetType: 'parent',
                style: style,
                classNames: classNames + ' ' + classNames2,
            });
        });
    }
    focus.exclusive.forEach(e => {
        const fe = focustree.focuses[e];
        const classNames2 = fe?.inAllowBranch.map(v => 'inbranch_' + v).join(' ') ?? '';
        connections.push({
            target: e,
            targetType: 'related',
            style: "1px solid red",
            classNames: classNames + ' ' + classNames2,
        });
    });
    const position = getFocusPosition(focus, positionByFocusId, focustree, [], exprs);
    return {
        id: focus.id,
        htmlId: 'focus_' + focus.id,
        classNames: classNames + ' focus',
        gridX: position.x,
        gridY: position.y,
        connections,
    };
}
function clearCheckedFocuses() {
    for (const focusId in checkedFocuses) {
        checkedFocuses[focusId].dispose();
    }
    checkedFocuses = {};
}
function setupCheckedFocuses(focuses: Focus[], focusTree: FocusTree) {
    const focusCheckState = getState().checkedFocuses ?? {};
    for (const focus of focuses) {
        const checkbox = document.getElementById(`checkbox-${normalizeForStyle(focus.id)}`) as HTMLInputElement;
        if (checkbox) {
            if (focusTree.conditionExprs.some(e => e.scopeName === '' && e.nodeContent === 'has_completed_focus = ' + focus.id)) {
                checkbox.checked = !!focusCheckState[focus.id];
                const checkboxItem = new Checkbox(checkbox);
                checkedFocuses[focus.id] = checkboxItem;
                checkbox.addEventListener('change', async () => {
                    if (checkbox.checked) {
                        for (const exclusiveFocus of focus.exclusive) {
                            const exclusiveCheckbox = checkedFocuses[exclusiveFocus];
                            if (exclusiveCheckbox) {
                                exclusiveCheckbox.input.checked = false;
                                focusCheckState[exclusiveFocus] = false;
                            }
                        }
                    }
                    focusCheckState[focus.id] = checkbox.checked;
                    setState({ checkedFocuses: focusCheckState });
                    const rect = checkbox.getBoundingClientRect();
                    const oldLeft = rect.left, oldTop = rect.top;
                    await buildContent();
                    const newCheckbox = document.getElementById(`checkbox-${normalizeForStyle(focus.id)}`) as HTMLInputElement;
                    if (newCheckbox) {
                        const rect = newCheckbox.getBoundingClientRect();
                        const newLeft = rect.left, newTop = rect.top;
                        window.scrollBy(newLeft - oldLeft, newTop - oldTop);
                    }
                    retriggerSearch();
                });
            } else {
                checkbox.parentElement?.remove();
            }
        }
    }
}
let retriggerSearch: () => void = () => {};
window.addEventListener('load', tryRun(async function() {
    // Focuses
    const focusesElement = document.getElementById('focuses') as HTMLSelectElement | null;
    if (focusesElement) {
        focusesElement.value = selectedFocusTreeIndex.toString();
        focusesElement.addEventListener('change', () => {
            selectedFocusTreeIndex = parseInt(focusesElement.value);
            setState({ selectedFocusTreeIndex });
            updateSelectedFocusTree(true);
        });
    }
    // Allow branch
    if (!useConditionInFocus) {
        const hiddenBranches = getState().hiddenBranches || {};
        for (const key in hiddenBranches) {
            showBranch(false, key);
        }
        const allowBranchesElement = document.getElementById('allowbranch') as HTMLDivElement | null;
        if (allowBranchesElement) {
            allowBranches = new DivDropdown(allowBranchesElement, true);
            allowBranches.selectAll();
            const allValues = allowBranches.selectedValues$.value;
            allowBranches.selectedValues$.next(allValues.filter(v => !hiddenBranches[v]));
            let oldSelection = allowBranches.selectedValues$.value;
            allowBranches.selectedValues$.subscribe(selection => {
                const showBranches = difference(selection, oldSelection);
                showBranches.forEach(s => showBranch(true, s));
                const hideBranches = difference(oldSelection, selection);
                hideBranches.forEach(s => showBranch(false, s));
                oldSelection = selection;
                const hiddenBranches = difference(allValues, selection);
                setState({ hiddenBranches });
            });
        }
    }
    // Searchbox
    const searchbox = document.getElementById('searchbox') as HTMLInputElement;
    let currentNavigatedIndex = 0;
    let oldSearchboxValue: string = getState().searchboxValue || '';
    let searchedFocus: HTMLDivElement[] = search(oldSearchboxValue, false);
    searchbox.value = oldSearchboxValue;
    const searchboxChangeFunc = function(this: HTMLInputElement) {
        const searchboxValue = this.value.toLowerCase();
        if (oldSearchboxValue !== searchboxValue) {
            currentNavigatedIndex = 0;
            searchedFocus = search(searchboxValue);
            oldSearchboxValue = searchboxValue;
            setState({ searchboxValue });
        }
    };
    searchbox.addEventListener('change', searchboxChangeFunc);
    searchbox.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const visibleSearchedFocus = searchedFocus.filter(f => f.style.display !== 'none');
            if (visibleSearchedFocus.length > 0) {
                currentNavigatedIndex = (currentNavigatedIndex + (e.shiftKey ? visibleSearchedFocus.length - 1 : 1)) % visibleSearchedFocus.length;
                visibleSearchedFocus[currentNavigatedIndex].scrollIntoView({ block: "center", inline: "center" });
            }
        } else {
            searchboxChangeFunc.apply(this);
        }
    });
    searchbox.addEventListener('keyup', searchboxChangeFunc);
    searchbox.addEventListener('paste', searchboxChangeFunc);
    searchbox.addEventListener('cut', searchboxChangeFunc);
    retriggerSearch = () => { searchedFocus = search(oldSearchboxValue, false); };
    // Conditions
    if (useConditionInFocus) {
        const conditionsElement = document.getElementById('conditions') as HTMLDivElement | null;
        if (conditionsElement) {
            conditions = new DivDropdown(conditionsElement, true);
            conditions.selectedValues$.next(selectedExprs.map(e => `${e.scopeName}!|${e.nodeContent}`));
            conditions.selectedValues$.subscribe(async (selection) => {
                selectedExprs = selection.map<ConditionItem>(selection => {
                    const index = selection.indexOf('!|');
                    if (index === -1) {
                        return {
                            scopeName: '',
                            nodeContent: selection,
                        };
                    } else {
                        return {
                            scopeName: selection.substring(0, index),
                            nodeContent: selection.substring(index + 2),
                        };
                    }
                });
                setState({ selectedExprs });
                await buildContent();
                retriggerSearch();
            });
        }
    }
    // Zoom
    const contentElement = document.getElementById('focustreecontent') as HTMLDivElement;
    enableZoom(contentElement, 0, 40);
    // Toggle warnings
    const showWarnings = document.getElementById('show-warnings') as HTMLButtonElement;
    if (showWarnings) {
        const warnings = document.getElementById('warnings-container') as HTMLDivElement;
        showWarnings.addEventListener('click', () => {
            const visible = warnings.style.display === 'block';
            document.body.style.overflow = visible ? '' : 'hidden';
            warnings.style.display = visible ? 'none' : 'block';
        });
    }
    updateSelectedFocusTree(false);
    await buildContent();
    scrollToState();
}));
```

## File: webviewsrc/worldmap/renderer.ts
```typescript
import { Province, Point, State, Zone, Terrain, StrategicRegion, SupplyArea } from "../../src/previewdef/worldmap/definitions";
import { FEWorldMap, Loader } from "./loader";
import { ViewPoint } from "./viewpoint";
import { bboxCenter, distanceSqr, distanceHamming } from "./graphutils";
import { TopBar, topBarHeight, ColorSet, ViewMode } from "./topbar";
import { Subscriber } from "../util/event";
import { arrayToMap } from "../util/common";
import { feLocalize } from "../util/i18n";
import { chain, max, padStart } from "lodash";
import { combineLatest, fromEvent } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
const landWarning = 0xE02020;
const landNoWarning = 0x7FFF7F;
const waterWarning = 0xC00000;
const waterNoWarning = 0x20E020;
const renderScaleByViewMode: Record<ViewMode, { edge: number, labels: number }> = {
    province: { edge: 2, labels: 3 },
    state: { edge: 1, labels: 1 },
    strategicregion: { edge: 0.25, labels: 0.25 },
    supplyarea: { edge: 0.5, labels: 1 },
    warnings: { edge: 2, labels: 3 },
};
interface RenderContext {
    topBar: TopBar;
    viewPoint: ViewPoint;
    mapCanvasContext: CanvasRenderingContext2D;
    provinceToState: Record<number, number | undefined>;
    provinceToStrategicRegion: Record<number, number | undefined>;
    stateToSupplyArea: Record<number, number | undefined>;
    renderedProvincesByOffset: Record<number, Province[]>;
    renderedProvincesById: Record<number, Province>;
    renderedProvinces?: Province[];
    overwriteRenderPrecision?: number;
    preciseEdge?: boolean;
    extraState: any;
}
export class Renderer extends Subscriber {
    private canvasWidth: number = 0;
    private canvasHeight: number = 0;
    private backCanvas: HTMLCanvasElement;
    private mapCanvas: HTMLCanvasElement;
    private mainCanvasContext: CanvasRenderingContext2D;
    private backCanvasContext: CanvasRenderingContext2D;
    private cursorX = 0;
    private cursorY = 0;
    private static resourceImages: Record<string, HTMLImageElement | undefined> = {};
    constructor(private mainCanvas: HTMLCanvasElement, private viewPoint: ViewPoint, private loader: Loader, private topBar: TopBar) {
        super();
        this.addSubscription(fromEvent(window, 'resize').subscribe(this.resizeCanvas));
        this.mainCanvasContext = this.mainCanvas.getContext('2d')!;
        this.backCanvas = document.createElement('canvas');
        this.backCanvasContext = this.backCanvas.getContext('2d')!;
        this.mapCanvas = document.createElement('canvas');
        this.registerCanvasEventHandlers();
        this.resizeCanvas();
        this.addSubscription(loader.worldMap$.subscribe(this.reloadImages));
        this.addSubscription(loader.worldMap$.subscribe(this.renderCanvas));
        this.addSubscription(
            combineLatest([
                loader.progress$,
                viewPoint.observable$,
                topBar.viewMode$,
                topBar.colorSet$,
                topBar.hoverProvinceId$,
                topBar.selectedProvinceId$,
                topBar.hoverStateId$,
                topBar.selectedStateId$,
                topBar.hoverStrategicRegionId$,
                topBar.selectedStrategicRegionId$,
                topBar.hoverSupplyAreaId$,
                topBar.selectedSupplyAreaId$,
                topBar.warningFilter.selectedValues$,
                topBar.display.selectedValues$,
            ]).pipe(
                distinctUntilChanged((x, y) => x.every((v, i) => v === y[i]))
            ).subscribe(this.renderCanvas)
        );
    }
    private reloadImages = () => {
        for (const resource of this.loader.worldMap.resources) {
            const image = new Image();
            image.onload = () => {
                Renderer.resourceImages[resource.name] = image;
            };
            image.src = resource.imageUri;
        }
    };
    public renderCanvas = () => {
        if (this.canvasWidth <= 0 && this.canvasHeight <= 0) {
            return;
        }
        const backCanvasContext = this.backCanvasContext;
        backCanvasContext.fillStyle = 'black';
        backCanvasContext.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        backCanvasContext.fillStyle = 'white';
        backCanvasContext.font = '12px sans-serif';
        this.renderMap();
        backCanvasContext.drawImage(this.mapCanvas, 0, 0);
        const viewMode = this.topBar.viewMode$.value;
        switch (viewMode) {
            case 'province':
            case 'warnings':
                this.renderProvinceHoverSelection(this.loader.worldMap);
                break;
            case 'state':
                this.renderStateHoverSelection(this.loader.worldMap);
                break;
            case 'strategicregion':
                this.renderStrategicRegionHoverSelection(this.loader.worldMap);
                break;
            case 'supplyarea':
                this.renderSupplyAreaHoverSelection(this.loader.worldMap);
                break;
        }
        if (this.loader.progressText !== '') {
            this.renderLoadingText(this.loader.progressText);
        } else if (this.loader.loading$.value) {
            this.renderLoadingText(feLocalize('worldmap.progress.visualizing', 'Visualizing map data: {0}', Math.round(this.loader.progress * 100) + '%'));
        }
        this.mainCanvasContext.drawImage(this.backCanvas, 0, 0);
    };
    private resizeCanvas = () => {
        this.canvasWidth = this.mainCanvas.width = this.mapCanvas.width = this.backCanvas.width = window.innerWidth;
        this.canvasHeight = this.mainCanvas.height = this.mapCanvas.height = this.backCanvas.height = window.innerHeight;
        this.renderCanvas();
    };
    private oldMapState: any = undefined;
    private renderMap() {
        const worldMap = this.loader.worldMap;
        const displayOptions = this.topBar.display.selectedValues$.value;
        const newMapState = {
            worldMap,
            canvasWidth: this.canvasWidth,
            canvasHeight: this.canvasHeight,
            viewMode: this.topBar.viewMode$.value,
            colorSet: this.topBar.colorSet$.value,
            warningFilter: this.topBar.warningFilter.selectedValues$.value,
            edgeVisible: displayOptions.includes('edge'),
            labelVisible: displayOptions.includes('label'),
            adaptZooming: displayOptions.includes('adaptzooming'),
            fastRendering: displayOptions.includes('fastrending'),
            supplyVisible: displayOptions.includes('supply'),
            riverVisible: displayOptions.includes('river'),
            ...this.viewPoint.toJson(),
        };
        // State not changed
        if (this.oldMapState !== undefined && Object.keys(newMapState).every(k => this.oldMapState[k] === (newMapState as any)[k])) {
            return;
        }
        this.oldMapState = newMapState;
        Renderer.renderMapImpl(this.mapCanvas, this.topBar, this.viewPoint, worldMap,
            newMapState.fastRendering ? {} : { preciseEdge: true, overwriteRenderPrecision: 1 });
    }
    public static renderMapImpl(canvas: HTMLCanvasElement, topBar: TopBar, viewPoint: ViewPoint, worldMap: FEWorldMap, otherRenderContext?: Partial<RenderContext>) {
        const mapCanvasContext = canvas.getContext('2d')!;
        mapCanvasContext.fillStyle = 'black';
        mapCanvasContext.fillRect(0, 0, canvas.width, canvas.height);
        const renderContext: RenderContext = {
            topBar,
            viewPoint,
            mapCanvasContext,
            provinceToState: worldMap.getProvinceToStateMap(),
            provinceToStrategicRegion: worldMap.getProvinceToStrategicRegionMap(),
            stateToSupplyArea: worldMap.getStateToSupplyAreaMap(),
            renderedProvincesByOffset: {},
            renderedProvincesById: {},
            extraState: undefined,
            ...otherRenderContext,
        };
        const mapZone: Zone = { x: 0, y: 0, w: worldMap.width, h: worldMap.height };
        Renderer.renderAllOffsets(viewPoint, mapZone, worldMap.width, xOffset => Renderer.renderMapBackground(worldMap, xOffset, renderContext));
        renderContext.renderedProvinces = Object.values(renderContext.renderedProvincesById);
        Renderer.renderAllOffsets(viewPoint, mapZone, worldMap.width, xOffset => Renderer.renderMapForeground(worldMap, xOffset, renderContext));
    }
    private static renderMapBackground(worldMap: FEWorldMap, xOffset: number, renderContext: RenderContext) {
        const { mapCanvasContext: context, topBar, viewPoint, overwriteRenderPrecision } = renderContext;
        const scale = viewPoint.scale;
        const renderedProvinces = renderContext.renderedProvincesByOffset[xOffset] ?? [];
        const { renderedProvincesById } = renderContext;
        renderContext.renderedProvincesByOffset[xOffset] = renderedProvinces;
        const edgeVisible = Renderer.isEdgeVisible(topBar, viewPoint);
        worldMap.forEachProvince(province => {
            if (renderContext.viewPoint.bboxInView(province.boundingBox, xOffset)) {
                const color = getColorByColorSet(topBar.colorSet$.value, province, worldMap, renderContext);
                context.fillStyle = toColor(color);
                Renderer.renderProvince(viewPoint, context, province, scale, xOffset, overwriteRenderPrecision);
                renderedProvinces.push(province);
                renderedProvincesById[province.id] = province;
            }
            if (edgeVisible) {
                for (const edge of province.edges) {
                    if (edge.path.length > 0) {
                        continue;
                    }
                    const toProvince = worldMap.getProvinceById(edge.to);
                    if (!toProvince) {
                        continue;
                    }
                    const [startPoint, endPoint] = findNearestPoints(edge.start, edge.stop, province, toProvince);
                    if (renderContext.viewPoint.lineInView(startPoint, endPoint, xOffset)) {
                        if (!(province.id in renderedProvincesById)) {
                            renderedProvinces.push(province);
                            renderedProvincesById[province.id] = province;
                        }
                        if (!(edge.to in renderedProvincesById)) {
                            renderedProvinces.push(toProvince);
                            renderedProvincesById[edge.to] = toProvince;
                        }
                    }
                }
            }
        });
    }
    private static renderMapForeground(worldMap: FEWorldMap, xOffset: number, renderContext: RenderContext) {
        const { mapCanvasContext: context, topBar, viewPoint } = renderContext;
        if (Renderer.isRiverVisible(topBar, viewPoint)) {
            Renderer.renderRivers(renderContext, worldMap, context, xOffset);
        }
        if (Renderer.isEdgeVisible(topBar, viewPoint)) {
            Renderer.renderAllEdges(renderContext, worldMap, context, xOffset);
        }
        if (Renderer.isSupplyVisible(topBar)) {
            Renderer.renderSupplyRelated(renderContext, worldMap, context, xOffset);
        }
        if (Renderer.isLabelVisible(topBar, viewPoint)) {
            Renderer.renderMapLabels(renderContext, worldMap, context, xOffset);
        }
    }
    private static isEdgeVisible(topBar: TopBar, viewPoint: ViewPoint) {
        if (topBar.display.selectedValues$.value.includes('adaptzooming')) {
            const viewMode = topBar.viewMode$.value;
            const renderScale = renderScaleByViewMode[viewMode];
            const scale = viewPoint.scale;
            return renderScale.edge <= scale && topBar.display.selectedValues$.value.includes('edge');
        }
        return topBar.display.selectedValues$.value.includes('edge');
    }
    private static isLabelVisible(topBar: TopBar, viewPoint: ViewPoint) {
        if (topBar.display.selectedValues$.value.includes('adaptzooming')) {
            const viewMode = topBar.viewMode$.value;
            const renderScale = renderScaleByViewMode[viewMode];
            const scale = viewPoint.scale;
            return renderScale.labels <= scale && topBar.display.selectedValues$.value.includes('label');
        }
        return topBar.display.selectedValues$.value.includes('label');
    }
    private isMouseHighlightVisible() {
        return this.topBar.display.selectedValues$.value.includes('mousehighlight');
    }
    private isTooltipVisible() {
        return this.topBar.display.selectedValues$.value.includes('tooltip');
    }
    private static isSupplyVisible(topBar: TopBar) {
        return topBar.display.selectedValues$.value.includes('supply');
    }
    private static isRiverVisible(topBar: TopBar, viewPoint: ViewPoint) {
        if (topBar.display.selectedValues$.value.includes('adaptzooming')) {
            return 1 <= viewPoint.scale && topBar.display.selectedValues$.value.includes('river');
        }
        return topBar.display.selectedValues$.value.includes('river');
    }
    private static renderAllEdges(renderContext: RenderContext, worldMap: FEWorldMap, context: CanvasRenderingContext2D, xOffset: number) {
        const renderedProvinces = renderContext.renderedProvincesByOffset[xOffset] ?? [];
        const preciseEdge = renderContext.preciseEdge;
        context.strokeStyle = 'black';
        context.beginPath();
        for (const province of renderedProvinces) {
            Renderer.renderEdges(renderContext, province, worldMap, context, xOffset, false, preciseEdge);
        }
        context.stroke();
        context.strokeStyle = 'red';
        context.beginPath();
        for (const province of renderedProvinces) {
            Renderer.renderEdges(renderContext, province, worldMap, context, xOffset, true, preciseEdge);
        }
        context.stroke();
    }
    private static renderMapLabels(renderContext: RenderContext, worldMap: FEWorldMap, context: CanvasRenderingContext2D, xOffset: number) {
        const { provinceToState, provinceToStrategicRegion, stateToSupplyArea, topBar, viewPoint } = renderContext;
        const renderedProvinces = renderContext.renderedProvincesByOffset[xOffset] ?? [];
        const viewMode = topBar.viewMode$.value;
        const colorSet = topBar.colorSet$.value;
        const showSupply = Renderer.isSupplyVisible(topBar);
        context.font = '10px sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        if (viewMode === 'province' || viewMode === 'warnings') {
            for (const province of renderedProvinces) {
                const provinceColor = showSupply && worldMap.getSupplyNodeByProvinceId(province.id) ? 0xFF0000 :
                    getColorByColorSet(colorSet, province, worldMap, renderContext);
                context.fillStyle = toColor(getHighConstrastColor(provinceColor));
                const labelPosition = province.centerOfMass;
                context.fillText(province.id.toString(), viewPoint.convertX(labelPosition.x + xOffset), viewPoint.convertY(labelPosition.y));
            }
        } else {
            const renderedRegions: Record<number, boolean> = {};
            const regionMap = viewMode === 'state' ? provinceToState : provinceToStrategicRegion;
            const getRegionById = viewMode === 'state' ? worldMap.getStateById : viewMode === 'supplyarea' ? worldMap.getSupplyAreaById : worldMap.getStrategicRegionById;
            for (const province of renderedProvinces) {
                const stateId = viewMode === 'supplyarea' ? provinceToState[province.id] : undefined;
                const regionId = viewMode === 'supplyarea' ? (stateId !== undefined ? stateToSupplyArea[stateId] : undefined) : regionMap[province.id];
                if (regionId !== undefined && !renderedRegions[regionId]) {
                    renderedRegions[regionId] = true;
                    const region = getRegionById(regionId);
                    if (region) {
                        const labelPosition = region.centerOfMass;
                        const provinceAtLabel = worldMap.getProvinceByPosition(labelPosition.x, labelPosition.y);
                        const provinceColor = getColorByColorSet(colorSet, provinceAtLabel ?? province, worldMap, renderContext);
                        context.fillStyle = toColor(getHighConstrastColor(provinceColor));
                        context.fillText(region.id.toString(), viewPoint.convertX(labelPosition.x + xOffset), viewPoint.convertY(labelPosition.y));
                        if (viewMode === 'state' && colorSet === 'resources') {
                            const { width } = Renderer.getResourcesSize(region as State, 0.7, 16);
                            Renderer.renderResources(context, region as State, viewPoint.convertX(labelPosition.x + xOffset) - width / 2, viewPoint.convertY(labelPosition.y) + 5, 0.7, 16);
                        }
                    }
                }
            }
        }
    }
    private static renderEdges(
        renderContext: RenderContext,
        province: Province,
        worldMap: FEWorldMap,
        context: CanvasRenderingContext2D,
        xOffset: number,
        isRed: boolean,
        preciseEdge?: boolean,
    ) {
        const { provinceToState, provinceToStrategicRegion, stateToSupplyArea, renderedProvinces, topBar, viewPoint } = renderContext;
        const scale = viewPoint.scale;
        const viewMode = topBar.viewMode$.value;
        context.lineWidth = 2;
        for (const provinceEdge of province.edges) {
            if (!('path' in provinceEdge)) {
                continue;
            }
            if (provinceEdge.to > province.id) {
                continue;
            }
            const stateFromId = provinceToState[province.id];
            const stateToId = provinceToState[provinceEdge.to];
            const stateFromImpassable = worldMap.getStateById(stateFromId)?.impassable ?? false;
            const stateToImpassable = worldMap.getStateById(stateToId)?.impassable ?? false;
            const impassable = provinceEdge.type === 'impassable' || stateFromImpassable !== stateToImpassable;
            const paths = provinceEdge.path;
            if ((impassable || (paths.length === 0 && provinceEdge.type !== 'impassable')) !== isRed) {
                continue;
            }
            const strategicRegionFromId = provinceToStrategicRegion[province.id];
            const strategicRegionToId = provinceToStrategicRegion[provinceEdge.to];
            if (!impassable && paths.length > 0) {
                if (viewMode === 'state') {
                    if (stateFromId === stateToId && (stateFromId !== undefined || strategicRegionFromId === strategicRegionToId)) {
                        continue;
                    }
                } else if (viewMode === 'strategicregion') {
                    if (strategicRegionFromId === strategicRegionToId) {
                        continue;
                    }
                } else if (viewMode === 'supplyarea') {
                    if ((stateFromId === stateToId && (stateFromId !== undefined || strategicRegionFromId === strategicRegionToId)) ||
                        (stateFromId !== undefined && stateToId !== undefined && stateToSupplyArea[stateFromId] === stateToSupplyArea[stateToId])
                        ) {
                        continue;
                    }
                }
            }
            for (const path of paths) {
                if (path.length === 0) {
                    continue;
                }
                context.moveTo(viewPoint.convertX(path[0].x + xOffset), viewPoint.convertY(path[0].y));
                for (let j = 0; j < path.length; j++) {
                    if (!preciseEdge && scale <= 4 && j % (scale < 1 ? Math.floor(10 / scale) : 6 - scale) !== 0 && !isCriticalPoint(path, j)) {
                        continue;
                    }
                    const pos = path[j];
                    context.lineTo(viewPoint.convertX(pos.x + xOffset), viewPoint.convertY(pos.y));
                }
            }
            if (paths.length === 0 && provinceEdge.type !== 'impassable') {
                const toProvince = renderedProvinces?.find(p => p.id === provinceEdge.to);
                const [startPoint, endPoint] = findNearestPoints(provinceEdge.start, provinceEdge.stop, province, toProvince);
                context.moveTo(viewPoint.convertX(startPoint.x + xOffset), viewPoint.convertY(startPoint.y));
                context.lineTo(viewPoint.convertX(endPoint.x + xOffset), viewPoint.convertY(endPoint.y));
            }
        }
    }
    private static renderSupplyRelated(
        renderContext: RenderContext,
        worldMap: FEWorldMap,
        context: CanvasRenderingContext2D,
        xOffset: number
    ): void {
        const { renderedProvincesById, viewPoint } = renderContext;
        context.strokeStyle = 'rgb(200, 0, 0)';
        worldMap.forEachRailway(railway => {
            if (railway.provinces.every(id => !renderedProvincesById[id])) {
                return;
            }
            context.beginPath();
            context.lineWidth = Math.min(10, 2 * railway.level);
            let hasProvince = false;
            for (let i = 0; i < railway.provinces.length; i++) {
                const province = worldMap.getProvinceById(railway.provinces[i]);
                if (province) {
                    if (!hasProvince) {
                        context.moveTo(viewPoint.convertX(province.centerOfMass.x + xOffset), viewPoint.convertY(province.centerOfMass.y));
                    } else {
                        context.lineTo(viewPoint.convertX(province.centerOfMass.x + xOffset), viewPoint.convertY(province.centerOfMass.y));
                    }
                    hasProvince = true;
                } else {
                    context.stroke();
                    hasProvince = false;
                }
            }
            if (hasProvince) {
                context.stroke();
            }
        });
        context.fillStyle = 'rgb(200, 0, 0)';
        const size = Math.min(30, viewPoint.scale * 10);
        worldMap.forEachSupplyNode(supplyNode => {
            const province = renderedProvincesById[supplyNode.province];
            if (province) {
                const x = viewPoint.convertX(province.centerOfMass.x + xOffset);
                const y = viewPoint.convertY(province.centerOfMass.y);
                context.fillRect(x - size / 2, y - size / 2, size, size);
            }
        });
    }
    private static renderRivers(
        renderContext: RenderContext,
        worldMap: FEWorldMap,
        context: CanvasRenderingContext2D,
        xOffset: number
    ): void {
        const { viewPoint, topBar } = renderContext;
        const showRiverWarning = topBar.colorSet$.value === 'warnings' && topBar.warningFilter.selectedValues$.value.includes('river');
        const riverColors: string[] = [
            'rgb(0, 255, 0)',
            'rgb(255, 0, 0)',
            'rgb(255, 252, 0)',
            'rgb(0, 225, 255)',
            'rgb(0, 200, 255)',
            'rgb(0, 150, 255)',
            'rgb(0, 100, 255)',
            'rgb(0, 0, 255)',
            'rgb(0, 0, 255)',
            'rgb(0, 0, 200)',
            'rgb(0, 0, 150)',
            'rgb(0, 0, 100)',
        ];
        const warningColor = toColor(waterWarning);
        for (let i = 0; i < worldMap.rivers.length; i++) {
            const river = worldMap.rivers[i];
            if (!viewPoint.bboxInView(river.boundingBox, xOffset)) {
                continue;
            }
            const hasWarning = showRiverWarning && worldMap.getRiverWarnings(i).length > 0;
            for (const key in river.colors) {
                const index = parseInt(key, 10);
                const x = index % river.boundingBox.w + river.boundingBox.x;
                const y = Math.floor(index / river.boundingBox.w) + river.boundingBox.y;
                const color = river.colors[key];
                context.fillStyle = hasWarning && color >= 3 ? warningColor : riverColors[color];
                context.fillRect(viewPoint.convertX(x + xOffset), viewPoint.convertY(y), viewPoint.scale, viewPoint.scale);
            }
        }
    }
    private static renderProvince(
        viewPoint: ViewPoint,
        context: CanvasRenderingContext2D,
        province: Province,
        scale?: number,
        xOffset: number = 0,
        overwriteRenderPrecision?: number
    ): void {
        scale = scale ?? viewPoint.scale;
        const renderPrecisionBase = 2;
        const renderPrecision = 
            scale < 1 ? Math.pow(2, Math.floor(Math.log2((1 / scale))) + (overwriteRenderPrecision !== undefined ? 0 : renderPrecisionBase)) :
            overwriteRenderPrecision ?? (scale <= renderPrecisionBase ? Math.pow(2, renderPrecisionBase + 1 - Math.round(scale)) : 1);
        const renderPrecisionMask = renderPrecision - 1;
        const renderPrecisionOffset = (renderPrecision - 1) / 2;
        for (const zone of province.coverZones) {
            if (zone.w < renderPrecision) {
                if ((zone.x & renderPrecisionMask) === 0 && (zone.y & renderPrecisionMask) === 0) {
                    context.fillRect(
                        viewPoint.convertX(zone.x + xOffset - renderPrecisionOffset),
                        viewPoint.convertY(zone.y - renderPrecisionOffset),
                        renderPrecision * scale,
                        renderPrecision * scale);
                }
            } else {
                context.fillRect(
                    viewPoint.convertX(zone.x + xOffset - renderPrecisionOffset),
                    viewPoint.convertY(zone.y - renderPrecisionOffset),
                    zone.w * scale,
                    zone.h * scale);
            }
        }
    }
    private renderProvince(context: CanvasRenderingContext2D, province: Province, scale?: number, xOffset: number = 0): void {
        Renderer.renderProvince(this.viewPoint, context, province, scale, xOffset);
    }
    private registerCanvasEventHandlers() {
        this.addSubscription(fromEvent<MouseEvent>(this.mainCanvas, 'mousemove').subscribe((e) => {
            this.cursorX = e.pageX;
            this.cursorY = e.pageY;
            this.renderCanvas();
        }));
    }
    private renderHoverProvince(province: Province, worldMap: FEWorldMap, renderAdjacent: boolean = true) {
        const backCanvasContext = this.backCanvasContext;
        const viewPoint = this.viewPoint;
        backCanvasContext.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.renderAllOffsets(province.boundingBox, worldMap.width, xOffset =>
            this.renderProvince(backCanvasContext, province, viewPoint.scale, xOffset));
        if (!renderAdjacent) {
            return;
        }
        for (const adjecent of province.edges) {
            const adjecentNumber = adjecent.to;
            if (adjecentNumber === -1 || adjecent.type === 'impassable') {
                continue;
            }
            const adjecentProvince = worldMap.getProvinceById(adjecentNumber);
            if (adjecentProvince) {
                backCanvasContext.fillStyle = 'rgba(255, 255, 255, 0.3)';
                this.renderAllOffsets(adjecentProvince.boundingBox, worldMap.width, xOffset =>
                    this.renderProvince(backCanvasContext, adjecentProvince, viewPoint.scale, xOffset));
            }
        }
    }
    private renderSelectedProvince(province: Province, worldMap: FEWorldMap) {
        this.backCanvasContext.fillStyle = 'rgba(128, 255, 128, 0.7)';
        this.renderAllOffsets(province.boundingBox, worldMap.width, xOffset =>
            this.renderProvince(this.backCanvasContext, province, this.viewPoint.scale, xOffset));
    }
    private renderProvinceTooltip(province: Province, worldMap: FEWorldMap) {
        const stateObject = worldMap.getStateByProvinceId(province.id);
        const strategicRegion = worldMap.getStrategicRegionByProvinceId(province.id);
        const supplyArea = stateObject ? worldMap.getSupplyAreaByStateId(stateObject.id) : undefined;
        const railwayLevel = worldMap.getRailwayLevelByProvinceId(province.id);
        const supplyNode = worldMap.getSupplyNodeByProvinceId(province.id);
        const vp = stateObject?.victoryPoints[province.id];
        this.renderTooltip(`
${stateObject?.impassable ? '|r|' + feLocalize('worldmap.tooltip.impassable', 'Impassable') : ''}
${feLocalize('worldmap.tooltip.province', 'Province')}=${province.id}
${vp ? `${feLocalize('worldmap.tooltip.victorypoint', 'Victory point')}=${vp}` : ''}
${stateObject ? `
${feLocalize('worldmap.tooltip.state', 'State')}=${stateObject.id}`: ''
}
${supplyArea ? `
${feLocalize('worldmap.tooltip.supplyarea', 'Supply area')}=${supplyArea.id}
` : ''}
${railwayLevel ? `
${feLocalize('worldmap.tooltip.railwaylevel', 'Railway level')}=${railwayLevel}
` : ''}
${supplyNode ? `
${feLocalize('worldmap.tooltip.supplynode', 'Supply node')}=true
` : ''}
${strategicRegion ? `
${feLocalize('worldmap.tooltip.strategicregion', 'Strategic region')}=${strategicRegion.id}
`: ''
}
${stateObject ? `
${feLocalize('worldmap.tooltip.owner', 'Owner')}=${stateObject.owner}
${feLocalize('worldmap.tooltip.coreof', 'Core of')}=${stateObject.cores.join(',')}
${feLocalize('worldmap.tooltip.manpower', 'Manpower')}=${toCommaDivideNumber(stateObject.manpower)}` : ''
}
${supplyArea ? `
${feLocalize('worldmap.tooltip.supplyvalue', 'Supply value')}=${supplyArea.value}
` : ''}
${feLocalize('worldmap.tooltip.type', 'Type')}=${province.type}
${feLocalize('worldmap.tooltip.terrain', 'Terrain')}=${province.terrain}
${strategicRegion && strategicRegion.navalTerrain ? `
${feLocalize('worldmap.tooltip.navalterrain', 'Naval terrain')}=${strategicRegion.navalTerrain}
`: ''
}
${feLocalize('worldmap.tooltip.coastal', 'Coastal')}=${province.coastal}
${feLocalize('worldmap.tooltip.continent', 'Continent')}=${province.continent !== 0 ? `${worldMap.continents[province.continent]}(${province.continent})` : '0'}
${feLocalize('worldmap.tooltip.adjacencies', 'Adjecencies')}=${province.edges.filter(e => e.type !== 'impassable' && e.to !== -1).map(e => e.to).join(',')}
${worldMap.getProvinceWarnings(province, stateObject, strategicRegion, supplyArea).map(v => '|r|' + v).join('\n')}`
        );
    }
    private renderLoadingText(text: string) {
        const backCanvasContext = this.backCanvasContext;
        backCanvasContext.font = '12px sans-serif';
        const mesurement = backCanvasContext.measureText(text);
        backCanvasContext.fillStyle = 'black';
        backCanvasContext.fillRect(0, topBarHeight, 20 + mesurement.width, 32);
        backCanvasContext.fillStyle = 'white';
        backCanvasContext.textAlign = 'start';
        backCanvasContext.textBaseline = 'top';
        backCanvasContext.fillText(text, 10, 10 + topBarHeight);
    }
    private renderProvinceHoverSelection(worldMap: FEWorldMap) {
        let province = worldMap.getProvinceById(this.topBar.selectedProvinceId$.value);
        if (province) {
            this.renderSelectedProvince(province, worldMap);
        }
        province = worldMap.getProvinceById(this.topBar.hoverProvinceId$.value);
        if (province) {
            if (this.topBar.selectedProvinceId$ !== this.topBar.hoverProvinceId$ && this.isMouseHighlightVisible()) {
                this.renderHoverProvince(province, worldMap);
            }
            if (this.isTooltipVisible()) {
                this.renderProvinceTooltip(province, worldMap);
            }
        }
    }
    private renderStateHoverSelection(worldMap: FEWorldMap) {
        const hover = worldMap.getStateById(this.topBar.hoverStateId$.value);
        this.renderHoverSelection(worldMap, hover, worldMap.getStateById(this.topBar.selectedStateId$.value));
        hover && this.isTooltipVisible() && this.renderStateTooltip(hover, worldMap);
    }
    private renderStrategicRegionHoverSelection(worldMap: FEWorldMap) {
        const hover = worldMap.getStrategicRegionById(this.topBar.hoverStrategicRegionId$.value);
        this.renderHoverSelection(worldMap, hover, worldMap.getStrategicRegionById(this.topBar.selectedStrategicRegionId$.value));
        hover && this.isTooltipVisible() && this.renderStrategicRegionTooltip(hover, worldMap);
    }
    private renderSupplyAreaHoverSelection(worldMap: FEWorldMap) {
        const hover = worldMap.getSupplyAreaById(this.topBar.hoverSupplyAreaId$.value);
        const selected = worldMap.getSupplyAreaById(this.topBar.selectedSupplyAreaId$.value);
        const toProvinces = (supplyArea: SupplyArea | undefined) => {
            return supplyArea ?
                {
                    provinces: chain(supplyArea.states)
                        .map(stateId => worldMap.getStateById(stateId)?.provinces)
                        .filter((v): v is number[] => !!v)
                        .flatten()
                        .value()
                } :
                undefined;
        };
        this.renderHoverSelection(worldMap, toProvinces(hover), toProvinces(selected));
        hover && this.isTooltipVisible() && this.renderSupplyAreaTooltip(hover, worldMap);
    }
    private renderHoverSelection(worldMap: FEWorldMap, hover: { provinces: number[] } | undefined, selected: { provinces: number[] } | undefined) {
        if (selected) {
            for (const provinceId of selected.provinces) {
                const province = worldMap.getProvinceById(provinceId);
                if (province) {
                    this.renderSelectedProvince(province, worldMap);
                }
            }
        }
        if (hover && this.isMouseHighlightVisible() && hover !== selected) {
            for (const provinceId of hover.provinces) {
                const province = worldMap.getProvinceById(provinceId);
                if (province) {
                    this.renderHoverProvince(province, worldMap, false);
                }
            }
        }
    }
    private renderStateTooltip(state: State, worldMap: FEWorldMap) {
        const supplyArea = worldMap.getSupplyAreaByStateId(state.id);
        this.renderTooltip(`
${state.impassable ? '|r|' + feLocalize('worldmap.tooltip.impassable', 'Impassable') : ''}
${feLocalize('worldmap.tooltip.state', 'State')}=${state.id}
${supplyArea ? `
${feLocalize('worldmap.tooltip.supplyarea', 'Supply area')}=${supplyArea.id}
` : ''}
${feLocalize('worldmap.tooltip.owner', 'Owner')}=${state.owner}
${feLocalize('worldmap.tooltip.coreof', 'Core of')}=${state.cores.join(',')}
${feLocalize('worldmap.tooltip.manpower', 'Manpower')}=${toCommaDivideNumber(state.manpower)}
${feLocalize('worldmap.tooltip.category', 'Category')}=${state.category}
${supplyArea ? `
${feLocalize('worldmap.tooltip.supplyvalue', 'Supply value')}=${supplyArea.value}
` : ''}
${feLocalize('worldmap.tooltip.provinces', 'Provinces')}=${state.provinces.join(',')}
${worldMap.getStateWarnings(state, supplyArea).map(v => '|r|' + v).join('\n')}`,
            (width, height) => {
                const { width: w, height: h } = Renderer.getResourcesSize(state);
                return { width: Math.max(width, w), height: height + h };
            },
            (x, y) => {
                Renderer.renderResources(this.backCanvasContext, state, x, y);
            });
    }
    private renderStrategicRegionTooltip(strategicRegion: StrategicRegion, worldMap: FEWorldMap) {
        this.renderTooltip(`
${feLocalize('worldmap.tooltip.strategicregion', 'Strategic region')}=${strategicRegion.id}
${strategicRegion.navalTerrain ? `
${feLocalize('worldmap.tooltip.navalterrain', 'Naval terrain')}=${strategicRegion.navalTerrain}
`: ''
}
${feLocalize('worldmap.tooltip.provinces', 'Provinces')}=${strategicRegion.provinces.join(',')}
${worldMap.getStrategicRegionWarnings(strategicRegion).map(v => '|r|' + v).join('\n')}`);
    }
    private renderSupplyAreaTooltip(supplyArea: SupplyArea, worldMap: FEWorldMap) {
        this.renderTooltip(`
${feLocalize('worldmap.tooltip.supplyarea', 'Supply area')}=${supplyArea.id}
${feLocalize('worldmap.tooltip.supplyvalue', 'Supply value')}=${supplyArea.value}
${feLocalize('worldmap.tooltip.states', 'States')}=${supplyArea.states.join(',')}
${worldMap.getSupplyAreaWarnings(supplyArea).map(v => '|r|' + v).join('\n')}`);
    }
    private renderTooltip(tooltip: string, sizeCallback?: (width: number, height: number) => {width: number, height: number}, renderCallback?: (x: number, y: number) => void) {
        const backCanvasContext = this.backCanvasContext;
        const cursorX = this.cursorX;
        const cursorY = this.cursorY;
        let mapX = this.viewPoint.convertBackX(cursorX);
        if (this.loader.worldMap.width > 0 && mapX >= this.loader.worldMap.width) {
            mapX -= this.loader.worldMap.width;
        }
        const mapY = this.viewPoint.convertBackY(cursorY);
        tooltip = `(${mapX}, ${mapY})\nX=${mapX}, Z=${this.loader.worldMap.height - 1 - mapY}\n` + tooltip;
        const colorPrefix = /^\|r\|/;
        const regex = /(\n)|((?:\|r\|)?(?:.{40,59}[, ]|.{60}))/g;
        const text = tooltip.trim()
            .split(regex)
            .map((v, i, a) => {
                if (!v?.trim() || colorPrefix.test(v)) {
                    return v;
                }
                for (let j = i - 1; j >= 0; j--) {
                    if (!a[j] || a[j] === '\n') {
                        return v;
                    }
                    const match = colorPrefix.exec(a[j]);
                    if (match) {
                        return match[0] + v;
                    }
                }
                return v;
            })
            .filter(v => v?.trim());
        const fontSize = 14;
        let toolTipOffsetX = 10;
        let toolTipOffsetY = 10;
        const marginX = 10;
        const marginY = 10;
        const linePadding = 3;
        backCanvasContext.font = `${fontSize}px sans-serif`;
        backCanvasContext.textAlign = 'start';
        let width = max(text.map(t => backCanvasContext.measureText(t).width)) ?? 0;
        let height = fontSize * text.length + linePadding * (text.length - 1);
        if (cursorX + toolTipOffsetX + width + 2 * marginX > this.canvasWidth) {
            toolTipOffsetX = -10 - (width + 2 * marginX);
        }
        if (cursorY + toolTipOffsetY + height + 2 * marginY > this.canvasHeight) {
            toolTipOffsetY = -10 - (height + 2 * marginY);
        }
        backCanvasContext.strokeStyle = '#7F7F7F';
        backCanvasContext.fillStyle = 'white';
        backCanvasContext.textBaseline = 'top';
        if (sizeCallback) {
            const result = sizeCallback(width, height);
            width = result.width;
            height = result.height;
        }
        backCanvasContext.fillRect(cursorX + toolTipOffsetX, cursorY + toolTipOffsetY, width + 2 * marginX, height + 2 * marginY);
        backCanvasContext.strokeRect(cursorX + toolTipOffsetX, cursorY + toolTipOffsetY, width + 2 * marginX, height + 2 * marginY);
        text.forEach((t, i) => {
            backCanvasContext.fillStyle = 'black';
            if (t.startsWith('|r|')) {
                backCanvasContext.fillStyle = 'red';
                t = t.substring(3);
            }
            t = t.trim();
            backCanvasContext.fillText(t, cursorX + toolTipOffsetX + marginX, cursorY + toolTipOffsetY + marginY + i * (fontSize + linePadding));
        });
        backCanvasContext.fillStyle = 'black';
        if (renderCallback) {
            renderCallback(cursorX + toolTipOffsetX + marginX, cursorY + toolTipOffsetY + marginY + text.length * (fontSize + linePadding));
        }
    }
    private static renderAllOffsets(viewPoint: ViewPoint, boundingBox: Zone, step: number, callback: (xOffset: number) => void, minimalRenderCount: number = 1) {
        let xOffset = 0;
        let i = 0;
        let inView = viewPoint.bboxInView(boundingBox, xOffset);
        while (inView || i < minimalRenderCount) {
            if (inView) {
                callback(xOffset);
            }
            if (step <= 0) {
                return;
            }
            xOffset += step;
            i++;
            inView = viewPoint.bboxInView(boundingBox, xOffset);
        }
    }
    private renderAllOffsets(boundingBox: Zone, step: number, callback: (xOffset: number) => void, minimalRenderCount: number = 1) {
        Renderer.renderAllOffsets(this.viewPoint, boundingBox, step, callback, minimalRenderCount);
    }
    private static getResourcesSize(state: State, scale: number = 1, labelWidth: number = 30): { width: number, height: number } {
        let fullWidth = 0;
        let maxHeight = 0;
        for (const resource in state.resources) {
            if (!state.resources[resource]) {
                continue;
            }
            const image = Renderer.resourceImages[resource];
            if (image) {
                maxHeight = Math.max(maxHeight, image.naturalHeight * scale);
                fullWidth += image.naturalWidth * scale;
            } else {
                maxHeight = Math.max(maxHeight, 24 * scale);
                fullWidth += 24 * scale;
            }
            fullWidth += labelWidth;
        }
        return { width: fullWidth, height: maxHeight };
    }
    private static renderResources(context: CanvasRenderingContext2D, state: State, x: number, y: number, scale: number = 1, labelWidth: number = 30) {
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        for (const resource in state.resources) {
            const resourceNumber = state.resources[resource];
            if (!resourceNumber) {
                continue;
            }
            const image = Renderer.resourceImages[resource];
            if (image) {
                context.drawImage(image, x, y, image.naturalWidth * scale, image.naturalHeight * scale);
                context.fillText(resourceNumber.toString(), x + (image?.naturalWidth ?? 0) * scale + labelWidth / 2, y + Math.max(0, image?.naturalHeight ?? 0) * scale / 2);
                x += (image?.naturalWidth ?? 0) * scale + labelWidth;
            } else {
                context.fillStyle = 'gray';
                context.fillRect(x, y, 24 * scale, 24 * scale);
                context.fillText(resourceNumber.toString(), x + 24 * scale + labelWidth / 2, y + 24 * scale / 2);
                x += 24 * scale + labelWidth;
            }
        }
    }
}
function toColor(colorNum: number) {
    return '#' + padStart(colorNum.toString(16), 6, '0');
}
function findNearestPoints(start: Point | undefined, end: Point | undefined, a: Province, b: Province | undefined): [Point, Point] {
    if (start && end) { return [start, end]; }
    if (!b) { return [bboxCenter(a.boundingBox), bboxCenter(a.boundingBox)]; };
    if (!start) { const t = start, u = a; start = end; a = b; end = t; b = u; }
    if (!start) {
        let nearestPair: [Point, Point] | undefined = undefined;
        let nearestPairDistance = 1e10;
        for (const ape of a.edges) {
            for (const ap of ape.path) {
                for (const app of ap) {
                    for (const bpe of b.edges) {
                        for (const bp of bpe.path) {
                            for (const bpp of bp) {
                                const disSqr = distanceSqr(app, bpp);
                                if (disSqr < nearestPairDistance) {
                                    nearestPairDistance = disSqr;
                                    nearestPair = [app, bpp];
                                }
                            }
                        }
                    }
                }
            }
        }
        return nearestPair ?? [bboxCenter(a.boundingBox), bboxCenter(a.boundingBox)];
    } else {
        let nearestPair: [Point, Point] | undefined = undefined;
        let nearestPairDistance = 1e10;
        for (const bpe of b.edges) {
            for (const bp of bpe.path) {
                for (const bpp of bp) {
                    const disSqr = distanceSqr(start, bpp);
                    if (disSqr < nearestPairDistance) {
                        nearestPairDistance = disSqr;
                        nearestPair = [start, bpp];
                    }
                }
            }
        }
        return nearestPair ?? [bboxCenter(a.boundingBox), bboxCenter(a.boundingBox)];
    }
}
function getColorByColorSet(
    colorSet: ColorSet,
    province: Province,
    worldMap: FEWorldMap,
    renderContext: RenderContext
): number {
    const { provinceToState,
        provinceToStrategicRegion,
        stateToSupplyArea,
        topBar } = renderContext;
    switch (colorSet) {
        case 'provincetype':
            return (province.type === 'land' ? 0x007F00 : province.type === 'lake' ? 0x00FFFF : 0x00007F) | (province.coastal ? 0x7F0000 : 0);
        case 'country':
            {
                const stateId = provinceToState[province.id];
                return worldMap.countries.find(c => c && c.tag === worldMap.getStateById(stateId)?.owner)?.color ?? defaultColor(province);
            }
        case 'terrain':
            {
                if (renderContext.extraState === undefined) {
                    renderContext.extraState = arrayToMap(worldMap.terrains, 'name');
                }
                const navalTerrain = province.type === 'land' ? undefined : worldMap.getStrategicRegionById(provinceToStrategicRegion[province.id])?.navalTerrain;
                return (renderContext.extraState as Record<string, Terrain | undefined>)[navalTerrain ?? province.terrain]?.color ?? 0;
            }
        case 'continent':
            if (renderContext.extraState === undefined) {
                let continent = 0;
                worldMap.forEachProvince(p => (p.continent > continent ? continent = p.continent : 0, false));
                renderContext.extraState = avoidPowerOf2(continent + 1);
            }
            return province.continent !== 0 ? valueAndMaxToColor(province.continent + 1, renderContext.extraState) : defaultColor(province);
        case 'stateid':
            {
                if (renderContext.extraState === undefined) {
                    renderContext.extraState = avoidPowerOf2(worldMap.statesCount);
                }
                const stateId = provinceToState[province.id];
                return stateId !== undefined ? valueAndMaxToColor(stateId < 0 ? 0 : stateId, renderContext.extraState) : defaultColor(province);
            }
        case 'warnings':
            {
                const isLand = province.type === 'land';
                const viewMode = topBar.viewMode$.value;
                const warningFilter = topBar.warningFilter.selectedValues$.value;
                const stateId = provinceToState[province.id];
                const state = worldMap.getStateById(stateId);
                const strategicRegion = worldMap.getStrategicRegionById(provinceToStrategicRegion[province.id]);
                const supplyAreaId = stateId ? stateToSupplyArea[stateId] : undefined;
                const supplyArea = worldMap.getSupplyAreaById(supplyAreaId);
                return worldMap.getProvinceWarnings(
                        viewMode !== "warnings" || warningFilter.includes('province') ? province : undefined,
                        viewMode !== "warnings" || warningFilter.includes('state') ? state : undefined,
                        viewMode !== "warnings" || warningFilter.includes('strategicregion') ? strategicRegion : undefined,
                        viewMode !== "warnings" || warningFilter.includes('supplyarea') ? supplyArea : undefined
                    ).length > 0 ?
                    (isLand ? landWarning : waterWarning) :
                    (isLand ? landNoWarning : waterNoWarning);
            }
        case 'manpower':
            {
                if (province.type === 'sea') {
                    return defaultColor(province);
                }
                if (renderContext.extraState === undefined) {
                    let maxManpower = 0;
                    worldMap.forEachState(state => (state.manpower > maxManpower ? maxManpower = state.manpower : 0, false));
                    renderContext.extraState = maxManpower;
                }
                const stateId = provinceToState[province.id];
                const state = worldMap.getStateById(stateId);
                const value = manpowerHandler(state?.manpower ?? 0) / manpowerHandler(renderContext.extraState);
                return valueToColorGYR(value);
            }
        case 'victorypoint':
            {
                if (renderContext.extraState === undefined) {
                    let maxVictoryPoint = 0;
                    worldMap.forEachState(state => Object.values(state.victoryPoints).forEach(
                        vp => vp !== undefined && vp > maxVictoryPoint ? maxVictoryPoint = vp: 0));
                    renderContext.extraState = maxVictoryPoint;
                }
                const stateId = provinceToState[province.id];
                const state = worldMap.getStateById(stateId);
                const value = victoryPointsHandler(state ? state.victoryPoints[province.id] ?? 0.1 : 0) / victoryPointsHandler(renderContext.extraState);
                return valueToColorGreyScale(value);
            }
        case 'resources':
            {
                if (province.type === 'sea') {
                    return defaultColor(province);
                }
                if (renderContext.extraState === undefined) {
                    let maxResources = 0;
                    worldMap.forEachState(state => {
                        const numResources = Object.values(state.resources).reduce<number>((p, c) => p + (c ?? 0), 0);
                        if (numResources > maxResources) {
                            maxResources = numResources;
                        }
                        return false;
                    });
                    renderContext.extraState = maxResources;
                }
                const stateId = provinceToState[province.id];
                const state = worldMap.getStateById(stateId);
                const numResources = state ? Object.values(state.resources).reduce<number>((p, c) => p + (c ?? 0), 0) : 0;
                const value = resourcesHandler(numResources) / resourcesHandler(renderContext.extraState);
                return valueToColorGYR(value);
            }
        case 'strategicregionid':
            {
                if (renderContext.extraState === undefined) {
                    renderContext.extraState = avoidPowerOf2(worldMap.strategicRegionsCount);
                }
                const strategicRegionId = provinceToStrategicRegion[province.id];
                return valueAndMaxToColor(strategicRegionId === undefined || strategicRegionId < 0 ? 0 : strategicRegionId, renderContext.extraState);
            }
        case 'supplyareaid':
            {
                if (renderContext.extraState === undefined) {
                    renderContext.extraState = avoidPowerOf2(worldMap.supplyAreasCount);
                }
                const stateId = provinceToState[province.id];
                const supplyAreaId = stateId !== undefined ? stateToSupplyArea[stateId] : undefined;
                return supplyAreaId !== undefined ? valueAndMaxToColor(supplyAreaId < 0 ? 0 : supplyAreaId, renderContext.extraState) : defaultColor(province);
            }
        case 'supplyvalue':
            {
                if (province.type === 'sea') {
                    return defaultColor(province);
                }
                if (renderContext.extraState === undefined) {
                    let maxSupplyValue = 0;
                    worldMap.forEachSupplyArea(supplyArea => (supplyArea.value > maxSupplyValue ? maxSupplyValue = supplyArea.value: 0, false));
                    renderContext.extraState = maxSupplyValue;
                }
                const stateId = provinceToState[province.id];
                const supplyAreaId = stateId ? stateToSupplyArea[stateId] : undefined;
                const supplyArea = worldMap.getSupplyAreaById(supplyAreaId);
                const value = (supplyArea?.value ?? 0) / (renderContext.extraState);
                return valueToColorGYR(value);
            }
        default:
            return province.color;
    }
}
function manpowerHandler(manpower: number): number {
    if (manpower < 0) {
        manpower = 0;
    }
    return Math.pow(manpower, 0.2);
}
function victoryPointsHandler(victoryPoints: number): number {
    if (victoryPoints < 0) {
        victoryPoints = 0;
    }
    return Math.pow(victoryPoints, 0.5);
}
function resourcesHandler(resources: number): number {
    if (resources < 0) {
        resources = 0;
    }
    return Math.pow(resources, 0.2);
}
function valueToColorRYG(value: number): number {
    return value < 0.5 ? (0xFF0000 | (Math.floor(255 * 2 * value) << 8)) : (0xFF00 | (Math.floor(255 * 2 * (1 - value)) << 16));
}
function valueToColorGYR(value: number): number {
    return value < 0.5 ? (0xFF00 | (Math.floor(255 * 2 * value) << 16)) : (0xFF0000 | (Math.floor(255 * 2 * (1 - value)) << 8));
}
function valueToColorBCG(value: number): number {
    return value < 0.5 ? (0xFF | (Math.floor(255 * 2 * value) << 8)) : (0xFF00 | Math.floor(255 * 2 * (1 - value)));
}
function valueToColorGreyScale(value: number): number {
    return Math.floor(value * 255) * 0x10101;
}
function valueAndMaxToColor(value: number, max: number): number {
    return Math.floor(value * (0xFFFFFF / max));
}
function getHighConstrastColor(color: number): number {
    const r = (color >> 16) & 0xFF;
    const g = (color >> 8) & 0xFF;
    const b = color & 0xFF;
    return r * 0.7 + g * 2 + b * 0.3 > 3 * 0x7F ? 0 : 0xFFFFFF;
}
function avoidPowerOf2(value: number): number {
    const v = Math.log2(value);
    if (v > 0 && (v >>> 0) === v) {
        return value + 1;
    }
    return value;
}
function isCriticalPoint(path: Point[], index: number): boolean {
    return index === 0 || index === path.length - 1 ||
        (distanceHamming(path[index], path[index - 1]) > 2 && distanceHamming(path[index], path[index + 1]) > 2);
}
function defaultColor(province: Province) {
    return province.type === 'land' ? 0 : 0x1010B0;
}
function toCommaDivideNumber(value: number): string {
    return value.toString(10).replace(/(?<!^)(\d{3})(?=(?:\d{3})*$)/g, ',$1');
}
```
