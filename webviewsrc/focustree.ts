import { getState, setState, arrayToMap, subscribeNavigators, scrollToState, tryRun, enableZoom, subscribePreviewLabelToggle, refreshPreviewLabelMode, ZoomControl } from "./util/common";
import { DivDropdown } from "./util/dropdown";
import { difference, flatten, minBy } from "lodash";
import { renderGridBoxCommon, GridBoxItem, GridBoxConnection } from "../src/util/hoi4gui/gridboxcommon";
import { StyleTable, normalizeForStyle } from "../src/util/styletable";
import {
    FocusTree, Focus, UpdateFocusPositionsMessage,
    CreateFocusMessage, DeleteFocusMessage, DuplicateFocusMessage, DuplicateBranchMessage, RenameFocusMessage,
    SetPrerequisitesMessage, SetMutuallyExclusiveMessage, SetRelativePositionMessage,
} from "../src/previewdef/focustree/schema";
import { applyCondition, ConditionItem, conditionItemToStringValue, conditionToString, stringValueToConditionItem } from "../src/hoiformat/condition";
import { NumberPosition } from "../src/util/common";
import { GridBoxType } from "../src/hoiformat/gui";
import { toNumberLike } from "../src/hoiformat/schema";
import { feLocalize } from './util/i18n';
import { Checkbox } from "./util/checkbox";
import { vscode } from "./util/vscode";

function showBranch(visibility: boolean, optionClass: string) {
    const elements = document.getElementsByClassName(optionClass);

    const hiddenBranches = getState().hiddenBranches || {};
    if (visibility) {
        delete hiddenBranches[optionClass];
    } else {
        hiddenBranches[optionClass] = true;
    }
    setState({ hiddenBranches: hiddenBranches });

    for (let i = 0; i < elements.length; i++) {
        const element = elements[i] as HTMLDivElement;
        element.style.display = element.className.split(' ').some(b => hiddenBranches[b]) ? "none" : "block";
    }
};

function search(searchContent: string, navigate: boolean = true) {
    const focuses = document.getElementsByClassName('focus');
    const searchedFocus: HTMLDivElement[] = [];
    let navigated = false;
    for (let i = 0; i < focuses.length; i++) {
        const focus = focuses[i] as HTMLDivElement;
        if (searchContent && focus.id.toLowerCase().replace(/^focus_/, '').includes(searchContent)) {
            focus.style.outline = '1px solid #E33';
            focus.style.background = 'rgba(255, 0, 0, 0.5)';
            if (navigate && !navigated) {
                focus.scrollIntoView({ block: "center", inline: "center" });
                navigated = true;
            }
            searchedFocus.push(focus);
        } else {
            focus.style.outlineWidth = '0';
            focus.style.background = 'transparent';
        }
    }

    return searchedFocus;
}

const useConditionInFocus: boolean = (window as any).__featureflags.useConditionInFocus;
const rightButtonDrag: boolean = (window as any).__featureflags.rightButtonDrag;
const focusTrees: FocusTree[] = (window as any).focusTrees;

let selectedExprs: ConditionItem[] = getState().selectedExprs ?? [];
let selectedFocusTreeIndex: number = Math.min(focusTrees.length - 1, getState().selectedFocusTreeIndex ?? 0);
let allowBranches: DivDropdown | undefined = undefined;
let conditions: DivDropdown | undefined = undefined;
let checkedFocuses: Record<string, Checkbox> = {};
let selectedFocusIds: string[] = getState().selectedFocusIds ?? [];
let zoomControl: ZoomControl | undefined;

async function buildContent() {
    const focusCheckState = getState().checkedFocuses ?? {};
    const checkedFocusesExprs = Object.keys(focusCheckState)
        .filter(fid => focusCheckState[fid])
        .map(fid => ({ scopeName: '', nodeContent: 'has_completed_focus = ' + fid }));
    clearCheckedFocuses();

    const focustreeplaceholder = document.getElementById('focustreeplaceholder') as HTMLDivElement;
    
    const styleTable = new StyleTable();
    const renderedFocus: Record<string, string> = (window as any).renderedFocus;
    const focusTree = focusTrees[selectedFocusTreeIndex];
    const focuses = Object.values(focusTree.focuses);

    const allowBranchOptionsValue: Record<string, boolean> = {};
    const exprs = [{ scopeName: '', nodeContent: 'has_focus_tree = ' + focusTree.id }, ...checkedFocusesExprs, ...selectedExprs];
    focusTree.allowBranchOptions.forEach(option => {
        const focus = focusTree.focuses[option];
        allowBranchOptionsValue[option] = !focus || focus.allowBranch === undefined || applyCondition(focus.allowBranch, exprs);
    });

    const gridbox: GridBoxType = (window as any).gridBox;

    const focusPosition: Record<string, NumberPosition> = {};
    calculateFocusAllowed(focusTree, allowBranchOptionsValue);
    const focusGrixBoxItems = focuses.map(focus => focusToGridItem(focus, focusTree, allowBranchOptionsValue, focusPosition, exprs)).filter((v): v is GridBoxItem => !!v);
    
    const minX = minBy(Object.values(focusPosition), 'x')?.x ?? 0;
    const leftPadding = gridbox.position.x._value - Math.min(minX * (window as any).xGridSize, 0);

    const focusTreeContent = await renderGridBoxCommon({ ...gridbox, position: {...gridbox.position, x: toNumberLike(leftPadding)} }, {
        size: { width: 0, height: 0 },
        orientation: 'upper_left'
    }, {
        styleTable,
        items: arrayToMap(focusGrixBoxItems, 'id'),
        onRenderItem: item => Promise.resolve(
            renderedFocus[item.id]
                .replace(/\{\{position\}\}/g, item.gridX + ', ' + item.gridY)
                .replace('{{iconClass}}', getFocusIcon(focusTree.focuses[item.id], exprs, styleTable))
            ),
        cornerPosition: 0.5,
    });

    focustreeplaceholder.innerHTML = focusTreeContent + styleTable.toStyleElement((window as any).styleNonce);

    refreshPreviewLabelMode();
    subscribeNavigators();
    setupCheckedFocuses(focuses, focusTree);
    setupFocusDragging(focuses);
    refreshFocusSelection();
}

function calculateFocusAllowed(focusTree: FocusTree, allowBranchOptionsValue: Record<string, boolean>) {
    const focuses = focusTree.focuses;

    let changed = true;
    while (changed) {
        changed = false;
        for (const key in focuses) {
            const focus = focuses[key];
            if (focus.prerequisite.length === 0) {
                continue;
            }

            if (focus.id in allowBranchOptionsValue) {
                continue;
            }

            let allow = true;
            for (const andPrerequests of focus.prerequisite) {
                if (andPrerequests.length === 0) {
                    continue;
                }
                allow = allow && andPrerequests.some(p => allowBranchOptionsValue[p] === true);
                const deny = andPrerequests.every(p => allowBranchOptionsValue[p] === false);
                if (deny) {
                    allowBranchOptionsValue[focus.id] = false;
                    changed = true;
                    break;
                }
            }
            if (allow) {
                allowBranchOptionsValue[focus.id] = true;
                changed = true;
            }
        }
    }
}

function updateSelectedFocusTree(clearCondition: boolean) {
    const focusTree = focusTrees[selectedFocusTreeIndex];
    const continuousFocuses = document.getElementById('continuousFocuses') as HTMLDivElement;

    if (focusTree.continuousFocusPositionX !== undefined && focusTree.continuousFocusPositionY !== undefined) {
        continuousFocuses.style.left = (focusTree.continuousFocusPositionX - 59) + 'px';
        continuousFocuses.style.top = (focusTree.continuousFocusPositionY + 7) + 'px';
        continuousFocuses.style.display = 'block';
    } else {
        continuousFocuses.style.display = 'none';
    }

    if (useConditionInFocus) {
        const conditionExprs = focusTree.conditionExprs.filter(e => e.scopeName !== '' ||
            (!e.nodeContent.startsWith('has_focus_tree = ') && !e.nodeContent.startsWith('has_completed_focus = ')));

        const conditionContainerElement = document.getElementById('condition-container') as HTMLDivElement | null;
        if (conditionContainerElement) {
            conditionContainerElement.style.display = conditionExprs.length > 0 ? 'block' : 'none';
        }

        if (conditions) {
            conditions.setupOptions(conditionExprs.map(option => ({ value: conditionItemToStringValue(option), text: conditionToString(option) })));
            conditions.selectedValues$.next(clearCondition ? [] : selectedExprs.map(conditionItemToStringValue));
        }

    } else {
        const allowBranchesContainerElement = document.getElementById('allowbranch-container') as HTMLDivElement | null;
        if (allowBranchesContainerElement) {
            allowBranchesContainerElement.style.display = focusTree.allowBranchOptions.length > 0 ? 'block' : 'none';
        }

        if (allowBranches) {
            allowBranches.setupOptions(focusTree.allowBranchOptions.map(option => ({ value: 'inbranch_' + option, text: option })));
            allowBranches.selectAll();
        }
    }

    const warnings = document.getElementById('warnings') as HTMLTextAreaElement | null;
    if (warnings) {
        warnings.value = focusTree.warnings.length === 0 ? feLocalize('worldmap.warnings.nowarnings', 'No warnings.') :
            focusTree.warnings.map(w => `[${w.source}] ${w.text}`).join('\n');
    }

    if (clearCondition) {
        selectedFocusIds = [];
        setState({ selectedFocusIds });
    }
}

function getFocusPosition(
    focus: Focus | undefined,
    positionByFocusId: Record<string, NumberPosition>,
    focusTree: FocusTree,
    focusStack: Focus[] = [],
    exprs: ConditionItem[],
): NumberPosition {
    if (focus === undefined) {
        return { x: 0, y: 0 };
    }

    const cached = positionByFocusId[focus.id];
    if (cached) {
        return cached;
    }

    if (focusStack.includes(focus)) {
        return { x: 0, y: 0 };
    }

    let position: NumberPosition = { x: focus.x, y: focus.y };
    if (focus.relativePositionId !== undefined) {
        focusStack.push(focus);
        const relativeFocusPosition = getFocusPosition(focusTree.focuses[focus.relativePositionId], positionByFocusId, focusTree, focusStack, exprs);
        focusStack.pop();
        position.x += relativeFocusPosition.x;
        position.y += relativeFocusPosition.y;
    }

    for (const offset of focus.offset) {
        if (offset.trigger !== undefined && applyCondition(offset.trigger, exprs)) {
            position.x += offset.x;
            position.y += offset.y;
        }
    }

    positionByFocusId[focus.id] = position;
    return position;
}

function getFocusIcon(focus: Focus, exprs: ConditionItem[], styleTable: StyleTable): string {
    for (const icon of focus.icon) {
        if (applyCondition(icon.condition, exprs)) {
            const iconName = icon.icon;
            return styleTable.name('focus-icon-' + normalizeForStyle(iconName ?? '-empty'));
        }
    }

    return styleTable.name('focus-icon-' + normalizeForStyle('-empty'));
}

function focusToGridItem(
    focus: Focus,
    focustree: FocusTree,
    allowBranchOptionsValue: Record<string, boolean>,
    positionByFocusId: Record<string, NumberPosition>,
    exprs: ConditionItem[],
): GridBoxItem | undefined {
    if (useConditionInFocus) {
        if (allowBranchOptionsValue[focus.id] === false) {
            return undefined;
        }
    }

    const classNames = focus.inAllowBranch.map(v => 'inbranch_' + v).join(' ');
    const connections: GridBoxConnection[] = [];
    
    for (const prerequisites of focus.prerequisite) {
        let style: string;
        if (prerequisites.length > 1) {
            style = "1px dashed #88aaff";
        } else {
            style = "1px solid #88aaff";
        }

        prerequisites.forEach(p => {
            const fp = focustree.focuses[p];
            const classNames2 = fp?.inAllowBranch.map(v => 'inbranch_' + v).join(' ') ?? '';
            connections.push({
                target: p,
                targetType: 'parent',
                style: style,
                classNames: classNames + ' ' + classNames2,
            });
        });
    }

    focus.exclusive.forEach(e => {
        const fe = focustree.focuses[e];
        const classNames2 = fe?.inAllowBranch.map(v => 'inbranch_' + v).join(' ') ?? '';
        connections.push({
            target: e,
            targetType: 'related',
            style: "1px solid red",
            classNames: classNames + ' ' + classNames2,
        });
    });

    const position = getFocusPosition(focus, positionByFocusId, focustree, [], exprs);

    return {
        id: focus.id,
        htmlId: 'focus_' + focus.id,
        classNames: classNames + ' focus',
        gridX: position.x,
        gridY: position.y,
        connections,
    };
}

function clearCheckedFocuses() {
    for (const focusId in checkedFocuses) {
        checkedFocuses[focusId].dispose();
    }
    checkedFocuses = {};
}

function setupCheckedFocuses(focuses: Focus[], focusTree: FocusTree) {
    const focusCheckState = getState().checkedFocuses ?? {};
    for (const focus of focuses) {
        const checkbox = document.getElementById(`checkbox-${normalizeForStyle(focus.id)}`) as HTMLInputElement;
        if (checkbox) {
            if (focusTree.conditionExprs.some(e => e.scopeName === '' && e.nodeContent === 'has_completed_focus = ' + focus.id)) {
                checkbox.checked = !!focusCheckState[focus.id];
                const checkboxItem = new Checkbox(checkbox);
                checkedFocuses[focus.id] = checkboxItem;
                checkbox.addEventListener('change', async () => {
                    if (checkbox.checked) {
                        for (const exclusiveFocus of focus.exclusive) {
                            const exclusiveCheckbox = checkedFocuses[exclusiveFocus];
                            if (exclusiveCheckbox) {
                                exclusiveCheckbox.input.checked = false;
                                focusCheckState[exclusiveFocus] = false;
                            }
                        }
                    }
                    focusCheckState[focus.id] = checkbox.checked;
                    setState({ checkedFocuses: focusCheckState });

                    const rect = checkbox.getBoundingClientRect();
                    const oldLeft = rect.left, oldTop = rect.top;
                    await buildContent();

                    const newCheckbox = document.getElementById(`checkbox-${normalizeForStyle(focus.id)}`) as HTMLInputElement;
                    if (newCheckbox) {
                        const rect = newCheckbox.getBoundingClientRect();
                        const newLeft = rect.left, newTop = rect.top;
                        window.scrollBy(newLeft - oldLeft, newTop - oldTop);
                    }
                    
                    retriggerSearch();
                });
            } else {
                checkbox.parentElement?.remove();
            }
        }
    }
}

type ConnectionMode = 'prerequisite' | 'mutex';

/**
 * Alt+drag (Alt+Shift+drag for mutually exclusive) from one focus onto
 * another draws a live connector and, on drop, adds the relationship --
 * the canvas equivalent of the inspector's prerequisite/mutex dropdowns.
 * Existing relationships and self-drops are silently ignored rather than
 * sent as no-op edits.
 */
function startConnectionDrag(sourceFocus: Focus, startEvent: MouseEvent, mode: ConnectionMode): void {
    const sourceElement = document.getElementById('focus_' + sourceFocus.id) as HTMLDivElement | null;
    if (!sourceElement) {
        return;
    }

    const color = mode === 'mutex' ? '#e33' : '#5af';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'fixed';
    svg.style.left = '0';
    svg.style.top = '0';
    svg.style.width = '100vw';
    svg.style.height = '100vh';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '9999';

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '2');
    if (mode === 'mutex') {
        line.setAttribute('stroke-dasharray', '5 4');
    }
    svg.appendChild(line);
    document.body.append(svg);

    const sourceRect = sourceElement.getBoundingClientRect();
    const sourceCenterX = sourceRect.left + sourceRect.width / 2;
    const sourceCenterY = sourceRect.top + sourceRect.height / 2;

    const updateLine = (x: number, y: number) => {
        line.setAttribute('x1', String(sourceCenterX));
        line.setAttribute('y1', String(sourceCenterY));
        line.setAttribute('x2', String(x));
        line.setAttribute('y2', String(y));
    };
    updateLine(startEvent.clientX, startEvent.clientY);

    let hoveredTarget: HTMLDivElement | null = null;
    const setHovered = (el: HTMLDivElement | null) => {
        if (hoveredTarget === el) {
            return;
        }
        if (hoveredTarget) {
            hoveredTarget.style.outline = '';
        }
        hoveredTarget = el;
        if (hoveredTarget) {
            hoveredTarget.style.outline = `2px solid ${color}`;
        }
    };

    const targetUnderCursor = (x: number, y: number): HTMLDivElement | null => {
        const el = document.elementFromPoint(x, y);
        const focusEl = el instanceof HTMLElement ? el.closest<HTMLDivElement>('.focus') : null;
        return focusEl && focusEl.id !== sourceElement.id ? focusEl : null;
    };

    const onMouseMove = (moveEvent: MouseEvent) => {
        updateLine(moveEvent.clientX, moveEvent.clientY);
        setHovered(targetUnderCursor(moveEvent.clientX, moveEvent.clientY));
    };

    const onMouseUp = (upEvent: MouseEvent) => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        setHovered(null);
        svg.remove();

        const targetElement = targetUnderCursor(upEvent.clientX, upEvent.clientY);
        const targetId = targetElement?.id.replace(/^focus_/, '');
        if (!targetId) {
            return;
        }

        const focusTree = focusTrees[selectedFocusTreeIndex];
        const target = focusTree?.focuses[targetId];
        if (!target) {
            return;
        }

        if (mode === 'prerequisite') {
            if (flatten(target.prerequisite).includes(sourceFocus.id)) {
                return;
            }
            const message: SetPrerequisitesMessage = {
                command: 'setPrerequisites',
                lastDocumentChangeTimestamp: timestamp(),
                focus: target,
                groups: [...target.prerequisite, [sourceFocus.id]],
            };
            vscode.postMessage(message);
        } else {
            if (target.exclusive.includes(sourceFocus.id)) {
                return;
            }
            const message: SetMutuallyExclusiveMessage = {
                command: 'setMutuallyExclusive',
                lastDocumentChangeTimestamp: timestamp(),
                focus: target,
                ids: [...target.exclusive, sourceFocus.id],
            };
            vscode.postMessage(message);
        }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
}

function setupFocusDragging(focuses: Focus[]) {
    const xGridSize = (window as any).xGridSize as number;
    const yGridSize = (window as any).yGridSize as number;
    const focusElements = getFocusElements(focuses);

    for (const { focus, element: focusElement } of focusElements) {

        let suppressNextClick = false;
        focusElement.addEventListener('click', e => {
            if (suppressNextClick) {
                e.preventDefault();
                e.stopImmediatePropagation();
                suppressNextClick = false;
            }
        }, true);

        focusElement.addEventListener('mousedown', e => {
            if (e.button !== 0 || isInteractiveTarget(e.target)) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            if (e.altKey) {
                startConnectionDrag(focus, e, e.shiftKey ? 'mutex' : 'prerequisite');
                return;
            }

            if (e.ctrlKey || e.metaKey) {
                selectedFocusIds = selectedFocusIds.includes(focus.id) ?
                    selectedFocusIds.filter(id => id !== focus.id) :
                    [...selectedFocusIds, focus.id];
                setState({ selectedFocusIds });
                refreshFocusSelection();
                return;
            }

            if (!selectedFocusIds.includes(focus.id)) {
                selectedFocusIds = [focus.id];
                setState({ selectedFocusIds });
                refreshFocusSelection();
            }

            const draggedFocuses = focusElements.filter(f => selectedFocusIds.includes(f.focus.id));
            const movedFocuses = draggedFocuses.filter(f => !hasSelectedRelativeAncestor(f.focus, focuses));
            const scale = getState().scale || 1;
            const startClientX = e.clientX;
            const startClientY = e.clientY;
            let deltaGridX = 0;
            let deltaGridY = 0;
            let moved = false;

            const onMouseMove = (moveEvent: MouseEvent) => {
                deltaGridX = Math.round((moveEvent.clientX - startClientX) / scale / xGridSize);
                deltaGridY = Math.round((moveEvent.clientY - startClientY) / scale / yGridSize);
                moved = moved || deltaGridX !== 0 || deltaGridY !== 0;
                for (const draggedFocus of draggedFocuses) {
                    draggedFocus.element.style.transform = `translate(${deltaGridX * xGridSize}px, ${deltaGridY * yGridSize}px)`;
                }
                document.body.style.cursor = 'grabbing';
            };

            const onMouseUp = () => {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
                document.body.style.cursor = '';

                if (!moved || (deltaGridX === 0 && deltaGridY === 0)) {
                    for (const draggedFocus of draggedFocuses) {
                        draggedFocus.element.style.transform = '';
                    }
                    return;
                }

                suppressNextClick = true;
                const message: UpdateFocusPositionsMessage = {
                    command: 'updateFocusPositions',
                    lastDocumentChangeTimestamp: (window as any).lastDocumentChangeTimestamp,
                    focuses: movedFocuses.map(f => ({
                        focus: f.focus,
                        file: f.navigator.attributes.getNamedItem('file')?.value,
                        x: f.focus.x + deltaGridX,
                        y: f.focus.y + deltaGridY,
                    })),
                };
                vscode.postMessage(message);
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });
    }
}

function setupFocusBoxSelection(): void {
    const dragger = document.getElementById('dragger') as HTMLDivElement;
    const button = rightButtonDrag ? 0 : 2;

    dragger.addEventListener('contextmenu', e => {
        if (isFocusTreeCanvasTarget(e.target) && !isInteractiveTarget(e.target)) {
            e.preventDefault();
        }
    });

    dragger.addEventListener('mousedown', e => {
        if (e.button !== button || isInteractiveTarget(e.target)) {
            return;
        }

        if (!isFocusTreeCanvasTarget(e.target)) {
            return;
        }

        e.preventDefault();

        const selectionBox = document.createElement('div');
        selectionBox.style.position = 'fixed';
        selectionBox.style.border = '1px solid var(--vscode-focusBorder)';
        selectionBox.style.background = 'rgba(80, 160, 255, 0.18)';
        selectionBox.style.pointerEvents = 'none';
        selectionBox.style.zIndex = '9999';
        document.body.append(selectionBox);

        const startX = e.clientX;
        const startY = e.clientY;
        let moved = false;

        const onMouseMove = (moveEvent: MouseEvent) => {
            moved = true;
            const left = Math.min(startX, moveEvent.clientX);
            const top = Math.min(startY, moveEvent.clientY);
            const width = Math.abs(moveEvent.clientX - startX);
            const height = Math.abs(moveEvent.clientY - startY);
            selectionBox.style.left = `${left}px`;
            selectionBox.style.top = `${top}px`;
            selectionBox.style.width = `${width}px`;
            selectionBox.style.height = `${height}px`;
            recalculateFocusBoxSelection(startX, startY, moveEvent);
        };

        const onMouseUp = (upEvent: MouseEvent) => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            selectionBox.remove();

            if (moved) {
                recalculateFocusBoxSelection(startX, startY, upEvent);
            } else {
                selectedFocusIds = [];
                setState({ selectedFocusIds });
                refreshFocusSelection();
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }, true);
}

function isFocusTreeCanvasTarget(target: EventTarget | null): boolean {
    return target instanceof HTMLElement && (!!target.closest('#focustreecontent') || target.id === 'dragger');
}

function refreshFocusSelection(): void {
    for (const focusElement of Array.from(document.querySelectorAll<HTMLDivElement>('.focus'))) {
        const selected = selectedFocusIds.includes(focusElement.id.replace(/^focus_/, ''));
        focusElement.style.boxShadow = selected ? '0 0 0 3px var(--vscode-focusBorder)' : '';
    }
    renderFocusDetails();
}

function arraysEqualAsSets(a: readonly string[], b: readonly string[]): boolean {
    if (a.length !== b.length) {
        return false;
    }
    const bSet = new Set(b);
    return a.every(v => bSet.has(v));
}

let prereqDropdown: DivDropdown | undefined;
let mutexDropdown: DivDropdown | undefined;
let relativeDropdown: DivDropdown | undefined;

const NO_RELATIVE_POSITION = '';

function setButtonDisabled(id: string, disabled: boolean): void {
    const button = document.getElementById(id) as HTMLButtonElement | null;
    if (button) {
        button.disabled = disabled;
    }
}

function renderFocusDetails(): void {
    const container = document.getElementById('focusdetails-container') as HTMLDivElement | null;
    const content = document.getElementById('focusdetails-content') as HTMLDivElement | null;

    setButtonDisabled('delete-focus-button', selectedFocusIds.length === 0);
    setButtonDisabled('duplicate-focus-button', selectedFocusIds.length === 0);
    setButtonDisabled('duplicate-branch-button', selectedFocusIds.length !== 1);
    setButtonDisabled('align-left-button', selectedFocusIds.length < 2);
    setButtonDisabled('align-right-button', selectedFocusIds.length < 2);
    setButtonDisabled('align-top-button', selectedFocusIds.length < 2);
    setButtonDisabled('align-bottom-button', selectedFocusIds.length < 2);
    setButtonDisabled('distribute-horizontal-button', selectedFocusIds.length < 3);
    setButtonDisabled('distribute-vertical-button', selectedFocusIds.length < 3);
    setButtonDisabled('fit-selection-button', selectedFocusIds.length === 0);

    // The details panel below only supports a single focus at a time; a multi-selection just
    // updates the buttons above and leaves it hidden, rather than showing stale single-focus fields.
    if (selectedFocusIds.length !== 1) {
        if (container) {
            container.style.display = 'none';
        }
        if (content) {
            content.innerHTML = '';
        }
        prereqDropdown = mutexDropdown = relativeDropdown = undefined;
        return;
    }

    if (!container || !content) {
        return;
    }

    const focusTree = focusTrees[selectedFocusTreeIndex];
    const focus = selectedFocusIds.length === 1 ? focusTree?.focuses[selectedFocusIds[0]] : undefined;

    prereqDropdown = mutexDropdown = relativeDropdown = undefined;
    if (!focus) {
        container.style.display = 'none';
        content.innerHTML = '';
        return;
    }

    container.style.display = 'block';
    content.innerHTML = `
        <div class="focusdetails-row"><label for="focusdetails-id">${feLocalize('focustree.details.id', 'ID')}</label>
            <input type="text" id="focusdetails-id" value="${htmlAttrEscape(focus.id)}" /></div>
        <div class="focusdetails-row"><label for="focusdetails-x">${feLocalize('focustree.details.x', 'X')}</label>
            <input type="number" id="focusdetails-x" value="${focus.x}" style="width:70px" />
            <label for="focusdetails-y">${feLocalize('focustree.details.y', 'Y')}</label>
            <input type="number" id="focusdetails-y" value="${focus.y}" style="width:70px" /></div>
        <div class="focusdetails-row"><label>${feLocalize('focustree.details.prerequisites', 'Prerequisites')}</label>
            <div id="focusdetails-prereq" class="select multiple-select" tabindex="0" role="combobox"><span class="value"></span></div></div>
        <div class="focusdetails-row"><label>${feLocalize('focustree.details.mutex', 'Mutually exclusive')}</label>
            <div id="focusdetails-mutex" class="select multiple-select" tabindex="0" role="combobox"><span class="value"></span></div></div>
        <div class="focusdetails-row"><label>${feLocalize('focustree.details.relative', 'Relative position')}</label>
            <div id="focusdetails-relative" class="select" tabindex="0" role="combobox"><span class="value"></span></div></div>
    `;

    const otherFocuses = Object.values(focusTree.focuses).filter(f => f.id !== focus.id);

    const idInput = document.getElementById('focusdetails-id') as HTMLInputElement;
    idInput.addEventListener('change', () => {
        const newId = idInput.value.trim();
        if (newId && newId !== focus.id) {
            const message: RenameFocusMessage = { command: 'renameFocus', lastDocumentChangeTimestamp: timestamp(), tree: focusTree, oldId: focus.id, newId };
            vscode.postMessage(message);
        } else {
            idInput.value = focus.id;
        }
    });

    const xInput = document.getElementById('focusdetails-x') as HTMLInputElement;
    const yInput = document.getElementById('focusdetails-y') as HTMLInputElement;
    const submitPosition = () => {
        const x = parseInt(xInput.value, 10);
        const y = parseInt(yInput.value, 10);
        if (Number.isFinite(x) && Number.isFinite(y) && (x !== focus.x || y !== focus.y)) {
            const message: UpdateFocusPositionsMessage = {
                command: 'updateFocusPositions',
                lastDocumentChangeTimestamp: timestamp(),
                focuses: [{ focus, file: focus.file, x, y }],
            };
            vscode.postMessage(message);
        }
    };
    xInput.addEventListener('change', submitPosition);
    yInput.addEventListener('change', submitPosition);

    const prereqContainer = document.getElementById('focusdetails-prereq') as HTMLDivElement;
    prereqDropdown = new DivDropdown(prereqContainer, true);
    prereqDropdown.setupOptions(otherFocuses.map(f => ({ value: f.id, text: f.id })));
    prereqDropdown.selectedValues$.next(flatten(focus.prerequisite));
    prereqDropdown.selectedValues$.subscribe(selected => {
        if (!arraysEqualAsSets(flatten(focus.prerequisite), selected)) {
            const message: SetPrerequisitesMessage = { command: 'setPrerequisites', lastDocumentChangeTimestamp: timestamp(), focus, groups: selected.map(id => [id]) };
            vscode.postMessage(message);
        }
    });

    const mutexContainer = document.getElementById('focusdetails-mutex') as HTMLDivElement;
    mutexDropdown = new DivDropdown(mutexContainer, true);
    mutexDropdown.setupOptions(otherFocuses.map(f => ({ value: f.id, text: f.id })));
    mutexDropdown.selectedValues$.next(focus.exclusive);
    mutexDropdown.selectedValues$.subscribe(selected => {
        if (!arraysEqualAsSets(focus.exclusive, selected)) {
            const message: SetMutuallyExclusiveMessage = { command: 'setMutuallyExclusive', lastDocumentChangeTimestamp: timestamp(), focus, ids: [...selected] };
            vscode.postMessage(message);
        }
    });

    const relativeContainer = document.getElementById('focusdetails-relative') as HTMLDivElement;
    relativeDropdown = new DivDropdown(relativeContainer, false);
    relativeDropdown.setupOptions([
        { value: NO_RELATIVE_POSITION, text: feLocalize('focustree.details.none', '(none)') },
        ...otherFocuses.map(f => ({ value: f.id, text: f.id })),
    ]);
    relativeDropdown.selectedValues$.next([focus.relativePositionId ?? NO_RELATIVE_POSITION]);
    relativeDropdown.selectedValues$.subscribe(selected => {
        const anchorId = selected[0] === NO_RELATIVE_POSITION ? undefined : selected[0];
        if (anchorId !== focus.relativePositionId) {
            const message: SetRelativePositionMessage = { command: 'setRelativePosition', lastDocumentChangeTimestamp: timestamp(), focus, anchorId };
            vscode.postMessage(message);
        }
    });
}

function htmlAttrEscape(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function timestamp(): number {
    return (window as any).lastDocumentChangeTimestamp;
}

/** `undefined` for a focus living in the previewed file itself (the fast path `getDocumentForPreviewMessage` expects), matching how the file attribute is only rendered for out-of-file focuses (contentbuilder.ts). */
function focusFileForMessage(focus: Focus, focusTree: FocusTree): string | undefined {
    return focus.file === focusTree.file ? undefined : focus.file;
}

function deleteSelectedFocuses(): void {
    const focusTree = focusTrees[selectedFocusTreeIndex];
    if (!focusTree || selectedFocusIds.length === 0) {
        return;
    }
    const confirmMessage = selectedFocusIds.length === 1 ?
        feLocalize('focustree.details.confirmdelete', 'Delete focus "{0}"? This also removes every reference to it.', selectedFocusIds[0]) :
        feLocalize('focustree.details.confirmdeletemultiple', 'Delete {0} focuses? This also removes every reference to them.', selectedFocusIds.length.toString());
    if (!window.confirm(confirmMessage)) {
        return;
    }
    const message: DeleteFocusMessage = {
        command: 'deleteFocus',
        lastDocumentChangeTimestamp: timestamp(),
        tree: focusTree,
        focusIds: [...selectedFocusIds],
    };
    vscode.postMessage(message);
}

function duplicateSelectedFocuses(): void {
    const focusTree = focusTrees[selectedFocusTreeIndex];
    if (!focusTree || selectedFocusIds.length === 0) {
        return;
    }
    const message: DuplicateFocusMessage = {
        command: 'duplicateFocus',
        lastDocumentChangeTimestamp: timestamp(),
        tree: focusTree,
        focusIds: [...selectedFocusIds],
    };
    vscode.postMessage(message);
}

function duplicateSelectedBranch(): void {
    const focusTree = focusTrees[selectedFocusTreeIndex];
    if (!focusTree || selectedFocusIds.length !== 1) {
        return;
    }
    const message: DuplicateBranchMessage = {
        command: 'duplicateBranch',
        lastDocumentChangeTimestamp: timestamp(),
        tree: focusTree,
        rootFocusId: selectedFocusIds[0],
    };
    vscode.postMessage(message);
}

function nudgeSelectedFocuses(deltaGridX: number, deltaGridY: number): void {
    const focusTree = focusTrees[selectedFocusTreeIndex];
    if (!focusTree || selectedFocusIds.length === 0) {
        return;
    }
    const focuses = Object.values(focusTree.focuses);
    const movedFocuses = selectedFocusIds
        .map(id => focusTree.focuses[id])
        .filter((f): f is Focus => !!f && !hasSelectedRelativeAncestor(f, focuses));
    if (movedFocuses.length === 0) {
        return;
    }
    const message: UpdateFocusPositionsMessage = {
        command: 'updateFocusPositions',
        lastDocumentChangeTimestamp: timestamp(),
        focuses: movedFocuses.map(f => ({ focus: f, file: focusFileForMessage(f, focusTree), x: f.x + deltaGridX, y: f.y + deltaGridY })),
    };
    vscode.postMessage(message);
}

type AlignEdge = 'left' | 'right' | 'top' | 'bottom';

function alignSelectedFocuses(edge: AlignEdge): void {
    const focusTree = focusTrees[selectedFocusTreeIndex];
    if (!focusTree || selectedFocusIds.length < 2) {
        return;
    }
    const selected = selectedFocusIds.map(id => focusTree.focuses[id]).filter((f): f is Focus => !!f);
    if (selected.length < 2) {
        return;
    }

    const isHorizontal = edge === 'left' || edge === 'right';
    const values = selected.map(f => isHorizontal ? f.x : f.y);
    const target = edge === 'left' || edge === 'top' ? Math.min(...values) : Math.max(...values);

    const message: UpdateFocusPositionsMessage = {
        command: 'updateFocusPositions',
        lastDocumentChangeTimestamp: timestamp(),
        focuses: selected
            .filter(f => (isHorizontal ? f.x : f.y) !== target)
            .map(f => ({ focus: f, file: focusFileForMessage(f, focusTree), x: isHorizontal ? target : f.x, y: isHorizontal ? f.y : target })),
    };
    if (message.focuses.length > 0) {
        vscode.postMessage(message);
    }
}

type DistributeAxis = 'horizontal' | 'vertical';

function distributeSelectedFocuses(axis: DistributeAxis): void {
    const focusTree = focusTrees[selectedFocusTreeIndex];
    if (!focusTree || selectedFocusIds.length < 3) {
        return;
    }
    const selected = selectedFocusIds.map(id => focusTree.focuses[id]).filter((f): f is Focus => !!f);
    if (selected.length < 3) {
        return;
    }

    const isHorizontal = axis === 'horizontal';
    const sorted = [...selected].sort((a, b) => (isHorizontal ? a.x - b.x : a.y - b.y));
    const first = isHorizontal ? sorted[0].x : sorted[0].y;
    const last = isHorizontal ? sorted[sorted.length - 1].x : sorted[sorted.length - 1].y;
    const step = (last - first) / (sorted.length - 1);

    const message: UpdateFocusPositionsMessage = {
        command: 'updateFocusPositions',
        lastDocumentChangeTimestamp: timestamp(),
        focuses: sorted
            .map((f, i) => ({ f, target: Math.round(first + step * i) }))
            .filter(({ f, target }) => (isHorizontal ? f.x : f.y) !== target)
            .map(({ f, target }) => ({ focus: f, file: focusFileForMessage(f, focusTree), x: isHorizontal ? target : f.x, y: isHorizontal ? f.y : target })),
    };
    if (message.focuses.length > 0) {
        vscode.postMessage(message);
    }
}

function fitToFocuses(elements: HTMLDivElement[]): void {
    if (!zoomControl || elements.length === 0) {
        return;
    }

    const contentElement = document.getElementById('focustreecontent') as HTMLDivElement | null;
    if (!contentElement) {
        return;
    }

    const oldScale = zoomControl.getScale();
    const contentRect = contentElement.getBoundingClientRect();
    const originDocX = contentRect.left + window.scrollX;
    const originDocY = contentRect.top + window.scrollY;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const element of elements) {
        const rect = element.getBoundingClientRect();
        const left = (rect.left + window.scrollX - originDocX) / oldScale;
        const top = (rect.top + window.scrollY - originDocY) / oldScale;
        const right = (rect.right + window.scrollX - originDocX) / oldScale;
        const bottom = (rect.bottom + window.scrollY - originDocY) / oldScale;
        minX = Math.min(minX, left);
        minY = Math.min(minY, top);
        maxX = Math.max(maxX, right);
        maxY = Math.max(maxY, bottom);
    }

    const padding = 80;
    const boxWidth = Math.max(1, maxX - minX) + padding * 2;
    const boxHeight = Math.max(1, maxY - minY) + padding * 2;

    const newScale = Math.min(1, Math.max(0.2, Math.min(window.innerWidth / boxWidth, window.innerHeight / boxHeight)));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    zoomControl.setScale(newScale);

    const boxCenterDocX = originDocX + centerX * newScale;
    const boxCenterDocY = originDocY + centerY * newScale;
    window.scrollTo(boxCenterDocX - window.innerWidth / 2, boxCenterDocY - window.innerHeight / 2);
}

function fitToTree(): void {
    fitToFocuses(Array.from(document.querySelectorAll<HTMLDivElement>('.focus')).filter(el => el.style.display !== 'none'));
}

function fitToSelection(): void {
    if (selectedFocusIds.length === 0) {
        fitToTree();
        return;
    }
    const elements = selectedFocusIds
        .map(id => document.getElementById('focus_' + id) as HTMLDivElement | null)
        .filter((el): el is HTMLDivElement => !!el);
    fitToFocuses(elements);
}

function setupEditingToolbar(): void {
    const newFocusButton = document.getElementById('new-focus-button') as HTMLButtonElement | null;
    newFocusButton?.addEventListener('click', () => {
        const focusTree = focusTrees[selectedFocusTreeIndex];
        if (!focusTree) {
            return;
        }
        const id = window.prompt(feLocalize('focustree.details.newfocusprompt', 'New focus ID:'));
        if (!id || !id.trim()) {
            return;
        }
        const existing = Object.values(focusTree.focuses);
        const x = existing.length > 0 ? Math.max(...existing.map(f => f.x)) + 1 : 0;
        const message: CreateFocusMessage = {
            command: 'createFocus',
            lastDocumentChangeTimestamp: timestamp(),
            tree: focusTree,
            id: id.trim(),
            x,
            y: 0,
        };
        vscode.postMessage(message);
    });

    document.getElementById('delete-focus-button')?.addEventListener('click', deleteSelectedFocuses);
    document.getElementById('duplicate-focus-button')?.addEventListener('click', duplicateSelectedFocuses);
    document.getElementById('duplicate-branch-button')?.addEventListener('click', duplicateSelectedBranch);
    document.getElementById('align-left-button')?.addEventListener('click', () => alignSelectedFocuses('left'));
    document.getElementById('align-right-button')?.addEventListener('click', () => alignSelectedFocuses('right'));
    document.getElementById('align-top-button')?.addEventListener('click', () => alignSelectedFocuses('top'));
    document.getElementById('align-bottom-button')?.addEventListener('click', () => alignSelectedFocuses('bottom'));
    document.getElementById('distribute-horizontal-button')?.addEventListener('click', () => distributeSelectedFocuses('horizontal'));
    document.getElementById('distribute-vertical-button')?.addEventListener('click', () => distributeSelectedFocuses('vertical'));
    document.getElementById('fit-tree-button')?.addEventListener('click', fitToTree);
    document.getElementById('fit-selection-button')?.addEventListener('click', fitToSelection);

    window.addEventListener('keydown', e => {
        if (isInteractiveTarget(e.target)) {
            return;
        }

        if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            fitToTree();
            return;
        }

        if (selectedFocusIds.length === 0) {
            return;
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            deleteSelectedFocuses();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
            e.preventDefault();
            duplicateSelectedFocuses();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const step = e.shiftKey ? 5 : 1;
            const deltaX = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
            const deltaY = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
            nudgeSelectedFocuses(deltaX, deltaY);
        }
    });
}

function getFocusElements(focuses: Focus[]): { focus: Focus, element: HTMLDivElement, navigator: HTMLDivElement }[] {
    const result: { focus: Focus, element: HTMLDivElement, navigator: HTMLDivElement }[] = [];
    for (const focus of focuses) {
        const element = document.getElementById('focus_' + focus.id) as HTMLDivElement | null;
        const navigator = element?.querySelector<HTMLDivElement>('.navigator') ?? null;
        if (element && navigator) {
            result.push({ focus, element, navigator });
        }
    }

    return result;
}

function hasSelectedRelativeAncestor(focus: Focus, focuses: Focus[]): boolean {
    let relativeId = focus.relativePositionId;
    const visitedFocusIds = new Set<string>();
    while (relativeId !== undefined) {
        if (visitedFocusIds.has(relativeId)) {
            return false;
        }

        visitedFocusIds.add(relativeId);
        if (selectedFocusIds.includes(relativeId)) {
            return true;
        }

        relativeId = focuses.find(f => f.id === relativeId)?.relativePositionId;
    }

    return false;
}

function recalculateFocusBoxSelection(startX: number, startY: number, mouseEvent: MouseEvent): void {
    const selectionRect = normalizeRect(startX, startY, mouseEvent.clientX, mouseEvent.clientY);
    selectedFocusIds = [];
    for (const focusElement of Array.from(document.querySelectorAll<HTMLDivElement>('.focus'))) {
        if (focusElement.style.display === 'none') {
            continue;
        }

        if (rectsIntersect(selectionRect, focusElement.getBoundingClientRect())) {
            selectedFocusIds.push(focusElement.id.replace(/^focus_/, ''));
        }
    }

    setState({ selectedFocusIds });
    refreshFocusSelection();
}

function normalizeRect(x1: number, y1: number, x2: number, y2: number): DOMRect {
    return new DOMRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x1 - x2), Math.abs(y1 - y2));
}

function rectsIntersect(a: DOMRect, b: DOMRect): boolean {
    return a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top;
}

function isInteractiveTarget(target: EventTarget | null): boolean {
    return target instanceof HTMLElement && !!target.closest('input,button,select,textarea,label');
}

let retriggerSearch: () => void = () => {};

window.addEventListener('load', tryRun(async function() {
    subscribePreviewLabelToggle();
    setupFocusBoxSelection();
    setupEditingToolbar();

    // Focuses
    const focusesElement = document.getElementById('focuses') as HTMLSelectElement | null;
    if (focusesElement) {
        focusesElement.value = selectedFocusTreeIndex.toString();
        focusesElement.addEventListener('change', () => {
            selectedFocusTreeIndex = parseInt(focusesElement.value);
            setState({ selectedFocusTreeIndex });
            updateSelectedFocusTree(true);
        });
    }

    // Allow branch
    if (!useConditionInFocus) {
        const hiddenBranches = getState().hiddenBranches || {};
        for (const key in hiddenBranches) {
            showBranch(false, key);
        }

        const allowBranchesElement = document.getElementById('allowbranch') as HTMLDivElement | null;
        if (allowBranchesElement) {
            allowBranches = new DivDropdown(allowBranchesElement, true);
            allowBranches.selectAll();

            const allValues = allowBranches.selectedValues$.value;
            allowBranches.selectedValues$.next(allValues.filter(v => !hiddenBranches[v]));

            let oldSelection = allowBranches.selectedValues$.value;
            allowBranches.selectedValues$.subscribe(selection => {
                const showBranches = difference(selection, oldSelection);
                showBranches.forEach(s => showBranch(true, s));
                const hideBranches = difference(oldSelection, selection);
                hideBranches.forEach(s => showBranch(false, s));
                oldSelection = selection;

                const hiddenBranches = difference(allValues, selection);
                setState({ hiddenBranches });
            });
        }
    }

    // Searchbox
    const searchbox = document.getElementById('searchbox') as HTMLInputElement;
    let currentNavigatedIndex = 0;
    let oldSearchboxValue: string = getState().searchboxValue || '';
    let searchedFocus: HTMLDivElement[] = search(oldSearchboxValue, false);

    searchbox.value = oldSearchboxValue;

    const searchboxChangeFunc = function(this: HTMLInputElement) {
        const searchboxValue = this.value.toLowerCase();
        if (oldSearchboxValue !== searchboxValue) {
            currentNavigatedIndex = 0;
            searchedFocus = search(searchboxValue);
            oldSearchboxValue = searchboxValue;
            setState({ searchboxValue });
        }
    };

    searchbox.addEventListener('change', searchboxChangeFunc);
    searchbox.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const visibleSearchedFocus = searchedFocus.filter(f => f.style.display !== 'none');
            if (visibleSearchedFocus.length > 0) {
                currentNavigatedIndex = (currentNavigatedIndex + (e.shiftKey ? visibleSearchedFocus.length - 1 : 1)) % visibleSearchedFocus.length;
                visibleSearchedFocus[currentNavigatedIndex].scrollIntoView({ block: "center", inline: "center" });
            }
        } else {
            searchboxChangeFunc.apply(this);
        }
    });
    searchbox.addEventListener('keyup', searchboxChangeFunc);
    searchbox.addEventListener('paste', searchboxChangeFunc);
    searchbox.addEventListener('cut', searchboxChangeFunc);

    retriggerSearch = () => { searchedFocus = search(oldSearchboxValue, false); };

    // Conditions
    if (useConditionInFocus) {
        const conditionsElement = document.getElementById('conditions') as HTMLDivElement | null;
        if (conditionsElement) {
            conditions = new DivDropdown(conditionsElement, true);
            
            conditions.selectedValues$.next(selectedExprs.map(conditionItemToStringValue));
            conditions.selectedValues$.subscribe(async (selection) => {
                selectedExprs = selection.map<ConditionItem>(stringValueToConditionItem);
                setState({ selectedExprs });

                await buildContent();
                retriggerSearch();
            });
        }
    }

    // Zoom
    const contentElement = document.getElementById('focustreecontent') as HTMLDivElement;
    zoomControl = enableZoom(contentElement, 0, 40);

    // Toggle warnings
    const showWarnings = document.getElementById('show-warnings') as HTMLButtonElement;
    if (showWarnings) {
        const warnings = document.getElementById('warnings-container') as HTMLDivElement;
        showWarnings.addEventListener('click', () => {
            const visible = warnings.style.display === 'block';
            document.body.style.overflow = visible ? '' : 'hidden';
            warnings.style.display = visible ? 'none' : 'block';
        });
    }
    
    updateSelectedFocusTree(false);
    await buildContent();
    scrollToState();
}));
