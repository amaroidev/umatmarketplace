/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const curatedDir = path.resolve(__dirname, '../public/curated');
const outputDir = path.resolve(__dirname, '../public/curated/optimized');

const targets = [
  { suffix: 'card', width: 900, height: 1200, quality: 82 },
  { suffix: 'thumb', width: 520, height: 680, quality: 78 },
];

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function optimizeOne(fileName) {
  const inPath = path.join(curatedDir, fileName);
  const base = path.parse(fileName).name;

  const metadata = await sharp(inPath).metadata();
  console.log(`\n${fileName} -> ${metadata.width}x${metadata.height}`);

  for (const target of targets) {
    const outName = `${base}-${target.suffix}.webp`;
    const outPath = path.join(outputDir, outName);

    await sharp(inPath)
      .resize(target.width, target.height, {
        fit: 'cover',
        position: 'attention',
      })
      .webp({ quality: target.quality })
      .toFile(outPath);

    const outStats = await fs.promises.stat(outPath);
    console.log(`  - ${outName}: ${target.width}x${target.height}, ${(outStats.size / 1024).toFixed(1)}KB`);
  }
}

async function main() {
  if (!fs.existsSync(curatedDir)) {
    throw new Error(`Curated directory not found: ${curatedDir}`);
  }

  await ensureDir(outputDir);

  const files = (await fs.promises.readdir(curatedDir))
    .filter((file) => /\.(jpe?g|png|webp)$/i.test(file));

  if (files.length === 0) {
    console.log('No curated images found to optimize.');
    return;
  }

  console.log(`Optimizing ${files.length} curated images...`);
  for (const file of files) {
    await optimizeOne(file);
  }
  console.log('\nDone. Optimized assets are in web/public/curated/optimized');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
