require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const moment = require("moment-timezone");

// Load data
const motogp = require("./races.json"); // MotoGP data
const f1data = require("./f1data.json"); // F1 data following f1db.schema.json

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

// ---------------- Helper Functions ----------------
function formatCountdown(time) {
    const now = moment();
    const diff = moment(time).diff(now);
    if (diff <= 0) return "✅";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return `${days}d ${hours}h ${minutes}m`;
}

function sessionEmoji(session) {
    switch (session.toLowerCase()) {
        case "free practice 1":
        case "free practice 2":
        case "practice": return "🟢";
        case "qualifying 1":
        case "qualifying 2":
        case "qualifying": return "🏎️";
        case "sprint": return "⚡";
        case "warm up": return "☀️";
        case "race": return "🏁";
        default: return "📌";
    }
}

function createRaceEmbed(race, title, footerText) {
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor("#FF0000")
        .setFooter({ text: footerText })
        .setTimestamp();

    const now = moment();
    for (const [session, time] of Object.entries(race.sessions)) {
        const sessionStart = moment(time);
        const sessionEnd = moment(time).add(1, "hours");
        const sessionTime = sessionStart.tz(moment.tz.guess());
        const unixTime = Math.floor(sessionTime.valueOf() / 1000);
        const displayTime = `<t:${unixTime}:f>`;
        const emoji = sessionEmoji(session);

        let status = "";
        if (now.isAfter(sessionStart) && now.isBefore(sessionEnd)) status = "🟠 **LIVE NOW**";
        else if (now.isAfter(sessionEnd)) status = "✅ Finished";
        else status = `⏱ ${formatCountdown(sessionTime)}`;

        embed.addFields({
            name: `${emoji} ${session}`,
            value: `${displayTime} | ${status}`,
            inline: false,
        });
    }
    return embed;
}

// ---------------- MotoGP Logic ----------------
function getNextMotoGPRace() {
    const now = moment();
    return motogp.races.find((race) =>
        Object.values(race.sessions).some((t) => moment(t).isAfter(now))
    ) || null;
}

// ---------------- F1 Logic ----------------
function getNextF1Race() {
    const now = moment();
    return f1data.races.find((race) => moment(race.date).isAfter(now)) || null;
}

// ---------------- Command Handling ----------------
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // ---------------- /nextmotogp ----------------
    if (interaction.commandName === "nextmotogp") {
        const race = getNextMotoGPRace();
        if (!race) return interaction.reply("🎉 No upcoming MotoGP races!");
        await interaction.deferReply();
        const embed = createRaceEmbed(race, `🏍️ ${race.name} - ${race.track}`, "MotoGP 2025 Schedule");
        const message = await interaction.editReply({ embeds: [embed] });

        const interval = setInterval(async () => {
            const now = moment();
            const hasFuture = Object.values(race.sessions).some((t) => moment(t).isAfter(now));
            if (!hasFuture) return clearInterval(interval);
            try { await message.edit({ embeds: [createRaceEmbed(race, `🏍️ ${race.name} - ${race.track}`, "MotoGP 2025 Schedule")] }); }
            catch { clearInterval(interval); }
        }, 60000);
    }

    // ---------------- /nextf1 ----------------
    if (interaction.commandName === "nextf1") {
        const race = getNextF1Race();
        if (!race) return interaction.reply("🎉 No upcoming F1 races!");

        const grandPrix = f1data.grandsPrix.find((gp) => gp.id === race.grandPrixId);
        const circuit = f1data.circuits.find((c) => c.id === race.circuitId);

        const embed = new EmbedBuilder()
            .setTitle(`🏁 ${grandPrix?.name || "Unknown GP"} - ${circuit?.name || "Circuit"}`)
            .setDescription(`📅 Date: ${race.date}\n🕒 Time: ${race.time || "TBA"}`)
            .setColor("#E10600")
            .setFooter({ text: "Formula 1 2025 Schedule" })
            .setTimestamp();

        interaction.reply({ embeds: [embed] });
    }

    // ---------------- /standingsmotogp ----------------
    if (interaction.commandName === "standingsmotogp") {
        const type = interaction.options.getString("type");

        if (type === "riders") {
            const embed = new EmbedBuilder()
                .setTitle("🏍️ MotoGP Riders Standings")
                .setColor("#FFD700");
            motogp.riders.forEach((r) =>
                embed.addFields({ name: `#${r.rank} ${r.name}`, value: `🏁 ${r.team} - ${r.points} pts`, inline: true })
            );
            return interaction.reply({ embeds: [embed] });
        }

        if (type === "constructors") {
            const embed = new EmbedBuilder()
                .setTitle("🏍️ MotoGP Constructors Standings")
                .setColor("#FFD700");
            motogp.constructors.forEach((c) =>
                embed.addFields({ name: c.team, value: `${c.points} pts`, inline: true })
            );
            return interaction.reply({ embeds: [embed] });
        }
    }

    // ---------------- /standingsf1 ----------------
    if (interaction.commandName === "standingsf1") {
        const type = interaction.options.getString("type");
        const season = f1data.seasons[f1data.seasons.length - 1]; // latest season

        if (type === "drivers") {
            const embed = new EmbedBuilder()
                .setTitle("🏎️ F1 Drivers Championship Standings")
                .setColor("#E10600");
            season.driverStandings.slice(0, 10).forEach((d) => {
                const driver = f1data.drivers.find((drv) => drv.id === d.driverId);
                embed.addFields({
                    name: `#${d.positionNumber} ${driver?.fullName || "Unknown"}`,
                    value: `${d.points} pts`,
                    inline: true,
                });
            });
            return interaction.reply({ embeds: [embed] });
        }

        if (type === "constructors") {
            const embed = new EmbedBuilder()
                .setTitle("🏎️ F1 Constructors Championship Standings")
                .setColor("#E10600");
            season.constructorStandings.slice(0, 10).forEach((t) => {
                const constructor = f1data.constructors.find((c) => c.id === t.constructorId);
                embed.addFields({
                    name: `${constructor?.name || "Unknown"}`,
                    value: `${t.points} pts`,
                    inline: true,
                });
            });
            return interaction.reply({ embeds: [embed] });
        }
    }

    // ---------------- /support ----------------
    if (interaction.commandName === "support") {
        return interaction.reply({
            content:
                "☕ Support the developer:\n[Buy me a coffee](https://buymeacoffee.com/pramu.cc)\n🌐 Website: [pramu.cc](https://pramu.cc)",
            ephemeral: true,
        });
    }
});

client.login(process.env.TOKEN);
