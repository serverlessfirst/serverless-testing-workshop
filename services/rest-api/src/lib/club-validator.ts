import { Club } from './types/sports-club-manager';

const isAlphanumericOrSpace = (s: string) => /^[a-z0-9\s]+$/i.test(s);

export const validateClub = (club: Club) =>
  !!club.name
  && club.name.length > 2
  && club.name.length <= 64
  && isAlphanumericOrSpace(club.name);
