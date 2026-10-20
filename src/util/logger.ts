import * as vscode from 'vscode';
import { setParserWarningSink } from './parserlog';

enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
}

// User-facing logger
export class Logger {
    private static outputChannel: vscode.OutputChannel | undefined;
    private static recentLines: string[] = [];

    public static register(): vscode.Disposable {
        Logger.outputChannel = vscode.window.createOutputChannel('HOI4 Mod Utilities');
        Logger.outputChannel.show();
        setParserWarningSink(message => Logger.warn(message));
        return Logger.outputChannel;
    }

    private static logMessage(level: LogLevel, message: string) {
        const timestamp = new Date().toISOString();
        const line = `[${timestamp}] [${level}] ${message}`;
        Logger.recentLines.push(line);
        if (Logger.recentLines.length > 200) {
            Logger.recentLines.shift();
        }
        Logger.outputChannel?.appendLine(line);
    }

    /** The newest log lines, kept so error reports can include what led up to a failure. */
    public static recent(count: number): string[] {
        return Logger.recentLines.slice(-count);
    }

    public static show(): void {
        Logger.outputChannel?.show(true);
    }

    public static debug(message: string) {
        Logger.logMessage(LogLevel.DEBUG, message);
    }

    public static info(message: string) {
        Logger.logMessage(LogLevel.INFO, message);
    }

    public static warn(message: string) {
        Logger.logMessage(LogLevel.WARN, message);
    }

    public static error(message: string) {
        Logger.logMessage(LogLevel.ERROR, message);
    }
}
