const bcrypt = require('bcrypt');
const { DEFAULT_CATEGORY } = require('@mynav/shared/category');
const { iconFromText } = require('@mynav/shared/icon');
const { DEFAULT_SITE_CONFIG, siteConfigToRows } = require('@mynav/shared/siteConfig');
const { sanitizeParentMap } = require('../parentGraph');
const { cleanText, numberOrZero } = require('../text');
const { runInTransaction } = require('../transaction');
const { CURRENT_SCHEMA_VERSION, PROMOTE_SCHEMA_SQL, SCHEMA_SQL } = require('./schema');

async function setupSchema(db) {
    await db.exec('PRAGMA foreign_keys = ON;');

    if (!(await isCurrentSchema(db))) {
        await migrateToCurrentSchema(db);
    }
}

async function isCurrentSchema(db) {
    const version = await db.get('PRAGMA user_version');
    if (version.user_version !== CURRENT_SCHEMA_VERSION) return false;

    return await hasColumns(db, 'links', ['icon_type', 'icon_value', 'sort_order'])
        && await hasColumns(db, 'categories', ['icon_type', 'icon_value', 'parent_id', 'is_default'])
        && await hasColumns(db, 'menu_links', ['icon_type', 'icon_value'])
        && await hasColumns(db, 'users', ['password_hash', 'login_path', 'token_version']);
}

async function hasColumns(db, tableName, columns) {
    const rows = await db.all(`PRAGMA table_info(${tableName})`);
    const names = new Set(rows.map(row => row.name));
    return columns.every(column => names.has(column));
}

async function tableExists(db, tableName) {
    const row = await db.get(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
        [tableName]
    );
    return Boolean(row);
}

async function readTable(db, tableName) {
    if (!(await tableExists(db, tableName))) return [];
    return db.all(`SELECT * FROM ${tableName}`);
}

async function migrateToCurrentSchema(db) {
    const users = await readTable(db, 'users');
    const categories = await readTable(db, 'categories');
    const links = await readTable(db, 'links');
    const menuLinks = await readTable(db, 'menu_links');
    const configs = await readTable(db, 'config');

    await db.exec('PRAGMA foreign_keys = OFF;');
    try {
        await runInTransaction(db, () => {
            db.exec(SCHEMA_SQL);
            insertUser(db, users);
            insertCategories(db, categories);
            insertLinks(db, links);
            insertMenuLinks(db, menuLinks);
            insertConfig(db, configs);
            db.exec(PROMOTE_SCHEMA_SQL);
        });
    } finally {
        await db.exec('PRAGMA foreign_keys = ON;');
    }
}

function insertUser(db, users) {
    const user = users[0] || {};
    const username = cleanText(user.username) || 'admin';
    const passwordSource = user.password_hash || user.password || 'admin123';
    const passwordHash = passwordSource.startsWith('$2') ? passwordSource : bcrypt.hashSync(passwordSource, 10);
    const loginPath = cleanText(user.login_path) || 'login';
    const tokenVersion = numberOrZero(user.token_version);

    db.run(
        'INSERT INTO users_next (id, username, password_hash, token_version, login_path) VALUES (1, ?, ?, ?, ?)',
        [username, passwordHash, tokenVersion, loginPath]
    );
}

function insertCategories(db, categories) {
    const rows = categories.length > 0
        ? categories
        : [DEFAULT_CATEGORY];

    const parentById = sanitizeParentMap(rows, row => row.id, row => row.parent_id);
    const defaultSourceIndex = defaultCategorySourceIndex(rows);
    const usedNames = new Set();

    for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        const rowIcon = row.icon || DEFAULT_CATEGORY.icon;
        const icon = row.icon_type ? { type: row.icon_type, value: row.icon_value } : iconFromText(rowIcon.value || rowIcon);
        const name = uniqueName(cleanText(row.name) || `分类${row.id || usedNames.size + 1}`, usedNames);
        const parentId = parentById.get(Number(row.id)) || null;
        const isDefault = index === defaultSourceIndex ? 1 : 0;

        db.run(
            'INSERT INTO categories_next (id, name, icon_type, icon_value, sort_order, is_default, parent_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [row.id || null, name, icon.type, icon.value, numberOrZero(row.sort_order), isDefault, parentId]
        );
    }
}

function insertLinks(db, links) {
    const categoryRows = db.all('SELECT id, is_default FROM categories_next');
    const categoryIds = new Set(categoryRows.map(row => row.id));
    const fallbackCategory = categoryRows.find(row => row.is_default) || categoryRows[0];
    const fallbackCategoryId = fallbackCategory.id;

    for (let index = 0; index < links.length; index++) {
        const row = links[index];
        if (!cleanText(row.url)) continue;

        const icon = row.icon_type ? { type: row.icon_type, value: row.icon_value } : iconFromText(row.icon);
        const categoryId = categoryIds.has(Number(row.category_id)) ? Number(row.category_id) : fallbackCategoryId;

        db.run(
            `INSERT INTO links_next
             (id, url, title, description, icon_type, icon_value, category_id, tags, sort_order, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
            [
                row.id || null,
                cleanText(row.url),
                cleanText(row.title),
                cleanText(row.description),
                icon.type,
                icon.value,
                categoryId,
                cleanText(row.tags),
                row.sort_order === undefined ? index : numberOrZero(row.sort_order),
                row.created_at || null
            ]
        );
    }
}

function insertMenuLinks(db, menuLinks) {
    for (let index = 0; index < menuLinks.length; index++) {
        const row = menuLinks[index];
        if (!cleanText(row.url)) continue;

        const icon = row.icon_type ? { type: row.icon_type, value: row.icon_value } : iconFromText(row.icon);
        db.run(
            'INSERT INTO menu_links_next (id, title, url, icon_type, icon_value, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
            [
                row.id || null,
                cleanText(row.title),
                cleanText(row.url),
                icon.type,
                icon.value,
                row.sort_order === undefined ? index : numberOrZero(row.sort_order)
            ]
        );
    }
}

function insertConfig(db, configs) {
    const defaults = new Map(siteConfigToRows(DEFAULT_SITE_CONFIG));

    for (const config of configs) {
        if (defaults.has(config.key)) defaults.set(config.key, cleanText(config.value));
    }

    for (const [key, value] of defaults.entries()) {
        db.run('INSERT INTO config_next (key, value) VALUES (?, ?)', [key, value]);
    }
}

function defaultCategorySourceIndex(rows) {
    const markedIndex = rows.findIndex(row => row.is_default);
    if (markedIndex >= 0) return markedIndex;

    let selectedIndex = 0;
    for (let index = 1; index < rows.length; index++) {
        if (numberOrZero(rows[index].sort_order) < numberOrZero(rows[selectedIndex].sort_order)) {
            selectedIndex = index;
        }
    }
    return selectedIndex;
}

function uniqueName(name, usedNames) {
    let candidate = name;
    let suffix = 2;
    while (usedNames.has(candidate)) {
        candidate = `${name} ${suffix}`;
        suffix += 1;
    }
    usedNames.add(candidate);
    return candidate;
}

module.exports = {
    setupSchema
};
