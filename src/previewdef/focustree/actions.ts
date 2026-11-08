export type FocusTreeActionId =
    | 'fitTree'
    | 'delete'
    | 'duplicate'
    | 'moveLeft'
    | 'moveRight'
    | 'moveUp'
    | 'moveDown'
    | 'moveLeftFast'
    | 'moveRightFast'
    | 'moveUpFast'
    | 'moveDownFast';

export interface FocusTreeActionDefinition {
    id: FocusTreeActionId;
    title: string;
    /** Default keybindings in VS Code syntax. One command may offer several defaults. */
    keys: readonly string[];
}

export const FOCUS_TREE_ACTIONS: readonly FocusTreeActionDefinition[] = [
    { id: 'fitTree', title: 'Fit Tree to Window', keys: ['ctrl+0'] },
    { id: 'delete', title: 'Delete Selected Focuses', keys: ['delete', 'backspace'] },
    { id: 'duplicate', title: 'Duplicate Selected Focuses', keys: ['ctrl+d'] },
    { id: 'moveLeft', title: 'Move Selected Focuses Left', keys: ['arrowleft'] },
    { id: 'moveRight', title: 'Move Selected Focuses Right', keys: ['arrowright'] },
    { id: 'moveUp', title: 'Move Selected Focuses Up', keys: ['arrowup'] },
    { id: 'moveDown', title: 'Move Selected Focuses Down', keys: ['arrowdown'] },
    { id: 'moveLeftFast', title: 'Move Selected Focuses Left Faster', keys: ['shift+arrowleft'] },
    { id: 'moveRightFast', title: 'Move Selected Focuses Right Faster', keys: ['shift+arrowright'] },
    { id: 'moveUpFast', title: 'Move Selected Focuses Up Faster', keys: ['shift+arrowup'] },
    { id: 'moveDownFast', title: 'Move Selected Focuses Down Faster', keys: ['shift+arrowdown'] },
];

const actionIds = new Set<string>(FOCUS_TREE_ACTIONS.map(action => action.id));

export function isFocusTreeActionId(value: string): value is FocusTreeActionId {
    return actionIds.has(value);
}

export function focusTreeCommandId(action: FocusTreeActionId): string {
    return `hoi4modernutils.focusTree.${action}`;
}
