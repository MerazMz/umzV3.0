import { chromium } from 'playwright';
import { BASE_URL, CAPTCHA_IMAGE } from '../config/constants.js';
import { getUserInput } from '../utils/getUserInput.js';

/**
 * Performs login using Playwright to handle ASP.NET WebForms complexity
 * @param {string} regno - Student registration number
 * @param {string} password - Student password
 * @returns {Promise<string>} - Cookie string for authenticated session
 */
export async function loginWithPlaywright(regno, password) {
    console.log('🌐 Opening browser for login...');

    const browser = await chromium.launch({
        headless: true
    });

    try {
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        });

        const page = await context.newPage();

        // Navigate to login page
        console.log('📄 Loading login page...');
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });

        // Fill registration number with human-like typing
        console.log('📝 Entering registration number...');
        const regnoField = page.locator('input[name="txtU"]');
        await regnoField.click();
        await page.waitForTimeout(300);
        await regnoField.type(regno, { delay: 100 });
        await page.waitForTimeout(500);
        await regnoField.blur();

        // Wait for captcha to load
        console.log('🖼️  Waiting for captcha...');
        await page.waitForSelector('#c_loginnew_examplecaptcha_CaptchaImage', { timeout: 5000 });

        // Screenshot captcha
        const captchaElement = await page.$('#c_loginnew_examplecaptcha_CaptchaImage');
        await captchaElement.screenshot({ path: CAPTCHA_IMAGE });
        console.log(`✅ Captcha saved as ${CAPTCHA_IMAGE}`);

        // Get captcha from user
        console.log(`\n📋 Please check ${CAPTCHA_IMAGE} for the captcha\n`);
        const captcha = await getUserInput('Enter Captcha: ');

        // Fill captcha with human-like typing
        console.log('🔐 Filling credentials...');
        const captchaField = page.locator('input[name="CaptchaCodeTextBox"]');
        await captchaField.click();
        await page.waitForTimeout(200);
        await captchaField.type(captcha, { delay: 120 });

        await page.waitForTimeout(400);

        // Fill password with human-like typing
        const pwdField = page.locator('input[type="password"]');
        await pwdField.click();
        await page.waitForTimeout(200);
        await pwdField.type(password, { delay: 100 });

        await page.waitForTimeout(600);

        // Click login button
        console.log('🔘 Clicking login...');
        const loginButton = page.locator('input[type="submit"][value="Login"]');
        await loginButton.click();
        await page.waitForTimeout(300);

        // Wait for navigation result
        try {
            await page.waitForURL('**/StudentDashboard.aspx', { timeout: 10000 });
            console.log('✅ Login successful!');
        } catch (error) {
            const currentUrl = page.url();
            if (currentUrl.includes('lpuums/') && !currentUrl.includes('StudentDashboard')) {
                throw new Error('Login failed - Invalid credentials or captcha');
            }
            throw error;
        }

        // Extract cookies
        console.log('🍪 Extracting cookies...');
        const cookies = await context.cookies();
        const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

        console.log('✅ Cookies extracted, closing browser...');
        await browser.close();

        return cookieString;

    } catch (error) {
        console.error('❌ Error during login:', error.message);
        await browser.close();
        throw error;
    }
}
