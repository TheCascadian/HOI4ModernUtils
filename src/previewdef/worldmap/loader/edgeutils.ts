import { Point } from '../definitions';

export function concatEdges(edges: [Point, Point][]): Point[][] {
    const result: Point[][] = [];
    const accessedEdges = new Array<boolean>(edges.length).fill(false);
    const byStart = new Map<string, number[]>();
    const byEnd = new Map<string, number[]>();
    const cursors = new Map<string, number>();
    const pointKey = (point: Point) => `${point.x},${point.y}`;
    const add = (map: Map<string, number[]>, key: string, index: number) => {
        const values = map.get(key);
        if (values) {
            values.push(index);
        } else {
            map.set(key, [index]);
        }
    };
    for (let i = 0; i < edges.length; i++) {
        add(byStart, pointKey(edges[i][0]), i);
        add(byEnd, pointKey(edges[i][1]), i);
    }
    const take = (map: Map<string, number[]>, key: string, cursorPrefix: string): number => {
        const values = map.get(key);
        if (!values) {
            return -1;
        }
        const cursorKey = cursorPrefix + key;
        let cursor = cursors.get(cursorKey) ?? 0;
        while (cursor < values.length && accessedEdges[values[cursor]]) {
            cursor++;
        }
        cursors.set(cursorKey, cursor + 1);
        return cursor < values.length ? values[cursor] : -1;
    };
    for (let i = 0; i < edges.length; i++) {
        if (accessedEdges[i]) {
            continue;
        }

        const edge: Point[] = [edges[i][0], edges[i][1]];
        const prepended: Point[] = [];
        accessedEdges[i] = true;

        let foundNew = true;
        while (foundNew) {
            foundNew = false;
            const head = prepended.length > 0 ? prepended[prepended.length - 1] : edge[0];
            const headTail = take(byEnd, pointKey(head), 'e:');
            if (headTail !== -1) {
                accessedEdges[headTail] = foundNew = true;
                prepended.push(edges[headTail][0]);
            }

            const tailHead = take(byStart, pointKey(edge[edge.length - 1]), 's:');
            if (tailHead !== -1) {
                accessedEdges[tailHead] = foundNew = true;
                edge.push(edges[tailHead][1]);
            }
        }
        const combinedEdge = prepended.length > 0 ? prepended.reverse().concat(edge) : edge;

        const newEdge: Point[] = [];
        let lastPoint: Point = combinedEdge[0];
        for (const point of combinedEdge) {
            if (newEdge.length < 2) {
                newEdge.push(point);
            } else if (point.x === lastPoint.x || point.y === lastPoint.y) {
                newEdge[newEdge.length - 1] = point;
            } else {
                lastPoint = newEdge[newEdge.length - 1];
                newEdge.push(point);
            }
        }
        result.push(newEdge);
    }
    return result;
}
