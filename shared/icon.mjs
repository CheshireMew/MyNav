const ICON_TYPES = new Set(['none', 'emoji', 'url']);

export class SharedValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SharedValidationError';
    }
}

export function iconFromText(value) {
    const text = typeof value === 'string' ? value.trim() : '';
    if (!text) return { type: 'none', value: '' };
    if (/^https?:\/\//i.test(text)) return { type: 'url', value: text };
    return { type: 'emoji', value: text };
}

export function normalizeIcon(icon) {
    if (!icon || typeof icon !== 'object') return iconFromText('');

    const type = ICON_TYPES.has(icon.type) ? icon.type : 'none';
    const value = typeof icon.value === 'string' ? icon.value.trim() : '';

    if (type === 'none' || !value) return { type: 'none', value: '' };
    if (type === 'url' && !/^https?:\/\//i.test(value)) {
        throw new SharedValidationError('Icon URL must start with http:// or https://');
    }

    return { type, value };
}

export function iconToText(icon) {
    return normalizeIcon(icon).value;
}

export function fallbackIconForUrl(url) {
    try {
        const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
        return iconFromText(`${new URL(normalizedUrl).origin}/favicon.ico`);
    } catch {
        return { type: 'none', value: '' };
    }
}

export function readIcon(row) {
    return normalizeIcon({ type: row.icon_type, value: row.icon_value });
}

export function iconColumns(icon) {
    const normalized = normalizeIcon(icon);
    return [normalized.type, normalized.value];
}
