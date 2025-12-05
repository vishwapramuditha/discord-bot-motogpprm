const data = require("../data/motogp-data.json");
const moment = require("moment-timezone");

function getNextMotoGPRace() {
    const now = moment();
    // Find first race where Race session is after now
    return data.races.find(race => moment(race.sessions.Race).isAfter(now)) || null;
}

function getMotoGPCalendar() {
    return data.races;
}

function getMotoGPStandings(type = 'riders') {
    if (type === 'riders') return data.riders;
    if (type === 'constructors') return data.constructors;
    return [];
}

module.exports = {
    getNextMotoGPRace,
    getMotoGPCalendar,
    getMotoGPStandings
};
