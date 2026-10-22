Feature: Web Tables

  @webtables
  Scenario: Bulk insert users from CSV file
    Given user opens the web tables page
    When user adds all users from "webTablesUsers.csv"
    Then all users from "webTablesUsers.csv" should appear in the table
