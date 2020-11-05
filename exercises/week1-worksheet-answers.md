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
- The authentication to API fails due to misconfiguration for Cognito User Pool
- The API is not permitted to invoke the Route handler functions
- The API is configured to invoke wrong functions.
- The Lambda function does not have permissions to access the DynamoDB table
- The Lambda functions policy has wrong resource identifiers for the table.
- The Lambda function parses wrongly the event information and passes on incorrect values.
- The Lambda functions timeout due to too low timeout value.
- The Lambda functions run out of memory due to too low memory allocation.
- The Lambda functions get throttled by the AWS Lambda service.
- The DynamoDB table throttles requests due to running out of provisioned capacity.
- The API doesn't send (or sends incorect) CORS headers to web clients
- The request body isn't validated
- The same club can be added twice if the POST call is duplicated on the client
- An existing club could be overwritten if the POST call matches an existing item
- downstream services might not trigger
- extra fields added to the POST call and added to the DB without allowlisting
- values and indexes not correctly set in the DB

### E2E test cases
- Unauthenticated users are prevented from creating clubs:
  - **Arrange** steps:
    - Create a request event contained valid data for the new Club
  - **Act** steps:
    - Submit HTTP request to deployed endpoint `POST /clubs`, passing the request event but leaving the `Authorization` header empty
  - **Assert** steps:
    - Verify that status code 401 is returned
- Authenticated users with Manager role can create new clubs:
  - **Arrange** steps:
    - Create user in Cognito User Pool and sign in to get the JWT token
    - Create a JSON object containing the required parameters for the `POST /clubs` call.
  - **Act** steps:
    - Submit HTTP request to deployed endpoint `POST /clubs`, passing the request event with the `Authorization` header containing the JWT token.
  - **Assert** steps:
    - Verify that the status code is 200 OK.
    - Verify that the new club is found in DynamoDB with the correct values.

### Integration test cases
- A new club can be created
  - **Arrange** steps:
    - Construct the `event` parameter to contain the correct API GW request fields and values for the `POST /clubs` request.
  - **Act** steps:
    - Invoke the Lambda function with the event.
  - **Assert** steps:
    - Verify that the Lambda invocation succeeded and the response is 200 OK.
    - Verify that the new club is found in DynamoDB with the correct values.
- Reject request if club already exists:
    - **Arrange** steps:
        -  Create a valid club in the Db with a fixed ID
        - Construct the `event` parameter a new Club with the same ID
    - **Act** steps:
        - Invoke the Lambda function with the event.
    - **Assert** steps:
        -  Verify that status code 409 is returned and the existing club is unchanged

### Unit test cases
- Test happy path of the `POST /clubs` event:
  - **Arrange** steps:
    - Mock the event to contain a valid API GW request with all the fields and their values.
    - Mock the DynamoDB response to be a successful request.
  - **Act** steps:
    - Call the Lambda handler function with the event.
  - **Assert** steps:
    - Assert that the mocked DynamoDB object is called with the right parameters.


## Use Case 2: List all Clubs marked as public
HTTP request: `GET /clubs`

### Failure modes
What could go wrong with this API endpoint?
- The API doesn't respond to the correct HTTP path and verb
- The API is not permitted to invoke the Route handler functions
- The API is configured to invoke wrong functions.
- The Lambda function does not have permissions to access the DynamoDB table
- The Lambda functions policy has wrong resource identifiers for the table.
- The Lambda function parses wrongly the event information and passes on incorrect values.
- The Lambda functions timeout due to too low timeout value.
- The Lambda functions run out of memory due to too low memory allocation.
- The Lambda functions get throttled by the AWS Lambda service.
- The DynamoDB table throttles requests due to running out of provisioned capacity.
- The Lambda function returns clubs that are marked private.
- Too many clubs could exist to return in one request (but we don't page results)
- additional db objects returned which are not of type Club (if using a single table DynamoDB design)
- Ordering not as expected
- Filtering. e.g. Items marked as deleted returned

### E2E test cases
- Unauthenticated users can list all clubs:
  - **Arrange** steps:
    - Create a request event contained valid data for the new Club
  - **Act** steps:
    - Submit HTTP request to deployed endpoint `GET /clubs`, passing the request event and leaving the `Authorization` header empty
  - **Assert** steps:
    - Verify that status code 200 is returned.
    - Verify that the response contains all public clubs
    - Verify that none of the clubs are private.


### Integration test cases
- Clubs can be listed
  - **Arrange** steps:
    - Construct the `event` parameter to contain the correct API GW request fields and values for the `GET /clubs` request.
  - **Act** steps:
    - Invoke the Lambda function with the event.
  - **Assert** steps:
    - Verify that the Lambda invocation succeeded and the response is 200 OK.
    - Verify that the Lambda response contains all public clubs.
    - Verify that none of the clubs are private.
- Return limited size pages of club results:
    - **Arrange** steps:
        - Create more than a page's worth of valid clubs in a loop and store in database
    - **Act** steps:
        -  Invoke the handler func
    - **Assert** steps:
        - Assert the length of the returned array === PAGE_SIZE
        - Assert the response contains an offset key
- Return the next page of results when passing an offset:
    - **Arrange** steps:
        - Create (a little) more than a page's worth of valid clubs in a loop and store in database
    - **Act** steps:
        - Invoke the handler func to get the first page and an offset key
        - Invoke the handler func with the offset key
    - **Assert** steps:
        - Assert the combined length of both response arrays === total clubs created
        - Assert the response does not contain an offset key
- No clubs should return empty list:
    - **Arrange** steps:
        -  make sure there are no clubs in the DB
    - **Act** steps:
        -  execute the lambda to get clubs
    - **Assert** steps:
        -  the function should return an empty array

### Unit test cases
- Verify that private clubs are not returned:
  - **Arrange** steps:
    - Mock DynamoDB response with public and private club information.
  - **Act** steps:
    - Call the function that retrieves all the clubs from DynamoDB.
  - **Assert** steps:
    - Assert that the function does not return private clubs.
    - Assert that the mocked DynamoDB is called with right arguments.

---
## Appendix: Test Case Template
- {Insert Test Case Name}:
    - **Arrange** steps:
        -  TODO what initialisation or data setup is needed?
    - **Act** steps:
        -  TODO how will you exercise the System-Under-Test?
    - **Assert** steps:
        -  TODO how will you verify that the behaviour is correct?
