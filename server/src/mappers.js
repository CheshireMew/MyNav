const { readIcon } = require('@mynav/shared/icon');

function mapCategory(row) {
    return {
        id: row.id,
        name: row.name,
        icon: readIcon(row),
        sort_order: row.sort_order,
        parent_id: row.parent_id,
        is_default: Boolean(row.is_default)
    };
}

function mapLink(row) {
    return {
        id: row.id,
        url: row.url,
        title: row.title,
        description: row.description,
        icon: readIcon(row),
        category_id: row.category_id,
        tags: row.tags,
        sort_order: row.sort_order,
        created_at: row.created_at
    };
}

function mapMenuLink(row) {
    return {
        id: row.id,
        title: row.title,
        url: row.url,
        icon: readIcon(row),
        sort_order: row.sort_order
    };
}

module.exports = {
    mapCategory,
    mapLink,
    mapMenuLink
};
