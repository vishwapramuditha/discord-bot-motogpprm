# MotoGP PRM - F1/MotoGP Discord Bot 🏎️

MotoGP PRM is a feature-rich Discord bot designed to bring the world of Formula 1 directly to your server. Built with **Node.js** and **Discord.js**, it provides real-time data, statistics, race information, and historic insights using the Ergast F1 API (via Jolpica).

## 🚀 Features

MotoGP PRM comes packed with improved commands to keep you updated:

### 🏁 Race Data
- **/next**: Get a countdown and details for the upcoming Grand Prix.
- **/calendar**: View the full season calendar with race start times (converted to your timezone).
- **/results**: Fetch results for any recent race.
- **/standings**: View current Driver and Constructor championship standings.

### 📊 Encyclopedia & Stats
- **/driver**: Search for any driver (past or present) to view their detailed profile, stats, and helmet.
- **/team**: **(New!)** View comprehensive team profiles including technical specs (Engine/Chassis), current driver lineups, and recent race performance.
- **/circuit**: Get detailed circuit information and layout maps.
- **/info**: Bot status and general information.

### 🎮 Fun & Community
- **/trivia**: Test your F1 knowledge with random trivia questions.
- **/vote**: Create polls for the community.
- **/quote**: Get an iconic F1 quote.
- **/gif**: Search for F1-related GIFs.

### 🛠️ Utilities
- **/help**: List all available commands.
- **/support**: Get link to the support server or developer contact.
- **/news**: (Experimental) Get latest F1 headlines.

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Discord.js v14
- **Data Source**: [Jolpica / Ergast F1 API](https://jolpica.com/) for racing data.
- **Utilities**: `axios`, `moment-timezone`, `rss-parser`.

## ⚙️ Installation & Setup

Follow these steps to host MotoGP PRM yourself or contribute to development.

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.9.0 or higher)
- A generic code editor (VS Code recommended)
- A Discord Bot Token (created via the [Discord Developer Portal](https://discord.com/developers/applications))

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/Start-05/discord-bot-motogpprm.git
   cd discord-bot-motogpprm
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory (same level as `package.json`) and add your secrets:
   ```env
   TOKEN=your_discord_bot_token_here
   CLIENT_ID=your_bot_application_id
   GUILD_ID=your_test_server_id_optional
   ```

4. **Deploy Slash Commands**
   Register the commands with Discord so they appear in your server:
   ```bash
   node deploy-commands.js
   ```

5. **Start the Bot**
   ```bash
   npm start
   ```

## 📂 Project Structure

```
├── src/
│   ├── commands/       # Slash command logic (team.js, driver.js, etc.)
│   ├── events/         # Event handlers (ready.js, interactionCreate.js)
│   ├── services/       # API interaction layer (f1Service.js)
│   ├── data/           # Static data (teamConstants.js)
│   └── utils/          # Helper functions (embedUtils.js)
├── deploy-commands.js  # Script to register commands
├── index.js            # Main entry point
└── package.json        # Dependencies and scripts
```

## 🤝 Contributing

Contributions are welcome! If you have ideas for new features (like live timing integration or prediction markets):

1. Fork the project.
2. Create feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📄 License

This project is licensed under the ISC License.

Vishwa Pramuditha 2025
