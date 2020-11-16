import uuid from '@svc/lib/uuid';
import { S3Event } from 'aws-lambda';

/**
 * Creates a fully-populated S3Event payload initiated with provided values.
 */
export const getS3Event = (
  bucketName: string, objectKey: string, awsRegion: string, eventName = 'ObjectCreated:Put',
) => {
  const evt: S3Event = {
    Records: [{
      eventName,
      eventTime: new Date().toISOString(),
      eventSource: 'aws:s3',
      eventVersion: '2.1',
      responseElements: {
        'x-amz-request-id': uuid(),
        'x-amz-id-2': uuid(),
      },
      userIdentity: {
        principalId: 'n/a',
      },
      requestParameters: { sourceIPAddress: 'n/a' },
      awsRegion,
      s3: {
        bucket: {
          name: bucketName,
          arn: 'n/a',
          ownerIdentity: { principalId: 'n/a' },
        },
        object: {
          key: objectKey,
          size: 1,
          eTag: 'n/a',
          sequencer: 'n/a',
        },
        s3SchemaVersion: '1.0',
        configurationId: 'n/a',
      },
    }],
  };
  return evt;
};
