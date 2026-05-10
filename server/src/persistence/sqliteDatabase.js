const { DatabaseSync } = require('node:sqlite');

class SqliteDatabase {
    constructor(filename) {
        this.database = new DatabaseSync(filename);
    }

    exec(sql) {
        this.database.exec(sql);
    }

    run(sql, params = []) {
        const result = this.database.prepare(sql).run(...params);
        return {
            changes: result.changes,
            lastID: Number(result.lastInsertRowid)
        };
    }

    get(sql, params = []) {
        return this.database.prepare(sql).get(...params);
    }

    all(sql, params = []) {
        return this.database.prepare(sql).all(...params);
    }

    close() {
        this.database.close();
    }
}

module.exports = { SqliteDatabase };
