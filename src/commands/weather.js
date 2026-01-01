const { SlashCommandBuilder } = require("discord.js");
const { getNextRace: getNextF1 } = require("../services/f1Service");
const { getNextMotoGPRace } = require("../services/motogpService");
const { getNextF3Race } = require("../services/f3Service");
const { getCoordinates, getRaceWeather, getWeatherCodeDescription } = require("../services/weatherService");
const { createBaseEmbed } = require("../utils/embedUtils");
const moment = require("moment-timezone");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("weather")
        .setDescription("Get the weather forecast for the upcoming race weekend")
        .addStringOption(option =>
            option.setName("series")
                .setDescription("Choose F1, MotoGP, or F3")
                .setRequired(true)
                .addChoices(
                    { name: "Formula 1", value: "f1" },
                    { name: "MotoGP", value: "motogp" },
                    { name: "Formula 3", value: "f3" }
                )
        ),

    async execute(interaction) {
        await interaction.deferReply();
        const series = interaction.options.getString("series");

        // 1. Get Location and Date of Next Race
        let nextRace = null;
        let locationName = "";
        let coordinates = null;
        let raceDate = null;

        if (series === 'f1') {
            nextRace = await getNextF1();
            if (nextRace) {
                // F1 usually has Location object with lat/long
                if (nextRace.Location) {
                    coordinates = { lat: nextRace.Location.lat, lon: nextRace.Location.long };
                    locationName = `${nextRace.Location.locality}, ${nextRace.Location.country}`;
                }
                raceDate = nextRace.date;
            }
        } else if (series === 'motogp') {
            nextRace = getNextMotoGPRace();
            if (nextRace) {
                locationName = `${nextRace.circuit}, ${nextRace.country}`; // Need to geocode
                raceDate = nextRace.date;
            }
        } else if (series === 'f3') {
            nextRace = getNextF3Race();
            if (nextRace) {
                locationName = `${nextRace.circuit}, ${nextRace.country}`; // Need to geocode
                raceDate = nextRace.date;
            }
        }

        if (!nextRace || !raceDate) {
            return interaction.editReply(`❌ No upcoming ${series.toUpperCase()} races found.`);
        }

        // 2. Geocode if needed
        if (!coordinates) {
            // Remove "Circuit" or similar to get better city match if needed
            // But circuit name + country usually works well with Open-Meteo
            coordinates = await getCoordinates(locationName);
            if (!coordinates) {
                return interaction.editReply(`❌ Could not find location coordinates for **${locationName}**.`);
            }
        }

        // 3. Define Date Range (Fri-Sun)
        // raceDate is usually Sunday. We want Fri, Sat, Sun.
        const rDate = moment(raceDate);
        const endDate = rDate.format("YYYY-MM-DD");
        const startDate = rDate.subtract(2, 'days').format("YYYY-MM-DD");

        // 4. Fetch Weather
        const weather = await getRaceWeather(coordinates.lat, coordinates.lon, startDate, endDate);

        if (!weather || !weather.daily) {
            return interaction.editReply(`❌ Could not retrieve weather data for **${locationName}**.`);
        }

        // 5. Build Embed
        const embed = createBaseEmbed(`Weather Forecast: ${nextRace.name || nextRace.raceName}`)
            .setDescription(`**Location**: ${locationName}\n**Coordinates**: ${coordinates.lat}, ${coordinates.lon}`)
            .setColor(series === 'f1' ? "#FF1801" : series === 'motogp' ? "#000000" : "#151F45");

        const daily = weather.daily;
        // daily.time is array of dates

        let forecastText = "";
        daily.time.forEach((day, index) => {
            const dateStr = moment(day).format("dddd, MMM D");
            const maxTemp = daily.temperature_2m_max[index];
            const minTemp = daily.temperature_2m_min[index];
            const rainProb = daily.precipitation_probability_max[index];
            const condition = getWeatherCodeDescription(daily.weather_code[index]);

            forecastText += `**${dateStr}**\n`;
            forecastText += `🌡️ ${maxTemp}°C / ${minTemp}°C\n`;
            forecastText += `💧 Rain: ${rainProb}%\n`;
            forecastText += `${condition}\n\n`;
        });

        embed.addFields({ name: "3-Day Forecast", value: forecastText });

        await interaction.editReply({ embeds: [embed] });
    }
};
