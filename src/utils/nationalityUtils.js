const NATIONALITY_MAP = {
    "British": "🇬🇧",
    "Dutch": "🇳🇱",
    "Monegasque": "🇲🇨",
    "Spanish": "🇪🇸",
    "Australian": "🇦🇺",
    "Mexican": "🇲🇽",
    "French": "🇫🇷",
    "German": "🇩🇪",
    "American": "🇺🇸",
    "Finnish": "🇫🇮",
    "Canadian": "🇨🇦",
    "Japanese": "🇯🇵",
    "Thai": "🇹🇭",
    "Chinese": "🇨🇳",
    "Italian": "🇮🇹",
    "Danish": "🇩🇰",
    "Swiss": "🇨🇭",
    "Austrian": "🇦🇹",
    "New Zealander": "🇳🇿",
    "Brazilian": "🇧🇷",
    "Argentine": "🇦🇷",
    "Polish": "🇵🇱",
    "Russian": "🇷🇺",
    "Belgian": "🇧🇪",
    "Swedish": "🇸🇪",
    "Venezuelan": "🇻🇪",
    "Indonesian": "🇮🇩",
    "Portuguese": "🇵🇹",
    "Hungarian": "🇭🇺",
    "Irish": "🇮🇪",
    "Indian": "🇮🇳",
    "South African": "🇿🇦",
    "Colombian": "🇨🇴",
    "Malaysian": "🇲🇾",
    "Chilean": "🇨🇱"
};

function getFlag(nationality) {
    return NATIONALITY_MAP[nationality] || "🏳️";
}

module.exports = {
    getFlag
};
