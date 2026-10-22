const fs = require('fs');
const path = require('path');
const testData = require('../../data/testData.json');

const DATA_DIR = path.resolve(__dirname, '../../data');

// Baca file CSV di folder data/ menjadi array of object (baris pertama = header)
function readCsv(fileName) {
    const content = fs.readFileSync(path.join(DATA_DIR, fileName), 'utf-8');
    const [headerLine, ...lines] = content.split(/\r?\n/).filter(line => line.trim() !== '');
    const headers = headerLine.split(',').map(h => h.trim());

    return lines.map(line => {
        const values = line.split(',');
        return headers.reduce((row, header, i) => {
            row[header] = (values[i] || '').trim();
            return row;
        }, {});
    });
}

function readJson(fileName) {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, fileName), 'utf-8'));
}

// Path absolut ke file pendukung di folder data/ (misal untuk upload)
function dataFilePath(relativePath) {
    return path.join(DATA_DIR, relativePath);
}

function getBaseUrl() {
    return process.env.BASE_URL || testData.baseUrl;
}

module.exports = { readCsv, readJson, dataFilePath, getBaseUrl, testData };
