/**
 * Bytenode Compile Helper - Run inside Electron
 * Usage: electron compile-helper.js <input.js> <output.jsc>
 * 
 * IMPORTANT: Run from the same directory as the input file
 * to ensure correct relative path embedding
 */
const bytenode = require('bytenode');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
if (args.length < 2) {
    console.error('Usage: electron compile-helper.js <input.js> <output.jsc>');
    process.exit(1);
}

// Resolve to absolute paths
const inputFile = path.resolve(args[0]);
const outputFile = path.resolve(args[1]);

// Verify input exists
if (!fs.existsSync(inputFile)) {
    console.error('Input file not found:', inputFile);
    process.exit(1);
}

console.log(`Compiling ${path.basename(inputFile)} → ${path.basename(outputFile)}`);

// Change to input file directory for correct path embedding
const originalDir = process.cwd();
process.chdir(path.dirname(inputFile));

bytenode.compileFile(inputFile, outputFile)
    .then(() => {
        // Restore original directory
        process.chdir(originalDir);
        console.log('Compilation successful!');
        process.exit(0);
    })
    .catch((err) => {
        process.chdir(originalDir);
        console.error('Compilation failed:', err.message);
        process.exit(1);
    });
