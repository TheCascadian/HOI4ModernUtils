import * as vscode from 'vscode';
import { FocusTree, Focus } from './schema';
import { getSpriteByGfxName, Image, getImageByPath } from '../../util/image/imagecache';
import { localize, i18nTableAsScript } from '../../util/i18n';
import { forceError, randomString } from '../../util/common';
import { HOIPartial, toNumberLike, toStringAsSymbolIgnoreCase } from '../../hoiformat/schema';
import { html, htmlEscape } from '../../util/html';
import { GridBoxType } from '../../hoiformat/gui';
import { FocusTreeLoader } from './loader';
import { LoaderSession } from '../../util/loader/loader';
import { debug } from '../../util/debug';
import { StyleTable, normalizeForStyle } from '../../util/styletable';
import { featureFlagsAsScript, isFeatureEnabled } from '../../util/featureflags';
import { flatMap } from 'lodash';
import { indexManager } from '../../indexing/indexmanager';
import { localisationIndex } from '../../indexing/localisationindex';

const defaultFocusIcon = 'gfx/interface/goals/goal_unknown.dds';

export async function renderFocusTreeFile(loader: FocusTreeLoader, uri: vscode.Uri, webview: vscode.Webview, lastDocumentChangeTimestamp: number, onFocusTrees?: (focusTrees: FocusTree[]) => void): Promise<string> {
    const setPreviewFileUriScript = { content: `window.previewedFileUri = "${uri.toString()}";` };

    try {
        const session = new LoaderSession(false);
        const loadResult = await loader.load(session);
        const loadedLoaders = Array.from((session as any).loadedLoader).map<string>(v => (v as any).toString());
        debug('Loader session focus tree', loadedLoaders);

        const focustrees = loadResult.result.focusTrees;
        onFocusTrees?.(focustrees);

        if (focustrees.length === 0) {
            const baseContent = localize('focustree.nofocustree', 'No focus tree.');
            return html(webview, baseContent, [ setPreviewFileUriScript ], []);
        }

        const styleTable = new StyleTable();
        const jsCodes: string[] = [];
        const styleNonce = randomString(32);
        const baseContent = await renderFocusTrees(focustrees, styleTable, loadResult.result.gfxFiles, jsCodes, styleNonce, loader.file);
        jsCodes.push(i18nTableAsScript());
        jsCodes.push(featureFlagsAsScript());
        jsCodes.push(`window.lastDocumentChangeTimestamp = ${lastDocumentChangeTimestamp};`);

        return html(
            webview,
            baseContent,
            [
                setPreviewFileUriScript,
                ...jsCodes.map(c => ({ content: c })),
                'common.js',
                'focustree.js',
            ],
            [
                'codicon.css',
                'common.css',
                styleTable,
                { nonce: styleNonce },
            ],
        );

    } catch (e) {
        const baseContent = `${localize('error', 'Error')}: <br/>  <pre>${htmlEscape(forceError(e).toString())}</pre>`;
        return html(webview, baseContent, [ setPreviewFileUriScript ], []);
    }
}

const leftPaddingBase = 50;
const topPaddingBase = 50;
const xGridSize = 96;
const yGridSize = 130;

async function renderFocusTrees(focusTrees: FocusTree[], styleTable: StyleTable, gfxFiles: string[], jsCodes: string[], styleNonce: string, file: string): Promise<string> {
    const leftPadding = leftPaddingBase;
    const topPadding = topPaddingBase;

    const gridBox: HOIPartial<GridBoxType> = {
        position: { x: toNumberLike(leftPadding), y: toNumberLike(topPadding) },
        format: toStringAsSymbolIgnoreCase('up'),
        size: { width: toNumberLike(xGridSize), height: undefined },
        slotsize: { width: toNumberLike(xGridSize), height: toNumberLike(yGridSize) },
    } as HOIPartial<GridBoxType>;

    const renderedFocus: Record<string, string> = {};
    await Promise.all(flatMap(focusTrees, tree => Object.values(tree.focuses)).map(async (focus) =>
        renderedFocus[focus.id] = (await renderFocus(focus, styleTable, gfxFiles, file)).replace(/\s\s+/g, ' ')));

    jsCodes.push('window.focusTrees = ' + JSON.stringify(focusTrees));
    jsCodes.push('window.renderedFocus = ' + JSON.stringify(renderedFocus));
    jsCodes.push('window.gridBox = ' + JSON.stringify(gridBox));
    jsCodes.push('window.styleNonce = ' + JSON.stringify(styleNonce));
    jsCodes.push('window.xGridSize = ' + xGridSize);
    jsCodes.push('window.yGridSize = ' + yGridSize);

    const continuousFocusContent =
        `<div id="continuousFocuses" class="${styleTable.oneTimeStyle('continuousFocuses', () => `
            position: absolute;
            width: 770px;
            height: 380px;
            margin: 20px;
            background: rgba(128, 128, 128, 0.2);
            text-align: center;
            pointer-events: none;
        `)}">Continuous focuses</div>`;

    return (
        `<div id="dragger" additionalDraggerHostId="focustreecontent" class="${styleTable.oneTimeStyle('dragger', () => `
            width: 100vw;
            height: 100vh;
            position: fixed;
            left:0;
            top:0;
        `)}"></div>` +
        `<div id="focustreecontent" class="${styleTable.oneTimeStyle('focustreecontent', () => `top:40px;left:-20px;position:relative`)}">
            <div id="focustreeplaceholder"></div>
            ${continuousFocusContent}
        </div>` +
        renderWarningContainer(styleTable) +
        renderFocusDetailsContainer(styleTable) +
        renderFocusCreator(styleTable) +
        renderSecondaryTools(styleTable) +
        renderToolBar(focusTrees, styleTable)
    );
}

function renderFocusCreator(styleTable: StyleTable): string {
    return `<div id="focus-creator" role="dialog" aria-labelledby="focus-creator-title" class="${styleTable.style('focus-creator', () => `
        display: none;
        position: fixed;
        top: 46px;
        left: 20px;
        z-index: 30;
        padding: 12px;
        background: var(--vscode-editorWidget-background, var(--vscode-editor-background));
        border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
        box-shadow: 0 4px 14px rgba(0, 0, 0, .35);
    `)}">
        <label id="focus-creator-title" for="new-focus-id" class="${styleTable.style('focus-creator-label', () => `display:block;margin-bottom:6px`)}">${localize('focustree.newfocusid', 'New focus ID')}</label>
        <div class="${styleTable.style('focus-creator-actions', () => `display:flex;gap:6px`)}">
            <input id="new-focus-id" type="text" autocomplete="off" spellcheck="false" />
            <button id="confirm-new-focus-button" type="button" class="${styleTable.style('focus-creator-button', () => `width:auto;padding:0 8px`)}">${localize('focustree.create', 'Create')}</button>
            <button id="cancel-new-focus-button" type="button" class="${styleTable.style('focus-creator-button', () => `width:auto;padding:0 8px`)}">${localize('cancel', 'Cancel')}</button>
        </div>
    </div>`;
}

function renderSecondaryTools(styleTable: StyleTable): string {
    const toolButtonClass = styleTable.style('focus-secondary-tool', () => `
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 4px 8px;
        text-align: left;
    `);
    return `<div id="focus-secondary-tools" role="menu" class="${styleTable.style('focus-secondary-tools', () => `
        display: none;
        position: fixed;
        top: 38px;
        right: 10px;
        z-index: 30;
        width: 220px;
        padding: 6px;
        background: var(--vscode-menu-background, var(--vscode-editor-background));
        border: 1px solid var(--vscode-menu-border, var(--vscode-panel-border));
        box-shadow: 0 4px 14px rgba(0, 0, 0, .35);
    `)}">
        <button id="duplicate-focus-button" class="${toolButtonClass}" role="menuitem" disabled><i class="codicon codicon-copy"></i><span>${localize('focustree.duplicatefocusshort', 'Duplicate selection')}</span></button>
        <button id="duplicate-branch-button" class="${toolButtonClass}" role="menuitem" disabled><i class="codicon codicon-type-hierarchy-sub"></i><span>${localize('focustree.duplicatebranchshort', 'Duplicate branch')}</span></button>
        <div class="${styleTable.style('focus-tools-separator', () => `height:1px;margin:5px 2px;background:var(--vscode-menu-separatorBackground, var(--vscode-panel-border))`)}"></div>
        <button id="align-left-button" class="${toolButtonClass}" role="menuitem" disabled><i class="codicon codicon-arrow-left"></i><span>${localize('focustree.alignleft', 'Align left')}</span></button>
        <button id="align-right-button" class="${toolButtonClass}" role="menuitem" disabled><i class="codicon codicon-arrow-right"></i><span>${localize('focustree.alignright', 'Align right')}</span></button>
        <button id="align-top-button" class="${toolButtonClass}" role="menuitem" disabled><i class="codicon codicon-arrow-up"></i><span>${localize('focustree.aligntop', 'Align top')}</span></button>
        <button id="align-bottom-button" class="${toolButtonClass}" role="menuitem" disabled><i class="codicon codicon-arrow-down"></i><span>${localize('focustree.alignbottom', 'Align bottom')}</span></button>
        <button id="distribute-horizontal-button" class="${toolButtonClass}" role="menuitem" disabled><i class="codicon codicon-split-horizontal"></i><span>${localize('focustree.distributehorizontal', 'Distribute horizontally')}</span></button>
        <button id="distribute-vertical-button" class="${toolButtonClass}" role="menuitem" disabled><i class="codicon codicon-split-vertical"></i><span>${localize('focustree.distributevertical', 'Distribute vertically')}</span></button>
        <button id="fit-selection-button" class="${toolButtonClass}" role="menuitem" disabled><i class="codicon codicon-target"></i><span>${localize('focustree.fitselection', 'Fit selection to view')}</span></button>
    </div>`;
}

function renderFocusDetailsContainer(styleTable: StyleTable): string {
    styleTable.raw('#focusdetails-content details', 'margin: 10px 0; border-top: 1px solid var(--vscode-panel-border); padding-top: 8px;');
    styleTable.raw('#focusdetails-content summary', 'cursor: pointer; font-weight: 600; margin-bottom: 10px;');
    styleTable.raw('#focusdetails-content input[type="text"], #focusdetails-content textarea', 'width: 100%; box-sizing: border-box;');
    styleTable.raw('#focusdetails-content textarea', 'resize: vertical; font-family: var(--vscode-editor-font-family, monospace);');
    styleTable.raw('body.focus-logic-view .focus-artwork, body.focus-logic-view .focus-overlay, body.focus-logic-view .focus-checkbox', 'display:none !important;');
    styleTable.raw('body.focus-logic-view .navigator', 'border:1px solid var(--vscode-panel-border);background:var(--vscode-editor-background);box-sizing:border-box;');
    styleTable.raw('body.focus-logic-view .focus-label', 'margin-top:28px !important;font-family:var(--vscode-editor-font-family,monospace);font-weight:600;');
    styleTable.raw('body.focus-logic-view .focus-relative-connection', 'border-color:var(--vscode-charts-purple,#b180d7) !important;');
    return `
    <div id="focusdetails-container" class="${styleTable.style('focusdetails-container', () => `
        height: 100vh;
        width: 320px;
        position: fixed;
        top: 40px;
        right: 0;
        padding: 10px;
        box-sizing: border-box;
        background: var(--vscode-editor-background);
        border-left: 1px solid var(--vscode-panel-border);
        overflow-y: auto;
        display: none;
    `)}">
        <div id="focusdetails-content"></div>
    </div>`;
}

function renderWarningContainer(styleTable: StyleTable) {
    styleTable.style('warnings', () => 'outline: none;', ':focus');
    return `
    <div id="warnings-container" class="${styleTable.style('warnings-container', () => `
        height: 100vh;
        width: 100vw;
        position: fixed;
        top: 0;
        left: 0;
        padding-top: 40px;
        background: var(--vscode-editor-background);
        box-sizing: border-box;
        display: none;
    `)}">
        <textarea id="warnings" readonly wrap="off" class="${styleTable.style('warnings', () => `
            height: 100%;
            width: 100%;
            font-family: 'Consolas', monospace;
            resize: none;
            background: var(--vscode-editor-background);
            padding: 10px;
            border-top: none;
            border-left: none;
            border-bottom: none;
            box-sizing: border-box;
        `)}"></textarea>
    </div>`;
}

function renderToolBar(focusTrees: FocusTree[], styleTable: StyleTable): string {
    const focuses = focusTrees.length <= 1 ? '' : `
        <label for="focuses" class="${styleTable.style('focusesLabel', () => `margin-right:5px`)}">${localize('focustree.focustree', 'Focus tree: ')}</label>
        <div class="select-container ${styleTable.style('marginRight10', () => `margin-right:10px`)}">
            <select id="focuses" class="select multiple-select" tabindex="0" role="combobox">
                ${focusTrees.map((focus, i) => `<option value="${i}">${focus.id}</option>`).join('')}
            </select>
        </div>`;

    const searchbox = `
        <input
            class="${styleTable.style('searchbox', () => `margin-right:10px`)}"
            id="searchbox"
            type="text"
            aria-label="${localize('focustree.search', 'Search')}"
            placeholder="${localize('focustree.search', 'Search')}"
        />`;

    const allowbranch = `
        <div id="allowbranch-container">
            <label for="allowbranch" class="${styleTable.style('allowbranchLabel', () => `margin-right:5px`)}">${localize('focustree.allowbranch', 'Allow branch: ')}</label>
            <div class="select-container ${styleTable.style('marginRight10', () => `margin-right:10px`)}">
                <div id="allowbranch" class="select multiple-select" tabindex="0" role="combobox">
                    <span class="value"></span>
                </div>
            </div>
        </div>`;

    const conditions = `
        <div id="condition-container">
            <label for="conditions" class="${styleTable.style('conditionsLabel', () => `margin-right:5px`)}">${localize('focustree.conditions', 'Conditions: ')}</label>
            <div class="select-container ${styleTable.style('marginRight10', () => `margin-right:10px`)}">
                <div id="conditions" class="select multiple-select" tabindex="0" role="combobox" class="${styleTable.style('conditionsLabel', () => `max-width:400px`)}">
                    <span class="value"></span>
                </div>
            </div>
        </div>`;
    
    const warningsButton = focusTrees.every(ft => ft.warnings.length === 0) ? '' : `
        <button id="show-warnings" title="${localize('focustree.warnings', 'Toggle warnings')}">
            <i class="codicon codicon-warning"></i>
        </button>`;

    const editButtons = `
        <select id="focus-visual-mode" aria-label="${localize('focustree.visualmode', 'Visual mode')}">
            <option value="game">${localize('focustree.visualmode.game', 'Game view')}</option>
            <option value="logic">${localize('focustree.visualmode.logic', 'Logic view')}</option>
        </select>
        <select id="focus-edit-mode" aria-label="${localize('focustree.editmode', 'Canvas mode')}" title="${localize('focustree.editmodehelp', 'Choose Select, Prerequisite, or Mutually Exclusive connection mode')}">
            <option value="select">${localize('focustree.editmode.select', 'Select')}</option>
            <option value="prerequisite">${localize('focustree.editmode.prerequisite', 'Prerequisite')}</option>
            <option value="mutex">${localize('focustree.editmode.mutex', 'Mutex')}</option>
        </select>
        <button id="new-focus-button" class="${styleTable.style('focus-primary-action', () => `width:auto;padding:0 8px;border:1px solid var(--vscode-panel-border);margin-right:4px`)}" title="${localize('focustree.newfocus', 'New focus')}">
            <i class="codicon codicon-add"></i>
            <span>${localize('focustree.newfocus', 'New focus')}</span>
        </button>
        <button id="delete-focus-button" title="${localize('focustree.deletefocus', 'Delete selected focus/focuses (Delete)')}" disabled>
            <i class="codicon codicon-trash"></i>
        </button>
        <button id="fit-tree-button" title="${localize('focustree.fittree', 'Fit whole tree to view (Ctrl+0)')}">
            <i class="codicon codicon-screen-full"></i>
        </button>
        <button id="more-focus-tools-button" aria-haspopup="menu" aria-expanded="false" title="${localize('focustree.moretools', 'More focus tools')}"><i class="codicon codicon-ellipsis"></i></button>
        <button id="focustree-help-button" title="${localize(
            'focustree.help',
            'Shortcuts: Ctrl/Cmd+click to multi-select, Delete to remove, Ctrl/Cmd+D to duplicate, arrow keys to nudge, Ctrl/Cmd+0 to fit the tree. Alt+drag from one focus onto another to add a prerequisite; Alt+Shift+drag to add a mutually exclusive relation.'
        )}">
            <i class="codicon codicon-question"></i>
        </button>`;

    return `<div class="toolbar-outer ${styleTable.style('toolbar-height', () => `box-sizing: border-box; height: 40px; z-index: 20;`)}">
        <div class="toolbar">
            ${indexManager.isIndexEnabled('localisation') ? renderPreviewLabelModeControl(styleTable) : ''}
            ${focuses}
            ${searchbox}
            ${isFeatureEnabled('useConditionInFocus') ? conditions : allowbranch}
            ${editButtons}
            ${warningsButton}
        </div>
    </div>`;
}

function renderPreviewLabelModeControl(styleTable: StyleTable): string {
    return `<div class="preview-label-mode ${styleTable.style('marginRight10', () => `margin-right:10px`)}">
        <span class="${styleTable.style('previewLabelModeLabel', () => `margin-right:5px`)}">${localize('preview.labelmode', 'Label: ')}</span>
        <button type="button" data-preview-label-mode-value="id" aria-pressed="true">${localize('preview.labelmode.id', 'ID')}</button>
        <button type="button" data-preview-label-mode-value="name" aria-pressed="false">${localize('preview.labelmode.name', 'Name')}</button>
    </div>`;
}

async function renderFocus(focus: Focus, styleTable: StyleTable, gfxFiles: string[], file: string): Promise<string> {
    for (const focusIcon of focus.icon) {
        const iconName = focusIcon.icon;
        const iconSprite = iconName ? await getSpriteByGfxName(iconName, gfxFiles) : undefined;
        const iconObject = iconSprite?.image ?? (iconName ? await getImageByPath(defaultFocusIcon) : null);
        const iconWidth = iconSprite?.image.width ?? xGridSize;
        const iconHeight = iconSprite?.image.height ?? yGridSize;
        styleTable.style('focus-icon-' + normalizeForStyle(iconName ?? '-empty'), () => `
            width: ${iconWidth}px;
            height: ${iconHeight}px;
            ${iconObject ? `background-image: url(${iconObject.uri});` : 'background: grey;'}
            background-size: ${iconObject ? `${iconObject.width}px ${iconObject.height}px` : '0 0'};
            ${iconSprite ? `
                left: 50%;
                top: calc(50% - 18px);
                transform: translate(-50%, -50%);
                background-position: center;
            ` : `
                left: 0;
                top: 0;
                background-position-x: center;
                background-position-y: calc(50% - 18px);
            `}
        `);
    }

    styleTable.style('focus-icon-' + normalizeForStyle('-empty'), () => `
        left: 0;
        top: 0;
        width: ${xGridSize}px;
        height: ${yGridSize}px;
        background: grey;
    `);

    let overlay = '';
    if (focus.overlay) {
        const overlaySprite = await getSpriteByGfxName(focus.overlay, gfxFiles);
        if (overlaySprite !== undefined) {
            overlay = `<div class="focus-overlay
            ${styleTable.style('focus-overlay-common', () => `
                position: absolute;
                left: 50%;
                top: 50%;
                width: ${overlaySprite.image.width}px;
                height: ${overlaySprite.image.height}px;
                pointer-events: none;
                transform: translate(-50%, -50%);
                z-index: 0;
            `)}
            ${styleTable.style('focus-overlay-' + normalizeForStyle(focus.overlay), () =>
                `background-image: url(${overlaySprite.image.uri});
                background-size: ${overlaySprite.image.width}px ${overlaySprite.image.height}px;
                background-position: center;
                background-repeat: no-repeat;`
            )}"></div>`;
        }
    }

    const localisedText = getFocusLocalisedText(focus);
    const textContent = htmlEscape(focus.id);
    const labelAttributes = getPreviewLabelAttributes(focus.id, localisedText);
    const titleAttributes = getPreviewTitleAttributes(focus.id, localisedText, '{{position}}');

    return `<div
    class="
        navigator
        ${styleTable.style('focus-common', () => `
            position: relative;
            width: 100%;
            height: 100%;
            text-align: center;
            cursor: pointer;
        `)}
    "
    start="${focus.token?.start}"
    end="${focus.token?.end}"
    ${file === focus.file ? '' : `file="${focus.file}"`}
    ${titleAttributes}>
        <div class="focus-checkbox ${styleTable.style('focus-checkbox', () => `position: absolute; top: 1px; z-index: 1;`)}">
            <input id="checkbox-${normalizeForStyle(focus.id)}" type="checkbox"/>
        </div>
        <div class="focus-artwork
            {{iconClass}}
            ${styleTable.style('focus-icon-common', () => `
                position: absolute;
                pointer-events: none;
                z-index: 0;
                background-repeat: no-repeat;
            `)}
        "></div>
        ${overlay}
        <span
        ${labelAttributes}
        class="focus-label ${styleTable.style('focus-span', () => `
            margin: 10px -400px;
            margin-top: 85px;
            text-align: center;
            display: inline-block;
            position: relative;
            z-index: 1;
        `)}">
        ${textContent}
        </span>
    </div>`;
}

function getFocusLocalisedText(focus: Focus): string | undefined {
    let localisedText = localisationIndex.getLocalisedText(focus.id);
    if (localisedText && localisedText !== focus.id) {
        return localisedText;
    }

    if (focus.text) {
        localisedText = localisationIndex.getLocalisedText(focus.text);
        if (localisedText && localisedText !== focus.text) {
            return localisedText;
        }
    }

    return undefined;
}

function getPreviewLabelAttributes(id: string, name: string | undefined): string {
    return `data-preview-label-id="${htmlEscape(id)}" data-preview-label-name="${htmlEscape(name ?? id)}"`;
}

function getPreviewTitleAttributes(id: string, name: string | undefined, position: string): string {
    const idTitle = `${id}\n(${position})`;
    const nameTitle = `${name ?? id}\n(${position})`;
    return `title="${htmlEscape(idTitle)}" data-preview-title-id="${htmlEscape(idTitle)}" data-preview-title-name="${htmlEscape(nameTitle)}"`;
}

export async function getFocusIcon(name: string, gfxFiles: string[]): Promise<Image | undefined> {
    const sprite = await getSpriteByGfxName(name, gfxFiles);
    if (sprite !== undefined) {
        return sprite.image;
    }

    return await getImageByPath(defaultFocusIcon);
}
