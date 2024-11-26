const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const nlp = require('compromise');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

class HumanizeService {
    constructor() {
        this.browser = null;
        this.isInitialized = false;
        this.screenshotDir = 'C:\\Users\\sangh\\OneDrive\\Pictures\\Screenshots'; // Screenshot directory
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

    async captureScreenshot(page, step) {
        try {
            if (!fs.existsSync(this.screenshotDir)) {
                fs.mkdirSync(this.screenshotDir, { recursive: true });
            }
            const filePath = path.join(this.screenshotDir, `screenshot_${step}.png`);
            await page.screenshot({ path: filePath }); // Captures only the visible portion of the screen
            console.log(`Screenshot taken: ${filePath}`);
        } catch (err) {
            console.error('Failed to take screenshot:', err);
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
            await this.captureScreenshot(page, 'navigated_to_humanizeai');

            console.log('Waiting for textarea...');
            const inputSelector = 'textarea.InputContainer_inputContainer__jeGwX';
            await page.waitForSelector(inputSelector, { timeout: 30000 });
            await this.captureScreenshot(page, 'textarea_found');

            console.log('Typing content...');
            await page.type(inputSelector, content);

            console.log('Clicking the Humanize AI button...');
            const buttonSelector = 'button.ParaphraseButton_button__nWdlZ';
            await page.waitForSelector(buttonSelector, { timeout: 30000 });
            await page.click(buttonSelector);
            await this.captureScreenshot(page, 'clicked_humanize_button');

            // Wait for 25 seconds to ensure content generation, just like in the old version
            console.log('Waiting 25 seconds for humanized content to be generated...');
            await page.waitForSelector('.OutputContainer_output__wvgeh', { timeout: 30000 });
            await new Promise((resolve) => setTimeout(resolve, 25000));
            await this.captureScreenshot(page, 'after_wait_period');

            console.log('Extracting formatted content...');
            const formattedContent = await page.evaluate(() => {
                const processTextContent = (element) => {
                    const fragments = [];
                    let currentParagraph = [];
                    
                    // Process all child nodes
                    const traverse = (node) => {
                        if (node.nodeType === Node.TEXT_NODE) {
                            const text = node.textContent.trim();
                            if (text) currentParagraph.push(text);
                        } 
                        else if (node.tagName === 'BR') {
                            if (currentParagraph.length > 0) {
                                fragments.push(currentParagraph.join(' '));
                                currentParagraph = [];
                            }
                            fragments.push('');  // Add empty string for line break
                        }
                        else {
                            // Handle nested elements
                            node.childNodes.forEach(traverse);
                            
                            // Check if this is a block-level or special span
                            const isBlockOrSpecial = node.className && (
                                node.className.includes('Editor_t__not_edited_long__JuNNx') ||
                                node.className.includes('OutputContainer_output__wvgeh')
                            );
                            
                            if (isBlockOrSpecial && currentParagraph.length > 0) {
                                fragments.push(currentParagraph.join(' '));
                                currentParagraph = [];
                                fragments.push('');  // Add extra line break
                            }
                        }
                    };

                    traverse(element);
                    
                    // Add any remaining text
                    if (currentParagraph.length > 0) {
                        fragments.push(currentParagraph.join(' '));
                    }

                    return fragments;
                };

                const outputContainer = document.querySelector('.OutputContainer_output__wvgeh');
                if (!outputContainer) return '';

                const textFragments = processTextContent(outputContainer);
                
                // Format the final content
                return textFragments
                    .join('\n')
                    .replace(/\n{3,}/g, '\n')     // Replace 3+ newlines with 1
                    .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
                    .split('\n')                    // Split into lines
                    .map(line => line.trim())       // Trim each line
                    .join('\n')                     // Join back with newlines
                    .trim();                        // Trim the entire text
            });

            if (!formattedContent) {
                throw new Error('No content generated');
            }

            // Post-process the content to ensure proper markdown formatting
            const finalContent = formattedContent
                .replace(/\*\*(.*?)\*\*/g, '\n**$1**\n')  // Add newlines around headers
                .replace(/\n{3,}/g, '\n\n')               // Clean up excessive newlines
                .trim();

            console.log('Content humanized successfully');
            await page.close();
            return finalContent;

        } catch (err) {
            console.error('Error during humanization:', err);
            if (page) await this.captureScreenshot(page, 'error_occurred');
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