const Parser = require('rss-parser');
const parser = new Parser();

const FEEDS = {
    f1: 'https://www.motorsport.com/rss/f1/news/',
    motogp: 'https://www.motorsport.com/rss/motogp/news/'
};

async function getLatestNews(series = 'f1') {
    try {
        const url = FEEDS[series] || FEEDS.f1;
        const feed = await parser.parseURL(url);
        return feed.items.slice(0, 5); // Return top 5 news
    } catch (error) {
        console.error(`Error fetching ${series} news:`, error);
        return [];
    }
}

module.exports = {
    getLatestNews
};
