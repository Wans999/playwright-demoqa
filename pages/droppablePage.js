const { expect } = require('@playwright/test');
const BasePage = require('./basePage');
const DroppableLocators = require('../locators/droppableLocators');

class DroppablePage extends BasePage {
    constructor(page){
        super(page);
        this.simpleTab = page.locator(DroppableLocators.simpleTab);
        this.dragBox = page.locator(DroppableLocators.dragBox);
        this.dropBox = page.locator(DroppableLocators.dropBox);
    }

    async dragToTarget(){
        await this.simpleTab.click();
        // Tunggu jQuery UI selesai inisialisasi drag & drop
        await expect(this.dragBox).toHaveClass(/ui-draggable/);
        await expect(this.dropBox).toHaveClass(/ui-droppable/);
        await this.dragBox.dragTo(this.dropBox);
    }

    async assertDropped(text){
        await expect(this.dropBox).toHaveText(text);
        await expect(this.dropBox).toHaveClass(/ui-state-highlight/);
    }
}

module.exports = DroppablePage;
