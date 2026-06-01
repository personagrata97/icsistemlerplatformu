const https = require('https');
const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, '..', 'public', 'fonts');

if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
}

const fonts = [
    {
        name: 'Poppins-Regular.ttf',
        url: 'https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Regular.ttf'
    },
    {
        name: 'Poppins-SemiBold.ttf',
        url: 'https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-SemiBold.ttf'
    },
    {
        name: 'Poppins-Bold.ttf',
        url: 'https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Bold.ttf'
    }
];

async function download(font) {
    const dest = path.join(fontsDir, font.name);
    const file = fs.createWriteStream(dest);

    console.log(`Downloading ${font.name}...`);
    
    return new Promise((resolve, reject) => {
        https.get(font.url, { followRedirect: true }, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                // Handle redirect
                https.get(response.headers.location, (res) => {
                    res.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        console.log(`Finished ${font.name}`);
                        resolve();
                    });
                }).on('error', (err) => {
                    fs.unlink(dest, () => reject(err));
                });
            } else {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`Finished ${font.name}`);
                    resolve();
                });
            }
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

async function main() {
    try {
        for (const font of fonts) {
            await download(font);
        }
        console.log('All fonts downloaded successfully!');
    } catch (err) {
        console.error('Download failed:', err);
        process.exit(1);
    }
}

main();
