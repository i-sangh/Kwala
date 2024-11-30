const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const nlp = require('compromise');

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
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--disable-gpu',
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

    // Randomized fast typing
    async typeContent(page, selector, content) {
        for (const char of content) {
            await page.type(selector, char, { delay: this.randomTypingDelay(1, 3) });
        }
    }

    randomTypingDelay(min, max) {
        return Math.floor(Math.random() * (0.5 - 0.1 + 1)) + 0.1;
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
            await this.typeContent(page, inputSelector, content);

            console.log('Waiting 0.5 seconds before clicking Humanize AI button...');
            await new Promise((resolve) => setTimeout(resolve, 500));

            console.log('Clicking the Humanize AI button...');
            const buttonSelector = 'button.ParaphraseButton_button__nWdlZ';
            await page.waitForSelector(buttonSelector, { timeout: 30000 });
            await page.click(buttonSelector);

            console.log('Waiting 15 seconds for humanized content to be generated...');
            await page.waitForSelector('.OutputContainer_output__wvgeh', { timeout: 30000 });
            await new Promise((resolve) => setTimeout(resolve, 15000));

            console.log('Extracting formatted content...');
            const formattedContent = await page.evaluate(() => {
                const processTextContent = (element) => {
                    const fragments = [];
                    let currentParagraph = [];
                    
                    const traverse = (node) => {
                        if (node.nodeType === Node.TEXT_NODE) {
                            const text = node.textContent.trim();
                            if (text) currentParagraph.push(text);
                        } else if (node.tagName === 'BR') {
                            if (currentParagraph.length > 0) {
                                fragments.push(currentParagraph.join(' '));
                                currentParagraph = [];
                            }
                            fragments.push('');
                        } else {
                            node.childNodes.forEach(traverse);
                            const isBlockOrSpecial = node.className && (
                                node.className.includes('Editor_t__not_edited_long__JuNNx') ||
                                node.className.includes('OutputContainer_output__wvgeh')
                            );
                            if (isBlockOrSpecial && currentParagraph.length > 0) {
                                fragments.push(currentParagraph.join(' '));
                                currentParagraph = [];
                                fragments.push('');
                            }
                        }
                    };

                    traverse(element);
                    
                    if (currentParagraph.length > 0) {
                        fragments.push(currentParagraph.join(' '));
                    }

                    return fragments;
                };

                const outputContainer = document.querySelector('.OutputContainer_output__wvgeh');
                if (!outputContainer) return '';

                const textFragments = processTextContent(outputContainer);
                
                return textFragments
                    .join('\n')
                    .replace(/\n{3,}/g, '\n')
                    .replace(/\s+/g, ' ')
                    .split('\n')
                    .map(line => line.trim())
                    .join('\n')
                    .trim();
            });

            if (!formattedContent) {
                throw new Error('No content generated');
            }

            const finalContent = formattedContent
                .replace(/\*\*(.*?)\*\*/g, '\n**$1**\n')
                .replace(/\n{3,}/g, '\n\n')
                .trim();

            console.log('Content humanized successfully');
            await page.close();
            return finalContent;

        } catch (err) {
            console.error('Error during humanization:', err);
            throw new Error('Failed to humanize content: ' + err.message);
        } finally {
            await this.cleanup();
        }
    }

    async cleanup() {
        if (this.browser) {
            try {
                console.log('Cleaning up browser instance...');
                const pages = await this.browser.pages();
                await Promise.all(pages.map(page => page.close()));
                await this.browser.close();
            } catch (err) {
                console.error('Cleanup error:', err);
            } finally {
                this.browser = null;
                this.isInitialized = false;
            }
        }
    }
}

module.exports = new HumanizeService();