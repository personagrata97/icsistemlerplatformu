const axios = require('axios');

async function debug() {
    try {
        const response = await axios.get('http://localhost:3001/api/v1/audit/logs');
        console.log('--- BACKEND RAW DATA (First 2 logs) ---');
        console.log(JSON.stringify(response.data.slice(0, 2), null, 2));
    } catch (e) {
        console.error('Error fetching logs:', e.message);
    }
}

debug();
