import { fallbackIconForUrl } from './icon.mjs';

export function faviconFromUrl(url) {
    return fallbackIconForUrl(url);
}

export function titleFromUrl(url) {
    try {
        const name = new URL(url).hostname.replace(/^www\./, '').split('.')[0];
        return name.charAt(0).toUpperCase() + name.slice(1);
    } catch {
        return 'Link';
    }
}
