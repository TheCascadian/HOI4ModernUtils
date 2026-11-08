# Map editing

## Before you edit

Create a Git commit or copy of your mod first. Use an explicit active `.mod` descriptor. Read [Safe editing and recovery](Safe-editing-and-recovery) before merging or reindexing.

## Province editing

Supported workflows include:

- Paint province pixels with square brushes and continuous strokes.
- Press `P` for Brush, `F` for Fill Bucket, `E` to toggle the staged-pixel eraser while painting, and `Esc` to cancel the draft.
- Use `T` and `R` by default to undo or redo whole staged paint strokes before applying them. These keys follow the configurable selection-history shortcuts.
- Create a province from a selected area.
- Transfer pixels to an existing province with Brush, Fill Bucket, or Transfer Wand.
- Use the Fill Bucket to transfer one connected region without creating a province ID.
- Transfer land, lake, and ocean provinces while preserving compatible province types.
- Merge provinces and save `provinces.bmp` with `definition.csv` together.
- Consolidate selected sea provinces into one canonical ocean tile even when they span strategic regions.
- Convert selected sea or lake provinces to land after choosing their land terrain, continent, destination state, destination strategic region, and coastal flag.

After a supported province merge, the extension repairs affected state victory points, strategic-region membership, `adjacencies.csv`, `railways.txt`, and `supply_nodes.txt`. The standalone province-reference resolver can remove or repair invalid supported references.

Loader recovery records such as province `0` and color `0` are diagnostic placeholders, not editable definitions. Manual selection and persistence now discard them before validation. A real positive-ID, nonzero-color province remains required as the merge survivor.

The paintbrush keeps edits in a draft until **Apply & Exit**. Version 0.4.7-pre-release-2 batches every interpolated pointer sample into one draft update and caches the staged overlay, fixing the severe slowdown that appeared as the painted region grew. A deterministic synthetic 20,000-pixel, 256-dab workload measured 99.75% lower processing time than the previous per-dab path; this does not replace live Extension Host testing.

## State and strategic-region editing

- Create a state from the current selection.
- Assign selected provinces to an existing state.
- Create or assign a strategic region from selected states or provinces.
- Use **New Strat Region from Selected Provinces** when the region must contain exactly the selected province IDs. This does not expand province selection to whole states, and source strategic regions that become empty are removed.
- Use **Remove All Provinces from Selected State(s)** to clear province membership and direct victory points without deleting the state record. This intentionally leaves an empty, non-playable state until provinces are reassigned or the state is deleted.
- Transfer provinces between states with the Transfer Wand.
- Merge selected states after explicitly choosing the surviving state.

State merges combine provinces, manpower, resources, cores, and victory points. State transfer and annexation persist both owner and controller values.

## Country tools

- Create a new three-character country TAG from selected states. The workflow writes a country definition, history, and English localisation file.
- Select multiple countries for bulk annexation.
- Create puppet relationships, release puppets, transfer states, and optionally auto-core transferred states.

The **Auto-Core All Transferred States** option applies to transfers, country creation, and annexation. Review selection and ownership carefully before confirming.

## Ocean-tile readiness

**Verify Ocean-Tile Readiness** is read-only. For each selected province it checks:

- Positive province ID, nonzero definition color, and loaded pixels.
- `sea` province type, `ocean` terrain, continent `0`, and coastal flag disabled.
- No state membership.
- Membership in exactly one strategic region.
- No loaded railway or supply-hub reference.

The report does not scan `map/buildings.txt` or arbitrary scripted references. Province-to-ocean conversion keeps surviving IDs stable; assign converted provinces to an appropriate strategic region, then run readiness verification.

Use **Consolidate Selected Ocean Provinces to One Tile** when several existing sea provinces should become one ocean province. The first selected province survives, receives canonical ocean definition fields, is removed from every state, and remains in exactly one strategic region. Empty source strategic regions are removed in the same persistence transaction.

Use **Convert Selected Water Provinces to Land** for the reverse definition change. The dialog refuses partial metadata: each converted province is assigned a non-naval terrain, positive loaded continent, existing state, and existing strategic region before the write begins.

## Railway and supply hub editor

Open the editor from the railway toolbar button or with the configured **Open the railway editor** shortcut (default `Ctrl+Alt+R`). It draws every railway on the map, colored by level, and keeps the map display in sync with the edits.

- **Select** picks a railway by clicking its line; click again to cycle overlapping railways. Select a node to split there, Shift+click a node to remove it, and Alt+click a province to detour through it.
- **Draw** starts a new railway or extends the selected one from its end or start. Auto-connect fills gaps along the shortest land route. While a new railway has only its first province, click a second province to finish it.
- The level control (or the configured level shortcuts, default `1`-`5`) changes the selected railway and new railways.
- **Reverse**, **Split**, and **Delete** modify the selected railway. Clicking the tip again steps back one province.
- **Supply hub** mode places supply hubs directly on land provinces. The same mode is available from the map-pin toolbar button or the configured **Open supply hub placement** shortcut (default `Ctrl+Alt+H`). Clicking a province that already has a hub removes it. Hubs are drawn as red squares while the editor is open.
- Undo and redo use the configured map-edit shortcuts (default `Ctrl+Z` and `Ctrl+Y`).

Every railway and supply hub edit saves automatically: railways to `map/railways.txt` and hubs to `map/supply_nodes.txt`, preserving leading comments in both files. Use the panel's retry button if a save fails.

## Undo and persistence

Map edits have their own undo/redo history. Selection undo/redo is separate. Saving persists supported edits to the relevant mod files, but undo is not a substitute for source control or a filesystem backup.

| Workflow | Primary files | Guard or recovery boundary |
| --- | --- | --- |
| Railway and supply hub edits | `map/railways.txt`, `map/supply_nodes.txt` | Automatic save, in-panel undo/redo, retry on failure, source control |
| Province paint/create/merge | Effective `provinces.bmp`, `definition.csv`, plus repaired dependent references | Draft Apply/Cancel, transactional validation, in-session undo/redo, source control |
| Ocean consolidation or water-to-land conversion | Effective `provinces.bmp`, `definition.csv`, affected state and strategic-region files | Explicit selection/metadata confirmation, transactional persistence, source control |
| State create/assign/merge | Effective `history/states` files and supported dependent memberships | Selection and survivor confirmation, map undo/redo, source control |
| Strategic-region create/assign | Effective `map/strategicregions` files | Selection confirmation, map undo/redo, source control |
| Country create/transfer/annex | Country definition/history/localisation and affected state histories | Explicit target/TAG confirmation, source control |
