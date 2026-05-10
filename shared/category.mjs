export const DEFAULT_CATEGORY = Object.freeze({
    name: '常用',
    icon: Object.freeze({ type: 'emoji', value: '⭐' }),
    parent_id: null,
    sort_order: 0,
    is_default: true
});

export function buildCategoryTree(categories) {
    const byId = new Map(categories.map(category => [category.id, { ...category, children: [] }]));
    const roots = [];

    for (const category of byId.values()) {
        const parent = category.parent_id ? byId.get(category.parent_id) : null;
        if (parent) parent.children.push(category);
        else roots.push(category);
    }

    sortTree(roots);
    return roots;
}

export function flattenCategoryTree(categories) {
    const result = [];
    const visit = (items, depth = 0) => {
        for (const item of items) {
            result.push({ ...item, depth });
            visit(item.children || [], depth + 1);
        }
    };
    visit(buildCategoryTree(categories));
    return result;
}

export function hasLinksInTree(category, links) {
    if (links.some(link => link.category_id === category.id)) return true;
    return (category.children || []).some(child => hasLinksInTree(child, links));
}

export function collectDescendantIds(category) {
    const ids = new Set();
    const visit = (item) => {
        for (const child of item.children || []) {
            ids.add(child.id);
            visit(child);
        }
    };
    visit(category);
    return ids;
}

export function defaultCategoryId(categories) {
    return categories.find(category => category.is_default)?.id ?? categories[0]?.id ?? null;
}

function sortTree(items) {
    items.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.id - b.id);
    for (const item of items) sortTree(item.children);
}
