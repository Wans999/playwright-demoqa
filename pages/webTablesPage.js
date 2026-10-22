const { expect } = require('@playwright/test');
const BasePage = require('./basePage');
const WebTablesLocators = require('../locators/webTablesLocators');

class WebTablesPage extends BasePage {
    constructor(page){
        super(page);
        this.addButton = page.locator(WebTablesLocators.addButton);
        this.searchBox = page.locator(WebTablesLocators.searchBox);
        this.tableRows = page.locator(WebTablesLocators.tableRows);
        this.modal = page.locator(WebTablesLocators.modal);
        this.firstNameInput = page.locator(WebTablesLocators.firstNameInput);
        this.lastNameInput = page.locator(WebTablesLocators.lastNameInput);
        this.emailInput = page.locator(WebTablesLocators.emailInput);
        this.ageInput = page.locator(WebTablesLocators.ageInput);
        this.salaryInput = page.locator(WebTablesLocators.salaryInput);
        this.departmentInput = page.locator(WebTablesLocators.departmentInput);
        this.submitButton = page.locator(WebTablesLocators.submitButton);
    }

    async addUser(user){
        await this.addButton.click();
        await this.firstNameInput.fill(user.firstName);
        await this.lastNameInput.fill(user.lastName);
        await this.emailInput.fill(user.email);
        await this.ageInput.fill(user.age);
        await this.salaryInput.fill(user.salary);
        await this.departmentInput.fill(user.department);
        await this.submitButton.click();
        await expect(this.modal).toBeHidden();
    }

    async addUsers(users){
        for (const user of users) {
            await this.addUser(user);
        }
    }

    // Cari user lewat search box supaya tidak terpengaruh pagination
    async assertUserInTable(user){
        await this.searchBox.fill(user.email);
        const row = this.tableRows.filter({ hasText: user.email });
        await expect(row).toHaveCount(1);
        await expect(row.locator('td')).toHaveText([
            user.firstName,
            user.lastName,
            user.age,
            user.email,
            user.salary,
            user.department,
            '',
        ]);
    }

    async assertUsersInTable(users){
        for (const user of users) {
            await this.assertUserInTable(user);
        }
        await this.searchBox.clear();
    }
}

module.exports = WebTablesPage;
