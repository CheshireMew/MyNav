function listMenuLinks(db) {
    return db.all('SELECT * FROM menu_links ORDER BY sort_order, id');
}

function insertMenuLink(db, values) {
    return db.run(
        'INSERT INTO menu_links (title, url, icon_type, icon_value, sort_order) VALUES (?, ?, ?, ?, ?)',
        [values.title, values.url, values.iconType, values.iconValue, values.sortOrder]
    );
}

function updateMenuLink(db, id, values) {
    return db.run(
        'UPDATE menu_links SET title = ?, url = ?, icon_type = ?, icon_value = ? WHERE id = ?',
        [values.title, values.url, values.iconType, values.iconValue, id]
    );
}

function deleteMenuLink(db, id) {
    return db.run('DELETE FROM menu_links WHERE id = ?', [id]);
}

function getMenuLink(db, id) {
    return db.get('SELECT * FROM menu_links WHERE id = ?', [id]);
}

module.exports = {
    listMenuLinks,
    insertMenuLink,
    updateMenuLink,
    deleteMenuLink,
    getMenuLink
};
