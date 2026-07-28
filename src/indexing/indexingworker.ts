import * as vscode from 'vscode';
import * as path from 'path';
import { IndexingWorkerRequest, IndexingWorkerResponse, parseIndexingRequest, WorkerIndexType } from './indexingworkerprotocol';
import { sendEvent } from '../util/telemetry';

type NodeWorker = import('worker_threads').Worker;

export class IndexingWorker implements vscode.Disposable {
    private worker: NodeWorker | undefined;
    private bootPromise: Promise<void> | undefined;
    private nextId = 1;
    private pending = new Map<number, {
        resolve: (entries: [string, string][]) => void;
        reject: (error: Error) => void;
    }>();

    public boot(): Promise<void> {
        if (this.bootPromise) {
            return this.bootPromise;
        }
        if (IS_WEB_EXT) {
            this.bootPromise = Promise.resolve();
            return this.bootPromise;
        }

        this.bootPromise = new Promise<void>((resolve, reject) => {
            const { Worker }: typeof import('worker_threads') = require('worker_threads');
            const worker = this.worker = new Worker(path.join(__dirname, 'indexingworker.js'));
            worker.once('message', message => {
                if (message?.kind === 'ready') {
                    sendEvent('index.worker.ready');
                    resolve();
                } else {
                    reject(new Error('Indexing worker did not send its ready signal.'));
                }
            });
            worker.on('message', (message: IndexingWorkerResponse) => this.onMessage(message));
            worker.on('error', error => {
                reject(error);
                this.rejectAll(error);
            });
            worker.on('exit', code => {
                if (code !== 0) {
                    this.rejectAll(new Error(`Indexing worker stopped with exit code ${code}.`));
                }
                this.worker = undefined;
            });
        });
        return this.bootPromise;
    }

    public async parse(
        type: WorkerIndexType,
        file: string,
        content: string,
        languageId?: string,
    ): Promise<[string, string][]> {
        if (IS_WEB_EXT) {
            return parseIndexingRequest({ id: 0, type, file, content, languageId });
        }
        await this.boot();
        if (!this.worker) {
            throw new Error('Indexing worker is unavailable.');
        }
        const id = this.nextId++;
        return new Promise<[string, string][]>((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            const request: IndexingWorkerRequest = { id, type, file, content, languageId };
            this.worker!.postMessage(request);
        });
    }

    public dispose(): void {
        this.rejectAll(new Error('Indexing worker disposed.'));
        void this.worker?.terminate();
        this.worker = undefined;
        this.bootPromise = undefined;
    }

    private onMessage(message: IndexingWorkerResponse): void {
        if (typeof message?.id !== 'number') {
            return;
        }
        const pending = this.pending.get(message.id);
        if (!pending) {
            return;
        }
        this.pending.delete(message.id);
        if (message.error) {
            pending.reject(new Error(message.error));
        } else {
            pending.resolve(message.entries ?? []);
        }
    }

    private rejectAll(error: Error): void {
        for (const pending of this.pending.values()) {
            pending.reject(error);
        }
        this.pending.clear();
    }
}

export const indexingWorker = new IndexingWorker();
