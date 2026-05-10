const { iconColumns } = require('@mynav/shared/icon');
const { mapLink } = require('./mappers');
const { nextSortOrder, normalizeSortOrder, rewriteSortOrder } = require('./orderService');
const { requiredText, cleanText, integerId } = require('./text');
const { runInTransaction } = require('./transaction');
const { getDefaultCategoryId } = require('./categoryRepository');
const { getCategory } = require('./categoryRepository');
const linkRepository = require('./linkRepository');
const { badRequest, notFound } = require('./errors');

async function listLinks(db, filters = {}) {
    const rows = await linkRepository.listLinks(db, filters);
    return rows.map(mapLink);
}

async function createLink(db, input) {
    const url = requiredText(input.url, 'URL is required');
    const categoryId = await normalizeCategoryId(db, input.category_id);
    const [iconType, iconValue] = iconColumns(input.icon);
    const sortOrder = await nextSortOrder(db, 'links', { category_id: categoryId });

    const result = await linkRepository.insertLink(db, {
        url,
        title: cleanText(input.title),
        description: cleanText(input.description),
        iconType,
        iconValue,
        categoryId,
        tags: cleanText(input.tags),
        sortOrder
    });

    return getLink(db, result.lastID);
}

async function updateLink(db, id, input) {
    const linkId = integerId(id, 'Invalid link');
    const link = await getRawLink(db, linkId);
    if (!link) throw notFound('Link not found');

    const categoryId = await normalizeCategoryId(db, input.category_id);
    const [iconType, iconValue] = iconColumns(input.icon);

    await linkRepository.updateLink(db, linkId, {
        url: requiredText(input.url, 'URL is required'),
        title: cleanText(input.title),
        description: cleanText(input.description),
        iconType,
        iconValue,
        categoryId,
        tags: cleanText(input.tags)
    });

    if (categoryId !== link.category_id) {
        await normalizeSortOrder(db, 'links', { category_id: link.category_id });
        await normalizeSortOrder(db, 'links', { category_id: categoryId });
    }

    return getLink(db, linkId);
}

async function deleteLink(db, id) {
    const link = await getRawLink(db, integerId(id, 'Invalid link'));
    if (!link) return { deleted: false };

    await linkRepository.deleteLink(db, link.id);
    await normalizeSortOrder(db, 'links', { category_id: link.category_id });
    return { deleted: true };
}

async function moveLink(db, id, input) {
    const linkId = integerId(id, 'Invalid link');
    const link = await getRawLink(db, linkId);
    if (!link) throw notFound('Link not found');

    const targetLink = input.target_link_id ? await getRawLink(db, integerId(input.target_link_id, 'Invalid target link')) : null;
    if (input.target_link_id && !targetLink) throw notFound('Target link not found');
    const targetCategoryId = input.target_category_id
        ? await normalizeCategoryId(db, input.target_category_id)
        : (targetLink ? targetLink.category_id : link.category_id);

    await runInTransaction(db, async () => {
        await linkRepository.updateLinkCategory(db, linkId, targetCategoryId);

        const targetLinks = await linkRepository.listCategoryLinksExcept(db, targetCategoryId, linkId);

        const targetIndex = targetLink ? targetLinks.findIndex(row => row.id === targetLink.id) : -1;
        const insertAt = targetIndex >= 0 ? targetIndex : targetLinks.length;
        targetLinks.splice(insertAt, 0, { id: linkId });

        await rewriteSortOrder(db, 'links', targetLinks);

        if (link.category_id !== targetCategoryId) {
            await normalizeSortOrder(db, 'links', { category_id: link.category_id });
        }
    });

    return getLink(db, linkId);
}

async function normalizeCategoryId(db, value) {
    const categoryId = value === undefined || value === null || value === ''
        ? await getDefaultCategoryId(db)
        : integerId(value, 'Invalid category');

    const category = await getCategory(db, categoryId);
    if (!category) throw notFound('Category not found');
    return categoryId;
}

async function getLink(db, id) {
    const row = await getRawLink(db, integerId(id, 'Invalid link'));
    if (!row) throw notFound('Link not found');
    return mapLink(row);
}

async function getRawLink(db, id) {
    return linkRepository.getLink(db, id);
}

module.exports = {
    listLinks,
    createLink,
    updateLink,
    deleteLink,
    moveLink
};
