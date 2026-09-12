import { readFileSync, writeFileSync } from 'fs';

const path = 'src/layouts/BaseLayout.astro';
let text = readFileSync(path, 'utf8');

// Remove EN and UZ exp placeholder lines
text = text.replace(/          "doctor\.\d\.exp": "Experience: TBD",\r?\n/g, '');
text = text.replace(/          "doctor\.\d\.exp": "Tajriba: aniqlanmoqda",\r?\n/g, '');

writeFileSync(path, text, 'utf8');
console.log('Done: removed all EN/UZ doctor exp placeholder lines');
