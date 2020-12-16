import { AWS_REGION, sqsConfig } from '@svc/config';
import { SQS } from '@aws-sdk/client-sqs';
import log from '@dazn/lambda-powertools-logger';
import { SendEmailRequest } from './types';

const sqs = new SQS({ region: AWS_REGION });
const EMAIL_QUEUE_URL = sqsConfig.outboundEmailsQueueUrl;

/**
 * Queues an email for delivery.
 * @param email
 */
export const queueEmail = async (email: SendEmailRequest) => {
  log.debug('Queuing email...', { email });
  const queueResult = await sqs.sendMessage({
    QueueUrl: EMAIL_QUEUE_URL,
    MessageBody: JSON.stringify(email),
  });
  log.info('Queued email.', { email, queueResult });
  return queueResult;
};
