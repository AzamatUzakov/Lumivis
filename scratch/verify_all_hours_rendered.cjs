const fs = require('fs');

const pages = [
  'dist/ru/index.html', 'dist/uz/index.html', 'dist/en/index.html',
  'dist/ru/privacy/index.html', 'dist/uz/privacy/index.html', 'dist/en/privacy/index.html'
];

pages.forEach(p => {
  if (!fs.existsSync(p)) {
    console.log(`[${p}] NOT FOUND`);
    return;
  }
  const c = fs.readFileSync(p, 'utf8');
  console.log(`\n================ ${p} ================`);
  const schema = c.match(/"opens":\s*"([^"]+)"/);
  const headerHours = c.match(/class="header-hours"[^>]*>([^<]+)<\/span>/);
  const mobHours = c.match(/class="mobile-menu__hours-badge"[\s\S]*?<span[^>]*>([^<]+)<\/span>/);
  const mapHours = c.match(/data-i18n="map\.hours"[^>]*>([^<]+)<\/p>/);
  const footerHours = c.match(/class="footer-contacts__hours"[^>]*>([^<]+)<\/p>/);

  console.log('  Schema opens: ', schema ? schema[1] : 'N/A');
  console.log('  Header hours: ', headerHours ? headerHours[1].trim() : 'N/A');
  console.log('  Mobile hours: ', mobHours ? mobHours[1].trim() : 'N/A');
  console.log('  Map hours:    ', mapHours ? mapHours[1].trim() : 'N/A');
  console.log('  Footer hours: ', footerHours ? footerHours[1].trim() : 'N/A');
});
