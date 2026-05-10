const { mkdirSync, mkdtempSync, rmSync } = require('node:fs');
const { join } = require('node:path');
const { setupDb } = require('../src/db');
const { createApp } = require('../src/app');
const backupService = require('../src/backupService');

async function main() {
    const workspaceTmp = join(__dirname, '..', '.test-data');
    mkdirSync(workspaceTmp, { recursive: true });
    const dir = mkdtempSync(join(workspaceTmp, 'run-'));
    try {
        const db = await setupDb({ filename: join(dir, 'database.sqlite') });

        await assertInitialSchema(db);
        await assertBackupRoundTrip(db);
        await assertTokenInvalidation(db);

        db.close();
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

async function assertInitialSchema(db) {
    const version = await db.get('PRAGMA user_version');
    assert(version.user_version === 4, 'schema version should be current');

    const defaults = await db.all('SELECT id FROM categories WHERE is_default = 1');
    assert(defaults.length === 1, 'exactly one default category is required');
}

async function assertBackupRoundTrip(db) {
    const before = await backupService.exportData(db);
    assert(before._mynav_version === '3.0', 'backup version should be current');
    assert(before.siteConfig?.siteName, 'backup should include site config');

    await backupService.importData(db, before);

    const after = await backupService.exportData(db);
    assert(after.categories.length === before.categories.length, 'category count should survive restore');
    assert(after.links.length === before.links.length, 'link count should survive restore');

    const defaults = await db.all('SELECT id FROM categories WHERE is_default = 1');
    assert(defaults.length === 1, 'restore should keep exactly one default category');
}

async function assertTokenInvalidation(db) {
    const app = createApp(db, { jwtSecret: 'test-secret' });
    const server = app.listen(0);
    const base = `http://127.0.0.1:${server.address().port}`;

    try {
        const login = await jsonFetch(`${base}/api/login`, {
            method: 'POST',
            body: { username: 'admin', password: 'admin123' }
        });
        assert(login.response.status === 200, 'login should succeed');

        const token = login.body.token;
        const authorized = await jsonFetch(`${base}/api/backup/export`, { token });
        assert(authorized.response.status === 200, 'token should authorize protected route');

        const update = await jsonFetch(`${base}/api/user`, {
            method: 'PUT',
            token,
            body: { oldPassword: 'admin123', username: 'admin', password: '', login_path: 'login' }
        });
        assert(update.response.status === 200, 'user update should succeed');

        const stale = await jsonFetch(`${base}/api/backup/export`, { token });
        assert(stale.response.status === 401, 'old token should be invalidated');
        assert(stale.body.code === 'INVALID_TOKEN', 'old token should return INVALID_TOKEN');
    } finally {
        server.close();
    }
}

async function jsonFetch(url, options = {}) {
    const headers = {};
    if (options.body) headers['Content-Type'] = 'application/json';
    if (options.token) headers.Authorization = `Bearer ${options.token}`;

    const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
    });
    const body = await response.json();
    return { response, body };
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
