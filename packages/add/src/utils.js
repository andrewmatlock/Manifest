import fetch from 'node-fetch';
import fs from 'fs-extra';
import path from 'path';

const CDN_BASE_URL = 'https://cdn.jsdelivr.net/npm/mnfst@latest/dist';

export async function downloadFile(filename, targetPath = null) {
    try {
        const url = `${CDN_BASE_URL}/${filename}`;
        const outputPath = targetPath || filename;
        console.log(`Downloading ${filename}...`);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const content = await response.text();

        // Write file to target path (preserves directory structure)
        await fs.writeFile(outputPath, content);

        // Get file size
        const stats = await fs.stat(outputPath);
        const fileSize = (stats.size / 1024).toFixed(1);

        console.log(`✓ Downloaded ${filename} → ${outputPath} (${fileSize}KB)`);

    } catch (error) {
        console.error(`✗ Failed to download ${filename}:`, error.message);
        process.exit(1);
    }
}

export function isManifestFile(filepath) {
    const filename = path.basename(filepath);

    // Check if filename matches Manifest file patterns
    const indxPatterns = [
        'manifest.js',
        'manifest.css',
        'manifest.theme.css',
        'manifest.code.css',
        'manifest.quickstart.js'
    ];

    return indxPatterns.includes(filename);
}

export async function findManifestFiles(directory = '.') {
    const files = [];

    try {
        const entries = await fs.readdir(directory, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(directory, entry.name);

            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                // Recursively search subdirectories
                const subFiles = await findManifestFiles(fullPath);
                files.push(...subFiles);
            } else if (entry.isFile() && isManifestFile(fullPath)) {
                files.push(fullPath);
            }
        }
    } catch (error) {
        // Ignore permission errors
    }

    return files;
}

export function shouldPreserveFile(filename) {
    const preserveFiles = ['manifest.theme.css'];
    return preserveFiles.includes(path.basename(filename));
}
