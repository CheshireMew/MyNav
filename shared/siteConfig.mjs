export const SITE_CONFIG_FIELDS = Object.freeze([
    ['siteName', 'site_name', 'MyNav'],
    ['siteLogo', 'site_logo', ''],
    ['siteDescription', 'site_description', '我的导航网站'],
    ['pageTitle', 'page_title', 'MyNav - 简约、高效的私有导航站'],
    ['pageDescription', 'page_description', 'MyNav 是一个简约高效的个人导航站，支持自动爬取元数据、分类管理、暗黑模式，助您打造个性化的上网入口。'],
    ['pageIcon', 'page_icon', '']
]);

export const DEFAULT_SITE_CONFIG = Object.freeze(Object.fromEntries(
    SITE_CONFIG_FIELDS.map(([clientKey, , defaultValue]) => [clientKey, defaultValue])
));

export const SITE_CONFIG_STORAGE_KEYS = Object.freeze(
    SITE_CONFIG_FIELDS.map(([, storageKey]) => storageKey)
);

export function siteConfigFromRows(rows) {
    const values = Object.fromEntries((rows || []).map(row => [row.key, row.value]));
    return Object.fromEntries(
        SITE_CONFIG_FIELDS.map(([clientKey, storageKey, defaultValue]) => [
            clientKey,
            values[storageKey] ?? defaultValue
        ])
    );
}

export function siteConfigToRows(input) {
    return SITE_CONFIG_FIELDS.map(([clientKey, storageKey]) => [
        storageKey,
        cleanConfigValue(input?.[clientKey])
    ]);
}

function cleanConfigValue(value) {
    return typeof value === 'string' ? value.trim() : '';
}
