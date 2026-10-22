const path = require('path');
const { Given, When, Then } = require('@cucumber/cucumber');
const PracticeFormPage = require('../../pages/practiceFormPage');
const { readJson, dataFilePath, testData } = require('../support/dataHelper');

Given('user opens the student registration form page', async function () {
    this.practiceFormPage = new PracticeFormPage(this.page);
    await this.practiceFormPage.open(testData.paths.practiceForm);
});

When('user fills the form with data from {string}', async function (fileName) {
    this.student = readJson(fileName);
    await this.practiceFormPage.fillForm(this.student, dataFilePath(this.student.picture));
});

When('user submits the form', async function () {
    await this.practiceFormPage.submit();
});

Then('the confirmation popup should show the submitted data', async function () {
    const s = this.student;
    await this.practiceFormPage.assertConfirmation({
        'Student Name': `${s.firstName} ${s.lastName}`,
        'Student Email': s.email,
        'Gender': s.gender,
        'Mobile': s.mobile,
        'Date of Birth': s.dateOfBirth.expected,
        'Subjects': s.subjects.join(', '),
        'Hobbies': s.hobbies.join(', '),
        'Picture': path.basename(s.picture),
        'Address': s.currentAddress,
        'State and City': `${s.state} ${s.city}`,
    });
});
