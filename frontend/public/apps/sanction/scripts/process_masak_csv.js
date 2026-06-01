const fs = require('fs');
const path = require('path');
const { TextDecoder } = require('util');

const rawDir = path.join(__dirname, '../data/masak_raw');
const outputFile = path.join(__dirname, '../data/masak_data.js');

console.log(`Reading CSV files from ${rawDir}...`);

let allRecords = [];

try {
    const files = fs.readdirSync(rawDir).filter(f => f.endsWith('.csv'));

    files.forEach(file => {
        console.log(`Processing ${file}...`);
        const filePath = path.join(rawDir, file);
        const buffer = fs.readFileSync(filePath);

        // Try decoding with windows-1254 (Turkish)
        let content;
        try {
            const decoder = new TextDecoder('windows-1254');
            content = decoder.decode(buffer);
        } catch (e) {
            console.warn(`TextDecoder error for ${file}: ${e.message}. Trying iso-8859-9.`);
            try {
                const decoder = new TextDecoder('iso-8859-9');
                content = decoder.decode(buffer);
            } catch (e2) {
                console.warn(`TextDecoder error 2: ${e2.message}. Fallback to latin1.`);
                content = buffer.toString('latin1');
            }
        }

        const lines = content.split(/\r?\n/);
        if (lines.length < 2) return;

        // Parse Header to find column indices
        const headerLine = lines[0];
        const headers = headerLine.split(';').map(h => h.trim().toUpperCase());

        // Identify columns
        const colMap = {
            name: headers.findIndex(h => h.includes('AD-SOYAD') || h.includes('GERÇEK/TÜZEL') || h.includes('ADI SOYADI') || h.includes('UNVANI')),
            tckn: headers.findIndex(h => h.includes('TCKN') || h.includes('VKN') || h.includes('PASAPORT')),
            nationality: headers.findIndex(h => h.includes('UYRU')),
            dob: headers.findIndex(h => h.includes('DOĞUM TARİHİ') || h.includes('DOGUM TARIHI')),
            pob: headers.findIndex(h => h.includes('DOĞUM YERİ') || h.includes('DOGUM YERI')),
            mother: headers.findIndex(h => h.includes('ANNE ADI')),
            father: headers.findIndex(h => h.includes('BABA ADI')),
            org: headers.findIndex(h => h.includes('ÖRGÜT') || h.includes('ORGUT') || h.includes('BAĞLANTILI')),
            listType: headers.findIndex(h => h.includes('YAPTIRIM TÜRÜ') || h.includes('YAPTIRIM TURU')),
            decree: headers.findIndex(h => h.includes('KARAR SAYISI') || h.includes('RESMİ GAZETE') || h.includes('RESMI GAZETE'))
        };

        console.log(`Column Mapping for ${file}:`, colMap);

        // Process lines
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Simple split by semicolon (assuming no semicolons in fields for now)
            // A better regex split would be needed for quoted fields containing delimiters
            const parts = line.split(';');

            if (parts.length < 2) continue;

            const name = colMap.name > -1 ? parts[colMap.name] : '';
            if (!name || name.length < 2) continue;

            const record = {
                name: name.replace(/"/g, '').trim(),
                list: 'TR MASAK (Yurtiçi)',
                type: 'Individual', // Default
                score: 0, // Initial
                sourceDetails: '',
                tckn: '',
                decreeUrl: ''
            };

            // Build Details HTML
            let detailsHtml = '';

            if (colMap.tckn > -1 && parts[colMap.tckn]) {
                const tcknVal = parts[colMap.tckn].trim();
                if (tcknVal) {
                    record.tckn = tcknVal;
                    detailsHtml += `TCKN/VKN/Pasaport: ${tcknVal}\n`;
                }
            }

            if (colMap.nationality > -1 && parts[colMap.nationality]) {
                detailsHtml += `Uyruk: ${parts[colMap.nationality].trim()}\n`;
            }

            if (colMap.dob > -1 && parts[colMap.dob]) {
                detailsHtml += `Doğum Tarihi: ${parts[colMap.dob].trim()}\n`;
            }

            if (colMap.pob > -1 && parts[colMap.pob]) {
                detailsHtml += `Doğum Yeri: ${parts[colMap.pob].trim()}\n`;
            }

            if (colMap.mother > -1 && parts[colMap.mother]) {
                detailsHtml += `Anne Adı: ${parts[colMap.mother].trim()}\n`;
            }

            if (colMap.father > -1 && parts[colMap.father]) {
                detailsHtml += `Baba Adı: ${parts[colMap.father].trim()}\n`;
            }

            if (colMap.org > -1 && parts[colMap.org]) {
                detailsHtml += `Örgüt: ${parts[colMap.org].trim()}\n`;
            }

            if (colMap.listType > -1 && parts[colMap.listType]) {
                detailsHtml += `Yaptırım Türü: ${parts[colMap.listType].trim()}\n`;
            }

            if (colMap.decree > -1 && parts[colMap.decree]) {
                detailsHtml += `Karar/Gazete: ${parts[colMap.decree].trim()}\n`;
            }

            record.sourceDetails = detailsHtml.trim();

            // Determine List Name based on filename or content
            if (file.includes('IC-DONDURMA')) {
                record.list = 'TR MASAK - İç Dondurma (FETÖ/PKK/DHKP-C/DEAŞ)';
            } else if (file.includes('BIRLESMIS-MILLETLER')) {
                record.list = 'TR MASAK - BMGK Kararları';
            } else if (file.includes('YABANCI-ULKE')) {
                record.list = 'TR MASAK - Yabancı Ülke Talepleri';
            }

            allRecords.push(record);
        }
    });

    console.log(`Total records processed: ${allRecords.length}`);

    // Write to JS file
    const jsContent = `// MASAK Data generated from CSVs
// Last Updated: ${new Date().toISOString()}
window.MASAK_DATA = ${JSON.stringify(allRecords, null, 2)};
`;

    fs.writeFileSync(outputFile, jsContent, 'utf-8');
    console.log(`Successfully wrote to ${outputFile}`);

} catch (e) {
    console.error('Error processing CSVs:', e);
}
