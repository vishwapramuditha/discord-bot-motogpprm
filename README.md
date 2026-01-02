# MotoGP PRM - F1 & MotoGP Discord Bot

<p align="center">
  <img src="src/assets/banners/banner (1).png" alt="MotoGP PRM Banner" width="100%" />
</p>

<p align="center">
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-v16.9%2B-green?style=flat&logo=node.js" alt="Node.js Badge"></a>
  <a href="https://discord.js.org/"><img src="https://img.shields.io/badge/Discord.js-v14-blue?style=flat&logo=discord" alt="Discord.js Badge"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License Badge"></a>
</p>

**MotoGP PRM** is a comprehensive Discord bot designed for motorsport enthusiasts. It's fully updated for the **2026 Season**, bringing real-time data, detailed statistics, and live updates for **Formula 1**, **MotoGP**, and **Formula 3**.

## ✨ What's New for 2026?

*   **📅 Full Tables:** Confirmed 2026 season calendars for F1, MotoGP, and F3.
*   **🌍 Localized Times:** All race times automatically convert to your local timezone.
*   **🏎️ F3 Support:** Complete support for Formula 3, including team and driver profiles.
*   **⛈️ Weather:** Real-time track weather forecasts with `/weather`.
*   **📰 News Feed:** Live motorsport headlines delivered via `/news`.

---

## 🛠️ Command Reference

Here is the complete list of available commands. All commands start with `/`.

### 🏁 Race Day
| Command | Description |
| :--- | :--- |
| `/next` | Get the schedule for the next Grand Prix with **Country Flags** and **Live Countdowns**. |
| `/countdown` | A dedicated live timer to the next race start. |
| `/calendar` | View the full season schedule. Supports **F1**, **MotoGP**, and **F3**. |
| `/weather` | **NEW!** Get the weather forecast for any race weekend. |
| `/notify` | Subscribe to receive a DM alert 1 hour before every session. |

### 📊 Grid & Stats
| Command | Description |
| :--- | :--- |
| `/driver` | Search profiles for current drivers and **Legends** (Senna, Rossi, etc.). |
| `/team` | Detailed team info. Includes an **Interactive Dropdown** to view driver profiles instantly. |
| `/circuit` | View track maps and stats. Filter by series (F1/MotoGP/F3). |
| `/standings` | View current Driver or Constructor championship standings. |
| `/results` | Fetch race results for any round in history. |
| `/compare` | **NEW!** Head-to-head statistical comparison between two drivers. |

### 🔧 Tools & Fun
| Command | Description |
| :--- | :--- |
| `/convert` | **NEW!** Convert race times to different timezones easily. |
| `/news` | **NEW!** Get the latest motorsport news headlines. |
| `/trivia` | Test your knowledge with F1 trivia questions. |
| `/quote` | Get a random famous F1 quote. |
| `/gif` | Search for motorsport GIFs. |

---

## ⚙️ Installation & Setup

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/Start-05/discord-bot-motogpprm.git
    cd discord-bot-motogpprm
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment**:
    Create a `.env` file:
    ```env
    TOKEN=your_discord_bot_token
    CLIENT_ID=your_application_id
    GUILD_ID=your_server_id_for_testing
    ```

4.  **Deploy Commands**:
    ```bash
    node deploy-commands.js
    ```
    *Note: Add `GUILD_ID` to `.env` for instant command updates during development.*

5.  **Start the Bot**:
    ```bash
    npm start
    ```

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and open a Pull Request with your improvements.

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

---

<p align="center">
  Made with ❤️ by <b>Vishwa Pramuditha</b>
</p>
