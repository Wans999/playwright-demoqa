Feature: Student Registration Form

  @practiceForm
  Scenario: Submit student registration form
    Given user opens the student registration form page
    When user fills the form with data from "studentForm.json"
    And user submits the form
    Then the confirmation popup should show the submitted data
