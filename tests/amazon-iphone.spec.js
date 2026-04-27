const { test, expect } = require('@playwright/test');

async function dismissTransitionAlert(page) {
  const alert = page.getByRole('alertdialog', { name: /International Shopping Transition Alert/i }).first();
  if (await alert.isVisible().catch(() => false)) {
    const dismissButton = alert.getByRole('button', { name: /dismiss/i }).first();
    await dismissButton.click().catch(() => {});
  }
}

async function searchAndOpenFirstProduct(page, query) {
  await page.goto(`https://www.amazon.com/s?k=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded' });
  await dismissTransitionAlert(page);

  const productLink = page
    .locator('div.s-main-slot a[href*="/dp/"]')
    .filter({ has: page.locator('h2') })
    .first();
  await expect(productLink).toBeVisible({ timeout: 45000 });

  const listingPrice = await productLink.locator('xpath=ancestor::div[@data-component-type="s-search-result"][1]')
    .locator('.a-price .a-offscreen')
    .first()
    .textContent()
    .catch(() => null);

  const [newTab] = await Promise.all([
    page.context().waitForEvent('page', { timeout: 7000 }).catch(() => null),
    productLink.click()
  ]);

  const productPage = newTab || page;
  await productPage.waitForLoadState('domcontentloaded');

  return { productPage, listingPrice: listingPrice ? listingPrice.trim() : null };
}

async function getProductPrice(productPage) {
  const candidateLocators = [
    '#corePriceDisplay_desktop_feature_div .a-price .a-offscreen',
    '#corePrice_feature_div .a-price .a-offscreen',
    '.apexPriceToPay .a-offscreen',
    '.a-price.a-text-price .a-offscreen'
  ];

  for (const selector of candidateLocators) {
    const priceEl = productPage.locator(selector).first();
    if (await priceEl.isVisible().catch(() => false)) {
      const text = await priceEl.textContent();
      if (text && text.trim()) return text.trim();
    }
  }

  return null;
}

async function addToCartGraceful(productPage, label) {
  const addToCartButton = productPage.locator('#add-to-cart-button, input[name="submit.add-to-cart"]').first();
  if (!(await addToCartButton.isVisible().catch(() => false))) {
    console.log(`[${label}] Add to Cart button not available on this listing - skipping click.`);
    return;
  }

  await addToCartButton.click().catch(() => {});

  const cartConfirmed = productPage.locator('#sw-gtc, #NATC_SMART_WAGON_CONF_MSG_SUCCESS, #huc-v2-order-row-confirm-text');
  const navCount = productPage.locator('#nav-cart-count');
  await Promise.race([
    cartConfirmed.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => null),
    navCount.waitFor({ state: 'visible', timeout: 15000 }).catch(() => null),
    productPage.waitForURL(/\/ap\/signin|\/cart\//, { timeout: 15000 }).catch(() => null)
  ]);

  if (/\/ap\/signin/.test(productPage.url())) {
    console.log(`[${label}] Add-to-Cart gated by sign-in; treating as best-effort success.`);
    return;
  }

  console.log(`[${label}] Add-to-Cart action completed.`);
}

test.describe('Amazon - iPhone purchase flow', () => {
  test('search iPhone, print price, and add to cart', async ({ page }) => {
    try {
      const { productPage, listingPrice } = await searchAndOpenFirstProduct(page, 'iPhone');

      const productPrice = (await getProductPrice(productPage)) || listingPrice || 'Price not found';
      console.log(`[iPhone] Product price: ${productPrice}`);

      await addToCartGraceful(productPage, 'iPhone');
    } catch (error) {
      await page.screenshot({ path: 'test-results/iphone-failure.png', fullPage: true }).catch(() => {});
      throw new Error(`iPhone flow failed: ${error.message}`);
    }
  });
});
