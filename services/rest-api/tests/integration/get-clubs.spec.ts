import { get as handler } from '@svc/handlers/http/clubs';
import { Club, ClubVisibility, PagedList } from '@svc/lib/types/sports-club-manager';
import _ from 'lodash';
import { putClub, deleteClub } from '@svc/lib/repos/clubs-repo';
import { ApiGatewayHandlerInvoker } from '@tests/utils/handler-invokers/api-gateway-handler-invoker';
import { apiGatewayConfig } from '@svc/config';

const apiInvoker = new ApiGatewayHandlerInvoker({
  baseUrl: apiGatewayConfig.getBaseUrl(),
  handler,
});

describe.skip('`GET /clubs`', () => {
  const publicClubs: Club[] = _.times(3, (i) => {
    return {
      id: `5fa826e4-5078-4f0c-a0a1-d3b7aa6ddae${i}`,
      name: `PublicClub-${i}`,
      sport: 'Soccer',
      visibility: ClubVisibility.PUBLIC,
      managerId: '123456789',
    };
  });
  const privateClubs: Club[] = _.times(3, (i) => {
    return {
      id: `b9988a5e-cb11-413e-881a-b66822173c6${i}`,
      name: `PrivateClub-${i}`,
      sport: 'Soccer',
      visibility: ClubVisibility.PRIVATE,
      managerId: '123456789',
    };
  });

  const createTestClubs = async () => {
    await Promise.all([...publicClubs, ...privateClubs].map((async c => putClub(c))));
  };

  const deleteTestClubs = async () => {
    await Promise.all([...publicClubs, ...privateClubs].map((async c => deleteClub(c.id))));
  };

  it('only returns clubs with visibility=PUBLIC', async () => {
    await createTestClubs();

    const response = await apiInvoker.invoke({
      event: {
        pathTemplate: '/clubs',
        httpMethod: 'GET',
      },
    });
    expect(response.statusCode).toEqual(200);

    const result = response.body as PagedList<Club>;
    expect(result.items.length).toEqual(publicClubs.length);
    result.items.forEach((c: Club) => {
      expect(c.visibility).toEqual(ClubVisibility.PUBLIC);
    });
  });

  it('returns an empty array when no clubs are in the database', async () => {
    await deleteTestClubs();

    const response = await apiInvoker.invoke({
      event: {
        pathTemplate: '/clubs',
        httpMethod: 'GET',
      },
    });
    expect(response.statusCode).toEqual(200);

    const result = response.body as PagedList<Club>;
    expect(result.items.length).toEqual(0);
  });

  it('restricts amount of returned items and sets `lastEvaluatedKey` field whenever the `limit` query string parameter is supplied', async () => {
    await createTestClubs();
    const limit = 2;
    const event = {
      pathTemplate: '/clubs',
      httpMethod: 'GET',
      queryStringParameters: {
        limit: limit.toString(),
      },
    };

    const response = await apiInvoker.invoke({ event });
    expect(response.statusCode).toEqual(200);

    const result = response.body as PagedList<Club>;
    expect(result.items.length).toEqual(limit);
    expect(result.lastEvaluatedKey).toBeTruthy();
  });

  it('returns next page of results whenever the `lastEvaluatedKey` query string parameter is supplied', async () => {
    await createTestClubs();
    const limit = 2;
    const event1 = {
      pathTemplate: '/clubs',
      httpMethod: 'GET',
      queryStringParameters: {
        limit: limit.toString(),
      },
    };
    // get 1st page
    const response1 = await apiInvoker.invoke({ event: event1 });
    expect(response1.statusCode).toEqual(200);
    const page1 = response1.body as PagedList<Club>;

    // get 2nd page
    const event2 = {
      pathTemplate: '/clubs',
      httpMethod: 'GET',
      queryStringParameters: {
        limit: limit.toString(),
        lastEvaluatedKey: page1.lastEvaluatedKey!,
      },
    };
    const response2 = await apiInvoker.invoke({ event: event2 });
    expect(response2.statusCode).toEqual(200);
    const page2 = response2.body as PagedList<Club>;

    // verify that 2nd page only has 1 item in it
    expect(page2.items.length).toEqual(1);
    expect(page2.items[0].id).toEqual(publicClubs[2].id);
    expect(page2.lastEvaluatedKey).toBeUndefined();
  });

  afterAll(async () => {
    await deleteTestClubs();
  });
});
