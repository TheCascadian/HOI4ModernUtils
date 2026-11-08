import type { ProvinceMergeGroup } from './loader';

interface PlanProvince {
    id: number;
    type: string;
    mass: number;
    edges: ReadonlyArray<{ to: number }>;
}

interface PlanWorld {
    getStateById(stateId: number): { provinces: readonly number[] } | undefined;
    getProvinceById(provinceId: number): PlanProvince | undefined;
    getStrategicRegionByProvinceId(provinceId: number): { id: number } | undefined;
}

/**
 * Plans one merge per connected cluster of same-type provinces that share a
 * state and a strategic region, so no merge moves a province across a state or
 * region boundary and no merged province is split into separate pieces. The
 * largest province of a cluster survives.
 */
export function planStateMergeGroups(world: PlanWorld, stateIds: Iterable<number>): ProvinceMergeGroup[] {
    const groups: ProvinceMergeGroup[] = [];
    for (const stateId of stateIds) {
        const state = world.getStateById(stateId);
        if (!state) {
            continue;
        }
        const buckets = new Map<string, PlanProvince[]>();
        for (const provinceId of state.provinces) {
            const province = world.getProvinceById(provinceId);
            if (!province || province.type !== 'land') {
                continue;
            }
            const key = String(world.getStrategicRegionByProvinceId(provinceId)?.id ?? 0);
            const bucket = buckets.get(key);
            if (bucket) {
                bucket.push(province);
            } else {
                buckets.set(key, [province]);
            }
        }
        for (const bucket of buckets.values()) {
            const members = new Map(bucket.map(province => [province.id, province]));
            const visited = new Set<number>();
            for (const start of bucket) {
                if (visited.has(start.id)) {
                    continue;
                }
                const cluster: PlanProvince[] = [];
                const stack = [start];
                visited.add(start.id);
                while (stack.length > 0) {
                    const current = stack.pop()!;
                    cluster.push(current);
                    for (const edge of current.edges) {
                        const next = members.get(edge.to);
                        if (next && !visited.has(next.id)) {
                            visited.add(next.id);
                            stack.push(next);
                        }
                    }
                }
                if (cluster.length < 2) {
                    continue;
                }
                cluster.sort((a, b) => b.mass - a.mass || a.id - b.id);
                groups.push({
                    targetId: cluster[0].id,
                    sourceIds: cluster.slice(1).map(province => province.id).sort((a, b) => a - b),
                });
            }
        }
    }
    return groups;
}

/** Drops groups that share a province with an earlier group. */
export function dropOverlappingGroups(
    existing: readonly ProvinceMergeGroup[],
    incoming: readonly ProvinceMergeGroup[]
): { accepted: ProvinceMergeGroup[]; skipped: number } {
    const claimed = new Set<number>();
    for (const group of existing) {
        claimed.add(group.targetId);
        group.sourceIds.forEach(id => claimed.add(id));
    }
    const accepted: ProvinceMergeGroup[] = [];
    let skipped = 0;
    for (const group of incoming) {
        const ids = [group.targetId, ...group.sourceIds];
        if (ids.some(id => claimed.has(id))) {
            skipped++;
            continue;
        }
        ids.forEach(id => claimed.add(id));
        accepted.push(group);
    }
    return { accepted, skipped };
}

/**
 * Plans one merge per connected cluster of the given land provinces, ignoring
 * state boundaries. Used for country-wide merging where the states a cluster
 * spans are folded together afterwards. The largest province survives.
 */
export function planClusterMergeGroups(
    world: Pick<PlanWorld, 'getProvinceById'>,
    provinceIds: Iterable<number>
): ProvinceMergeGroup[] {
    const members = new Map<number, PlanProvince>();
    for (const id of provinceIds) {
        const province = world.getProvinceById(id);
        if (province && province.type === 'land') {
            members.set(id, province);
        }
    }
    const groups: ProvinceMergeGroup[] = [];
    const visited = new Set<number>();
    for (const start of members.values()) {
        if (visited.has(start.id)) {
            continue;
        }
        const cluster: PlanProvince[] = [];
        const stack = [start];
        visited.add(start.id);
        while (stack.length > 0) {
            const current = stack.pop()!;
            cluster.push(current);
            for (const edge of current.edges) {
                const next = members.get(edge.to);
                if (next && !visited.has(next.id)) {
                    visited.add(next.id);
                    stack.push(next);
                }
            }
        }
        if (cluster.length < 2) {
            continue;
        }
        cluster.sort((a, b) => b.mass - a.mass || a.id - b.id);
        groups.push({
            targetId: cluster[0].id,
            sourceIds: cluster.slice(1).map(province => province.id).sort((a, b) => a - b),
        });
    }
    return groups;
}
