const { expect } = require('@playwright/test');
const BasePage = require('./basePage');
const LinkLocators = require('../locators/linkLocators');

class LinkPage extends BasePage {
    constructor(page){
        super(page);
        this.homeLink = page.locator(LinkLocators.homeLink);
    }

    async clickHomeLink(){
        // Link "Home" pakai target=_blank, jadi tangkap tab baru
        [this.newPage] = await Promise.all([
            this.page.context().waitForEvent('page'),
            this.homeLink.click(),
        ]);
    }

    async assertHomeOpened(){
        await expect(this.newPage).toHaveURL(/demoqa\.com\/?$/);
    }
}

module.exports = LinkPage;
