import { get as handler } from '@svc/handlers/http/clubs';
import { Club, ClubVisibility, PagedList } from '@svc/lib/types/sports-club-manager';
import _ from 'lodash';
import { putClub, deleteClub } from '@svc/lib/repos/clubs-repo';

describe('GET /clubs integration tests', () => {
  const publicClubs: Club[] = _.times(3, (i) => {
    return {
      id: `5fa826e4-5078-4f0c-a0a1-d3b7aa6ddae${i}`,
      name: `PublicClub-${i}`,
      sport: 'Soccer',
      visibility: ClubVisibility.PUBLIC,
    };
  });
  const privateClubs: Club[] = _.times(3, (i) => {
    return {
      id: `b9988a5e-cb11-413e-881a-b66822173c6${i}`,
      name: `PrivateClub-${i}`,
      sport: 'Soccer',
      visibility: ClubVisibility.PRIVATE,
    };
  });

  const createTestClubs = async () => {
    await Promise.all([...publicClubs, ...privateClubs].map((async c => putClub(c))));
  };

  const deleteTestClubs = async () => {
    await Promise.all([...publicClubs, ...privateClubs].map((async c => deleteClub(c.id))));
  };

  it('only returns clubs with visibility=PUBLIC', async () => {
    // Arrange: create 3 public and 3 private clubs in DDB
    await createTestClubs();

    // Act: invoke handler
    const response = await handler({});

    // Assert: check 3 results are returned and that each item has visibility=Public
    const result = JSON.parse(response.body) as PagedList<Club>;
    expect(result.items.length).toEqual(publicClubs.length);
    result.items.forEach((c: Club) => {
      expect(c.visibility).toEqual(ClubVisibility.PUBLIC);
    });
  });

  it('returns an empty array when no clubs are in the database', async () => {
    await deleteTestClubs();

    const response = await handler({});

    const result = JSON.parse(response.body) as PagedList<Club>;
    expect(result.items.length).toEqual(0);
  });

  it('restricts amount of returned items and sets `lastEvaluatedKey` field whenever the `limit` query string parameter is supplied', async () => {
    await createTestClubs();

    const event = {
      queryStringParameters: {
        limit: 2,
      },
    };
    const response = await handler(event);

    const result = JSON.parse(response.body) as PagedList<Club>;
    expect(result.items.length).toEqual(event.queryStringParameters.limit);
    expect(result.lastEvaluatedKey).toBeTruthy();
  });

  it('returns next page of results whenever the `lastEvaluatedKey` query string parameter is supplied', async () => {
    await createTestClubs();

    const event1 = {
      queryStringParameters: {
        limit: 2,
      },
    };
    // get 1st page
    const response1 = await handler(event1);
    const page1 = JSON.parse(response1.body) as PagedList<Club>;

    // get 2nd page
    const event2 = {
      queryStringParameters: {
        limit: 2,
        lastEvaluatedKey: page1.lastEvaluatedKey,
      },
    };
    const response2 = await handler(event2);
    const page2 = JSON.parse(response2.body) as PagedList<Club>;

    // verify that 2nd page only has 1 item in it
    expect(page2.items.length).toEqual(1);
    expect(page2.items[0].id).toEqual(publicClubs[2].id);
    expect(page2.lastEvaluatedKey).toBeUndefined();
  });

  afterAll(async () => {
    await deleteTestClubs();
  });
});
