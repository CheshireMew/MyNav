const { iconColumns } = require('@mynav/shared/icon');
const { mapCategory } = require('./mappers');
const { nextSortOrder, normalizeSortOrder, moveByDirection } = require('./orderService');
const { integerId, requiredText } = require('./text');
const categoryRepository = require('./categoryRepository');
const { deleteLinksByCategory } = require('./linkRepository');
const { runInTransaction } = require('./transaction');
const { badRequest, conflict, notFound } = require('./errors');

async function listCategories(db) {
    const rows = await categoryRepository.listCategories(db);
    return rows.map(mapCategory);
}

async function createCategory(db, input) {
    const name = requiredText(input.name, 'Category name is required');
    const [iconType, iconValue] = iconColumns(input.icon);
    const parentId = await normalizeParentId(db, input.parent_id);
    const sortOrder = await nextSortOrder(db, 'categories', { parent_id: parentId });

    const result = await categoryRepository.insertCategory(db, { name, iconType, iconValue, parentId, sortOrder });

    return getCategory(db, result.lastID);
}

async function updateCategory(db, id, input) {
    const categoryId = integerId(id, 'Invalid category');
    const category = await getRawCategory(db, categoryId);
    if (!category) throw notFound('Category not found');

    const name = requiredText(input.name, 'Category name is required');
    const [iconType, iconValue] = iconColumns(input.icon);
    const parentId = await normalizeParentId(db, input.parent_id);

    if (parentId !== null) {
        await assertNotDescendant(db, categoryId, parentId);
    }

    await runInTransaction(db, async () => {
        await categoryRepository.updateCategory(db, categoryId, { name, iconType, iconValue, parentId });

        if (category.parent_id !== parentId) {
            await normalizeSortOrder(db, 'categories', { parent_id: category.parent_id });
        }
        await normalizeSortOrder(db, 'categories', { parent_id: parentId });
    });
    return getCategory(db, categoryId);
}

async function deleteCategory(db, id) {
    const categoryId = integerId(id, 'Invalid category');
    const category = await getRawCategory(db, categoryId);
    if (await categoryRepository.isDefaultCategory(db, categoryId)) {
        throw conflict('Default category cannot be deleted');
    }

    let result;
    await runInTransaction(db, async () => {
        result = await categoryRepository.deleteCategory(db, categoryId);
        if (category) await normalizeSortOrder(db, 'categories', { parent_id: category.parent_id });
    });
    return { deleted: result.changes > 0 };
}

async function clearCategoryLinks(db, id) {
    const result = await deleteLinksByCategory(db, integerId(id, 'Invalid category'));
    return { deleted: result.changes };
}

async function reorderCategory(db, id, direction) {
    const category = await getRawCategory(db, integerId(id, 'Invalid category'));
    if (!category) throw notFound('Category not found');

    const moved = await moveByDirection(db, 'categories', category.id, direction, { parent_id: category.parent_id });
    if (!moved) return mapCategory(category);

    return getCategory(db, category.id);
}

async function normalizeParentId(db, value) {
    if (value === undefined || value === null || value === '') return null;

    const parentId = integerId(value, 'Invalid parent category');

    const parent = await getRawCategory(db, parentId);
    if (!parent) throw notFound('Parent category not found');
    return parentId;
}

async function assertNotDescendant(db, categoryId, parentId) {
    if (categoryId === parentId) throw badRequest('Category cannot be its own parent');

    const descendants = await getDescendantIds(db, categoryId);
    if (descendants.has(parentId)) throw badRequest('Category cannot be moved under its descendant');
}

async function getDescendantIds(db, categoryId) {
    const rows = await categoryRepository.getDescendantRows(db, categoryId);
    return new Set(rows.map(row => row.id));
}

async function getCategory(db, id) {
    const row = await getRawCategory(db, integerId(id, 'Invalid category'));
    if (!row) throw notFound('Category not found');
    return mapCategory(row);
}

async function getRawCategory(db, id) {
    return categoryRepository.getCategory(db, id);
}

module.exports = {
    listCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    clearCategoryLinks,
    reorderCategory,
    getDescendantIds
};
