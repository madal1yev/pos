const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`CONSOLE: ${msg.text()}`);
  });
  page.on('pageerror', err => errors.push(`PAGE: ${err.message}`));

  try {
    console.log('1. Opening login...');
    await page.goto('https://frontend-smoky-three-96.vercel.app', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('   URL:', page.url());
    
    const emailInput = await page.$('input[type="email"]');
    console.log('   Email input:', !!emailInput);
    
    if (emailInput) {
      console.log('2. Login...');
      await page.fill('input[type="email"]', 'admin@pos.com');
      await page.fill('input[type="password"]', 'password');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);
      console.log('   URL after:', page.url());
      
      await page.screenshot({ path: 'test-result.png', fullPage: true });
      
      const bodyText = await page.textContent('body');
      const hasError = bodyText?.includes('Xatolik yuz berdi');
      const hasDashboard = bodyText?.includes('Dashboard') || bodyText?.includes('Sotuv') || bodyText?.includes('POS');
      console.log('   Has error text:', hasError);
      console.log('   Has dashboard:', hasDashboard);
      console.log('   Body (300 chars):', bodyText?.substring(0, 300));
    }
  } catch (e) {
    errors.push(`NAV: ${e.message}`);
  }
  
  console.log('\n=== ERRORS ===');
  errors.length === 0 ? console.log('NONE!') : errors.forEach((e, i) => console.log(`[${i+1}]`, e));
  
  await browser.close();
})();
