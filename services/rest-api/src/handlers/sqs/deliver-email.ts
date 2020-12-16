import { SQSEvent } from 'aws-lambda';
import log from '@dazn/lambda-powertools-logger';
import { SendEmailRequest } from '@svc/lib/email/types';
import { SES } from '@aws-sdk/client-ses';
import { SQS } from '@aws-sdk/client-sqs';
import { AWS_REGION, sqsConfig } from '@svc/config';

const sesClient = new SES({ region: AWS_REGION });
const sqsClient = new SQS({ region: AWS_REGION });

const processMessage = async (msg: SendEmailRequest, sqsMessageId: string) => {
  log.debug(`Processing message ${sqsMessageId} ...`);
  const sesResult = await sesClient.sendEmail({
    Source: msg.fromAddress,
    Destination: msg.destination,
    Message: msg.message,
  });
  log.info('SES message sent', { sqsMessageId, sesResult, msg });
  return sesResult.MessageId;
};

const deleteQueueMessage = async (receiptHandle: string) => {
  try {
    await sqsClient.deleteMessage({
      QueueUrl: sqsConfig.outboundEmailsQueueUrl,
      ReceiptHandle: receiptHandle,
    });
  } catch (error) {
    // Suppress errors with deletion (e.g. if Lambda was invoked directly during a test without a real SQS receiptHandle)
    log.error('Error deleting message from queue', { receiptHandle }, error);
  }
};

export const handler = async (event: SQSEvent) => {
  log.debug('Received SQS event', { event });
  let batchErrorCount = 0;
  await Promise.all(event.Records.map(async (record) => {
    try {
      await processMessage(
        JSON.parse(record.body) as SendEmailRequest, record.messageId,
      );
      await deleteQueueMessage(record.receiptHandle);
    } catch (error) {
      batchErrorCount += 1;
      log.error('Error processing record', { record }, error);
    }
  }));
  log.debug('Finished processing batch.', { batchErrorCount });
  if (batchErrorCount > 0) {
    // rethrow error so that SQS will return failed messages back to queue for retry attempts
    throw new Error('Processing of one or more messages failed');
  }
};
