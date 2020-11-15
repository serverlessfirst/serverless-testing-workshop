import { Destination, Message } from 'aws-sdk/clients/ses';

export interface SendEmailRequest {
  fromAddress: string;
  destination: Destination;
  message: Message;
  template?: string;
}
