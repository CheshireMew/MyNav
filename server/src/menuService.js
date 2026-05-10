const { iconColumns } = require('@mynav/shared/icon');
const { mapMenuLink } = require('./mappers');
const { nextSortOrder, normalizeSortOrder, moveByDirection } = require('./orderService');
const { requiredText, cleanText, integerId } = require('./text');
const { notFound } = require('./errors');
const menuRepository = require('./menuRepository');

async function listMenuLinks(db) {
    const rows = await menuRepository.listMenuLinks(db);
    return rows.map(mapMenuLink);
}

async function createMenuLink(db, input) {
    const [iconType, iconValue] = iconColumns(input.icon);
    const result = await menuRepository.insertMenuLink(db, {
        title: cleanText(input.title),
        url: requiredText(input.url, 'URL is required'),
        iconType,
        iconValue,
        sortOrder: await nextSortOrder(db, 'menu_links')
    });

    return getMenuLink(db, result.lastID);
}

async function updateMenuLink(db, id, input) {
    const [iconType, iconValue] = iconColumns(input.icon);
    await menuRepository.updateMenuLink(db, integerId(id, 'Invalid menu link'), {
        title: cleanText(input.title),
        url: requiredText(input.url, 'URL is required'),
        iconType,
        iconValue
    });

    return getMenuLink(db, id);
}

async function deleteMenuLink(db, id) {
    const result = await menuRepository.deleteMenuLink(db, integerId(id, 'Invalid menu link'));
    await normalizeSortOrder(db, 'menu_links');
    return { deleted: result.changes > 0 };
}

async function reorderMenuLink(db, id, direction) {
    const moved = await moveByDirection(db, 'menu_links', id, direction);
    if (!moved) return getMenuLink(db, id);

    return getMenuLink(db, id);
}

async function getMenuLink(db, id) {
    const row = await menuRepository.getMenuLink(db, integerId(id, 'Invalid menu link'));
    if (!row) throw notFound('Menu link not found');
    return mapMenuLink(row);
}

module.exports = {
    listMenuLinks,
    createMenuLink,
    updateMenuLink,
    deleteMenuLink,
    reorderMenuLink
};
