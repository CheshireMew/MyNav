const { scrapeMetadata } = require('./scraper');

async function test() {
    const testUrls = [
        'https://www.google.com',
        'https://github.com',
        'https://www.baidu.com'
    ];

    for (const url of testUrls) {
        console.log(`Scraping ${url}...`);
        const meta = await scrapeMetadata(url);
        console.log('Result:', meta);
        console.log('---');
    }
}

test();
