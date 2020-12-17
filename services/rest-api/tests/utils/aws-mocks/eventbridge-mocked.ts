import '@aws-sdk/client-eventbridge';

export const putEvents = jest.fn();
export const putEventsImplementation = () => Promise.resolve({ FailedEntryCount: 0, Entries: [] });

putEvents.mockImplementation(putEventsImplementation);

// Intercepts the EventBridge() constructor with this function.
jest.mock('@aws-sdk/client-eventbridge', () => {
  return {
    EventBridge: jest.fn().mockImplementation(() => {
      return { putEvents };
    }),
  };
});
