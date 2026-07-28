# Troubleshooting

## The World Map will not load

Verify that `hoi4ModernUtils.installPath` points to the actual Hearts of Iron IV installation folder, then reopen the mod workspace. If the mod uses a descriptor, explicitly select the active `.mod` file.

When several descriptors exist, automatic selection intentionally does not choose one arbitrarily. Select the correct descriptor from the Command Palette.

## My `replace_path` files are ignored

Ensure the chosen descriptor is the one used by your mod and that its paths are valid for the workspace. The extension resolves descriptor paths consistently and adds only missing supported paths without rewriting existing descriptor content.

## A DLC archive causes map loading to fail

The extension skips missing or stale DLC archives and reports the archive path instead of aborting base-game map loading. Check that the installation path and DLC content match the game version being used.

## Map warnings appear after a province or state change

Run the smallest relevant repair workflow first. Supported province repairs can update victory points, strategic regions, adjacencies, railways, and supply nodes. Do not jump to global reindexing unless changing every loaded ID is truly intended.

## A large action stopped or did not do what I expected

Do not repeat it blindly. Restore your backup, confirm the selected scope, and retry on a disposable copy. The consolidation workflow uses in-webview preflight and execution UI instead of browser prompts, so look for an open in-map dialog before assuming the action failed.

## Visual output changed after enabling Performance options

Disable experimental fidelity-affecting settings. WebGL2 is not pixel-identical to Canvas2D, and edge decimation, river pixel collapse, label-grid deduplication, and coarse province rendering intentionally trade detail for less drawing work.

## Paintbrush movement is slow

Version 0.4.4 batches interpolated dabs, caches the staged-pixel overlay, and avoids base-map invalidation for draft-only changes. Confirm the installed EXTENSION is 0.4.4 or newer and reload the World Map. The Performance overlay can show whether base-map redraws are still occurring while painting. If the issue persists, report the painted-pixel count, brush size, zoom, active renderer, and total/base-map timing.

## What to include in a bug report

- Extension version and VS Code version.
- HOI4 version, active DLC, and mod load order.
- Whether the project uses `replace_path` and which descriptor is selected.
- Exact action, affected map files, and first warning or error.
- A minimal reproducing mod or sanitized fixture, if sharing is permitted.

Open reports at <https://github.com/TheCascadian/HOI4ModernUtils/issues>. Remove personal paths, unpublished mod content, and unrelated log sections before attaching files.
