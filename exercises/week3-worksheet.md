# Week 3 Homework - Async Messaging with EventBridge

## Pre-requisites
- [ ] Pull the latest code from the public repo before starting by running the Git command described in the "Sync updates into your private copy" section of the [README](../README.md).
- [ ] Create a new branch `week3-exercises` in your private repo.
- [ ] Deploy the full application with the latest code to your AWS account. New resources have been added since last week's exercises, so you will need to deploy all the stacks again before starting your implementation. To do this, follow the instructions in the "Build and deployment" section of the [README](../README.md).

## Exercise 3.1 - Send welcome email to new members when they join club
In the video lesson on "Consuming EventBridge events", we used the `MEMBER_JOINED_CLUB` event that is published to EventBridge whenever a new player joins a Club to notify the manager that a player has joined. This same event is also being consumed by a `welcome-member` Lambda function whose job it is to send a welcome email to the player who has just joined the club.

This Lambda function has already been implemented but doesn't yet have any tests. Your task is to write tests for it which verify the following:
- The Lambda function is correctly triggered by the EventBridge event
- The Lambda function correctly sends the email to the player who has just joined*

*Note that the `welcome-member` Lambda function doesn't send the email directly, instead it just puts a message to the `OutboundEmails` SQS queue. Therefore, in order to verify that the email was sent, you only need to verify that a message has been successfully added to this queue.

Stubbed `it.todo` test cases have already been defined for the items listed above inside the `welcome-member.spec.ts` file.

Hints:
- Use appropriate `expect` assertions from the [Jest aws-testing-library](https://github.com/erezrokah/aws-testing-library/tree/main/src/jest#assertions)
- Look at the `notify-member-joined.spec.ts` test file to see how email delivery is verified there.

## Submitting your work
Once you've completed all the exercises, then create a single Pull Request tagging your instructor as a reviewer.
