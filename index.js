require("dotenv").config();
const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
} = require("discord.js");
const moment = require("moment-timezone");
const data = require("./races.json");

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once("ready", () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

// ------------------- Helper Functions -------------------
function getNextRace() {
    const now = moment();
    return (
        data.races.find((race) =>
            Object.values(race.sessions).some((t) => moment(t).isAfter(now))
        ) || null
    );
}

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
        case "practice":
            return "🟢";
        case "qualifying 1":
        case "qualifying 2":
        case "qualifying":
            return "🏎️";
        case "sprint":
            return "⚡";
        case "warm up":
            return "☀️";
        case "race":
            return "🏁";
        default:
            return "📌";
    }
}

function createRaceEmbed(nextRace) {
    const embed = new EmbedBuilder()
        .setTitle(`🏁 ${nextRace.name} - ${nextRace.track}`)
        .setColor("#FF0000")
        .setFooter({ text: "MotoGP 2025 Schedule" })
        .setTimestamp();

    const now = moment();

    for (const [session, time] of Object.entries(nextRace.sessions)) {
        const sessionStart = moment(time);
        const sessionEnd = moment(time).add(1, "hours"); // assume 1-hour duration
        const sessionTime = sessionStart.tz(moment.tz.guess());
        const unixTime = Math.floor(sessionTime.valueOf() / 1000);
        const displayTime = `<t:${unixTime}:f>`;
        const emoji = sessionEmoji(session);

        let status = "";
        if (now.isAfter(sessionStart) && now.isBefore(sessionEnd)) {
            status = "🟠 **LIVE NOW**";
        } else if (now.isAfter(sessionEnd)) {
            status = "✅ Finished";
        } else {
            const countdown = formatCountdown(sessionTime);
            status = `⏱ ${countdown}`;
        }

        embed.addFields({
            name: `${emoji} ${session}`,
            value: `${displayTime} | ${status}`,
            inline: false,
        });
    }

    return embed;
}

// ------------------- Command Handling -------------------
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // ---------- /next ----------
    if (interaction.commandName === "next") {
        const nextRace = getNextRace();
        if (!nextRace) return interaction.reply("🎉 No upcoming races!");

        await interaction.deferReply();
        const embed = createRaceEmbed(nextRace);
        const message = await interaction.editReply({ embeds: [embed] });

        // Auto-update countdowns every 60 seconds
        const interval = setInterval(async () => {
            const now = moment();
            const hasFuture = Object.values(nextRace.sessions).some((t) =>
                moment(t).isAfter(now)
            );

            // Stop updating if all sessions finished
            if (!hasFuture) {
                clearInterval(interval);
                await message.edit({ embeds: [createRaceEmbed(nextRace)] });
                return;
            }

            try {
                await message.edit({ embeds: [createRaceEmbed(nextRace)] });
            } catch (err) {
                clearInterval(interval);
                console.error("Stopped updating (message deleted or bot restarted)");
            }
        }, 60000); // every minute
    }

    // ---------- /standings ----------
    if (interaction.commandName === "standings") {
        const type = interaction.options.getString("type");

        if (type === "riders") {
            const riders = data.riders;
            const embeds = [];

            const firstEmbed = new EmbedBuilder()
                .setTitle("🏆 Riders Championship Standings (1-15)")
                .setColor("#FFD700")
                .setFooter({ text: "MotoGP 2025 Championship" });

            riders.slice(0, 15).forEach((driver) => {
                firstEmbed.addFields({
                    name: `#${driver.rank} ${driver.name} (${driver.team})`,
                    value: `Points: ${driver.points}`,
                    inline: true,
                });
            });

            embeds.push(firstEmbed);

            if (riders.length > 15) {
                const secondEmbed = new EmbedBuilder()
                    .setTitle(`🏆 Riders Championship Standings (${16}-${riders.length})`)
                    .setColor("#FFD700")
                    .setFooter({ text: "MotoGP 2025 Championship" });

                riders.slice(15).forEach((driver) => {
                    secondEmbed.addFields({
                        name: `#${driver.rank} ${driver.name} (${driver.team})`,
                        value: `Points: ${driver.points}`,
                        inline: true,
                    });
                });

                embeds.push(secondEmbed);
            }

            return interaction.reply({ embeds });
        } else if (type === "constructors") {
            const embed = new EmbedBuilder()
                .setTitle("🏎️ Constructors Championship Standings")
                .setColor("#FFD700")
                .setFooter({ text: "MotoGP 2025 Championship" });

            data.constructors.forEach((team) => {
                embed.addFields({
                    name: `${team.team}`,
                    value: `Points: ${team.points}`,
                    inline: true,
                });
            });

            return interaction.reply({ embeds: [embed] });
        }
    }

    // ---------- /support ----------
    if (interaction.commandName === "support") {
        return interaction.reply({
            content:
                "☕ Support the developer:\n[Buy me a coffee](https://buymeacoffee.com/pramu.cc)\n🌐 Website: [vishwapramuditha.com](https://vishwapramuditha.com)",
            ephemeral: true,
        });
    }
});

client.login(process.env.TOKEN);
