import 'aws-sdk/clients/sqs';

export const deleteMessage = jest.fn();
export const deleteMessageImplementation = () => {
  return {
    promise: () => Promise.resolve({}),
  };
};

deleteMessage.mockImplementation(deleteMessageImplementation);

// Intercepts the SQS() constructor with this function.
jest.mock('aws-sdk/clients/sqs', () => jest.fn(() => {
  return { deleteMessage };
}));
