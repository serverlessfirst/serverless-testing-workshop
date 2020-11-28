# Week 4 Homework - DynamoDB Streams

## Pre-requisites
- [ ] Pull the latest code from the public repo before starting by running the Git command described in the "Sync updates into your private copy" section of the [README](../README.md).
- [ ] Create a new branch `week4-exercises` in your private repo.
- [ ] Deploy the full application with the latest code to your AWS account. Make sure to redeploy the infra stack (`npm run infra:deploy`) before deploying the `rest-api` stack as new resources have been added since last week's exercises. Full instructions in the "Build and deployment" section of the [README](../README.md).

## Exercise 4.1 - Write E2E tests for the `processNewMember` Lambda function
In the video lesson on "Processing DynamoDB Streams", we showed how DynamoDB streams could be used to remove a distributed transaction from an API Gateway Lambda handler by creating a new `processNewMember` Lambda function that is triggered from a DynamoDB event stream.

This stream has been set up and the Lambda function has been implemented, but currently it only has unit tests. It still needs E2E tests to cover the following outstanding failure modes mentioned in the video lesson:
- Stream is enabled correctly
- The Lambda function gets triggered from the DynamoDB stream
- The Lambda function successfully writes to EventBridge (correct IAMs, event bus name, etc)

Your task is to write these E2E tests. The `process-new-member.e2e.spec.ts` file has already been created to hold your test cases.

Hints:
- You might be able to cover all these failures modes with 2 or even a single test case
- Use techniques covered in Module 5 to verify correct publishing of events to EventBridge.

## Submitting your work
Once you've completed all the exercises, then create a single Pull Request tagging your instructor as a reviewer.
