import log from '@dazn/lambda-powertools-logger';
import { AWS_REGION, ddbConfig } from '@svc/config';
import {
  Club, ClubVisibility, User, PagedList, PagedQueryOptions, ClubMember, MemberRole,
} from '@svc/lib/types/sports-club-manager';
import { DynamoDB, QueryCommandOutput } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import _omit from 'lodash/omit';

const ddb = new DynamoDB({ region: AWS_REGION });

const unmarshallQueryItems = <T extends unknown>(items: QueryCommandOutput['Items']) =>
  (items || []).map(i => unmarshall(i) as T);

export const putClub = async (club: Club) => {
  await ddb.putItem({
    TableName: ddbConfig.clubsTable,
    Item: marshall(club as any),
  });
};

export const getClub = async (clubId: string) => {
  const response = await ddb.getItem({
    TableName: ddbConfig.clubsTable,
    Key: marshall({
      id: clubId,
    }),
  });
  return response.Item ? unmarshall(response.Item) as any as Club : undefined;
};

export interface ClubMemberDDBItem extends ClubMember {
  // Need to store these at top-level in DDB items as they're used in GSI
  userId: string;
  clubId: string;
}

export const putClubMember = async (club: Club, member: User) => {
  const clubMemberItem: ClubMemberDDBItem = {
    role: MemberRole.MANAGER,
    club,
    user: member,
    userId: member.id,
    clubId: club.id,
  };
  await ddb.putItem({
    TableName: ddbConfig.membersTable,
    Item: marshall(clubMemberItem as any),
  });
};

export const putClubWithManager = async (club: Club, manager: User) => {
  const clubMemberItem: ClubMemberDDBItem = {
    role: MemberRole.MANAGER,
    club,
    user: manager,
    userId: manager.id,
    clubId: club.id,
  };

  return ddb.transactWriteItems({
    TransactItems: [
      // Club entity
      {
        Put: {
          TableName: ddbConfig.clubsTable,
          Item: marshall(club as any),
        },
      },
      // ClubMember entity
      {
        Put: {
          TableName: ddbConfig.membersTable,
          Item: marshall(clubMemberItem as any),
        },
      },
    ],
  });
};

/**
 * Delete club and all its members.
 */
export const deleteClub = async (id: string) => {
  log.debug('Deleting club...', { id });
  const response = await ddb.query({
    TableName: ddbConfig.membersTable,
    KeyConditionExpression: 'clubId = :clubId',
    ExpressionAttributeValues: marshall({
      ':clubId': id,
    }),
  });
  await ddb.transactWriteItems({
    TransactItems: [{
      Delete: {
        TableName: ddbConfig.clubsTable,
        Key: marshall({ id }),
      },
    },
    ...(response.Items || []).map((item) => {
      const member = unmarshall(item) as any as ClubMemberDDBItem;
      return {
        Delete: {
          TableName: ddbConfig.membersTable,
          Key: marshall({ clubId: member.clubId, userId: member.userId }),
        },
      };
    }),
    ],
  });
  log.info('Deleted club', { id });
};

export const listClubsByVisibility = async (
  visibility: ClubVisibility, queryOptions: PagedQueryOptions = {},
): Promise<PagedList<Club>> => {
  const response = await ddb.query({
    TableName: ddbConfig.clubsTable,
    IndexName: 'ClubsByVisibility',
    KeyConditionExpression: 'visibility = :visibility',
    ExpressionAttributeValues: marshall({
      ':visibility': visibility,
    } as any),
    Limit: queryOptions.limit,
    ...(queryOptions.lastEvaluatedKey && {
      ExclusiveStartKey: marshall({
        id: queryOptions.lastEvaluatedKey,
        visibility,
      }),
    }),
  });
  return {
    lastEvaluatedKey: response.LastEvaluatedKey ? unmarshall(response.LastEvaluatedKey).id as string : undefined,
    items: unmarshallQueryItems<Club>(response.Items),
  };
};

export const listClubsForManager = async (managerId: string): Promise<Club[]> => {
  const response = await ddb.query({
    TableName: ddbConfig.clubsTable,
    IndexName: 'ClubsByManager',
    KeyConditionExpression: 'managerId = :managerId',
    ExpressionAttributeValues: marshall({
      ':managerId': managerId,
    }),
  });
  return unmarshallQueryItems<Club>(response.Items);
};

export const getClubMember = async (clubId: string, userId: string) => {
  const response = await ddb.getItem({
    TableName: ddbConfig.membersTable,
    Key: marshall({ clubId, userId }),
  });
  return response.Item ? _omit(unmarshall(response.Item), ['clubId', 'userId']) as any as ClubMember : undefined;
};

export const setClubProfilePhotoPath = async (clubId: string, path: string) => {
  const response = await ddb.updateItem({
    TableName: ddbConfig.clubsTable,
    Key: marshall({ id: clubId }),
    UpdateExpression: 'SET profilePhotoUrlPath = :profilePhotoUrlPath',
    ExpressionAttributeValues: marshall({
      ':profilePhotoUrlPath': path,
    }),
    ConditionExpression: 'attribute_exists(id)',
  });
  return response;
};
