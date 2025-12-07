const axios = require('axios');
const moment = require('moment-timezone');

const BASE_URL = 'http://api.jolpi.ca/ergast/f1'; // Using Jolpica (Ergast mirror/successor)

// Cache to avoid hitting API limits
const cache = {
    nextRace: null,
    standings: {},
    calendar: {},
    drivers: {},
    teams: {}
};

// Static map for current grid driver images (2024/2025)
const DRIVER_IMAGES = {
    "max_verstappen": "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/M/MAXVER01_Max_Verstappen/maxver01.png.transform/2col/image.png",
    "perez": "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/S/SERPER01_Sergio_Perez/serper01.png.transform/2col/image.png",
    "hamilton": "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LEWHAM01_Lewis_Hamilton/lewham01.png.transform/2col/image.png",
    "russell": "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GEORUS01_George_Russell/georus01.png.transform/2col/image.png",
    "leclerc": "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CHALEC01_Charles_Leclerc/chalec01.png.transform/2col/image.png",
    "sainz": "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CARSAI01_Carlos_Sainz/carsai01.png.transform/2col/image.png",
    "norris": "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANNOR01_Lando_Norris/lannor01.png.transform/2col/image.png",
    "piastri": "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/O/OSCPIA01_Oscar_Piastri/oscpia01.png.transform/2col/image.png",
    "alonso": "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/F/FERALO01_Fernando_Alonso/feralo01.png.transform/2col/image.png",
    "stroll": "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANSTR01_Lance_Stroll/lanstr01.png.transform/2col/image.png",
    "gasly": "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/P/PIEGAS01_Pierre_Gasly/piegas01.png.transform/2col/image.png",
    "ocon": "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/E/ESTOCO01_Esteban_Ocon/estoco01.png.transform/2col/image.png",
    "albon": "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ALEALB01_Alexander_Albon/alealb01.png.transform/2col/image.png",
    "sargeant": "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LOGSAR01_Logan_Sargeant/logsar01.png.transform/2col/image.png",
    "tsunoda": "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/Y/YUKTSU01_Yuki_Tsunoda/yuktsu01.png.transform/2col/image.png",
    "ricciardo": "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/D/DANRIC01_Daniel_Ricciardo/danric01.png.transform/2col/image.png",
    "bottas": "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/V/VALBOT01_Valtteri_Bottas/valbot01.png.transform/2col/image.png",
    "zhou": "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GUAZHO01_Guanyu_Zhou/guazho01.png.transform/2col/image.png",
    "hulkenberg": "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/N/NICHUL01_Nico_Hulkenberg/nichul01.png.transform/2col/image.png",
    "magnussen": "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/K/KEVMAG01_Kevin_Magnussen/kevmag01.png.transform/2col/image.png",
    "bearman": "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/O/OLIBEA01_Oliver_Bearman/olibea01.png.transform/2col/image.png",
    "colapinto": "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/F/FRACOL01_Franco_Colapinto/fracol01.png.transform/2col/image.png",
    "lawson": "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LIALAW01_Liam_Lawson/lialaw01.png.transform/2col/image.png",
    "doohan": "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/J/JACDOO01_Jack_Doohan/jacdoo01.png.transform/2col/image.png",
    "antonelli": "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/K/KIMANT01_Kimi_Antonelli/kimant01.png.transform/2col/image.png"
};

async function getNextRace() {
    try {
        const response = await axios.get(`${BASE_URL}/current/next.json`);
        const raceData = response.data.MRData.RaceTable.Races[0];
        return raceData;
    } catch (error) {
        console.error("Error fetching next race:", error);
        return null;
    }
}

async function getStandings(year = 'current', type = 'driver') {
    try {
        const endpoint = type === 'driver' ? 'driverStandings' : 'constructorStandings';
        const response = await axios.get(`${BASE_URL}/${year}/${endpoint}.json`);
        return response.data.MRData.StandingsTable.StandingsLists[0];
    } catch (error) {
        console.error("Error fetching standings:", error);
        return null;
    }
}

async function getDriverInfo(driverId) {
    try {
        const response = await axios.get(`${BASE_URL}/drivers/${driverId}.json`);
        return response.data.MRData.DriverTable.Drivers[0];
    } catch (error) {
        console.error("Error fetching driver info:", error);
        return null;
    }
}

async function getTeamInfo(constructorId) {
    try {
        const response = await axios.get(`${BASE_URL}/constructors/${constructorId}.json`);
        return response.data.MRData.ConstructorTable.Constructors[0];
    } catch (error) {
        console.error("Error fetching team info:", error);
        return null;
    }
}

async function getCalendar(year = 'current') {
    try {
        const response = await axios.get(`${BASE_URL}/${year}.json`);
        return response.data.MRData.RaceTable.Races;
    } catch (error) {
        console.error("Error fetching calendar:", error);
        return null;
    }
}

async function getRaceResult(year, round) {
    try {
        const response = await axios.get(`${BASE_URL}/${year}/${round}/results.json`);
        return response.data.MRData.RaceTable.Races[0];
    } catch (error) {
        console.error("Error fetching results:", error);
        return null;
    }
}

async function getDriverList() {
    try {
        // Fetch ALL drivers (limit=1000 covers history)
        if (cache.drivers.all && cache.drivers.all.length > 0) {
            return cache.drivers.all;
        }
        const response = await axios.get(`${BASE_URL}/drivers.json?limit=1000`);
        const drivers = response.data.MRData.DriverTable.Drivers;
        cache.drivers.all = drivers;
        return drivers;
    } catch (error) {
        console.error("Error fetching driver list:", error);
        return [];
    }
}

function getDriverImage(driverId) {
    return DRIVER_IMAGES[driverId] || null;
}

async function getLastRacesResults(driverId, limit = 3) {
    try {
        const response = await axios.get(`${BASE_URL}/drivers/${driverId}/results.json?limit=${limit}&offset=0`);
        // Note: Ergast doesn't support sorting by date desc easily in one call without offset logic usually, 
        // but let's try fetching current season results.
        // Actually, better to fetch "current/drivers/id/results"
        const currentResp = await axios.get(`${BASE_URL}/current/drivers/${driverId}/results.json`);
        const races = currentResp.data.MRData.RaceTable.Races;
        return races.slice(-limit).reverse(); // Get last N races
    } catch (error) {
        return [];
    }
}

async function getCircuit(circuitId) {
    try {
        const response = await axios.get(`${BASE_URL}/circuits/${circuitId}.json`);
        return response.data.MRData.CircuitTable.Circuits[0];
    } catch (error) {
        console.error("Error fetching circuit:", error);
        return null;
    }
}

async function getCircuitList() {
    try {
        // Fetch current season circuits for autocomplete
        const response = await axios.get(`${BASE_URL}/current/circuits.json`);
        return response.data.MRData.CircuitTable.Circuits;
    } catch (error) {
        return [];
    }
}

async function getTeamDrivers(constructorId) {
    try {
        const response = await axios.get(`${BASE_URL}/current/constructors/${constructorId}/drivers.json`);
        return response.data.MRData.DriverTable.Drivers;
    } catch (error) {
        console.error("Error fetching team drivers:", error);
        return [];
    }
}

async function getTeamRecentResults(constructorId, limit = 5) {
    try {
        // Fetch last N results for the team
        // We can't easily "sort desc" via API URL standardly in Ergast, but we can fetch the last race or current season.
        // Strategy: Get current season results for the team.
        const response = await axios.get(`${BASE_URL}/current/constructors/${constructorId}/results.json?limit=100`);
        const races = response.data.MRData.RaceTable.Races;
        // Return the last 'limit' races (which contain results for both drivers)
        return races.slice(-limit).reverse();
    } catch (error) {
        console.error("Error fetching team recent results:", error);
        return [];
    }
}

module.exports = {
    getNextRace,
    getStandings,
    getDriverInfo,
    getTeamInfo,
    getTeamDrivers,
    getTeamRecentResults,
    getCalendar,
    getRaceResult,
    getDriverList,
    getLastRacesResults,
    getCircuit,
    getCircuitList,
    getDriverImage
};
