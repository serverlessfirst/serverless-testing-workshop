import {
  AWS_REGION, emailConfig, lambdaConfig, sqsConfig,
} from '@svc/config';
import { SendEmailRequest } from '@svc/lib/email/types';
import { LambdaFunctionHandlerInvoker } from '@tests/utils/handler-invokers/lambda-function-handler-invoker';
import { getSQSEvent } from '@tests/utils/lambda-payload-generator';
import { handler } from '@svc/handlers/sqs/deliver-email';
import uuid from '@svc/lib/uuid';
import { queueEmail } from '@svc/lib/email/email-queuer';

const DLQ_URL = sqsConfig.outboundEmailsDlqUrl;
const lambdaFunctionName = `${lambdaConfig.functionNamePrefix}sqsDeliverEmail`;
const lambdaInvoker = new LambdaFunctionHandlerInvoker({
  awsRegion: AWS_REGION,
  lambdaFunctionName,
  handler,
});

const getTestEmailRequest = (toAddress: string, subject: string) => {
  const msg: SendEmailRequest = {
    fromAddress: emailConfig.defaultFromEmailAddress,
    destination: { ToAddresses: [toAddress] },
    message: {
      Subject: { Data: subject },
      Body: { Html: { Data: 'testing<br>1,2,3' } },
    },
  };
  return msg;
};

describe('`sqsDeliverEmail` Lambda function', () => {
  const GOOD_EMAIL_ADDRESS = 'success@simulator.amazonses.com'; // https://docs.aws.amazon.com/ses/latest/DeveloperGuide/send-email-simulator.html
  const BAD_EMAIL_ADDRESS = 'malformed email address';

  describe('[e2e]', () => {
    it('sends message to SES whenever valid address is supplied', async () => {
      // Arrange: setup good message
      const event = getSQSEvent([
        getTestEmailRequest(GOOD_EMAIL_ADDRESS, `sqsDeliverEmail test 1: ${uuid()}`),
      ]);

      // Act: invoke Lambda directly
      await lambdaInvoker.invoke(event);

      // Assert
      // By virtue of no error being returned, we're assuming message has gone through to SES (e.g. no IAM permission errors).
      // If we wanted to test actual delivery of email addresses to inboxes, we would need a more advanced setup, see here: https://bahr.dev/2020/09/29/validate-email-workflows/
    });

    it('returns error whenever email address is invalid', async () => {
      // Arrange: setup bad message
      const event = getSQSEvent([
        getTestEmailRequest(BAD_EMAIL_ADDRESS, `sqsDeliverEmail test 2: ${uuid()}`),
      ]);

      // Act & assert: Invoke lambda directly and verify that an error is thrown
      await expect(lambdaInvoker.invoke(event)).rejects.toThrowError();
    });

    it('is triggered whenever a message is added to the OutboundEmails SQS queue', async () => {
      // Act:  write msg to SQS (use bad email address as we don't need it to actually send)
      const result = await queueEmail(getTestEmailRequest(BAD_EMAIL_ADDRESS, `sqsDeliverEmail test 3: ${uuid()}`));

      // Assert: check CloudWatch logs
      const expectedLog = `Processing message ${result.MessageId}`;
      await expect({
        region: AWS_REGION,
        function: lambdaFunctionName,
        timeout: 20000,
      }).toHaveLog(expectedLog);
    });

    it('routes permanently failed messages to the correct DLQ [slow]', async () => {
      // Arrange: setup bad message
      const subject = `sqsDeliverEmail test 4: ${uuid()}`;
      const originalMessage = getTestEmailRequest(BAD_EMAIL_ADDRESS, subject);

      // Act: Add message to queue
      await queueEmail(originalMessage);

      // Wait until normal processing attempts have completed
      const expectedTimeToDLQ = 63000; // (processingTime+VisibilityTimeout)*maxReceiveCount = (20 + 1)*3 seconds
      await new Promise(r => setTimeout(r, expectedTimeToDLQ));

      // Assert: poll DLQ to check that message with matching subject exists
      await expect({
        region: AWS_REGION,
        queueUrl: DLQ_URL,
        timeout: 60000,
        pollEvery: 2000,
      }).toHaveMessage((dlqMsg: SendEmailRequest) => dlqMsg.message.Subject.Data === subject);
    });
  });
});
