const { listSitemapCategoryIds } = require('./categoryRepository');

async function sitemapXml(db, req) {
    const categories = await listSitemapCategoryIds(db);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const lastmod = new Date().toISOString().split('T')[0];

    const urls = [
        { loc: `${baseUrl}/`, changefreq: 'daily', priority: '1.0' },
        ...categories.map(category => ({
            loc: `${baseUrl}/#cat-${category.id}`,
            changefreq: 'weekly',
            priority: '0.9'
        }))
    ];

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls.map(url => [
            '  <url>',
            `    <loc>${escape(url.loc)}</loc>`,
            `    <lastmod>${lastmod}</lastmod>`,
            `    <changefreq>${url.changefreq}</changefreq>`,
            `    <priority>${url.priority}</priority>`,
            '  </url>'
        ].join('\n')),
        '</urlset>'
    ].join('\n');
}

function robotsTxt(req) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml`;
}

function escape(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

module.exports = {
    sitemapXml,
    robotsTxt
};
