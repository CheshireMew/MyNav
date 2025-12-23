const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

// Helper function to validate icon URL
async function validateIconUrl(iconUrl) {
    try {
        const response = await axios.head(iconUrl, {
            timeout: 3000,
            validateStatus: (status) => status < 400
        });

        const contentType = response.headers['content-type'] || '';
        // Check if content type is an image
        return contentType.startsWith('image/');
    } catch (error) {
        return false;
    }
}

async function scrapeMetadata(targetUrl) {
    // URL Protocol Auto-completion
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
    }

    try {
        const { data } = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 8000
        });

        const $ = cheerio.load(data);
        const title = $('title').text() || $('meta[property="og:title"]').attr('content') || '';
        const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';

        let icon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href') || $('link[rel="apple-touch-icon"]').attr('href') || '';

        // Handle relative icon URLs
        const parsedUrl = new URL(targetUrl);
        if (icon && !icon.startsWith('http')) {
            icon = new URL(icon, parsedUrl.origin).href;
        }

        // Validate icon URL if found
        if (icon) {
            const isValidIcon = await validateIconUrl(icon);
            if (!isValidIcon) {
                // Fallback to favicon.ico if icon is invalid
                icon = `${parsedUrl.origin}/favicon.ico`;
            }
        } else {
            // Default to favicon.ico if not found
            icon = `${parsedUrl.origin}/favicon.ico`;
        }

        return {
            title: title.trim(),
            description: description.trim(),
            icon: icon
        };
    } catch (error) {
        console.error(`Error scraping ${targetUrl}:`, error.message);

        // Fallback: Extract reasonable defaults from URL
        try {
            const parsedUrl = new URL(targetUrl);
            const hostname = parsedUrl.hostname;

            // Extract title from domain name (e.g., chatgpt.com -> Chatgpt)
            let domainParts = hostname.replace('www.', '').split('.');
            let title = domainParts[0];
            // Capitalize first letter
            title = title.charAt(0).toUpperCase() + title.slice(1);

            // Try site's favicon as fallback
            const faviconUrl = `${parsedUrl.origin}/favicon.ico`;

            return {
                title: title,
                description: targetUrl,
                icon: faviconUrl
            };
        } catch (urlError) {
            // If even URL parsing fails, return empty
            return {
                title: '',
                description: '',
                icon: ''
            };
        }
    }
}

module.exports = { scrapeMetadata };
