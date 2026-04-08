import { downloadFile } from './utils.js';

const filename = process.argv[2];

if (!filename) {
    console.error('Usage: indx-<command>');
    process.exit(1);
}

await downloadFile(filename);
