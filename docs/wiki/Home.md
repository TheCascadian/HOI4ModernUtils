# HOI4 Modern Utils

HOI4 Modern Utils is a Visual Studio Code extension for Hearts of Iron IV mod development. It brings previews, map inspection, world-map editing, reference checks, and guided persistence workflows into the editor.

> **Important:** Map edits can change multiple HOI4 files. Commit or back up your mod before using destructive actions.

## Start here

1. [Install and configure](Installation-and-setup)
2. [Open and navigate the World Map](World-map-overview)
3. [Edit provinces, states, and countries](Map-editing)
4. Read [safe editing and recovery](Safe-editing-and-recovery) before using merge, consolidation, or reindexing actions.

## What the extension provides

| Area | What it does |
| --- | --- |
| File previews | Opens HOI4-focused previews for world maps, focus trees, event trees, technology trees, MIOs, GUIs, `.gfx`, `.dds`, and `.tga` files. Large DDS/TGA assets use cached low-memory thumbnails with optional full decoding. |
| World Map | Displays provinces, states, strategic regions, supply areas, countries, and validation warnings. |
| Map editing | Creates and transfers provinces, states, strategic regions, countries, and country ownership. |
| Repair tools | Updates related references after supported province and state changes. |
| Diagnostics | Shows map warnings, a live performance overlay, and opt-in Canvas2D/WebGL2 rendering controls. |

## Use the right documentation page

- [Installation and setup](Installation-and-setup): install a VSIX, set paths, and choose a mod descriptor.
- [World Map overview](World-map-overview): navigation, views, selection, warnings, and shortcuts.
- [Map editing](Map-editing): normal editing workflows and their saved files.
- [Large map operations](Large-map-operations): consolidation, batch cleanup, and reindexing.
- [Settings and shortcuts](Settings-and-shortcuts): every supported setting and default keybind.
- [Safe editing and recovery](Safe-editing-and-recovery): backups, confirmations, undo/redo, and validation boundaries.
- [Troubleshooting](Troubleshooting): common setup and map-loading problems.

## Status language used in this wiki

- **Supported** means the behavior is implemented and covered by project tests or direct code paths.
- **Experimental** means it is opt-in or can affect visual fidelity.

## Project links

- Repository: <https://github.com/TheCascadian/HOI4ModernUtils>
- Releases: <https://github.com/TheCascadian/HOI4ModernUtils/releases>
- Issues: <https://github.com/TheCascadian/HOI4ModernUtils/issues>
- License: MIT, see [LICENSE](../../LICENSE)
- Current extension version: `0.4.4`
