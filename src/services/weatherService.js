const axios = require('axios');
const moment = require('moment-timezone');

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

/**
 * Get coordinates for a location
 * @param {string} locationName (e.g. "Monza, Italy")
 */
async function getCoordinates(locationName) {
    try {
        const response = await axios.get(GEOCODING_URL, {
            params: {
                name: locationName,
                count: 1,
                language: 'en',
                format: 'json'
            }
        });

        if (response.data.results && response.data.results.length > 0) {
            const loc = response.data.results[0];
            return { lat: loc.latitude, lon: loc.longitude, name: loc.name, country: loc.country };
        }
        return null;
    } catch (error) {
        console.error("Error fetching coordinates:", error.message);
        return null;
    }
}

/**
 * Get weather forecast for specific dates
 * @param {number} lat 
 * @param {number} lon 
 * @param {string} startDate (ISO YYYY-MM-DD)
 * @param {string} endDate (ISO YYYY-MM-DD)
 */
async function getRaceWeather(lat, lon, startDate, endDate) {
    try {
        const response = await axios.get(WEATHER_URL, {
            params: {
                latitude: lat,
                longitude: lon,
                daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
                timezone: "auto",
                start_date: startDate,
                end_date: endDate
            }
        });

        return response.data;
    } catch (error) {
        console.error("Error fetching weather:", error.message);
        return null;
    }
}

function getWeatherCodeDescription(code) {
    // WMO Weather interpretation codes (WW)
    const codes = {
        0: "Clear sky ☀️",
        1: "Mainly clear 🌤️",
        2: "Partly cloudy ⛅",
        3: "Overcast ☁️",
        45: "Fog 🌫️", 48: "Depositing rime fog 🌫️",
        51: "Light Drizzle 🌧️", 53: "Moderate Drizzle 🌧️", 55: "Dense Drizzle 🌧️",
        61: "Slight Rain ☔", 63: "Moderate Rain ☔", 65: "Heavy Rain ☔",
        71: "Slight Snow ❄️", 73: "Moderate Snow ❄️", 75: "Heavy Snow ❄️",
        80: "Slight Showers 🌦️", 81: "Moderate Showers 🌦️", 82: "Violent Showers ⛈️",
        95: "Thunderstorm ⚡", 96: "Thunderstorm with Hail ⛈️", 99: "Thunderstorm with Heavy Hail ⛈️"
    };
    return codes[code] || "Unknown Conditions";
}

module.exports = {
    getCoordinates,
    getRaceWeather,
    getWeatherCodeDescription
};
