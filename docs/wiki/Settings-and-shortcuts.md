# Settings and shortcuts

## World Map shortcuts

| Default | Action | Setting |
| --- | --- | --- |
| `T` | Undo selection | `hoi4ModernUtils.worldMapSelectionUndoKeybind` |
| `R` | Redo selection | `hoi4ModernUtils.worldMapSelectionRedoKeybind` |
| `Ctrl+Z` | Undo map edit | `hoi4ModernUtils.worldMapMapUndoKeybind` |
| `Ctrl+Y` | Redo map edit | `hoi4ModernUtils.worldMapMapRedoKeybind` |
| `Ctrl+Shift+N` | Create state from current selection | `hoi4ModernUtils.worldMapCreateStateKeybind` |
| `Ctrl+Enter` | Assign selection to a state | `hoi4ModernUtils.worldMapAssignSelectionKeybind` |
| `Ctrl+Shift+G` | Assign selected states to a strategic region | `hoi4ModernUtils.worldMapAssignSelectionToStrategicRegionKeybind` |

Shortcut strings accept combinations such as `Ctrl+Shift+N` or `Alt+Enter`. Use the dedicated setting when map-edit history and selection history are both relevant.

## Extension settings

| Setting | Default | Purpose |
| --- | --- | --- |
| `hoi4ModernUtils.installPath` | Empty | Hearts of Iron IV installation folder. |
| `hoi4ModernUtils.loadDlcContents` | `true` | Load DLC images for previews. Uses more memory. |
| `hoi4ModernUtils.modFile` | Empty | Active `.mod` descriptor for mod and `replace_path` resolution. |
| `hoi4ModernUtils.enableSupplyArea` | `false` | Enable supply-area support for compatible HOI4 versions. |
| `hoi4ModernUtils.previewLocalisation` | VS Code language | Language used by preview content. |
| `hoi4ModernUtils.indexing` | `gfx`, `sharedfocus`, `localisation`, `event` | Content categories indexed for previews and references. |
| `hoi4ModernUtils.stateBoundaryColor` | `rgba(0, 0, 0, 0.4)` | Province-view state boundary color. |
| `hoi4ModernUtils.stateBoundaryWidth` | `1.5` | Province-view state boundary width multiplier. |
| `hoi4ModernUtils.featureFlags` | Empty | Enables or disables supported feature flags. Reload VS Code after changes. |
| `hoi4ModernUtils.worldMapConfirmNewProvinceCreation` | `true` | Require confirmation before creating a province. |
| `hoi4ModernUtils.worldMapAutoCoreTransfers` | `false` | Automatically add cores during supported transfers, annexation, and country creation. |

**[PLACEHOLDER: Add a complete current feature-flag reference, including stability status and expected reload behavior.]**
