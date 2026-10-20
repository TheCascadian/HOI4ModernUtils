import { Node, Token } from "../../hoiformat/hoiparser";
import { HOIPartial, SchemaDef, Position, convertNodeToJson, positionSchema, Raw, CustomMap } from "../../hoiformat/schema";
import { normalizeNumberLike } from "../../util/hoi4gui/common";
import { flatten, chain } from 'lodash';
import { ConditionItem, ConditionComplexExpr, extractConditionValues, extractConditionValue, extractConditionalExprs, sortConditionExprs } from "../../hoiformat/condition";
import { countryScope } from "../../hoiformat/scope";
import { isFeatureEnabled } from "../../util/featureflags";
import { NumberPosition, randomString, Warning } from "../../util/common";
import { localize } from "../../util/i18n";
import { validateFocusTree } from "./validation";
import { nodeToString } from "../../hoiformat/tostring";

export interface FocusTree {
    id: string;
    focuses: Record<string, Focus>;
    allowBranchOptions: string[];
    conditionExprs: ConditionItem[];
    isSharedFocues: boolean;
    continuousFocusPositionX?: number;
    continuousFocusPositionY?: number;
    searchFilters: string[];
    inlayWindows: FocusInlayWindowWithCondition[];
    continuousFocusPositionToken: Token | undefined;
    warnings: FocusWarning[];
    file: string;
    /** Byte range of the enclosing `focus_tree = { ... }` block, if any (absent for shared/joint focus pseudo-trees). Used as an insertion anchor when the tree has no focuses yet. */
    treeRange: TokenRange | undefined;
}

/** A byte offset span in a source document, used to build surgical (git-friendly) text edits. */
export interface TokenRange {
    start: number;
    end: number;
}

/** A `prerequisite = { ... }` or `mutually_exclusive = { ... }` block, with the focus IDs it lists and its exact source span. */
export interface FocusRelationGroup {
    ids: string[];
    range: TokenRange;
}

interface FocusIconWithCondition {
    icon: string | undefined;
    condition: ConditionComplexExpr;
}

export interface FocusInlayWindowWithCondition {
    id: string;
    position: NumberPositionWithCondition[];
    token: Token | undefined;
}

interface NumberPositionWithCondition extends NumberPosition {
    condition: ConditionComplexExpr;
}

export interface FocusStyle {
    name: string;
    default: boolean;
    unavailable: string;
    completed: string;
    available: string;
    current: string;
}

export interface Focus {
    x: number;
    y: number;
    id: string;
    icon: FocusIconWithCondition[];
    textIcon: string | undefined;
    searchFilters: string[];
    prerequisite: string[][];
    /** One entry per `prerequisite = { ... }` block, parallel in meaning to `prerequisite` but keeping the block's own span for surgical edits. */
    prerequisiteGroups: FocusRelationGroup[];
    exclusive: string[];
    /** One entry per `mutually_exclusive = { ... }` block; a block may list more than one ID. */
    exclusiveGroups: FocusRelationGroup[];
    hasAllowBranch: boolean;
    inAllowBranch: string[];
    allowBranch: ConditionComplexExpr | undefined;
    relativePositionId: string | undefined;
    /** Span of the `relative_position_id` value, when it is a single plain identifier (safe to patch in place). */
    relativePositionIdToken: Token | undefined;
    /** Span of the whole `relative_position_id = X` statement, for removing it entirely. */
    relativePositionIdRange: TokenRange | undefined;
    offset: Offset[];
    text: string | undefined;
    overlay: string | undefined;
    token: Token | undefined;
    /** Span of the focus's own `id` value, when it is a single plain identifier (safe to patch in place for a rename). */
    idToken: Token | undefined;
    xToken: Token | undefined;
    yToken: Token | undefined;
    /** Span of the whole `focus = { ... }` block, from the `focus` keyword through the closing brace. */
    blockRange: TokenRange | undefined;
    file: string;
    /** Common editable HOI4 fields, serialized without their outer `key =` wrapper. */
    editableProperties?: FocusEditableProperties;
}

export interface FocusEditableProperties {
    icon: string;
    cost: string;
    text: string;
    available: string;
    bypass: string;
    cancel: string;
    select_effect: string;
    completion_reward: string;
    remove_effect: string;
    complete_tooltip: string;
    ai_will_do: string;
    search_filters: string;
    will_lead_to_war_with: string;
    available_if_capitulated: boolean;
    cancel_if_invalid: boolean;
    continue_if_invalid: boolean;
}

export type EditableFocusProperty = keyof FocusEditableProperties;

export interface FocusWarning extends Warning<string> {
    navigations?: { file: string, start: number, end: number }[];
}

export interface UpdateFocusPositionsMessage {
    command: 'updateFocusPositions';
    lastDocumentChangeTimestamp: number;
    focuses: {
        focus: Focus;
        file?: string;
        x: number;
        y: number;
    }[];
}

export interface CreateFocusMessage {
    command: 'createFocus';
    lastDocumentChangeTimestamp: number;
    tree: FocusTree;
    id: string;
    x: number;
    y: number;
}

export interface DeleteFocusMessage {
    command: 'deleteFocus';
    lastDocumentChangeTimestamp: number;
    tree: FocusTree;
    focusIds: string[];
}

export interface DuplicateFocusMessage {
    command: 'duplicateFocus';
    lastDocumentChangeTimestamp: number;
    tree: FocusTree;
    focusIds: string[];
}

export interface DuplicateBranchMessage {
    command: 'duplicateBranch';
    lastDocumentChangeTimestamp: number;
    tree: FocusTree;
    rootFocusId: string;
}

export interface RenameFocusMessage {
    command: 'renameFocus';
    lastDocumentChangeTimestamp: number;
    tree: FocusTree;
    oldId: string;
    newId: string;
}

export interface SetPrerequisitesMessage {
    command: 'setPrerequisites';
    lastDocumentChangeTimestamp: number;
    focus: Focus;
    groups: string[][];
}

export interface SetMutuallyExclusiveMessage {
    command: 'setMutuallyExclusive';
    lastDocumentChangeTimestamp: number;
    focus: Focus;
    groups: string[][];
}

export interface SetRelativePositionMessage {
    command: 'setRelativePosition';
    lastDocumentChangeTimestamp: number;
    focus: Focus;
    anchorId: string | undefined;
    /** Rebased local coordinates that preserve the node's absolute canvas position. */
    x?: number;
    y?: number;
}

export interface SetFocusPropertiesMessage {
    command: 'setFocusProperties';
    lastDocumentChangeTimestamp: number;
    focus: Focus;
    properties: Partial<FocusEditableProperties>;
}

export type FocusTreeEditorMessage =
    UpdateFocusPositionsMessage |
    CreateFocusMessage |
    DeleteFocusMessage |
    DuplicateFocusMessage |
    DuplicateBranchMessage |
    RenameFocusMessage |
    SetPrerequisitesMessage |
    SetMutuallyExclusiveMessage |
    SetRelativePositionMessage |
    SetFocusPropertiesMessage;

interface Offset {
    x: number;
    y: number;
    trigger: ConditionComplexExpr | undefined;
}

interface FocusTreeDef {
    id: string;
    shared_focus: string[];
    focus: FocusDef[];
    continuous_focus_position: Position & { _token: Token; };
    inlay_window: FocusInlayWindowDef[];
    _token?: Token;
    _valueStartToken?: Token;
    _valueEndToken?: Token;
}

interface FocusInlayWindowDef {
    id: string;
    position: NumberPosition;
    override_position: OffsetDef[];
    _token: Token;
}

interface FocusDef {
    id: Raw;
    alternate_icon: string;
    icon: Raw[];
    text_icon: string;
    x: Raw;
    y: Raw;
    prerequisite: FocusOrORList[];
    mutually_exclusive: FocusOrORList[];
    relative_position_id: Raw;
    allow_branch: Raw[]; /* FIXME not symbol node */
    offset: OffsetDef[];
    _token: Token;
    _valueStartToken?: Token;
    _valueEndToken?: Token;
    text?: Raw;
    overlay?: string;
    cost: Raw;
    available: Raw;
    bypass: Raw;
    cancel: Raw;
    select_effect: Raw;
    completion_reward: Raw;
    remove_effect: Raw;
    complete_tooltip: Raw;
    ai_will_do: Raw;
    search_filters: Raw;
    will_lead_to_war_with: Raw;
    available_if_capitulated: Raw;
    cancel_if_invalid: Raw;
    continue_if_invalid: Raw;
}

interface FocusIconDef {
    trigger: Raw;
    value: string;
}

type FocusIconDefNew = CustomMap<Raw>;

interface OffsetDef {
    x: number;
    y: number;
    trigger: Raw[];
}

interface FocusOrORList {
    focus: string[];
    OR: string[];
    _token?: Token;
    _valueStartToken?: Token;
    _valueEndToken?: Token;
}

interface FocusFile {
    focus_tree: FocusTreeDef[];
    shared_focus: FocusDef[];
    joint_focus: FocusDef[];
    style: FocusStyle[];
}

const focusOrORListSchema: SchemaDef<FocusOrORList> = {
    focus: {
        _innerType: "string",
        _type: 'array',
    },
    OR: {
        _innerType: "string",
        _type: 'array',
    },
};

const focusSchema: SchemaDef<FocusDef> = {
    id: "raw",
    alternate_icon: "string",
    icon: {
        _innerType: 'raw',
        _type: 'array',
    },
    text_icon: "string",
    x: "raw",
    y: "raw",
    prerequisite: {
        _innerType: focusOrORListSchema,
        _type: 'array',
    },
    mutually_exclusive: {
        _innerType: focusOrORListSchema,
        _type: 'array',
    },
    relative_position_id: "raw",
    allow_branch: {
        _innerType: 'raw',
        _type: 'array',
    },
    offset: {
        _innerType: {
            x: "number",
            y: "number",
            trigger: {
                _innerType: 'raw',
                _type: 'array',
            },
        },
        _type: 'array',
    },
    text: "raw",
    overlay: "string",
    cost: "raw",
    available: "raw",
    bypass: "raw",
    cancel: "raw",
    select_effect: "raw",
    completion_reward: "raw",
    remove_effect: "raw",
    complete_tooltip: "raw",
    ai_will_do: "raw",
    search_filters: "raw",
    will_lead_to_war_with: "raw",
    available_if_capitulated: "raw",
    cancel_if_invalid: "raw",
    continue_if_invalid: "raw",
};

const focusTreeSchema: SchemaDef<FocusTreeDef> = {
    id: "string",
    shared_focus: {
        _innerType: "string",
        _type: "array",
    },
    focus: {
        _innerType: focusSchema,
        _type: 'array',
    },
    continuous_focus_position: positionSchema,
    inlay_window: {
        _innerType: {
            id: "string",
            position: {
                x: "number",
                y: "number",
            },
            override_position: {
                _innerType: {
                    x: "number",
                    y: "number",
                    trigger: {
                        _innerType: 'raw',
                        _type: 'array',
                    },
                },
                _type: 'array',
            },
        },
        _type: 'array',
    },
};

const focusStyleSchema: SchemaDef<FocusStyle> = {
    name: "string",
    default: "boolean",
    unavailable: "string",
    completed: "string",
    available: "string",
    current: "string",
};

const focusFileSchema: SchemaDef<FocusFile> = {
    focus_tree: {
        _innerType: focusTreeSchema,
        _type: "array",
    },
    shared_focus: {
        _innerType: focusSchema,
        _type: "array",
    },
    joint_focus: {
        _innerType: focusSchema,
        _type: "array",
    },
    style: {
        _innerType: focusStyleSchema,
        _type: "array",
    },
};

const focusIconSchema: SchemaDef<FocusIconDef> = {
    trigger: "raw",
    value: "string",
};

const focusIconSchemaNew: SchemaDef<FocusIconDefNew> = {
    _innerType: "raw",
    _type: "map",
};

export function convertFocusFileNodeToJson(node: Node, constants: {}): HOIPartial<FocusFile> {
    return convertNodeToJson<FocusFile>(node, focusFileSchema, constants);
}

export function getFocusTreeWithFocusFile(file: HOIPartial<FocusFile>, sharedFocusTrees: FocusTree[], filePath: string, constants: {}, sourceText?: string): FocusTree[] {
    const focusTrees: FocusTree[] = [];

    if (file.shared_focus.length > 0 || file.joint_focus.length > 0) {
        const conditionExprs: ConditionItem[] = [];
        const warnings: FocusWarning[] = [];
        const focuses = getFocuses([...file.shared_focus, ...file.joint_focus], conditionExprs, filePath, warnings, constants, sourceText);
        sortConditionExprs(conditionExprs);
        const sharedFocusTree = {
            id: localize('focustree.sharedfocuses', '<Shared focuses>'),
            focuses,
            allowBranchOptions: getAllowBranchOptions(focuses),
            conditionExprs,
            isSharedFocues: true,
            searchFilters: chain(focuses).flatMap(f => f.searchFilters).uniq().value(),
            inlayWindows: [],
            continuousFocusPositionToken: undefined,
            warnings,
            file: filePath,
            // Shared/joint focuses are top-level blocks with no enclosing container, so there is no anchor to append a brand-new focus against when the tree is empty.
            treeRange: undefined,
        };
        warnings.push(...validateFocusTree(sharedFocusTree));
        focusTrees.push(sharedFocusTree);
        sharedFocusTrees = [sharedFocusTree, ...sharedFocusTrees];
    }

    for (const focusTree of file.focus_tree) {
        const conditionExprs: ConditionItem[] = [];
        const warnings: FocusWarning[] = [];
        const focuses = getFocuses(focusTree.focus, conditionExprs, filePath, warnings, constants, sourceText);
        
        if (isFeatureEnabled('useConditionInFocus')) {
            for (const sharedFocus of focusTree.shared_focus) {
                if (!sharedFocus) {
                    continue;
                }
                addSharedFocus(focuses, filePath, sharedFocusTrees, sharedFocus, conditionExprs, warnings);
            }
        }

        validateRelativePositionId(focuses, warnings);

        const treeId = focusTree.id ?? localize('focustree.ananymous', '<Anonymous focus tree>');
        const inlayWindows = focusTree.inlay_window
            .map(w => parseInlayWindow(treeId, w, conditionExprs, warnings))
            .filter((w): w is FocusInlayWindowWithCondition => w !== undefined);
        sortConditionExprs(conditionExprs);
        const tree: FocusTree = {
            id: treeId,
            focuses,
            allowBranchOptions: getAllowBranchOptions(focuses),
            continuousFocusPositionX: normalizeNumberLike(focusTree.continuous_focus_position?.x, 0) ?? 50,
            continuousFocusPositionY: normalizeNumberLike(focusTree.continuous_focus_position?.y, 0) ?? 1000,
            conditionExprs,
            isSharedFocues: false,
            searchFilters: chain(focuses).flatMap(f => f.searchFilters).uniq().value(),
            inlayWindows,
            continuousFocusPositionToken: focusTree.continuous_focus_position?._token,
            warnings,
            file: filePath,
            treeRange: focusTree._token ?
                { start: focusTree._token.start, end: focusTree._valueEndToken?.end ?? focusTree._token.end } : undefined,
        };
        warnings.push(...validateFocusTree(tree));
        focusTrees.push(tree);
    }

    focusTrees.sort((a, b) => a.id.localeCompare(b.id));
    return focusTrees;
}

export function getFocusStyles(file: HOIPartial<FocusFile>): FocusStyle[] {
    const result: FocusStyle[] = [];
    for (const style of file.style ?? []) {
        if (style.available && style.completed && style.current && style.unavailable && style.name) {
            result.push({
                name: style.name,
                available: style.available,
                completed: style.completed,
                current: style.current,
                unavailable: style.unavailable,
                default: !!style.default,
            });
        }
    }
    return result;
}

export function getGfxNameForSearchFilter(filter: string): string {
    return `GFX_${filter}`;
}

function parseInlayWindow(focusId: string, inlayWindowDef: HOIPartial<FocusInlayWindowDef>, conditionExprs: ConditionItem[], warnings: FocusWarning[]): FocusInlayWindowWithCondition | undefined {
    const id = inlayWindowDef.id;
    if (!id) {
        warnings.push({
            text: localize('focustree.warnings.inlaywindownoid', "An inlay window defined in this file don't have ID."),
            source: focusId,
        });
        return undefined;
    }
    const positionInDef = inlayWindowDef.position;
    if (!positionInDef) {
        warnings.push({
            text: localize('focustree.warnings.inlaywindownoposition', "Inlay window {0} defined in this file don't have position.", id),
            source: focusId,
        });
        return undefined;
    }
    const position: NumberPositionWithCondition[] = [];
    for (const overridePosition of inlayWindowDef.override_position) {
        const x = overridePosition.x ?? 0;
        const y = overridePosition.y ?? 0;
        const condition = overridePosition.trigger ? extractConditionValues(overridePosition.trigger.filter((v): v is Raw => v !== undefined).map(v => v._raw.value), countryScope, conditionExprs).condition : false;
        if (condition === false) {
            warnings.push({
                text: localize('focustree.warnings.inlaywindowoverridepositionnocondition', "Inlay window {0} defined in this file has an override position that don't have a condition.", id),
                source: focusId,
            });
        } else {
            position.push({ x, y, condition });
        }
    }
    position.push({ x: positionInDef.x ?? 0, y: positionInDef.y ?? 0, condition: true });
    return { id, position, token: inlayWindowDef._token };
}

export function getFocusTree(node: Node, sharedFocusTrees: FocusTree[], filePath: string, sourceText?: string): FocusTree[] {
    const constants = {};
    const file = convertFocusFileNodeToJson(node, constants);

    return getFocusTreeWithFocusFile(file, sharedFocusTrees, filePath, constants, sourceText);
}

function getFocuses(hoiFocuses: HOIPartial<FocusDef>[], conditionExprs: ConditionItem[], filePath: string, warnings: FocusWarning[], constants: {}, sourceText?: string): Record<string, Focus> {
    const focuses: Record<string, Focus> = {};

    for (const hoiFocus of hoiFocuses) {
        const focus = getFocus(hoiFocus, conditionExprs, filePath, warnings, constants, sourceText);
        if (focus !== null) {
            if (focus.id in focuses) {
                const otherFocus = focuses[focus.id];
                warnings.push({
                    text: localize('focustree.warnings.focusidconflict', "There're more than one focuses with ID {0} in file: {1}.", focus.id, filePath),
                    source: focus.id,
                    navigations: [
                        {
                            file: filePath,
                            start: focus.token?.start ?? 0,
                            end: focus.token?.end ?? 0,
                        },
                        {
                            file: filePath,
                            start: otherFocus.token?.start ?? 0,
                            end: otherFocus.token?.end ?? 0,
                        },
                    ]
                });
            }
            focuses[focus.id] = focus;
        }
    }

    let hasChangedInAllowBranch = true;
    while (hasChangedInAllowBranch) {
        hasChangedInAllowBranch = false;
        for (const key in focuses) {
            const focus = focuses[key];
            const allPrerequisites = flatten(focus.prerequisite).filter(p => p in focuses);
            if (allPrerequisites.length === 0) {
                continue;
            }

            chain(allPrerequisites)
                .flatMap(p  => focuses[p].inAllowBranch)
                .forEach(ab => {
                    if (!focus.inAllowBranch.includes(ab)) {
                        focus.inAllowBranch.push(ab);
                        hasChangedInAllowBranch = true;
                    }
                })
                .value();
        }
    }

    return focuses;
}

function getFocus(hoiFocus: HOIPartial<FocusDef>, conditionExprs: ConditionItem[], filePath: string, warnings: FocusWarning[], constants: {}, sourceText?: string): Focus | null {
    const idValue = hoiFocus.id?._raw ? convertNodeToJson<string>(hoiFocus.id._raw, "string", constants) : undefined;
    const id = idValue ?? `[missing_id_${randomString(8)}]`;
    const idToken = hoiFocus.id?._valueStartToken === hoiFocus.id?._valueEndToken ? hoiFocus.id?._valueEndToken : undefined;

    if (!idValue) {
        warnings.push({
            text: localize('focustree.warnings.focusnoid', "A focus defined in this file don't have ID: {0}.", filePath),
            source: id,
        });
    }

    const x = hoiFocus.x?._raw ? convertNodeToJson<number>(hoiFocus.x._raw, "number", constants) ?? 0 : 0;
    const y = hoiFocus.y?._raw ? convertNodeToJson<number>(hoiFocus.y._raw, "number", constants) ?? 0 : 0;
    const relativePositionId = hoiFocus.relative_position_id?._raw ? convertNodeToJson<string>(hoiFocus.relative_position_id._raw, "string", constants) : undefined;
    const relativePositionIdToken = hoiFocus.relative_position_id?._valueStartToken === hoiFocus.relative_position_id?._valueEndToken ?
        hoiFocus.relative_position_id?._valueEndToken : undefined;
    const relativePositionIdRange: TokenRange | undefined = hoiFocus.relative_position_id?._token ?
        { start: hoiFocus.relative_position_id._token.start, end: hoiFocus.relative_position_id._valueEndToken?.end ?? hoiFocus.relative_position_id._token.end } : undefined;

    const exclusive = chain(hoiFocus.mutually_exclusive)
        .flatMap(f => f.focus.concat(f.OR))
        .filter((s): s is string => s !== undefined)
        .value();
    const exclusiveGroups = hoiFocus.mutually_exclusive.map(f => focusRelationGroup(f));
    const prerequisite = hoiFocus.prerequisite
        .map(p => p.focus.concat(p.OR).filter((s): s is string => s !== undefined));
    const prerequisiteGroups = hoiFocus.prerequisite.map(p => focusRelationGroup(p));
    const blockRange: TokenRange | undefined = hoiFocus._token ?
        { start: hoiFocus._token.start, end: hoiFocus._valueEndToken?.end ?? hoiFocus._token.end } : undefined;
    const icon = parseFocusIcon(hoiFocus.icon.filter((v): v is Raw => v !== undefined).map(v => v._raw), constants, conditionExprs);
    if (hoiFocus.alternate_icon) {
        const condition = { scopeName: '', nodeContent: 'Show alternate icon' };
        extractConditionalExprs(condition, conditionExprs);
        icon.unshift({ icon: hoiFocus.alternate_icon, condition });
    }
    const hasAllowBranch = hoiFocus.allow_branch.length > 0;
    const allowBranchCondition = extractConditionValues(hoiFocus.allow_branch.filter((v): v is Raw => v !== undefined).map(v => v._raw.value), countryScope, conditionExprs).condition;
    const offset: Offset[] = hoiFocus.offset.map(o => ({
        x: o.x ?? 0,
        y: o.y ?? 0,
        trigger: o.trigger ? extractConditionValues(o.trigger.filter((v): v is Raw => v !== undefined).map(v => v._raw.value), countryScope, conditionExprs).condition : false,
    }));

    const text = hoiFocus.text?._raw ? convertNodeToJson<string>(hoiFocus.text._raw, 'string', constants) : undefined;
    const overlay = hoiFocus.overlay;

    return {
        id,
        icon,
        x,
        y,
        idToken,
        relativePositionId,
        relativePositionIdToken,
        relativePositionIdRange,
        prerequisite,
        prerequisiteGroups,
        exclusive,
        exclusiveGroups,
        hasAllowBranch,
        inAllowBranch: hasAllowBranch ? [id] : [],
        allowBranch: allowBranchCondition,
        offset,
        token: hoiFocus._token,
        file: filePath,
        text,
        overlay,
        textIcon: hoiFocus.text_icon,
        searchFilters: searchFilterNames(hoiFocus.search_filters),
        xToken: hoiFocus.x?._valueStartToken === hoiFocus.x?._valueEndToken ? hoiFocus.x?._valueEndToken : undefined,
        yToken: hoiFocus.y?._valueStartToken === hoiFocus.y?._valueEndToken ? hoiFocus.y?._valueEndToken : undefined,
        blockRange,
        editableProperties: {
            icon: rawValue(hoiFocus.icon[0], sourceText),
            cost: rawValue(hoiFocus.cost, sourceText),
            text: rawValue(hoiFocus.text, sourceText),
            available: rawValue(hoiFocus.available, sourceText),
            bypass: rawValue(hoiFocus.bypass, sourceText),
            cancel: rawValue(hoiFocus.cancel, sourceText),
            select_effect: rawValue(hoiFocus.select_effect, sourceText),
            completion_reward: rawValue(hoiFocus.completion_reward, sourceText),
            remove_effect: rawValue(hoiFocus.remove_effect, sourceText),
            complete_tooltip: rawValue(hoiFocus.complete_tooltip, sourceText),
            ai_will_do: rawValue(hoiFocus.ai_will_do, sourceText),
            search_filters: rawValue(hoiFocus.search_filters, sourceText),
            will_lead_to_war_with: rawValue(hoiFocus.will_lead_to_war_with, sourceText),
            available_if_capitulated: rawBoolean(hoiFocus.available_if_capitulated?._raw),
            cancel_if_invalid: rawBoolean(hoiFocus.cancel_if_invalid?._raw),
            continue_if_invalid: rawBoolean(hoiFocus.continue_if_invalid?._raw),
        },
    };
}

function searchFilterNames(raw: HOIPartial<Raw> | undefined): string[] {
    const value = raw?._raw?.value;
    return Array.isArray(value) ? value.map(n => n.name).filter((n): n is string => !!n) : [];
}

function rawValue(raw: HOIPartial<Raw> | undefined, sourceText?: string): string {
    const node = raw?._raw;
    if (!node || node.value === null) {
        return '';
    }
    if (sourceText && raw?._valueStartToken && raw._valueEndToken) {
        if (Array.isArray(node.value)) {
            return sourceText.slice(raw._valueStartToken.end, raw._valueEndToken.start);
        }
        return sourceText.slice(raw._valueStartToken.start, raw._valueEndToken.end);
    }
    if (Array.isArray(node.value)) {
        return node.value.map(nodeToString).join('\n');
    }
    if (typeof node.value === 'string') {
        return JSON.stringify(node.value);
    }
    return node.value.name;
}

function rawBoolean(node: Node | undefined): boolean {
    return !!node && !Array.isArray(node.value) && typeof node.value !== 'string' && node.value?.name.toLowerCase() === 'yes';
}

function focusRelationGroup(group: HOIPartial<FocusOrORList>): FocusRelationGroup {
    const ids = group.focus.concat(group.OR).filter((s): s is string => s !== undefined);
    const range: TokenRange = { start: group._token?.start ?? 0, end: group._valueEndToken?.end ?? group._token?.end ?? 0 };
    return { ids, range };
}

function addSharedFocus(focuses: Record<string, Focus>, filePath: string, sharedFocusTrees: FocusTree[], sharedFocusId: string, conditionExprs: ConditionItem[], warnings: FocusWarning[]) {
    const sharedFocusTree = sharedFocusTrees.find(sft => sharedFocusId in sft.focuses);
    if (!sharedFocusTree) {
        return;
    }

    const sharedFocuses = sharedFocusTree.focuses;

    focuses[sharedFocusId] = sharedFocuses[sharedFocusId];
    updateConditionExprsByFocus(sharedFocuses[sharedFocusId], conditionExprs);

    let hasChanged = true;
    while (hasChanged) {
        hasChanged = false;
        for (const key in sharedFocuses) {
            if (key in focuses) {
                continue;
            }

            const focus = sharedFocuses[key];
            const allPrerequisites = flatten(focus.prerequisite).filter(p => p in sharedFocuses);
            if (allPrerequisites.length === 0) {
                continue;
            }

            if (allPrerequisites.every(p => p in focuses)) {
                if (focus.id in focuses) {
                    const otherFocus = focuses[focus.id];
                    warnings.push({
                        text: localize('focustree.warnings.focusidconflict2', "There're more than one focuses with ID {0} in files: {1}, {2}.", focus.id, filePath, focus.file),
                        source: focus.id,
                        navigations: [
                            {
                                file: focus.file,
                                start: focus.token?.start ?? 0,
                                end: focus.token?.end ?? 0,
                            },
                            {
                                file: filePath,
                                start: otherFocus.token?.start ?? 0,
                                end: otherFocus.token?.end ?? 0,
                            },
                        ]
                    });
                }
                focuses[key] = focus;
                updateConditionExprsByFocus(focus, conditionExprs);
                hasChanged = true;
            }
        }
    }

    for (const warning of sharedFocusTree.warnings) {
        if (warning.source in focuses) {
            warnings.push(warning);
        }
    }
}

function updateConditionExprsByFocus(focus: Focus, conditionExprs: ConditionItem[]) {
    if (focus.allowBranch) {
        extractConditionalExprs(focus.allowBranch, conditionExprs);
    }

    for (const offset of focus.offset) {
        if (offset.trigger) {
            extractConditionalExprs(offset.trigger, conditionExprs);
        }
    }

    for (const icon of focus.icon) {
        extractConditionalExprs(icon.condition, conditionExprs);
    }
}

function getAllowBranchOptions(focuses: Record<string, Focus>): string[] {
    return chain(focuses)
        .filter(f => f.hasAllowBranch && f.allowBranch !== true)
        .map(f => f.id)
        .uniq()
        .value();
}

function validateRelativePositionId(focuses: Record<string, Focus>, warnings: FocusWarning[]) {
    const relativePositionId: Record<string, Focus | undefined> = {};
    const relativePositionIdChain: string[] = [];
    const circularReported: Record<string, boolean> = {};

    for (const focus of Object.values(focuses)) {
        if (focus.relativePositionId === undefined) {
            continue;
        }

        if (!(focus.relativePositionId in focuses)) {
            warnings.push({
                text: localize('focustree.warnings.relativepositionidnotexist', 'Relative position ID of focus {0} not exist: {1}.', focus.id, focus.relativePositionId),
                source: focus.id,
            });
            continue;
        }

        relativePositionIdChain.length = 0;
        relativePositionId[focus.id] = focuses[focus.relativePositionId];
        let currentFocus: Focus | undefined = focus;
        while (currentFocus) {
            if (circularReported[currentFocus.id]) {
                break;
            }

            relativePositionIdChain.push(currentFocus.id);
            const nextFocus: Focus | undefined = relativePositionId[currentFocus.id];
            if (nextFocus && relativePositionIdChain.includes(nextFocus.id)) {
                relativePositionIdChain.forEach(r => circularReported[r] = true);
                relativePositionIdChain.push(nextFocus.id);
                warnings.push({
                    text: localize('focustree.warnings.relativepositioncircularref', "There're circular reference in relative position ID of these focuses: {0}.", relativePositionIdChain.join(' -> ')),
                    source: focus.id,
                });
                break;
            }
            currentFocus = nextFocus;
        }
    }
}

function parseFocusIcon(nodes: Node[], constants: {}, conditionExprs: ConditionItem[]): FocusIconWithCondition[] {
    return chain(nodes).flatMap(n => parseSingleFocusIcon(n, constants, conditionExprs)).filter((v): v is FocusIconWithCondition => v !== undefined).value();
}

function parseSingleFocusIcon(node: Node, constants: {}, conditionExprs: ConditionItem[]): FocusIconWithCondition[] {
    const stringResult = convertNodeToJson<string>(node, 'string', constants);
    if (stringResult) {
        return [{ icon: stringResult, condition: true }];
    }
    
    const iconWithCondition = convertNodeToJson<FocusIconDef>(node, focusIconSchema, constants);
    if (iconWithCondition && iconWithCondition.value && iconWithCondition.trigger) {
        return [{
            icon: iconWithCondition.value,
            condition: iconWithCondition.trigger ? extractConditionValue(iconWithCondition.trigger._raw.value, countryScope, conditionExprs).condition : true,
        }];
    }

    const iconWithConditionNew = convertNodeToJson<FocusIconDefNew>(node, focusIconSchemaNew, constants);
    if (iconWithConditionNew) {
        const iconWithConditionList: FocusIconWithCondition[] = [];
        for (const [icon, condition] of Object.entries(iconWithConditionNew._map)) {
            if (icon && condition._value) {
                iconWithConditionList.push({
                    icon,
                    condition: extractConditionValue(condition._value._raw.value, countryScope, conditionExprs).condition,
                });
            }
        }
        return iconWithConditionList;
    }

    return [];
}
