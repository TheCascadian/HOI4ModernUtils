import * as vscode from 'vscode';
import { localize } from './i18n';
import { forceError } from './common';
import { error as debugError } from './debug';
import { Logger } from './logger';
import { buildReportText, computeErrorCode, escapeHtml, FailureContext, ReportEnvironment } from './errorcode';

export { FailureContext } from './errorcode';

const maxStoredReports = 20;
const notifyThrottleMs = 10000;

const reports = new Map<string, string>();
const lastNotified = new Map<string, number>();
let lastCode: string | undefined;

export const CopyLastErrorCommand = 'hoi4modernutils.copylasterror';
export const ShowLastErrorCommand = 'hoi4modernutils.showlasterror';

function getEnvironment(): ReportEnvironment {
    return {
        extensionVersion: typeof VERSION === 'string' ? VERSION : 'unknown',
        vscodeVersion: vscode.version,
        platform: typeof process !== 'undefined' ? `${process.platform} ${process.arch}` : 'web',
        locale: vscode.env.language,
        isWeb: typeof IS_WEB_EXT === 'boolean' && IS_WEB_EXT,
        homeDir: typeof process !== 'undefined' ? process.env.HOME ?? process.env.USERPROFILE : undefined,
    };
}

/** Records a failure (log + stored report) without showing any UI. Returns its error code. */
/** `detail` is supported by VS Code but missing from the minimum @types/vscode this extension targets. */
function modalOptions(detail: string | undefined): vscode.MessageOptions {
    return { modal: true, detail } as vscode.MessageOptions;
}

export function recordFailure(err: unknown, context: FailureContext): string {
    const realError = forceError(err);
    const code = computeErrorCode(context, realError);
    debugError(err);
    Logger.error(`[${code}] ${context.area}${context.operation ? `/${context.operation}` : ''}: ${realError.message}`);
    reports.delete(code);
    reports.set(code, buildReportText(code, realError, context, getEnvironment(), Logger.recent(40)));
    if (reports.size > maxStoredReports) {
        reports.delete(reports.keys().next().value as string);
    }
    lastCode = code;
    return code;
}

export interface ReportOptions {
    /** Blocking dialog; use for failures of something the user just asked for. */
    modal?: boolean;
    /** Short, already-localized sentence describing what failed. */
    summary?: string;
    /** Skip all UI (log + store only). */
    silent?: boolean;
}

/**
 * Records a failure and tells the user, with the error code and one-click
 * "Copy Error Details" so it can be pasted straight into a bug report.
 */
export async function reportFailure(err: unknown, context: FailureContext, options: ReportOptions = {}): Promise<string> {
    const code = recordFailure(err, context);
    if (options.silent) {
        return code;
    }

    const throttleKey = `${context.area}|${context.operation ?? ''}`;
    const now = Date.now();
    if (!options.modal && now - (lastNotified.get(throttleKey) ?? 0) < notifyThrottleMs) {
        return code;
    }
    lastNotified.set(throttleKey, now);

    const message = options.summary ?? localize('error.generic', 'Something went wrong in HOI4 Modern Utils.');
    const detail = localize(
        'error.detail',
        'Error code: {0}\n\n{1}\n\nSelect "Copy Error Details" and send it to the extension author to get this fixed.',
        code,
        truncate(forceError(err).message, 600),
    );
    const copyLabel = localize('error.copy', 'Copy Error Details');
    const logLabel = localize('error.showlog', 'Show Log');

    // The dialog is shown in the background so callers get the code straight away
    // (e.g. to render it in an error page) instead of waiting for it to be dismissed.
    const shown = options.modal ?
        vscode.window.showErrorMessage(message, modalOptions(detail), copyLabel, logLabel) :
        vscode.window.showErrorMessage(`${message} [${code}]`, copyLabel, logLabel);
    void Promise.resolve(shown).then(choice => handleChoice(choice, code, copyLabel, logLabel));
    return code;
}

async function handleChoice(choice: string | undefined, code: string, copyLabel: string, logLabel: string): Promise<void> {
    if (choice === copyLabel) {
        await copyReport(code);
    } else if (choice === logLabel) {
        Logger.show();
    }
}

function truncate(text: string, max: number): string {
    return text.length > max ? `${text.slice(0, max)}…` : text;
}

export async function copyReport(code?: string): Promise<boolean> {
    const text = reports.get(code ?? lastCode ?? '');
    if (!text) {
        await vscode.window.showInformationMessage(localize('error.noreport', 'No error report is available yet.'));
        return false;
    }
    await vscode.env.clipboard.writeText(text);
    await vscode.window.showInformationMessage(localize('error.copied', 'Error details copied to the clipboard.'));
    return true;
}

export function getReportText(code: string): string | undefined {
    return reports.get(code);
}

export function registerErrorReporting(): vscode.Disposable {
    return vscode.Disposable.from(
        vscode.commands.registerCommand(CopyLastErrorCommand, () => copyReport()),
        vscode.commands.registerCommand(ShowLastErrorCommand, async () => {
            if (!lastCode) {
                await vscode.window.showInformationMessage(localize('error.noreport', 'No error report is available yet.'));
                return;
            }
            const copyLabel = localize('error.copy', 'Copy Error Details');
            const choice = await vscode.window.showInformationMessage(
                localize('error.lastcode', 'Last error code: {0}', lastCode),
                modalOptions(reports.get(lastCode)),
                copyLabel,
            );
            await handleChoice(choice, lastCode, copyLabel, '');
        }),
    );
}

/** Handles the buttons rendered by {@link renderErrorPage}. Returns true if the message was consumed. */
export async function handleErrorPageMessage(msg: { command?: string; code?: string }): Promise<boolean> {
    switch (msg.command) {
        case 'copyErrorReport':
            await copyReport(msg.code);
            return true;
        case 'showErrorLog':
            Logger.show();
            return true;
    }
    return false;
}

/** Full-page replacement for a preview that failed to load, with Copy / Retry / Log buttons. */
export function renderErrorPage(webview: vscode.Webview, code: string, summary: string, err: unknown): string {
    const nonce = Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
    const message = truncate(forceError(err).message, 1200);
    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<style>
body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 24px; }
h2 { color: var(--vscode-errorForeground); margin-top: 0; }
code, pre { font-family: var(--vscode-editor-font-family); background: var(--vscode-textBlockQuote-background); padding: 2px 6px; user-select: all; }
pre { padding: 10px; white-space: pre-wrap; word-break: break-word; max-height: 40vh; overflow: auto; }
button { margin: 8px 8px 0 0; padding: 6px 12px; color: var(--vscode-button-foreground); background: var(--vscode-button-background); border: 0; cursor: pointer; }
button.secondary { color: var(--vscode-button-secondaryForeground); background: var(--vscode-button-secondaryBackground); }
</style></head><body>
<h2>${escapeHtml(summary)}</h2>
<p>${escapeHtml(localize('error.page.code', 'Error code'))}: <code>${escapeHtml(code)}</code></p>
<pre>${escapeHtml(message)}</pre>
<p>${escapeHtml(localize('error.page.help', 'Copy the error details and send them to the extension author.'))}</p>
<button id="copy">${escapeHtml(localize('error.copy', 'Copy Error Details'))}</button>
<button id="retry" class="secondary">${escapeHtml(localize('error.retry', 'Retry'))}</button>
<button id="log" class="secondary">${escapeHtml(localize('error.showlog', 'Show Log'))}</button>
<script nonce="${nonce}">
const vscode = acquireVsCodeApi();
document.getElementById('copy').onclick = () => vscode.postMessage({ command: 'copyErrorReport', code: ${JSON.stringify(code)} });
document.getElementById('retry').onclick = () => vscode.postMessage({ command: 'reload' });
document.getElementById('log').onclick = () => vscode.postMessage({ command: 'showErrorLog' });
</script></body></html>`;
}
