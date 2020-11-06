import { AWS_REGION, ddbConfig } from '@svc/config';
import {
  Club, ClubVisibility, PagedList, PagedQueryOptions,
} from '@svc/lib/types/sports-club-manager';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

const ddb = new DocumentClient({ region: AWS_REGION });

export const putClub = async (club: Club) => {
  await ddb.put({
    TableName: ddbConfig.clubsTable,
    Item: club,
  }).promise();
};

export const deleteClub = async (id: string) => {
  await ddb.delete({
    TableName: ddbConfig.clubsTable,
    Key: {
      id,
    },
  }).promise();
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
