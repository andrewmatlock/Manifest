import { findManifestFiles, downloadFile, shouldPreserveFile } from './utils.js';

export async function runUpdate(directory = '.') {
    console.log(`Scanning for Manifest files in ${directory}...`);

    const files = await findManifestFiles(directory);

    if (files.length === 0) {
        console.log('No Manifest files found.');
        return;
    }

    console.log(`Found ${files.length} Manifest file(s):`);
    files.forEach(file => console.log(`  - ${file}`));
    console.log('');

    let updatedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
        const filename = file.split('/').pop();

        if (shouldPreserveFile(file)) {
            console.log(`⚠ Skipped ${file} (preserved)`);
            skippedCount++;
            continue;
        }

        try {
            // Pass the full file path to preserve directory structure
            await downloadFile(filename, file);
            updatedCount++;
        } catch (error) {
            console.error(`✗ Failed to update ${file}:`, error.message);
        }
    }

    console.log(`\nUpdated ${updatedCount} files${skippedCount > 0 ? `, skipped ${skippedCount} files` : ''}`);
}

// If run directly, use command line arguments
if (import.meta.url === `file://${process.argv[1]}`) {
    const directory = process.argv[2] || '.';
    await runUpdate(directory);
}
