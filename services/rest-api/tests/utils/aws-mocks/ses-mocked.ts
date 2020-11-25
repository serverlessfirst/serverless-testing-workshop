import uuid from '@svc/lib/uuid';
import 'aws-sdk/clients/ses';

export const sendEmail = jest.fn();
export const sendEmailImplementation = () => {
  return {
    promise: () => Promise.resolve({ MessageId: uuid() }),
  };
};

sendEmail.mockImplementation(sendEmailImplementation);

// Intercepts the SES() constructor with this function.
jest.mock('aws-sdk/clients/ses', () => jest.fn(() => {
  return { sendEmail };
}));
