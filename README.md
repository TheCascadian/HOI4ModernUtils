# HOI4 Modern Utils

This extension add tools for Heart of Iron IV modding. Some of the tools may work on other Paradox games.

> This fork is specifically made for the purpose of allowing rapid and repetitive state creation with minimal effort, all neatly presented through the Preview World Map feature.
> I may or may not update this over time with additional things, but please do not spam me with requests for this or that update. I have many projects in the works. Thank you for your understanding.

* Shift + Left-drag — select provinces by dragging (Province view)
* Ctrl + Left-click — toggle a province in the multi-selection (Province view)
* Left-click — single-select / deselect province (Province view)
* Ctrl + Shift + N — Create new state from current selection (rapid state creation)
* Ctrl + Z — Undo (map-edit undo first: create/assign; if none, selection undo)
* Ctrl + Y — Redo (map-edit redo first; if none, selection redo)
* Enter (in search box) — Run search for entered province/state id
* Double-click (canvas) — Open hovered region file (state/strategic region/supply area)

## Install Without Marketplace

This fork can be installed directly as a VS Code extension package, without using the Visual Studio Marketplace.

* To build the installable package from the repository root:

```powershell
vsce package
```

* The current package generated for this repository is:

```text
hoi4modernutils-0.3.2.vsix
```

* Users can install that package from a terminal:

```powershell
code --install-extension hoi4modernutils-0.3.2.vsix
```

* Or from inside VS Code:

```text
Extensions -> ... -> Install from VSIX...
```

This is the intended installation path for this fork. GitHub Releases can host the `.vsix` asset directly rather than an insanely complex Azure DevOps signup process for me to host the tool through VSC Marketplace "properly".

## Features

* World map preview
* Focus tree preview
* Event tree preview
* Technology tree preview
* Military industrial organization (MIO) preview.
* GUI preview
* `.gfx` file preview (sprites used by HOI4 are defined here)
* `.dds`, `.tga` file preview (images files used by HOI4)

For feature details and user manual, please refer to [HOI4 Mod Utilities Wiki](https://github.com/herbix/hoi4modutilities/wiki).

## Steps to start

If you installed the extension from a `.vsix` file instead of the Marketplace, the setup steps below are the same.

1. Install and enable this extension in VSCode.
2. Set Heart of Iron IV install path. You can:
    * (Since v0.7.0, or on [vscode web](https://vscode.dev)) Open command palette using `Ctrl+Shift+P`. Use command `Select HOI4 install path` to browse the folder that installed Heart of Iron IV.
    * Update setting `hoi4modernutils.installPath` (you can open settings page of VSCode using `Ctrl+,`) to the folder that installed Heart of Iron IV.
3. Open your mod develop folder.
4. (*Optional*) Open command palette using `Ctrl+Shift+P`. Use command `Select mod file` to set working mod descriptor (the `.mod` file).
5. Use these entries:
    * Command palette (`Ctrl+Shift+P`) commands: `Preview World Map` and `Preview HOI4 file`*.
    * `Preview HOI4 file` (![Preview HOI4 file button](demo/preview-icon.png))* button on right-top tool bar of text editor.
    * Open a `.dds` or `.tga` file.

\* *`Preview HOI4 file` (![Preview HOI4 file button](demo/preview-icon.png)) button/command is invisible, except on `.gfx`, `map/default.map`, technology tree or national focus tree files.*

## Demos

### World map preview

![World map preview demo](demo/5.gif)

### Focus tree preview

![Focus tree preview demo](demo/1.gif)

### Event tree preview

![Event tree preview demo](demo/6.gif)

### Technology tree preview

![Technology tree preview demo](demo/4.gif)

### GUI Preview

![GUI preview demo](demo/7.gif)

## Extension Settings

|Setting|Type|Description|
|-------|----------|--------|
|`hoi4ModernUtils.installPath`|`string`|Hearts of Iron IV install path. Without this, most features are broken.|
|`hoi4ModernUtils.loadDlcContents`|`boolean`|Whether to load DLC images when previewing files. Enabling this will use more memory (All DLCs are around 600MB).|
|`hoi4ModernUtils.modFile`|`string`|Path to the working `.mod` file. This file is used to read replace_path. If not specified, will use first `.mod` file in first folder of the workspace.|
|`hoi4ModernUtils.enableSupplyArea`|`boolean`|If you are developing mod for HOI4(version<=1.10). Use this to check enable supply area.|
|`hoi4ModernUtils.previewLocalisation`|`enum`|Language of content in preview windows.|
|`hoi4ModernUtils.indexing`|`array` of `string`|When enabled, the specified file types don't need to be manually added as reference.|
|`hoi4ModernUtils.stateBoundaryColor`|`string`|CSS color for state boundary lines in province view.|
|`hoi4ModernUtils.stateBoundaryWidth`|`number`|Line width multiplier for state boundary lines in province view.|
|`hoi4ModernUtils.featureFlags`|`array` of `string`|Feature flags are used to disable or enable features. Reloading is required after changing this. Please refer to [Wiki](https://github.com/TheCascadian/HOI4ModernUtils/wiki/Feature-flags) on Github for details.|

## Known Issues

* GUI of focus tree and MIO can't be configured like technology tree.
* Edge lines on world map not always fit edge of colors.

## Release Notes - [0.3.2]

### Added
* Add search box in event tree preview.
* Add localised labels on world map preview.
* Add state category color set in world map preview.

### Update
* Refine localisation file preprocessing to accept more files.

## Contribute
* If you have any suggestion, feel free to create an issue on this [Github repo](https://github.com/TheCascadian/HOI4ModernUtils/issues).
* If you want to contribute translation, feel free to create pull request to this [Github repo](https://github.com/TheCascadian/HOI4ModernUtils). All localization related files are under `i18n` folder.

* Thanks to all contributors listed [here](https://github.com/herbix/hoi4modutilities/graphs/contributors).
