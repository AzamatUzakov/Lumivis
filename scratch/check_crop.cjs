const sharp = require('sharp');
const fs = require('fs');

async function check() {
  const origs = [
    { id: 11, name: 'Zeiss Microscope', file: 'src/assets/equipment/eq11.jpg', dist: 'dist/_astro/eq11.C-CX6g9K_Z1NYYBF.webp' },
    { id: 12, name: 'Keeler Professional', file: 'src/assets/equipment/eq12.jpg', dist: 'dist/_astro/eq12.BkJadAQi_Z3oKwl.webp' },
    { id: 13, name: 'Keeler Vantage Plus LED', file: 'src/assets/equipment/eq13.jpg', dist: 'dist/_astro/eq13.Bb3QkZa2_Z1gug3s.webp' },
    { id: 14, name: 'MES PFC01', file: 'src/assets/equipment/eq14.jpg', dist: 'dist/_astro/eq14.BTZZO1dF_aoPIU.webp' }
  ];

  for (const o of origs) {
    const origMeta = await sharp(o.file).metadata();
    const distMeta = await sharp(o.dist).metadata();
    console.log(`\n=== ID ${o.id}: ${o.name} ===`);
    console.log(`Original: ${origMeta.width}x${origMeta.height} | Dist WebP: ${distMeta.width}x${distMeta.height}`);

    const raw = await sharp(o.file).raw().toBuffer({ resolveWithObject: true });
    const channels = raw.info.channels;
    const corner = [raw.data[0], raw.data[1], raw.data[2]];

    let minX = 1024, maxX = 0, minY = 768, maxY = 0;
    for (let y = 0; y < 768; y++) {
      for (let x = 0; x < 1024; x++) {
        const idx = (y * 1024 + x) * channels;
        const r = raw.data[idx];
        const g = raw.data[idx + 1];
        const b = raw.data[idx + 2];
        const diff = Math.abs(r - corner[0]) + Math.abs(g - corner[1]) + Math.abs(b - corner[2]);
        if (diff > 45) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    console.log(`Subject bounds in original (1024x768): X=[${minX}..${maxX}], Y=[${minY}..${maxY}]`);
    console.log(`Astro 640x640 cover window in 1024x768: X=[128..896]`);

    if (minX < 128) {
      console.log(`--> CROP ALERT LEFT! Subject starts at X=${minX}, cut ${128 - minX}px on left!`);
    } else {
      console.log(`--> Left side OK (subject margin left: ${minX - 128}px)`);
    }

    if (maxX > 896) {
      console.log(`--> CROP ALERT RIGHT! Subject ends at X=${maxX}, cut ${maxX - 896}px on right!`);
    } else {
      console.log(`--> Right side OK (subject margin right: ${896 - maxX}px)`);
    }
  }
}

check().catch(console.error);
