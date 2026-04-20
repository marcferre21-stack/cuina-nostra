/**
 * Script d'optimització d'imatges amb Sharp
 * -----------------------------------------
 *
 * Ús: npm run optimize-images
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// ---------------------------------------------------------------------------
// Configuració
// ---------------------------------------------------------------------------

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SRC_IMAGES = path.join(PROJECT_ROOT, 'src', 'images');
const ORIGINALS_DIR = fs.existsSync(path.join(SRC_IMAGES, 'originals'))
  ? path.join(SRC_IMAGES, 'originals')
  : SRC_IMAGES;
const OUTPUT_DIR = path.join(SRC_IMAGES, 'optimized');
const REPORT_PATH = path.join(__dirname, 'optimization-report.json');

// Amples per a les versions responsive
const WIDTHS = [480, 768, 1200, 1600];

// Qualitats i configuracions per format (valors conservadors per no perdre
// qualitat visible en imatges de cuina).
const FORMATS = {
  avif: { quality: 50, effort: 5 },
  webp: { quality: 72 },
  jpg:  { quality: 78, mozjpeg: true },
};

// Imatges que necessiten "direcció d'art"
const ART_DIRECTION = new Set([
  'hero.jpg',
  'pa-amb-tomaquet.jpg',
  'fideua.jpg',
]);

// ---------------------------------------------------------------------------
// Utilitats
// ---------------------------------------------------------------------------

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function writeVariant(pipeline, outputPath, format) {
  const cloned = pipeline.clone();
  const opts = FORMATS[format];
  let finalPipeline;

  if (format === 'avif') {
    finalPipeline = cloned.avif(opts);
  } else if (format === 'webp') {
    finalPipeline = cloned.webp(opts);
  } else {
    finalPipeline = cloned.jpeg(opts);
  }

  await finalPipeline.toFile(outputPath);
  return fs.statSync(outputPath).size;
}

// ---------------------------------------------------------------------------
// Processament per imatge
// ---------------------------------------------------------------------------

async function processImage(fileName, report) {
  const inputPath = path.join(ORIGINALS_DIR, fileName);
  const originalSize = fs.statSync(inputPath).size;
  const base = path.parse(fileName).name;

  console.log(`\n→ ${fileName}  (${formatBytes(originalSize)})`);

  const variants = [];

  // Variants normals (crop landscape per defecte)
  for (const width of WIDTHS) {
    const pipeline = sharp(inputPath).resize({
      width,
      withoutEnlargement: true,
    });

    for (const format of Object.keys(FORMATS)) {
      const extension = format === 'jpg' ? 'jpg' : format;
      const outputName = `${base}-${width}w.${extension}`;
      const outputPath = path.join(OUTPUT_DIR, outputName);
      const size = await writeVariant(pipeline, outputPath, format);
      variants.push({ width, format, file: outputName, size });
      console.log(`   ${outputName.padEnd(40)}  ${formatBytes(size)}`);
    }
  }

  // Variants d'art (crop vertical per a mòbils)
  if (ART_DIRECTION.has(fileName)) {
    const mobileWidths = [480, 768];
    for (const width of mobileWidths) {
      // Crop vertical: relació aspecte 3:4, centrat a la imatge
      const pipeline = sharp(inputPath).resize({
        width,
        height: Math.round(width * (4 / 3)),
        fit: 'cover',
        position: 'attention',
        withoutEnlargement: true,
      });

      for (const format of Object.keys(FORMATS)) {
        const extension = format === 'jpg' ? 'jpg' : format;
        const outputName = `${base}-mobile-${width}w.${extension}`;
        const outputPath = path.join(OUTPUT_DIR, outputName);
        const size = await writeVariant(pipeline, outputPath, format);
        variants.push({ width, format, file: outputName, size, crop: 'mobile' });
        console.log(`   ${outputName.padEnd(40)}  ${formatBytes(size)}  [crop mòbil]`);
      }
    }
  }

  // Resum per imatge juntamenta mb comparació 
  const referenceNew = variants.find(
    (v) => v.width === 1200 && v.format === 'webp'
  );
  const improvement = referenceNew
    ? (1 - referenceNew.size / originalSize) * 100
    : null;

  report.push({
    name: fileName,
    originalFormat: path.extname(fileName).replace('.', '').toUpperCase(),
    originalSize,
    originalSizeHuman: formatBytes(originalSize),
    optimizedFormat: 'WebP (1200w)',
    optimizedSize: referenceNew ? referenceNew.size : null,
    optimizedSizeHuman: referenceNew ? formatBytes(referenceNew.size) : null,
    improvementPercent: improvement ? Number(improvement.toFixed(1)) : null,
    variants,
  });
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  ensureDir(OUTPUT_DIR);

  const allFiles = fs
    .readdirSync(ORIGINALS_DIR)
    .filter((f) => /\.(jpe?g|png)$/i.test(f));

  if (allFiles.length === 0) {
    console.error('No s\'han trobat imatges a', ORIGINALS_DIR);
    process.exit(1);
  }

  console.log(`Optimitzant ${allFiles.length} imatges...`);
  console.log(`  Origen:  ${ORIGINALS_DIR}`);
  console.log(`  Destí:   ${OUTPUT_DIR}\n`);

  const report = [];
  for (const fileName of allFiles) {
    await processImage(fileName, report);
  }

  // Resum global
  const totalOriginal = report.reduce((a, r) => a + r.originalSize, 0);
  const totalOptimized = report.reduce(
    (a, r) => a + (r.optimizedSize || 0),
    0
  );
  const totalImprovement = (1 - totalOptimized / totalOriginal) * 100;

  const summary = {
    generatedAt: new Date().toISOString(),
    totalImages: report.length,
    totalOriginalBytes: totalOriginal,
    totalOptimizedBytes: totalOptimized,
    totalOriginalHuman: formatBytes(totalOriginal),
    totalOptimizedHuman: formatBytes(totalOptimized),
    totalImprovementPercent: Number(totalImprovement.toFixed(1)),
    images: report,
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(summary, null, 2));

  console.log('\n==========================================');
  console.log(` Total original   : ${summary.totalOriginalHuman}`);
  console.log(` Total optimitzat : ${summary.totalOptimizedHuman}`);
  console.log(` Millora global   : ${summary.totalImprovementPercent}%`);
  console.log(` Informe          : ${REPORT_PATH}`);
  console.log('==========================================\n');
}

main().catch((err) => {
  console.error('Error durant l\'optimització:', err);
  process.exit(1);
});
