import { parseHoi4File } from '../hoiformat/hoiparser';
import { getSpriteTypes } from '../hoiformat/spritetype';
import { parseLocalisationYaml } from '../util/yaml';

export type WorkerIndexType = 'gfx' | 'localisation';

export interface IndexingWorkerRequest {
    id: number;
    type: WorkerIndexType;
    file: string;
    content: string;
    languageId?: string;
}
export interface IndexingWorkerResponse {
    id: number;
    entries?: [string, string][];
    error?: string;
}

export function parseIndexingRequest(request: IndexingWorkerRequest): [string, string][] {
    const { type, file, content } = request;
    if (type === 'gfx') {
        return getSpriteTypes(parseHoi4File(content, `In file ${file}:\n`))
            .map(sprite => [sprite.name, file]);
    }

    const yaml = parseLocalisationYaml(content.replace(/^\uFEFF/, ''), file);
    const language = request.languageId ?? 'l_english';
    const dictionary = yaml && typeof yaml === 'object' ? yaml[language] : undefined;
    if (!dictionary || typeof dictionary !== 'object' || Array.isArray(dictionary)) {
        return [];
    }
    return Object.keys(dictionary).map(key => {
        const value = dictionary[key];
        return [key, typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
            ? value.toString()
            : ''];
    });
}
