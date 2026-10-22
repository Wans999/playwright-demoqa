const { Given, When, Then } = require('@cucumber/cucumber');
const DroppablePage = require('../../pages/droppablePage');
const { testData } = require('../support/dataHelper');

Given('user opens the droppable page', async function () {
    this.droppablePage = new DroppablePage(this.page);
    await this.droppablePage.open(testData.paths.droppable);
});

When('user drags the element to the target area', async function () {
    await this.droppablePage.dragToTarget();
});

Then('the element should be dropped successfully', async function () {
    await this.droppablePage.assertDropped(testData.droppable.droppedText);
});
