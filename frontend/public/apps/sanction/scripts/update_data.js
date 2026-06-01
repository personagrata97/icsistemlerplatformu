const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const DATA_FILE = path.join(__dirname, '../sanctions_data.json');

// Sources
const SOURCES = {
    UN: 'https://scsanctions.un.org/resources/xml/en/consolidated.xml',
    EU: 'https://webgate.ec.europa.eu/europeaid/fsd/fsf/public/files/xmlFullSanctionsList/content?token=dG9rZW4tMjAxNw',
    OFAC: 'https://www.treasury.gov/ofac/downloads/sdn.csv'
};

let consolidatedData = [];

async function fetchData() {
    console.log('Starting data update...');

    try {
        await fetchUN();
    } catch (e) { console.error('Error fetching UN:', e.message); }

    try {
        await fetchEU();
    } catch (e) { console.error('Error fetching EU:', e.message); }

    try {
        await fetchOFAC();
    } catch (e) { console.error('Error fetching OFAC:', e.message); }

    // Save to file
    fs.writeFileSync(DATA_FILE, JSON.stringify(consolidatedData, null, 2));
    console.log(`Data update complete. Total records: ${consolidatedData.length}`);
}

async function fetchUN() {
    console.log('Fetching UN List...');
    const response = await axios.get(SOURCES.UN);
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);

    const individuals = result.CONSOLIDATED_LIST.INDIVIDUALS[0].INDIVIDUAL || [];
    const entities = result.CONSOLIDATED_LIST.ENTITIES[0].ENTITY || [];

    individuals.forEach(item => {
        const name = `${item.FIRST_NAME} ${item.SECOND_NAME || ''} ${item.THIRD_NAME || ''}`.trim();
        consolidatedData.push({
            name: name,
            list: 'UN Consolidated',
            type: 'Individual',
            originalId: item.DATAID[0]
        });
    });

    entities.forEach(item => {
        consolidatedData.push({
            name: item.FIRST_NAME[0],
            list: 'UN Consolidated',
            type: 'Entity',
            originalId: item.DATAID[0]
        });
    });
    console.log(`Parsed ${individuals.length + entities.length} UN records.`);
}

async function fetchEU() {
    console.log('Fetching EU List...');
    const response = await axios.get(SOURCES.EU);
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);

    const subjects = result.export.sanctionEntity || [];

    subjects.forEach(item => {
        // EU structure is complex, simplified for MVP
        const nameAlias = item.nameAlias ? item.nameAlias[0].wholeName[0] : 'Unknown';
        consolidatedData.push({
            name: nameAlias,
            list: 'EU Financial Sanctions',
            type: 'Entity/Individual',
            originalId: item.$.logicalId
        });
    });
    console.log(`Parsed ${subjects.length} EU records.`);
}

async function fetchOFAC() {
    console.log('Fetching OFAC List...');
    const response = await axios.get(SOURCES.OFAC, { responseType: 'stream' });

    return new Promise((resolve, reject) => {
        let count = 0;
        response.data.pipe(csv(['ent_num', 'SDN_Name', 'SDN_Type', 'Program', 'Title', 'Call_Sign', 'Vess_type', 'Tonnage', 'GRT', 'Vess_flag', 'Vess_owner', 'Remarks']))
            .on('data', (row) => {
                if (row.SDN_Name) {
                    consolidatedData.push({
                        name: row.SDN_Name,
                        list: 'OFAC SDN',
                        type: row.SDN_Type,
                        originalId: row.ent_num
                    });
                    count++;
                }
            })
            .on('end', () => {
                console.log(`Parsed ${count} OFAC records.`);
                resolve();
            })
            .on('error', reject);
    });
}

fetchData();
