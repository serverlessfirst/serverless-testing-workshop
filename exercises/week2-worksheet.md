# Week 2 Exercises
In week 2, we have a few exercises related to the lessons from modules 3 and 4.
Create a new branch `week2-exercises` in your private repo and then create a single Pull Request tagging your instructor as a reviewer once both exercises have been completed.

## Exercise 2.1: Implement a simple unit test and make it pass
1. Open `./services/rest-api/tests/unit/club-validator.spec.ts`
2. Implement the test case for `''rejects club names that contain non-alphanumeric characters (e.g. emojis)'`.
3. Run the unit tests by running `npm run test-unit`. Your test should fail initially as the `validateClub` function doesn't support this behaviour yet.
4. Edit the `validateClub` function to support this behaviour.
5. Re-run the unit tests to verify that they now all pass.

If using VSCode, experiment using the interactive debugger inside your test by clicking by selecting the "REST API - Unit Test - Current File" launch configuration, adding a few breakpoints and pressing F5.

## Exercise 2.2: Write tests for new `GET /me/clubs` route
*This exercise requires deploying the full application to your AWS account. To do this, follow the instructions in the "Dev environment setup" and "Build and deployment" sections of the [README](../README.md). You should deploy the full application to your AWS account before starting the below exercise. Also make sure to pull the latest code from the public repo before starting by running the Git command described in the "Sync updates into your private copy" section of the README.*

A new API route `GET /me/clubs` has been implemented but no tests have been written for it.
Your task is to write test cases to cover the main failure modes of the route. Its purpose is to list all clubs that that the current user is a manager of.

Hints:
- Add your tests to the existing stubbed `get-my-clubs.spec.ts` file.
- Use the `it.todo` construct to define all your test cases up front before starting implementation.
- Use the existing test cases for the `GET /me` and `GET /clubs` routes as a basis for how to setup test data and test users.
- Make use of the `ApiGatewayHandlerInvoker` module to invoke your tests in both integration and E2E mode
- Make use of the TestUserManager module to create the test Cognito user(s) that your tests may need.
- Set the `managerId` field on the `Club` object to your test user's ID when creating test clubs.
- make sure to run your test in both integration (`npm run test-integration`) and E2E (`npm run test-e2e`) modes.
- There may be bugs in the application code for this use case which your tests should catch.
- Apply fixes to the application code and redeploy using the `npm run rest-api:deploy` command.
- If you don't have enough time to write all the tests you planned to, just implement the ones you have time for and leave the rest as `it.todo`.

Some more advanced things to try:
- Consider using the `beforeAll` Jest hook for your Arrange phase if you can reuse the same user(s) across multiple tests.
