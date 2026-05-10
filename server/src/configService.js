const { cleanText } = require('./text');
const { runInTransaction } = require('./transaction');
const configRepository = require('./configRepository');
const {
    SITE_CONFIG_STORAGE_KEYS,
    siteConfigFromRows,
    siteConfigToRows
} = require('@mynav/shared/siteConfig');

async function getLoginPath(db) {
    const user = await configRepository.getLoginPath(db);
    return { login_path: user?.login_path || 'login' };
}

async function getSiteConfig(db) {
    const rows = await configRepository.listConfigRows(db, SITE_CONFIG_STORAGE_KEYS);
    return siteConfigFromRows(rows);
}

async function updateSiteConfig(db, input) {
    await runInTransaction(db, async () => {
        for (const [key, value] of siteConfigToRows(input)) {
            await configRepository.upsertConfig(db, key, cleanText(value));
        }
    });

    return getSiteConfig(db);
}

module.exports = {
    getLoginPath,
    getSiteConfig,
    updateSiteConfig
};
