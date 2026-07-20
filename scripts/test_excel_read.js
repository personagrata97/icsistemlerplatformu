const path = require('path');
const xlsx = require(path.join(__dirname, '..', 'backend', 'node_modules', 'xlsx'));
const fs = require('fs');

const filePath = path.join(__dirname, '..', 'backend', 'scripts', 'mock_sozlesmeler.xlsx');
const buffer = fs.readFileSync(filePath);
const workbook = xlsx.read(buffer, { type: 'buffer' });
console.log('SheetNames:', workbook.SheetNames);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rawData = xlsx.utils.sheet_to_json(sheet);
console.log('rawData length:', rawData.length);
console.log('rawData sample:', rawData[0]);
