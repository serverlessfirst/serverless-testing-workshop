import uuid from '@svc/lib/uuid';
import '@aws-sdk/client-ses';

export const sendEmail = jest.fn();
export const sendEmailImplementation = () => Promise.resolve({ MessageId: uuid() });

sendEmail.mockImplementation(sendEmailImplementation);

// Intercepts the SES() constructor with this function.
jest.mock('@aws-sdk/client-ses', () => {
  return {
    SES: jest.fn().mockImplementation(() => {
      return { sendEmail };
    }),
  };
});
