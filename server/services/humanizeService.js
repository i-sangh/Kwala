const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

class HumanizeService {
    constructor() {
        this.browser = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (!this.isInitialized) {
            try {
                this.browser = await puppeteer.launch({
                    headless: true,
                    executablePath: process.env.CHROME_BIN || null,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu',
                        '--headless',
                        '--disable-software-rasterizer',
                        '--disable-features=site-per-process',
                        '--window-size=1920x1080'
                    ],
                    protocolTimeout: 90000,
                    timeout: 90000,
                    ignoreHTTPSErrors: true
                });

                this.browser.on('disconnected', async () => {
                    console.log('Browser disconnected. Cleaning up...');
                    this.isInitialized = false;
                    this.browser = null;
                });

                this.isInitialized = true;
                console.log('Browser initialized successfully');
            } catch (error) {
                console.error('Failed to initialize browser:', error);
                throw new Error('Browser initialization failed');
            }
        }
    }

    async createPage() {
        try {
            const page = await this.browser.newPage();
            await page.setDefaultNavigationTimeout(60000);
            await page.setDefaultTimeout(60000);

            // Set viewport
            await page.setViewport({
                width: 1920,
                height: 1080,
                deviceScaleFactor: 1,
            });

            // Set user agent
            await page.setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            );

            return page;
        } catch (error) {
            console.error('Error creating page:', error);
            throw new Error('Failed to create page');
        }
    }

    async humanizeContent(content) {
        let page = null;
        try {
            if (!this.isInitialized || !this.browser) {
                console.log('Initializing browser...');
                await this.initialize();
            }

            console.log('Creating new page...');
            page = await this.createPage();

            console.log('Navigating to humanizeai.pro...');
            await page.goto('https://www.humanizeai.pro/', {
                waitUntil: 'networkidle2',
                timeout: 60000
            });

            console.log('Waiting for textarea...');
            const inputSelector = 'textarea.InputContainer_inputContainer__jeGwX';
            await page.waitForSelector(inputSelector, { timeout: 30000 });

            console.log('Typing content into textarea...');
            await page.focus(inputSelector);
            await page.type(inputSelector, content);

            console.log('Clicking the Humanize AI button...');
            const buttonSelector = 'button.ParaphraseButton_button__nWdlZ';
            await page.waitForSelector(buttonSelector, { timeout: 30000 });
            await page.click(buttonSelector);

            console.log('Waiting for humanized content...');
            const resultSelector = '.OutputContainer_output__wvgeh';
            await page.waitForSelector(resultSelector, { timeout: 30000 });

            console.log('Extracting humanized content...');
            const humanizedContent = await page.evaluate(() => {
                const output = document.querySelector('.OutputContainer_output__wvgeh');
                return output ? output.textContent.trim() : '';
            });

            if (!humanizedContent) {
                throw new Error('No content generated');
            }

            console.log('Content humanized successfully');
            return humanizedContent;
        } catch (error) {
            console.error('Error during humanization:', error);
            throw new Error('Failed to humanize content');
        } finally {
            if (page) await page.close();
        }
    }

    async cleanup() {
        if (this.browser) {
            try {
                console.log('Cleaning up browser instance...');
                await this.browser.close();
            } catch (error) {
                console.error('Error during cleanup:', error);
            } finally {
                this.browser = null;
                this.isInitialized = false;
            }
        }
    }
}

module.exports = new HumanizeService();
