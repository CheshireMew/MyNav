function exportRows(db) {
    return {
        categories: db.all('SELECT * FROM categories ORDER BY COALESCE(parent_id, 0), sort_order, id'),
        links: db.all('SELECT * FROM links ORDER BY category_id, sort_order, id'),
        menuLinks: db.all('SELECT * FROM menu_links ORDER BY sort_order, id')
    };
}

function clearSnapshotTables(db) {
    db.run('DELETE FROM links');
    db.run('DELETE FROM menu_links');
    db.run('DELETE FROM categories');
}

function findCategoryByName(db, name) {
    return db.get('SELECT id FROM categories WHERE name = ?', [name]);
}

function insertImportedCategory(db, values) {
    return db.run(
        'INSERT INTO categories (id, name, icon_type, icon_value, parent_id, sort_order, is_default) VALUES (?, ?, ?, ?, NULL, ?, ?)',
        [values.id, values.name, values.iconType, values.iconValue, values.sortOrder, values.isDefault ? 1 : 0]
    );
}

function updateCategoryParent(db, categoryId, parentId) {
    return db.run('UPDATE categories SET parent_id = ? WHERE id = ?', [parentId, categoryId]);
}

function insertImportedLink(db, values) {
    return db.run(
        `INSERT INTO links
         (id, url, title, description, icon_type, icon_value, category_id, tags, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
        [
            values.id,
            values.url,
            values.title,
            values.description,
            values.iconType,
            values.iconValue,
            values.categoryId,
            values.tags,
            values.sortOrder,
            values.createdAt
        ]
    );
}

function insertImportedMenuLink(db, values) {
    return db.run(
        'INSERT INTO menu_links (id, title, url, icon_type, icon_value, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        [values.id, values.title, values.url, values.iconType, values.iconValue, values.sortOrder]
    );
}

function listCategoryIds(db) {
    return db.all('SELECT id FROM categories');
}

function listCategoryScopes(db) {
    return db.all('SELECT DISTINCT parent_id FROM categories');
}

module.exports = {
    exportRows,
    clearSnapshotTables,
    findCategoryByName,
    insertImportedCategory,
    updateCategoryParent,
    insertImportedLink,
    insertImportedMenuLink,
    listCategoryIds,
    listCategoryScopes
};
