import { validateClub } from '@svc/lib/club-validator';
import { ClubVisibility } from '@svc/lib/types/sports-club-manager';
import { v4 as uuidv4 } from 'uuid';

describe('club-validator', () => {
  it('rejects club names that are shorter than 3 characters', () => {
    const club = {
      id: uuidv4(),
      name: 'MU',
      sport: 'Soccer',
      visibility: ClubVisibility.PRIVATE,
      managerId: '123456789',
    };
    const result = validateClub(club);
    expect(result).toBe(false);
  });

  it('rejects club names that are longer than 64 characters', () => {
    const club = {
      id: uuidv4(),
      name: '12345678901234567890123456789012345678901234567890123456789012345',
      sport: 'Soccer',
      visibility: ClubVisibility.PRIVATE,
      managerId: '123456789',
    };
    const result = validateClub(club);
    expect(result).toBe(false);
  });

  it('rejects club names that contain non-alphanumeric characters (e.g. emojis)', () => {
    const club = {
      id: uuidv4(),
      name: 'F⚽️⚽️tball',
      sport: 'Soccer',
      visibility: ClubVisibility.PRIVATE,
      managerId: '123456789',
    };
    const result = validateClub(club);
    expect(result).toBe(false);
  });

  it('allows names of correct length that contain alphanumeric characters and space', () => {
    const club = {
      id: uuidv4(),
      name: 'Manchester United',
      sport: 'Soccer',
      visibility: ClubVisibility.PRIVATE,
      managerId: '123456789',
    };
    const result = validateClub(club);
    expect(result).toBe(true);
  });
});
