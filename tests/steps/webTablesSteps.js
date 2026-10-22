const { Given, When, Then } = require('@cucumber/cucumber');
const WebTablesPage = require('../../pages/webTablesPage');
const { readCsv, testData } = require('../support/dataHelper');

Given('user opens the web tables page', async function () {
    this.webTablesPage = new WebTablesPage(this.page);
    await this.webTablesPage.open(testData.paths.webTables);
});

When('user adds all users from {string}', async function (fileName) {
    await this.webTablesPage.addUsers(readCsv(fileName));
});

Then('all users from {string} should appear in the table', async function (fileName) {
    await this.webTablesPage.assertUsersInTable(readCsv(fileName));
});
