const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const releaseDir = path.resolve(__dirname, "..", process.argv[2] || "release");
const outputFile = path.join(releaseDir, "checksums.txt");

function sha256(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function main() {
  if (!fs.existsSync(releaseDir)) {
    throw new Error(`Release directory does not exist: ${releaseDir}`);
  }

  const files = fs.readdirSync(releaseDir)
    .filter((name) => /\.(exe|blockmap)$/i.test(name))
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    throw new Error(`No release artifacts found in ${releaseDir}`);
  }

  const lines = files.map((name) => `${sha256(path.join(releaseDir, name))}  ${name}`);
  fs.writeFileSync(outputFile, `${lines.join("\n")}\n`, "utf8");
  console.log(`Wrote ${outputFile}`);
}

main();
