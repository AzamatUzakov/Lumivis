const sharp = require('sharp');
const fs = require('fs');

async function generateCropComparisons() {
  const items = [
    { id: 11, name: 'Zeiss Microscope', orig: 'src/assets/equipment/eq11.jpg', dist: 'dist/_astro/eq11.C-CX6g9K_Z1NYYBF.webp' },
    { id: 12, name: 'Keeler Professional', orig: 'src/assets/equipment/eq12.jpg', dist: 'dist/_astro/eq12.BkJadAQi_Z3oKwl.webp' },
    { id: 13, name: 'Keeler Vantage Plus LED', orig: 'src/assets/equipment/eq13.jpg', dist: 'dist/_astro/eq13.Bb3QkZa2_Z1gug3s.webp' },
    { id: 14, name: 'MES PFC01', orig: 'src/assets/equipment/eq14.jpg', dist: 'dist/_astro/eq14.BTZZO1dF_aoPIU.webp' }
  ];

  for (const item of items) {
    // 1. Draw red crop lines on the original (1024x768)
    // Left cut area: 0..128, Right cut area: 896..1024
    const svgOverlay = Buffer.from(`
      <svg width="1024" height="768" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="128" height="768" fill="red" fill-opacity="0.35" />
        <rect x="896" y="0" width="128" height="768" fill="red" fill-opacity="0.35" />
        <line x1="128" y1="0" x2="128" y2="768" stroke="red" stroke-width="4" stroke-dasharray="8,8" />
        <line x1="896" y1="0" x2="896" y2="768" stroke="red" stroke-width="4" stroke-dasharray="8,8" />
        <text x="140" y="50" font-family="Arial" font-size="28" font-weight="bold" fill="red">KEEP AREA (768x768)</text>
        <text x="10" y="50" font-family="Arial" font-size="22" font-weight="bold" fill="white">CUT (128px)</text>
        <text x="906" y="50" font-family="Arial" font-size="22" font-weight="bold" fill="white">CUT (128px)</text>
      </svg>
    `);

    const markedOrig = await sharp(item.orig)
      .composite([{ input: svgOverlay }])
      .resize(512, 384)
      .png()
      .toBuffer();

    const distImg = await sharp(item.dist)
      .resize(384, 384)
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: 950,
        height: 440,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .composite([
        { input: markedOrig, top: 45, left: 20 },
        { input: distImg, top: 45, left: 550 }
      ])
      .png()
      .toFile(`scratch/crop_compare_id${item.id}.png`);

    console.log(`Saved scratch/crop_compare_id${item.id}.png`);
  }
}

generateCropComparisons().catch(console.error);
