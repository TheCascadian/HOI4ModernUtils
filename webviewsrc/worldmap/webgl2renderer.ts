import { Point, Province, Zone } from './definitions';
import { FEWorldMap } from './loader';
import { Quadtree } from './quadtree';
import { ViewPoint } from './viewpoint';

const FLOATS_PER_VERTEX = 5;
const BYTES_PER_FLOAT = 4;
const POSITION_OFFSET = 0;
const CORNER_OFFSET = 2 * BYTES_PER_FLOAT;
const PROVINCE_OFFSET = 4 * BYTES_PER_FLOAT;

interface GeometryLod {
    vertexBuffer: WebGLBuffer;
    allIndices: Uint32Array;
    indexRangesByProvince: Map<number, { start: number; count: number }>;
}

export interface WebGL2FrameResult {
    visibleProvinceIds: ReadonlySet<number>;
    drawCalls: number;
    indexCount: number;
    lod: number;
}

export interface OverlayInstance {
    x: number;
    y: number;
    width: number;
    height: number;
    color: number;
}

/**
 * GPU base-map renderer.
 *
 * Province raster runs are converted once into an interleaved position,
 * corner-UV and province-id buffer. Per-frame work updates only the color
 * palette and the visible index list selected by the quadtree.
 */
export class WebGL2Renderer {
    private readonly gl: WebGL2RenderingContext;
    private readonly program: WebGLProgram;
    private readonly vao: WebGLVertexArrayObject;
    private readonly elementBuffer: WebGLBuffer;
    private readonly paletteTexture: WebGLTexture;
    private readonly paletteData: Uint8Array;
    private readonly paletteWidth: number;
    private readonly paletteHeight: number;
    private readonly lods = new Map<number, GeometryLod>();
    private quadtree: Quadtree<number>;
    private readonly provincesById = new Map<number, Province>();
    private currentWorldMap: FEWorldMap | undefined;
    private currentMutationToken: unknown;
    private currentPaletteToken: unknown = Symbol('uninitialized-palette');
    private disposed = false;

    public static create(canvas: HTMLCanvasElement, worldWidth: number = 1, worldHeight: number = 1): WebGL2Renderer | undefined {
        const gl = canvas.getContext('webgl2', {
            alpha: false,
            antialias: false,
            depth: false,
            preserveDrawingBuffer: false,
            premultipliedAlpha: false,
        });
        if (!gl) {
            return undefined;
        }
        return new WebGL2Renderer(gl, worldWidth, worldHeight);
    }

    private constructor(gl: WebGL2RenderingContext, worldWidth: number, worldHeight: number) {
        this.gl = gl;
        this.program = this.createProgram(VERTEX_SHADER, FRAGMENT_SHADER);
        const vao = gl.createVertexArray();
        const elementBuffer = gl.createBuffer();
        const paletteTexture = gl.createTexture();
        if (!vao || !elementBuffer || !paletteTexture) {
            throw new Error('Unable to allocate WebGL2 map renderer resources.');
        }
        this.vao = vao;
        this.elementBuffer = elementBuffer;
        this.paletteTexture = paletteTexture;
        this.quadtree = new Quadtree<number>({ x: 0, y: 0, w: worldWidth, h: worldHeight });

        const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
        this.paletteWidth = Math.min(16384, maxTextureSize);
        this.paletteHeight = Math.max(1, Math.ceil(65536 / this.paletteWidth));
        this.paletteData = new Uint8Array(this.paletteWidth * this.paletteHeight * 4);

        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementBuffer);
        gl.bindTexture(gl.TEXTURE_2D, this.paletteTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA8,
            this.paletteWidth,
            this.paletteHeight,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            this.paletteData,
        );
    }

    public render(
        worldMap: FEWorldMap,
        viewPoint: ViewPoint,
        mutationToken: unknown,
        getProvinceColor: (province: Province) => number,
        lodPrecision: number = 1,
        paletteToken: unknown = mutationToken,
        dirtyPaletteProvinceIds?: ReadonlySet<number>,
    ): WebGL2FrameResult {
        if (this.disposed) {
            throw new Error('Cannot render with a disposed WebGL2Renderer.');
        }
        if (this.currentWorldMap !== worldMap || this.currentMutationToken !== mutationToken) {
            this.rebuild(worldMap, mutationToken);
        }

        const gl = this.gl;
        const lod = Math.max(1, Math.pow(2, Math.round(Math.log2(lodPrecision))));
        let geometry = this.lods.get(lod);
        if (!geometry) {
            // Keep one static geometry tier resident. Holding all three tiers
            // at once can cost more memory than the source province raster.
            for (const oldGeometry of this.lods.values()) {
                gl.deleteBuffer(oldGeometry.vertexBuffer);
            }
            this.lods.clear();
            geometry = this.buildGeometry(lod);
            this.lods.set(lod, geometry);
        }
        if (!geometry) {
            return { visibleProvinceIds: new Set(), drawCalls: 0, indexCount: 0, lod };
        }

        const visibleProvinceIds = this.queryVisible(worldMap, viewPoint);
        let visibleIndexCount = 0;
        for (const provinceId of visibleProvinceIds) {
            const range = geometry.indexRangesByProvince.get(provinceId);
            if (range) {
                visibleIndexCount += range.count;
            }
        }
        const visibleIndices = new Uint32Array(visibleIndexCount);
        let visibleIndexOffset = 0;
        for (const provinceId of visibleProvinceIds) {
            const range = geometry.indexRangesByProvince.get(provinceId);
            if (!range) {
                continue;
            }
            visibleIndices.set(
                geometry.allIndices.subarray(range.start, range.start + range.count),
                visibleIndexOffset,
            );
            visibleIndexOffset += range.count;
        }

        if (this.currentPaletteToken !== paletteToken) {
            this.updatePalette(getProvinceColor, dirtyPaletteProvinceIds);
            this.currentPaletteToken = paletteToken;
        }
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, geometry.vertexBuffer);
        this.configureVertexLayout();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, visibleIndices, gl.DYNAMIC_DRAW);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.paletteTexture);

        this.setUniform2f('u_viewOrigin', viewPoint.x, viewPoint.y);
        this.setUniform2f('u_canvasSize', gl.canvas.width, gl.canvas.height);
        this.setUniform1f('u_scale', viewPoint.scale);
        this.setUniform1f('u_worldWidth', worldMap.width);
        this.setUniform1i('u_palette', 0);
        this.setUniform1i('u_paletteWidth', this.paletteWidth);

        if (visibleIndices.length > 0) {
            // Three instances preserve the horizontally wrapping HOI4 map in
            // one base-map draw call, including at the minimum zoom level.
            gl.drawElementsInstanced(gl.TRIANGLES, visibleIndices.length, gl.UNSIGNED_INT, 0, 3);
        }

        return {
            visibleProvinceIds,
            drawCalls: visibleIndices.length > 0 ? 1 : 0,
            indexCount: visibleIndices.length,
            lod,
        };
    }

    /**
     * Ramer-Douglas-Peucker simplification for repeated line overlays. The
     * base raster uses run rectangles; border and route overlays use paths.
     */
    public static simplifyPath(points: readonly Point[], tolerance: number): Point[] {
        if (points.length <= 2 || tolerance <= 0) {
            return points.slice();
        }
        const toleranceSquared = tolerance * tolerance;
        let furthestIndex = -1;
        let furthestDistance = 0;
        const first = points[0];
        const last = points[points.length - 1];
        for (let index = 1; index < points.length - 1; index++) {
            const distance = distanceToSegmentSquared(points[index], first, last);
            if (distance > furthestDistance) {
                furthestDistance = distance;
                furthestIndex = index;
            }
        }
        if (furthestIndex === -1 || furthestDistance <= toleranceSquared) {
            return [first, last];
        }
        const left = WebGL2Renderer.simplifyPath(points.slice(0, furthestIndex + 1), tolerance);
        const right = WebGL2Renderer.simplifyPath(points.slice(furthestIndex), tolerance);
        return left.slice(0, -1).concat(right);
    }

    public dispose(): void {
        if (this.disposed) {
            return;
        }
        this.disposed = true;
        const gl = this.gl;
        for (const geometry of this.lods.values()) {
            gl.deleteBuffer(geometry.vertexBuffer);
        }
        this.lods.clear();
        this.quadtree.clear();
        gl.deleteBuffer(this.elementBuffer);
        gl.deleteTexture(this.paletteTexture);
        gl.deleteVertexArray(this.vao);
        gl.deleteProgram(this.program);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
    }

    private rebuild(worldMap: FEWorldMap, mutationToken: unknown): void {
        const gl = this.gl;
        for (const geometry of this.lods.values()) {
            gl.deleteBuffer(geometry.vertexBuffer);
        }
        this.lods.clear();
        this.provincesById.clear();
        this.quadtree.clear();
        this.quadtree = new Quadtree<number>({ x: 0, y: 0, w: worldMap.width, h: worldMap.height });

        worldMap.forEachProvince(province => {
            this.provincesById.set(province.id, province);
            this.quadtree.insert({ bounds: province.boundingBox, value: province.id });
        });
        this.currentWorldMap = worldMap;
        this.currentMutationToken = mutationToken;
        this.currentPaletteToken = Symbol('rebuilt-palette');
    }

    private buildGeometry(precision: number): GeometryLod {
        const vertices: number[] = [];
        const indices: number[] = [];
        const indexRangesByProvince = new Map<number, { start: number; count: number }>();
        for (const province of this.provincesById.values()) {
            const start = indices.length;
            for (const zone of province.coverZones) {
                if (precision > 1 && zone.w < precision && ((zone.x % precision) !== 0 || (zone.y % precision) !== 0)) {
                    continue;
                }
                const offset = (precision - 1) / 2;
                const x1 = zone.x - offset;
                const y1 = zone.y - offset;
                const x2 = x1 + Math.max(precision, zone.w);
                const y2 = y1 + (zone.w < precision ? precision : zone.h);
                const vertexStart = vertices.length / FLOATS_PER_VERTEX;
                vertices.push(
                    x1, y1, 0, 0, province.id,
                    x2, y1, 1, 0, province.id,
                    x2, y2, 1, 1, province.id,
                    x1, y2, 0, 1, province.id,
                );
                indices.push(
                    vertexStart, vertexStart + 1, vertexStart + 2,
                    vertexStart, vertexStart + 2, vertexStart + 3,
                );
            }
            indexRangesByProvince.set(province.id, { start, count: indices.length - start });
        }

        const vertexBuffer = this.gl.createBuffer();
        if (!vertexBuffer) {
            throw new Error('Unable to allocate WebGL2 province vertex buffer.');
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
        return { vertexBuffer, allIndices: new Uint32Array(indices), indexRangesByProvince };
    }

    private queryVisible(worldMap: FEWorldMap, viewPoint: ViewPoint): Set<number> {
        const visible = new Set<number>();
        const viewportWidth = this.gl.canvas.width / viewPoint.scale;
        const viewportHeight = this.gl.canvas.height / viewPoint.scale;
        const top = Math.max(0, viewPoint.y);
        const height = Math.min(worldMap.height - top, viewportHeight);
        if (height <= 0) {
            return visible;
        }

        // Split the wrapped horizontal viewport into world-local rectangles.
        let remaining = viewportWidth;
        let x = ((viewPoint.x % worldMap.width) + worldMap.width) % worldMap.width;
        while (remaining > 0) {
            const width = Math.min(remaining, worldMap.width - x);
            const area: Zone = { x, y: top, w: width, h: height };
            for (const provinceId of this.quadtree.query(area)) {
                visible.add(provinceId);
            }
            remaining -= width;
            x = 0;
            if (remaining >= viewportWidth || worldMap.width <= 0) {
                break;
            }
        }
        return visible;
    }

    private updatePalette(
        getProvinceColor: (province: Province) => number,
        dirtyProvinceIds?: ReadonlySet<number>,
    ): void {
        if (dirtyProvinceIds && this.currentPaletteToken !== undefined) {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.paletteTexture);
            for (const provinceId of dirtyProvinceIds) {
                const province = this.provincesById.get(provinceId);
                if (!province || provinceId < 0 || provinceId >= this.paletteWidth * this.paletteHeight) {
                    continue;
                }
                const color = getProvinceColor(province);
                const offset = provinceId * 4;
                this.paletteData[offset] = (color >> 16) & 0xff;
                this.paletteData[offset + 1] = (color >> 8) & 0xff;
                this.paletteData[offset + 2] = color & 0xff;
                this.paletteData[offset + 3] = 0xff;
                this.gl.texSubImage2D(
                    this.gl.TEXTURE_2D,
                    0,
                    provinceId % this.paletteWidth,
                    Math.floor(provinceId / this.paletteWidth),
                    1,
                    1,
                    this.gl.RGBA,
                    this.gl.UNSIGNED_BYTE,
                    this.paletteData.subarray(offset, offset + 4),
                );
            }
            return;
        }
        this.paletteData.fill(0);
        for (const [provinceId, province] of this.provincesById) {
            if (provinceId < 0 || provinceId >= this.paletteWidth * this.paletteHeight) {
                continue;
            }
            const color = getProvinceColor(province);
            const offset = provinceId * 4;
            this.paletteData[offset] = (color >> 16) & 0xff;
            this.paletteData[offset + 1] = (color >> 8) & 0xff;
            this.paletteData[offset + 2] = color & 0xff;
            this.paletteData[offset + 3] = 0xff;
        }
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.paletteTexture);
        this.gl.texSubImage2D(
            this.gl.TEXTURE_2D,
            0,
            0,
            0,
            this.paletteWidth,
            this.paletteHeight,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            this.paletteData,
        );
    }

    private configureVertexLayout(): void {
        const stride = FLOATS_PER_VERTEX * BYTES_PER_FLOAT;
        const position = this.gl.getAttribLocation(this.program, 'a_position');
        const corner = this.gl.getAttribLocation(this.program, 'a_corner');
        const province = this.gl.getAttribLocation(this.program, 'a_province');
        this.gl.enableVertexAttribArray(position);
        this.gl.vertexAttribPointer(position, 2, this.gl.FLOAT, false, stride, POSITION_OFFSET);
        this.gl.enableVertexAttribArray(corner);
        this.gl.vertexAttribPointer(corner, 2, this.gl.FLOAT, false, stride, CORNER_OFFSET);
        this.gl.enableVertexAttribArray(province);
        this.gl.vertexAttribPointer(province, 1, this.gl.FLOAT, false, stride, PROVINCE_OFFSET);
    }

    private createProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
        const vertex = this.compileShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragment = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource);
        const program = this.gl.createProgram();
        if (!program) {
            throw new Error('Unable to allocate WebGL2 shader program.');
        }
        this.gl.attachShader(program, vertex);
        this.gl.attachShader(program, fragment);
        this.gl.linkProgram(program);
        this.gl.deleteShader(vertex);
        this.gl.deleteShader(fragment);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            throw new Error(this.gl.getProgramInfoLog(program) ?? 'Unable to link WebGL2 shader program.');
        }
        return program;
    }

    private compileShader(type: number, source: string): WebGLShader {
        const shader = this.gl.createShader(type);
        if (!shader) {
            throw new Error('Unable to allocate WebGL2 shader.');
        }
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            throw new Error(this.gl.getShaderInfoLog(shader) ?? 'Unable to compile WebGL2 shader.');
        }
        return shader;
    }

    private setUniform1f(name: string, value: number): void {
        this.gl.uniform1f(this.gl.getUniformLocation(this.program, name), value);
    }

    private setUniform1i(name: string, value: number): void {
        this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), value);
    }

    private setUniform2f(name: string, x: number, y: number): void {
        this.gl.uniform2f(this.gl.getUniformLocation(this.program, name), x, y);
    }
}

function distanceToSegmentSquared(point: Point, start: Point, end: Point): number {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    if (dx === 0 && dy === 0) {
        const px = point.x - start.x;
        const py = point.y - start.y;
        return px * px + py * py;
    }
    const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)));
    const nearestX = start.x + t * dx;
    const nearestY = start.y + t * dy;
    const px = point.x - nearestX;
    const py = point.y - nearestY;
    return px * px + py * py;
}

const VERTEX_SHADER = `#version 300 es
precision highp float;
in vec2 a_position;
in vec2 a_corner;
in float a_province;
uniform vec2 u_viewOrigin;
uniform vec2 u_canvasSize;
uniform float u_scale;
uniform float u_worldWidth;
uniform int u_paletteWidth;
flat out ivec2 v_paletteCoordinate;

void main() {
    float wrapOffset = float(gl_InstanceID - 1) * u_worldWidth;
    vec2 screen = (a_position + vec2(wrapOffset, 0.0) - u_viewOrigin) * u_scale;
    screen = mix(floor(screen), ceil(screen), a_corner);
    vec2 clip = vec2(
        screen.x / u_canvasSize.x * 2.0 - 1.0,
        1.0 - screen.y / u_canvasSize.y * 2.0
    );
    gl_Position = vec4(clip, 0.0, 1.0);
    int province = int(a_province + 0.5);
    v_paletteCoordinate = ivec2(province % u_paletteWidth, province / u_paletteWidth);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_palette;
flat in ivec2 v_paletteCoordinate;
out vec4 outColor;

void main() {
    outColor = texelFetch(u_palette, v_paletteCoordinate, 0);
}`;
