import EventBridge, { PutEventsResponse } from 'aws-sdk/clients/eventbridge';
import log from '@dazn/lambda-powertools-logger';
import { eventBridgeConfig, AWS_REGION } from '@svc/config';
import { EventDetailType, PublishableEventDetail } from '@svc/lib/types/sports-club-manager';

export const ebClient = new EventBridge({ region: AWS_REGION });

const { serviceBusName, defaultSource } = eventBridgeConfig;

/**
 * Light wrapper around eventbridge.putEvents SDK call to populate some default fields
 * and enforce type of event detail.
 */
export const publishEvents = async (
  events: PublishableEventDetail[], detailType: EventDetailType, source = defaultSource,
) => {
  const publishRequest: EventBridge.Types.PutEventsRequest = {
    Entries: events.map((e) => {
      return {
        EventBusName: serviceBusName,
        Source: source,
        DetailType: detailType,
        Detail: JSON.stringify(e),
      };
    }),
  };
  let result: PutEventsResponse;
  try {
    result = await ebClient.putEvents(publishRequest).promise();
  } catch (error) {
    log.error('Error publishing events to EventBridge', { publishRequest }, error);
    throw error;
  }
  if (result.FailedEntryCount) {
    log.error('Error publishing one or more events to EventBridge', { publishRequest, result });
    throw new Error('Error publishing one or more events to EventBridge');
  }
  log.debug('Published events to EventBridge', { publishRequest, result });
  return result;
};

export const publishEvent = async (
  event: PublishableEventDetail, detailType: EventDetailType, source = defaultSource,
) => publishEvents([event], detailType, source);
