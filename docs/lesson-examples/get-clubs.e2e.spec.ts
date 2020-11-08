import { apiGatewayConfig } from '@svc/config';
import Axios from 'axios';
import { Club, ClubVisibility, PagedList } from '@svc/lib/types/sports-club-manager';
import _ from 'lodash';
import { putClub, deleteClub } from '@svc/lib/repos/clubs-repo';

const apiClient = Axios.create({ baseURL: apiGatewayConfig.getBaseUrl() });

describe('GET /clubs e2e tests', () => {
  const publicClubs: Club[] = _.times(2, (i) => {
    return {
      id: `5fa826e4-5078-4f0c-a0a1-d3b7aa6ddae${i}`,
      name: `PublicClub-${i}`,
      sport: 'Soccer',
      visibility: ClubVisibility.PUBLIC,
    };
  });

  const createTestClubs = async () => {
    await Promise.all(publicClubs.map((async c => putClub(c))));
  };

  const deleteTestClubs = async () => {
    await Promise.all(publicClubs.map((async c => deleteClub(c.id))));
  };

  it('returns list of all public clubs in database', async () => {
    // Arrange
    await createTestClubs();

    // Act
    const response = await apiClient({
      method: 'GET',
      url: '/clubs',
    });

    // Assert
    expect(response.status).toEqual(200);
    const result = response.data as PagedList<Club>;
    expect(result.items.length).toEqual(publicClubs.length);
  });

  afterAll(async () => {
    await deleteTestClubs();
  });
});
