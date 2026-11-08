/**
 * Shared registry of every keyboard-bindable World Map action.
 *
 * The extension contributes one command and one default keybinding per entry,
 * so VS Code's Keyboard Shortcuts editor is the single place to view and
 * rebind them. The webview only receives action ids and never stores bindings.
 */

export type WorldMapActionScope = 'global' | 'paint' | 'railway' | 'building';

export type WorldMapActionId =
    | 'paintBrush'
    | 'paintEraser'
    | 'fillBucket'
    | 'lasso'
    | 'transferWand'
    | 'createNewProvince'
    | 'cancel'
    | 'mapUndo'
    | 'mapRedo'
    | 'selectionUndo'
    | 'selectionRedo'
    | 'createStateFromSelection'
    | 'assignSelectionToState'
    | 'assignSelectionToStrategicRegion'
    | 'toggleRailwayEditor'
    | 'toggleSupplyHubMode'
    | 'toggleBuildingEditor'
    | 'openInterfaceMenu'
    | 'openAccessibilityMenu'
    | 'openPerformanceMenu'
    | 'railwaySelectMode'
    | 'railwayDrawMode'
    | 'railwaySupplyMode'
    | 'railwayReverse'
    | 'railwaySplit'
    | 'railwayDelete'
    | 'railwayStepBack'
    | 'railwayPrevious'
    | 'railwayNext'
    | 'railwaySwitchEnd'
    | 'railwayFinish'
    | 'railwayLevel1'
    | 'railwayLevel2'
    | 'railwayLevel3'
    | 'railwayLevel4'
    | 'railwayLevel5'
    | 'buildingPlaceMode'
    | 'buildingEraseMode'
    | 'buildingRotateLeft'
    | 'buildingRotateRight';

export interface WorldMapActionDefinition {
    id: WorldMapActionId;
    /** English title used for the contributed command and as a fallback label. */
    title: string;
    scope: WorldMapActionScope;
    /** Default keybinding in VS Code syntax. */
    key: string;
}

export const WORLD_MAP_ACTIONS: readonly WorldMapActionDefinition[] = [
    { id: 'paintBrush', title: 'Toggle Brush', scope: 'global', key: 'p' },
    { id: 'paintEraser', title: 'Toggle Eraser While Painting', scope: 'paint', key: 'e' },
    { id: 'fillBucket', title: 'Toggle Fill Bucket', scope: 'global', key: 'f' },
    { id: 'lasso', title: 'Toggle Lasso', scope: 'global', key: 'l' },
    { id: 'transferWand', title: 'Toggle Transfer Wand', scope: 'global', key: 'w' },
    { id: 'createNewProvince', title: 'Start New Province Painting', scope: 'global', key: 'ctrl+alt+p' },
    { id: 'cancel', title: 'Cancel or Close Current Tool', scope: 'global', key: 'escape' },
    { id: 'mapUndo', title: 'Undo Map Edit', scope: 'global', key: 'ctrl+z' },
    { id: 'mapRedo', title: 'Redo Map Edit', scope: 'global', key: 'ctrl+y' },
    { id: 'selectionUndo', title: 'Undo Selection or Paint Draft', scope: 'global', key: 't' },
    { id: 'selectionRedo', title: 'Redo Selection or Paint Draft', scope: 'global', key: 'r' },
    { id: 'createStateFromSelection', title: 'Create State from Selection', scope: 'global', key: 'ctrl+shift+n' },
    { id: 'assignSelectionToState', title: 'Assign Selection to State', scope: 'global', key: 'ctrl+enter' },
    { id: 'assignSelectionToStrategicRegion', title: 'Assign Selection to Strategic Region', scope: 'global', key: 'ctrl+shift+g' },
    { id: 'toggleRailwayEditor', title: 'Open Railway Editor', scope: 'global', key: 'ctrl+alt+r' },
    { id: 'toggleSupplyHubMode', title: 'Open Supply Hub Placement', scope: 'global', key: 'ctrl+alt+h' },
    { id: 'toggleBuildingEditor', title: 'Open Building Placement', scope: 'global', key: 'ctrl+alt+b' },
    { id: 'openInterfaceMenu', title: 'Open Settings Menu', scope: 'global', key: 'ctrl+alt+i' },
    { id: 'openAccessibilityMenu', title: 'Open Accessibility Options', scope: 'global', key: 'ctrl+alt+a' },
    { id: 'openPerformanceMenu', title: 'Open Performance Options', scope: 'global', key: 'ctrl+alt+shift+p' },

    { id: 'railwaySelectMode', title: 'Railway: Select Mode', scope: 'railway', key: 's' },
    { id: 'railwayDrawMode', title: 'Railway: Draw Mode', scope: 'railway', key: 'd' },
    { id: 'railwaySupplyMode', title: 'Railway: Supply Hub Mode', scope: 'railway', key: 'h' },
    { id: 'railwayReverse', title: 'Railway: Reverse Selected', scope: 'railway', key: 'r' },
    { id: 'railwaySplit', title: 'Railway: Split Selected', scope: 'railway', key: 'x' },
    { id: 'railwayDelete', title: 'Railway: Delete Selected', scope: 'railway', key: 'delete' },
    { id: 'railwayStepBack', title: 'Railway: Remove Last Node', scope: 'railway', key: 'backspace' },
    { id: 'railwayPrevious', title: 'Railway: Previous Railway', scope: 'railway', key: '[' },
    { id: 'railwayNext', title: 'Railway: Next Railway', scope: 'railway', key: ']' },
    { id: 'railwaySwitchEnd', title: 'Railway: Switch Extension End', scope: 'railway', key: 'tab' },
    { id: 'railwayFinish', title: 'Railway: Finish Drawing', scope: 'railway', key: 'enter' },
    { id: 'railwayLevel1', title: 'Railway: Level 1', scope: 'railway', key: '1' },
    { id: 'railwayLevel2', title: 'Railway: Level 2', scope: 'railway', key: '2' },
    { id: 'railwayLevel3', title: 'Railway: Level 3', scope: 'railway', key: '3' },
    { id: 'railwayLevel4', title: 'Railway: Level 4', scope: 'railway', key: '4' },
    { id: 'railwayLevel5', title: 'Railway: Level 5', scope: 'railway', key: '5' },

    { id: 'buildingPlaceMode', title: 'Building: Place Mode', scope: 'building', key: 'p' },
    { id: 'buildingEraseMode', title: 'Building: Erase Mode', scope: 'building', key: 'x' },
    { id: 'buildingRotateLeft', title: 'Building: Rotate Left', scope: 'building', key: '[' },
    { id: 'buildingRotateRight', title: 'Building: Rotate Right', scope: 'building', key: ']' },
];

const actionIds = new Set<string>(WORLD_MAP_ACTIONS.map(action => action.id));

export function isWorldMapActionId(value: string): value is WorldMapActionId {
    return actionIds.has(value);
}

export function worldMapCommandId(action: WorldMapActionId): string {
    return `hoi4modernutils.worldMap.${action}`;
}
