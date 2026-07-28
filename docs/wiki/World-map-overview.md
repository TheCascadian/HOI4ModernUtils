# World Map overview

## Views

The World Map can show province, state, strategic-region, supply-area, and country information. It can also surface map warnings and display data such as owner, controller, cores, state category, boundaries, and labels where the loaded content provides it.

## Navigation and selection

| Input | Default behavior |
| --- | --- |
| Left-click | Select or deselect a province in Province view. |
| Ctrl+left-click | Add or remove a province from a multi-selection. |
| Shift+left-drag | Select multiple provinces in Province view. |
| Right-drag | Pan the map. |
| Mouse wheel | Zoom around the pointer from 0.25x to 64x. |
| Shift + mouse wheel | Make smaller zoom adjustments. |
| Shift+right-click | Open the contextual map menu. |
| Double-click a province | Add or remove a placeholder victory point. |
| Double-click a state, strategic region, or supply area | Open the source file. |

Search for a province or state ID in the map search box, then press `Enter`.

## Warnings and tooltips

The map reports validation warnings for loaded map data, including province, state, strategic-region, supply-area, railway, river, terrain, and reference issues. Hover descriptions explain map actions. The **Compact Large Tooltips** setting reduces oversized warning tooltips while retaining full detail when compact mode is off.

Use warnings as an inspection aid, not as a guarantee that every HOI4 validation rule has passed. Validate in your target game version before publishing a mod.

## Performance menu

The World Map includes an **Experimental** Performance menu. Its options are saved with map view state.

- Warning indexing is designed to preserve visual output.
- Edge decimation, river pixel collapse, label-grid deduplication, and coarse province rendering can alter visual detail.
- Options that can change fidelity require a confirmation before enabling them.

Leave visually lossy options disabled when exact screenshot or pixel-level appearance matters.

## Selection and map data boundaries

Bulk selection ignores synthetic or zero-color recovery provinces. River selection maps river pixels back to their real map coordinates. These safeguards reduce accidental actions against synthetic recovery data, but they do not replace a backup.

**[PLACEHOLDER: Add annotated screenshots for each map view and the contextual menu.]**
