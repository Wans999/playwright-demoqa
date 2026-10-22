const { getBaseUrl } = require('../tests/support/dataHelper');

class BasePage {
    constructor(page){
        this.page = page;
    }

    async open(path){
        await this.page.goto(`${getBaseUrl()}${path}`, { waitUntil: 'domcontentloaded' });
    }
}

module.exports = BasePage;
