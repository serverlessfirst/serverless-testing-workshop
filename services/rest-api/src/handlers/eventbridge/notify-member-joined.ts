import log from '@dazn/lambda-powertools-logger';
import { EventBridgeHandler } from 'aws-lambda';
import { MemberJoinedClubEvent, EventDetailType } from '@svc/lib/types/sports-club-manager';
import { getClubMember } from '@svc/lib/repos/clubs-repo';
import { SendEmailRequest } from '@svc/lib/email/types';
import { emailConfig } from '@svc/config';
import { queueEmail } from '@svc/lib/email/email-queuer';

export const handler: EventBridgeHandler<EventDetailType.MEMBER_JOINED_CLUB,
MemberJoinedClubEvent, any> = async (event) => {
  log.debug('received event', { event });
  const msg = event.detail;

  //  fetch the email address of the manager of the club this member has joined from DDB
  const manager = await getClubMember(msg.member.club.id, msg.member.club.managerId);
  if (!manager) {
    log.warn('No manager found for members club so no email will be sent', { event });
    return null;
  }
  log.debug('Manager found', { manager });
  const email: SendEmailRequest = {
    fromAddress: emailConfig.defaultFromEmailAddress,
    destination: {
      ToAddresses: [manager.user.email],
    },
    message: {
      Subject: {
        Data: `A new player has joined your club: ${msg.member.user.email}!`,
      },
      Body: {
        Html: {
          Data: `${msg.member.user.name || msg.member.user.email} has joined your club ${msg.member.club.name}.`,
        },
      },
    },
  };
  await queueEmail(email);
  log.info(`[${event.id}] Email message queued for manager`);
  return manager;
};
