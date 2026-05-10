function listCategories(db) {
    return db.all('SELECT * FROM categories ORDER BY COALESCE(parent_id, 0), sort_order, id');
}

function listSitemapCategoryIds(db) {
    return db.all('SELECT id FROM categories ORDER BY sort_order, id');
}

function insertCategory(db, values) {
    return db.run(
        'INSERT INTO categories (name, icon_type, icon_value, parent_id, sort_order) VALUES (?, ?, ?, ?, ?)',
        [values.name, values.iconType, values.iconValue, values.parentId, values.sortOrder]
    );
}

function updateCategory(db, id, values) {
    return db.run(
        'UPDATE categories SET name = ?, icon_type = ?, icon_value = ?, parent_id = ? WHERE id = ?',
        [values.name, values.iconType, values.iconValue, values.parentId, id]
    );
}

function deleteCategory(db, id) {
    return db.run('DELETE FROM categories WHERE id = ?', [id]);
}

function getCategory(db, id) {
    return db.get('SELECT * FROM categories WHERE id = ?', [id]);
}

function getDefaultCategoryId(db) {
    const category = db.get('SELECT id FROM categories WHERE is_default = 1');
    if (!category) throw new Error('Default category not found');
    return category.id;
}

function isDefaultCategory(db, id) {
    const category = getCategory(db, Number(id));
    return Boolean(category?.is_default);
}

function getDescendantRows(db, categoryId) {
    return db.all(
        `WITH RECURSIVE descendants(id) AS (
            SELECT id FROM categories WHERE parent_id = ?
            UNION ALL
            SELECT c.id FROM categories c JOIN descendants d ON c.parent_id = d.id
        )
        SELECT id FROM descendants`,
        [categoryId]
    );
}

module.exports = {
    listCategories,
    listSitemapCategoryIds,
    insertCategory,
    updateCategory,
    deleteCategory,
    getCategory,
    getDefaultCategoryId,
    isDefaultCategory,
    getDescendantRows
};
