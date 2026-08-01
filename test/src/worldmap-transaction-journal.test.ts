import * as assert from 'assert';
import { applyEntriesWithRollback } from '../../src/previewdef/worldmap/transactionjournal';

describe('world map transaction journal', () => {
    it('restores every completed write after a later write fails', async () => {
        const files = new Map<string, string | undefined>([
            ['bmp', 'old-bmp'],
            ['definitions', 'old-definitions'],
            ['states', 'old-states'],
        ]);
        const desired: Array<{ key: string; value: string | undefined }> = [
            { key: 'bmp', value: 'new-bmp' },
            { key: 'definitions', value: 'new-definitions' },
            { key: 'states', value: 'new-states' },
        ];
        let writeCount = 0;

        await assert.rejects(() => applyEntriesWithRollback(
            desired,
            async entry => ({ key: entry.key, value: files.get(entry.key) }),
            async entry => {
                writeCount++;
                files.set(entry.key, entry.value);
                if (writeCount === 3) {
                    throw new Error('injected post-write verification failure');
                }
            }
        ), /injected post-write verification failure/);

        assert.deepStrictEqual(Array.from(files.entries()), [
            ['bmp', 'old-bmp'],
            ['definitions', 'old-definitions'],
            ['states', 'old-states'],
        ]);
    });

    it('does not mutate caller history when restoration fails', async () => {
        const undo = ['snapshot'];
        const redo: string[] = [];
        await assert.rejects(async () => {
            const snapshot = undo[undo.length - 1];
            await applyEntriesWithRollback(
                [{ key: 'bmp', value: 'old' }],
                async entry => entry,
                async () => { throw new Error('injected restore failure'); }
            );
            undo.pop();
            redo.push(snapshot);
        });
        assert.deepStrictEqual(undo, ['snapshot']);
        assert.deepStrictEqual(redo, []);
    });
});
