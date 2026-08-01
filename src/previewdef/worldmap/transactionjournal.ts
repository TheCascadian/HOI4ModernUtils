export interface TransactionRollbackFailure extends Error {
    rollbackErrors?: unknown[];
}

/**
 * Apply a set of restore entries and put every completed step back if a later
 * step fails. Callers inject capture/apply so the transaction can cover text,
 * binary files, open documents, and tests without depending on VS Code.
 */
export async function applyEntriesWithRollback<T>(
    entries: readonly T[],
    capture: (entry: T) => Promise<T>,
    apply: (entry: T) => Promise<void>
): Promise<void> {
    const before = await Promise.all(entries.map(entry => capture(entry)));
    const completed: number[] = [];
    let attempted = -1;
    try {
        for (let index = 0; index < entries.length; index++) {
            attempted = index;
            await apply(entries[index]);
            completed.push(index);
        }
    } catch (restoreError) {
        const rollbackErrors: unknown[] = [];
        const rollbackIndexes = attempted >= 0 && !completed.includes(attempted)
            ? [attempted, ...completed.reverse()]
            : completed.reverse();
        for (const index of rollbackIndexes) {
            try {
                await apply(before[index]);
            } catch (rollbackError) {
                rollbackErrors.push(rollbackError);
            }
        }
        if (rollbackErrors.length > 0) {
            const failure = new Error('Transaction failed and rollback was incomplete.') as TransactionRollbackFailure;
            (failure as any).cause = restoreError;
            failure.rollbackErrors = rollbackErrors;
            throw failure;
        }
        throw restoreError;
    }
}
