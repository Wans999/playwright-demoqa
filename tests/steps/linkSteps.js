const { Given, When, Then } = require('@cucumber/cucumber');
const LinkPage = require('../../pages/linkPage');
const { testData } = require('../support/dataHelper');

Given('user open links page', async function () {
    this.linkPage = new LinkPage(this.page);
    await this.linkPage.open(testData.paths.link);
});

When('user click link home', async function () {
    await this.linkPage.clickHomeLink();
});

Then('home page opened in new tab', async function () {
    await this.linkPage.assertHomeOpened();
});
