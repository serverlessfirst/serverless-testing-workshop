import { Destination, Message } from '@aws-sdk/client-ses';

export interface SendEmailRequest {
  fromAddress: string;
  destination: Destination;
  message: Message;
  template?: string;
}
