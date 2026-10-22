const { expect } = require('@playwright/test');
const BasePage = require('./basePage');
const ResizableLocators = require('../locators/resizableLocators');

class ResizablePage extends BasePage {
    constructor(page){
        super(page);
        this.resizableBox = page.locator(ResizableLocators.resizableBox);
        this.resizeHandle = page.locator(ResizableLocators.resizeHandle);
    }

    // Seret handle pojok kanan bawah sebesar selisih ukuran sekarang dengan ukuran target.
    // Ukuran dicek ulang setelah drag; kalau belum pas (misal halaman sempat bergeser), dikoreksi lagi.
    async resizeTo(width, height, maxAttempts = 3){
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await this.resizeHandle.scrollIntoViewIfNeeded();
            const box = await this.resizableBox.boundingBox();
            const dx = width - box.width;
            const dy = height - box.height;
            if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;

            const handle = await this.resizeHandle.boundingBox();
            const startX = handle.x + handle.width / 2;
            const startY = handle.y + handle.height / 2;
            await this.page.mouse.move(startX, startY);
            await this.page.mouse.down();
            await this.page.mouse.move(startX + dx, startY + dy, { steps: 10 });
            await this.page.mouse.up();
        }
    }

    async assertSize(width, height){
        await expect(this.resizableBox).toHaveCSS('width', `${width}px`);
        await expect(this.resizableBox).toHaveCSS('height', `${height}px`);
    }
}

module.exports = ResizablePage;
