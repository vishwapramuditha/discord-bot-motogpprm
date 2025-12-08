const fs = require('fs');
const path = require('path');
const { AttachmentBuilder } = require('discord.js');

const BANNERS_DIR = path.join(__dirname, '../assets/banners');

/**
 * Get banner attachment for a circuit
 * @param {string} circuitId - Circuit ID from API (e.g., 'bahrain', 'monaco')
 * @returns {AttachmentBuilder|null} - Discord attachment or null if not found
 */
function getCircuitBanner(circuitId) {
    if (!circuitId) return getDefaultBanner();

    // Normalize circuit ID to lowercase
    const normalizedId = circuitId.toLowerCase().replace(/\s+/g, '_');
    const bannerPath = path.join(BANNERS_DIR, `${normalizedId}.png`);

    // Check if specific banner exists
    if (fs.existsSync(bannerPath)) {
        return new AttachmentBuilder(bannerPath, { name: `${normalizedId}.png` });
    }

    // Fallback to default banner
    return getDefaultBanner();
}

/**
 * Get default F1 banner
 * @returns {AttachmentBuilder|null}
 */
function getDefaultBanner() {
    const defaultPath = path.join(BANNERS_DIR, 'default.png');

    if (fs.existsSync(defaultPath)) {
        return new AttachmentBuilder(defaultPath, { name: 'default.png' });
    }

    return null;
}

module.exports = {
    getCircuitBanner,
    getDefaultBanner
};
