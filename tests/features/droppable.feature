Feature: Droppable

  @droppable
  Scenario: Drag element to the target area
    Given user opens the droppable page
    When user drags the element to the target area
    Then the element should be dropped successfully
