const sharp = require('sharp');
const { S3Client, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

const client = new S3Client({
  region: 'ap-south-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const bucket = 'vasanthi-designers-dev-bucket';
const keys = [
  'products/50890861-0fb4-4b93-91b2-231422e0fa49/images/bf440116-b297-4648-9296-639f6ebfba53.png',
  'products/50890861-0fb4-4b93-91b2-231422e0fa49/images/bf440116-b297-4648-9296-639f6ebfba53.webp',
  'products/50890861-0fb4-4b93-91b2-231422e0fa49/images/292c5ce2-79d4-42e8-b513-49a1359fdd6f.png',
];

(async () => {
  for (const key of keys) {
    try {
      const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      console.log(`${key}:`);
      console.log(`  ContentLength: ${head.ContentLength}`);
      console.log(`  ContentType: ${head.ContentType}`);
      console.log(`  exists: true`);
    } catch (e) {
      console.log(`${key}: NOT FOUND (${e.name})`);
    }
  }
  
  // Also read the first bytes of the .png to check if it's really PNG
  try {
    const get = await client.send(new GetObjectCommand({ Bucket: bucket, Key: keys[0] }));
    const chunks = [];
    for await (const chunk of get.Body) chunks.push(chunk);
    const buf = Buffer.concat(chunks);
    console.log(`\nFirst 20 bytes of ${keys[0]}:`);
    console.log(`  hex: ${buf.subarray(0, 20).toString('hex')}`);
    console.log(`  ascii: ${buf.subarray(0, 20).toString('ascii')}`);
    console.log(`  total: ${buf.length} bytes`);
    console.log(`  is PNG: ${buf[0] === 0x89 && buf[1] === 0x50}`);
    console.log(`  is SVG: ${buf.subarray(0, 5).toString() === '<?xml' || buf.subarray(0, 4).toString() === '<svg'}`);
  } catch (e) {
    console.log('Error reading:', e.message);
  }
})();
