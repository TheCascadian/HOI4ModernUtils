// Pure helpers for failure reports. Deliberately free of `vscode` imports so
// they can be unit tested and shared with the webview bundle.

export interface FailureContext {
    /** Feature area, e.g. `preview`, `worldmap`, `focustree`, `webview`. */
    area: string;
    /** What was being attempted, e.g. `load`, `export`, `edit`. */
    operation?: string;
    file?: string;
    details?: Record<string, string | number | boolean | undefined>;
}

export interface ReportEnvironment {
    extensionVersion: string;
    vscodeVersion: string;
    platform: string;
    locale: string;
    isWeb: boolean;
    homeDir?: string;
}

function fnv1a(text: string): string {
    let hash = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).toUpperCase().padStart(8, '0');
}

/**
 * Stable short code for a failure: `HMU-<AREA>-<8 hex>`. Digits in the message
 * are normalized so the same fault in different files/ids maps to one code.
 */
export function computeErrorCode(context: FailureContext, error: Error): string {
    const area = context.area.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8) || 'GEN';
    const message = (error.message ?? '').replace(/\d+/g, '#');
    return `HMU-${area}-${fnv1a(`${context.area}|${context.operation ?? ''}|${error.name}|${message}`)}`;
}

/** Replaces the user's home directory so reports don't leak a username. */
export function redactPaths(text: string, homeDir?: string): string {
    let result = text;
    if (homeDir && homeDir.length > 1) {
        result = result.split(homeDir).join('~');
        result = result.split(homeDir.replace(/\\/g, '/')).join('~');
    }
    return result.replace(/([A-Za-z]:\\Users\\)[^\\\s]+/g, '$1<user>').replace(/(\/home\/|\/Users\/)[^/\s]+/g, '$1<user>');
}

export function buildReportText(code: string, error: Error, context: FailureContext, env: ReportEnvironment, recentLog: string[]): string {
    const lines = [
        `HOI4 Modern Utils error report`,
        `Code: ${code}`,
        `Time: ${new Date().toISOString()}`,
        `Extension: ${env.extensionVersion}${env.isWeb ? ' (web)' : ''}`,
        `VS Code: ${env.vscodeVersion}`,
        `Platform: ${env.platform}`,
        `Locale: ${env.locale}`,
        `Area: ${context.area}${context.operation ? ` / ${context.operation}` : ''}`,
    ];
    if (context.file) {
        lines.push(`File: ${context.file}`);
    }
    for (const [key, value] of Object.entries(context.details ?? {})) {
        if (value !== undefined) {
            lines.push(`${key}: ${value}`);
        }
    }
    lines.push('', `${error.name}: ${error.message}`, '', 'Stack:', error.stack ?? '(none)');
    if (recentLog.length > 0) {
        lines.push('', 'Recent log:', ...recentLog);
    }
    return redactPaths(lines.join('\n'), env.homeDir);
}

export function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
