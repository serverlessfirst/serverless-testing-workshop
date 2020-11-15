import log from '@dazn/lambda-powertools-logger';
import { EventBridgeHandler } from 'aws-lambda';
import { MemberJoinedClubEvent, EventDetailType } from '@svc/lib/types/sports-club-manager';
import { queueEmail } from '@svc/lib/email/email-queuer';
import { SendEmailRequest } from '@svc/lib/email/types';
import { emailConfig } from '@svc/config';

export const handler:
EventBridgeHandler<EventDetailType.MEMBER_JOINED_CLUB, MemberJoinedClubEvent, any> = async (event) => {
  log.debug('received event', { event });
  const { member } = event.detail;

  const email: SendEmailRequest = {
    fromAddress: emailConfig.defaultFromEmailAddress,
    destination: {
      ToAddresses: [member.user.email],
    },
    message: {
      Subject: {
        Data: `Welcome to ${member.club.name}!`,
      },
      Body: {
        Html: {
          Data: `You have joined the club ${member.club.name}.`,
        },
      },
    },
  };
  await queueEmail(email);
};
