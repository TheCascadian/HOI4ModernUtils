import { BookmarkDate, DiplomacyRelation, WorldMapWarning } from "../definitions";
import { convertNodeToJson, SchemaDef } from "../../../hoiformat/schema";
import { parseHoi4File, Node } from "../../../hoiformat/hoiparser";
import { readFileFromModOrHOI4 } from "../../../util/fileloader";
import { error } from "../../../util/debug";
import { FolderLoader, FileLoader, LoadResult, LoadResultOD, mergeInLoadResult } from "./common";
import { localize } from "../../../util/i18n";
import { LoaderSession } from "../../../util/loader/loader";
import { flatMap } from "lodash";
import { ConditionComplexExpr, ConditionItem, extractConditionalExprs, simplifyCondition } from "../../../hoiformat/condition";
import { EffectComplexExpr, EffectItem, extractEffectValue } from "../../../hoiformat/effect";
import { Scope } from "../../../hoiformat/scope";
import { BookmarksLoader, bookmarkDateToString, compareBookmarkDate, toBookmarkDate } from "./bookmarks";

interface PuppetEffectObj {
    target?: string;
    autonomous_state?: string;
}

const puppetEffectObjSchema: SchemaDef<PuppetEffectObj> = {
    target: "string",
    autonomous_state: "string",
};

const diplomacyEffectTypes = ['puppet', 'set_autonomy', 'end_puppet', 'annex_country', 'release', 'release_puppet'];

type CountryHistoryFileResult = {
    tag?: string;
    file: string;
    relations: DiplomacyRelation[];
};

export type CountryHistoryLoaderResult = {
    relations: DiplomacyRelation[];
    files: Record<string, string>;
};

export class CountryHistoryLoader extends FolderLoader<CountryHistoryLoaderResult, CountryHistoryFileResult, [() => BookmarksLoader]> {
    constructor(private bookmarksLoader: BookmarksLoader) {
        super('history/countries', CountryHistoryFileLoader, () => this.bookmarksLoader);
    }

    public async shouldReloadImpl(session: LoaderSession): Promise<boolean> {
        return await super.shouldReloadImpl(session) || await this.bookmarksLoader.shouldReload(session);
    }

    protected async loadImpl(session: LoaderSession): Promise<LoadResult<CountryHistoryLoaderResult>> {
        await this.fireOnProgressEvent(localize('worldmap.progress.loadingcountryhistories', 'Loading country diplomacy history...'));
        return super.loadImpl(session);
    }

    protected async mergeFiles(fileResults: LoadResult<CountryHistoryFileResult>[]): Promise<LoadResult<CountryHistoryLoaderResult>> {
        const warnings = mergeInLoadResult(fileResults, 'warnings');
        const conditionExprs = mergeInLoadResult(fileResults, 'conditionExprs');
        const files: Record<string, string> = {};
        for (const fileResult of fileResults) {
            if (fileResult.result.tag && files[fileResult.result.tag] === undefined) {
                files[fileResult.result.tag] = fileResult.result.file;
            }
        }

        return {
            result: {
                relations: flatMap(fileResults, r => r.result.relations),
                files,
            },
            dependencies: [this.folder + '/*'],
            warnings,
            conditionExprs,
        };
    }

    public toString() {
        return `[CountryHistoryLoader]`;
    }
}

class CountryHistoryFileLoader extends FileLoader<CountryHistoryFileResult> {
    constructor(file: string, private bookmarkLoaderGetter: () => BookmarksLoader) {
        super(file);
    }

    protected async loadFromFile(session: LoaderSession): Promise<LoadResultOD<CountryHistoryFileResult>> {
        const bookmarks = await this.bookmarkLoaderGetter().load(session);
        const conditionExprs: ConditionItem[] = [];
        const warnings: WorldMapWarning[] = [];
        return {
            result: {
                tag: tagFromFileName(this.file),
                file: this.file,
                relations: await loadCountryHistory(this.file, bookmarks.result.bookmarks, conditionExprs),
            },
            warnings,
            conditionExprs,
        };
    }

    public toString() {
        return `[CountryHistoryFileLoader: ${this.file}]`;
    }
}

function tagFromFileName(file: string): string | undefined {
    const baseName = file.replace(/^.*[\\/]/, '');
    const match = baseName.match(/^([A-Z0-9]{3})(?:[\s_-]|\.txt$)/i);
    return match ? match[1].toUpperCase() : undefined;
}

async function loadCountryHistory(
    file: string,
    bookmarks: { date: BookmarkDate }[],
    conditionExprs: ConditionItem[],
): Promise<DiplomacyRelation[]> {
    const overlord = tagFromFileName(file);
    if (!overlord) {
        return [];
    }

    try {
        const [buffer] = await readFileFromModOrHOI4(file);
        const rootNode: Node = parseHoi4File(buffer.toString(), localize('infile', 'In file {0}:\n', file));
        const scope: Scope = { scopeName: overlord, scopeType: 'country' };
        const effect = extractEffectValue(rootNode.value, scope);

        const relations: Record<string, DiplomacyRelation[]> = {};

        if (bookmarks.length === 0) {
            findAndExtractDiplomacyEffects(overlord, file, effect.effect, true, relations, conditionExprs);
        } else {
            extractWithBookmarks(overlord, file, effect.effect, bookmarks, relations, conditionExprs);
        }

        return flatMap(Object.values(relations), r => [...r].reverse());
    } catch (e) {
        error(e);
        return [];
    }
}

function extractWithBookmarks(
    overlord: string,
    file: string,
    effect: EffectComplexExpr,
    bookmarks: { date: BookmarkDate }[],
    relations: Record<string, DiplomacyRelation[]>,
    conditionExprs: ConditionItem[],
) {
    // Non date-gated effects (outside of dated blocks) are always active.
    findAndExtractDiplomacyEffects(overlord, file, effect, true, relations, conditionExprs, true);

    const dateHistoryEffects = extractDatedEffects(effect);
    dateHistoryEffects.sort((a, b) => compareBookmarkDate(a.date, b.date));

    if (dateHistoryEffects.length === 0) {
        return;
    }

    const bookmarkConditions: ConditionItem[] = bookmarks.map(b => ({ scopeName: '', nodeContent: bookmarkDateToString(b.date) }));

    let bookmarkCondition: ConditionComplexExpr = true;
    for (let i = 0, j = 0; i < bookmarks.length && j < dateHistoryEffects.length;) {
        const bookmark = bookmarks[i];
        const dateHistoryEffect = dateHistoryEffects[j];
        if (compareBookmarkDate(dateHistoryEffect.date, bookmark.date) >= 0) {
            i++;
            bookmarkCondition = { type: 'or', items: bookmarkConditions.slice(i) };
            continue;
        }
        findAndExtractDiplomacyEffects(overlord, file, dateHistoryEffect.effect, bookmarkCondition, relations, conditionExprs);
        j++;
    }
}

function extractDatedEffects(
    effect: EffectComplexExpr,
    result: { date: BookmarkDate, effect: EffectComplexExpr }[] = [],
): { date: BookmarkDate, effect: EffectComplexExpr }[] {
    if (effect === null) {
        return result;
    }

    if ('nodeContent' in effect) {
        if (effect.node.name?.match(/^\d{4}\.\d{1,2}\.\d{1,2}$/)) {
            const dateScope: Scope = { scopeName: effect.scopeName, scopeType: 'country' };
            const dateEffect = extractEffectValue(effect.node.value, dateScope);
            result.push({ date: toBookmarkDate(effect.node.name), effect: dateEffect.effect });
        }
    } else if ('condition' in effect) {
        effect.items.forEach(item => extractDatedEffects(item, result));
    } else {
        effect.items.forEach(item => extractDatedEffects(item.effect, result));
    }

    return result;
}

function findAndExtractDiplomacyEffects(
    overlord: string,
    file: string,
    effect: EffectComplexExpr,
    conditions: ConditionComplexExpr | ConditionComplexExpr[],
    relations: Record<string, DiplomacyRelation[]>,
    conditionExprs: ConditionItem[],
    skipDatedBlocks: boolean = false,
) {
    const conditionList = Array.isArray(conditions) ? conditions : [conditions];

    walkEffect(effect, conditionList, skipDatedBlocks);

    function walkEffect(e: EffectComplexExpr, conds: ConditionComplexExpr[], skipDated: boolean) {
        if (e === null) {
            return;
        }

        if ('nodeContent' in e) {
            if (skipDated && e.node.name?.match(/^\d{4}\.\d{1,2}\.\d{1,2}$/)) {
                return;
            }

            const nodeName = e.node.name?.toLowerCase();
            if (nodeName && diplomacyEffectTypes.includes(nodeName) && e.scopeName === overlord) {
                extractDiplomacyEffect(overlord, file, e, nodeName, simplifyCondition({ type: 'and', items: conds }), relations, conditionExprs);
            }
        } else if ('condition' in e) {
            e.items.forEach(item => walkEffect(item, conds.concat(e.condition), skipDated));
        } else {
            e.items.forEach(item => walkEffect(item.effect, conds, skipDated));
        }
    }
}

function extractDiplomacyEffect(
    overlord: string,
    file: string,
    effect: EffectItem,
    nodeName: string,
    condition: ConditionComplexExpr,
    relations: Record<string, DiplomacyRelation[]>,
    conditionExprs: ConditionItem[],
) {
    let target: string | undefined;
    let level: string;

    if (nodeName === 'set_autonomy') {
        const obj = convertNodeToJson<PuppetEffectObj>(effect.node, puppetEffectObjSchema);
        target = obj.target;
        level = obj.autonomous_state ?? 'autonomy_dominion';
    } else if (nodeName === 'annex_country') {
        const obj = convertNodeToJson<PuppetEffectObj>(effect.node, puppetEffectObjSchema);
        target = obj.target;
        level = 'annexed';
    } else if (nodeName === 'puppet') {
        if (Array.isArray(effect.node.value)) {
            const obj = convertNodeToJson<PuppetEffectObj>(effect.node, puppetEffectObjSchema);
            target = obj.target;
        } else {
            target = convertNodeToJson<string>(effect.node, 'string');
        }
        level = 'puppet';
    } else {
        // end_puppet, release, release_puppet
        target = convertNodeToJson<string>(effect.node, 'string');
        level = 'independent';
    }

    if (!target || target.toUpperCase() === overlord) {
        return;
    }

    target = target.toUpperCase();
    extractConditionalExprs(condition, conditionExprs);

    const list = relations[target] ?? (relations[target] = []);
    list.push({ overlord, subject: target, level, condition, file });
}
