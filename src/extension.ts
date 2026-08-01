import * as vscode from 'vscode';
import { registerContextContainer, setVscodeContext } from './context';
import { DDSViewProvider, TGAViewProvider } from './ddsviewprovider';
import { registerModFile } from './util/modfile';
import { ViewType, ContextName } from './constants';
import { registerTelemetryReporter, sendEvent } from './util/telemetry';
import { registerScanReferencesCommand } from './util/dependency';
import { registerHoiFs } from './util/hoifs';
import { loadI18n } from './util/i18n';
import { Logger } from "./util/logger";
import { registerLazyPreviews } from './previewdef/lazyregistration';
import { registerLazyAssetService } from './fileSystem/lazyassetservice';
import { registerScanAndLogErrorsCommand } from './util/worldmaperrorscan';

export function activate(context: vscode.ExtensionContext) {
    const activationStarted = performance.now();
    performance.mark('hoi4mu.activate.start');
    let locale = (context as any).extension?.packageJSON.locale;
    if (locale === "%hoi4modernutils.locale%") {
        locale = 'en';
    }

    measurePhase('i18n', () => loadI18n(locale));

    // Must register this first because other component may use it.
    measurePhase('core', () => {
        context.subscriptions.push(Logger.register());
        context.subscriptions.push(registerContextContainer(context));
        context.subscriptions.push(registerTelemetryReporter());
    });

    sendEvent('extension.activate', { locale, isWeb: IS_WEB_EXT.toString() });

    measurePhase('registrations', () => {
        registerLazyAssetService(context);
        context.subscriptions.push(registerLazyPreviews(context));
        context.subscriptions.push(registerModFile());
        context.subscriptions.push(registerScanReferencesCommand());
        context.subscriptions.push(registerScanAndLogErrorsCommand());
        context.subscriptions.push(registerHoiFs());
        // Custom editor providers must be available before VS Code resolves an
        // onCustomEditor activation. Their constructors do no asset decoding.
        context.subscriptions.push(vscode.window.registerCustomEditorProvider(ViewType.DDS, new DDSViewProvider(context)));
        context.subscriptions.push(vscode.window.registerCustomEditorProvider(ViewType.TGA, new TGAViewProvider(context)));
    });

    const indexingTimer = setTimeout(async () => {
        const started = performance.now();
        const { indexManager } = await import('./indexing/indexmanager');
        context.subscriptions.push(indexManager.register());
        sendEvent('extension.lazyIndexing.ready', undefined, {
            durationMs: performance.now() - started,
        });
    }, 0);
    context.subscriptions.push({ dispose: () => clearTimeout(indexingTimer) });

    if (process.env.NODE_ENV !== 'production') {
        context.subscriptions.push(vscode.commands.registerCommand('hoi4modernutils.test', () => {
            try {
                // @ts-ignore - dev-only debug module
                const debugModule = __non_webpack_require__('./util/debug.shouldignore');
                debugModule.testCommand();
            } catch {
                // Debug module not available
            }
        }));

        setVscodeContext(ContextName.Hoi4MUInDev, true);
    }
    
    setVscodeContext(ContextName.Hoi4MULoaded, true);
    performance.mark('hoi4mu.activate.end');
    performance.measure('hoi4mu.activate', 'hoi4mu.activate.start', 'hoi4mu.activate.end');
    sendEvent('extension.activate.performance', undefined, {
        durationMs: performance.now() - activationStarted,
    });
    performance.clearMarks('hoi4mu.activate.start');
    performance.clearMarks('hoi4mu.activate.end');
    performance.clearMeasures('hoi4mu.activate');
}

export function deactivate() {}

function measurePhase(name: string, action: () => void): void {
    const startMark = `hoi4mu.activate.${name}.start`;
    const endMark = `hoi4mu.activate.${name}.end`;
    performance.mark(startMark);
    action();
    performance.mark(endMark);
    performance.measure(`hoi4mu.activate.${name}`, startMark, endMark);
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(`hoi4mu.activate.${name}`);
}
