import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

describe('focus tree editing toolbar', () => {
    const repositoryRoot = path.resolve(__dirname, '..', '..', '..');
    const webviewSource = fs.readFileSync(path.join(repositoryRoot, 'webviewsrc', 'focustree.ts'), 'utf8');
    const contentBuilderSource = fs.readFileSync(path.join(repositoryRoot, 'src', 'previewdef', 'focustree', 'contentbuilder.ts'), 'utf8');

    it('uses webview-native create UI instead of blocked browser dialogs', () => {
        assert.ok(contentBuilderSource.includes('id="focus-creator"'));
        assert.ok(contentBuilderSource.includes('id="new-focus-id"'));
        assert.ok(contentBuilderSource.includes('id="confirm-new-focus-button"'));
        assert.ok(!webviewSource.includes('window.prompt('));
        assert.ok(!webviewSource.includes('window.confirm('));
    });

    it('keeps primary actions visible and moves secondary tools into one menu', () => {
        assert.ok(contentBuilderSource.includes('id="new-focus-button"'));
        assert.ok(contentBuilderSource.includes('id="delete-focus-button"'));
        assert.ok(contentBuilderSource.includes('id="fit-tree-button"'));
        assert.ok(contentBuilderSource.includes('id="more-focus-tools-button"'));
        assert.ok(contentBuilderSource.includes('id="focus-secondary-tools"'));
        assert.ok(contentBuilderSource.includes('z-index: 20'));
    });
});
