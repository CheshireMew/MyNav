function sanitizeParentMap(items, getId, getParentId) {
    const ids = new Set(items.map(item => Number(getId(item))).filter(Boolean));
    const parents = new Map();

    for (const item of items) {
        const id = Number(getId(item));
        const parentId = Number(getParentId(item));
        parents.set(id, ids.has(parentId) && parentId !== id ? parentId : null);
    }

    for (const [id, parentId] of parents.entries()) {
        if (parentId !== null && createsCycle(id, parents)) parents.set(id, null);
    }

    return parents;
}

function createsCycle(id, parents) {
    const seen = new Set([id]);
    let current = parents.get(id);
    while (current !== null && current !== undefined) {
        if (seen.has(current)) return true;
        seen.add(current);
        current = parents.get(current);
    }
    return false;
}

module.exports = {
    sanitizeParentMap
};
