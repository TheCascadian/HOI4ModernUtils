# HOI4 Modern Utils

![Version](https://img.shields.io/github/tag/TheCascadian/HOI4ModernUtils)
![Downloads](https://img.shields.io/github/downloads/TheCascadian/HOI4ModernUtils/total)
![Views](https://komarev.com/ghpvc/?username=TheCascadian&repo=HOI4ModernUtils&label=Views)

HOI4 Modern Utils is a Visual Studio Code extension for Hearts of Iron IV mod development. It provides file previews, a data-aware world-map editor, validation tools, and safe persistence workflows for common map edits.

**Measured performance value:** the opt-in WebGL2 base-map renderer reduced median render time by **82.6%** compared with the original Canvas2D renderer, from 42.5 ms to 7.4 ms, or about **5.7x faster**, across 312 authentic-map webview cases at 0.25x zoom. WebGL2 is not pixel-identical to Canvas2D, has a first-frame geometry cost, and remains disabled by default.

## Install without the Marketplace

Download a `.vsix` from the project's GitHub Releases, or build one from this repository:

```powershell
npx.cmd vsce package --allow-star-activation
```

Install the generated package from a terminal:

```powershell
code.cmd --install-extension .\hoi4modernutils-<version>.vsix --force
```

Alternatively, use **Extensions: Install from VSIX...** in VS Code. The version is taken from `package.json`, so the generated filename changes with each release.

## Get started

1. Install and enable the extension.
2. Set `hoi4ModernUtils.installPath` to the Hearts of Iron IV installation folder, or run **HOI4 Modern Utils: Select HOI4 install path** from the Command Palette.
3. Open the root folder of your mod in VS Code.
4. Optionally run **HOI4 Modern Utils: Select mod file** to choose the active `.mod` descriptor. If exactly one workspace descriptor is available, it is selected automatically.
5. Open the Command Palette with `Ctrl+Shift+P` and choose **Preview World Map** or **Preview HOI4 file**. You can also open `.dds` and `.tga` files directly.

The Preview HOI4 file toolbar button is available for supported HOI4 text files, including `.gfx`, `map/default.map`, technology trees, and national focus trees.

## Features

### Previews

- World map preview with province, state, strategic-region, supply-area, country, and warnings views.
- National focus tree, event tree, technology tree, military industrial organization, GUI, `.gfx`, `.dds`, and `.tga` previews.
- Localisation-aware preview text and configurable localisation language.
- Map display options for boundaries, labels, warnings, and color sets, including owner/controller and state-category data where available.
- Large DDS and TGA files open through a cached low-memory preview first, with an explicit full-resolution decode action.

### World map selection, navigation, and inspection

- Click to select a province, `Ctrl`+click to add or remove it from a selection, and `Shift`+left-drag to select multiple provinces in Province view.
- Search province or state IDs from the map search box, then press `Enter` to run the search.
- Right-drag to pan the map. Wheel zoom is centered on the pointer and ranges from 0.25x to 64x.
- Zoom changes continuously between former whole-number levels. Hold `Shift` while scrolling for smaller precision adjustments.
- Double-click a province to add or remove a placeholder victory point. Double-click a state, strategic region, or supply area to open its source file.
- Use `Shift`+right-click for the contextual map menu, including export, warnings, map actions, and country tools.
- Country mode includes country borders, selection, and owned/controlled/core summaries. Compact Large Tooltips can reduce oversized map tooltips.
- The **Select All** menu provides separate province, land, ocean, river, lake, coastal, other-type, and terrain selections. River selection retains exact `rivers.bmp` components for clipped river-to-ocean conversion.

### New World Map tools in practical terms

Most editing tools are in the **Shift+right-click** map menu. The available actions change with the active Province, State, Strategic Region, or Supply Area view so that a tool only appears where its selection has a clear meaning.

| Tool | What it does in simple terms | Example use case |
| --- | --- | --- |
| **Lasso** (`L`) | Draw a shape and stage every eligible land or water pixel inside it for the selected target province. Inverted mode stages eligible pixels outside the shape instead. Nothing is written until **Apply** is pressed. | Redraw a crooked border by circling the exact pixels that should belong to the neighboring province. |
| **Fill Bucket** (`F`) | Moves one connected patch of pixels into the selected province without creating a new province ID. It will not mix incompatible land, lake, and sea types. | Transfer an island or isolated enclave to an existing province with one click. |
| **Transfer Wand** (`W`) | In Province view, moves clicked provinces into a chosen state. In State view, copies the chosen state's owner and controller to clicked states. | Clean up several misplaced provinces quickly, or give a row of states to the same country without reopening a dialog each time. |
| **State from Selected Provinces** | Creates a new state containing exactly the selected provinces. If an old state loses every province, that empty state is safely removed and supply-area references are redirected. Victory points on moved provinces follow them. | Split a large state into a new coastal state, including the coastal victory points. |
| **New Strategic Region from Selected Provinces** | Creates a strategic region from the exact selected province IDs rather than expanding the selection to whole states. Empty source regions are removed. | Put only the sea provinces around an island chain into a dedicated naval region. |
| **Remove All Provinces from Selected States** | Empties selected states and removes their direct victory points, but keeps their files and unrelated scripted content. | Temporarily preserve scripted state history while rebuilding its province membership. The empty state must be repopulated or deleted before launching HOI4. |
| **Consolidate Selected Ocean Provinces to One Tile** | Combines selected sea provinces into one valid ocean province, clears state membership, and removes strategic regions left empty by the merge. | Turn many tiny offshore sea provinces into one simpler ocean tile. |
| **Convert Selected Water Provinces to Land** | Changes selected sea or lake provinces to land and asks where they belong, which terrain they use, and whether they are coastal. | Reclaim a lake or add a landmass while assigning it to the correct state and strategic region in the same operation. |
| **Convert River Pixels to Ocean (Clipped)** | Uses the exact selected `rivers.bmp` component, not every province the river touches, and converts only those river pixels. | Make a wide navigable river mouth without accidentally converting the surrounding land provinces to ocean. |
| **Verify Ocean-Tile Readiness** | Performs a read-only checklist for selected ocean provinces. It reports definition, pixels, state membership, strategic region, railway, and supply-hub problems without changing files. | Check a newly consolidated ocean tile before starting the game. |
| **Selected Area Tools** | Applies cleanup only to the current selection: railways, buildings, supply hubs, crossings, resources, population, development, or ocean conversion. Optional per-continent mode keeps separate continent groups. | Remove infrastructure only from a region being rebuilt while leaving the rest of the map untouched. |
| **REMOVE ALL PROVINCE BUILDINGS (ENTIRE MAP)** | After confirmation, removes every loaded state building block and province building record across the map. | Prepare a minimal test map or regenerate all buildings from scratch. |
| **REINDEX ALL PROVINCES AND STATES** | Renumbers loaded province and state IDs sequentially and rewrites supported references, including strategic regions, supply areas, capitals, adjacencies, railways, supply nodes, buildings, and `unitstacks.txt`. | Normalize IDs after a large consolidation. External scripted numeric references still require manual review. |
| **Scan for World Map Errors and Write Log** | Runs the complete map loader without editing files, gathers every warning, and writes a timestamped report in the workspace root. | Attach one complete diagnostic report to a bug report instead of copying warnings from several UI panels. |

For destructive actions, make a Git commit or backup first, review the confirmation text, and wait for the success message. Writes are correlated with the extension host and rolled back on reported failure. If saving fails or times out, the editor reloads authoritative map data instead of treating the in-memory preview as saved.

### Province editing and repair

- Paint province pixels directly on the map with exact square brush sizes, continuous gap-free strokes, a staged-pixel eraser, and draft undo/redo before saving.
- Create provinces from a selected area, or transfer pixels into an existing province with the Brush, Fill Bucket, Lasso, or Transfer Wand. New province IDs use a map-size-dependent cap equal to one eighth of the total `provinces.bmp` pixels.
- The Lasso stages exact same-type pixels inside a drawn polygon. Optional snapping cleans up nearly straight lines, and inverted mode selects eligible pixels outside the polygon. Review the overlay before applying it.
- The Fill Bucket transfers one connected region and prevents invalid land, lake, and sea/ocean type transfers. Existing-province pixel transfers do not create province IDs.
- Manual province merge ignores synthetic loader recovery records, including province `0` and color `0`, instead of sending them to the persistence validator.
- **Consolidate Selected Ocean Provinces to One Tile** merges selected sea provinces across strategic-region boundaries, canonicalizes the survivor as `sea`/`ocean`/continent `0`, removes its state membership, and deletes empty source regions.
- **Convert Selected Water Provinces to Land** requires explicit land terrain, continent, destination state, destination strategic region, and coastal metadata before changing selected sea or lake definitions.
- Merge provinces and repair affected state victory points, strategic-region membership, `adjacencies.csv`, `railways.txt`, and `supply_nodes.txt`.
- Use the standalone province-reference resolver to remove or repair invalid supported-map references.
- Province bitmap, `definition.csv`, and required state or strategic-region membership changes are saved as one transaction. Province BMP undo/redo restores every related file captured by that transaction.
- Paintbrush strokes are processed as one update per sampled pointer event and reuse a cached staged overlay. A deterministic 20,000-pixel, 256-dab synthetic workload measured 99.75% less stroke-processing time than the previous per-dab implementation; this is an algorithm microbenchmark, not a live UI frame-time claim.

### State, strategic-region, and country tools

- Create states from the current selection, assign selected provinces to an existing state, and create or assign strategic regions. Creating a state can safely replace source states emptied by the move, redirects their supply-area references, and carries victory points with their provinces. A province-scoped action can move exactly the selected province IDs into a new strategic region without expanding the selection to whole states.
- Transfer provinces between states or copy state owner/controller assignments with the Transfer Wand.
- Create a three-character country TAG from selected states, including country definition, history, and English localisation files.
- Select multiple countries for bulk annexation, create puppet relationships, release puppets, transfer states, and optionally auto-core transferred states.
- Merge selected states with an explicit surviving state. The merge combines provinces, manpower, resources, cores, and victory points.
- Remove all province membership and direct victory points from selected states while keeping their files and unrelated content. The resulting empty states must be repopulated or deleted before the mod is HOI4-ready.
- Consolidate a loaded continent or run the sequential all-continent workflow. These guarded operations merge provinces, states, and strategic regions, clear scoped infrastructure where required, repair references, and assign the result to the chosen country. Existing surviving IDs remain stable, already-consolidated continents can be rerun, and cross-continent state or strategic-region content is preserved.
- Selected Area Tools can clear railways, buildings, supply hubs, water crossings, and resources; set population to one; lower development; or convert eligible selections to ocean. Actions are gated to the relevant Province, State, or Supply Area view and can optionally run per continent.
- Guarded global actions can remove all water crossings, clear all state resources, remove every province building, remove all cores without changing owner/controller values, and reindex loaded province and state IDs while repairing dependent references.
- Verify Ocean-Tile Readiness performs a read-only check of selected provinces for sea/ocean definition fields, continent and coastal flags, loaded pixels, state and strategic-region membership, railways, and supply hubs. Map-building and external scripted references remain outside this check.

Destructive operations show confirmation UI. Review the affected selection and save or commit your mod before running them.

### Rendering and diagnostics

- The world-map Performance menu contains an opt-in WebGL2 base-map renderer and experimental Canvas2D controls. Warning indexing is fidelity-preserving; WebGL2, edge decimation, river pixel collapse, label-grid deduplication, and coarse province rendering can change pixel output or visual detail and remain off by default.
- Experimental selections are saved with the map view. Options that may change fidelity require confirmation before they are enabled.
- The renderer clips off-viewport river work and uses indexed edge-neighbor lookups for responsive map navigation.
- A movable Performance overlay reports live FPS, frame and base-map timing, redraw state, viewport position, zoom, canvas size, and active renderer.
- The **Accessibility** menu can change font size and typeface, interface scale, panel opacity, glass blur, reduced motion, high contrast, and larger interaction targets. These preferences are saved with the World Map view.
- Preview registration, initial indexing, and large-image decoding are deferred or moved off the extension activation path to keep startup responsive.
- The extension reports map validation warnings for loaded data, including province, state, strategic-region, supply-area, railway, river, terrain, and reference problems.
- Run **HOI4 Modern Utils: Scan for World Map Errors and Write Log** from the Command Palette to perform the full validation load and create a timestamped report in the workspace root. This command is read-only; it does not repair the warnings it finds.

## World map shortcuts

The following defaults can be changed through the corresponding `hoi4ModernUtils.worldMap*Keybind` settings. Shortcut strings accept combinations such as `Ctrl+Shift+N` or `Alt+Enter`.

| Default | Action | Setting |
| --- | --- | --- |
| `T` | Undo the last selection change, or the current staged paint draft while painting | `worldMapSelectionUndoKeybind` |
| `R` | Redo the last selection change, or the current staged paint draft while painting | `worldMapSelectionRedoKeybind` |
| `Ctrl+Z` | Undo the last map edit | `worldMapMapUndoKeybind` |
| `Ctrl+Y` | Redo the last map edit | `worldMapMapRedoKeybind` |
| `Ctrl+Shift+N` | Create a state from the current selection | `worldMapCreateStateKeybind` |
| `Ctrl+Enter` | Assign the current selection to a state | `worldMapAssignSelectionKeybind` |
| `Ctrl+Shift+G` | Assign selected states to a strategic region | `worldMapAssignSelectionToStrategicRegionKeybind` |

When both an edit undo/redo and a selection undo/redo are relevant, use the dedicated configured shortcut for the type of change you want to reverse.

The World Map also has fixed editor shortcuts: `P` toggles Brush, `F` toggles Fill Bucket, `L` toggles Lasso, `W` toggles Transfer Wand, `E` toggles the staged-pixel eraser while painting, `Ctrl+Alt+P` starts new-province painting, and `Esc` cancels the active paint draft.

## Extension settings

| Setting | Type | Description |
| --- | --- | --- |
| `hoi4ModernUtils.installPath` | `string` | Hearts of Iron IV installation path. Most previews require it. |
| `hoi4ModernUtils.loadDlcContents` | `boolean` | Load DLC images while previewing. This increases memory use. |
| `hoi4ModernUtils.modFile` | `string` | Active `.mod` descriptor used for `replace_path` and mod resolution. |
| `hoi4ModernUtils.enableSupplyArea` | `boolean` | Enable supply-area support for compatible HOI4 versions. |
| `hoi4ModernUtils.previewLocalisation` | `enum` | Language used for content in preview windows. |
| `hoi4ModernUtils.indexing` | `string[]` | File categories indexed automatically for previews and references. |
| `hoi4ModernUtils.stateBoundaryColor` | `string` | CSS color for state boundaries in Province view. |
| `hoi4ModernUtils.stateBoundaryWidth` | `number` | State-boundary line-width multiplier in Province view. |
| `hoi4ModernUtils.featureFlags` | `string[]` | Enables or disables feature flags. Reload VS Code after changing them. |
| `hoi4ModernUtils.worldMapSelectionUndoKeybind` | `string` | Selection undo shortcut. Default: `T`. |
| `hoi4ModernUtils.worldMapSelectionRedoKeybind` | `string` | Selection redo shortcut. Default: `R`. |
| `hoi4ModernUtils.worldMapMapUndoKeybind` | `string` | Map-edit undo shortcut. Default: `Ctrl+Z`. |
| `hoi4ModernUtils.worldMapMapRedoKeybind` | `string` | Map-edit redo shortcut. Default: `Ctrl+Y`. |
| `hoi4ModernUtils.worldMapCreateStateKeybind` | `string` | Create-state shortcut. Default: `Ctrl+Shift+N`. |
| `hoi4ModernUtils.worldMapAssignSelectionKeybind` | `string` | Assign-selection-to-state shortcut. Default: `Ctrl+Enter`. |
| `hoi4ModernUtils.worldMapAssignSelectionToStrategicRegionKeybind` | `string` | Assign-states-to-strategic-region shortcut. Default: `Ctrl+Shift+G`. |
| `hoi4ModernUtils.worldMapConfirmNewProvinceCreation` | `boolean` | Require confirmation before creating a new province. |
| `hoi4ModernUtils.worldMapAutoCoreTransfers` | `boolean` | Automatically add cores when states are transferred, annexed, or used to create a country. |

## Known limitations

- Focus-tree and MIO preview layout is not fully configurable like the technology-tree preview.
- World-map edge lines can differ slightly from province-color edges in some cases.
- WebGL2 and the lossy experimental Performance options can change pixel output or visual detail. Leave them disabled when exact Canvas2D appearance matters.
- The built-in reindexer repairs supported loaded map files, but it cannot discover every province or state ID embedded in arbitrary external scripts. Review custom scripted numeric references after reindexing.
- Ocean readiness validation does not inspect every external script or every possible generated building source.
- Build and automated webview results do not prove that a generated mod launches cleanly in every HOI4 version or playset. Validate destructive edits in the target game configuration.

## Demos

### World map preview

![World map preview demo](demo/5.gif)

### Focus tree preview

![Focus tree preview demo](demo/1.gif)

### Event tree preview

![Event tree preview demo](demo/6.gif)

### Technology tree preview

![Technology tree preview demo](demo/4.gif)

### GUI preview

![GUI preview demo](demo/7.gif)

## Contribute

Report issues or propose improvements in the [project issue tracker](https://github.com/TheCascadian/HOI4ModernUtils/issues). Translation contributions are welcome; localisation files are in `i18n`.

See [CHANGELOG.md](CHANGELOG.md) for release-by-release detail.
