import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

describe('world map toolbar styling', () => {
    const css = fs.readFileSync(
        path.join(process.cwd(), 'src/previewdef/worldmap/worldmapview.css'),
        'utf-8'
    );
    const html = fs.readFileSync(
        path.join(process.cwd(), 'src/previewdef/worldmap/worldmapview.html'),
        'utf-8'
    );
    const topbar = fs.readFileSync(
        path.join(process.cwd(), 'webviewsrc/worldmap/topbar.ts'),
        'utf-8'
    );
    const contextMenu = fs.readFileSync(
        path.join(process.cwd(), 'webviewsrc/util/contextmenu.ts'),
        'utf-8'
    );

    it('keeps Accessibility and Performance controls visible on hover', () => {
        const hoverRule = css.match(/\.toolbar button:hover:not\(:disabled\)\s*\{([^}]*)\}/)?.[1] ?? '';
        assert.ok(hoverRule.includes('--vscode-button-foreground'));
        assert.ok(!hoverRule.includes('--vscode-focusBorder'));

        const buttonRule = css.match(
            /#render-optimizations-button,\s*#accessibility-options-button\s*\{([^}]*)\}/
        )?.[1] ?? '';
        assert.ok(buttonRule.includes('opacity: 1'));
        assert.ok(buttonRule.includes('visibility: visible'));
    });

    it('uses flex compression with an explicit overflow disclosure', () => {
        const toolbarRule = css.match(/\.toolbar\s*\{([^}]*)\}/)?.[1] ?? '';
        assert.ok(toolbarRule.includes('display: flex'));
        assert.ok(toolbarRule.includes('flex-wrap: nowrap'));
        assert.ok(css.includes('@container worldmap-toolbar (max-width: 840px)'));
        assert.ok(css.includes('.topbar-overflow-menu'));
        assert.ok(html.includes('id="topbar-overflow-button"'));
        assert.ok(html.includes('data-overflow-priority="1"'));
    });

    it('uses compact icon labels and a nested interface menu', () => {
        assert.ok(html.includes('class="topbar-icon-label"'));
        assert.ok(html.includes('id="interface-tools-button"'));
        assert.ok(html.includes('id="interface-tools-menu"'));
        assert.ok(html.includes('class="menu-keybind">Ctrl+Alt+Shift+P'));
        assert.ok(css.includes('.interface-tools-menu'));
        assert.ok(css.includes('.toolbar [tabindex="0"]:focus-visible'));
        assert.ok(css.includes('#province-edit-tools-button,\n#interface-tools-button'));
        assert.ok(css.includes('white-space: nowrap'));
        assert.ok(topbar.includes('isNestedMenuInteraction'));
        assert.ok(topbar.includes("closest('ul.select-dropdown')"));
        assert.ok(!css.includes('.interface-tools-menu.submenu-detached'));
        assert.ok(!topbar.includes("parent.classList.toggle('submenu-detached'"));
    });

    it('shows only the active-view warning filter and omits empty check gutters', () => {
        assert.ok(topbar.includes("worldmap.contextmenu.warnings.byviewmode"));
        assert.ok(!topbar.includes("worldmap.contextmenu.warnings.bycolorset"));
        assert.ok(!topbar.includes('warningsFilterByColorSet'));
        assert.ok(contextMenu.includes('if (item.checked !== undefined)'));
        assert.ok(contextMenu.includes("check.classList.toggle('checked', item.checked === true)"));
        assert.ok(css.includes('ul.context-menu .context-menu-check.checked'));
        assert.ok(css.includes('var(--vscode-checkbox-border'));
    });

    it('discloses overflow only when controls are actually moved', () => {
        assert.ok(css.includes('.topbar-overflow[hidden]'));
        assert.ok(css.includes('#topbar-overflow-button:disabled'));
        assert.ok(css.includes('cursor: default'));
    });

    it('places search inside one field and moves strategic-region assignment to context tools', () => {
        assert.ok(html.includes('class="topbar-search-field"'));
        assert.ok(css.includes('.topbar-search-field > #search'));
        assert.ok(!html.includes('id="assign-to-strategicregion"'));
    });

    it('reports actual loaded region counts instead of sparse array boundaries', () => {
        assert.ok(topbar.includes('worldMap.forEachProvince(() => { count++; })'));
        assert.ok(topbar.includes('worldMap.forEachState(() => { count++; })'));
        assert.ok(topbar.includes('worldMap.forEachStrategicRegion(() => { count++; })'));
        assert.ok(topbar.includes('worldMap.forEachSupplyArea(() => { count++; })'));
        assert.ok(topbar.includes("'{0}: {1}'"));
        assert.ok(!topbar.includes('worldMap.provincesCount - 1'));
        assert.ok(!topbar.includes('worldMap.statesCount - 1'));
    });

    it('uses the shared glass surface for context menus', () => {
        assert.ok(css.includes('ul.context-menu'));
        assert.ok(css.includes('background: var(--worldmap-glass-background)'));
        assert.ok(css.includes('box-shadow: var(--worldmap-glass-shadow)'));
        assert.ok(css.includes('ul.context-menu li.context-menu-item:focus-visible'));
    });

    it('never rounds World Map surfaces beyond two pixels', () => {
        const numericRadii = Array.from(css.matchAll(/border-radius:\s*(\d+)px/g), match => Number(match[1]));
        assert.ok(numericRadii.every(radius => radius <= 2));
        assert.ok(css.includes('--worldmap-corner: 2px'));
        assert.ok(css.includes('.render-optimizations-menu,\n.accessibility-options-menu'));
    });

    it('groups province editing actions without crowding the main toolbar', () => {
        assert.ok(html.includes('id="province-edit-tools-button"'));
        assert.ok(html.includes('id="province-edit-tools-menu"'));
        assert.ok(css.includes('.province-edit-tools-menu'));
        assert.ok(html.includes('id="brushsize" type="number" min="1" max="512"'));
        assert.ok(!html.includes('bottom:20px;left:50%;transform:translateX(-50%)'));
        assert.ok(css.includes('left: 50vw'));
    });

    it('contains paint and lasso controls inside narrow, short editor panes', () => {
        const panelTag = html.match(/<div id="paintbrush-panel"[^>]*>/)?.[0] ?? '';
        assert.ok(panelTag.includes(' hidden'));
        assert.ok(panelTag.includes('class="worldmap-modal-card"'));
        assert.ok(!panelTag.includes('style='));
        assert.ok(!panelTag.includes('min-width'));
        assert.ok(css.includes('max-height: calc(100vh - 92px)'));
        assert.ok(html.includes('class="worldmap-modal-actions paintbrush-tool-actions"'));
        assert.ok(html.includes('class="render-optimization-option"'));
        assert.ok(html.includes('id="paintbrush-apply" class="primary"'));
        assert.ok(html.includes('class="paintbrush-footer"'));
        assert.ok(css.includes('.paintbrush-commit-actions'));
        assert.ok(css.includes('appearance: textfield'));
        assert.ok(css.includes('width: min(390px, calc(100vw - 16px))'));
        assert.ok(html.includes('class="paintbrush-control-strip"'));
        assert.ok(html.includes('id="paintbrush-apply" class="primary" title='));
        assert.ok(html.includes('<span id="paintbrush-apply-label">Apply</span>'));
        assert.ok(html.includes('id="paintbrush-workflow-instruction"'));
        assert.ok(!html.includes('id="paintbrush-color-preview"'));
        assert.ok(!html.includes('id="paintbrush-draft-details"'));
        assert.ok(topbar.includes("'Review the staged area, then select Create.'"));
        assert.ok(topbar.includes("'Create one new province from {0} staged pixels and save the map changes?'"));
        assert.ok(!css.includes('@media (max-width: 520px), (max-height: 420px)'));
    });

    it('guards map shortcuts from interactive controls and duplicate bindings', () => {
        assert.ok(topbar.includes('function shortcutSignature(shortcut: ShortcutSpec)'));
        assert.ok(topbar.includes('const protectedDefaults = new Set'));
        assert.ok(topbar.includes("'input, textarea, select, button, a, [role=\"combobox\"]"));
        assert.ok(topbar.includes("key === 'p' && !e.ctrlKey && !e.shiftKey"));
        assert.ok(topbar.includes("'Ctrl+Alt+I', 'Ctrl+Alt+A', 'Ctrl+Alt+P', 'Ctrl+Alt+Shift+P'"));
    });

    it('exposes independent persisted typography and appearance controls', () => {
        assert.ok(html.includes('id="interface-font-size" type="range"'));
        assert.ok(html.includes('<div class="select-container">\n                            <select id="interface-font-family">'));
        assert.ok(html.includes('id="interface-ui-scale" type="range"'));
        assert.ok(html.includes('id="interface-panel-opacity" type="range"'));
        assert.ok(html.includes('id="interface-glass-blur" type="range"'));
        assert.ok(css.includes('--worldmap-font-size: 12px'));
        assert.ok(css.includes('--worldmap-font-family:'));
        assert.ok(css.includes('.interface-setting-row'));
        assert.ok(css.includes('body .select-container > select'));
        assert.ok(css.includes('body > ul.select-dropdown'));
        assert.ok(css.includes('.performance-debug-header'));
        assert.ok(css.includes('font-family: var(--worldmap-font-family)'));
        assert.ok(css.includes('.select-container::after {\n    font-family: codicon'));
        assert.ok(topbar.includes("window.dispatchEvent(new Event('worldmap-interface-change'))"));
        assert.ok(css.includes('input[type="range"]::-webkit-slider-runnable-track'));
        assert.ok(css.includes('input[type="range"]::-webkit-slider-thumb'));
        assert.ok(css.includes('#accessibility-options-reset:hover'));
        assert.ok(css.includes('body > ul.select-dropdown'));
        assert.ok(css.includes('backdrop-filter: var(--worldmap-glass-blur)'));
    });

    it('sizes interface and province menus to their longest visible label', () => {
        const interfaceRule = css.match(/\.interface-tools-menu\s*\{([^}]*)\}/)?.[1] ?? '';
        const provinceRule = css.match(/\.province-edit-tools-menu\s*\{([^}]*)\}/)?.[1] ?? '';
        assert.ok(interfaceRule.includes('width: max-content'));
        assert.ok(interfaceRule.includes('max-width: calc(100vw - 24px)'));
        assert.ok(provinceRule.includes('width: max-content'));
        assert.ok(provinceRule.includes('max-width: calc(100vw - 24px)'));
    });

    it('uses the shared modal and menu language for every editing surface', () => {
        assert.ok(html.includes('id="new-province-confirm-modal" class="worldmap-modal" hidden'));
        assert.ok(html.includes('id="new-province-confirm-title" class="worldmap-modal-title"'));
        assert.ok(html.includes('class="worldmap-modal-checkbox"'));
        assert.ok(html.includes('class="worldmap-modal-summary worldmap-modal-report"'));
        assert.ok(!html.includes('style='));
        assert.ok(css.includes('.province-edit-tools-menu,\n.interface-tools-menu,\n.render-optimizations-menu,\n.accessibility-options-menu,\n.topbar-overflow-menu'));
        assert.ok(css.includes('#paintbrush-panel .paintbrush-tool-actions button'));
        assert.ok(css.includes('width: 30px'));
        assert.ok(css.includes('--worldmap-glass-background:'));
        assert.ok(css.includes('--worldmap-glass-shadow:'));
        assert.ok(css.includes('backdrop-filter: var(--worldmap-glass-blur)'));
    });

    it('sizes topbar selector buttons to their widest visible option', () => {
        const filterRule = css.match(
            /\.toolbar > \.topbar-filter-control\s*\{([^}]*)\}/
        )?.[1] ?? '';
        assert.ok(filterRule.includes('flex: 0 0 auto'));
        assert.ok(filterRule.includes('max-width: none'));
        assert.ok(css.includes('.toolbar .select-container.content-sized-select'));
        assert.ok(css.includes('width: var(--dropdown-trigger-width)'));
        assert.ok(fs.readFileSync(path.join(process.cwd(), 'webviewsrc/util/dropdown.ts'), 'utf-8').includes('sizeTopbarTriggerToOptions'));

        const optionRule = css.match(
            /\.toolbar div\.select > div\.option\s*\{([^}]*)\}/
        )?.[1] ?? '';
        assert.ok(optionRule.includes('position: absolute'));
        assert.ok(optionRule.includes('width: 0'));
        assert.ok(html.includes('class="group topbar-filter-control" data-overflow-priority="2"'));
        assert.ok(html.includes('class="group topbar-search-control"'));
    });

    it('lets dropdowns expand without internal scrollbars or truncated labels', () => {
        const dropdownRule = css.match(/body > ul\.select-dropdown\s*\{([^}]*)\}/)?.[1] ?? '';
        const itemRule = css.match(/body > ul\.select-dropdown li\s*\{([^}]*)\}/)?.[1] ?? '';
        assert.ok(dropdownRule.includes('max-width: none'));
        assert.ok(dropdownRule.includes('max-height: none'));
        assert.ok(dropdownRule.includes('overflow: visible'));
        assert.ok(!itemRule.includes('text-overflow: ellipsis'));
    });

    it('vertically centers trigger and option labels within every dropdown', () => {
        const triggerRule = css.match(
            /\.toolbar \.select-container > select,\s*\.toolbar \.select-container > div\.select\s*\{([^}]*)\}/
        )?.[1] ?? '';
        const valueRule = css.match(/\.toolbar div\.select > span\.value\s*\{([^}]*)\}/)?.[1] ?? '';
        const itemRule = css.match(/body > ul\.select-dropdown li\s*\{([^}]*)\}/)?.[1] ?? '';
        assert.ok(triggerRule.includes('height: var(--worldmap-control-height)'));
        assert.ok(triggerRule.includes('line-height: calc(var(--worldmap-control-height) - 2px)'));
        assert.ok(valueRule.includes('align-items: center'));
        assert.ok(valueRule.includes('height: 100%'));
        assert.ok(itemRule.includes('align-items: center'));
        assert.ok(itemRule.includes('line-height: 1.25'));
    });

    it('left-aligns multi-select checkbox rows without hidden native-control spacing', () => {
        const commonCss = fs.readFileSync(path.join(process.cwd(), 'resource/common.css'), 'utf-8');
        const hiddenCheckboxRule = commonCss.match(/input\[type=checkbox\]\.hidden\s*\{([^}]*)\}/)?.[1] ?? '';
        const multiItemRule = css.match(
            /body > ul\.select-dropdown\[aria-multiselectable="true"\] li\s*\{([^}]*)\}/
        )?.[1] ?? '';
        const wrapperRule = css.match(
            /body > ul\.select-dropdown\[aria-multiselectable="true"\] li > \.checkbox-container-out\s*\{([^}]*)\}/
        )?.[1] ?? '';
        const containerRule = css.match(
            /body > ul\.select-dropdown\[aria-multiselectable="true"\] \.checkbox-container\s*\{([^}]*)\}/
        )?.[1] ?? '';

        assert.ok(hiddenCheckboxRule.includes('display: none'));
        assert.ok(multiItemRule.includes('justify-content: flex-start'));
        assert.ok(wrapperRule.includes('flex: 1 1 auto'));
        assert.ok(wrapperRule.includes('margin: 0'));
        assert.ok(containerRule.includes('justify-content: flex-start'));
        assert.ok(containerRule.includes('width: 100%'));
    });

    it('does not override the Conditions group flex layout inline', () => {
        assert.ok(topbar.includes('groupElement.hidden = worldMap.conditionExprs.length === 0'));
        assert.ok(!topbar.includes("groupElement.style.display = worldMap.conditionExprs.length > 0 ? 'inline-block' : 'none'"));
    });

    it('defines a corner-snapped performance diagnostics overlay', () => {
        assert.ok(html.includes('id="performance-debug-toggle"'));
        assert.ok(html.includes('id="performance-debug-overlay"'));
        assert.ok(css.includes('.performance-debug-overlay[data-corner="top-left"]'));
        assert.ok(css.includes('.performance-debug-overlay[data-corner="bottom-right"]'));
    });
});
