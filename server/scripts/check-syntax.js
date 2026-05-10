const { readdirSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

const sourceDir = join(__dirname, '..', 'src');
const files = readdirSync(sourceDir)
    .filter(file => file.endsWith('.js'))
    .map(file => join(sourceDir, file));

for (const file of files) {
    const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
    if (result.status !== 0) process.exit(result.status);
}
