const sharp = require('sharp');
const fs = require('fs');

async function inspectImages() {
  const images = [
    {
      id: 11,
      name: 'Carl Zeiss OPMI VISU 200',
      orig: 'src/assets/equipment/eq11.jpg',
      webp: 'dist/_astro/eq11.C-CX6g9K_Z1NYYBF.webp'
    },
    {
      id: 12,
      name: 'Keeler Professional',
      orig: 'src/assets/equipment/eq12.jpg',
      webp: 'dist/_astro/eq12.BkJadAQi_Z3oKwl.webp'
    },
    {
      id: 13,
      name: 'Keeler Vantage Plus LED',
      orig: 'src/assets/equipment/eq13.jpg',
      webp: 'dist/_astro/eq13.Bb3QkZa2_Z1gug3s.webp'
    },
    {
      id: 14,
      name: 'MES PFC01',
      orig: 'src/assets/equipment/eq14.jpg',
      webp: 'dist/_astro/eq14.BTZZO1dF_aoPIU.webp'
    }
  ];

  for (const img of images) {
    console.log(`\n==============================================`);
    console.log(`ID ${img.id}: ${img.name}`);
    console.log(`Original: ${img.orig}`);
    console.log(`WebP in dist: ${img.webp}`);

    // Extract the left 128px strip and right 128px strip from the original
    // And convert to PNG to save in scratch for direct review
    await sharp(img.orig)
      .extract({ left: 0, top: 0, width: 128, height: 768 })
      .toFile(`scratch/crop_detail_id${img.id}_left128.png`);

    await sharp(img.orig)
      .extract({ left: 896, top: 0, width: 128, height: 768 })
      .toFile(`scratch/crop_detail_id${img.id}_right128.png`);

    // Also extract the central 768x768 that Astro converted
    await sharp(img.orig)
      .extract({ left: 128, top: 0, width: 768, height: 768 })
      .resize(640, 640)
      .toFile(`scratch/crop_detail_id${img.id}_center768.png`);

    // Also copy the actual dist webp as png to view easily
    await sharp(img.webp)
      .toFile(`scratch/crop_dist_id${img.id}.png`);

    // Calculate standard deviation / variation in the left and right strips to see if there is subject content
    const leftStats = await sharp(img.orig).extract({ left: 0, top: 0, width: 128, height: 768 }).stats();
    const rightStats = await sharp(img.orig).extract({ left: 896, top: 0, width: 128, height: 768 }).stats();
    const centerStats = await sharp(img.orig).extract({ left: 128, top: 0, width: 768, height: 768 }).stats();

    console.log('Left 128px stats (stdev per channel):', leftStats.channels.map(c => Math.round(c.stdev)));
    console.log('Right 128px stats (stdev per channel):', rightStats.channels.map(c => Math.round(c.stdev)));
  }
}

inspectImages().catch(console.error);
