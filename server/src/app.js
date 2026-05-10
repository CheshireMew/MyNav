const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { createAuth } = require('./auth');
const userService = require('./userService');
const configService = require('./configService');
const categoryService = require('./categoryService');
const linkService = require('./linkService');
const menuService = require('./menuService');
const backupService = require('./backupService');
const seoService = require('./seoService');
const { scrapeMetadata } = require('./scraper');
const { httpErrorFrom, unauthorized } = require('./errors');

function createApp(db, options = {}) {
    const app = express();
    const jwtSecret = options.jwtSecret;
    const auth = createAuth(jwtSecret, db);
    const loginLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: '登录尝试次数过多，请15分钟后再试'
    });

    app.use(cors());
    app.use(express.json({ limit: '10mb' }));

    app.post('/api/login', loginLimiter, asyncHandler(async (req, res) => {
        const input = requestBody(req);
        const user = await userService.login(db, input.username, input.password);
        if (!user) throw unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');

        const token = jwt.sign(user, jwtSecret, { expiresIn: '24h' });
        res.json({ token, username: user.username });
    }));

    app.get('/api/config/login-path', asyncHandler(async (req, res) => {
        res.json(await configService.getLoginPath(db));
    }));

    app.get('/api/config/site', asyncHandler(async (req, res) => {
        res.json(await configService.getSiteConfig(db));
    }));

    app.put('/api/config/site', auth, asyncHandler(async (req, res) => {
        res.json(await configService.updateSiteConfig(db, requestBody(req)));
    }));

    app.get('/sitemap.xml', asyncHandler(async (req, res) => {
        res.type('application/xml').send(await seoService.sitemapXml(db, req));
    }));

    app.get('/robots.txt', (req, res) => {
        res.type('text/plain').send(seoService.robotsTxt(req));
    });

    app.get('/api/categories', asyncHandler(async (req, res) => {
        res.json(await categoryService.listCategories(db));
    }));

    app.post('/api/categories', auth, asyncHandler(async (req, res) => {
        res.json(await categoryService.createCategory(db, requestBody(req)));
    }));

    app.put('/api/categories/:id', auth, asyncHandler(async (req, res) => {
        res.json(await categoryService.updateCategory(db, req.params.id, requestBody(req)));
    }));

    app.post('/api/categories/:id/reorder', auth, asyncHandler(async (req, res) => {
        res.json(await categoryService.reorderCategory(db, req.params.id, requestBody(req).direction));
    }));

    app.delete('/api/categories/:id/links', auth, asyncHandler(async (req, res) => {
        res.json(await categoryService.clearCategoryLinks(db, req.params.id));
    }));

    app.delete('/api/categories/:id', auth, asyncHandler(async (req, res) => {
        res.json(await categoryService.deleteCategory(db, req.params.id));
    }));

    app.put('/api/user', auth, asyncHandler(async (req, res) => {
        res.json(await userService.updateUser(db, requestBody(req)));
    }));

    app.post('/api/scrape', auth, asyncHandler(async (req, res) => {
        res.json(await scrapeMetadata(requestBody(req).url));
    }));

    app.get('/api/links', asyncHandler(async (req, res) => {
        res.json(await linkService.listLinks(db, req.query));
    }));

    app.post('/api/links', auth, asyncHandler(async (req, res) => {
        res.json(await linkService.createLink(db, requestBody(req)));
    }));

    app.put('/api/links/:id', auth, asyncHandler(async (req, res) => {
        res.json(await linkService.updateLink(db, req.params.id, requestBody(req)));
    }));

    app.patch('/api/links/:id/move', auth, asyncHandler(async (req, res) => {
        res.json(await linkService.moveLink(db, req.params.id, requestBody(req)));
    }));

    app.delete('/api/links/:id', auth, asyncHandler(async (req, res) => {
        res.json(await linkService.deleteLink(db, req.params.id));
    }));

    app.get('/api/menu-links', asyncHandler(async (req, res) => {
        res.json(await menuService.listMenuLinks(db));
    }));

    app.post('/api/menu-links', auth, asyncHandler(async (req, res) => {
        res.json(await menuService.createMenuLink(db, requestBody(req)));
    }));

    app.put('/api/menu-links/:id', auth, asyncHandler(async (req, res) => {
        res.json(await menuService.updateMenuLink(db, req.params.id, requestBody(req)));
    }));

    app.post('/api/menu-links/:id/reorder', auth, asyncHandler(async (req, res) => {
        res.json(await menuService.reorderMenuLink(db, req.params.id, requestBody(req).direction));
    }));

    app.delete('/api/menu-links/:id', auth, asyncHandler(async (req, res) => {
        res.json(await menuService.deleteMenuLink(db, req.params.id));
    }));

    app.get('/api/backup/export', auth, asyncHandler(async (req, res) => {
        res.json(await backupService.exportData(db));
    }));

    app.post('/api/backup/import', auth, asyncHandler(async (req, res) => {
        res.json(await backupService.importData(db, requestBody(req)));
    }));

    app.use((error, req, res, next) => {
        const httpError = httpErrorFrom(error);
        if (httpError.statusCode >= 500) console.error(error);
        res.status(httpError.statusCode).json({
            error: httpError.message,
            code: httpError.code
        });
    });

    return app;
}

function asyncHandler(handler) {
    return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function requestBody(req) {
    return req.body && typeof req.body === 'object' ? req.body : {};
}

module.exports = { createApp };
