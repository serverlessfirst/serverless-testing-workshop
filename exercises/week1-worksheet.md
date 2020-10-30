# Week 1 Worksheet
This exercise is focused on identifying failure modes and test cases for specific use cases within the sample Sports Club Manager app.

1. [ ] Read through the [AWS architecture and use cases](../docs/app-use-cases.md) for the sample app.
2. [ ] Fill out the worksheet templates below for the following 2 application use cases. Some items have already been filled out to get you started:
    - [ ] **Create new Club and set as public/private**
    - [ ] **List all Clubs marked as public**
3. [ ] Create a Pull Request in your private repository containing your changes to this file, tagging your instructor as a reviewer.

Some hints for completing the worksheets:
- Think in terms of both the business logic and the deployment infrastructure when considering failure modes
- Refer back to the video lessons on failure modes and structuring your tests if you get stuck.
- Not all failure modes need a dedicated test case or assertion. A single integration or E2E test case may cover off several failure modes simply by virtue of returning without error.
- Some test cases may not have any Arrange actions.
- Don't worry if you don't get time to complete both use cases. Just submit what you can get done in the time you have.

---

## Use Case 1: Create New Club
HTTP request: `POST /clubs`

### Failure modes
What could go wrong with this API endpoint?
- An unauthenticated user is allowed to create a club
- The API doesn't respond to the correct HTTP path and verb
- TODO: add more failure modes

### E2E test cases
- Unauthenticated users are prevented from creating clubs:
    - **Arrange** steps:
        -  Create a request event contained valid data for the new Club
    - **Act** steps:
        -  Submit HTTP request to deployed endpoint `POST /clubs`, passing the request event but leaving the `Authorization` header empty
    - **Assert** steps:
        -  Verify that status code 401 is returned
- {Insert Test Case Name}:
    - **Arrange** steps:
        -  TODO what initialisation or data setup is needed?
    - **Act** steps:
        -  TODO how will you exercise the System-Under-Test? What is your entrypoint?
    - **Assert** steps:
        -  TODO how will you verify that the behaviour is correct?

### Integration test cases
- {Insert Test Case Name}:
    - **Arrange** steps:
        -  TODO what initialisation or data setup is needed?
    - **Act** steps:
        -  TODO how will you exercise the System-Under-Test? What is your entrypoint?
    - **Assert** steps:
        -  TODO how will you verify that the behaviour is correct?


### Unit test cases
- {Insert Test Case Name}:
    - **Arrange** steps:
        -  TODO what initialisation or data setup is needed?
    - **Act** steps:
        -  TODO how will you exercise the System-Under-Test? What is your entrypoint?
    - **Assert** steps:
        -  TODO how will you verify that the behaviour is correct?

## Use Case 2: List all Clubs marked as public
HTTP request: `GET /clubs`

### Failure modes
What could go wrong with this API endpoint?
- TODO: add more failure modes

### E2E test cases
- {Insert Test Case Name}:
    - **Arrange** steps:
        -  TODO what initialisation or data setup is needed?
    - **Act** steps:
        -  TODO how will you exercise the System-Under-Test? What is your entrypoint?
    - **Assert** steps:
        -  TODO how will you verify that the behaviour is correct?

### Integration test cases
- {Insert Test Case Name}:
    - **Arrange** steps:
        -  TODO what initialisation or data setup is needed?
    - **Act** steps:
        -  TODO how will you exercise the System-Under-Test? What is your entrypoint?
    - **Assert** steps:
        -  TODO how will you verify that the behaviour is correct?


### Unit test cases
- {Insert Test Case Name}:
    - **Arrange** steps:
        -  TODO what initialisation or data setup is needed?
    - **Act** steps:
        -  TODO how will you exercise the System-Under-Test? What is your entrypoint?
    - **Assert** steps:
        -  TODO how will you verify that the behaviour is correct?

---
## Appendix: Test Case Template
- {Insert Test Case Name}:
    - **Arrange** steps:
        -  TODO what initialisation or data setup is needed?
    - **Act** steps:
        -  TODO how will you exercise the System-Under-Test?
    - **Assert** steps:
        -  TODO how will you verify that the behaviour is correct?
