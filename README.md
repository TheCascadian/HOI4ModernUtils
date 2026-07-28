# HOI4 Modern Utils

![Version](https://img.shields.io/github/tag/TheCascadian/HOI4ModernUtils)
![Downloads](https://img.shields.io/github/downloads/TheCascadian/HOI4ModernUtils/total)
![Views](https://komarev.com/ghpvc/?username=TheCascadian&repo=HOI4ModernUtils&label=Views)

HOI4 Modern Utils is a Visual Studio Code extension for Hearts of Iron IV mod development. It provides file previews, a data-aware world-map editor, validation tools, and safe persistence workflows for common map edits.

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

### World map selection, navigation, and inspection

- Click to select a province, `Ctrl`+click to add or remove it from a selection, and `Shift`+left-drag to select multiple provinces in Province view.
- Search province or state IDs from the map search box, then press `Enter` to run the search.
- Right-drag to pan the map. Wheel zoom is centered on the pointer and ranges from 0.25x to 64x.
- Zoom changes continuously between former whole-number levels. Hold `Shift` while scrolling for smaller precision adjustments.
- Double-click a province to add or remove a placeholder victory point. Double-click a state, strategic region, or supply area to open its source file.
- Use `Shift`+right-click for the contextual map menu, including export, warnings, map actions, and country tools.
- Country mode includes country borders, selection, and owned/controlled/core summaries. Compact Large Tooltips can reduce oversized map tooltips.

### Province editing and repair

- Paint province pixels directly on the map with exact square brush sizes and continuous strokes.
- Create provinces from a selected area, or transfer pixels into an existing province with the Brush, Fill Bucket, or Transfer Wand.
- The Fill Bucket transfers one connected region and prevents invalid land, lake, and sea/ocean type transfers. Existing-province pixel transfers do not create province IDs.
- Merge provinces and repair affected state victory points, strategic-region membership, `adjacencies.csv`, `railways.txt`, and `supply_nodes.txt`.
- Use the standalone province-reference resolver to remove or repair invalid supported-map references.
- Province bitmap and `definition.csv` changes are saved together. Map editing has its own undo/redo history.

### State, strategic-region, and country tools

- Create states from the current selection, assign selected provinces to an existing state, and create or assign strategic regions.
- Transfer provinces between states or copy state owner/controller assignments with the Transfer Wand.
- Create a three-character country TAG from selected states, including country definition, history, and English localisation files.
- Select multiple countries for bulk annexation, create puppet relationships, release puppets, transfer states, and optionally auto-core transferred states.
- Merge selected states with an explicit surviving state. The merge combines provinces, manpower, resources, cores, and victory points.
- Consolidate a loaded continent or run the sequential all-continent workflow. These guarded operations merge provinces, states, and strategic regions, clear scoped infrastructure where required, repair references, and assign the result to the chosen country.
- Guarded batch actions can remove water crossings, clear state resources, remove all cores without changing owner/controller values, and reindex loaded province and state IDs while repairing dependent references.

Destructive operations show confirmation UI. Review the affected selection and save or commit your mod before running them.

### Rendering and diagnostics

- The world-map Performance menu contains experimental render controls. Warning indexing is fidelity-preserving; edge decimation, river pixel collapse, label-grid deduplication, and coarse province rendering can change visual detail and remain off by default.
- Experimental selections are saved with the map view. Options that may change fidelity require confirmation before they are enabled.
- The renderer clips off-viewport river work and uses indexed edge-neighbor lookups for responsive map navigation.
- The extension reports map validation warnings for loaded data, including province, state, strategic-region, supply-area, railway, river, terrain, and reference problems.

## World map shortcuts

The following defaults can be changed through the corresponding `hoi4ModernUtils.worldMap*Keybind` settings. Shortcut strings accept combinations such as `Ctrl+Shift+N` or `Alt+Enter`.

| Default | Action | Setting |
| --- | --- | --- |
| `T` | Undo the last selection change | `worldMapSelectionUndoKeybind` |
| `R` | Redo the last selection change | `worldMapSelectionRedoKeybind` |
| `Ctrl+Z` | Undo the last map edit | `worldMapMapUndoKeybind` |
| `Ctrl+Y` | Redo the last map edit | `worldMapMapRedoKeybind` |
| `Ctrl+Shift+N` | Create a state from the current selection | `worldMapCreateStateKeybind` |
| `Ctrl+Enter` | Assign the current selection to a state | `worldMapAssignSelectionKeybind` |
| `Ctrl+Shift+G` | Assign selected states to a strategic region | `worldMapAssignSelectionToStrategicRegionKeybind` |

When both an edit undo/redo and a selection undo/redo are relevant, use the dedicated configured shortcut for the type of change you want to reverse.

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
- Experimental Performance options intentionally trade visual fidelity for reduced drawing work. Leave them disabled when exact map appearance matters.

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
