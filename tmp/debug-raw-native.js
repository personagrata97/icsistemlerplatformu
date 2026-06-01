const http = require('http');

http.get('http://localhost:3001/api/v1/audit/logs', (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        try {
            const parsedData = JSON.parse(rawData);
            console.log('--- RAW BACKEND LOG DATA ---');
            if (Array.isArray(parsedData) && parsedData.length > 0) {
                console.log('Keys:', Object.keys(parsedData[0]));
                console.log('Sample Date Value:', parsedData[0].date);
                console.log('Sample createdAt Value:', parsedData[0].createdAt);
                console.log('Full First Item:', JSON.stringify(parsedData[0], null, 2));
            } else {
                console.log('No logs found or invalid format:', typeof parsedData);
            }
        } catch (e) {
            console.error('Parse error:', e.message);
            console.log('Raw data snippet:', rawData.substring(0, 500));
        }
    });
}).on('error', (e) => {
    console.error(`Error: ${e.message}`);
});
