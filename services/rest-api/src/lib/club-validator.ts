import { Club } from './types/sports-club-manager';

export const validateClub = (club: Club) => !!club.name && club.name.length > 2 && club.name.length <= 64;
