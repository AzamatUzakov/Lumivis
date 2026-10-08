import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function inspect() {
  const dir = 'src/assets/prosthetics';
  const files = fs.readdirSync(dir).filter(f => f.startsWith('case')).sort();

  console.log('=== CASE IMAGES INSPECTION REPORT ===');
  for (const f of files) {
    const filePath = path.join(dir, f);
    const stat = fs.statSync(filePath);
    const meta = await sharp(filePath).metadata();
    const sizeKB = (stat.size / 1024).toFixed(2);
    console.log(`${f.padEnd(16)} | ${meta.width}x${meta.height}px | ${meta.format.toUpperCase()} | ${sizeKB} KB`);
  }
}

inspect().catch(console.error);
