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

    it('keeps hidden condition options out of flex width calculations', () => {
        const filterRule = css.match(
            /\.toolbar > \.topbar-filter-control\s*\{([^}]*)\}/
        )?.[1] ?? '';
        assert.ok(filterRule.includes('flex: 0 1 220px'));
        assert.ok(filterRule.includes('min-width: 180px'));
        assert.ok(filterRule.includes('max-width: 220px'));

        const optionRule = css.match(
            /\.toolbar div\.select > div\.option\s*\{([^}]*)\}/
        )?.[1] ?? '';
        assert.ok(optionRule.includes('position: absolute'));
        assert.ok(optionRule.includes('width: 0'));
        assert.ok(html.includes('class="group topbar-filter-control" data-overflow-priority="2"'));
        assert.ok(html.includes('class="group topbar-search-control"'));
    });

    it('does not override the Conditions group flex layout inline', () => {
        const topbar = fs.readFileSync(
            path.join(process.cwd(), 'webviewsrc/worldmap/topbar.ts'),
            'utf-8'
        );
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
