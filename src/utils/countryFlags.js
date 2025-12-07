const countryFlags = {
    "Australia": "🇦🇺",
    "China": "🇨🇳",
    "Japan": "🇯🇵",
    "Bahrain": "🇧🇭",
    "Saudi Arabia": "🇸🇦",
    "USA": "🇺🇸",
    "United States": "🇺🇸",
    "Miami": "🇺🇸",
    "Las Vegas": "🇺🇸",
    "Italy": "🇮🇹",
    "Monaco": "🇲🇨",
    "Spain": "🇪🇸",
    "Canada": "🇨🇦",
    "Austria": "🇦🇹",
    "UK": "🇬🇧",
    "Great Britain": "🇬🇧",
    "Belgium": "🇧🇪",
    "Hungary": "🇭🇺",
    "Netherlands": "🇳🇱",
    "Azerbaijan": "🇦🇿",
    "Singapore": "🇸🇬",
    "Mexico": "🇲🇽",
    "Brazil": "🇧🇷",
    "Qatar": "🇶🇦",
    "Abu Dhabi": "🇦🇪",
    "UAE": "🇦🇪",
    "Portugal": "🇵🇹",
    "Argentina": "🇦🇷",
    "Thailand": "🇹🇭",
    "Malaysia": "🇲🇾",
    "Germany": "🇩🇪",
    "France": "🇫🇷",
    "Czech Republic": "🇨🇿",
    "Indonesia": "🇮🇩",
    "India": "🇮🇳"
};

/**
 * Get flag emoji for a country name
 * @param {string} country 
 * @returns {string} Emoji or empty string
 */
function getFlag(country) {
    if (!country) return "";
    // Try exact match
    if (countryFlags[country]) return countryFlags[country];

    // Try partial match or some normalization
    const keys = Object.keys(countryFlags);
    const match = keys.find(key => country.includes(key));
    return match ? countryFlags[match] : "🏁";
}

module.exports = {
    getFlag
};
