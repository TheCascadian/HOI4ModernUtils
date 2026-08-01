import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

describe('world map operational message contract', () => {
    const definitions = fs.readFileSync(
        path.join(process.cwd(), 'src/previewdef/worldmap/definitions.ts'),
        'utf-8'
    );
    const backend = fs.readFileSync(
        path.join(process.cwd(), 'src/previewdef/worldmap/worldmap.ts'),
        'utf-8'
    );
    const frontend = fs.readFileSync(
        path.join(process.cwd(), 'webviewsrc/worldmap/topbar.ts'),
        'utf-8'
    );

    const interfaceBody = (name: string): string => {
        const match = definitions.match(new RegExp(`export interface ${name} \\{([\\s\\S]*?)\\n\\}`));
        assert.ok(match, `Missing ${name}`);
        return match![1];
    };

    it('requires correlation IDs on every destructive request and result', () => {
        const interfaces = [
            'ResolveProvinceWarningsMessage',
            'ResolveProvinceWarningsResultMessage',
            'RunAreaOperationMessage',
            'AreaOperationResultMessage',
            'RunContinentPipelineMessage',
            'ContinentPipelineResultMessage',
            'RemoveAllCoresMessage',
            'RemoveAllCoresResultMessage',
            'ReindexMapMessage',
            'ReindexMapResultMessage',
            'CreateCountryMessage',
            'CreateCountryResultMessage',
            'PersistCountryDiplomacyMessage',
            'CountryDiplomacyUpdatedMessage',
            'PersistStatesMessage',
            'PersistStatesResultMessage',
            'PersistStrategicRegionsMessage',
            'PersistStrategicRegionsResultMessage',
            'PersistProvincesMessage',
            'PersistProvincesResultMessage',
            'PersistProvinceBmpMessage',
            'ProvinceBmpUpdatedMessage',
            'UndoProvinceBmpMessage',
            'RedoProvinceBmpMessage',
            'PersistVictoryPointLocalisationMessage',
            'PersistVictoryPointLocalisationResultMessage',
        ];

        for (const name of interfaces) {
            assert.match(interfaceBody(name), /\brequestId:\s*string;/, `${name} must require requestId`);
        }
    });

    it('acknowledges every standalone persistence route on success and failure', () => {
        for (const command of [
            'persiststatesresult',
            'persiststrategicregionsresult',
            'persistprovincesresult',
            'persistvictorypointlocalisationresult',
            'provincebmpupdated',
        ]) {
            const occurrences = backend.match(new RegExp(`command: '${command}'`, 'g'))?.length ?? 0;
            assert.ok(occurrences >= 2, `${command} must have success and failure responses`);
        }
    });

    it('writes strategic-region edits to the selected descriptor mod root', () => {
        const resolverStart = backend.indexOf('private async resolveTargetFile');
        const resolverEnd = backend.indexOf('private async ensureDescriptorReplacePaths', resolverStart);
        const resolver = backend.slice(resolverStart, resolverEnd);
        const descriptorLookup = resolver.indexOf('await getModPathFromDescriptor()');
        const genericLookup = resolver.indexOf('await getFilePathFromMod(relativePath)');

        assert.ok(descriptorLookup >= 0, 'write resolver must inspect the selected descriptor');
        assert.ok(genericLookup >= 0, 'write resolver must retain the workspace fallback');
        assert.ok(descriptorLookup < genericLookup, 'selected descriptor must win over workspace matches');
        assert.ok(backend.includes('const targetSnapshot = await this.readOperationalSnapshot(targetFile)'));
        assert.ok(backend.includes('Wrote strategic-region changes to ${write.target.fsPath}'));
    });

    it('uses typed province BMP results instead of nested JSON status data', () => {
        const body = interfaceBody('ProvinceBmpUpdatedMessage');
        assert.match(body, /\bsuccess:\s*boolean;/);
        assert.match(body, /\bforceReload:\s*boolean;/);
        assert.ok(!body.includes('data: string'));
        assert.ok(!backend.includes("command: 'provincebmpupdated',\n                            data: JSON.stringify"));
    });

    it('rejects stale completions and reloads after persistence failure or timeout', () => {
        assert.ok(frontend.includes("this.completeRequest('areaoperation', message.requestId)"));
        assert.ok(frontend.includes("this.completeRequest('continentpipeline', message.requestId)"));
        assert.ok(frontend.includes('this.pendingPersistenceRequests.get(message.requestId)'));
        assert.ok(frontend.includes('this.mapUndoStack.length = 0'));
        assert.ok(frontend.includes('this.loader.refresh()'));
        assert.ok(frontend.includes('did not return a completion result'));
    });
});
