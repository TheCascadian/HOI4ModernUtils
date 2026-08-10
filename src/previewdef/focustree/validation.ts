import type { Focus, FocusTree, FocusWarning } from "./schema";
import { localize } from "../../util/i18n";

/**
 * Structural validation for a parsed focus tree: dangling references, cycles,
 * and layout problems that the parser itself does not catch. Pure function of
 * the tree -- no I/O, no Qt/webview dependency -- so it can run at load time
 * and feed the existing `FocusTree.warnings` list/panel.
 *
 * Duplicate focus IDs and relative_position_id self-reference/cycles are
 * intentionally left where they already are (inline in schema.ts), since
 * that logic is already correct and tested by use; this module adds the
 * rules that were previously entirely missing.
 */
export function validateFocusTree(tree: FocusTree): FocusWarning[] {
    const warnings: FocusWarning[] = [];
    const focuses = tree.focuses;

    validatePrerequisites(focuses, warnings);
    validateMutuallyExclusive(focuses, warnings);
    validatePrerequisiteCycles(focuses, warnings);
    validateCoordinateCollisions(focuses, warnings);
    validateReachability(focuses, warnings);

    return warnings;
}

function navigation(focus: Focus) {
    return focus.token ? [{ file: focus.file, start: focus.token.start, end: focus.token.end }] : undefined;
}

function validatePrerequisites(focuses: Record<string, Focus>, warnings: FocusWarning[]): void {
    for (const focus of Object.values(focuses)) {
        const seen = new Set<string>();
        for (const group of focus.prerequisiteGroups) {
            for (const prereq of group.ids) {
                if (prereq === focus.id) {
                    warnings.push({
                        text: localize('focustree.warnings.prereqself', "Focus {0} lists itself as a prerequisite.", focus.id),
                        source: focus.id,
                        navigations: navigation(focus),
                    });
                } else if (!(prereq in focuses)) {
                    warnings.push({
                        text: localize('focustree.warnings.prereqmissing', "Focus {0} has a prerequisite that does not exist in this tree: {1}.", focus.id, prereq),
                        source: focus.id,
                        navigations: navigation(focus),
                    });
                }

                if (seen.has(prereq)) {
                    warnings.push({
                        text: localize('focustree.warnings.prereqduplicate', "Focus {0} lists prerequisite {1} more than once.", focus.id, prereq),
                        source: focus.id,
                        navigations: navigation(focus),
                    });
                }
                seen.add(prereq);
            }
        }
    }
}

function validateMutuallyExclusive(focuses: Record<string, Focus>, warnings: FocusWarning[]): void {
    for (const focus of Object.values(focuses)) {
        const seen = new Set<string>();
        for (const group of focus.exclusiveGroups) {
            for (const otherId of group.ids) {
                if (otherId === focus.id) {
                    warnings.push({
                        text: localize('focustree.warnings.mutexself', "Focus {0} is mutually exclusive with itself.", focus.id),
                        source: focus.id,
                        navigations: navigation(focus),
                    });
                } else if (!(otherId in focuses)) {
                    warnings.push({
                        text: localize('focustree.warnings.mutexmissing', "Focus {0} is mutually exclusive with a focus that does not exist in this tree: {1}.", focus.id, otherId),
                        source: focus.id,
                        navigations: navigation(focus),
                    });
                } else {
                    const other = focuses[otherId];
                    if (!other.exclusive.includes(focus.id)) {
                        warnings.push({
                            text: localize('focustree.warnings.mutexasymmetric', "Focus {0} excludes {1}, but {1} does not exclude {0} back.", focus.id, otherId),
                            source: focus.id,
                            navigations: navigation(focus),
                        });
                    }
                }

                if (seen.has(otherId)) {
                    warnings.push({
                        text: localize('focustree.warnings.mutexduplicate', "Focus {0} lists mutually exclusive focus {1} more than once.", focus.id, otherId),
                        source: focus.id,
                        navigations: navigation(focus),
                    });
                }
                seen.add(otherId);
            }
        }
    }
}

function validatePrerequisiteCycles(focuses: Record<string, Focus>, warnings: FocusWarning[]): void {
    const graph: Record<string, string[]> = {};
    for (const focus of Object.values(focuses)) {
        graph[focus.id] = focus.prerequisite.flat().filter(p => p in focuses && p !== focus.id);
    }

    for (const cycle of findCycles(graph)) {
        const chain = cycle.concat(cycle[0]).join(' requires ');
        for (const member of cycle) {
            warnings.push({
                text: localize('focustree.warnings.prereqcycle', "Prerequisite cycle, none of these focuses can ever be completed: {0}.", chain),
                source: member,
                navigations: navigation(focuses[member]),
            });
        }
    }
}

function validateCoordinateCollisions(focuses: Record<string, Focus>, warnings: FocusWarning[]): void {
    const occupied = new Map<string, string[]>();

    for (const focus of Object.values(focuses)) {
        const position = resolveBasePosition(focus, focuses, new Set());
        if (!position) {
            // Part of a relative_position_id cycle; already reported by validateRelativePositionId.
            continue;
        }
        // position is already fully resolved to absolute coordinates (relative_position_id
        // chain included), so two focuses at the same key really do overlap on screen
        // regardless of which anchor, if any, each one used to get there.
        const key = `${position.x},${position.y}`;
        const ids = occupied.get(key);
        if (ids) {
            ids.push(focus.id);
        } else {
            occupied.set(key, [focus.id]);
        }
    }

    for (const ids of occupied.values()) {
        if (ids.length < 2) {
            continue;
        }
        const others = ids.join(', ');
        for (const id of ids) {
            warnings.push({
                text: localize('focustree.warnings.coordinatecollision', "{0} focuses share the same position and will render on top of each other: {1}.", ids.length, others),
                source: id,
                navigations: navigation(focuses[id]),
            });
        }
    }
}

/**
 * Resolves a focus's base position (its own x/y plus its relative_position_id
 * chain), ignoring conditional `offset` blocks -- those depend on which
 * scope conditions are selected in the preview, so two focuses that only
 * collide under a particular condition selection are not flagged here.
 * Returns undefined if the chain is circular (already reported elsewhere).
 */
function resolveBasePosition(focus: Focus, focuses: Record<string, Focus>, visiting: Set<string>): { x: number; y: number } | undefined {
    if (focus.relativePositionId === undefined) {
        return { x: focus.x, y: focus.y };
    }
    if (visiting.has(focus.id)) {
        return undefined;
    }
    const anchor = focuses[focus.relativePositionId];
    if (!anchor) {
        return { x: focus.x, y: focus.y };
    }

    visiting.add(focus.id);
    const anchorPosition = resolveBasePosition(anchor, focuses, visiting);
    visiting.delete(focus.id);

    if (!anchorPosition) {
        return undefined;
    }
    return { x: focus.x + anchorPosition.x, y: focus.y + anchorPosition.y };
}

/**
 * Focuses no chain of prerequisites can ever unlock, using the same AND-of-OR
 * semantics the tree already uses elsewhere (`prerequisite: string[][]` is a
 * list of OR-groups that are AND-ed together).
 */
function validateReachability(focuses: Record<string, Focus>, warnings: FocusWarning[]): void {
    const reachable = new Set<string>();
    const all = Object.values(focuses);
    let changed = true;

    while (changed) {
        changed = false;
        for (const focus of all) {
            if (reachable.has(focus.id)) {
                continue;
            }
            const groups = focus.prerequisite.filter(g => g.length > 0);
            if (groups.length === 0 || groups.every(group => group.some(id => reachable.has(id)))) {
                reachable.add(focus.id);
                changed = true;
            }
        }
    }

    const hasRoot = all.some(f => f.prerequisite.every(g => g.length === 0));

    for (const focus of all) {
        if (!reachable.has(focus.id)) {
            warnings.push({
                text: localize('focustree.warnings.unreachable', "Focus {0} can never be reached from any starting focus; check its prerequisites for a missing focus or a cycle.", focus.id),
                source: focus.id,
                navigations: navigation(focus),
            });
        }
    }

    if (all.length > 0 && !hasRoot) {
        warnings.push({
            text: localize('focustree.warnings.noroot', "Every focus in this tree has a prerequisite, so nothing can be taken first."),
            source: '',
        });
    }
}

/**
 * Every elementary cycle in a directed graph, via iterative Tarjan SCC
 * followed by a walk of each non-trivial component. Iterative rather than
 * recursive so a deep prerequisite chain cannot blow the call stack.
 */
function findCycles(graph: Record<string, string[]>): string[][] {
    const nodes = Object.keys(graph).sort();
    const successors = new Map(nodes.map(n => [n, [...new Set(graph[n] ?? [])].sort()]));

    const indexOf = new Map<string, number>();
    const lowLink = new Map<string, number>();
    const onStack = new Map<string, boolean>();
    const stack: string[] = [];
    let counter = 0;
    const components: string[][] = [];

    for (const root of nodes) {
        if (indexOf.has(root)) {
            continue;
        }

        const work: [string, number][] = [[root, 0]];
        indexOf.set(root, counter);
        lowLink.set(root, counter);
        counter++;
        stack.push(root);
        onStack.set(root, true);

        while (work.length > 0) {
            const [node, nextChild] = work[work.length - 1];
            const children = successors.get(node) ?? [];

            if (nextChild < children.length) {
                work[work.length - 1] = [node, nextChild + 1];
                const child = children[nextChild];
                if (!indexOf.has(child)) {
                    indexOf.set(child, counter);
                    lowLink.set(child, counter);
                    counter++;
                    stack.push(child);
                    onStack.set(child, true);
                    work.push([child, 0]);
                } else if (onStack.get(child)) {
                    lowLink.set(node, Math.min(lowLink.get(node)!, indexOf.get(child)!));
                }
                continue;
            }

            work.pop();
            if (work.length > 0) {
                const parent = work[work.length - 1][0];
                lowLink.set(parent, Math.min(lowLink.get(parent)!, lowLink.get(node)!));
            }

            if (lowLink.get(node) === indexOf.get(node)) {
                const component: string[] = [];
                let member: string;
                do {
                    member = stack.pop()!;
                    onStack.set(member, false);
                    component.push(member);
                } while (member !== node);

                if (component.length > 1) {
                    components.push(component.sort());
                } else if ((successors.get(node) ?? []).includes(node)) {
                    components.push([node]);
                }
            }
        }
    }

    const cycles = components.map(component => walkComponent(component, successors));
    cycles.sort((a, b) => a.join() < b.join() ? -1 : a.join() > b.join() ? 1 : 0);
    return cycles;
}

/** One representative elementary cycle through a strongly connected component. */
function walkComponent(component: string[], successors: Map<string, string[]>): string[] {
    const members = new Set(component);
    const start = [...component].sort()[0];
    const path = [start];
    const seen = new Set([start]);
    let current = start;

    while (true) {
        let next: string | undefined;
        for (const candidate of successors.get(current) ?? []) {
            if (!members.has(candidate)) {
                continue;
            }
            if (candidate === start && path.length > 1) {
                return path;
            }
            if (!seen.has(candidate)) {
                next = candidate;
                break;
            }
        }
        if (next === undefined) {
            return path;
        }
        path.push(next);
        seen.add(next);
        current = next;
    }
}
