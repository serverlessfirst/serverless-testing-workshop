// Mock out SQS and SES
import { deleteMessage as mockedSQSDelete } from '@tests/utils/aws-mocks/sqs-mocked';
import { sendEmail as mockedSESSendEmail } from '@tests/utils/aws-mocks/ses-mocked';
import { SendEmailRequest } from '@svc/lib/email/types';
import { getSQSEvent } from '@tests/utils/lambda-payload-generator';
import type { SendEmailRequest as SESSendEmailRequest } from '@aws-sdk/client-ses';
import { randomEmail } from '@tests/utils/test-data-generator';
import _ from 'lodash';
// Must import handler after sqs-mocked lib
import { handler } from '@svc/handlers/sqs/deliver-email';
import uuid from '@svc/lib/uuid';

const getTestEmailRequest = (toAddress: string) => {
  const msg: SendEmailRequest = {
    fromAddress: 'from@example.com',
    destination: { ToAddresses: [toAddress] },
    message: {
      Subject: { Data: 'sqsDeliverEmail test 1' },
      Body: { Html: { Data: 'testing<br>1,2,3' } },
    },
  };
  return msg;
};

describe('`sqsDeliverEmail` handler', () => {
  const BAD_EMAIL_ADDRESS = 'malformed email address';

  beforeEach(() => {
    jest.clearAllMocks();
    mockedSESSendEmail.mockImplementation((req: SESSendEmailRequest) => {
      return {
        promise: () => {
          if (req.Destination?.ToAddresses![0].startsWith(BAD_EMAIL_ADDRESS)) {
            return Promise.reject();
          }
          return Promise.resolve({ MessageId: uuid() });
        },
      };
    });
  });

  it('deletes queue message for successfully processed records', async () => {
    const event = getSQSEvent([
      getTestEmailRequest(randomEmail()),
      getTestEmailRequest(randomEmail()),
    ]);
    await handler(event);
    expect(mockedSESSendEmail).toHaveBeenCalledTimes(2);
    expect(mockedSQSDelete).toHaveBeenCalledTimes(2);
  });

  it('does NOT delete queue message for failed records', async () => {
    const event = getSQSEvent([
      getTestEmailRequest(BAD_EMAIL_ADDRESS),
    ]);
    await expect(handler(event)).rejects.toThrowError();
    expect(mockedSESSendEmail).toHaveBeenCalledTimes(1);
    expect(mockedSQSDelete).toHaveBeenCalledTimes(0);
  });

  it('still processes valid message when rest of batch is poisoned', async () => {
    const goodEmail = 'valid1@example.com';
    const event = getSQSEvent([
      ..._.times(9, i => getTestEmailRequest(BAD_EMAIL_ADDRESS + i)),
      getTestEmailRequest(goodEmail), // good item at the end
    ]);
    await expect(handler(event)).rejects.toThrowError();
    expect(mockedSESSendEmail).toHaveBeenCalledTimes(10);
    expect(mockedSQSDelete).toHaveBeenCalledTimes(1); // delete being call shows that the 1 good record was processed
  });
});
