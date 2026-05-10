const { iconColumns, normalizeIcon } = require('@mynav/shared/icon');
const { mapCategory, mapLink, mapMenuLink } = require('./mappers');
const { nextSortOrder, normalizeSortOrder } = require('./orderService');
const { sanitizeParentMap } = require('./parentGraph');
const { integerId, requiredText } = require('./text');
const { runInTransaction } = require('./transaction');
const { faviconFromUrl, titleFromUrl } = require('@mynav/shared/urlMetadata');
const { getDefaultCategoryId } = require('./categoryRepository');
const { siteConfigFromRows, siteConfigToRows } = require('@mynav/shared/siteConfig');
const { badRequest } = require('./errors');
const backupRepository = require('./backupRepository');
const configRepository = require('./configRepository');

const EXPORT_VERSION = '3.0';

async function exportData(db) {
    const rows = backupRepository.exportRows(db);
    const categories = rows.categories.map(mapCategory);
    const links = rows.links.map(mapLink);
    const menu_links = rows.menuLinks.map(mapMenuLink);
    const siteConfig = siteConfigFromRows(await configRepository.listAllConfigRows(db));

    return {
        _mynav_version: EXPORT_VERSION,
        _mynav_export_time: new Date().toISOString(),
        siteConfig,
        categories,
        links,
        menu_links
    };
}

async function importData(db, data) {
    const payload = normalizeImportPayload(data);
    const categoryMap = new Map();
    let linksAdded = 0;
    let menuLinksAdded = 0;

    await runInTransaction(db, async () => {
        if (payload.source === 'mynav') {
            await backupRepository.clearSnapshotTables(db);
        }

        for (const category of payload.categories) {
            const [iconType, iconValue] = iconColumns(category.icon);
            const existing = payload.source === 'browser'
                ? await backupRepository.findCategoryByName(db, category.name)
                : null;
            if (existing) {
                categoryMap.set(category.id, existing.id);
                continue;
            }

            const result = await backupRepository.insertImportedCategory(db, {
                id: payload.source === 'mynav' ? category.id : null,
                name: category.name,
                iconType,
                iconValue,
                sortOrder: category.sort_order || 0,
                isDefault: category.is_default
            });
            categoryMap.set(category.id, payload.source === 'mynav' ? category.id : result.lastID);
        }

        const parentByImportId = normalizedParentMap(payload.categories);
        for (const category of payload.categories) {
            const importParentId = parentByImportId.get(category.id);
            if (!importParentId) continue;

            const categoryId = categoryMap.get(category.id);
            const parentId = categoryMap.get(importParentId);
            if (categoryId && parentId && categoryId !== parentId) {
                await backupRepository.updateCategoryParent(db, categoryId, parentId);
            }
        }

        for (const link of payload.links) {
            const [iconType, iconValue] = iconColumns(link.icon);
            const categoryId = categoryMap.get(link.category_id) || (
                payload.source === 'browser' ? await getDefaultCategoryId(db) : null
            );
            if (!categoryId) throw badRequest('Backup link references a missing category');
            const sortOrder = await nextSortOrder(db, 'links', { category_id: categoryId });
            await backupRepository.insertImportedLink(db, {
                id: payload.source === 'mynav' ? link.id : null,
                url: link.url,
                title: link.title || '',
                description: link.description || '',
                iconType,
                iconValue,
                categoryId,
                tags: link.tags || '',
                sortOrder: payload.source === 'mynav' ? link.sort_order : sortOrder,
                createdAt: payload.source === 'mynav' ? link.created_at : null
            });
            linksAdded += 1;
        }

        for (const menuLink of payload.menu_links) {
            const [iconType, iconValue] = iconColumns(menuLink.icon);
            const sortOrder = await nextSortOrder(db, 'menu_links');
            await backupRepository.insertImportedMenuLink(db, {
                id: payload.source === 'mynav' ? menuLink.id : null,
                title: menuLink.title || '',
                url: menuLink.url,
                iconType,
                iconValue,
                sortOrder: payload.source === 'mynav' ? menuLink.sort_order : sortOrder
            });
            menuLinksAdded += 1;
        }

        if (payload.siteConfig) {
            for (const [key, value] of siteConfigToRows(payload.siteConfig)) {
                await configRepository.upsertConfig(db, key, value);
            }
        }

        const categoryRows = await backupRepository.listCategoryIds(db);
        for (const row of categoryRows) {
            await normalizeSortOrder(db, 'links', { category_id: row.id });
        }

        const categoryScopes = await backupRepository.listCategoryScopes(db);
        for (const row of categoryScopes) {
            await normalizeSortOrder(db, 'categories', { parent_id: row.parent_id });
        }
    });

    return {
        message: payload.source === 'browser' ? '浏览器书签导入成功' : '数据导入成功',
        stats: {
            categoriesImported: payload.categories.length,
            linksAdded,
            menuLinksAdded
        }
    };
}

function normalizedParentMap(categories) {
    return sanitizeParentMap(categories, category => category.id, category => category.parent_id);
}

function normalizeImportPayload(data) {
    if (data?.roots) return browserBookmarksToDomain(data);
    if (data?._mynav_version === EXPORT_VERSION && data.siteConfig && Array.isArray(data.categories) && Array.isArray(data.links)) {
        const categories = data.categories.map(normalizeCategory);
        if (categories.filter(category => category.is_default).length !== 1) {
            throw badRequest('MyNav backup must contain exactly one default category');
        }

        return {
            source: 'mynav',
            siteConfig: data.siteConfig,
            categories,
            links: data.links.map(normalizeLink),
            menu_links: Array.isArray(data.menu_links) ? data.menu_links.map(normalizeMenuLink) : []
        };
    }

    throw badRequest('无法识别的导入格式');
}

function browserBookmarksToDomain(data) {
    const categories = [];
    const links = [];
    let categoryIdCounter = 1;

    for (const root of Object.values(data.roots || {})) {
        if (root?.children) processChildren(root.children, null);
    }

    function processChildren(children, parentId) {
        for (const item of children) {
            if (item.type === 'folder') {
                const categoryId = categoryIdCounter++;
                categories.push({
                    id: categoryId,
                    name: item.name || `Folder ${categoryId}`,
                    icon: { type: 'emoji', value: '📁' },
                    parent_id: parentId,
                    sort_order: categories.length
                });
                processChildren(item.children || [], categoryId);
            } else if (item.type === 'url' && item.url) {
                const categoryId = parentId || ensureUncategorized();
                links.push({
                    url: item.url,
                    title: item.name || titleFromUrl(item.url),
                    description: item.url,
                    icon: faviconFromUrl(item.url),
                    category_id: categoryId,
                    tags: ''
                });
            }
        }
    }

    function ensureUncategorized() {
        const existing = categories.find(category => category.name === '待分类' && category.parent_id === null);
        if (existing) return existing.id;

        const categoryId = categoryIdCounter++;
        categories.push({
            id: categoryId,
            name: '待分类',
            icon: { type: 'emoji', value: '📌' },
            parent_id: null,
            sort_order: categories.length
        });
        return categoryId;
    }

    return { source: 'browser', siteConfig: null, categories, links, menu_links: [] };
}

function normalizeCategory(category) {
    return {
        id: integerId(category.id, 'Invalid category id'),
        name: requiredText(category.name, 'Category name is required'),
        icon: normalizeIcon(category.icon),
        parent_id: category.parent_id ? integerId(category.parent_id, 'Invalid parent category id') : null,
        sort_order: Number.isFinite(Number(category.sort_order)) ? Number(category.sort_order) : 0,
        is_default: Boolean(category.is_default)
    };
}

function normalizeLink(link) {
    return {
        id: integerId(link.id, 'Invalid link id'),
        url: requiredText(link.url, 'URL is required'),
        title: link.title || '',
        description: link.description || '',
        icon: normalizeIcon(link.icon),
        category_id: link.category_id ? integerId(link.category_id, 'Invalid link category id') : null,
        tags: link.tags || '',
        sort_order: Number.isFinite(Number(link.sort_order)) ? Number(link.sort_order) : 0,
        created_at: link.created_at || null
    };
}

function normalizeMenuLink(link) {
    return {
        id: integerId(link.id, 'Invalid menu link id'),
        title: link.title || '',
        url: requiredText(link.url, 'URL is required'),
        icon: normalizeIcon(link.icon),
        sort_order: Number.isFinite(Number(link.sort_order)) ? Number(link.sort_order) : 0
    };
}

module.exports = {
    exportData,
    importData,
    EXPORT_VERSION
};
