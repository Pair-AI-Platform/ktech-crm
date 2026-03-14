import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  // Step 1: Go to login page and enter demo mode
  console.log('=== Step 1: Navigating to login page ===');
  await page.goto(BASE + '/login');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/test-01-login.png' });
  console.log('Screenshot: /tmp/test-01-login.png');

  // Click "Enter Demo Mode" button
  console.log('Clicking Demo Mode button...');
  const demoBtn = page.getByText('Demo Mode', { exact: false });
  if (await demoBtn.isVisible()) {
    await demoBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('Entered demo mode, current URL:', page.url());
  } else {
    console.log('No demo button found, trying to proceed...');
  }
  await page.screenshot({ path: '/tmp/test-02-dashboard.png' });
  console.log('Screenshot: /tmp/test-02-dashboard.png');

  // Step 2: Navigate to calendar
  console.log('\n=== Step 2: Navigate to calendar ===');
  await page.goto(BASE + '/dashboard/calendar');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/test-03-calendar.png' });
  console.log('Screenshot: /tmp/test-03-calendar.png');

  // Step 3: Click "Book Appointment" button
  console.log('\n=== Step 3: Opening appointment booking wizard ===');
  const bookBtn = page.getByText('Book Appointment', { exact: false }).first();
  if (await bookBtn.isVisible()) {
    await bookBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/tmp/test-04-booking-wizard.png' });
    console.log('Screenshot: /tmp/test-04-booking-wizard.png');
  } else {
    console.log('Book Appointment button not found, looking for alternatives...');
    // Try the + button or other booking trigger
    const addBtn = page.locator('button').filter({ hasText: /add|new|book|\+/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(1500);
    }
    await page.screenshot({ path: '/tmp/test-04-booking-wizard.png' });
    console.log('Screenshot: /tmp/test-04-booking-wizard.png');
  }

  // Step 4: Fill in the appointment form
  // Since it's single form mode on calendar page, all fields should be visible
  console.log('\n=== Step 4: Filling appointment form ===');

  // Search and select a lead
  const leadSearch = page.locator('input[placeholder*="Search"], input[placeholder*="search"], input[placeholder*="lead"], input[placeholder*="Lead"]').first();
  if (await leadSearch.isVisible()) {
    await leadSearch.fill('a');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/test-05-lead-search.png' });
    console.log('Screenshot: /tmp/test-05-lead-search.png');

    // Click first lead result
    const leadOption = page.locator('[role="option"], [role="listbox"] > *, .lead-item, [data-lead], button').filter({ hasText: /\w+/ }).first();
    // Try clicking any result that appears in a dropdown/list
    const results = page.locator('.absolute, [role="listbox"], [role="option"]').first();
    if (await results.isVisible()) {
      const firstResult = results.locator('div[role="option"], button, div.cursor-pointer, div').first();
      await firstResult.click();
      await page.waitForTimeout(500);
    }
  }

  await page.screenshot({ path: '/tmp/test-06-after-lead.png' });
  console.log('Screenshot: /tmp/test-06-after-lead.png');

  // Take a snapshot of the full form to understand the layout
  const formHTML = await page.locator('form, [role="dialog"], .booking, .wizard, .appointment').first().innerHTML().catch(() => 'not found');
  console.log('Form area found:', formHTML.substring(0, 200));

  // Let's try a more targeted approach - look at all visible form elements
  const inputs = await page.locator('input:visible, select:visible, textarea:visible, button:visible').all();
  console.log(`\nFound ${inputs.length} visible form elements:`);
  for (let i = 0; i < Math.min(inputs.length, 20); i++) {
    const tag = await inputs[i].evaluate(el => el.tagName);
    const type = await inputs[i].getAttribute('type').catch(() => '');
    const placeholder = await inputs[i].getAttribute('placeholder').catch(() => '');
    const text = await inputs[i].textContent().catch(() => '');
    console.log(`  [${i}] ${tag} type=${type} placeholder="${placeholder}" text="${text?.substring(0, 50)}"`);
  }

  await page.screenshot({ path: '/tmp/test-07-form-state.png', fullPage: true });
  console.log('Screenshot: /tmp/test-07-form-state.png');

  await browser.close();
  console.log('\n=== Test script completed ===');
})();
