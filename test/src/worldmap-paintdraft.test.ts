import * as assert from 'assert';
import { PaintDraftHistory } from '../../webviewsrc/worldmap/paintdraft';

describe('world map paint draft history', () => {
    it('restores and reapplies exact staged paint regions', () => {
        const history = new PaintDraftHistory();
        const first = new Map([['1,1', 0x112233]]);
        history.record(first);
        const second = new Map(first);
        second.set('2,1', 0x112233);

        const restored = history.undo(second);
        assert.deepStrictEqual(Array.from(restored ?? []), [['1,1', 0x112233]]);
        assert.strictEqual(history.canRedo, true);

        restored?.clear();
        const reapplied = history.redo(restored ?? new Map());
        assert.deepStrictEqual(Array.from(reapplied ?? []), [
            ['1,1', 0x112233],
            ['2,1', 0x112233],
        ]);
    });

    it('supports erasing a staged region and retrieving it with undo', () => {
        const history = new PaintDraftHistory();
        const painted = new Map([
            ['4,4', 0xabcdef],
            ['5,4', 0xabcdef],
        ]);
        history.record(painted);
        const erased = new Map(painted);
        erased.delete('5,4');

        const restored = history.undo(erased);
        assert.deepStrictEqual(Array.from(restored?.keys() ?? []), ['4,4', '5,4']);
    });
});
