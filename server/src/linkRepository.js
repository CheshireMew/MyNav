function listLinks(db, filters = {}) {
    const params = [];
    let query = 'SELECT * FROM links WHERE 1 = 1';

    if (filters.category_id) {
        query += ' AND category_id = ?';
        params.push(Number(filters.category_id));
    }

    if (filters.q) {
        const search = `%${filters.q}%`;
        query += ' AND (title LIKE ? OR description LIKE ? OR url LIKE ? OR tags LIKE ?)';
        params.push(search, search, search, search);
    }

    query += filters.q ? ' ORDER BY created_at DESC, id DESC' : ' ORDER BY category_id, sort_order, id';
    return db.all(query, params);
}

function insertLink(db, values) {
    return db.run(
        `INSERT INTO links
         (url, title, description, icon_type, icon_value, category_id, tags, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            values.url,
            values.title,
            values.description,
            values.iconType,
            values.iconValue,
            values.categoryId,
            values.tags,
            values.sortOrder
        ]
    );
}

function updateLink(db, id, values) {
    return db.run(
        `UPDATE links
         SET url = ?, title = ?, description = ?, icon_type = ?, icon_value = ?, category_id = ?, tags = ?
         WHERE id = ?`,
        [
            values.url,
            values.title,
            values.description,
            values.iconType,
            values.iconValue,
            values.categoryId,
            values.tags,
            id
        ]
    );
}

function updateLinkCategory(db, id, categoryId) {
    return db.run('UPDATE links SET category_id = ? WHERE id = ?', [categoryId, id]);
}

function deleteLink(db, id) {
    return db.run('DELETE FROM links WHERE id = ?', [id]);
}

function deleteLinksByCategory(db, categoryId) {
    return db.run('DELETE FROM links WHERE category_id = ?', [categoryId]);
}

function getLink(db, id) {
    return db.get('SELECT * FROM links WHERE id = ?', [id]);
}

function listCategoryLinksExcept(db, categoryId, linkId) {
    return db.all(
        'SELECT * FROM links WHERE category_id = ? AND id <> ? ORDER BY sort_order, id',
        [categoryId, linkId]
    );
}

module.exports = {
    listLinks,
    insertLink,
    updateLink,
    updateLinkCategory,
    deleteLink,
    deleteLinksByCategory,
    getLink,
    listCategoryLinksExcept
};
