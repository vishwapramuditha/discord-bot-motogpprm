const { SlashCommandBuilder } = require("discord.js");
const { createBaseEmbed } = require("../utils/embedUtils");
const moment = require("moment-timezone");

const TIMEZONES = [
    { name: "UTC", value: "UTC" },
    { name: "UK (GMT/BST)", value: "Europe/London" },
    { name: "Central Europe (CET/CEST)", value: "Europe/Paris" },
    { name: "US Eastern (ET)", value: "America/New_York" },
    { name: "US Pacific (PT)", value: "America/Los_Angeles" },
    { name: "Japan (JST)", value: "Asia/Tokyo" },
    { name: "Australia (AEST)", value: "Australia/Sydney" },
    { name: "Sri Lanka (IST)", value: "Asia/Colombo" }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("convert")
        .setDescription("Convert a time between timezones")
        .addStringOption(option =>
            option.setName("time")
                .setDescription("Time to convert (e.g. 14:00 or 2026-03-15 14:00)")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("from")
                .setDescription("Source Timezone")
                .setRequired(true)
                .addChoices(...TIMEZONES.map(t => ({ name: t.name, value: t.value })))
        )
        .addStringOption(option =>
            option.setName("to")
                .setDescription("Target Timezone")
                .setRequired(true)
                .addChoices(...TIMEZONES.map(t => ({ name: t.name, value: t.value })))
        ),

    async execute(interaction) {
        const inputTime = interaction.options.getString("time");
        const fromZone = interaction.options.getString("from");
        const toZone = interaction.options.getString("to");

        // Parse time
        // Handle "14:00" by attaching today's date, or full date
        let parsedDate;
        if (inputTime.includes("-") || inputTime.includes("/")) {
            parsedDate = moment.tz(inputTime, ["YYYY-MM-DD HH:mm", "DD/MM/YYYY HH:mm"], fromZone);
        } else {
            // Assume HH:mm today
            parsedDate = moment.tz(inputTime, "HH:mm", fromZone);
        }

        if (!parsedDate.isValid()) {
            return interaction.reply({ content: "❌ Invalid time format. Please use `HH:mm` (e.g. 14:30) or `YYYY-MM-DD HH:mm`.", ephemeral: true });
        }

        const convertedDate = parsedDate.clone().tz(toZone);

        const embed = createBaseEmbed("🕒 Timezone Converter")
            .setColor("#0099FF")
            .addFields(
                { name: "Original Time", value: `${parsedDate.format("YYYY-MM-DD HH:mm")} (${fromZone})`, inline: false },
                { name: "Converted Time", value: `**${convertedDate.format("YYYY-MM-DD HH:mm")}** (${toZone})`, inline: false },
                { name: "Local Time (Your Discord)", value: `<t:${parsedDate.unix()}:F>`, inline: false }
            );

        await interaction.reply({ embeds: [embed] });
    }
};
