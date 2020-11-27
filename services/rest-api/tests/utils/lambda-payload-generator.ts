import uuid from '@svc/lib/uuid';
import {
  DynamoDBRecord,
  DynamoDBStreamEvent,
  EventBridgeEvent, S3Event, SQSEvent, SQSRecord,
} from 'aws-lambda';

import { Marshaller } from '@aws/dynamodb-auto-marshaller';

const DEFAULT_AWS_REGION = process.env.AWS_REGION || 'eu-west-1';
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

export const getSQSEvent = (messageBodies: any[], awsRegion = DEFAULT_AWS_REGION) => {
  const evt: SQSEvent = {
    Records: messageBodies.map((bodyObject): SQSRecord => {
      return {
        messageId: uuid(),
        messageAttributes: {},
        receiptHandle: uuid(),
        body: JSON.stringify(bodyObject),
        md5OfBody: 'n/a',
        eventSource: 'aws:sqs',
        awsRegion,
        eventSourceARN: 'n/a',
        attributes: {
          ApproximateReceiveCount: '1',
          ApproximateFirstReceiveTimestamp: new Date().getTime().toString(),
          SentTimestamp: new Date().getTime().toString(),
          SenderId: 'n/a',
        },
      };
    }),
  };
  return evt;
};

export function getEventBridgeEvent<TDetailType extends string, TDetail>(
  detailType: TDetailType, detail: TDetail, source = '', awsRegion = DEFAULT_AWS_REGION,
): EventBridgeEvent<TDetailType, TDetail> {
  return {
    id: uuid(),
    account: 'n/a',
    region: awsRegion,
    time: new Date().toISOString(),
    resources: [],
    version: '',
    source,
    detail,
    'detail-type': detailType,
  };
}

export type DynamoDBStreamEventName = 'INSERT' | 'MODIFY' | 'REMOVE';

export interface DDBStreamEventItem {
  eventName: DynamoDBStreamEventName;
  keys: { [key: string]: any };
  newItem?: any;
  oldItem?: any;
}

export const getDynamoDBStreamEvent = (
  items: DDBStreamEventItem[], streamViewType = 'NEW_AND_OLD_IMAGES', awsRegion = DEFAULT_AWS_REGION,
) => {
  const marshaller = new Marshaller();
  const evt: DynamoDBStreamEvent = {
    Records: items.map((item, index): DynamoDBRecord => {
      return {
        eventID: uuid(),
        eventVersion: '1.0',
        eventName: item.eventName,
        dynamodb: {
          Keys: marshaller.marshallItem(item.keys) as any,
          ...(item.newItem && {
            NewImage: marshaller.marshallItem(item.newItem) as any,
          }),
          ...(item.oldItem && {
            OldImage: marshaller.marshallItem(item.oldItem) as any,
          }),
          SequenceNumber: (index + 1).toString(),
          StreamViewType: streamViewType as any,
          SizeBytes: 1,
        },
        eventSource: 'aws:dynamodb',
        awsRegion,
        eventSourceARN: 'n/a',
      };
    }),
  };
  return evt;
};
