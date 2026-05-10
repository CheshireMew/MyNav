const { readdirSync, readFileSync, statSync } = require('node:fs');
const { join, relative } = require('node:path');

const rootDir = join(__dirname, '..', '..');
const sourceDirs = ['frontend/src', 'server/src', 'shared'];
const files = sourceDirs.flatMap(dir => listFiles(join(rootDir, dir)))
    .filter(file => /\.(js|jsx|mjs)$/.test(file));

const violations = [];

const checks = [
    {
        name: 'relative shared imports',
        pattern: /\.\.\/\.\.\/(?:\.\.\/)?shared\//,
        allowed: () => false
    },
    {
        name: 'hardcoded default category id',
        pattern: /(\|\|\s*1|===\s*1|category_id:\s*.*\b1\b|categoryIds\.has\(1\))/,
        allowed: file => relative(rootDir, file).replace(/\\/g, '/') === 'server/src/db.js'
    },
    {
        name: 'site config storage keys outside shared contract',
        pattern: /\b(site_name|site_logo|site_description|page_title|page_description|page_icon)\b/,
        allowed: file => relative(rootDir, file).replace(/\\/g, '/') === 'shared/siteConfig.mjs'
    },
    {
        name: 'old MyNav backup version',
        pattern: /MyNav 2\.0|EXPORT_VERSION\s*=\s*['"]2\.0['"]|_mynav_version.*2\.0/,
        allowed: () => false
    },
    {
        name: 'legacy API status inference',
        pattern: /error\.statusCode|\/not found\/i|res\.status\(401|res\.status\(403/,
        allowed: () => false
    },
    {
        name: 'untyped request error in API service',
        pattern: /throw new Error/,
        allowed: file => {
            const rel = relative(rootDir, file).replace(/\\/g, '/');
            return !rel.startsWith('server/src/')
                || [
                    'server/src/categoryRepository.js',
                    'server/src/index.js',
                    'server/src/orderService.js'
                ].includes(rel);
        }
    },
    {
        name: 'JWT verification outside auth boundary',
        pattern: /jwt\.verify/,
        allowed: file => relative(rootDir, file).replace(/\\/g, '/') === 'server/src/auth.js'
    },
    {
        name: 'JWT signing outside login boundary',
        pattern: /jwt\.sign/,
        allowed: file => relative(rootDir, file).replace(/\\/g, '/') === 'server/src/app.js'
    },
    {
        name: 'SQL outside persistence boundary',
        pattern: /\b(SELECT|INSERT INTO|UPDATE|DELETE FROM|PRAGMA|CREATE TABLE|DROP TABLE|ALTER TABLE)\b|db\.(get|all|run|exec)\(/,
        allowed: file => {
            const rel = relative(rootDir, file).replace(/\\/g, '/');
            return rel.endsWith('Repository.js')
                || rel.startsWith('server/src/persistence/')
                || rel === 'server/src/orderService.js'
                || rel === 'server/src/transaction.js';
        }
    },
    {
        name: 'SQLite adapter outside persistence boundary',
        pattern: /DatabaseSync/,
        allowed: file => relative(rootDir, file).replace(/\\/g, '/') === 'server/src/persistence/sqliteDatabase.js'
    }
];

for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const rel = relative(rootDir, file).replace(/\\/g, '/');
    for (const check of checks) {
        if (check.pattern.test(text) && !check.allowed(file)) {
            violations.push(`${rel}: ${check.name}`);
        }
    }
}

for (const removedPath of ['frontend/src/tree.js', 'frontend/src/siteConfig.js']) {
    try {
        statSync(join(rootDir, removedPath));
        violations.push(`${removedPath}: removed frontend domain duplicate still exists`);
    } catch {
        // Expected.
    }
}

if (violations.length > 0) {
    console.error(violations.join('\n'));
    process.exit(1);
}

function listFiles(dir) {
    return readdirSync(dir).flatMap(name => {
        const path = join(dir, name);
        return statSync(path).isDirectory() ? listFiles(path) : [path];
    });
}
