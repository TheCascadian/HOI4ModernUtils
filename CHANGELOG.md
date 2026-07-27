# Change Log

All notable changes to the "HOI4 Modern Utils" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

**Versioning note:** This fork ([TheCascadian/HOI4ModernUtils](https://github.com/TheCascadian/HOI4ModernUtils)) keeps its own `0.x` version line, independent of the upstream project it was forked from. Entries at `[0.4.0]` and above are this fork's own releases. Entries from `[0.15.1]` down to `[0.13.0]` are inherited from upstream (`herbix/hoi4modutilities`) and were merged into this fork's history alongside its own work; older upstream entries have been compressed out of this file -  see the [upstream changelog](https://github.com/herbix/hoi4modutilities/blob/master/CHANGELOG.md) for full history. Because the two projects numbered releases independently, some version numbers (e.g. `0.12.x`, `0.3.2`) appear twice in git history for unrelated changes at different dates; this file only lists one entry per number going forward.

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
