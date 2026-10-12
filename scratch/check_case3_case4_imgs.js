import fs from 'fs';
import path from 'path';

function getJpgDimensions(buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xFF) break;
    const marker = buffer[offset + 1];
    if (marker === 0xC0 || marker === 0xC2) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }
    const len = buffer.readUInt16BE(offset + 2);
    offset += 2 + len;
  }
  return { width: 0, height: 0 };
}

const dir = 'c:/Users/User/Desktop/lumivis lending/src/assets/prosthetics';
const files = ['case3_before.jpg', 'case3_after.jpg', 'case4_before.jpg', 'case4_after.jpg'];

files.forEach(f => {
  const fp = path.join(dir, f);
  const stat = fs.statSync(fp);
  const buf = fs.readFileSync(fp);
  const dims = getJpgDimensions(buf);
  console.log(`${f}: ${dims.width}x${dims.height}px, ${stat.size} bytes (${(stat.size / 1024).toFixed(1)} KB)`);
});
