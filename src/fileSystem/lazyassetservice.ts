import * as vscode from 'vscode';
import { PNG } from 'pngjs';
import { DDS } from '../util/image/dds';
import { Surface } from '../util/image/dds/surface';
import { convertPixelFormat, getImageSizeInBytes } from '../util/image/dds/pixelformat';
import { DDPF_FOURCC, DDS_MAGIC, FOURCC_DX10, HEADER_DXT10_LENGTH_INT, HEADER_LENGTH_INT } from '../util/image/dds/typedef';
import { ddsToPng, tgaToPng } from '../util/image/converter';

const CACHE_METADATA_KEY = 'hoi4ModernUtils.lazyAssetCache.v1';
const MAX_THUMBNAIL_DIMENSION = 1024;
const STREAM_CHUNK_SIZE = 64 * 1024;

interface CacheMetadata {
    [key: string]: {
        mtime: number;
        file: string;
    };
}

export interface LazyAssetResult {
    png: Buffer;
    width: number;
    height: number;
    sourceBytes: number;
    fromCache: boolean;
}

/**
 * Mtime-validated disk cache and streaming decoder for large image assets.
 * Native file URIs use createReadStream; web/virtual file systems retain a
 * workspace.fs fallback.
 */
export class LazyAssetService {
    private readonly cacheRoot: vscode.Uri;

    constructor(private readonly context: vscode.ExtensionContext) {
        this.cacheRoot = vscode.Uri.joinPath(context.globalStorageUri, '.hoi4cache');
    }

    public async getThumbnail(
        uri: vscode.Uri,
        type: 'dds' | 'tga',
        token?: vscode.CancellationToken,
    ): Promise<LazyAssetResult> {
        const stat = await vscode.workspace.fs.stat(uri);
        const key = stableKey(`${type}:${uri.toString()}`);
        const metadata = this.context.globalState.get<CacheMetadata>(CACHE_METADATA_KEY, {});
        const cached = metadata[key];
        if (cached && cached.mtime === stat.mtime) {
            try {
                const png = Buffer.from(await vscode.workspace.fs.readFile(vscode.Uri.joinPath(this.cacheRoot, cached.file)));
                const dimensions = PNG.sync.read(png);
                return {
                    png,
                    width: dimensions.width,
                    height: dimensions.height,
                    sourceBytes: stat.size,
                    fromCache: true,
                };
            } catch {
                // A missing/corrupt disk entry is regenerated below.
            }
        }

        this.throwIfCancelled(token);
        const decoded = type === 'dds'
            ? await this.decodeDdsThumbnail(uri, token)
            : downsamplePng(tgaToPng(await this.readStreamed(uri, token)), MAX_THUMBNAIL_DIMENSION);
        this.throwIfCancelled(token);
        const png = PNG.sync.write(decoded);

        try {
            await vscode.workspace.fs.createDirectory(this.cacheRoot);
            const cacheFile = `${key}.png`;
            await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(this.cacheRoot, cacheFile), png);
            metadata[key] = { mtime: stat.mtime, file: cacheFile };
            await this.context.globalState.update(CACHE_METADATA_KEY, metadata);
        } catch {
            // Cache failures must not prevent the preview itself.
        }
        return {
            png,
            width: decoded.width,
            height: decoded.height,
            sourceBytes: stat.size,
            fromCache: false,
        };
    }

    public async decodeFull(
        uri: vscode.Uri,
        type: 'dds' | 'tga',
        token?: vscode.CancellationToken,
    ): Promise<LazyAssetResult> {
        const buffer = await this.readStreamed(uri, token);
        this.throwIfCancelled(token);
        const decoded = type === 'dds'
            ? ddsToPng(DDS.parse(buffer.buffer, buffer.byteOffset))
            : tgaToPng(buffer);
        return {
            png: PNG.sync.write(decoded),
            width: decoded.width,
            height: decoded.height,
            sourceBytes: buffer.length,
            fromCache: false,
        };
    }

    public async getCachedJson<T>(
        namespace: 'province-definitions' | 'focus-tree-nodes',
        uri: vscode.Uri,
        producer: () => Promise<T>,
    ): Promise<T> {
        const stat = await vscode.workspace.fs.stat(uri);
        const key = stableKey(`${namespace}:${uri.toString()}`);
        const metadata = this.context.globalState.get<CacheMetadata>(CACHE_METADATA_KEY, {});
        const cached = metadata[key];
        if (cached && cached.mtime === stat.mtime) {
            try {
                const data = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(this.cacheRoot, cached.file));
                return JSON.parse(Buffer.from(data).toString('utf8')) as T;
            } catch {
                // Regenerate an invalid entry.
            }
        }

        const value = await producer();
        try {
            const cacheFile = `${key}.json`;
            await vscode.workspace.fs.createDirectory(this.cacheRoot);
            await vscode.workspace.fs.writeFile(
                vscode.Uri.joinPath(this.cacheRoot, cacheFile),
                Buffer.from(JSON.stringify(value)),
            );
            metadata[key] = { mtime: stat.mtime, file: cacheFile };
            await this.context.globalState.update(CACHE_METADATA_KEY, metadata);
        } catch {
            // Non-serializable parser details remain available in memory.
        }
        return value;
    }

    private async decodeDdsThumbnail(uri: vscode.Uri, token?: vscode.CancellationToken): Promise<PNG> {
        const headerLength = (HEADER_LENGTH_INT + HEADER_DXT10_LENGTH_INT) * 4;
        const header = await this.readRange(uri, 0, headerLength - 1, token);
        if (header.length < HEADER_LENGTH_INT * 4) {
            throw new Error('DDS header is truncated.');
        }
        const headerCopy = Uint8Array.from(header);
        const values = new Int32Array(headerCopy.buffer, 0, Math.floor(headerCopy.length / 4));
        if (values[0] !== DDS_MAGIC) {
            throw new Error('Invalid DDS magic number.');
        }
        const width = values[4];
        const height = values[3];
        const pixelFormat = convertPixelFormat({
            dwFlags: values[20],
            dwFourCC: values[21],
            dwRGBBitCount: values[22],
            dwRBitMask: values[23],
            dwGBitMask: values[24],
            dwBBitMask: values[25],
            dwABitMask: values[26],
        }, (values[20] & DDPF_FOURCC) !== 0 && values[21] === FOURCC_DX10 ? {
            dxgiFormat: values[32],
            resourceDimension: values[33],
            miscFlag: values[34],
            arraySize: values[35],
            miscFlags2: values[36],
        } : undefined);

        const dataStart = (values[20] & DDPF_FOURCC) !== 0 && values[21] === FOURCC_DX10
            ? (HEADER_LENGTH_INT + HEADER_DXT10_LENGTH_INT) * 4
            : HEADER_LENGTH_INT * 4;
        const totalMipLevels = Math.max(1, values[7] || 1);
        let selectedWidth = width;
        let selectedHeight = height;
        let selectedOffset = dataStart;
        for (let level = 0; level < totalMipLevels; level++) {
            const size = getImageSizeInBytes(pixelFormat, selectedWidth, selectedHeight);
            if (Math.max(selectedWidth, selectedHeight) <= MAX_THUMBNAIL_DIMENSION || level === totalMipLevels - 1) {
                const data = await this.readRange(uri, selectedOffset, selectedOffset + size - 1, token);
                const surface = new Surface(
                    data.buffer,
                    data.byteOffset,
                    data.byteLength,
                    `Thumbnail mip ${level}`,
                    selectedWidth,
                    selectedHeight,
                    pixelFormat,
                );
                const png = new PNG({ width: selectedWidth, height: selectedHeight });
                png.data = Buffer.from(surface.getFullRgba());
                return downsamplePng(png, MAX_THUMBNAIL_DIMENSION);
            }
            selectedOffset += size;
            selectedWidth = Math.max(1, Math.floor(selectedWidth / 2));
            selectedHeight = Math.max(1, Math.floor(selectedHeight / 2));
        }
        throw new Error('DDS does not contain a readable mip level.');
    }

    private async readStreamed(uri: vscode.Uri, token?: vscode.CancellationToken): Promise<Buffer> {
        if (!IS_WEB_EXT && uri.scheme === 'file') {
            const fs: typeof import('fs') = require('fs');
            const chunks: Buffer[] = [];
            const stream = fs.createReadStream(uri.fsPath, { highWaterMark: STREAM_CHUNK_SIZE });
            try {
                for await (const chunk of stream) {
                    this.throwIfCancelled(token);
                    chunks.push(Buffer.from(chunk));
                }
            } catch (error) {
                stream.destroy();
                throw error;
            }
            return Buffer.concat(chunks);
        }
        this.throwIfCancelled(token);
        return Buffer.from(await vscode.workspace.fs.readFile(uri));
    }

    private async readRange(
        uri: vscode.Uri,
        start: number,
        end: number,
        token?: vscode.CancellationToken,
    ): Promise<Buffer> {
        if (!IS_WEB_EXT && uri.scheme === 'file') {
            const fs: typeof import('fs') = require('fs');
            const chunks: Buffer[] = [];
            const stream = fs.createReadStream(uri.fsPath, {
                start,
                end,
                highWaterMark: STREAM_CHUNK_SIZE,
            });
            try {
                for await (const chunk of stream) {
                    this.throwIfCancelled(token);
                    chunks.push(Buffer.from(chunk));
                }
            } catch (error) {
                stream.destroy();
                throw error;
            }
            return Buffer.concat(chunks);
        }
        const all = Buffer.from(await vscode.workspace.fs.readFile(uri));
        this.throwIfCancelled(token);
        return all.subarray(start, end + 1);
    }

    private throwIfCancelled(token?: vscode.CancellationToken): void {
        if (token?.isCancellationRequested) {
            throw new Error('Asset decoding cancelled.');
        }
    }
}

let sharedLazyAssetService: LazyAssetService | undefined;

export function registerLazyAssetService(context: vscode.ExtensionContext): LazyAssetService {
    return sharedLazyAssetService ??= new LazyAssetService(context);
}

export function getLazyAssetService(): LazyAssetService | undefined {
    return sharedLazyAssetService;
}

function downsamplePng(source: PNG, maxDimension: number): PNG {
    const scale = Math.min(1, maxDimension / Math.max(source.width, source.height));
    if (scale === 1) {
        return source;
    }
    const width = Math.max(1, Math.round(source.width * scale));
    const height = Math.max(1, Math.round(source.height * scale));
    const output = new PNG({ width, height });
    for (let y = 0; y < height; y++) {
        const sourceY = Math.min(source.height - 1, Math.floor(y / scale));
        for (let x = 0; x < width; x++) {
            const sourceX = Math.min(source.width - 1, Math.floor(x / scale));
            const sourceOffset = (sourceY * source.width + sourceX) * 4;
            const outputOffset = (y * width + x) * 4;
            output.data[outputOffset] = source.data[sourceOffset];
            output.data[outputOffset + 1] = source.data[sourceOffset + 1];
            output.data[outputOffset + 2] = source.data[sourceOffset + 2];
            output.data[outputOffset + 3] = source.data[sourceOffset + 3];
        }
    }
    return output;
}

function stableKey(value: string): string {
    let first = 0x811c9dc5;
    let second = 0x9e3779b9;
    for (let index = 0; index < value.length; index++) {
        const code = value.charCodeAt(index);
        first = Math.imul(first ^ code, 0x01000193);
        second = Math.imul(second ^ code, 0x85ebca6b);
    }
    return `${(first >>> 0).toString(16).padStart(8, '0')}${(second >>> 0).toString(16).padStart(8, '0')}`;
}
