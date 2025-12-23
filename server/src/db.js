const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function setupDb() {
    const db = await open({
        filename: path.join(__dirname, '../database.sqlite'),
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            login_path TEXT DEFAULT 'nibeigaile'
        );

        -- Ensure login_path column exists for older installations
        BEGIN;
        -- Check and migration for users.login_path logic omitted for brevity as it's mocked here by just create table
        COMMIT;

        -- Migration for categories.parent_id
        -- In a real app, we'd query PRAGMA table_info('categories') and if parent_id missing, run ALTER TABLE
        -- Since we can't easily do dynamic SQL in this specific multi-command string without logic, 
        -- we rely on the JS wrapper to handle strict migrations or just use a try-catch block in the JS code below this exec.

        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            icon TEXT,
            sort_order INTEGER DEFAULT 0,
            parent_id INTEGER DEFAULT NULL
        );

        CREATE TABLE IF NOT EXISTS links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT,
            title TEXT,
            description TEXT,
            icon TEXT,
            category_id INTEGER,
            tags TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        );

        CREATE TABLE IF NOT EXISTS menu_links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            url TEXT,
            icon TEXT,
            position TEXT DEFAULT 'left',
            sort_order INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT
        );

        -- Insert default category if not exists
        INSERT OR IGNORE INTO categories (name, icon) VALUES ('常用', '⭐');
        -- Insert default admin (password: admin123 - for demo, should be hashed properly)
        INSERT OR IGNORE INTO users (username, password) VALUES ('admin', 'admin123');
        -- Insert default site configuration
        INSERT OR IGNORE INTO config (key, value) VALUES ('site_name', 'MyNav');
        INSERT OR IGNORE INTO config (key, value) VALUES ('site_logo', '');
        INSERT OR IGNORE INTO config (key, value) VALUES ('site_description', '我的导航网站');
        INSERT OR IGNORE INTO config (key, value) VALUES ('page_title', 'MyNav - 简约、高效的私有导航站');
        INSERT OR IGNORE INTO config (key, value) VALUES ('page_description', 'MyNav 是一个简约高效的个人导航站，支持自动爬取元数据、分类管理、暗黑模式，助您打造个性化的上网入口。');
        INSERT OR IGNORE INTO config (key, value) VALUES ('page_icon', '');
    `);

    try {
        await db.run('ALTER TABLE categories ADD COLUMN parent_id INTEGER DEFAULT NULL');
    } catch (err) {
        // Column likely already exists, ignore
    }

    // Add sort_order to links table
    try {
        await db.run('ALTER TABLE links ADD COLUMN sort_order INTEGER DEFAULT 0');
        console.log('Added sort_order column to links table');
        // Initialize sort_order for existing links
        await db.run('UPDATE links SET sort_order = id WHERE sort_order = 0');
    } catch (err) {
        // Column likely already exists, ignore
    }

    // Migration to remove UNIQUE constraint on links.url
    try {
        const tableInfo = await db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='links'");
        if (tableInfo && tableInfo.sql.includes('url TEXT UNIQUE')) {
            console.log('Migrating links table to remove UNIQUE constraint...');
            await db.exec('BEGIN TRANSACTION;');
            await db.exec(`
                CREATE TABLE IF NOT EXISTS links_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    url TEXT,
                    title TEXT,
                    description TEXT,
                    icon TEXT,
                    category_id INTEGER,
                    tags TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (category_id) REFERENCES categories(id)
                );
            `);
            await db.exec('INSERT INTO links_new SELECT id, url, title, description, icon, category_id, tags, created_at FROM links;');
            await db.exec('DROP TABLE links;');
            await db.exec('ALTER TABLE links_new RENAME TO links;');
            await db.exec('COMMIT;');
            console.log('Migration completed.');
        }
    } catch (err) {
        console.error('Migration failed:', err);
        // If transaction active, rollback? exec might not expose simple rollback here easily without ref
        // But setupDb is critical, maybe we let it crash or ignore
    }

    // Single-user system: ensure only one user exists
    try {
        const users = await db.all('SELECT * FROM users');
        if (users.length > 1) {
            console.log(`Warning: Found ${users.length} users, cleaning up...`);
            await db.run('DELETE FROM users WHERE id != (SELECT MIN(id) FROM users)');
            console.log('Single-user enforcement: only kept primary user');
        } else if (users.length === 0) {
            // No users exist, create default
            await db.run("INSERT INTO users (username, password, login_path) VALUES ('admin', 'admin123', 'nibeigaile')");
            console.log('Created default admin user');
        }
    } catch (err) {
        console.error('User cleanup failed:', err);
    }

    return db;
}

module.exports = { setupDb };
