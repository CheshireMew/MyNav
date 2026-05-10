function getLoginPath(db) {
    return db.get('SELECT login_path FROM users WHERE id = 1');
}

function listConfigRows(db, keys) {
    return db.all(
        `SELECT key, value FROM config WHERE key IN (${keys.map(() => '?').join(', ')})`,
        keys
    );
}

function listAllConfigRows(db) {
    return db.all('SELECT key, value FROM config');
}

function upsertConfig(db, key, value) {
    return db.run(
        'INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        [key, value]
    );
}

module.exports = {
    getLoginPath,
    listConfigRows,
    listAllConfigRows,
    upsertConfig
};
