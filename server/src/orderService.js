const { runInTransaction } = require('./transaction');
const { badRequest } = require('./errors');
const { integerId } = require('./text');

function assertIdentifier(value) {
    if (!/^[a-z_][a-z0-9_]*$/i.test(value)) {
        throw new Error(`Invalid SQL identifier: ${value}`);
    }
    return value;
}

function scopedWhere(scope) {
    const clauses = [];
    const params = [];

    for (const [column, value] of Object.entries(scope)) {
        assertIdentifier(column);
        if (value === null) {
            clauses.push(`${column} IS NULL`);
        } else {
            clauses.push(`${column} = ?`);
            params.push(value);
        }
    }

    return {
        sql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
        params
    };
}

async function nextSortOrder(db, table, scope = {}) {
    assertIdentifier(table);
    const where = scopedWhere(scope);
    const row = await db.get(
        `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM ${table} ${where.sql}`,
        where.params
    );
    return row.next_order;
}

async function normalizeSortOrder(db, table, scope = {}) {
    const rows = await orderedRows(db, table, scope);
    await rewriteSortOrder(db, table, rows);
}

async function moveByDirection(db, table, id, direction, scope = {}) {
    if (direction !== 'up' && direction !== 'down') {
        throw badRequest('Invalid sort direction');
    }

    return runInTransaction(db, async () => {
        const rows = await orderedRows(db, table, scope);
        const rowId = integerId(id);
        const index = rows.findIndex(row => row.id === rowId);
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (index < 0 || targetIndex < 0 || targetIndex >= rows.length) return false;

        [rows[index], rows[targetIndex]] = [rows[targetIndex], rows[index]];
        await rewriteSortOrder(db, table, rows);
        return true;
    });
}

async function orderedRows(db, table, scope = {}) {
    assertIdentifier(table);
    const where = scopedWhere(scope);
    return db.all(
        `SELECT id FROM ${table} ${where.sql} ORDER BY sort_order, id`,
        where.params
    );
}

async function rewriteSortOrder(db, table, rows) {
    assertIdentifier(table);
    for (let index = 0; index < rows.length; index++) {
        await db.run(`UPDATE ${table} SET sort_order = ? WHERE id = ?`, [index, rows[index].id]);
    }
}

module.exports = {
    nextSortOrder,
    normalizeSortOrder,
    moveByDirection,
    rewriteSortOrder
};
