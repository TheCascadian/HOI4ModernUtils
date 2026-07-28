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

After a supported province merge, the extension repairs affected state victory points, strategic-region membership, `adjacencies.csv`, `railways.txt`, and `supply_nodes.txt`. The standalone province-reference resolver can remove or repair invalid supported references.

The paintbrush keeps edits in a draft until **Apply & Exit**. Version 0.4.4 batches every interpolated pointer sample into one draft update and caches the staged overlay, fixing the severe slowdown that appeared as the painted region grew. A deterministic synthetic 20,000-pixel, 256-dab workload measured 99.75% lower processing time than the previous per-dab path; this does not replace live Extension Host testing.

## State and strategic-region editing

- Create a state from the current selection.
- Assign selected provinces to an existing state.
- Create or assign a strategic region from selected states or provinces.
- Transfer provinces between states with the Transfer Wand.
- Merge selected states after explicitly choosing the surviving state.

State merges combine provinces, manpower, resources, cores, and victory points. State transfer and annexation persist both owner and controller values.

## Country tools

- Create a new three-character country TAG from selected states. The workflow writes a country definition, history, and English localisation file.
- Select multiple countries for bulk annexation.
- Create puppet relationships, release puppets, transfer states, and optionally auto-core transferred states.

The **Auto-Core All Transferred States** option applies to transfers, country creation, and annexation. Review selection and ownership carefully before confirming.

## Undo and persistence

Map edits have their own undo/redo history. Selection undo/redo is separate. Saving persists supported edits to the relevant mod files, but undo is not a substitute for source control or a filesystem backup.

| Workflow | Primary files | Guard or recovery boundary |
| --- | --- | --- |
| Province paint/create/merge | Effective `provinces.bmp`, `definition.csv`, plus repaired dependent references | Draft Apply/Cancel, transactional validation, in-session undo/redo, source control |
| State create/assign/merge | Effective `history/states` files and supported dependent memberships | Selection and survivor confirmation, map undo/redo, source control |
| Strategic-region create/assign | Effective `map/strategicregions` files | Selection confirmation, map undo/redo, source control |
| Country create/transfer/annex | Country definition/history/localisation and affected state histories | Explicit target/TAG confirmation, source control |
