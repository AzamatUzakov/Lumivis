const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const dir = 'c:\\Users\\User\\Downloads\\Telegram Desktop';
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.JPG') || f.endsWith('.jpg'));
  for (const f of files) {
    const full = path.join(dir, f);
    const meta = await sharp(full).metadata();
    console.log(f, `${meta.width}x${meta.height}`, (fs.statSync(full).size / 1024).toFixed(0) + 'KB');
  }
}

main().catch(console.error);
