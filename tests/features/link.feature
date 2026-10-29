Feature: Link

  @link
  Scenario: Click Link Home
    Given user open links page
    When user click link home
    Then home page opened in new tab
