import * as assert from 'assert';
import { buildReportText, computeErrorCode, escapeHtml, redactPaths } from '../../src/util/errorcode';

const env = { extensionVersion: '1.0.0', vscodeVersion: '1.90.0', platform: 'linux', locale: 'en', isWeb: false, homeDir: '/home/bob' };

describe('errorcode', () => {
    it('is stable and well formed', () => {
        const a = computeErrorCode({ area: 'worldmap', operation: 'save' }, new Error('boom'));
        assert.strictEqual(a, computeErrorCode({ area: 'worldmap', operation: 'save' }, new Error('boom')));
        assert.ok(/^HMU-WORLDMAP-[0-9A-F]{8}$/.test(a), a);
    });

    it('normalizes digits but separates operations', () => {
        const ctx = { area: 'focustree', operation: 'edit' };
        assert.strictEqual(computeErrorCode(ctx, new Error('state 12 bad')), computeErrorCode(ctx, new Error('state 345 bad')));
        assert.notStrictEqual(computeErrorCode(ctx, new Error('x')), computeErrorCode({ area: 'focustree', operation: 'move' }, new Error('x')));
    });

    it('redacts home directories', () => {
        assert.strictEqual(redactPaths('open /home/bob/mod/a.txt', '/home/bob'), 'open ~/mod/a.txt');
        assert.ok(!redactPaths('C:\\Users\\alice\\x').includes('alice'));
    });

    it('builds a report containing the code and no username', () => {
        const err = new Error('failed at /home/bob/mod/a.txt');
        const code = computeErrorCode({ area: 'preview' }, err);
        const text = buildReportText(code, err, { area: 'preview', file: '/home/bob/mod/a.txt' }, env, ['log line']);
        assert.ok(text.includes(code));
        assert.ok(text.includes('log line'));
        assert.ok(!text.includes('bob'));
    });

    it('escapes html', () => {
        assert.strictEqual(escapeHtml('<a href="x">&</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
    });
});
