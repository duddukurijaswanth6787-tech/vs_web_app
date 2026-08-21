const fs = require('fs');
const path = require('path');

const NEXT_DIR = path.join(__dirname, '..', '.next');

// Helper to format bytes
function formatKB(bytes) {
  return (bytes / 1024).toFixed(2) + ' KB';
}

function getChunkSize(chunkPath) {
  const fullPath = path.join(NEXT_DIR, chunkPath);
  if (fs.existsSync(fullPath)) {
    return fs.statSync(fullPath).size;
  }
  return 0;
}

// Find all build-manifests
const routes = {
  'Homepage (/)': 'server/app/page/build-manifest.json',
  'Category (/categories/[slug])': 'server/app/categories/[slug]/page/build-manifest.json',
  'Product details (/product/[id])': 'server/app/product/[id]/page/build-manifest.json',
  'Search (/search)': 'server/app/search/page/build-manifest.json',
  'Checkout (/checkout)': 'server/app/checkout/page/build-manifest.json',
  'Admin Dashboard (/admin)': 'server/app/admin/page/build-manifest.json',
};

console.log('### Route JS Bundle Analysis');
console.log('| Route | Initial JS Chunks | Total Downloaded size (Gzipped estimate / Uncompressed) |');
console.log('|---|---|---|');

Object.entries(routes).forEach(([name, manifestRelPath]) => {
  const manifestPath = path.join(NEXT_DIR, manifestRelPath);
  if (!fs.existsSync(manifestPath)) {
    console.log(`| ${name} | Manifest not found | - |`);
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const chunks = [
    ...(manifest.polyfillFiles || []),
    ...(manifest.rootMainFiles || []),
    ...(manifest.js || []),
  ];

  // Remove duplicates
  const uniqueChunks = Array.from(new Set(chunks));

  let totalSize = 0;
  uniqueChunks.forEach(chunk => {
    totalSize += getChunkSize(chunk);
  });

  console.log(`| ${name} | ${uniqueChunks.length} chunks | ${formatKB(totalSize)} |`);
});

// List largest chunks
console.log('\n### Top 10 Largest Client-Side JS Chunks');
console.log('| Chunk Filename | Size (Uncompressed) |');
console.log('|---|---|');

const staticChunksDir = path.join(NEXT_DIR, 'static', 'chunks');
if (fs.existsSync(staticChunksDir)) {
  function getFiles(dir, files = []) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        getFiles(fullPath, files);
      } else if (file.endsWith('.js')) {
        files.push({
          relPath: path.relative(NEXT_DIR, fullPath).replace(/\\/g, '/'),
          size: fs.statSync(fullPath).size
        });
      }
    });
    return files;
  }

  const allChunks = getFiles(staticChunksDir);
  allChunks.sort((a, b) => b.size - a.size);
  allChunks.slice(0, 10).forEach(c => {
    console.log(`| \`${c.relPath}\` | ${formatKB(c.size)} |`);
  });
}
