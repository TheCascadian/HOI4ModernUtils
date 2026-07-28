# Change Log

All notable changes to the "HOI4 Modern Utils" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

**Versioning note:** This fork ([TheCascadian/HOI4ModernUtils](https://github.com/TheCascadian/HOI4ModernUtils)) keeps its own `0.x` version line, independent of the upstream project it was forked from. Entries at `[0.4.0]` and above are this fork's own releases. Entries from `[0.15.1]` down to `[0.13.0]` are inherited from upstream (`herbix/hoi4modutilities`) and were merged into this fork's history alongside its own work; older upstream entries have been compressed out of this file -  see the [upstream changelog](https://github.com/herbix/hoi4modutilities/blob/master/CHANGELOG.md) for full history. Because the two projects numbered releases independently, some version numbers (e.g. `0.12.x`, `0.3.2`) appear twice in git history for unrelated changes at different dates; this file only lists one entry per number going forward.

## Unreleased

### Added
* Added an exact province-scoped action that moves only the selected provinces into a newly created strategic region and removes source regions that become empty.
* Added a guarded action to remove all province membership and direct victory points from selected states while retaining the state records and unrelated content.
* Added read-only ocean-tile readiness verification for definition fields, pixel presence, state and strategic-region membership, railways, and supply hubs.
* Added a guarded ocean consolidation action that merges selected sea provinces into one canonical ocean tile across strategic-region boundaries, removes state membership, and deletes emptied source regions.
* Added water-to-land conversion with explicit land terrain, continent, destination state, destination strategic region, and coastal metadata.

### Changed
* Province-to-ocean conversion no longer forces a global province/state reindex. Existing IDs remain stable so users can rebuild strategic-region membership explicitly and verify readiness afterward.

### Fixed
* Fixed every manual province merge being rejected when loader recovery province `0` or color `0` was included in the selection or definition persistence payload.
* Province merges now accept orphaned source definitions with no remaining BMP pixels and transactionally remove strategic-region records that the merge empties.

## [0.4.4] - 2026-07-28

### Added
* Added a confirmation workflow to create a new three-character country TAG from selected states, including country definition, history, and English localisation files.
* Added an Auto-Core All Transferred States option shared by state transfers, country creation, and country annexation.
* Added multi-country selection for bulk annexation.
* Added selected-state merging with an explicit surviving-state choice and combined provinces, manpower, resources, cores, and victory points.
* Added a Transfer Wand for rapidly moving land, lake, and ocean provinces between states or copying both state owner and controller assignments.
* Added pixel transfer between existing provinces, including a connected-region Fill Bucket that does not create new province IDs.
* Added a standalone safe province-warning resolver for invalid adjacency, railway, and supply-node province references.
* Added staged-paint erasing plus draft undo/redo. The configured selection-history keys, `T` and `R` by default, operate on the draft while paintbrush mode is active.
* Added distinct Select All actions for provinces, land, oceans, rivers, lakes, coasts, other province types, and terrain. River selection retains exact `rivers.bmp` components for clipped river-to-ocean conversion.
* Added a built-in continental consolidation workflow that merges provinces, affected states and strategic regions, clears scoped infrastructure, repairs supported references, and assigns the result to a chosen country. A sequential run-all mode uses each continent's dominant current owner.
* Added Selected Area Tools for clearing railways, buildings, supply hubs, water crossings, and resources; setting state population to one; lowering development; and converting eligible selections to ocean.
* Added guarded global actions for removing all water crossings, clearing all state resources, removing all cores without changing owner/controller values, and sequentially reindexing loaded province and state IDs.
* Added an opt-in WebGL2 base-map renderer with quadtree viewport culling, level-of-detail geometry, batched province fills, and Canvas2D foreground overlays.
* Added a movable Performance overlay with live FPS, total and base-map timing, redraw status, viewport, zoom, canvas size, and renderer diagnostics.
* Added lazy, cached low-memory DDS and TGA thumbnails with an explicit full-resolution decode action.
* Added lazy preview registration, deferred initial indexing, background worker parsing for GFX and localisation indexes, and activation/index timing instrumentation.

### Changed
* Increased close editing zoom from 16x to 64x, made wheel zoom continuous, and kept zoom centered on the pointer.
* Province merging now repairs deleted province references in state victory points, strategic regions, `adjacencies.csv`, `railways.txt`, and `supply_nodes.txt`.
* State transfer and annex tools now persist both owner and controller.
* Continental destructive merging preserves separate land, lake, and sea province survivors and separate land/water strategic regions.
* The dedicated reindex action sequentially rebuilds loaded province and state IDs and repairs map, state, strategic-region, supply-area, country-capital, adjacency, railway, supply-node, and building references. Consolidation keeps existing surviving IDs stable.
* State-file updates preserve unrelated blocks and unknown effects while replacing supported map-owned fields.
* Context menus, confirmation dialogs, large tooltips, and dropdown placement were made responsive and keyboard accessible.
* Opt-in WebGL2 measured **82.6% lower median render time than the original Canvas2D renderer**, from 42.5 ms to 7.4 ms, or about 5.7x faster, over 312 authentic-map webview cases at 0.25x zoom. It is not pixel-identical and remains disabled by default.

### Fixed
* Fixed the paintbrush becoming unusably slow on long or heavily staged strokes. Interpolated dabs now share one draft clone and one published update per sampled pointer event; the staged overlay is cached; redundant overlap updates are skipped; and draft-only changes no longer invalidate the base map.
* A deterministic 20,000-staged-pixel, 256-dab synthetic workload measured 99.75% lower stroke-processing time than the prior per-dab implementation, from 662.4 ms to 1.65 ms. This is an algorithm microbenchmark, not a live UI frame-time result.
* Fixed the continental consolidation command silently stopping in VS Code webviews by replacing browser prompts with an in-webview preflight and execution dialog.
* Fixed consolidation failing after prior world edits. It now accepts already-consolidated continents, creates missing land or water strategic regions, preserves cross-continent state and strategic-region content, and does not force a whole-map reindex after each continent.
* Made consolidation cleanup part of the same rollback boundary as province, state, and strategic-region persistence. Missing `provinces.bmp` now produces an explicit failure instead of allowing the workflow to continue.
* Fixed edge-decimation and coarse-province Performance switches so they change the live renderer sampling context, matching the runtime profiler.
* Normalized one-pixel brush bounds to positive zero so exact comparisons and serialized diagnostics stay stable.

## [0.4.2] - 2026-07-27

### Added
* Experimental Performance menu in the world-map toolbar. It provides opt-in rendering controls with an enabled-count badge, keyboard and click-away dismissal, and a confirmation dialog before an option that can change visual fidelity is enabled.
* Five experimental render options: warning indexing, edge decimation, river pixel collapse, label-grid deduplication, and coarse province rendering. The fidelity-preserving warning index is separated from the visually lossy options, which remain disabled by default.
* World-map runtime render test support, including repeatable viewport cases, render duration samples, optional heap and pixel-hash capture, river diagnostics, and runtime-error reporting.
* World-map profiling scripts for renderer and webview measurements, including an aggressive opt-in profile preset.

### Changed
* Improved world-map rendering efficiency by indexing rendered provinces for edge fallback lookups and skipping river pixels outside the viewport.
* Render optimizations are saved with the map view state and are reapplied when the view is restored.
* UI test preparation now compiles the webview bundle before running, so release checks exercise the current world-map code.

### Fixed
* Low-zoom river rendering can collapse duplicate samples onto a single device pixel when that experimental option is enabled, reducing redundant drawing.
* Low-zoom label deduplication can prevent nearby labels from being drawn on top of each other when that experimental option is enabled.

## [0.4.0] - 2026-07-26

### Added
* Province paintbrush editing: paint/redraw province boundaries directly on the world map, create new provinces from a selection, and undo/redo province BMP + `definition.csv` edits.
* State/Strategic Region transfer tools: assign selected states to an existing strategic region, or create a brand-new strategic region from the current state/province selection, with dedicated undo/redo and file persistence.
* Country view mode with country-based coloring, country selection, country borders, and a country-scoped tooltip showing owned, controlled, and core states, provinces, manpower, victory points, and resources.
* Country tools in the world-map context menu: force puppet relationships, release puppets, annex countries, and transfer selected states to another country.
* Country history loading and conditional diplomacy editing for puppet and annexation operations.
* Shift+right-click context menus for map actions, including image export, warnings, state creation and assignment, strategic-region tools, province tools, and country tools.
* Continuous paintbrush strokes with exact square brush sizes, land/sea/lake type clamping, multi-province painting, merge support, confirmation prompts, and improved undo/redo state handling.
* Double-click a province in Province view to toggle a placeholder victory point (writes `value=1` to the state file and a starter localisation key in `localisation/victory_points_l_english.yml`).
* Configurable world map keybinds (selection undo/redo, map undo/redo, create-state, assign-selection, assign-to-strategic-region) via `hoi4ModernUtils.worldMap*Keybind` settings.

### Changed
* Renamed the extension's displayed name and settings namespace to "HOI4 Modern Utils" / `hoi4ModernUtils.*`.
* Reconciled two independently-developed lines of this fork's history (local paintbrush/transfer-tool work, and separately-pushed multi-state-selection/keybind/victory-point work) into a single coherent codebase. The map-edit undo/redo system is now generic across state, strategic region, and province edits instead of having two parallel implementations.
* Recovered and reintegrated 42 upstream commits (through upstream `v0.15.1`, see below) alongside this fork's own changes.
* Country view now suppresses internal province and state boundaries while retaining country borders.
* World-map display controls now support ocean state boundaries, view-mode-specific color sets, filtered warnings, and responsive toolbar wrapping.
* World-map dialogs now use consistent themed inputs, usable multi-row country selectors, and non-overlapping action buttons.

### Fixed
* Excluded dev-only assets from the packaged `.vsix`.
* Prevented an arbitrary first `.mod` file from being selected when multiple descriptors are present; implicit selection now requires exactly one unambiguous workspace descriptor.
* Made `.mod` discovery case-insensitive and deterministic, and kept explicit descriptor selection authoritative.
* Prevented missing or stale DLC ZIP archives from aborting base-game map loading; invalid archives are skipped and reported with their archive path.
* Added safer map persistence and reload handling for province, state, strategic-region, and country edits.

## [0.15.1] - 2026/07/26 (upstream)

### Added
* Add search box in event tree preview.
* Add localised labels on world map preview.
* Add state category color set in world map preview.

### Update
* Refine localisation file preprocessing to accept more files.

## [0.15.0] - 2026/07/23 (upstream)

### Updated
* Indexing settings is moved from feature flags to dedicated settings.
* Simplified event preview to reduce duplicate event when possible.
* Preview windows are refreshed now when localisation files update.
* Improve reading performance of files on local desktop.

### Added
* Indexing for event files.

### Fixed
* Performance issue when opening preview windows (especially noticeable in map preview) (#130) (since v0.12.4).

## [0.14.2] - 2026/07/18 (upstream)

### Updated
* Large focus icons now won't be clipped on overflow.

### Fixed
* GFX index incorrectly fill DLC content to workspace index.

## [0.14.1] - 2026/07/14 (upstream)

### Fixed
* Numbers starts with `.` or `+` can't be parsed.

### Updated
* Hide condition selection in world map preview if there is no condition to select.

## [0.14.0] - 2026/07/13 (upstream)

### Added
* Add condition selection in world map preview. (#121)
  * Limitation: only support previewing owner, controller and core.
* Add bookmark/scenario selection in world map preview, along with condition selection. (#33)
* Add "country (controller)" color set in world map preview. (#118)

### Updated
* Feature flag setting UI. Now you don't need to edit raw json.

## [0.13.0] - 2026/07/10 (upstream)

### Added
* Support `force_use_small_tech_layout` in technology tree preview.
* Add condition selection in technology tree preview.
* Allow zooming in technology tree preview.
* When localisation index is enabled, you can choose to show ID or localised text for focus and technology labels (#124) (Contributor: [1985312383(柯慕灵)](https://github.com/1985312383)).
* Focus position editing by dragging in focus tree preview (#124) (Contributor: [1985312383(柯慕灵)](https://github.com/1985312383)).

### Updated
* Scrolling in preview window is now by dragging right mouse button.
  * You can switch to left mouse button dragging by disabling feature flag `rightButtonDrag`.

---

Everything before upstream `v0.13.0` (releases `v0.1.0` through `v0.12.6`, spanning 2020–2024) has been compressed out of this file to keep it focused on this fork's recent and merged changes. That history is unchanged and still available in the [upstream changelog](https://github.com/herbix/hoi4modutilities/blob/master/CHANGELOG.md) and in this repository's git log.
