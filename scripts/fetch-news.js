const fs = require('fs');
const Parser = require('rss-parser');
const parser = new Parser();

const RSS_FEEDS = [
    { name: 'Protidiner Sangbad', url: 'https://www.protidinersangbad.com/rss.xml' },
    { name: 'Bangladesh Guardian', url: 'https://bangladeshguardian.com/rss.xml' }
];

// Exact matching strings for your byline
const BYLINE_PATTERNS = [
    'তুহিন আহমদ, সিলেট',
    'তুহিন আহমদ (সিলেট)',
    'তুহিন আহমদ, মহানগর (সিলেট)'
];

const FILE_PATH = './stories.json';

async function run() {
    let existingArticles = [];

    // Read current archive file
    if (fs.existsSync(FILE_PATH)) {
        try {
            existingArticles = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
        } catch (e) {
            existingArticles = [];
        }
    }

    const existingLinks = new Set(existingArticles.map(a => a.link));
    let newArticlesCount = 0;

    for (const feedObj of RSS_FEEDS) {
        try {
            const feed = await parser.parseURL(feedObj.url);
            
            feed.items.forEach(item => {
                const combinedText = `${item.title || ''} ${item.contentSnippet || ''} ${item.content || ''} ${item.creator || ''}`;
                
                // Check if text matches the exact byline string
                const isBylineMatch = BYLINE_PATTERNS.some(pattern => combinedText.includes(pattern));

                if (isBylineMatch && !existingLinks.has(item.link)) {
                    existingArticles.push({
                        title: item.title,
                        link: item.link,
                        pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                        source: feedObj.name,
                        description: (item.contentSnippet || item.title).slice(0, 180) + '...'
                    });
                    existingLinks.add(item.link);
                    newArticlesCount++;
                }
            });
        } catch (err) {
            console.error(`Error processing feed ${feedObj.name}:`, err.message);
        }
    }

    if (newArticlesCount > 0) {
        // Sort newest first
        existingArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
        fs.writeFileSync(FILE_PATH, JSON.stringify(existingArticles, null, 2));
        console.log(`Successfully added ${newArticlesCount} new story(ies) under byline "তুহিন আহমদ, সিলেট".`);
    } else {
        console.log('No new byline stories found in current RSS feeds.');
    }
}

run();
