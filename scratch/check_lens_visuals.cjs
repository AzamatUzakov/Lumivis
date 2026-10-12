const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const root = 'c:\\Users\\User\\Desktop\\lumivis lending';
  const lensesDir = path.join(root, 'src', 'assets', 'lenses');
  const outDir = path.join(root, 'scratch', 'lens_crops');

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (let i = 1; i <= 6; i++) {
    const file = path.join(lensesDir, `lens${i}.png`);
    const img = sharp(file);
    const meta = await img.metadata();
    
    // Zoom in on center to see details
    const cropW = Math.round(meta.width * 0.7);
    const cropH = Math.round(meta.height * 0.7);
    const left = Math.round((meta.width - cropW) / 2);
    const top = Math.round((meta.height - cropH) / 2);

    await sharp(file)
      .extract({ left, top, width: cropW, height: cropH })
      .toFile(path.join(outDir, `lens${i}_center.png`));
      
    console.log(`Saved center crop for lens${i}`);
  }
}

main().catch(console.error);
