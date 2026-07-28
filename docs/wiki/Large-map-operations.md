# Large map operations

Large operations can modify many files and IDs. Treat every action on this page as destructive unless you have verified it on a disposable copy of your mod.

## Consolidation

The built-in North America consolidation pipeline can merge continental provinces, affected states, and strategic regions; clear scoped buildings and supply infrastructure; repair supported references; and assign the result to a chosen country.

The generalized workflow can run against every loaded continent. Its sequential all-continent mode selects each continent's dominant current owner.

Consolidation keeps land and water survivors separate, and keeps Land/Water strategic regions separate. It also avoids merging lake provinces into sea provinces.

Consolidation uses the IDs currently loaded from the effective mod, so prior world edits and non-sequential IDs are supported. It does not automatically run the global reindex action. States and strategic regions that cross a continent boundary keep their out-of-continent provinces and unrelated content; only records emptied by the consolidation are removed. If the continent has no existing land or water strategic region, the workflow creates the required region.

Rerunning an already-consolidated continent is supported. A missing or unreadable `provinces.bmp` is still a hard failure because bitmap and definition changes cannot be safely separated.

## Batch actions

Selected-area and global actions include:

- Clear railways, buildings, supply hubs, water crossings, and state resources in the selected area.
- Set every affected state to one population.
- Set affected states to the lowest non-wasteland development category, or include wasteland when explicitly enabled.
- Convert an eligible selection to ocean and rebuild supported memberships and references without forcing a global reindex. When exact rivers are selected, only the selected `rivers.bmp` pixels are extracted into new ocean provinces. Assign ordinary converted provinces to an appropriate strategic region and run **Verify Ocean-Tile Readiness** afterward.
- Optionally split the selected-area operation by continent.
- Remove all water crossings or all state resources globally.
- Remove all cores without changing state owner or controller.

Selected Area Tools are enabled only in the relevant view: province-scoped actions require Province view, state-only operations require State view, and supply-hub cleanup also supports Supply Area view. Review the action scope in the confirmation UI. A confirmation only verifies intent, not mod design correctness.

## Reindex all provinces and states

**REINDEX ALL PROVINCES AND STATES** sequentially rebuilds loaded province and state IDs and repairs supported dependent references, including map definitions, state and strategic-region data, supply areas, country capitals, adjacency, railways, supply nodes, and buildings.

Run this only after a full backup and only when changing IDs is intentional. Do not use it merely to resolve an ordinary warning.

## Recommended workflow

1. Commit or duplicate the mod.
2. Limit the map selection and run the smallest supported operation.
3. Inspect the written files and map warnings.
4. Run extension tests or your mod's validation workflow.
5. Launch HOI4 with the same game version and playset you intend to support.

If a large operation fails, stop, preserve the first error, and restore the complete affected file set from source control or a known-good copy. Do not overlay only one generated map file onto a partially changed mod.
