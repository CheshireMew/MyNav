const path = require('path');
const { setupSchema } = require('./persistence/migrations');
const { SqliteDatabase } = require('./persistence/sqliteDatabase');

async function setupDb(options = {}) {
    const filename = options.filename || path.join(__dirname, '../database.sqlite');
    const db = new SqliteDatabase(filename);
    await setupSchema(db);
    return db;
}

module.exports = { setupDb };
