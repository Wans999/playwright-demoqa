Feature: Resizable

  @resizable
  Scenario: Resize element to target size
    Given user opens the resizable page
    When user resizes the element to the target size
    Then the element size should match the target size
