const { Given, When, Then } = require('@cucumber/cucumber');
const ResizablePage = require('../../pages/resizablePage');
const { testData } = require('../support/dataHelper');

const { targetWidth, targetHeight } = testData.resizable;

Given('user opens the resizable page', async function () {
    this.resizablePage = new ResizablePage(this.page);
    await this.resizablePage.open(testData.paths.resizable);
});

When('user resizes the element to the target size', async function () {
    await this.resizablePage.resizeTo(targetWidth, targetHeight);
});

Then('the element size should match the target size', async function () {
    await this.resizablePage.assertSize(targetWidth, targetHeight);
});
