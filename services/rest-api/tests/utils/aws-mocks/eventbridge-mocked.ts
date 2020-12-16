import '@aws-sdk/client-eventbridge';

export const putEvents = jest.fn();
export const putEventsImplementation = () => {
  return {
    promise: () => Promise.resolve({ FailedEntryCount: 0, Entries: [] }),
  };
};

putEvents.mockImplementation(putEventsImplementation);

// Intercepts the EventBridge() constructor with this function.
jest.mock('@aws-sdk/client-eventbridge', () => jest.fn(() => {
  return { putEvents };
}));
