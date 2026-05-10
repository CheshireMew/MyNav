async function runInTransaction(db, work) {
    await db.exec('BEGIN IMMEDIATE;');
    try {
        const result = await work();
        await db.exec('COMMIT;');
        return result;
    } catch (error) {
        await db.exec('ROLLBACK;');
        throw error;
    }
}

module.exports = { runInTransaction };
