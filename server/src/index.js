require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const { setupDb } = require('./db');
const { scrapeMetadata } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-this';

app.use(cors());
app.use(express.json());

let db;

// JWT Auth Middleware
const auth = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Login rate limiter: 5 attempts per 15 minutes
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: '登录尝试次数过多，请15分钟后再试'
});

// --- Auth Routes ---
app.post('/api/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if password is hashed or plain (for migration)
        let isValid = false;
        if (user.password.startsWith('$2b$')) {
            // Bcrypt hashed password
            isValid = bcrypt.compareSync(password, user.password);
        } else {
            // Plain text password (migrate it)
            isValid = (password === user.password);
            if (isValid) {
                // Auto-migrate to bcrypt
                const hashedPassword = bcrypt.hashSync(password, 10);
                await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
            }
        }

        if (isValid) {
            const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
            res.json({ token, username: user.username });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.get('/api/config/login-path', async (req, res) => {
    try {
        const user = await db.get('SELECT login_path FROM users LIMIT 1');
        res.json({ login_path: user?.login_path || 'nibeigaile' });
    } catch (err) {
        res.json({ login_path: 'nibeigaile' });
    }
});

// Get site configuration
app.get('/api/config/site', async (req, res) => {
    try {
        const configs = await db.all('SELECT key, value FROM config WHERE key IN (?, ?, ?, ?, ?, ?)',
            ['site_name', 'site_logo', 'site_description', 'page_title', 'page_description', 'page_icon']);
        const siteConfig = {
            siteName: configs.find(c => c.key === 'site_name')?.value || 'MyNav',
            siteLogo: configs.find(c => c.key === 'site_logo')?.value || '',
            siteDescription: configs.find(c => c.key === 'site_description')?.value || '',
            pageTitle: configs.find(c => c.key === 'page_title')?.value || 'MyNav',
            pageDescription: configs.find(c => c.key === 'page_description')?.value || '',
            pageIcon: configs.find(c => c.key === 'page_icon')?.value || ''
        };
        res.json(siteConfig);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update site configuration (admin only)
app.put('/api/config/site', auth, async (req, res) => {
    try {
        const { site_name, site_logo, site_description, page_title, page_description, page_icon } = req.body;
        await db.run('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)', ['site_name', site_name]);
        await db.run('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)', ['site_logo', site_logo]);
        await db.run('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)', ['site_description', site_description]);
        await db.run('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)', ['page_title', page_title]);
        await db.run('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)', ['page_description', page_description]);
        await db.run('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)', ['page_icon', page_icon]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SEO Routes ---
app.get('/sitemap.xml', async (req, res) => {
    try {
        const links = await db.all('SELECT url FROM links');
        const categories = await db.all('SELECT id, name FROM categories');
        const baseUrl = `${req.protocol}://${req.get('host')}`;

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        // Add Homepage
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/</loc>\n`;
        xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
        xml += '    <changefreq>daily</changefreq>\n';
        xml += '    <priority>1.0</priority>\n';
        xml += '  </url>\n';

        // Add category pages
        for (const cat of categories) {
            xml += '  <url>\n';
            xml += `    <loc>${baseUrl}/#cat-${cat.id}</loc>\n`;
            xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
            xml += '    <changefreq>weekly</changefreq>\n';
            xml += '    <priority>0.9</priority>\n';
            xml += '  </url>\n';
        }

        // Add external links
        for (const link of links) {
            xml += '  <url>\n';
            xml += `    <loc>${link.url.startsWith('http') ? link.url : 'http://' + link.url}</loc>\n`;
            xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
            xml += '    <changefreq>monthly</changefreq>\n';
            xml += '    <priority>0.8</priority>\n';
            xml += '  </url>\n';
        }

        xml += '</urlset>';
        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (err) {
        console.error('Sitemap generation error:', err);
        res.status(500).send('Error generating sitemap: ' + err.message);
    }
});

app.get('/robots.txt', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const robotsTxt = `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml`;
    res.header('Content-Type', 'text/plain');
    res.send(robotsTxt);
});

// --- Category Routes ---
app.get('/api/categories', async (req, res) => {
    const categories = await db.all('SELECT * FROM categories ORDER BY sort_order');
    res.json(categories);
});

app.post('/api/categories', auth, async (req, res) => {
    const { name, icon, parent_id, sort_order } = req.body;
    try {
        const result = await db.run('INSERT INTO categories (name, icon, parent_id, sort_order) VALUES (?, ?, ?, ?)', [name, icon, parent_id, sort_order || 0]);
        res.json({ id: result.lastID, name, icon, parent_id, sort_order: sort_order || 0 });
    } catch (err) {
        res.status(400).json({ error: 'Category already exists' });
    }
});

app.put('/api/categories/:id', auth, async (req, res) => {
    const { name, icon, parent_id, sort_order } = req.body;
    try {
        // Build dynamic query to avoid overwriting sort_order if not provided
        // But for simplicity, we assume front-end sends all fields or we fetch first.
        // Actually, frontend current usage sends full object usually.
        // Let's stick to simple update, assuming sort_order is passed or we default to 0 if we were creating, 
        // but here we should probably only update if provided.
        // But to match previous pattern:
        await db.run('UPDATE categories SET name = ?, icon = ?, parent_id = ?, sort_order = COALESCE(?, sort_order) WHERE id = ?', [name, icon, parent_id, sort_order, req.params.id]);
        res.json({ message: 'Updated' });
    } catch (err) {
        res.status(400).json({ error: 'Update failed' });
    }
});

// Clean orphaned categories - MUST be before :id routes
app.post('/api/categories/cleanup-orphans', auth, async (req, res) => {
    try {
        const orphans = await db.all(`
            SELECT c.* FROM categories c
            WHERE c.parent_id IS NOT NULL
            AND NOT EXISTS (SELECT 1 FROM categories p WHERE p.id = c.parent_id)
        `);

        if (orphans.length > 0) {
            const orphanIds = orphans.map(o => o.id);
            const placeholders = orphanIds.map(() => '?').join(',');

            await db.run(`DELETE FROM links WHERE category_id IN (${placeholders})`, orphanIds);
            await db.run(`DELETE FROM categories WHERE id IN (${placeholders})`, orphanIds);

            res.json({ message: 'Cleaned up orphans', count: orphans.length, orphans });
        } else {
            res.json({ message: 'No orphans found', count: 0 });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/categories/:id/links', auth, async (req, res) => {
    try {
        await db.run('DELETE FROM links WHERE category_id = ?', [req.params.id]);
        res.json({ message: 'Links cleared' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to clear links' });
    }
});

app.delete('/api/categories/:id', auth, async (req, res) => {
    try {
        // Enhanced Cascade Delete:
        // 1. Identify all category IDs to delete (the target category + any subcategories)
        const subCats = await db.all('SELECT id FROM categories WHERE parent_id = ?', [req.params.id]);
        const idsToDelete = [req.params.id, ...subCats.map(c => c.id)];

        // 2. Delete all links in these categories
        const placeholders = idsToDelete.map(() => '?').join(',');
        await db.run(`DELETE FROM links WHERE category_id IN (${placeholders})`, idsToDelete);

        // 3. Delete the categories themselves (prevent deleting default id=1)
        const safeIds = idsToDelete.filter(id => id != 1);
        if (safeIds.length > 0) {
            const catPlaceholders = safeIds.map(() => '?').join(',');
            await db.run(`DELETE FROM categories WHERE id IN (${catPlaceholders})`, safeIds);
        }

        res.json({ message: 'Deleted', deletedIds: safeIds });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/user', auth, async (req, res) => {
    const { username, password, oldPassword, login_path } = req.body;
    try {
        // Single-user system: get the only user
        const user = await db.get('SELECT * FROM users LIMIT 1');

        // Verify old password with bcrypt support
        let oldPwdValid = false;
        if (user.password.startsWith('$2b$')) {
            oldPwdValid = bcrypt.compareSync(oldPassword, user.password);
        } else {
            oldPwdValid = (oldPassword === user.password);
        }

        if (!oldPwdValid) {
            return res.status(403).json({ error: '旧密码输入错误' });
        }

        // Direct update for single-user system
        const newUsername = (username && username.trim()) ? username.trim() : user.username;
        const newLoginPath = (login_path && login_path.trim()) ? login_path.trim() : (user.login_path || 'nibeigaile');

        // Hash new password if provided
        let newPassword = user.password;
        if (password && password.trim()) {
            newPassword = bcrypt.hashSync(password.trim(), 10);
        }

        // Update user directly by ID
        await db.run('UPDATE users SET username = ?, password = ?, login_path = ? WHERE id = ?',
            [newUsername, newPassword, newLoginPath, user.id]);

        res.json({ message: 'Profile updated' });
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ error: 'Profile update failed: ' + err.message });
    }
});

// --- Scrape Preview Route ---
app.post('/api/scrape', auth, async (req, res) => {
    const { url } = req.body;
    const metadata = await scrapeMetadata(url);
    res.json(metadata);
});

// --- Link Routes ---
app.get('/api/links', async (req, res) => {
    const { category_id, q } = req.query;
    let query = 'SELECT * FROM links WHERE 1=1';
    const params = [];

    if (category_id) {
        query += ' AND category_id = ?';
        params.push(category_id);
    }
    if (q) {
        query += ' AND (title LIKE ? OR description LIKE ? OR url LIKE ? OR tags LIKE ?)';
        const search = `%${q}%`;
        params.push(search, search, search, search);
    }

    query += ' ORDER BY created_at DESC';

    try {
        const links = await db.all(query, params);
        res.json(links);
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/links', auth, async (req, res) => {
    const { url, title, description, icon, category_id, tags } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const result = await db.run(
            'INSERT INTO links (url, title, description, icon, category_id, tags) VALUES (?, ?, ?, ?, ?, ?)',
            [url, title, description, icon, category_id || 1, tags || '']
        );
        res.json({ id: result.lastID, url, title, description, icon, category_id, tags });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/links/:id', auth, async (req, res) => {
    const { title, description, icon, category_id, tags } = req.body;
    try {
        await db.run(
            'UPDATE links SET title = ?, description = ?, icon = ?, category_id = ?, tags = ? WHERE id = ?',
            [title, description, icon, category_id, tags, req.params.id]
        );
        res.json({ message: 'Updated' });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/links/:id', auth, async (req, res) => {
    try {
        await db.run('DELETE FROM links WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Move link to different category and/or update sort order
app.patch('/api/links/:id/move', auth, async (req, res) => {
    const { category_id, sort_order } = req.body;
    const linkId = req.params.id;

    try {
        // Build dynamic update query
        const updates = [];
        const params = [];

        if (category_id !== undefined) {
            updates.push('category_id = ?');
            params.push(category_id);
        }

        if (sort_order !== undefined) {
            updates.push('sort_order = ?');
            params.push(sort_order);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        params.push(linkId);
        const query = `UPDATE links SET ${updates.join(', ')} WHERE id = ?`;

        await db.run(query, params);
        res.json({ message: 'Link moved successfully' });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- Menu Link Routes ---
app.get('/api/menu-links', async (req, res) => {
    const links = await db.all('SELECT * FROM menu_links ORDER BY sort_order');
    res.json(links);
});

app.post('/api/menu-links', auth, async (req, res) => {
    const { title, url, icon, position, sort_order } = req.body;
    try {
        const result = await db.run(
            'INSERT INTO menu_links (title, url, icon, position, sort_order) VALUES (?, ?, ?, ?, ?)',
            [title, url, icon, position || 'left', sort_order || 0]
        );
        res.json({ id: result.lastID, title, url, icon, position: position || 'left', sort_order: sort_order || 0 });
    } catch (err) {
        res.status(400).json({ error: 'Add failed' });
    }
});

app.put('/api/menu-links/:id', auth, async (req, res) => {
    const { title, url, icon, position, sort_order } = req.body;
    try {
        await db.run(
            'UPDATE menu_links SET title = ?, url = ?, icon = ?, position = ?, sort_order = ? WHERE id = ?',
            [title, url, icon, position, sort_order, req.params.id]
        );
        res.json({ message: 'Updated' });
    } catch (err) {
        res.status(400).json({ error: 'Update failed' });
    }
});

app.delete('/api/menu-links/:id', auth, async (req, res) => {
    try {
        await db.run('DELETE FROM menu_links WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Data Import/Export Routes ---
app.get('/api/backup/export', auth, async (req, res) => {
    try {
        const categories = await db.all('SELECT * FROM categories');
        const links = await db.all('SELECT * FROM links');
        const menu_links = await db.all('SELECT * FROM menu_links');
        res.json({
            _mynav_version: '1.0',
            _mynav_export_time: new Date().toISOString(),
            categories,
            links,
            menu_links
        });
    } catch (err) {
        res.status(500).json({ error: 'Export failed' });
    }
});

app.post('/api/backup/import', auth, async (req, res) => {
    const data = req.body;

    // Detect import format
    const isMyNavFormat = data._mynav_version !== undefined || (data.categories && data.links);
    const isBrowserBookmarks = data.roots !== undefined;

    let categories, links, menu_links;

    try {
        if (isBrowserBookmarks) {
            // Parse browser bookmarks
            const parsed = parseBrowserBookmarks(data);
            categories = parsed.categories;
            links = parsed.links;
            menu_links = [];
        } else if (isMyNavFormat) {
            categories = data.categories || [];
            links = data.links || [];
            menu_links = data.menu_links || [];
        } else {
            return res.status(400).json({ error: '无法识别的导入格式' });
        }

        await db.run('BEGIN TRANSACTION');

        // Map old category IDs to new/existing ones
        const categoryMap = {};

        // Step 1: Create/find all categories first (without parent_id)
        for (const cat of categories) {
            let existing = await db.get('SELECT id FROM categories WHERE name = ?', [cat.name]);
            if (existing) {
                categoryMap[cat.id] = existing.id;
            } else {
                const result = await db.run('INSERT INTO categories (name, icon, sort_order, parent_id) VALUES (?, ?, ?, ?)',
                    [cat.name, cat.icon || '', cat.sort_order || 0, null]); // parent_id set to null first
                categoryMap[cat.id] = result.lastID;
            }
        }

        // Step 2: Update parent_id with mapped IDs
        for (const cat of categories) {
            if (cat.parent_id) {
                const mappedParentId = categoryMap[cat.parent_id];
                const mappedCatId = categoryMap[cat.id];
                if (mappedParentId && mappedCatId) {
                    await db.run('UPDATE categories SET parent_id = ? WHERE id = ?', [mappedParentId, mappedCatId]);
                }
            }
        }

        // Import links with URL deduplication and merging
        let addedCount = 0;
        let mergedCount = 0;

        for (const link of links) {
            const newCatId = categoryMap[link.category_id] || 1;

            // Check if URL already exists
            const existing = await db.get('SELECT * FROM links WHERE url = ?', [link.url]);

            if (existing) {
                // Merge: update info but keep existing category
                await db.run(
                    'UPDATE links SET title = ?, description = ?, icon = ? WHERE id = ?',
                    [
                        link.title || existing.title,
                        link.description || existing.description,
                        link.icon || existing.icon,
                        existing.id
                    ]
                );
                mergedCount++;
            } else {
                // Insert new link
                await db.run(
                    'INSERT INTO links (url, title, description, icon, category_id, tags) VALUES (?, ?, ?, ?, ?, ?)',
                    [link.url, link.title, link.description, link.icon, newCatId, link.tags || '']
                );
                addedCount++;
            }
        }

        // Merge menu links (based on Title + URL)
        if (menu_links && menu_links.length > 0) {
            for (const m of menu_links) {
                const existing = await db.get('SELECT id FROM menu_links WHERE title = ? AND url = ?', [m.title, m.url]);
                if (!existing) {
                    await db.run(
                        'INSERT INTO menu_links (title, url, icon, position, sort_order) VALUES (?, ?, ?, ?, ?)',
                        [m.title, m.url, m.icon, m.position || 'left', m.sort_order || 0]
                    );
                }
            }
        }

        await db.run('COMMIT');
        res.json({
            message: isBrowserBookmarks ? '浏览器书签导入成功' : '数据已智能合并导入',
            stats: {
                categoriesImported: categories.length,
                linksAdded: addedCount,
                linksMerged: mergedCount
            }
        });
    } catch (err) {
        if (db) await db.run('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: '导入失败: ' + err.message });
    }
});

// Helper function to parse browser bookmarks (Chrome/Edge format)
function parseBrowserBookmarks(data) {
    const categories = [];
    const links = [];
    let categoryIdCounter = 10000; // Start from high number to avoid conflicts

    // Create "待分类" category for uncategorized bookmarks
    const uncategorizedCatId = categoryIdCounter++;
    categories.push({
        id: uncategorizedCatId,
        name: '待分类',
        icon: '📌',
        parent_id: null,
        sort_order: 9999
    });

    // Process bookmark_bar (main bookmarks)
    if (data.roots && data.roots.bookmark_bar && data.roots.bookmark_bar.children) {
        processBookmarkChildren(data.roots.bookmark_bar.children, null);
    }

    function processBookmarkChildren(children, parentCatId) {
        for (const item of children) {
            if (item.type === 'folder') {
                // Create category for folder
                const catId = categoryIdCounter++;

                categories.push({
                    id: catId,
                    name: item.name,
                    icon: '📁',
                    parent_id: parentCatId, // Keep parent relationship for nested folders
                    sort_order: categories.length
                });

                // Process folder's children recursively
                if (item.children) {
                    processBookmarkChildren(item.children, catId);
                }
            } else if (item.type === 'url' && item.url) {
                // Add link to parent category or uncategorized
                const targetCatId = parentCatId || uncategorizedCatId;

                // Extract favicon URL
                let faviconUrl = '';
                try {
                    const urlObj = new URL(item.url);
                    faviconUrl = `${urlObj.origin}/favicon.ico`;
                } catch (e) {
                    faviconUrl = '';
                }

                links.push({
                    id: links.length + 1,
                    url: item.url,
                    title: item.name || extractTitleFromURL(item.url),
                    description: item.url,
                    icon: faviconUrl,
                    category_id: targetCatId,
                    tags: ''
                });
            }
        }
    }

    function extractTitleFromURL(url) {
        try {
            const hostname = new URL(url).hostname.replace('www.', '');
            const name = hostname.split('.')[0];
            return name.charAt(0).toUpperCase() + name.slice(1);
        } catch {
            return 'Link';
        }
    }

    return { categories, links };
}

async function start() {
    db = await setupDb();

    // Explicitly check for login_path column in case migration failed
    try {
        await db.run('ALTER TABLE users ADD COLUMN login_path TEXT DEFAULT "nibeigaile"');
    } catch (e) {
        // Column likely exists
    }

    // Ensure menu_links has position column
    try {
        await db.run('ALTER TABLE menu_links ADD COLUMN position TEXT DEFAULT "left"');
    } catch (e) {
        // Column likely exists
    }

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

start();
