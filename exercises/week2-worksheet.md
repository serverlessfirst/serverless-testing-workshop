# Week 2 Exercises
In week 2, we have a few exercises related to the lessons from modules 3 and 4.

## Exercise 2.1: Implement a simple unit test and make it pass
1. Open `./services/rest-api/tests/unit/club-validator.spec.ts`
2. Implement the test case for `''rejects club names that contain non-alphanumeric characters (e.g. emojis)'`.
3. Run the unit tests by running `npm run test-unit`. Your test should fail initially as the `validateClub` function doesn't support this behaviour yet.
4. Edit the `validateClub` function to support this behaviour.
5. Re-run the unit tests to verify that they now all pass.

If using VSCode, experiment using the interactive debugger inside your test by clicking by selecting the "REST API - Unit Test - Current File" launch configuration, adding a few breakpoints and pressing F5.
