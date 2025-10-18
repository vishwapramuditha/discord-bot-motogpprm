// Discord Racing Bot - F1 & MotoGP Data
// File: index.js

require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

// Configuration from .env
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// Data file path
const DATA_FILE_PATH = path.join(__dirname, 'racing-data.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Store racing data
let racingData = null;

// Load data from JSON file
async function loadRacingData() {
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf8');
    racingData = JSON.parse(data);
    console.log('✅ Racing data loaded successfully');
    console.log(`📊 F1 Drivers: ${racingData.f1.drivers.length}`);
    console.log(`📊 MotoGP Riders: ${racingData.motogp.riders.length}`);
    return true;
  } catch (error) {
    console.error('❌ Error loading racing-data.json:', error.message);
    console.error('⚠️  Make sure racing-data.json is in the same folder as index.js');
    return false;
  }
}

// Reload data every 2 minutes to catch updates
setInterval(loadRacingData, 2 * 60 * 1000);

// Format date nicely
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Calculate days until race
function getDaysUntil(dateString) {
  const raceDate = new Date(dateString);
  const today = new Date();
  const diffTime = raceDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Create embed for next race
function createNextRaceEmbed(race, series) {
  const color = series === 'f1' ? 0xE10600 : 0xFF6600;
  const emoji = series === 'f1' ? '🏎️' : '🏍️';
  const title = series === 'f1' ? 'Next Formula 1 Race' : 'Next MotoGP Race';
  
  if (!race) {
    return new EmbedBuilder()
      .setColor(color)
      .setTitle(`${emoji} ${title}`)
      .setDescription('No upcoming races scheduled.')
      .setTimestamp();
  }

  const daysUntil = getDaysUntil(race.date);
  const countdown = daysUntil > 0 ? `${daysUntil} days` : daysUntil === 0 ? 'TODAY! 🔥' : 'Race completed';
  
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(`${emoji} ${title}`)
    .setDescription(`**${race.name}**`)
    .addFields(
      { name: '📍 Circuit', value: race.circuit, inline: false },
      { name: '📅 Date', value: formatDate(race.date), inline: true },
      { name: '⏳ Countdown', value: countdown, inline: true }
    )
    .setFooter({ text: `Last updated: ${new Date(racingData.lastUpdated).toLocaleString()}` })
    .setTimestamp();
}

// Create standings embed
function createStandingsEmbed(data, type, series) {
  const color = series === 'f1' ? 0xE10600 : 0xFF6600;
  let title, items, emoji;

  if (type === 'driver') {
    emoji = series === 'f1' ? '🏎️' : '🏍️';
    title = series === 'f1' ? 'F1 Driver Championship' : 'MotoGP Rider Championship';
    items = series === 'f1' ? data.f1.drivers : data.motogp.riders;
  } else {
    emoji = '🏭';
    title = series === 'f1' ? 'F1 Constructor Championship' : 'MotoGP Team Championship';
    items = series === 'f1' ? data.f1.constructors : data.motogp.teams;
  }

  const sorted = [...items].sort((a, b) => b.points - a.points);
  
  // Split into chunks if too long
  const topItems = sorted.slice(0, 15);
  
  const standingsText = topItems.map((item, idx) => {
    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
    const teamInfo = item.team ? ` (${item.team})` : '';
    return `${medal} **${item.name}**${teamInfo} - **${item.points}** pts`;
  }).join('\n');

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${emoji} ${title}`)
    .setDescription(standingsText || 'No standings available')
    .setFooter({ text: `Last updated: ${new Date(data.lastUpdated).toLocaleString()}` })
    .setTimestamp();

  if (sorted.length > 15) {
    embed.addFields({ 
      name: '📊 Showing Top 15', 
      value: `Total entries: ${sorted.length}`, 
      inline: false 
    });
  }

  return embed;
}

// Create selection menu for standings
function createStandingsMenu(messageId) {
  const row = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`standings_${messageId}`)
        .setPlaceholder('🏆 Choose championship standings')
        .addOptions([
          {
            label: 'F1 - Driver Championship',
            description: 'View F1 driver standings',
            value: 'f1_driver',
            emoji: '🏎️'
          },
          {
            label: 'F1 - Constructor Championship',
            description: 'View F1 constructor standings',
            value: 'f1_constructor',
            emoji: '🏭'
          },
          {
            label: 'MotoGP - Rider Championship',
            description: 'View MotoGP rider standings',
            value: 'motogp_rider',
            emoji: '🏍️'
          },
          {
            label: 'MotoGP - Team Championship',
            description: 'View MotoGP team standings',
            value: 'motogp_team',
            emoji: '🔧'
          }
        ])
    );
  return row;
}

// Register slash commands
async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('next')
      .setDescription('Show the next Formula 1 race'),
    
    new SlashCommandBuilder()
      .setName('nextmgp')
      .setDescription('Show the next MotoGP race'),
    
    new SlashCommandBuilder()
      .setName('standings')
      .setDescription('View championship standings'),
    
    new SlashCommandBuilder()
      .setName('reload')
      .setDescription('Reload racing data from file'),
    
    new SlashCommandBuilder()
      .setName('help')
      .setDescription('Show all available commands')
  ].map(command => command.toJSON());

  const rest = new REST({ version: '10' }).setToken(TOKEN);

  try {
    console.log('🔄 Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log('✅ Slash commands registered successfully!');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
}

// Bot ready event
client.once('ready', async () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🤖 Bot Online: ${client.user.tag}`);
  console.log(`📊 Servers: ${client.guilds.cache.size}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  await registerCommands();
  await loadRacingData();
  
  // Set bot status
  client.user.setActivity('F1 & MotoGP 🏁', { type: 'WATCHING' });
});

// Slash command handler
client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) {
    const { commandName } = interaction;

    // Check if data is loaded
    if (!racingData && commandName !== 'help') {
      await interaction.reply({
        content: '⚠️ Racing data is not loaded yet. Please try again in a moment.',
        ephemeral: true
      });
      return;
    }

    try {
      switch (commandName) {
        case 'next': {
          const nextRace = racingData.f1.nextRace;
          const embed = createNextRaceEmbed(nextRace, 'f1');
          await interaction.reply({ embeds: [embed] });
          break;
        }

        case 'nextmgp': {
          const nextRace = racingData.motogp.nextRace;
          const embed = createNextRaceEmbed(nextRace, 'motogp');
          await interaction.reply({ embeds: [embed] });
          break;
        }

        case 'standings': {
          const embed = new EmbedBuilder()
            .setColor(0xE10600)
            .setTitle('🏆 Championship Standings')
            .setDescription('Select which championship standings you want to view:')
            .addFields(
              { name: '🏎️ Formula 1', value: 'Driver & Constructor Championships', inline: true },
              { name: '🏍️ MotoGP', value: 'Rider & Team Championships', inline: true }
            )
            .setTimestamp();

          const menu = createStandingsMenu(interaction.id);
          await interaction.reply({ embeds: [embed], components: [menu] });
          break;
        }

        case 'reload': {
          await interaction.deferReply();
          const success = await loadRacingData();
          if (success) {
            await interaction.editReply('✅ Racing data reloaded successfully!');
          } else {
            await interaction.editReply('❌ Failed to reload racing data. Check if racing-data.json exists.');
          }
          break;
        }

        case 'help': {
          const embed = new EmbedBuilder()
            .setColor(0xE10600)
            .setTitle('🏁 Racing Bot Commands')
            .setDescription('Track F1 and MotoGP races and standings!')
            .addFields(
              { name: '/next', value: '🏎️ Show next Formula 1 race', inline: false },
              { name: '/nextmgp', value: '🏍️ Show next MotoGP race', inline: false },
              { name: '/standings', value: '🏆 View championship standings (interactive menu)', inline: false },
              { name: '/reload', value: '🔄 Reload racing data from file', inline: false },
              { name: '/help', value: '❓ Show this help message', inline: false }
            )
            .setFooter({ text: 'Made for F1 & MotoGP fans 🏁' })
            .setTimestamp();
          await interaction.reply({ embeds: [embed] });
          break;
        }
      }
    } catch (error) {
      console.error('Error handling command:', error);
      const errorMessage = 'An error occurred while processing your command.';
      if (interaction.deferred) {
        await interaction.editReply(errorMessage);
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  }

  // Handle select menu interactions
  if (interaction.isStringSelectMenu()) {
    if (!interaction.customId.startsWith('standings_')) return;

    const [series, type] = interaction.values[0].split('_');
    const standingsType = type === 'driver' || type === 'rider' ? 'driver' : 'constructor';
    
    const embed = createStandingsEmbed(racingData, standingsType, series);
    await interaction.update({ embeds: [embed], components: [] });
  }
});

// Legacy message commands support (for /next, /nextmgp, /standings without slash)
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!racingData) return;

  const content = message.content.toLowerCase();

  try {
    if (content === '/next') {
      const nextRace = racingData.f1.nextRace;
      const embed = createNextRaceEmbed(nextRace, 'f1');
      await message.reply({ embeds: [embed] });
    }
    else if (content === '/nextmgp') {
      const nextRace = racingData.motogp.nextRace;
      const embed = createNextRaceEmbed(nextRace, 'motogp');
      await message.reply({ embeds: [embed] });
    }
    else if (content === '/standings') {
      const embed = new EmbedBuilder()
        .setColor(0xE10600)
        .setTitle('🏆 Championship Standings')
        .setDescription('Select which championship standings you want to view:')
        .setTimestamp();

      const menu = createStandingsMenu(message.id);
      await message.reply({ embeds: [embed], components: [menu] });
    }
    else if (content === '/help') {
      const embed = new EmbedBuilder()
        .setColor(0xE10600)
        .setTitle('🏁 Racing Bot Commands')
        .setDescription('Available commands:')
        .addFields(
          { name: '/next', value: 'Show next F1 race', inline: true },
          { name: '/nextmgp', value: 'Show next MotoGP race', inline: true },
          { name: '/standings', value: 'View standings', inline: true },
          { name: '/reload', value: 'Reload data', inline: true },
          { name: '/help', value: 'Show help', inline: true }
        )
        .setTimestamp();
      await message.reply({ embeds: [embed] });
    }
  } catch (error) {
    console.error('Error handling message command:', error);
  }
});

// Error handling
client.on('error', (error) => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Login
client.login(TOKEN).catch(err => {
  console.error('❌ Failed to login. Check your TOKEN in .env file');
  console.error(err.message);
});
