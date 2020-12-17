import '@aws-sdk/client-sqs';

export const deleteMessage = jest.fn();
export const deleteMessageImplementation = () => Promise.resolve({});

deleteMessage.mockImplementation(deleteMessageImplementation);

// Intercepts the SQS() constructor with this function.
jest.mock('@aws-sdk/client-sqs', () => {
  return {
    SQS: jest.fn().mockImplementation(() => {
      return { deleteMessage };
    }),
  };
});
