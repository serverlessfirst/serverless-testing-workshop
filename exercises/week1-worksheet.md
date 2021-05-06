# Week 1 Exercise

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

# Week 1 Worksheet

Fill out the template below for both use cases, replacing all "TODO"s and adding new test cases as appropriate.

## Use Case 1: Create New Club

HTTP request: `POST /clubs`

### Failure modes

What could go wrong with this API endpoint?

- An unauthenticated user is allowed to create a club
- The API doesn't respond to the correct HTTP path and verb
- The lambda route itself could have a defect
- Incorrect permissions to dynamodb
- Incorrect permissions to EventBridge
- Incorrect permissions to SQS
- Bad dynamo DB schema configured when read or writing from table
- Incorrect response to API gateway
- Lambda function timeout

### E2E test cases

- Unauthenticated users are prevented from creating clubs:
  - **Arrange** steps:
    - Create a request event contained valid data for the new Club
  - **Act** steps:
    - Submit HTTP request to deployed endpoint `POST /clubs`, passing the request event but leaving the `Authorization` header empty
  - **Assert** steps:
    - Verify that status code 401 is returned
- Clubs are created with correct public / private status:
  - **Arrange** steps:
    - Create a request event containing valid data for a new club
  - **Act** steps:
    - Submit HTTP request to deployed endpoint `POST / Clubs`, passing the event and a valid `Authorization`
  - **Assert** steps:
    - Query data from dynamo using ClubID passed in event to ensure the correct object was created in the table

### Integration test cases

- Validating that creating a club is correctly writing to dynamodb:
  - **Arrange** steps:
    - Create a mock event from API gateway containing proper authorization and an event body for creating a club.
  - **Act** steps:
    - Invoke the Route handler lambda function with the Mock event.
  - **Assert** steps:
    - Query data from dynamo using ClubID passed in event to ensure the correct object was created in the table

### Unit test cases

- Validate the correct json body is created for dynamodb when creating a club:
  - **Arrange** steps:
    - Create a mock event from API gateway containing proper authorization and an event body for creating a club.
  - **Act** steps:
    - Invoke the Route handler lambda function with the Mock event.
  - **Assert** steps:
    - Ensure the data that would be written to dynamo is accurate.

## Use Case 2: List all Clubs marked as public

HTTP request: `GET /clubs`

### Failure modes

What could go wrong with this API endpoint?

- TODO: add more failure modes

### E2E test cases

- Calling the Get /Clubs api should only return public clubs:
  - **Arrange** steps:
    - Create a request to the `GET /Clubs` Api
  - **Act** steps:
    - Invoke the request to API gateway
  - **Assert** steps:
    - Parse the returned data to ensure no clubs returned have the `Private` identifier

### Integration test cases

- Querying dynamo for public clubs only returns public clubs:
  - **Arrange** steps:
    - Craft a request event for dyanmodb
  - **Act** steps:
    - Invoke function that will return data from dynamodb
  - **Assert** steps:
    - Parse the returned data to ensure no clubs returned have the `Private` identifier

### Unit test cases

- Ensure failure when parsing private clubs:

  - **Arrange** steps:
    - Mock a dynamodb response containing public and private clubs
  - **Act** steps:
    - Invoke the parsing function with this mock data
  - **Assert** steps:
    - Validate that the function returns a failure as we included private clubs.

- Ensure success when parsing only public clubs:
  - **Arrange** steps:
    - Mock a dynamodb response containing public clubs only
  - **Act** steps:
    - Invoke the parsing function with this mock data
  - **Assert** steps:
    - Validate that the function returns a success as we included only public clubs.

---

## Appendix: Test Case Template

- {Insert Test Case Name}:
  - **Arrange** steps:
    - TODO what initialisation or data setup is needed?
  - **Act** steps:
    - TODO how will you exercise the System-Under-Test?
  - **Assert** steps:
    - TODO how will you verify that the behaviour is correct?
