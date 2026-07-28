# Safe editing and recovery

## Non-negotiable preparation

Before any map edit, especially merge, consolidation, batch cleanup, or reindexing:

1. Commit the mod or make a complete copy outside the active workspace.
2. Confirm the selected `.mod` descriptor and its `replace_path` behavior.
3. Check that the intended map files are loaded from the intended base game and mod layers.
4. Keep experimental renderer controls off if you need pixel-identical screenshots.

## Confirmation and scope

Destructive actions present confirmation UI. Read the selected states, countries, area, and surviving entity before proceeding. A confirmation prevents casual activation; it does not validate your design choices or provide a rollback after saving.

## Undo and redo

Map-edit undo/redo is separate from selection undo/redo. Use the configured map shortcuts for file-changing operations and the selection shortcuts for changing only the current selection.

Undo/redo applies to supported in-session map edits. It is not guaranteed to restore unrelated manual edits, external tool changes, or a closed session. Source control remains the dependable recovery path.

## Validate after saving

Inspect written map files and extension warnings, then validate with the same HOI4 game version, mod load order, and DLC setup that you will release against. A clean TypeScript test run does not prove a live HOI4 launch is clean.

## When something looks wrong

1. Stop further destructive actions.
2. Do not overlay generated map files on top of an unknown stale installation.
3. Restore the last known-good mod copy or Git commit.
4. Reproduce on a minimal copy and collect the first relevant extension warning or HOI4 log message.

**[PLACEHOLDER: Add project-specific backup locations, supported recovery scripts, and maintainer escalation contacts.]**
