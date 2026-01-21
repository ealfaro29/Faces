const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const rootDir = path.resolve(__dirname, 'photos');
const deleteOriginal = true; // Set to true to delete PNGs after conversion

async function convertImages() {
    console.log(`🚀 Starting image conversion in ${rootDir}...`);
    let count = 0;
    let savedBytes = 0;

    async function processDirectory(directory) {
        const entries = fs.readdirSync(directory, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(directory, entry.name);

            if (entry.isDirectory()) {
                await processDirectory(fullPath);
            } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) {
                const targetPath = fullPath.replace(/\.png$/i, '.webp');

                // Skip if webp exists and is newer
                if (fs.existsSync(targetPath)) {
                    const pngStat = fs.statSync(fullPath);
                    const webpStat = fs.statSync(targetPath);
                    if (webpStat.mtimeMs > pngStat.mtimeMs) continue;
                }

                try {
                    await sharp(fullPath)
                        .webp({ quality: 80 })
                        .toFile(targetPath);

                    const pngSize = fs.statSync(fullPath).size;
                    const webpSize = fs.statSync(targetPath).size;
                    savedBytes += (pngSize - webpSize);
                    count++;

                    console.log(`✅ Converted: ${entry.name} (${(pngSize / 1024).toFixed(1)}KB -> ${(webpSize / 1024).toFixed(1)}KB)`);

                    if (deleteOriginal) {
                        fs.unlinkSync(fullPath);
                        // console.log(`🗑️ Deleted original: ${entry.name}`);
                    }
                } catch (err) {
                    console.error(`❌ Error converting ${entry.name}:`, err.message);
                }
            }
        }
    }

    await processDirectory(rootDir);
    console.log(`\n🎉 Conversion complete!`);
    console.log(`🖼️  Processed ${count} images.`);
    console.log(`💾 Saved ${(savedBytes / 1024 / 1024).toFixed(2)} MB.`);
}

convertImages().catch(err => console.error("Fatal error:", err));
