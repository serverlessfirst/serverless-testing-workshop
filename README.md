# Serverless Testing Workshop
Code and exercises accompanying the [Serverless Testing Workshop](https://serverlessfirst.com/workshops/testing/).

## Exercises
The exercises in the workshop relate to a Sports Management App ([read use cases](./docs/app-use-cases.md)).
- [Week 1 Worksheet](./exercises/week1-worksheet.md)


## Working with this repo during the workshop
As part of the workshop, you will be completing exercises each week that involve making code and documentation changes to this repository and submitting changes via PR to your instructor for review. You should use your own private copy (not a fork!) of this repo.

Follow these steps to create your copy:
1. Create a new repository using the [GitHub UI](https://github.com/new). Set it to **Private** and name it `serverless-testing-workshop-student`.
2. Push the content of the public repo to your new repo using the following terminal command, making sure to replace "{yourname}" with your GitHub username:
    ```sh
    git clone --bare https://github.com/WinterWindSoftware/serverless-testing-workshop.git
    cd serverless-testing-workshop.git
    git push --mirror https://github.com/{yourname}/serverless-testing-workshop-student.git
    cd ..
    rm -rf serverless-testing-workshop.git
    ```
3. Clone your private repo locally so you can work on it:
    ```sh
    git clone https://github.com/{yourname}/serverless-testing-workshop-student.git
    cd serverless-testing-workshop-student
    ```

### Sync updates into your private copy
New code may be added to the public repo during the course of the workshop. In order to sync changes into your private copy, run the following command inside your local `serverless-testing-workshop-student` directory:
```sh
git remote add public https://github.com/WinterWindSoftware/serverless-testing-workshop.git
git pull public master # Creates a merge commit
git push origin master
```

## Development environment setup
[Follow instructions here](./docs/dev-env-setup.md) in order to install the pre-requisites and configure your AWS account correctly to allow you to run the workshop exercises.

## Build & deployment
The application is made up of 2 Serverless Framework services (which map to CloudFormation stacks under the hood ). These are:
- `infra`: stack containing core infrastructure resources that are unlikely to change frequently (DynamoDB tables, Cognito user pool, S3 bucket, EventBridge event bus, SNS topics, SQS queues)
- `rest-api`: stack containing API Gateway and Lambda functions that make up the REST API for the app.

### Install dependencies
Install all NPM packages for each service by running the following in the root folder:
```sh
npm install
```

### Configuration
TODO do any env files needs to be set or secrets pushed to SSM Param Store?

### Deploy services to AWS
Open a new terminal window and run the following:
```sh
export AWS_PROFILE=testing-workshop-student
```
To deploy the application to your AWS account, run the following 2 commands sequentially:

```sh
npm run infra:deploy
```

```sh
npm run rest-api:deploy
```
