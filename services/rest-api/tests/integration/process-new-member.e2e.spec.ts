
import {
  Club, ClubVisibility, MemberRole, User, ClubMember,
} from '@svc/lib/types/sports-club-manager';
import uuid from '@svc/lib/uuid';
import { generateTestUser } from '@tests/utils/test-data-generator';

const getTestClubMember = (userId: string) => {
  const club: Club = {
    id: uuid(),
    name: 'My test club',
    sport: 'Soccer',
    managerId: uuid(),
    visibility: ClubVisibility.PRIVATE,
  };
  const user: User = {
    id: userId,
    ...generateTestUser(userId),
  };
  const member: ClubMember = {
    role: MemberRole.PLAYER,
    club,
    user,
  };
  return member;
};

describe('`ddbProcessNewMember` Lambda function', () => {
  describe('[e2e]', () => {
    it.todo('is triggered by a DynamoDB write and then publishes correct event to EventBridge');
  });
});
