import { parentPort } from 'worker_threads';
import { IndexingWorkerRequest, IndexingWorkerResponse, parseIndexingRequest } from './indexingworkerprotocol';

if (!parentPort) {
    throw new Error('Indexing worker must run in a worker thread.');
}

parentPort.on('message', (request: IndexingWorkerRequest) => {
    let response: IndexingWorkerResponse;
    try {
        response = { id: request.id, entries: parseIndexingRequest(request) };
    } catch (error) {
        const detail = error instanceof Error ? error.stack ?? error.message : String(error);
        response = { id: request.id, error: detail };
    }
    parentPort!.postMessage(response);
});
parentPort.postMessage({ kind: 'ready' });
