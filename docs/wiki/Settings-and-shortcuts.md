# Settings and shortcuts

## Editing keybindings

Every keyboard action in the World Map and Focus Tree is a regular VS Code command, so VS Code's Keyboard Shortcuts editor is the single place to view and rebind them.

Run **HOI4 Mod Utilities: Open Keyboard Shortcuts** from the Command Palette, press `Ctrl+Alt+K`, or open the extension's gear menu in the Extensions view and choose **Keyboard Shortcuts**. The editor opens filtered to this extension, so every World Map and Focus Tree action is listed. You can also run **Preferences: Open Keyboard Shortcuts** at any time and filter with `@ext:thecascadian.hoi4modernutils`. Change a row to set a new combination, or use the reset action to restore its default. VS Code reports conflicts and writes the result to your own `keybindings.json`. The Settings panel lists configuration values only; keybindings are changed in the Keyboard Shortcuts editor.

Bindings are scoped: map actions only fire while the World Map is focused, railway actions only while the railway editor is open, building actions only while building placement is open, and focus tree actions only while a focus tree preview is focused. Single-key bindings also yield while the cursor is inside a text field or menu.

## Map shortcuts

| Default | Action |
| --- | --- |
| `P` | Toggle Brush |
| `E` | Toggle the staged-pixel eraser while painting |
| `F` | Toggle Fill Bucket |
| `L` | Toggle Lasso |
| `W` | Toggle Transfer Wand |
| `Ctrl+Alt+P` | Start new-province painting |
| `Escape` | Cancel or close the current tool |
| `Ctrl+Z` | Undo map edit |
| `Ctrl+Y` | Redo map edit |
| `T` | Undo selection, or undo the current staged paint draft while painting |
| `R` | Redo selection, or redo the current staged paint draft while painting |
| `Ctrl+Shift+N` | Create a state from the current selection |
| `Ctrl+Enter` | Assign the current selection to a state |
| `Ctrl+Shift+G` | Assign selected states to a strategic region |
| `Ctrl+Alt+R` | Open the railway editor |
| `Ctrl+Alt+H` | Open supply hub placement |
| `Ctrl+Alt+B` | Open building placement |
| `Ctrl+Alt+I` | Open the Settings menu |
| `Ctrl+Alt+A` | Open accessibility and interface preferences |
| `Ctrl+Alt+Shift+P` | Open experimental performance options |

## Railway editor shortcuts

These bindings only apply while the railway editor is open.

| Default | Action |
| --- | --- |
| `S` | Select mode |
| `D` | Draw mode |
| `H` | Supply hub mode |
| `R` | Reverse the selected railway |
| `X` | Split the selected railway at the selected node |
| `Delete` | Delete the selected railway |
| `Backspace` | Remove the last node |
| `[` / `]` | Previous / next railway |
| `Tab` | Switch the extension end between start and end |
| `Enter` | Finish drawing |
| `1`-`5` | Set the railway level |

## Building placement shortcuts

These bindings only apply while building placement is open.

| Default | Action |
| --- | --- |
| `P` | Place mode |
| `X` | Erase mode |
| `[` / `]` | Rotate left / right |

## Focus tree shortcuts

These bindings only apply while a focus tree preview is focused.

| Default | Action |
| --- | --- |
| `Ctrl+0` | Fit the whole tree to the window |
| `Delete` / `Backspace` | Delete the selected focuses |
| `Ctrl+D` | Duplicate the selected focuses |
| `Arrow keys` | Move the selected focuses by one grid step |
| `Shift+Arrow keys` | Move the selected focuses by five grid steps |

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

## Feature flags

The `hoi4ModernUtils.featureFlags` array accepts:

- `useConditionInFocus`: enable conditional behavior in focus previews.
- `eventTreePreview`: enable event-tree preview behavior.
- `rightButtonDrag`: enable right-button map dragging.
- Prefix any listed value with `!` to explicitly disable it.

Reload VS Code after changing feature flags.
