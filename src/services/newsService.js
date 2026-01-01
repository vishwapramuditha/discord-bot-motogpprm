const Parser = require('rss-parser');
const parser = new Parser();

const FEEDS = {
    f1: [
        "https://www.motorsport.com/rss/f1/news/",
        "https://www.autosport.com/rss/feed/f1"
    ],
    motogp: [
        "https://www.motorsport.com/rss/motogp/news/",
        "https://www.autosport.com/rss/feed/motogp"
    ],
    f3: [
        // F3 specific feeds are rarer, using general or searching
        "https://www.motorsport.com/rss/f3/news/"
    ]
};

async function getLatestNews(series = 'f1') {
    try {
        const urls = FEEDS[series] || FEEDS.f1;
        // Fetch from first available feed for now
        const feed = await parser.parseURL(urls[0]);

        // Return top 5 items
        return feed.items.slice(0, 5).map(item => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            contentSnippet: item.contentSnippet,
            creator: item.creator || "Motorsport.com"
        }));
    } catch (error) {
        console.error(`Error fetching news for ${series}:`, error.message);
        return [];
    }
}

module.exports = { getLatestNews };
