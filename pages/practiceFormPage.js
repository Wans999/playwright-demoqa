const { expect } = require('@playwright/test');
const BasePage = require('./basePage');
const PracticeFormLocators = require('../locators/practiceFormLocators');

class PracticeFormPage extends BasePage {
    constructor(page){
        super(page);
        this.firstNameInput = page.locator(PracticeFormLocators.firstNameInput);
        this.lastNameInput = page.locator(PracticeFormLocators.lastNameInput);
        this.emailInput = page.locator(PracticeFormLocators.emailInput);
        this.genderWrapper = page.locator(PracticeFormLocators.genderWrapper);
        this.mobileInput = page.locator(PracticeFormLocators.mobileInput);
        this.dateOfBirthInput = page.locator(PracticeFormLocators.dateOfBirthInput);
        this.subjectsInput = page.locator(PracticeFormLocators.subjectsInput);
        this.hobbiesWrapper = page.locator(PracticeFormLocators.hobbiesWrapper);
        this.uploadPictureInput = page.locator(PracticeFormLocators.uploadPictureInput);
        this.currentAddressInput = page.locator(PracticeFormLocators.currentAddressInput);
        this.stateInput = page.locator(PracticeFormLocators.stateInput);
        this.cityInput = page.locator(PracticeFormLocators.cityInput);
        this.dropdownOption = page.locator(PracticeFormLocators.dropdownOption);
        this.submitButton = page.locator(PracticeFormLocators.submitButton);
        this.confirmationModal = page.locator(PracticeFormLocators.confirmationModal);
        this.confirmationTitle = page.locator(PracticeFormLocators.confirmationTitle);
        this.confirmationRows = page.locator(PracticeFormLocators.confirmationRows);
    }

    async selectGender(gender){
        await this.genderWrapper.getByText(gender, { exact: true }).click();
    }

    // Jangan pakai Enter di form ini: Enter akan langsung submit form
    async fillDateOfBirth(date){
        await this.dateOfBirthInput.click();
        await this.dateOfBirthInput.press('ControlOrMeta+a');
        await this.dateOfBirthInput.pressSequentially(date);
        await this.dateOfBirthInput.press('Escape');
    }

    async chooseOption(input, text){
        await input.click();
        await input.pressSequentially(text);
        await this.dropdownOption.getByText(text, { exact: true }).click();
    }

    async addSubjects(subjects){
        for (const subject of subjects) {
            await this.chooseOption(this.subjectsInput, subject);
        }
    }

    async checkHobbies(hobbies){
        for (const hobby of hobbies) {
            await this.hobbiesWrapper.getByText(hobby, { exact: true }).click();
        }
    }

    async selectStateAndCity(state, city){
        await this.chooseOption(this.stateInput, state);
        await this.chooseOption(this.cityInput, city);
    }

    async fillForm(student, picturePath){
        await this.firstNameInput.fill(student.firstName);
        await this.lastNameInput.fill(student.lastName);
        await this.emailInput.fill(student.email);
        await this.selectGender(student.gender);
        await this.mobileInput.fill(student.mobile);
        await this.fillDateOfBirth(student.dateOfBirth.input);
        await this.addSubjects(student.subjects);
        await this.checkHobbies(student.hobbies);
        await this.uploadPictureInput.setInputFiles(picturePath);
        await this.currentAddressInput.fill(student.currentAddress);
        await this.selectStateAndCity(student.state, student.city);
    }

    async submit(){
        await this.submitButton.click();
    }

    async assertConfirmationValue(label, value){
        const row = this.confirmationRows.filter({ has: this.page.locator('td', { hasText: label }) });
        await expect(row.locator('td').nth(1)).toHaveText(value);
    }

    async assertConfirmation(expected){
        await expect(this.confirmationModal).toBeVisible();
        await expect(this.confirmationTitle).toHaveText('Thanks for submitting the form');
        for (const [label, value] of Object.entries(expected)) {
            await this.assertConfirmationValue(label, value);
        }
    }
}

module.exports = PracticeFormPage;
