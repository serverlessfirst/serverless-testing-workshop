import log from '@dazn/lambda-powertools-logger';
import { AWS_REGION, ddbConfig } from '@svc/config';
import {
  Club, ClubVisibility, User, PagedList, PagedQueryOptions, ClubMember, MemberRole,
} from '@svc/lib/types/sports-club-manager';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { executeTransactWrite } from '@svc/lib/ddb-utils';
import _omit from 'lodash/omit';

const ddb = new DocumentClient({ region: AWS_REGION });

export const putClub = async (club: Club) => {
  await ddb.put({
    TableName: ddbConfig.clubsTable,
    Item: club,
  }).promise();
};

export const getClub = async (id: string) => {
  const response = await ddb.get({
    TableName: ddbConfig.clubsTable,
    Key: {
      id,
    },
  }).promise();
  return response.Item as (Club | undefined);
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
  await ddb.put({
    TableName: ddbConfig.membersTable,
    Item: clubMemberItem,
  }).promise();
};

export const putClubWithManager = async (club: Club, manager: User) => {
  const clubMemberItem: ClubMemberDDBItem = {
    role: MemberRole.MANAGER,
    club,
    user: manager,
    userId: manager.id,
    clubId: club.id,
  };
  return executeTransactWrite({
    TransactItems: [
      // Club entity
      {
        Put: {
          TableName: ddbConfig.clubsTable,
          Item: club,
        },
      },
      // ClubMember entity
      {
        Put: {
          TableName: ddbConfig.membersTable,
          Item: clubMemberItem,
        },
      },
    ],
  }, ddb);
};

/**
 * Delete club and all its members.
 */
export const deleteClub = async (id: string) => {
  log.debug('Deleting club...', { id });
  const response = await ddb.query({
    TableName: ddbConfig.membersTable,
    KeyConditionExpression: 'clubId = :clubId',
    ExpressionAttributeValues: {
      ':clubId': id,
    },
  }).promise();
  await executeTransactWrite({
    TransactItems: [{
      Delete: {
        TableName: ddbConfig.clubsTable,
        Key: { id },
      },
    },
    ...(response.Items || [] as ClubMemberDDBItem[]).map((member) => {
      return {
        Delete: {
          TableName: ddbConfig.membersTable,
          Key: { clubId: member.clubId, userId: member.userId },
        },
      };
    }),
    ],
  }, ddb);
  log.info('Deleted club', { id });
};

export const listClubsByVisibility = async (
  visibility: ClubVisibility, queryOptions: PagedQueryOptions = {},
): Promise<PagedList<Club>> => {
  const response = await ddb.query({
    TableName: ddbConfig.clubsTable,
    IndexName: 'ClubsByVisibility',
    KeyConditionExpression: 'visibility = :visibility',
    ExpressionAttributeValues: {
      ':visibility': visibility,
    },
    Limit: queryOptions.limit,
    ...(queryOptions.lastEvaluatedKey && {
      ExclusiveStartKey: {
        id: queryOptions.lastEvaluatedKey,
        visibility,
      },
    }),
  }).promise();
  return {
    lastEvaluatedKey: response.LastEvaluatedKey?.id,
    items: response.Items as Club[],
  };
};

export const listClubsForManager = async (managerId: string): Promise<Club[]> => {
  const response = await ddb.query({
    TableName: ddbConfig.clubsTable,
    IndexName: 'ClubsByManager',
    KeyConditionExpression: 'managerId = :managerId',
    ExpressionAttributeValues: {
      ':managerId': managerId,
    },
  }).promise();
  return response.Items as Club[];
};

export const getClubMember = async (clubId: string, userId: string) => {
  const response = await ddb.get({
    TableName: ddbConfig.membersTable,
    Key: { clubId, userId },
  }).promise();
  return response.Item ? _omit(response.Item, ['clubId', 'userId']) as ClubMember : undefined;
};

export const setClubProfilePhotoPath = async (clubId: string, path: string) => {
  const response = await ddb.update({
    TableName: ddbConfig.clubsTable,
    Key: { id: clubId },
    UpdateExpression: 'SET profilePhotoUrlPath = :profilePhotoUrlPath',
    ExpressionAttributeValues: {
      ':profilePhotoUrlPath': path,
    },
    ConditionExpression: 'attribute_exists(id)',
  }).promise();
  return response;
};
