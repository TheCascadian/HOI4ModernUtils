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

### Province editing and repair

- Paint province pixels directly on the map with exact square brush sizes, continuous gap-free strokes, a staged-pixel eraser, and draft undo/redo before saving.
- Create provinces from a selected area, or transfer pixels into an existing province with the Brush, Fill Bucket, or Transfer Wand.
- The Fill Bucket transfers one connected region and prevents invalid land, lake, and sea/ocean type transfers. Existing-province pixel transfers do not create province IDs.
- Merge provinces and repair affected state victory points, strategic-region membership, `adjacencies.csv`, `railways.txt`, and `supply_nodes.txt`.
- Use the standalone province-reference resolver to remove or repair invalid supported-map references.
- Province bitmap and `definition.csv` changes are saved together. Map editing has its own undo/redo history.
- Paintbrush strokes are processed as one update per sampled pointer event and reuse a cached staged overlay. A deterministic 20,000-pixel, 256-dab synthetic workload measured 99.75% less stroke-processing time than the previous per-dab implementation; this is an algorithm microbenchmark, not a live UI frame-time claim.

### State, strategic-region, and country tools

- Create states from the current selection, assign selected provinces to an existing state, and create or assign strategic regions. A province-scoped action can move exactly the selected province IDs into a new strategic region without expanding the selection to whole states.
- Transfer provinces between states or copy state owner/controller assignments with the Transfer Wand.
- Create a three-character country TAG from selected states, including country definition, history, and English localisation files.
- Select multiple countries for bulk annexation, create puppet relationships, release puppets, transfer states, and optionally auto-core transferred states.
- Merge selected states with an explicit surviving state. The merge combines provinces, manpower, resources, cores, and victory points.
- Remove all province membership and direct victory points from selected states while keeping their files and unrelated content. The resulting empty states must be repopulated or deleted before the mod is HOI4-ready.
- Consolidate a loaded continent or run the sequential all-continent workflow. These guarded operations merge provinces, states, and strategic regions, clear scoped infrastructure where required, repair references, and assign the result to the chosen country. Existing surviving IDs remain stable, already-consolidated continents can be rerun, and cross-continent state or strategic-region content is preserved.
- Selected Area Tools can clear railways, buildings, supply hubs, water crossings, and resources; set population to one; lower development; or convert eligible selections to ocean. Actions are gated to the relevant Province, State, or Supply Area view and can optionally run per continent.
- Guarded global actions can remove all water crossings, clear all state resources, remove all cores without changing owner/controller values, and reindex loaded province and state IDs while repairing dependent references.
- Verify Ocean-Tile Readiness performs a read-only check of selected provinces for sea/ocean definition fields, continent and coastal flags, loaded pixels, state and strategic-region membership, railways, and supply hubs. Map-building and external scripted references remain outside this check.

Destructive operations show confirmation UI. Review the affected selection and save or commit your mod before running them.

### Rendering and diagnostics

- The world-map Performance menu contains an opt-in WebGL2 base-map renderer and experimental Canvas2D controls. Warning indexing is fidelity-preserving; WebGL2, edge decimation, river pixel collapse, label-grid deduplication, and coarse province rendering can change pixel output or visual detail and remain off by default.
- Experimental selections are saved with the map view. Options that may change fidelity require confirmation before they are enabled.
- The renderer clips off-viewport river work and uses indexed edge-neighbor lookups for responsive map navigation.
- A movable Performance overlay reports live FPS, frame and base-map timing, redraw state, viewport position, zoom, canvas size, and active renderer.
- Preview registration, initial indexing, and large-image decoding are deferred or moved off the extension activation path to keep startup responsive.
- The extension reports map validation warnings for loaded data, including province, state, strategic-region, supply-area, railway, river, terrain, and reference problems.

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

The World Map also has fixed editor shortcuts: `P` toggles Brush, `F` toggles Fill Bucket, `W` toggles Transfer Wand, `E` toggles the staged-pixel eraser while painting, `Ctrl+Alt+P` starts new-province painting, and `Esc` cancels the active paint draft.

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
