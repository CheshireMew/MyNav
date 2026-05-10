const CURRENT_SCHEMA_VERSION = 4;

const SCHEMA_SQL = `
    DROP TABLE IF EXISTS users_next;
    DROP TABLE IF EXISTS categories_next;
    DROP TABLE IF EXISTS links_next;
    DROP TABLE IF EXISTS menu_links_next;
    DROP TABLE IF EXISTS config_next;

    CREATE TABLE users_next (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        token_version INTEGER NOT NULL DEFAULT 0,
        login_path TEXT NOT NULL DEFAULT 'login'
    );

    CREATE TABLE categories_next (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        icon_type TEXT NOT NULL DEFAULT 'none' CHECK (icon_type IN ('none', 'emoji', 'url')),
        icon_value TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
        parent_id INTEGER REFERENCES categories_next(id) ON DELETE CASCADE,
        CHECK (parent_id IS NULL OR parent_id <> id)
    );

    CREATE TABLE links_next (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        icon_type TEXT NOT NULL DEFAULT 'none' CHECK (icon_type IN ('none', 'emoji', 'url')),
        icon_value TEXT NOT NULL DEFAULT '',
        category_id INTEGER NOT NULL REFERENCES categories_next(id) ON DELETE CASCADE,
        tags TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE menu_links_next (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL DEFAULT '',
        url TEXT NOT NULL,
        icon_type TEXT NOT NULL DEFAULT 'none' CHECK (icon_type IN ('none', 'emoji', 'url')),
        icon_value TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE config_next (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL DEFAULT ''
    );
`;

const PROMOTE_SCHEMA_SQL = `
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS categories;
    DROP TABLE IF EXISTS links;
    DROP TABLE IF EXISTS menu_links;
    DROP TABLE IF EXISTS config;

    ALTER TABLE users_next RENAME TO users;
    ALTER TABLE categories_next RENAME TO categories;
    ALTER TABLE links_next RENAME TO links;
    ALTER TABLE menu_links_next RENAME TO menu_links;
    ALTER TABLE config_next RENAME TO config;

    CREATE INDEX idx_categories_parent_sort ON categories(parent_id, sort_order, id);
    CREATE UNIQUE INDEX idx_categories_default ON categories(is_default) WHERE is_default = 1;
    CREATE INDEX idx_links_category_sort ON links(category_id, sort_order, id);
    CREATE INDEX idx_menu_links_sort ON menu_links(sort_order, id);
    PRAGMA user_version = 4;
`;

module.exports = {
    CURRENT_SCHEMA_VERSION,
    SCHEMA_SQL,
    PROMOTE_SCHEMA_SQL
};
